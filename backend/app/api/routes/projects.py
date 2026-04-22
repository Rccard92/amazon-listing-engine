"""Route API per cartelle progetto."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.project_folder import (
    ProjectFolderCreate,
    ProjectFolderRead,
    ProjectFolderSummary,
    ProjectFolderUpdate,
)
from app.services.project_folder_service import ProjectFolderService, ProjectFolderServiceError

router = APIRouter()
service = ProjectFolderService()
logger = logging.getLogger(__name__)


@router.get("/projects", response_model=list[ProjectFolderSummary])
def list_projects(db: Session = Depends(get_db)) -> list[ProjectFolderSummary]:
    try:
        return service.list_folders(db)
    except ProjectFolderServiceError as exc:
        logger.exception("Errore endpoint GET /projects.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno durante il recupero dei progetti.",
        ) from exc


@router.post("/projects", response_model=ProjectFolderRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectFolderCreate, db: Session = Depends(get_db)) -> ProjectFolderRead:
    try:
        return ProjectFolderRead.model_validate(service.create_folder(db, payload))
    except ProjectFolderServiceError as exc:
        logger.exception("Errore endpoint POST /projects.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno durante la creazione del progetto.",
        ) from exc


@router.patch("/projects/{project_id}", response_model=ProjectFolderRead)
def update_project(
    project_id: UUID,
    payload: ProjectFolderUpdate,
    db: Session = Depends(get_db),
) -> ProjectFolderRead:
    try:
        updated = service.update_folder(db, project_id, payload)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Progetto non trovato.")
        return ProjectFolderRead.model_validate(updated)
    except ProjectFolderServiceError as exc:
        logger.exception("Errore endpoint PATCH /projects/%s.", project_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno durante l'aggiornamento del progetto.",
        ) from exc


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db)) -> None:
    try:
        ok = service.delete_folder(db, project_id)
        if not ok:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Progetto non trovato.")
    except ProjectFolderServiceError as exc:
        logger.exception("Errore endpoint DELETE /projects/%s.", project_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno durante l'eliminazione del progetto.",
        ) from exc

