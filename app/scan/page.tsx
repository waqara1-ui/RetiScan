import type { Metadata } from "next"
import { ScanInterface } from "@/components/scan-interface"

export const metadata: Metadata = {
  title: "Scan | RetinaScan",
  description:
    "Upload a retinal fundus image for AI-powered disease screening.",
}

export default function ScanPage() {
  return <ScanInterface />
}
