import { WorkflowGrid } from "@/components/dashboard/workflow-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { it } from "@/lib/i18n/it";

export default function HomePage() {
  return (
    <main className="space-y-10">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{it.home.kicker}</p>
          <h1 className="max-w-4xl text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {it.home.heroTitle}
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-slate-600">{it.home.heroBody}</p>
        </div>
      </header>

      <section aria-labelledby="workflows-heading" className="space-y-5">
        <div className="space-y-2">
          <h2 id="workflows-heading" className="text-xl font-semibold tracking-tight text-slate-900">
            {it.home.workflowsHeading}
          </h2>
          <p className="text-sm text-slate-600">{it.home.workflowsIntro}</p>
        </div>
        <WorkflowGrid />
      </section>

      <section aria-labelledby="benefits-heading" className="space-y-5">
        <div className="space-y-2">
          <h2 id="benefits-heading" className="text-xl font-semibold tracking-tight text-slate-900">
            {it.home.benefitsHeading}
          </h2>
          <p className="text-sm text-slate-600">{it.home.benefitsIntro}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {it.home.benefits.map((benefit) => (
            <Card key={benefit.title} className="border-slate-200/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-slate-600">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
