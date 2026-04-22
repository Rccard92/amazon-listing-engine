"""Route API workflow guidati."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.workflow_create_from_similar import CreateFromSimilarRequest, CreateFromSimilarResponse
from app.services.amazon_fetcher import AmazonFetchChallengeError, AmazonFetchError
from app.services.amazon_url_service import AmazonUrlError
from app.services.workflow_create_from_similar_service import (
    WorkflowCreateFromSimilarError,
    WorkflowCreateFromSimilarService,
)

router = APIRouter()
service = WorkflowCreateFromSimilarService()
logger = logging.getLogger(__name__)


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
    except ValidationError as exc:
        logger.exception("Errore di validazione nel workflow create-from-similar.")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Dati non validi nel salvataggio della bozza: {exc.errors()}",
        ) from exc
    except WorkflowCreateFromSimilarError as exc:
        logger.exception("Errore applicativo nel workflow create-from-similar.")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Errore inatteso nel workflow create-from-similar.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno durante la creazione della bozza da prodotto simile.",
        ) from exc

