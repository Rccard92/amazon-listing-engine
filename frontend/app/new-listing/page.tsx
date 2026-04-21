"use client";

import { FormField } from "@/components/workflow/form-field";
import { StepSection } from "@/components/workflow/step-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/components/ui/upload-dropzone";

export default function NewListingPage() {
  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">New Listing</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Flusso guidato per creare una nuova inserzione da zero con input prodotto e keyword strategy.
        </p>
      </header>

      <StepSection
        step={1}
        title="Dettagli prodotto"
        description="Inserisci i dati principali che useremo per titolo, bullet e descrizione ottimizzata."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Nome prodotto" hint="Usa naming chiaro e specifico.">
            <Input placeholder="Es. Organizer cavi premium" />
          </FormField>
          <FormField label="Categoria" hint="Categoria Amazon target.">
            <Input placeholder="Es. Home & Kitchen" />
          </FormField>
          <FormField className="md:col-span-2" label="Punti di forza" hint="Inserisci benefici, materiali, differenziatori.">
            <Textarea placeholder="Es. Materiale anti-graffio, design modulare, facile installazione..." />
          </FormField>
        </div>
      </StepSection>

      <StepSection
        step={2}
        title="Keyword input"
        description="Scegli tra inserimento manuale o import da CSV Helium10."
      >
        <Tabs
          items={[
            {
              key: "manual",
              label: "Manuale",
              content: (
                <FormField
                  label="Keyword manuali"
                  hint="Separa con virgole; le normalizzeremo in cluster successivi."
                >
                  <Textarea placeholder="keyword 1, keyword 2, keyword 3..." />
                </FormField>
              ),
            },
            {
              key: "csv",
              label: "CSV Helium10",
              content: (
                <p className="text-sm text-slate-600">
                  Carica un export CSV Helium10 nello step successivo tramite area drag-and-drop.
                </p>
              ),
            },
          ]}
        />
      </StepSection>

      <StepSection
        step={3}
        title="Upload Helium10"
        description="Import moderno drag-and-drop per iniziare l’analisi keyword."
      >
        <UploadDropzone />
      </StepSection>

      <div className="flex justify-end gap-3 pb-6">
        <Button variant="ghost">Salva bozza</Button>
        <Button>Continua</Button>
      </div>
    </main>
  );
}

