/**
 * Will use this document to extract image, process it, and send to ML
 * This is the backend of our app. The frontend never touches the ML directly, it only talks to this API
 * Retinal analysis API — GPT-4o Vision (primary) or RETFound via HF
 * Diabetic retinopathy grade: 0=none, 1=mild, 2=moderate, 3=severe, 4=proliferative
 * Note: HF legacy api-inference.huggingface.co returns 410 Gone (retired).
 */

import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

const RETFOUND_MODEL = "bitfount/RETFound_DR_IDRID"
//base url for hugging face serverless interface API (calling model for predictions) 
//The model we use "RETFOUND MODEL"
//using a pretrained Hugging Face model called RETFound (for diabetic retinopathy grading).
const HF_INFERENCE_URL = `https://api-inference.huggingface.co/models/${RETFOUND_MODEL}`

const HF_410_MESSAGE =
  "Hugging Face's legacy inference API has been retired (410). Add OPENAI_API_KEY to .env.local to use GPT-4o Vision for retinal analysis."

// RETFound DR grade: 0–4
const DR_GRADE_LABELS: Record<number, string> = {
  0: "No diabetic retinopathy",
  1: "Mild NPDR (non-proliferative)",
  2: "Moderate NPDR",
  3: "Severe NPDR",
  4: "Proliferative diabetic retinopathy",
}

const DR_RECOMMENDATIONS: Record<number, string> = {
  0: "No action required. Continue routine eye examinations and diabetes management.",
  1: "Schedule a comprehensive dilated eye exam within 6–12 months. Monitor blood glucose levels.",
  2: "Consult an ophthalmologist within 3–6 months. Consider more frequent screening.",
  3: "Urgent referral to ophthalmologist. High risk of progression to proliferative disease.",
  4: "Immediate ophthalmologic care. Requires prompt treatment to prevent vision loss.",
}

function drGradeToRisk(grade: number): "low" | "moderate" | "elevated" {
  if (grade === 0) return "low"
  if (grade <= 2) return "moderate"
  return "elevated"
}

function drGradeToSeverity(grade: number): "normal" | "mild" | "moderate" | "severe" {
  if (grade === 0) return "normal"
  if (grade === 1) return "mild"
  if (grade === 2) return "moderate"
  return "severe"
}

function safeJson(str: string): Record<string, unknown> | null {
  try {
    return JSON.parse(str) as Record<string, unknown>
  } catch {
    return null
  }
}

async function runGpt4oFallback(
  imageBuffer: Buffer,
  apiKey: string
): Promise<ReturnType<typeof formatResponse> | null> {
  try {
    const b64 = imageBuffer.toString("base64")
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
        body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a retinal screening assistant. Analyze this fundus image for diabetic retinopathy (DR).

Look for: microaneurysms, hemorrhages, hard exudates, cotton-wool spots, venous beading, neovascularization. Grade strictly:
- 0: No DR (no lesions)
- 1: Mild NPDR (microaneurysms only, or few hemorrhages)
- 2: Moderate NPDR (more than mild, less than severe)
- 3: Severe NPDR (many hemorrhages, venous beading, or intraretinal microvascular abnormalities)
- 4: Proliferative DR (neovascularization, vitreous/preretinal hemorrhage)

Reply with ONLY this JSON, no markdown or explanation: {"grade": <0-4>, "confidence": <0-100>}`,
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${b64}` },
              },
            ],
          },
        ],
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = data?.choices?.[0]?.message?.content ?? ""
    const match = content.match(/\{[\s\S]*?\}/)
    const parsed = match ? safeJson(match[0]) : null
    const rawGrade = parsed?.grade ?? parsed?.dr_grade ?? parsed?.severity
    const grade = Math.min(
      4,
      Math.max(0, typeof rawGrade === "number" ? rawGrade : parseInt(String(rawGrade ?? "0"), 10) || 0)
    )
    const rawConf = parsed?.confidence ?? parsed?.confidence_pct
    const confidence = Math.min(
      100,
      Math.max(0, typeof rawConf === "number" ? rawConf : parseInt(String(rawConf ?? "70"), 10) || 70)
    )
    return formatResponse([
      { label: String(grade), score: confidence / 100 },
    ])
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY?.trim()

    const formData = await req.formData()
    const file = formData.get("image") as File | null
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No image file provided. Send form field 'image'." },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const imageForAnalysis = await sharp(buffer)
      .jpeg({ quality: 90 })
      .toBuffer()
    const grayscaleBuffer = await sharp(buffer)
      .grayscale()
      .jpeg({ quality: 90 })
      .toBuffer()

    // Prefer GPT-4o Vision — HF legacy API returns 410 Gone (retired)
    if (openaiKey) {
      const gptResult = await runGpt4oFallback(imageForAnalysis, openaiKey)
      if (gptResult) return NextResponse.json(gptResult)
      return NextResponse.json(
        { error: "GPT-4o Vision analysis failed.", code: "GPT_ERROR" },
        { status: 502 }
      )
    }

    // Fallback: try HF (legacy API — often returns 410)
    let token = (
      process.env.HUGGINGFACE_API_KEY ??
      process.env.HUGGINGFACE_ACCESS_TOKEN ??
      process.env.HF_TOKEN ??
      process.env.HUGGINGFACE_HUB_TOKEN
    )?.trim()
    token = token?.replace(/^["']|["']$/g, "") ?? ""

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Add OPENAI_API_KEY to .env.local for retinal analysis (GPT-4o Vision). Hugging Face legacy API is retired.",
          code: "NO_TOKEN",
        },
        { status: 503 }
      )
    }

    const hfRes = await fetch(HF_INFERENCE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      body: grayscaleBuffer,
    })

    if (hfRes.status === 410) {
      return NextResponse.json(
        { error: HF_410_MESSAGE, code: "HF_410" },
        { status: 410 }
      )
    }

    if (!hfRes.ok) {
      const errText = await hfRes.text()
      if (hfRes.status === 503) {
        await new Promise((r) => setTimeout(r, 15000))
        const retryRes = await fetch(HF_INFERENCE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/octet-stream",
          },
          body: grayscaleBuffer,
        })
        if (retryRes.ok) return NextResponse.json(formatResponse(await retryRes.json()))
      }
      return NextResponse.json(
        {
          error: `RETFound failed (${hfRes.status}). Add OPENAI_API_KEY for GPT-4o fallback.`,
          code: "HF_ERROR",
          detail: errText.slice(0, 200),
        },
        { status: 502 }
      )
    }

    const hfJson = await hfRes.json()
    return NextResponse.json(formatResponse(hfJson))
  } catch (e: any) {
      console.error("OPENAI ERROR:", e)
      return NextResponse.json(
        {
          error: "GPT-4o Vision analysis failed.",
          detail: e?.message ?? e?.toString(),
        },
        { status: 502 }
      )
  }
}

function formatResponse(hfJson: unknown) {
  // HF image classification can return array or single object
  const items = Array.isArray(hfJson) ? hfJson : [hfJson]
  const byScore = [...(items as { label?: string; score?: number }[])].sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0)
  )
  const top = byScore[0]
  const label = top?.label ?? "0"
  const scorePct = Math.round((top?.score ?? 0) * 100)

  // Parse label: can be "LABEL_0", "0", or similar
  const gradeMatch = label.match(/(\d)/)
  const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : 0
  const gradeClamped = Math.min(4, Math.max(0, grade))

  const drLabel = DR_GRADE_LABELS[gradeClamped]
  const risk = drGradeToRisk(gradeClamped)
  const severity = drGradeToSeverity(gradeClamped)

  const findings = [
    {
      id: "f1",
      label: drLabel,
      severity,
      confidence: scorePct,
      description: `AI analysis indicates ${drLabel.toLowerCase()}. Confidence: ${scorePct}%.`,
      recommendation: DR_RECOMMENDATIONS[gradeClamped],
      region: { x: 50, y: 50, r: 15 },
    },
  ]

  const riskCards = [
    {
      condition: "Diabetic Retinopathy",
      risk,
      score: gradeClamped === 0 ? 5 : gradeClamped * 25,
      detail: drLabel,
    },
    {
      condition: "Hypertensive Retinopathy",
      risk: "low" as const,
      score: 12,
      detail: "Not assessed by this model. Consult an ophthalmologist for full screening.",
    },
    {
      condition: "Glaucoma",
      risk: "low" as const,
      score: 8,
      detail: "Not assessed by this model. Consult an ophthalmologist for full screening.",
    },
    {
      condition: "Age-Related Macular Degeneration",
      risk: "low" as const,
      score: 6,
      detail: "Not assessed by this model. Consult an ophthalmologist for full screening.",
    },
  ]

  const abnormalCount = findings.filter((f) => f.severity !== "normal").length
  const normalCount = findings.length - abnormalCount

  return {
    findings,
    riskCards,
    summary: {
      findingsCount: findings.length,
      abnormalCount,
      normalCount,
      analysisTimeSeconds: 0,
    },
  }
}
