"""Caricamento DOGMA modulare (GLOBAL + modulo sezione) con fallback legacy monolitico."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Literal

# Titoli H2 in DOGMA legacy (devono combaciare esattamente)
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

CreativeBriefDogmaKind = Literal["gallery", "a_plus", "faq"]

MODULE_GLOBAL = "DOGMA_GLOBAL.md"
MODULE_KEYWORD_STRATEGY = "DOGMA_KEYWORD_STRATEGY.md"
MODULE_TITLE = "DOGMA_TITLE.md"
MODULE_BULLET = "DOGMA_BULLET.md"
MODULE_DESCRIPTION = "DOGMA_DESCRIPTION.md"
MODULE_A_PLUS = "DOGMA_A_PLUS.md"
MODULE_IMAGES = "DOGMA_IMAGES.md"
MODULE_FAQ = "DOGMA_FAQ.md"

SECTION_TO_MODULE = {
    "seo_title": MODULE_TITLE,
    "bullet_points": MODULE_BULLET,
    "description": MODULE_DESCRIPTION,
    "keyword_strategy": MODULE_KEYWORD_STRATEGY,
}

CREATIVE_BRIEF_KIND_TO_MODULE: dict[CreativeBriefDogmaKind, str] = {
    "gallery": MODULE_IMAGES,
    "a_plus": MODULE_A_PLUS,
    "faq": MODULE_FAQ,
}


@dataclass(frozen=True)
class DogmaBundle:
    """Regole DOGMA già composte per sezione runtime."""

    section_addons: dict[ListingDogmaSection, str]

    def addon(self, section: ListingDogmaSection) -> str:
        return (self.section_addons.get(section) or "").strip()


def _backend_root() -> Path:
    here = Path(__file__).resolve()
    return here.parents[2]


def _default_dogma_path() -> Path:
    return _backend_root() / "DOGMA.md"


def _default_modular_dir() -> Path:
    return _backend_root() / "dogma"


def _resolve_dogma_path(raw_path: str | None = None) -> Path:
    """Risoluzione path DOGMA con root backend e messaggi espliciti."""
    default_path = _default_dogma_path().resolve()
    value = (raw_path or "").strip()

    if not value:
        if default_path.is_file():
            return default_path
        raise FileNotFoundError(
            "DOGMA.md non trovato nel percorso predefinito del servizio backend: "
            f"'{default_path}'. Posiziona il file in 'backend/DOGMA.md' oppure imposta DOGMA_MD_PATH."
        )

    configured = Path(value)
    if configured.is_absolute():
        candidate = configured.resolve()
    else:
        candidate = (_default_dogma_path().parent / configured).resolve()

    if candidate.is_file():
        return candidate
    if not configured.is_absolute() and default_path.is_file():
        return default_path
    raise FileNotFoundError(
        "DOGMA.md non trovato. "
        f"Path configurato: '{candidate}'. "
        f"Path predefinito backend: '{default_path}'."
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


def _build_legacy_section_addon(sections: dict[str, str], section: ListingDogmaSection) -> str:
    parts = [
        (sections.get(H2_GLOBAL) or "").strip(),
        (sections.get(H2_TONE) or "").strip(),
        (sections.get(H2_FORMAT) or "").strip(),
        (sections.get(H2_CONVERSION) or "").strip(),
    ]
    if section == "seo_title":
        parts.append((sections.get(H2_TITLE) or "").strip())
    elif section == "bullet_points":
        parts.append((sections.get(H2_BULLETS) or "").strip())
    elif section == "description":
        parts.append((sections.get(H2_DESCRIPTION) or "").strip())
    else:
        parts.append((sections.get(H2_KEYWORDS) or "").strip())
    parts.append((sections.get(H2_READINESS) or "").strip())
    merged = "\n\n".join(p for p in parts if p)
    return f"\n\n--- Regole prodotto (DOGMA) ---\n{merged}\n--- Fine DOGMA ---\n"


def _compose_modular_addon(global_text: str, section_text: str) -> str:
    merged = "\n\n".join(p for p in (global_text.strip(), section_text.strip()) if p)
    return f"\n\n--- Regole prodotto (DOGMA) ---\n{merged}\n--- Fine DOGMA ---\n"


def _load_from_modular_dir(modular_dir: Path) -> DogmaBundle:
    global_path = modular_dir / MODULE_GLOBAL
    if not global_path.is_file():
        raise FileNotFoundError(f"Modulo DOGMA globale mancante: {global_path}")
    global_text = global_path.read_text(encoding="utf-8")
    addons: dict[ListingDogmaSection, str] = {}
    for section, filename in SECTION_TO_MODULE.items():
        p = modular_dir / filename
        if not p.is_file():
            raise FileNotFoundError(f"Modulo DOGMA sezione mancante ({section}): {p}")
        addons[section] = _compose_modular_addon(global_text, p.read_text(encoding="utf-8"))
    return DogmaBundle(section_addons=addons)


def _load_legacy(path: Path | None = None) -> DogmaBundle:
    p = path.resolve() if path else _resolve_dogma_path()
    text = p.read_text(encoding="utf-8")
    sections = parse_dogma_markdown(text)
    addons = {
        "seo_title": _build_legacy_section_addon(sections, "seo_title"),
        "bullet_points": _build_legacy_section_addon(sections, "bullet_points"),
        "description": _build_legacy_section_addon(sections, "description"),
        "keyword_strategy": _build_legacy_section_addon(sections, "keyword_strategy"),
    }
    return DogmaBundle(section_addons=addons)


def load_dogma_bundle(path: Path | None = None) -> DogmaBundle:
    modular_dir = _default_modular_dir()
    if modular_dir.is_dir():
        try:
            return _load_from_modular_dir(modular_dir)
        except FileNotFoundError:
            # Fallback a DOGMA legacy per compatibilità progressiva.
            pass
    return _load_legacy(path)


@lru_cache
def _cached_bundle(path_str: str) -> DogmaBundle:
    return _load_legacy(Path(path_str))


@lru_cache
def _cached_modular_bundle(modular_dir_str: str) -> DogmaBundle:
    return _load_from_modular_dir(Path(modular_dir_str))


def get_dogma_bundle(path: Path | None = None) -> DogmaBundle:
    """Bundle in cache per path assoluto string."""
    modular_dir = _default_modular_dir()
    if modular_dir.is_dir():
        try:
            return _cached_modular_bundle(str(modular_dir.resolve()))
        except FileNotFoundError:
            pass
    p = path.resolve() if path else _resolve_dogma_path()
    return _cached_bundle(str(p.resolve()))


def get_dogma_bundle_for_settings(dogma_md_path: str) -> DogmaBundle:
    """Priorità: DOGMA modulare (`backend/dogma`), poi fallback legacy `dogma_md_path`."""
    modular_dir = _default_modular_dir()
    if modular_dir.is_dir():
        try:
            return _cached_modular_bundle(str(modular_dir.resolve()))
        except FileNotFoundError:
            pass
    p = _resolve_dogma_path(dogma_md_path)
    return _cached_bundle(str(p.resolve()))


def build_system_addon_for_section(bundle: DogmaBundle, section: ListingDogmaSection) -> str:
    """Restituisce addon precomposto per la sezione richiesta."""
    return bundle.addon(section)


def build_creative_brief_dogma_addon(kind: CreativeBriefDogmaKind) -> str:
    """
    Composizione DOGMA_GLOBAL + modulo (IMAGES / A_PLUS / FAQ) per generazione Brief Creativo.
    Fallback minimale se la directory modulare non e disponibile.
    """
    modular_dir = _default_modular_dir()
    global_path = modular_dir / MODULE_GLOBAL
    module_name = CREATIVE_BRIEF_KIND_TO_MODULE[kind]
    module_path = modular_dir / module_name
    if modular_dir.is_dir() and global_path.is_file() and module_path.is_file():
        global_text = global_path.read_text(encoding="utf-8")
        section_text = module_path.read_text(encoding="utf-8")
        return _compose_modular_addon(global_text, section_text)
    return (
        "\n\n--- Regole brief creativo (DOGMA fallback) ---\n"
        "Fedele ai dati confermati; nessuna certificazione o garanzia inventata.\n"
        "Linguaggio operativo per designer; nessun markdown decorativo nell output.\n"
        "--- Fine DOGMA ---\n"
    )


def invalidate_dogma_cache() -> None:
    """Per test: svuota la cache del bundle."""
    _cached_bundle.cache_clear()
    _cached_modular_bundle.cache_clear()
