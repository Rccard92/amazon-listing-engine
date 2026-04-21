import { WorkflowGrid } from "@/components/dashboard/workflow-grid";
import { Badge } from "@/components/ui/badge";
import { ScoreCard } from "@/components/ui/score-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchHealthLive } from "@/lib/api";

export default async function HomePage() {
  const health = await fetchHealthLive();

  return (
    <main className="space-y-8">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Amazon Listing Engine</p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              UI shell premium per costruire, migliorare e differenziare listing Amazon.
            </h1>
            <p className="max-w-2xl text-base text-slate-600">
              Flussi guidati, cards arrotondate, spaziatura ampia e componenti riusabili pronti per integrare ingestion, scoring e generation.
            </p>
          </div>

          <Card className="border-slate-200/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-800">Stato API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {health ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Backend</span>
                    <Badge variant="success">{health.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{health.service}</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Backend</span>
                    <Badge variant="warning">offline</Badge>
                  </div>
                  <p className="text-xs text-slate-500">Configura NEXT_PUBLIC_API_URL per collegare il backend.</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreCard title="Listing quality" score={78} delta="+6" description="Miglioramento medio previsto dopo audit e revisione keyword." />
        <ScoreCard title="Coverage keyword" score={64} delta="+12" description="Copertura parziale: manca cluster long-tail ad alta intenzione." />
        <ScoreCard title="Compliance" score={92} delta="stabile" description="Baseline in linea con vincoli principali del marketplace." />
        <ScoreCard title="Execution" score={35} description="Shell pronto: in attesa della logica applicativa per i workflow." />
      </section>

      <section aria-labelledby="workflows-heading" className="space-y-5">
        <div className="space-y-2">
          <h2 id="workflows-heading" className="text-xl font-semibold tracking-tight text-slate-900">
            Workflow principali
          </h2>
          <p className="text-sm text-slate-600">Tre percorsi operativi con layout guidato e UX mobile-first.</p>
        </div>
        <WorkflowGrid />
      </section>
    </main>
  );
}

