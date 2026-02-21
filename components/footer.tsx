import { Eye } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
            <Eye className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            RetinaScan
          </span>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground/60">
          This tool is for educational and research demonstration purposes only.
          It is not FDA-approved and should not replace professional ophthalmic
          examination. Always consult a licensed healthcare provider for medical
          advice.
        </p>
        <p className="text-xs text-muted-foreground/40">
          CareTech at UCI &middot; 2026
        </p>
      </div>
    </footer>
  )
}
