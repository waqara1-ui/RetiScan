"use client"

import { ResultsView } from "@/components/results-view"
import { useEffect, useState } from "react"
import type { AnalysisResult } from "@/components/results-view"

export default function ResultsPage() {
  const [data, setData] = useState<AnalysisResult | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("retinaAnalysis")
      if (raw) {
        const parsed = JSON.parse(raw) as AnalysisResult
        setData(parsed)
      }
    } catch {
      // Ignore
    }
  }, [])

  return (
    <ResultsView
      findings={data?.findings}
      riskCards={data?.riskCards}
      imageUrl={data?.imageUrl}
      summary={data?.summary}
    />
  )
}
