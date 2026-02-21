"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Upload,
  Eye,
  ArrowLeft,
  X,
  ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type ScanState = "idle" | "preview" | "analyzing" | "complete"

interface AnalysisStage {
  label: string
  done: boolean
}

export function ScanInterface() {
  const [state, setState] = useState<ScanState>("idle")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [stages, setStages] = useState<AnalysisStage[]>([])
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisSummary, setAnalysisSummary] = useState<{
    findingsCount: number
    abnormalCount: number
    analysisTimeSeconds: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setSelectedFile(file)
    setState("preview")
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const loadSampleImage = useCallback(() => {
    sessionStorage.removeItem("retinaAnalysis")
    setImageUrl("/images/retina-sample.jpg")
    setSelectedFile(null)
    setState("preview")
  }, [])

  const resetScan = useCallback(() => {
    if (imageUrl && imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl)
    }
    sessionStorage.removeItem("retinaAnalysis")
    setImageUrl(null)
    setSelectedFile(null)
    setState("idle")
    setStages([])
    setAnalysisError(null)
    setAnalysisSummary(null)
  }, [imageUrl])

  const runAnalysis = useCallback(async () => {
    if (!imageUrl) return
    sessionStorage.removeItem("retinaAnalysis")
    setState("analyzing")
    setAnalysisError(null)
    const analysisStages = [
      "Loading RETFound model...",
      "Converting image for analysis...",
      "Running diabetic retinopathy screening...",
      "Generating risk assessment...",
      "Complete",
    ]
    setStages(analysisStages.map((label) => ({ label, done: false })))

    const animateStages = () => {
      analysisStages.forEach((_, index) => {
        setTimeout(() => {
          setStages((prev) =>
            prev.map((s, i) => (i <= index ? { ...s, done: true } : s))
          )
        }, (index + 1) * 800)
      })
    }
    animateStages()

    const startTime = Date.now()
    try {
      let imageBlob: Blob
      if (selectedFile) {
        imageBlob = selectedFile
      } else {
        const res = await fetch(imageUrl)
        imageBlob = await res.blob()
      }

      const formData = new FormData()
      formData.append("image", imageBlob)

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        const msg =
          data?.error || data?.detail || `Analysis failed (${res.status})`
        setAnalysisError(msg)
        setState("preview")
        return
      }

      const elapsed = (Date.now() - startTime) / 1000
      // Store image as data URL so it survives navigation (blob URLs can fail on results page)
      const imageUrlToStore = await new Promise<string>((resolve) => {
        if (imageUrl.startsWith("blob:") && imageBlob) {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string) ?? imageUrl)
          reader.onerror = () => resolve(imageUrl)
          reader.readAsDataURL(imageBlob)
        } else {
          resolve(imageUrl)
        }
      })
      const stored = {
        findings: data.findings,
        riskCards: data.riskCards,
        summary: { ...data.summary, analysisTimeSeconds: elapsed },
        imageUrl: imageUrlToStore,
        timestamp: Date.now(),
      }
      sessionStorage.setItem("retinaAnalysis", JSON.stringify(stored))
      setAnalysisSummary({
        findingsCount: data.findings?.length ?? 0,
        abnormalCount: data.summary?.abnormalCount ?? 0,
        analysisTimeSeconds: elapsed,
      })
      setState("complete")
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : "Network or server error"
      )
      setState("preview")
    }
  }, [imageUrl, selectedFile])

  const goToResults = useCallback(() => {
    router.push("/results")
  }, [router])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              RetinaScan
            </span>
          </div>
          <div className="w-14" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Idle / upload state */}
          {state === "idle" && (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Upload Retinal Image
              </h1>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Upload a retinal fundus photograph for AI-powered disease
                screening
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragActive(true)
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-8 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border/60 bg-card/50 hover:border-primary/40 hover:bg-card"
                }`}
                role="button"
                tabIndex={0}
                aria-label="Upload retinal image"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    fileInputRef.current?.click()
                  }
                }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">
                  Drag and drop your retinal image
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  or click to browse -- PNG, JPG up to 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                  aria-hidden="true"
                />
              </div>

              {/* Divider */}
              <div className="mt-6 flex w-full items-center gap-4">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              {/* Sample image */}
              <button
                onClick={loadSampleImage}
                className="mt-6 flex items-center gap-3 rounded-lg border border-border/50 bg-card px-5 py-3 transition-colors hover:border-primary/30 hover:bg-card/80"
              >
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">
                  Use sample retinal image
                </span>
              </button>

              <p className="mt-8 text-center text-xs text-muted-foreground/50">
                Images are processed locally and not stored. For research
                purposes only.
              </p>
            </div>
          )}

          {/* Preview state */}
          {state === "preview" && imageUrl && (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Image Preview
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Confirm the retinal image before analysis
              </p>

              <div className="relative mt-8 w-full overflow-hidden rounded-xl border border-border/50 bg-card">
                <Image
                  src={imageUrl}
                  alt="Retinal fundus image preview"
                  width={700}
                  height={500}
                  className="w-full object-cover"
                  unoptimized={imageUrl.startsWith("blob:")}
                />
              </div>

              {analysisError && (
                <div className="mt-4 w-full rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {analysisError}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={resetScan} className="gap-2">
                  <X className="h-4 w-4" />
                  Remove
                </Button>
                <Button onClick={() => runAnalysis()} className="gap-2">
                  <Eye className="h-4 w-4" />
                  Analyze Image
                </Button>
              </div>
            </div>
          )}

          {/* Analyzing state */}
          {state === "analyzing" && imageUrl && (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Analyzing Retina
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                AI is examining your retinal image
              </p>

              {/* Image with scan overlay */}
              <div className="relative mt-8 w-full overflow-hidden rounded-xl border border-primary/30 bg-card">
                <Image
                  src={imageUrl}
                  alt="Retinal image being analyzed"
                  width={700}
                  height={500}
                  className="w-full object-cover opacity-70"
                  unoptimized={imageUrl.startsWith("blob:")}
                />
                {/* Scanning line */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="animate-scan-line absolute right-0 left-0 h-0.5 bg-primary/60 shadow-[0_0_15px_3px_rgba(100,200,255,0.3)]" />
                </div>
                {/* Center spinner */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full border border-primary/20 bg-background/70 p-4 backdrop-blur-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                </div>
              </div>

              {/* Progress stages */}
              <div className="mt-6 w-full space-y-2">
                {stages.map((stage) => (
                  <div
                    key={stage.label}
                    className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-300 ${
                      stage.done
                        ? "bg-primary/5"
                        : "bg-transparent opacity-40"
                    }`}
                  >
                    {stage.done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <div className="h-4 w-4 shrink-0 rounded-full border border-border" />
                    )}
                    <span
                      className={`text-sm ${
                        stage.done
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete state */}
          {state === "complete" && (
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
                Analysis Complete
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your retinal screening report is ready
              </p>

              {/* Summary cards */}
              <div className="mt-8 grid w-full grid-cols-3 gap-3">
                <div className="rounded-lg border border-border/50 bg-card p-4 text-center">
                  <AlertCircle className="mx-auto h-5 w-5 text-warning" />
                  <p className="mt-2 text-lg font-bold text-foreground">
                    {analysisSummary?.findingsCount ?? 1}
                  </p>
                  <p className="text-xs text-muted-foreground">Findings</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-4 text-center">
                  <Eye className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 text-lg font-bold text-foreground">
                    {analysisSummary?.abnormalCount ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Require Attention
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-4 text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-success" />
                  <p className="mt-2 text-lg font-bold text-foreground">
                    {(analysisSummary?.analysisTimeSeconds ?? 0).toFixed(1)}s
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Analysis Time
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={resetScan} className="gap-2">
                  New Scan
                </Button>
                <Button onClick={goToResults} className="gap-2">
                  View Full Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
