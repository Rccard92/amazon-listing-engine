from pathlib import Path

from app.services.amazon_parser_dom import parse_dom_fallback
from app.services.amazon_parser_structured import parse_structured_data


FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures" / "amazon"


def _read_fixture(name: str) -> str:
    return (FIXTURES_DIR / name).read_text(encoding="utf-8")


def test_structured_parser_extracts_product_fields() -> None:
    html = _read_fixture("product_structured.html")
    parsed = parse_structured_data(html)

    assert parsed.title == "Organizer Cavi Premium"
    assert parsed.brand == "CableMaster"
    assert parsed.rating == 4.6
    assert parsed.reviews_count == 2310
    assert parsed.price == 29.99
    assert parsed.main_image == "https://images.example.com/main.jpg"


def test_dom_parser_fallback_extracts_dom_fields() -> None:
    html = _read_fixture("product_dom_fallback.html")
    parsed = parse_dom_fallback(html)

    assert parsed.title == "Supporto Monitor Ergonomico"
    assert parsed.brand == "Brand: ErgoDesk"
    assert parsed.bullets == [
        "Regolazione altezza rapida.",
        'Compatibile con monitor 27".',
    ]
    assert parsed.description == "Supporto alluminio con passacavi integrato."
    assert parsed.aplus_text == "Design minimal e stabile. Installazione in 3 minuti."
    assert parsed.rating == 4.4
    assert parsed.reviews_count == 1284
    assert parsed.price == 79.9
    assert parsed.main_image == "https://images.example.com/dom-main.jpg"

