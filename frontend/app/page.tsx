import { WorkflowGrid } from "@/components/dashboard/workflow-grid";
import { Badge } from "@/components/ui/badge";
import { ScoreCard } from "@/components/ui/score-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { it } from "@/lib/i18n/it";
import { fetchHealthLive } from "@/lib/api";

function mapHealthToLabel(status: string): { label: string; variant: "success" | "warning" | "neutral" } {
  const s = status.toLowerCase();
  if (s === "ok" || s === "healthy") {
    return { label: it.home.statusConnected, variant: "success" };
  }
  if (s === "degraded") {
    return { label: it.home.statusLimited, variant: "warning" };
  }
  return { label: status, variant: "neutral" };
}

export default async function HomePage() {
  const health = await fetchHealthLive();
  const healthBadge = health ? mapHealthToLabel(health.status) : null;

  return (
    <main className="space-y-8">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{it.home.kicker}</p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {it.home.heroTitle}
            </h1>
            <p className="max-w-2xl text-base text-slate-600">{it.home.heroBody}</p>
          </div>

          <Card className="border-slate-200/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-800">{it.home.statusCardTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {health && healthBadge ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={healthBadge.variant}>{healthBadge.label}</Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">{it.home.statusDetailWhenUpPrefix}</p>
                  <details className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-500">
                    <summary className="cursor-pointer font-medium text-slate-600">{it.home.statusTechnicalToggle}</summary>
                    <p className="mt-2 font-mono text-[10px] text-slate-500">{health.service}</p>
                  </details>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="warning">{it.home.statusDisconnected}</Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">{it.home.statusDetailWhenDown}</p>
                  <p className="text-[11px] leading-relaxed text-slate-500">{it.home.statusDetailHintTechnical}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreCard
          title={it.home.scoreCards.quality.title}
          score={78}
          delta={it.home.scoreCards.quality.delta}
          description={it.home.scoreCards.quality.description}
        />
        <ScoreCard
          title={it.home.scoreCards.keywords.title}
          score={64}
          delta={it.home.scoreCards.keywords.delta}
          description={it.home.scoreCards.keywords.description}
        />
        <ScoreCard
          title={it.home.scoreCards.compliance.title}
          score={92}
          delta={it.home.scoreCards.compliance.delta}
          description={it.home.scoreCards.compliance.description}
        />
        <ScoreCard
          title={it.home.scoreCards.progress.title}
          score={35}
          description={it.home.scoreCards.progress.description}
        />
      </section>

      <section aria-labelledby="workflows-heading" className="space-y-5">
        <div className="space-y-2">
          <h2 id="workflows-heading" className="text-xl font-semibold tracking-tight text-slate-900">
            {it.home.workflowsHeading}
          </h2>
          <p className="text-sm text-slate-600">{it.home.workflowsIntro}</p>
        </div>
        <WorkflowGrid />
      </section>
    </main>
  );
}
