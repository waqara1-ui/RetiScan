//this filereads stored result from ML model which are returned as JSON
//Will display risk categories, and health results
"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, AlertCircle, CheckCircle2, Info } from "lucide-react"

export type RiskCard = {
  title: string
  status: string
  score: number // 0..100 (UI only)
  description?: string
  isComingSoon?: boolean

  probabilities?: number[] // 0..1
  probabilityLabels?: string[] // display labels in correct order
}

export type Finding = {
  title: string
  severity?: string
  confidence?: number // 0..100
  details?: string
  recommendation?: string
}

export type Summary = {
  findingsCount?: number
  abnormalCount?: number
  analysisTimeSeconds?: number
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function prettySeconds(s?: number) {
  if (typeof s !== "number") return "—"
  return `${s.toFixed(1)}s`
}

// Convert labels like "no_dr" -> "No diabetic retinopathy"
function prettyLabel(raw: string) {
  const s = raw.replaceAll("_", " ").toLowerCase().trim()
  if (s === "no dr" || s === "no diabetic retinopathy" || s === "no_dr") {
    return "No diabetic retinopathy"
  }
  return s
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ")
}

// Severity mapping (best-effort)
function severityWeight(label: string): number {
  const s = label.toLowerCase()
  if (s.includes("no")) return 0
  if (s.includes("mild")) return 1
  if (s.includes("moderate")) return 2
  if (s.includes("severe")) return 3
  if (s.includes("prolifer")) return 4
  return 0
}

function severitySignalText(severityIndex: number) {
  if (severityIndex >= 75) return "High severity signal"
  if (severityIndex >= 40) return "Moderate severity signal"
  return "Low severity signal"
}

// If predicted label implies non-zero severity but severityIndex is ~0, hide it (avoids confusion)
function shouldShowSeverityIndex(predictedLabel: string, severityIndex: number) {
  const s = predictedLabel.toLowerCase()
  const predictedNonZero =
    s.includes("mild") || s.includes("moderate") || s.includes("severe") || s.includes("prolifer")
  if (predictedNonZero && severityIndex <= 5) return false
  return true
}

function consultAdvice(detected: boolean, predictedLabel: string) {
  const s = predictedLabel.toLowerCase()
  if (!detected) {
    return "If you have no symptoms and this is just a routine check, urgent follow-up is usually not necessary. If you have vision changes, diabetes, or concerns, schedule an eye exam anyway."
  }
  if (s.includes("mild")) {
    return "Consider scheduling a routine follow-up eye exam, especially if you have diabetes. This is not urgent, but it’s worth confirming with a professional."
  }
  if (s.includes("moderate")) {
    return "A follow-up with an eye-care professional is recommended. Moderate findings are often monitored and may require treatment planning depending on the clinical exam."
  }
  if (s.includes("severe") || s.includes("prolifer")) {
    return "Follow-up is strongly recommended soon. Severe/proliferative categories can be associated with higher risk of vision complications and should be evaluated by an eye-care professional."
  }
  return "Consider a follow-up eye exam to confirm the result and discuss next steps."
}

export function ResultsView({
  findings,
  riskCards,
  imageUrl,
  summary,
}: {
  findings?: Finding[]
  riskCards?: RiskCard[]
  imageUrl?: string
  summary?: Summary
}) {
  const findingsCount = summary?.findingsCount ?? findings?.length ?? 0
  const abnormalCount = summary?.abnormalCount ?? 0
  const analysisTime = prettySeconds(summary?.analysisTimeSeconds)

  const drCard = riskCards?.find((c) => c.title === "Diabetic Retinopathy")

  const probs = drCard?.probabilities ?? []
  const labels = drCard?.probabilityLabels ?? []

  // Predicted class = label with highest probability
  let predictedLabel = drCard?.status ?? "Unknown"
  let predictedConfidencePct = "N/A"
  let bestIdx = -1

  if (probs.length && labels.length === probs.length) {
    bestIdx = 0
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[bestIdx]) bestIdx = i
    }
    predictedLabel = prettyLabel(labels[bestIdx])
    predictedConfidencePct = `${(probs[bestIdx] * 100).toFixed(0)}%`
  } else {
    predictedLabel = drCard?.status ?? "Unknown"
    if (typeof drCard?.score === "number") predictedConfidencePct = `${clamp(drCard.score, 0, 100)}%`
  }

  const detected = !predictedLabel.toLowerCase().includes("no")

  const severityDisplay = detected ? predictedLabel : "No diabetic retinopathy"

  // Severity index: expected value of severity level (0..4) mapped to 0..100
  let severityIndex = 0
  if (probs.length && labels.length === probs.length) {
    let expected = 0
    for (let i = 0; i < probs.length; i++) {
      expected += probs[i] * severityWeight(labels[i])
    }
    severityIndex = Math.round((expected / 4) * 100) // 0..100
  }

  const severityText = severitySignalText(severityIndex)
  const showSeverityIndex = shouldShowSeverityIndex(predictedLabel, severityIndex)

  const advice = consultAdvice(detected, predictedLabel)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">RetinaScan</span>
          </div>

          <Link href="/scan">
            <Button variant="outline" size="sm" className="border-primary/30">
              New Scan
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Retinal Screening Report
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This version provides a screening result for{" "}
            <span className="font-medium text-foreground">diabetic retinopathy</span>{" "}
            using a pretrained model. Other conditions shown below are planned and not computed yet.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/60 bg-card/90 p-4 text-center shadow-sm">
            <AlertCircle className="mx-auto h-5 w-5 text-amber-400" />
            <p className="mt-2 text-lg font-bold text-foreground">{findingsCount}</p>
            <p className="text-xs text-muted-foreground">Findings</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/90 p-4 text-center shadow-sm">
            <Eye className="mx-auto h-5 w-5 text-sky-400" />
            <p className="mt-2 text-lg font-bold text-foreground">{abnormalCount}</p>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/90 p-4 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-400" />
            <p className="mt-2 text-lg font-bold text-foreground">{analysisTime}</p>
            <p className="text-xs text-muted-foreground">Analysis time</p>
          </div>
        </div>

        {/* Main grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Image panel */}
          <div className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Retinal Image</h2>
            <div className="mt-3 overflow-hidden rounded-xl border border-border/60">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Retinal fundus image"
                  width={900}
                  height={650}
                  className="w-full object-cover"
                  unoptimized={imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")}
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                  No image available
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              This model provides a screening classification and does not highlight lesions on the image.
            </p>
          </div>

          {/* Results panel */}
          <div className="rounded-2xl border border-border/60 bg-card/90 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Results Overview</h2>

            {/* Clear summary */}
            <div className="mt-4 rounded-2xl border border-primary/25 bg-gradient-to-br from-sky-500/15 via-background to-background p-5">
              <p className="text-xs text-muted-foreground">Condition</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              Diabetic Retinopathy
            </p>

            <p className="mt-4 text-xs text-muted-foreground">AI screening result</p>
            <p className={`mt-1 text-2xl font-extrabold tracking-tight ${detected ? "text-rose-300" : "text-emerald-300"}`}>
              {detected ? "Diabetic retinopathy detected" : "No diabetic retinopathy detected"}
            </p>

            {detected && (
          <>
            <p className="mt-4 text-xs text-muted-foreground">Severity (AI estimate)</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
            {predictedLabel}
           </p>
          </>
              )}
            </div>

            {/* What does this mean */}
            <details className="mt-4 rounded-2xl border border-border/60 bg-background/40 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-foreground">
                What does this mean?
              </summary>

              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                <p>
                  {detected
                    ? "This screening suggests signs consistent with diabetic retinopathy in this image."
                    : "This screening did not find signs consistent with diabetic retinopathy in this image."}
                </p>

                {detected && (
                <p>
                  The severity shown above (e.g., Mild/Moderate/Severe) is an AI estimate based on the image.
                </p>
                )}

              <p className="font-medium text-foreground">
                This is not a diagnosis. For a real medical decision, you should consult an eye-care professional for an exam.
              </p>
          </div>
      </details>

            {/* Severity bar (optional) */}
            {showSeverityIndex ? (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Severity signal</span>
                  <span className="text-foreground">{severityIndex}/100</span>
                </div>
                <div className="mt-2 h-2.5 w-full rounded-full bg-white/10">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400"
                    style={{ width: `${clamp(severityIndex, 0, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  This bar reflects overall severity signal (low → high). It is not “percent chance you have the disease.”
                </p>
              </div>
            ) : null}

            {/* Probability bars */}
            {probs.length && labels.length === probs.length ? (
              <div className="mt-6 space-y-2">
                <p className="text-sm font-semibold text-foreground">Class probabilities</p>
                <p className="text-xs text-muted-foreground">
                  These bars show how strongly the model matched each category. The highest bar is the predicted result.
                </p>

                {probs.map((p, i) => {
                  const pct = clamp(Math.round(p * 100), 0, 100)
                  const lbl = prettyLabel(labels[i] ?? `Class ${i}`)
                  const isTop = i === bestIdx
                  return (
                    <div key={`${lbl}-${i}`} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={isTop ? "text-foreground font-semibold" : "text-muted-foreground"}>
                          {lbl}
                          {isTop ? " (predicted)" : ""}
                        </span>
                        <span className="text-foreground">{pct}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-white/10">
                        <div
                          className={`h-2.5 rounded-full ${isTop ? "bg-emerald-400" : "bg-sky-400/60"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {/* Coming soon */}
            <div className="mt-8 space-y-3">
              {["Hypertensive Retinopathy", "Glaucoma", "Age-Related Macular Degeneration"].map((t) => (
                <div key={t} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{t}</p>
                    <span className="text-xs rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground">
                      Coming soon
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Planned feature — not computed in this version.</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-2xl border border-border/60 bg-card/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Important note</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {detected
              ? "The model detected patterns consistent with diabetic retinopathy at the severity shown above."
              : "The model did not detect patterns consistent with diabetic retinopathy in this image."}{" "}
            This is a screening demo and not medical advice. If you have symptoms or concerns, consult an eye-care
            professional for a dilated eye exam.
          </p>
        </div>
      </main>
    </div>
  )
}

export default ResultsView