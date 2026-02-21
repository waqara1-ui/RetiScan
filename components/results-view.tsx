"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  Eye,
  ArrowLeft,
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

/* ---------- Types ---------- */

interface Finding {
  id: string
  label: string
  severity: "normal" | "mild" | "moderate" | "severe"
  confidence: number
  description: string
  recommendation: string
  region: { x: number; y: number; r: number } // % of image
}

interface RiskCard {
  condition: string
  risk: "low" | "moderate" | "elevated"
  score: number
  detail: string
}

/* ---------- Mock data ---------- */

const findings: Finding[] = [
  {
    id: "f1",
    label: "Microaneurysms Detected",
    severity: "mild",
    confidence: 87,
    description:
      "2 small microaneurysms identified in the temporal region near the macula. These are early indicators of diabetic retinopathy (NPDR Stage 1).",
    recommendation:
      "Schedule a comprehensive dilated eye exam with an ophthalmologist within 6 months. Monitor blood glucose levels.",
    region: { x: 58, y: 45, r: 8 },
  },
  {
    id: "f2",
    label: "Mild Arteriolar Narrowing",
    severity: "mild",
    confidence: 74,
    description:
      "Arteriole-to-venule ratio (AVR) measured at 0.63, slightly below the normal range of 0.67-0.75. This may indicate early hypertensive changes.",
    recommendation:
      "Have blood pressure checked. If not already monitored, consult your primary care physician for a cardiovascular assessment.",
    region: { x: 35, y: 52, r: 10 },
  },
  {
    id: "f3",
    label: "Optic Disc Normal",
    severity: "normal",
    confidence: 94,
    description:
      "Cup-to-disc ratio measured at 0.3, within the normal range. Neuroretinal rim appears healthy with no signs of glaucomatous damage.",
    recommendation: "No action required. Continue routine eye examinations.",
    region: { x: 28, y: 48, r: 12 },
  },
  {
    id: "f4",
    label: "Macula Normal",
    severity: "normal",
    confidence: 91,
    description:
      "Foveal reflex is present. No exudates, edema, or drusen detected in the macular region.",
    recommendation: "No action required.",
    region: { x: 55, y: 50, r: 9 },
  },
]

const riskCards: RiskCard[] = [
  {
    condition: "Diabetic Retinopathy",
    risk: "moderate",
    score: 62,
    detail:
      "Mild NPDR (Stage 1) indicators found. Microaneurysms present in temporal region.",
  },
  {
    condition: "Hypertensive Retinopathy",
    risk: "moderate",
    score: 48,
    detail:
      "Mild arteriolar narrowing detected. AVR below normal range suggesting early hypertensive changes.",
  },
  {
    condition: "Glaucoma",
    risk: "low",
    score: 12,
    detail:
      "Cup-to-disc ratio and neuroretinal rim within normal limits. No elevated risk indicators.",
  },
  {
    condition: "Age-Related Macular Degeneration",
    risk: "low",
    score: 8,
    detail:
      "No drusen, pigmentary changes, or geographic atrophy observed in macular region.",
  },
]

/* ---------- Helpers ---------- */

function severityColor(severity: Finding["severity"]) {
  switch (severity) {
    case "severe":
      return { ring: "border-danger", text: "text-danger", bg: "bg-danger/10" }
    case "moderate":
      return {
        ring: "border-chart-5",
        text: "text-chart-5",
        bg: "bg-chart-5/10",
      }
    case "mild":
      return {
        ring: "border-warning",
        text: "text-warning",
        bg: "bg-warning/10",
      }
    default:
      return {
        ring: "border-success",
        text: "text-success",
        bg: "bg-success/10",
      }
  }
}

function riskColor(risk: RiskCard["risk"]) {
  switch (risk) {
    case "elevated":
      return { text: "text-danger", bg: "bg-danger/10", bar: "bg-danger" }
    case "moderate":
      return { text: "text-warning", bg: "bg-warning/10", bar: "bg-warning" }
    default:
      return { text: "text-success", bg: "bg-success/10", bar: "bg-success" }
  }
}

/* ---------- Component ---------- */

export function ResultsView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [expandedFinding, setExpandedFinding] = useState<string | null>(
    findings[0].id
  )

  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.src = "/images/retina-sample.jpg"
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      findings.forEach((f) => {
        const cx = (f.region.x / 100) * img.width
        const cy = (f.region.y / 100) * img.height
        const r = (f.region.r / 100) * Math.min(img.width, img.height)
        const colors = severityColor(f.severity)
        const isAbnormal = f.severity !== "normal"

        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = isAbnormal
          ? "rgba(234,179,8,0.8)"
          : "rgba(74,222,128,0.5)"
        ctx.lineWidth = isAbnormal ? 3 : 2
        if (isAbnormal) {
          ctx.setLineDash([8, 4])
        } else {
          ctx.setLineDash([])
        }
        ctx.stroke()
        ctx.setLineDash([])

        // Label
        const labelX = cx + r + 8
        const labelY = cy - 4
        ctx.font = `bold ${Math.max(12, img.width * 0.018)}px Inter, system-ui, sans-serif`
        const metrics = ctx.measureText(f.label)
        const padding = 6
        const labelHeight = 20

        ctx.fillStyle = isAbnormal
          ? "rgba(234,179,8,0.15)"
          : "rgba(74,222,128,0.12)"
        ctx.beginPath()
        ctx.roundRect(
          labelX - padding,
          labelY - labelHeight + 2,
          metrics.width + padding * 2,
          labelHeight + padding,
          4
        )
        ctx.fill()

        ctx.fillStyle = isAbnormal
          ? "rgba(234,179,8,0.95)"
          : "rgba(74,222,128,0.8)"
        ctx.fillText(f.label, labelX, labelY + 4)
      })
    }
  }, [])

  useEffect(() => {
    drawAnnotations()
  }, [drawAnnotations])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link
            href="/scan"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            New Scan
          </Link>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Screening Report
            </span>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {/* Overall summary bar */}
        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-warning" />
            <span className="text-sm font-semibold text-foreground">
              2 findings require attention
            </span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-success" />
            <span className="text-sm text-muted-foreground">
              2 areas normal
            </span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <span className="text-xs text-muted-foreground">
            Analysis completed in 8.4 seconds
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left column: annotated image */}
          <div className="lg:col-span-3">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Annotated Retinal Image
            </h2>
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
              <canvas
                ref={canvasRef}
                className="w-full"
                aria-label="Annotated retinal fundus image with disease markers highlighted"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-warning" />
                <span className="text-xs text-muted-foreground">
                  Abnormality
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-success" />
                <span className="text-xs text-muted-foreground">Normal</span>
              </div>
            </div>
          </div>

          {/* Right column: risk cards */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Disease Risk Assessment
            </h2>
            <div className="space-y-3">
              {riskCards.map((card) => {
                const colors = riskColor(card.risk)
                return (
                  <div
                    key={card.condition}
                    className="rounded-xl border border-border/50 bg-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        {card.condition}
                      </span>
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${colors.bg} ${colors.text}`}
                      >
                        {card.risk}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Risk Score
                        </span>
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {card.score}/100
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                          style={{ width: `${card.score}%` }}
                        />
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {card.detail}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Detailed findings */}
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Detailed Findings
          </h2>
          <div className="space-y-3">
            {findings.map((finding) => {
              const isExpanded = expandedFinding === finding.id
              const colors = severityColor(finding.severity)
              const isAbnormal = finding.severity !== "normal"
              return (
                <div
                  key={finding.id}
                  className={`overflow-hidden rounded-xl border bg-card transition-colors ${
                    isAbnormal ? "border-border/50" : "border-border/30"
                  }`}
                >
                  <button
                    onClick={() =>
                      setExpandedFinding(isExpanded ? null : finding.id)
                    }
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}
                    >
                      {isAbnormal ? (
                        <AlertTriangle className={`h-4 w-4 ${colors.text}`} />
                      ) : (
                        <CheckCircle2 className={`h-4 w-4 ${colors.text}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-foreground">
                        {finding.label}
                      </span>
                      <div className="mt-0.5 flex items-center gap-3">
                        <span
                          className={`text-xs font-medium capitalize ${colors.text}`}
                        >
                          {finding.severity}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {finding.confidence}% confidence
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border/30 px-5 py-4">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {finding.description}
                        </p>
                      </div>
                      <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary/5 px-4 py-3">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <div>
                          <span className="text-xs font-semibold text-primary">
                            Recommendation
                          </span>
                          <p className="mt-1 text-sm leading-relaxed text-foreground">
                            {finding.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 rounded-xl border border-border/30 bg-secondary/20 p-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Disclaimer:</strong> This
            screening is for educational and research purposes only. RetinaScan
            is not FDA-approved and does not replace professional ophthalmic
            examination. AI analysis may produce false positives or false
            negatives. Always consult a licensed ophthalmologist or healthcare
            provider for definitive diagnosis and treatment.
          </p>
        </div>
      </main>
    </div>
  )
}
