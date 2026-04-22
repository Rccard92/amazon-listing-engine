"""Route API per cartelle progetto."""

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
from app.services.project_folder_service import ProjectFolderService

router = APIRouter()
service = ProjectFolderService()


@router.get("/projects", response_model=list[ProjectFolderSummary])
def list_projects(db: Session = Depends(get_db)) -> list[ProjectFolderSummary]:
    return service.list_folders(db)


@router.post("/projects", response_model=ProjectFolderRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectFolderCreate, db: Session = Depends(get_db)) -> ProjectFolderRead:
    return ProjectFolderRead.model_validate(service.create_folder(db, payload))


@router.patch("/projects/{project_id}", response_model=ProjectFolderRead)
def update_project(
    project_id: UUID,
    payload: ProjectFolderUpdate,
    db: Session = Depends(get_db),
) -> ProjectFolderRead:
    updated = service.update_folder(db, project_id, payload)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Progetto non trovato.")
    return ProjectFolderRead.model_validate(updated)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: UUID, db: Session = Depends(get_db)) -> None:
    ok = service.delete_folder(db, project_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Progetto non trovato.")

