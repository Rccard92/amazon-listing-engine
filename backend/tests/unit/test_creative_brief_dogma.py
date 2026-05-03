"""DOGMA helper Brief Creativo."""

from app.core.dogma import build_creative_brief_dogma_addon, invalidate_dogma_cache


def test_build_creative_brief_dogma_addon_contains_rules() -> None:
    invalidate_dogma_cache()
    for kind in ("gallery", "a_plus", "faq"):
        addon = build_creative_brief_dogma_addon(kind)  # type: ignore[arg-type]
        assert "DOGMA" in addon
        assert len(addon) > 80
