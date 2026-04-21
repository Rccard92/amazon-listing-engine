"""Endpoint health — route sottili, verifica DB minimale."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.health import HealthDetailedResponse, HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_live() -> HealthResponse:
    """Liveness: nessuna dipendenza esterna."""
    settings = get_settings()
    return HealthResponse(status="ok", service=settings.app_name)


@router.get(
    "/health/ready",
    response_model=HealthDetailedResponse,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "Database non raggiungibile"}},
)
def health_ready(db: Session = Depends(get_db)) -> HealthDetailedResponse:
    """Readiness: verifica connessione PostgreSQL."""
    settings = get_settings()
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001 — health: vogliamo mappare qualsiasi errore DB
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "degraded",
                "service": settings.app_name,
                "database": "error",
                "message": str(exc),
            },
        ) from exc
    return HealthDetailedResponse(
        status="ok",
        service=settings.app_name,
        database="connected",
    )
