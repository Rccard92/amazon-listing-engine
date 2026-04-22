"""Test caricamento DOGMA.md e addon per sezione."""

from pathlib import Path

import pytest

from app.core.dogma import (
    H2_BULLETS,
    H2_GLOBAL,
    H2_TITLE,
    build_system_addon_for_section,
    invalidate_dogma_cache,
    load_dogma_bundle,
    parse_dogma_markdown,
)


def test_parse_dogma_markdown_simple() -> None:
    md = """# Doc\n\n## Sezione A\n\nfoo\n\n## Sezione B\n\nbar\n"""
    s = parse_dogma_markdown(md)
    assert s["Sezione A"] == "foo"
    assert s["Sezione B"] == "bar"


def test_load_dogma_from_repo_root() -> None:
    invalidate_dogma_cache()
    here = Path(__file__).resolve()
    repo_root = here.parents[3]
    dogma_path = repo_root / "DOGMA.md"
    assert dogma_path.is_file(), f"manca DOGMA.md in {dogma_path}"
    bundle = load_dogma_bundle(dogma_path)
    assert H2_GLOBAL in bundle.sections
    assert "MUST" in bundle.body(H2_GLOBAL)
    assert "Titolo SEO" in bundle.sections.get(H2_TITLE, "") or bundle.body(H2_TITLE)


def test_build_system_addon_contains_section() -> None:
    invalidate_dogma_cache()
    here = Path(__file__).resolve()
    bundle = load_dogma_bundle(here.parents[3] / "DOGMA.md")
    addon = build_system_addon_for_section(bundle, "seo_title")
    assert "DOGMA" in addon
    assert "Principi globali" in addon or "MUST" in addon
    addon_b = build_system_addon_for_section(bundle, "bullet_points")
    assert H2_BULLETS in bundle.sections
    assert "5" in addon_b or "bullet" in addon_b.lower()


def test_default_path_points_to_repo_dogma() -> None:
    from app.core.dogma import _default_dogma_path

    p = _default_dogma_path()
    assert p.name == "DOGMA.md"
    assert p.parent.name != "backend"  # root è parent di backend
    assert p.is_file()
