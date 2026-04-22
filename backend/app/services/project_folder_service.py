"""Business logic per cartelle progetto."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.project_folder import ProjectFolder
from app.models.work_item import WorkItem
from app.schemas.project_folder import ProjectFolderCreate, ProjectFolderSummary, ProjectFolderUpdate


class ProjectFolderService:
    """Gestione CRUD cartelle progetto."""

    def list_folders(self, db: Session) -> list[ProjectFolderSummary]:
        rows = db.execute(
            select(
                ProjectFolder,
                func.count(WorkItem.id).label("items_count"),
                func.max(WorkItem.updated_at).label("last_item_updated_at"),
            )
            .outerjoin(WorkItem, WorkItem.project_folder_id == ProjectFolder.id)
            .group_by(ProjectFolder.id)
            .order_by(ProjectFolder.updated_at.desc())
        ).all()
        result: list[ProjectFolderSummary] = []
        for folder, count, last_updated in rows:
            data = ProjectFolderSummary.model_validate(folder)
            data.items_count = int(count or 0)
            data.last_item_updated_at = last_updated if isinstance(last_updated, datetime) else None
            result.append(data)
        return result

    def create_folder(self, db: Session, payload: ProjectFolderCreate) -> ProjectFolder:
        folder = ProjectFolder(name=payload.name.strip(), description=payload.description)
        db.add(folder)
        db.commit()
        db.refresh(folder)
        return folder

    def update_folder(self, db: Session, folder_id: UUID, payload: ProjectFolderUpdate) -> ProjectFolder | None:
        folder = db.get(ProjectFolder, folder_id)
        if not folder:
            return None
        updates = payload.model_dump(exclude_unset=True)
        for key, value in updates.items():
            setattr(folder, key, value)
        db.commit()
        db.refresh(folder)
        return folder

    def delete_folder(self, db: Session, folder_id: UUID) -> bool:
        folder = db.get(ProjectFolder, folder_id)
        if not folder:
            return False
        db.delete(folder)
        db.commit()
        return True

