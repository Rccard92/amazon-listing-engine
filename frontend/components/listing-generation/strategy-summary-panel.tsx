"use client";

import type { ConfirmedProductStrategy, PriceTier } from "@/lib/listing-generation";
import { enrichConfirmedPlanCanonical } from "@/lib/listing-generation";
import { it } from "@/lib/i18n/it";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/workflow/form-field";

const p = it.listingGeneration;

type Props = {
  strategy: ConfirmedProductStrategy;
  onChange: (s: ConfirmedProductStrategy) => void;
};

function splitLines(s: string): string[] {
  return s
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function StrategySummaryPanel({ strategy, onChange }: Props) {
  const planIncluded =
    strategy.confirmed_keyword_plan != null
      ? enrichConfirmedPlanCanonical(strategy.confirmed_keyword_plan).included_keywords ?? []
      : [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label={p.fields.nome} required>
        <Input
          value={strategy.nome_prodotto}
          onChange={(e) => onChange({ ...strategy, nome_prodotto: e.target.value })}
        />
      </FormField>
      <FormField label={p.fields.categoria} optional>
        <Input
          value={strategy.categoria ?? ""}
          onChange={(e) => onChange({ ...strategy, categoria: e.target.value || null })}
        />
      </FormField>
      {planIncluded.length ? (
        <FormField className="md:col-span-2" label={p.fields.keywordsFromPlan} optional>
          <p className="text-sm leading-relaxed text-slate-700">{planIncluded.join(", ")}</p>
          <p className="mt-1 text-xs text-slate-500">{p.fields.keywordsFromPlanHint}</p>
        </FormField>
      ) : null}
      <FormField className="md:col-span-2" label={p.fields.keywordsPrimary} optional>
        <Input
          placeholder="es. lampada led, luce scrivania"
          value={strategy.keyword_primarie.join(", ")}
          onChange={(e) =>
            onChange({
              ...strategy,
              keyword_primarie: e.target.value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            })
          }
        />
      </FormField>
      <FormField className="md:col-span-2" label={p.fields.keywordsSecondary} optional>
        <Input
          value={strategy.keyword_secondarie.join(", ")}
          onChange={(e) =>
            onChange({
              ...strategy,
              keyword_secondarie: e.target.value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean),
            })
          }
        />
      </FormField>
      <FormField className="md:col-span-2" label={p.fields.usp} optional>
        <Textarea
          rows={2}
          value={strategy.usp_differenziazione ?? ""}
          onChange={(e) => onChange({ ...strategy, usp_differenziazione: e.target.value || null })}
        />
      </FormField>
      <FormField className="md:col-span-2" label={p.fields.target} optional>
        <Textarea
          rows={2}
          value={strategy.target_cliente ?? ""}
          onChange={(e) => onChange({ ...strategy, target_cliente: e.target.value || null })}
        />
      </FormField>
      <FormField className="md:col-span-2" label={p.fields.brand} optional>
        <Textarea
          rows={2}
          value={strategy.linee_guida_brand ?? ""}
          onChange={(e) => onChange({ ...strategy, linee_guida_brand: e.target.value || null })}
        />
      </FormField>
      <FormField label={p.fields.priceTier} optional>
        <select
          className="flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none ring-slate-200 focus-visible:ring-2"
          value={strategy.livello_prezzo}
          onChange={(e) =>
            onChange({
              ...strategy,
              livello_prezzo: e.target.value as PriceTier,
            })
          }
        >
          <option value="unknown">{p.tiers.unknown}</option>
          <option value="entry">{p.tiers.entry}</option>
          <option value="mid">{p.tiers.mid}</option>
          <option value="premium">{p.tiers.premium}</option>
        </select>
      </FormField>
      <FormField className="md:col-span-2" label={p.fields.features} optional>
        <Textarea
          rows={3}
          value={strategy.caratteristiche_tecniche.join("\n")}
          onChange={(e) => onChange({ ...strategy, caratteristiche_tecniche: splitLines(e.target.value) })}
        />
      </FormField>
      <FormField className="md:col-span-2" label={p.fields.benefits} optional>
        <Textarea
          rows={3}
          value={strategy.benefici_principali.join("\n")}
          onChange={(e) => onChange({ ...strategy, benefici_principali: splitLines(e.target.value) })}
        />
      </FormField>
      <FormField className="md:col-span-2" label={p.fields.objections} optional>
        <Textarea
          rows={2}
          value={strategy.gestione_obiezioni.join("\n")}
          onChange={(e) => onChange({ ...strategy, gestione_obiezioni: splitLines(e.target.value) })}
        />
      </FormField>
      <FormField className="md:col-span-2" label={p.fields.reviews} optional>
        <Textarea
          rows={2}
          value={strategy.insight_recensioni_clienti ?? ""}
          onChange={(e) =>
            onChange({ ...strategy, insight_recensioni_clienti: e.target.value || null })
          }
        />
      </FormField>
    </div>
  );
}
