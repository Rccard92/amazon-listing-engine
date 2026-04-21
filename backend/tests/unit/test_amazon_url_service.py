from app.services.amazon_url_service import (
    AmazonUrlError,
    analyze_amazon_url,
    detect_marketplace,
    extract_asin,
    normalize_amazon_url,
)


def test_extract_asin_from_dp_pattern() -> None:
    asin = extract_asin("https://www.amazon.it/dp/B08N5WRWNW?ref_=abc")
    assert asin == "B08N5WRWNW"


def test_extract_asin_from_gp_pattern() -> None:
    asin = extract_asin("https://amazon.com/gp/product/B0C1234XYZ")
    assert asin == "B0C1234XYZ"


def test_marketplace_detection() -> None:
    assert detect_marketplace("www.amazon.it") == "IT"
    assert detect_marketplace("amazon.com") == "US"


def test_url_normalization_removes_tracking() -> None:
    normalized = normalize_amazon_url(
        "http://www.amazon.it/dp/B08N5WRWNW/?utm_source=x&tag=abc&id=42"
    )
    assert normalized == "https://amazon.it/dp/B08N5WRWNW?id=42"


def test_analyze_url_returns_context() -> None:
    result = analyze_amazon_url("https://www.amazon.it/dp/B08N5WRWNW")
    assert result.asin == "B08N5WRWNW"
    assert result.marketplace == "IT"
    assert result.normalized_url == "https://amazon.it/dp/B08N5WRWNW"


def test_invalid_marketplace_raises() -> None:
    try:
        normalize_amazon_url("https://example.com/dp/B08N5WRWNW")
    except AmazonUrlError:
        assert True
        return
    raise AssertionError("AmazonUrlError atteso su marketplace non Amazon.")

