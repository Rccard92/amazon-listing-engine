"""Route API per analisi URL Amazon."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.amazon_analysis import AmazonAnalyzeRequest, AmazonAnalyzeResponse
from app.services.amazon_analysis_service import AmazonAnalysisService
from app.services.amazon_fetcher import AmazonFetchChallengeError, AmazonFetchError
from app.services.amazon_url_service import AmazonUrlError

router = APIRouter()
service = AmazonAnalysisService()


@router.post(
    "/amazon/analyze",
    response_model=AmazonAnalyzeResponse,
    status_code=status.HTTP_200_OK,
)
def analyze_amazon_url(payload: AmazonAnalyzeRequest) -> AmazonAnalyzeResponse:
    """Analizza un singolo URL Amazon e restituisce output normalizzato."""
    try:
        return service.analyze(url=str(payload.url))
    except AmazonUrlError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except AmazonFetchChallengeError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(exc),
        ) from exc
    except AmazonFetchError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

