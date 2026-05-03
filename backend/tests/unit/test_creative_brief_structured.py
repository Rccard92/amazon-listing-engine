"""Parse JSON e modelli Pydantic Brief Creativo v2."""

from __future__ import annotations

import json

import pytest
from pydantic import ValidationError

from app.schemas.creative_brief import (
    CreativeBriefAPlusPayload,
    CreativeBriefFaqPayload,
    CreativeBriefGalleryPayload,
)
from app.services.creative_brief.json_extract import extract_json_object
from app.services.creative_brief.service import CreativeBriefService


def _gallery_image(i: int) -> dict[str, str]:
    return {
        "title": f"IMAGE {i + 1}",
        "role": "ruolo",
        "visual_instructions": "visivo",
        "short_message": "Nessuno" if i == 0 else "Breve messaggio",
        "communication_angle": "angolo",
        "designer_instructions": "grafico",
        "mistakes_to_avoid": "errori",
        "product_data_to_highlight": "dati",
    }


def _gallery_dict() -> dict:
    return {
        "common_specs": "2000x2000, 1:1, JPEG",
        "images": [_gallery_image(i) for i in range(8)],
    }


def test_extract_json_object_plain() -> None:
    assert extract_json_object(' {"a": 1} ') == {"a": 1}


def test_extract_json_object_fenced_noise() -> None:
    raw = 'prefix\n{"x": true}\ntrailing'
    assert extract_json_object(raw) == {"x": True}


def test_extract_json_object_invalid() -> None:
    with pytest.raises(ValueError):
        extract_json_object("not json")


def test_gallery_payload_requires_eight_images() -> None:
    d = _gallery_dict()
    d["images"] = d["images"][:7]
    with pytest.raises(ValidationError):
        CreativeBriefGalleryPayload.model_validate(d)


def test_gallery_payload_ok() -> None:
    CreativeBriefGalleryPayload.model_validate(_gallery_dict())


def test_a_plus_three_modules() -> None:
    mod = {
        "title": "M1",
        "dimensions": "1464x600",
        "visual_objective": "o",
        "what_to_show": "w",
        "suggested_text": "t",
        "layout_guidance": "l",
        "elements_to_highlight": "e",
        "mistakes_to_avoid": "m",
        "product_data_to_use": "p",
    }
    CreativeBriefAPlusPayload.model_validate({"modules": [mod, mod, mod]})
    with pytest.raises(ValidationError):
        CreativeBriefAPlusPayload.model_validate({"modules": [mod, mod]})


def test_faq_five_items() -> None:
    faqs = [{"question": f"Q{i}?", "answer": f"A{i}"} for i in range(5)]
    CreativeBriefFaqPayload.model_validate({"faqs": faqs})
    with pytest.raises(ValidationError):
        CreativeBriefFaqPayload.model_validate({"faqs": faqs[:4]})


def test_service_parse_gallery_warns_short_message() -> None:
    svc = CreativeBriefService()
    d = _gallery_dict()
    d["images"][0]["short_message"] = "sbagliato"
    raw = json.dumps(d)
    payload, legacy, warning = svc._parse_structured("gallery", raw)
    assert payload is not None
    assert legacy is None
    assert warning is not None
    assert "Nessuno" in warning


def test_service_parse_fallback_legacy() -> None:
    svc = CreativeBriefService()
    payload, legacy, _w = svc._parse_structured("gallery", "not json at all")
    assert payload is None
    assert legacy == "not json at all"
