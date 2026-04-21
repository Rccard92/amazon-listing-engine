from app.services.amazon_normalizer import normalize_product_output
from app.services.amazon_parser_structured import ParsedAmazonData


def test_normalizer_merges_structured_and_dom() -> None:
    structured = ParsedAmazonData(
        title="Title from structured",
        brand="Brand S",
        bullets=["A", "B"],
        rating=4.8,
        reviews_count=120,
        price=19.9,
    )
    dom = ParsedAmazonData(
        title="Title DOM",
        bullets=["B", "C"],
        description="DOM description",
        main_image="https://img.example.com/a.jpg",
    )

    product, parser_used = normalize_product_output(
        asin="B08N5WRWNW",
        marketplace="IT",
        structured=structured,
        dom=dom,
    )
    assert product.asin == "B08N5WRWNW"
    assert product.marketplace == "IT"
    assert product.title == "Title from structured"
    assert product.description == "DOM description"
    assert product.bullets == ["A", "B", "C"]
    assert product.main_image == "https://img.example.com/a.jpg"
    assert parser_used == "hybrid"

