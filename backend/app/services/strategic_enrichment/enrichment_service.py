"""Fase 2: arricchimento strategico da brief (LLM dedicato, non i prompt di generazione sezioni)."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass

from pydantic import ValidationError

from app.schemas.debug_trace import DebugTrace
from app.schemas.product_brief import ProductBrief
from app.schemas.strategic_enrichment import StrategicEnrichment
from app.services.debug_trace import DebugTraceCollector
from app.services.listing_generation.llm_client import ListingLLMClient
from app.services.listing_generation.openai_llm_client import OpenAIListingLLMClient

_ENRICHMENT_SYSTEM = """Sei un stratega e-commerce per schede prodotto Amazon Italia.
Dal brief JSON fornito dall'utente, proponi contenuti strategici per alimentare la generazione del copy.
Regole:
- Italiano corretto e concreto.
- NON inventare certificazioni, numeri di garanzia, premi o recensioni non presenti nel brief.
- Se mancano dati, fai ipotesi prudenti e generiche (es. "utenti attenti al rapporto qualità-prezzo") senza falsificare fatti.
Rispondi SOLO con un oggetto JSON valido (nessun markdown, nessun testo fuori dal JSON) con esattamente queste chiavi:
{
  "benefici_principali": ["string", ...],
  "usp_differenziazione": "string o null",
  "target_cliente": "string o null",
  "gestione_obiezioni": ["string", ...],
  "angolo_emotivo": "string o null"
}
benefici_principali: 3-6 voci brevi. gestione_obiezioni: 2-5 voci."""


def _extract_json_object(raw: str) -> dict:
    text = raw.strip()
    m = re.search(r"\{[\s\S]*\}", text)
    if not m:
        raise ValueError("Nessun oggetto JSON nella risposta")
    return json.loads(m.group(0))


@dataclass
class StrategicEnrichmentService:
    llm: ListingLLMClient | None = None

    def enrich(self, brief: ProductBrief) -> StrategicEnrichment:
        enrichment, _ = self.enrich_with_trace(brief, include_debug_trace=False)
        return enrichment

    def enrich_with_trace(
        self,
        brief: ProductBrief,
        *,
        include_debug_trace: bool = False,
    ) -> tuple[StrategicEnrichment, DebugTrace | None]:
        trace = DebugTraceCollector(step="product_intelligence_enrichment", enabled=include_debug_trace)
        if include_debug_trace:
            trace.summary = "Arricchimento strategico calcolato da brief normalizzato."
            trace.inputs_used = {
                "nome_prodotto": brief.nome_prodotto,
                "categoria": brief.categoria,
                "brand": brief.brand,
                "keyword_primarie": brief.keyword_primarie,
                "keyword_secondarie": brief.keyword_secondarie,
            }
            trace.add_block(
                title="Input usati",
                content=f"Prodotto: {brief.nome_prodotto or '-'}\nCategoria: {brief.categoria or '-'}\nBrand: {brief.brand or '-'}",
            )
        client = self.llm or OpenAIListingLLMClient()
        user = brief.model_dump_json(indent=2, exclude_none=True)
        raw = client.generate_text(
            system_prompt=_ENRICHMENT_SYSTEM,
            user_prompt=user,
            max_output_tokens=1600,
        )
        data = _extract_json_object(raw)
        if include_debug_trace:
            trace.intermediate_outputs = {
                "benefici_count": len(data.get("benefici_principali") or []),
                "obiezioni_count": len(data.get("gestione_obiezioni") or []),
            }
            trace.add_decision(
                label="Selezione benefici principali",
                reason="Massimo 3-6 elementi per mantenere chiarezza e riuso nella generazione copy.",
            )
        base = {
            "benefici_principali": data.get("benefici_principali") or [],
            "usp_differenziazione": data.get("usp_differenziazione"),
            "target_cliente": data.get("target_cliente"),
            "gestione_obiezioni": data.get("gestione_obiezioni") or [],
            "angolo_emotivo": data.get("angolo_emotivo"),
            "enrichment_provenance": "llm_v1",
        }
        try:
            enrichment = StrategicEnrichment.model_validate(base)
        except ValidationError:
            enrichment = StrategicEnrichment(
                benefici_principali=[str(x) for x in (data.get("benefici_principali") or []) if x],
                usp_differenziazione=str(data.get("usp_differenziazione") or "") or None,
                target_cliente=str(data.get("target_cliente") or "") or None,
                gestione_obiezioni=[str(x) for x in (data.get("gestione_obiezioni") or []) if x],
                angolo_emotivo=str(data.get("angolo_emotivo") or "") or None,
                enrichment_provenance="llm_v1",
            )
        if include_debug_trace:
            trace.final_output = enrichment.model_dump(mode="json")
            trace.confidence_score = 0.88 if enrichment.benefici_principali else 0.65
            trace.questions_raised = [
                "Confermare target cliente principale?" if not enrichment.target_cliente else "",
            ]
            trace.questions_raised = [q for q in trace.questions_raised if q]
            trace.reasoning_summary = (
                "Il sistema ha sintetizzato benefici/USP/target dal brief, con fallback prudente sui campi mancanti."
            )
            trace.add_block(title="Output finale", content=json.dumps(enrichment.model_dump(mode="json"), ensure_ascii=True))
        return enrichment, trace.build()
