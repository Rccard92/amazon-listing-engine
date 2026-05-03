"""Estrazione oggetto JSON dalla risposta LLM."""

from __future__ import annotations

import json
from typing import Any


def extract_json_object(raw: str) -> dict[str, Any]:
    text = (raw or "").strip()
    if not text:
        raise ValueError("empty")
    try:
        data = json.loads(text)
    except json.JSONDecodeError as first_exc:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end <= start:
            raise ValueError("no json object") from first_exc
        try:
            data = json.loads(text[start : end + 1])
        except json.JSONDecodeError as exc:
            raise ValueError("invalid json") from exc
    if not isinstance(data, dict):
        raise ValueError("root must be object")
    return data
