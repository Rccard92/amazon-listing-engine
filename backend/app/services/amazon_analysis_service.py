"""Orchestratore analisi URL Amazon."""

from dataclasses import dataclass, field

from app.schemas.amazon_analysis import AmazonAnalyzeResponse
from app.services.amazon_fetcher import AmazonFetcher, FetchedPage
from app.services.amazon_normalizer import normalize_product_output
from app.services.amazon_parser_dom import parse_dom_fallback
from app.services.amazon_parser_structured import ParsedAmazonData, parse_structured_data
from app.services.amazon_url_service import UrlAnalysis, analyze_amazon_url


@dataclass(frozen=True)
class AmazonAnalysisFullResult:
    """Risultato completo pipeline: risposta API + artefatti intermedi."""

    response: AmazonAnalyzeResponse
    fetched: FetchedPage
    structured: ParsedAmazonData
    dom: ParsedAmazonData


@dataclass
class AmazonAnalysisService:
    """Coordina URL service, fetcher, parser e normalizer."""

    fetcher: AmazonFetcher = field(default_factory=AmazonFetcher)

    def analyze(self, *, url: str) -> AmazonAnalyzeResponse:
        """Esegue l'intera pipeline su singolo URL Amazon."""
        return self.analyze_full(url=url).response

    def analyze_full(self, *, url: str) -> AmazonAnalysisFullResult:
        """Pipeline completa con accesso a HTML intermedi per ingestione AI."""
        url_ctx: UrlAnalysis = analyze_amazon_url(url)
        fetched = self.fetcher.fetch_product_page(url_ctx.normalized_url)
        structured = parse_structured_data(fetched.html)
        dom = parse_dom_fallback(fetched.html)
        normalized, parser_used = normalize_product_output(
            asin=url_ctx.asin,
            marketplace=url_ctx.marketplace,
            structured=structured,
            dom=dom,
        )
        warnings: list[str] = []
        if parser_used == "none":
            warnings.append("Nessun dato prodotto estratto dalla pagina.")
        response = AmazonAnalyzeResponse(
            normalized_url=fetched.url,
            parser_used=parser_used,
            warnings=warnings,
            product=normalized,
        )
        return AmazonAnalysisFullResult(
            response=response,
            fetched=fetched,
            structured=structured,
            dom=dom,
        )

