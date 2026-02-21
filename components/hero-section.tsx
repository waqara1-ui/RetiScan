import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Shield, Zap, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pt-20 pb-16 text-center lg:pt-28 lg:pb-24">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            Built by CareTech at UCI
          </span>
        </div>

        <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          See Disease Before{" "}
          <span className="text-primary">Symptoms Appear</span>
        </h1>

        <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Upload a retinal fundus image and our AI instantly screens for early
          signs of diabetic retinopathy, hypertension, and neurological
          conditions -- all from a single photograph of the eye.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="gap-2 px-6">
            <Link href="/scan">
              Upload Retinal Image
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2 px-6">
            <a href="#how-it-works">Learn How It Works</a>
          </Button>
        </div>

        {/* Stats row */}
        <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-6">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground sm:text-2xl">
              {"< 10s"}
            </span>
            <span className="text-xs text-muted-foreground">Analysis Time</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground sm:text-2xl">
              5+
            </span>
            <span className="text-xs text-muted-foreground">
              Conditions Screened
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground sm:text-2xl">
              100%
            </span>
            <span className="text-xs text-muted-foreground">Non-Invasive</span>
          </div>
        </div>

        {/* Hero image */}
        <div className="relative mt-16 w-full max-w-2xl">
          <div className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card">
            <Image
              src="/images/retina-hero.jpg"
              alt="AI-analyzed retinal fundus image showing blood vessel mapping"
              width={800}
              height={500}
              className="w-full object-cover"
              priority
            />
            {/* Overlay scan indicator */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-background/80 px-4 py-2 backdrop-blur-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span className="text-xs font-medium text-primary">
                  AI Analysis Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
