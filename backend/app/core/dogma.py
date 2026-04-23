"""Caricamento e sezioni di DOGMA.md — regole copy centralizzate per i prompt di generazione."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Literal

# Titoli H2 in DOGMA.md (devono combaciare esattamente)
H2_GLOBAL = "Principi globali"
H2_TONE = "Tono e registri"
H2_FORMAT = "Formattazione comune"
H2_CONVERSION = "Regole conversione"
H2_TITLE = "Titolo SEO"
H2_BULLETS = "Bullet point"
H2_DESCRIPTION = "Descrizione"
H2_KEYWORDS = "Keyword strategy (search terms)"
H2_READINESS = "Checklist copy readiness"

ListingDogmaSection = Literal["seo_title", "bullet_points", "description", "keyword_strategy"]


@dataclass(frozen=True)
class DogmaBundle:
    """Sezioni grezze estratte dal Markdown."""

    sections: dict[str, str]

    def body(self, title: str) -> str:
        return (self.sections.get(title) or "").strip()


def _default_dogma_path() -> Path:
    """Repo root: .../backend/app/core/dogma.py -> parents[3] = monorepo root."""
    here = Path(__file__).resolve()
    return here.parents[3] / "DOGMA.md"


def _resolve_dogma_path(raw_path: str | None = None) -> Path:
    """Risoluzione robusta path DOGMA: vuoto/relativo/assoluto con fallback su root repo."""
    default_path = _default_dogma_path().resolve()
    value = (raw_path or "").strip()

    if not value:
        if default_path.is_file():
            return default_path
        raise FileNotFoundError(f"DOGMA.md non trovato nel percorso predefinito: '{default_path}'.")

    configured = Path(value)
    if configured.is_absolute():
        candidate = configured.resolve()
    else:
        candidate = (_default_dogma_path().parent / configured).resolve()

    if candidate.is_file():
        return candidate
    if default_path.is_file():
        return default_path
    raise FileNotFoundError(
        "DOGMA.md non trovato. "
        f"Path configurato: '{candidate}'. "
        f"Fallback predefinito: '{default_path}'."
    )


def parse_dogma_markdown(content: str) -> dict[str, str]:
    """Estrae mappe H2 title -> corpo (testo sotto l'intestazione, senza il ##)."""
    sections: dict[str, str] = {}
    current_h2: str | None = None
    lines: list[str] = []
    for line in content.splitlines():
        if line.startswith("## "):
            if current_h2 is not None:
                sections[current_h2] = "\n".join(lines).strip()
            current_h2 = line[3:].strip()
            lines = []
        else:
            lines.append(line)
    if current_h2 is not None:
        sections[current_h2] = "\n".join(lines).strip()
    return sections


def load_dogma_bundle(path: Path | None = None) -> DogmaBundle:
    p = path.resolve() if path else _resolve_dogma_path()
    text = p.read_text(encoding="utf-8")
    return DogmaBundle(sections=parse_dogma_markdown(text))


@lru_cache
def _cached_bundle(path_str: str) -> DogmaBundle:
    return load_dogma_bundle(Path(path_str))


def get_dogma_bundle(path: Path | None = None) -> DogmaBundle:
    """Bundle in cache per path assoluto string."""
    p = path.resolve() if path else _resolve_dogma_path()
    return _cached_bundle(str(p))


def get_dogma_bundle_for_settings(dogma_md_path: str) -> DogmaBundle:
    """Risolve il path da Settings.dogma_md_path (vuoto = default repo root)."""
    p = _resolve_dogma_path(dogma_md_path)
    return _cached_bundle(str(p))


def build_system_addon_for_section(bundle: DogmaBundle, section: ListingDogmaSection) -> str:
    """Concatena principi globali, tono, formattazione, conversione + sezione specifica + checklist."""
    parts = [
        bundle.body(H2_GLOBAL),
        bundle.body(H2_TONE),
        bundle.body(H2_FORMAT),
        bundle.body(H2_CONVERSION),
    ]
    if section == "seo_title":
        parts.append(bundle.body(H2_TITLE))
    elif section == "bullet_points":
        parts.append(bundle.body(H2_BULLETS))
    elif section == "description":
        parts.append(bundle.body(H2_DESCRIPTION))
    else:
        parts.append(bundle.body(H2_KEYWORDS))
    parts.append(bundle.body(H2_READINESS))
    merged = "\n\n".join(p for p in parts if p)
    return f"\n\n--- Regole prodotto (DOGMA) ---\n{merged}\n--- Fine DOGMA ---\n"


def invalidate_dogma_cache() -> None:
    """Per test: svuota la cache del bundle."""
    _cached_bundle.cache_clear()
