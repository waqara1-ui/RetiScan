"use client"

import { ResultsView } from "@/components/results-view"
import { useEffect, useMemo, useState } from "react"
import type { AnalysisResult } from "@/components/results-view"

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x))
}

function titleCase(s: string) {
  return s
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}

export default function ResultsPage() {
  const [raw, setRaw] = useState<any>(null)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("retinaAnalysis")
      if (stored) setRaw(JSON.parse(stored))
    } catch {
      // ignore
    }
  }, [])

  const data: AnalysisResult | null = useMemo(() => {
    if (!raw) return null

    // If you ever still have the old GPT format saved, just pass it through:
    if (raw.riskCards || raw.findings) return raw as AnalysisResult

    // New local-ML format:
    const labelRaw = (raw?.prediction?.label ?? "unknown").toString().toLowerCase()
    const confidence = typeof raw?.prediction?.confidence === "number" ? raw.prediction.confidence : 0
    const probs: number[] = Array.isArray(raw?.prediction?.probabilities) ? raw.prediction.probabilities : []

    // Map DR severity to a "risk score" out of 100 (simple, explainable heuristic)
    // If your classes are [no_dr, moderate, severe, proliferative, mild] or different order,
    // this is still just a UI score. The real output is the label + probabilities.
    const score = Math.round(clamp01(confidence) * 100)

    // Option A (real):
    const drCard = {
      title: "Diabetic Retinopathy",
      status: titleCase(labelRaw.replaceAll("_", " ")), // "moderate" -> "Moderate"
      score,
      description:
        "Screening result from a pretrained model. This app currently reports diabetic retinopathy severity only.",
      // Optional: attach probabilities for your ResultsView to render as bars (we’ll add tiny support below)
      probabilities: probs,
      probabilityLabels: raw?.prediction?.labels ?? [],
      isComingSoon: false,
    }

    // Option B (coming soon):
    const comingSoon = (title: string) => ({
      title,
      status: "Coming soon",
      score: 0,
      description:
        "Planned feature. This is not computed in the current version. We’ll add models + datasets later.",
      isComingSoon: true,
    })

    const riskCards = [
      drCard,
      comingSoon("Hypertensive Retinopathy"),
      comingSoon("Glaucoma"),
      comingSoon("Age-Related Macular Degeneration"),
    ]

    const findings = [
      {
        title: "Diabetic Retinopathy Screening Result",
        severity: titleCase(labelRaw.replaceAll("_", " ")),
        confidence: Math.round(clamp01(confidence) * 100),
        details:
          "This finding reflects the model’s predicted severity category for diabetic retinopathy. It does not localize lesions (e.g., microaneurysms).",
        recommendation:
          "Screening only. If you have symptoms or concerns, consult an eye-care professional for a dilated eye exam.",
      },
    ]

    const summary = {
      findingsCount: 1,
      abnormalCount: ["moderate", "severe", "proliferative"].includes(labelRaw) ? 1 : 0,
      analysisTimeSeconds: raw?.summary?.analysisTimeSeconds ?? 0,
    }

    return {
      imageUrl: raw?.imageUrl,
      riskCards,
      findings,
      summary,
    } as unknown as AnalysisResult
  }, [raw])

  return (
    <ResultsView
      findings={data?.findings}
      riskCards={data?.riskCards}
      imageUrl={data?.imageUrl}
      summary={data?.summary}
    />
  )
}