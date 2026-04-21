"use client";

import { EmptyState } from "@/components/workflow/empty-state";
import { FormField } from "@/components/workflow/form-field";
import { StepSection } from "@/components/workflow/step-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function ImprovePage() {
  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Improve Existing Listing</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Migliora un listing esistente da URL con audit guidato e priorita di ottimizzazione.
        </p>
      </header>

      <StepSection step={1} title="URL prodotto" description="Analizziamo un singolo URL Amazon alla volta.">
        <FormField
          label="Amazon URL"
          hint="Inserisci URL completo del prodotto da ottimizzare."
        >
          <Input placeholder="https://www.amazon.it/dp/..." />
        </FormField>
      </StepSection>

      <StepSection
        step={2}
        title="Ambito ottimizzazione"
        description="Definisci le aree su cui concentrare il miglioramento."
      >
        <Tabs
          items={[
            {
              key: "copy",
              label: "Copy",
              content: (
                <FormField label="Obiettivo copy" hint="Esempio: aumentare CTR e chiarezza USP.">
                  <Textarea placeholder="Indica tono, promessa e principali debolezze da correggere..." />
                </FormField>
              ),
            },
            {
              key: "keywords",
              label: "Keywords",
              content: (
                <FormField label="Focus keyword" hint="Cluster prioritari da spingere nel listing.">
                  <Textarea placeholder="primary..., secondary..., excluded..." />
                </FormField>
              ),
            },
          ]}
        />
      </StepSection>

      <StepSection
        step={3}
        title="Risultato audit"
        description="Area risultati pronta per integrazione con backend audit/scoring."
      >
        <EmptyState
          title="Nessun audit ancora eseguito"
          description="Dopo il collegamento API vedrai score, raccomandazioni e suggerimenti prioritizzati qui."
        />
      </StepSection>

      <div className="flex justify-end gap-3 pb-6">
        <Button variant="ghost">Annulla</Button>
        <Button>Avvia audit</Button>
      </div>
    </main>
  );
}

