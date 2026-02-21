import { Upload, Cpu, ClipboardList } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Retinal Image",
    description:
      "Drag and drop or select a retinal fundus photograph. We accept standard formats from most fundus cameras.",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI Analysis",
    description:
      "Our vision model examines the optic disc, macula, vasculature, and background for abnormalities in under 10 seconds.",
  },
  {
    number: "03",
    icon: ClipboardList,
    title: "Get Your Report",
    description:
      "Receive a detailed risk assessment with annotated findings, severity scores, and recommended next steps.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-border/40 bg-secondary/20 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Process
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Three steps to early detection
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            No appointments, no wait times. Get an AI-powered retinal screening
            in seconds.
          </p>
        </div>

        <div className="relative mt-14 grid gap-8 lg:grid-cols-3 lg:gap-6">
          {/* Connector line (desktop only) */}
          <div className="absolute top-16 right-[33%] left-[33%] hidden h-px bg-border/60 lg:block" />

          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Step number */}
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/40 bg-background">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="mt-1 font-mono text-xs text-primary/60">
                {step.number}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
