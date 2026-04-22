"""Route API workflow guidati."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.workflow_create_from_similar import CreateFromSimilarRequest, CreateFromSimilarResponse
from app.services.amazon_fetcher import AmazonFetchChallengeError, AmazonFetchError
from app.services.amazon_url_service import AmazonUrlError
from app.services.workflow_create_from_similar_service import WorkflowCreateFromSimilarService

router = APIRouter()
service = WorkflowCreateFromSimilarService()


@router.post(
    "/workflows/create-from-similar",
    response_model=CreateFromSimilarResponse,
    status_code=status.HTTP_200_OK,
)
def create_from_similar(payload: CreateFromSimilarRequest, db: Session = Depends(get_db)) -> CreateFromSimilarResponse:
    try:
        return service.execute(db, payload)
    except AmazonUrlError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except AmazonFetchChallengeError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    except AmazonFetchError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

