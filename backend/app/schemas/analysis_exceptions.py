"""Eccezioni pipeline analisi con codici machine-readable."""

from app.schemas.analysis_errors import message_for_code


class AnalysisPipelineError(Exception):
    """Errore classificato della pipeline URL → fetch → estrazione → AI."""

    def __init__(
        self,
        error_code: str,
        *,
        http_status: int = 422,
        message_it: str | None = None,
        details: str | None = None,
    ) -> None:
        self.error_code = error_code
        self.http_status = http_status
        self.message_it = message_it or message_for_code(error_code)
        self.details = details
        super().__init__(self.message_it)


def map_amazon_url_error(exc: Exception) -> AnalysisPipelineError:
    """Mappa AmazonUrlError (messaggi italiani esistenti) su AnalysisPipelineError."""
    msg = str(exc)
    if "non valido" in msg or "Schema URL" in msg:
        return AnalysisPipelineError("INVALID_URL", http_status=422, message_it=msg)
    if "Marketplace Amazon non supportato" in msg:
        return AnalysisPipelineError("UNSUPPORTED_MARKETPLACE", http_status=422, message_it=msg)
    if "ASIN non trovato" in msg:
        return AnalysisPipelineError("ASIN_NOT_FOUND", http_status=422, message_it=msg)
    return AnalysisPipelineError("INVALID_URL", http_status=422, message_it=msg, details=msg)


def map_fetch_error(exc: Exception) -> AnalysisPipelineError:
    """Mappa eccezioni fetch Amazon su AnalysisPipelineError."""
    from app.services.amazon_fetcher import (
        AmazonFetchChallengeError,
        AmazonFetchError,
        AmazonFetchHttpError,
        AmazonFetchTimeoutError,
    )

    if isinstance(exc, AmazonFetchTimeoutError):
        return AnalysisPipelineError(
            "FETCH_TIMEOUT",
            http_status=504,
            message_it=str(exc),
            details=str(exc),
        )
    if isinstance(exc, AmazonFetchChallengeError):
        return AnalysisPipelineError(
            "CHALLENGE_DETECTED",
            http_status=429,
            message_it=str(exc),
            details=str(exc),
        )
    if isinstance(exc, AmazonFetchHttpError):
        code = "FETCH_HTTP_ERROR"
        status = 502
        if exc.status_code == 403:
            code, status = "FETCH_HTTP_403", 403
        elif exc.status_code == 429:
            code, status = "FETCH_HTTP_429", 429
        return AnalysisPipelineError(
            code,
            http_status=status,
            message_it=str(exc),
            details=str(exc),
        )
    if isinstance(exc, AmazonFetchError):
        return AnalysisPipelineError(
            "FETCH_HTTP_ERROR",
            http_status=502,
            message_it=str(exc),
            details=str(exc),
        )
    return AnalysisPipelineError(
        "FETCH_HTTP_ERROR",
        http_status=502,
        details=str(exc),
    )
