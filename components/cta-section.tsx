import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="border-t border-border/40 bg-secondary/20 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready to screen?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-pretty text-muted-foreground">
          Upload a retinal fundus image and get your AI-powered health screening
          in seconds. No account required.
        </p>
        <div className="mt-8">
          <Button asChild size="lg" className="gap-2 px-8">
            <Link href="/scan">
              Start Free Screening
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground/60">
          For research and educational purposes only. Not a substitute for
          professional medical diagnosis.
        </p>
      </div>
    </section>
  )
}
