"use client";

import { EmptyState } from "@/components/workflow/empty-state";
import { FormField } from "@/components/workflow/form-field";
import { StepSection } from "@/components/workflow/step-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CompetitorPage() {
  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Build From Competitor</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Costruisci un nuovo listing partendo da un competitor URL e da un positioning piu distintivo.
        </p>
      </header>

      <StepSection
        step={1}
        title="URL concorrente"
        description="Usa un singolo URL come base per estrazione e confronto competitivo."
      >
        <FormField label="Competitor URL" hint="Inserisci URL prodotto concorrente.">
          <Input placeholder="https://www.amazon.it/dp/..." />
        </FormField>
      </StepSection>

      <StepSection
        step={2}
        title="Posizionamento target"
        description="Definisci differenziazione, audience e angolo di comunicazione."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Target customer" hint="Chi vuoi conquistare rispetto al competitor?">
            <Input placeholder="Es. professionisti smart working" />
          </FormField>
          <FormField label="Primary advantage" hint="Vantaggio competitivo principale.">
            <Input placeholder="Es. materiali premium + garanzia estesa" />
          </FormField>
          <FormField className="md:col-span-2" label="Angolo narrativo" hint="Messaggio chiave per distinguerti.">
            <Textarea placeholder="Descrivi tono, posizionamento e proof point..." />
          </FormField>
        </div>
      </StepSection>

      <StepSection
        step={3}
        title="Output nuovo listing"
        description="Placeholder pronto per output generazione e controlli compliance."
      >
        <EmptyState
          title="Output non ancora generato"
          description="Qui mostreremo titolo proposto, bullet points, backend keywords e note di compliance." 
        />
      </StepSection>

      <div className="flex justify-end gap-3 pb-6">
        <Button variant="ghost">Salva bozza</Button>
        <Button>Genera proposta</Button>
      </div>
    </main>
  );
}

