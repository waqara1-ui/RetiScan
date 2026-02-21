import type { Metadata } from "next"
import { ResultsView } from "@/components/results-view"

export const metadata: Metadata = {
  title: "Report | RetinaScan",
  description:
    "View your AI-powered retinal disease screening report with annotated findings and risk assessment.",
}

export default function ResultsPage() {
  return <ResultsView />
}
