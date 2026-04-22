"""Fase 2: arricchimento strategico da brief (LLM dedicato, non i prompt di generazione sezioni)."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass

from pydantic import ValidationError

from app.schemas.product_brief import ProductBrief
from app.schemas.strategic_enrichment import StrategicEnrichment
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
        client = self.llm or OpenAIListingLLMClient()
        user = brief.model_dump_json(indent=2, exclude_none=True)
        raw = client.generate_text(
            system_prompt=_ENRICHMENT_SYSTEM,
            user_prompt=user,
            max_output_tokens=1600,
        )
        data = _extract_json_object(raw)
        base = {
            "benefici_principali": data.get("benefici_principali") or [],
            "usp_differenziazione": data.get("usp_differenziazione"),
            "target_cliente": data.get("target_cliente"),
            "gestione_obiezioni": data.get("gestione_obiezioni") or [],
            "angolo_emotivo": data.get("angolo_emotivo"),
            "enrichment_provenance": "llm_v1",
        }
        try:
            return StrategicEnrichment.model_validate(base)
        except ValidationError:
            return StrategicEnrichment(
                benefici_principali=[str(x) for x in (data.get("benefici_principali") or []) if x],
                usp_differenziazione=str(data.get("usp_differenziazione") or "") or None,
                target_cliente=str(data.get("target_cliente") or "") or None,
                gestione_obiezioni=[str(x) for x in (data.get("gestione_obiezioni") or []) if x],
                angolo_emotivo=str(data.get("angolo_emotivo") or "") or None,
                enrichment_provenance="llm_v1",
            )
