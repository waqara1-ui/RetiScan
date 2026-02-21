import {
  Eye,
  Brain,
  HeartPulse,
  ScanLine,
  FileText,
  Lock,
} from "lucide-react"

const features = [
  {
    icon: Eye,
    title: "Retinal Vessel Mapping",
    description:
      "AI traces and analyzes the complete vascular tree to detect narrowing, tortuosity, and microaneurysms.",
  },
  {
    icon: Brain,
    title: "Neurological Screening",
    description:
      "Optic disc changes and nerve fiber thinning can signal early Alzheimer's or multiple sclerosis risk.",
  },
  {
    icon: HeartPulse,
    title: "Cardiovascular Markers",
    description:
      "Retinal arteriole-to-venule ratio (AVR) reveals hypertension and atherosclerosis before symptoms onset.",
  },
  {
    icon: ScanLine,
    title: "Diabetic Retinopathy",
    description:
      "Detects microaneurysms, hemorrhages, and exudates across all 5 severity stages from none to proliferative.",
  },
  {
    icon: FileText,
    title: "Clinical Report Export",
    description:
      "Generates a structured PDF report with annotated images that you can share directly with your doctor.",
  },
  {
    icon: Lock,
    title: "Privacy-First Design",
    description:
      "Images are analyzed client-side when possible. No data is stored, no accounts required, fully HIPAA-aware.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Capabilities
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One image. Multiple insights.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            The retina is the only place in the body where blood vessels can be
            observed directly -- making it a window into your systemic health.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-primary/30 hover:bg-card/80"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
