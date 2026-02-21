const conditions = [
  {
    name: "Diabetic Retinopathy",
    severity: "5 Stages",
    description:
      "Microaneurysms, dot/blot hemorrhages, hard exudates, neovascularization. Detectable years before vision loss.",
    markers: ["Microaneurysms", "Hemorrhages", "Exudates", "Neovascularization"],
    color: "bg-chart-5",
  },
  {
    name: "Hypertensive Retinopathy",
    severity: "4 Grades",
    description:
      "Arteriolar narrowing, AV nicking, flame hemorrhages, papilledema. Correlates with systemic blood pressure damage.",
    markers: ["AV Nicking", "Arteriolar Narrowing", "Cotton Wool Spots", "Papilledema"],
    color: "bg-warning",
  },
  {
    name: "Glaucoma Risk",
    severity: "Early Detection",
    description:
      "Cup-to-disc ratio changes, nerve fiber layer thinning, and disc hemorrhages indicate elevated intraocular pressure.",
    markers: ["Cup-to-Disc Ratio", "NFL Thinning", "Disc Hemorrhage", "Rim Loss"],
    color: "bg-primary",
  },
  {
    name: "Alzheimer's Indicators",
    severity: "Research Stage",
    description:
      "Retinal nerve fiber thinning and reduced vascular density may precede cognitive decline by 10-20 years.",
    markers: ["NFL Thinning", "Vascular Density", "Ganglion Cell Loss", "Amyloid Deposits"],
    color: "bg-chart-3",
  },
]

export function DetectionsSection() {
  return (
    <section id="detections" className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            What We Screen
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Conditions visible through the retina
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
            A single retinal photograph can reveal biomarkers for multiple
            systemic diseases. Here is what our AI looks for.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {conditions.map((condition) => (
            <div
              key={condition.name}
              className="rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-border"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${condition.color}`} />
                  <h3 className="text-base font-semibold text-foreground">
                    {condition.name}
                  </h3>
                </div>
                <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {condition.severity}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {condition.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {condition.markers.map((marker) => (
                  <span
                    key={marker}
                    className="rounded-md border border-border/50 bg-background px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {marker}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
