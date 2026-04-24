"""Servizi keyword-first: planning pre-content e supporto backend terms finali."""

from __future__ import annotations

import re

from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy
from app.schemas.keyword_planning import KeywordPlanning, SemanticCluster


def _normalize_terms(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in values:
        token = re.sub(r"\s+", " ", str(raw).strip().lower())
        if not token or token in seen:
            continue
        seen.add(token)
        out.append(token)
    return out


class KeywordPlanningService:
    """Costruisce un piano keyword strutturato a partire dalla strategia confermata."""

    def build_plan(self, strategy: ConfirmedProductStrategy) -> KeywordPlanning:
        primary = strategy.keyword_primarie[0].strip() if strategy.keyword_primarie else strategy.nome_prodotto.strip()
        secondaries = _normalize_terms(strategy.keyword_secondarie or strategy.keyword_primarie[1:])
        caratteristiche = _normalize_terms(strategy.caratteristiche_tecniche)
        benefici = _normalize_terms(strategy.benefici_principali)
        obiezioni = _normalize_terms(strategy.gestione_obiezioni)

        frontend_push = _normalize_terms([primary, *secondaries[:6], *benefici[:4]])
        backend_keep = _normalize_terms([*secondaries[6:], *caratteristiche[:8], *obiezioni[:4]])

        clusters: list[SemanticCluster] = [
            SemanticCluster(name="core_intent", keywords=_normalize_terms([primary, *secondaries[:4]])),
            SemanticCluster(name="features_specs", keywords=caratteristiche[:8]),
            SemanticCluster(name="benefits_use_cases", keywords=benefici[:8]),
        ]
        return KeywordPlanning(
            keyword_primaria_finale=primary,
            keyword_secondarie_prioritarie=secondaries[:12],
            cluster_semantici=[c for c in clusters if c.keywords],
            parole_da_spingere_nel_frontend=frontend_push[:12],
            parole_da_tenere_per_backend=backend_keep[:18],
            note_su_keyword_da_non_forzare=[
                "Evitare ripetizioni keyword identiche tra titolo, bullet e descrizione.",
                "Non inserire keyword non coerenti con prodotto/categoria solo per volume.",
            ],
        )
