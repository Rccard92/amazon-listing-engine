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


def test_load_dogma_from_backend_root() -> None:
    invalidate_dogma_cache()
    here = Path(__file__).resolve()
    backend_root = here.parents[2]
    dogma_path = backend_root / "DOGMA.md"
    assert dogma_path.is_file(), f"manca DOGMA.md in {dogma_path}"
    bundle = load_dogma_bundle(dogma_path)
    assert H2_GLOBAL in bundle.sections
    assert "MUST" in bundle.body(H2_GLOBAL)
    assert "Titolo SEO" in bundle.sections.get(H2_TITLE, "") or bundle.body(H2_TITLE)


def test_build_system_addon_contains_section() -> None:
    invalidate_dogma_cache()
    here = Path(__file__).resolve()
    bundle = load_dogma_bundle(here.parents[2] / "DOGMA.md")
    addon = build_system_addon_for_section(bundle, "seo_title")
    assert "DOGMA" in addon
    assert "Principi globali" in addon or "MUST" in addon
    addon_b = build_system_addon_for_section(bundle, "bullet_points")
    assert H2_BULLETS in bundle.sections
    assert "5" in addon_b or "bullet" in addon_b.lower()


def test_default_path_points_to_backend_dogma() -> None:
    from app.core.dogma import _default_dogma_path

    p = _default_dogma_path()
    assert p.name == "DOGMA.md"
    assert p.parent.name == "backend"
    assert p.is_file()


def test_settings_path_missing_absolute_raises_clear_error(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.core import dogma as dogma_module
    from app.core.dogma import get_dogma_bundle_for_settings

    invalidate_dogma_cache()
    here = Path(__file__).resolve()
    backend_dogma = (here.parents[2] / "DOGMA.md").resolve()
    monkeypatch.setattr(dogma_module, "_default_dogma_path", lambda: backend_dogma)
    with pytest.raises(FileNotFoundError) as exc_info:
        get_dogma_bundle_for_settings("/DOGMA.md")
    msg = str(exc_info.value)
    assert "Path configurato" in msg
    assert "Path predefinito backend" in msg


def test_settings_relative_path_resolved_from_backend_root(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.core import dogma as dogma_module
    from app.core.dogma import get_dogma_bundle_for_settings

    invalidate_dogma_cache()
    repo_root = tmp_path / "repo"
    relative_dir = repo_root / "config"
    relative_dir.mkdir(parents=True)
    default_dogma = repo_root / "DOGMA.md"
    default_dogma.write_text("## Principi globali\n\nRoot rules", encoding="utf-8")
    relative_dogma = relative_dir / "DOGMA.md"
    relative_dogma.write_text("## Principi globali\n\nRelative rules", encoding="utf-8")
    monkeypatch.setattr(dogma_module, "_default_dogma_path", lambda: default_dogma)
    bundle = get_dogma_bundle_for_settings("config/DOGMA.md")
    assert "Relative rules" in bundle.body(H2_GLOBAL)


def test_settings_path_missing_and_no_default_raises_clear_error(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    from app.core import dogma as dogma_module
    from app.core.dogma import get_dogma_bundle_for_settings

    invalidate_dogma_cache()
    missing_default = tmp_path / "DOGMA.md"
    monkeypatch.setattr(dogma_module, "_default_dogma_path", lambda: missing_default)
    with pytest.raises(FileNotFoundError) as exc_info:
        get_dogma_bundle_for_settings("/DOGMA.md")
    msg = str(exc_info.value)
    assert "Path configurato" in msg
    assert "Path predefinito backend" in msg
