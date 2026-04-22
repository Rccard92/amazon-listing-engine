"""Business logic per work item (Cronologia/Progetti)."""

from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.work_item import WorkItem
from app.schemas.work_item import WorkItemCreate, WorkItemUpdate


class WorkItemService:
    """CRUD + operazioni applicative sui work item."""

    def list_items(
        self,
        db: Session,
        *,
        project_folder_id: UUID | None = None,
        workflow_type: str | None = None,
        status: str | None = None,
    ) -> list[WorkItem]:
        query = select(WorkItem)
        if project_folder_id is not None:
            query = query.where(WorkItem.project_folder_id == project_folder_id)
        if workflow_type:
            query = query.where(WorkItem.workflow_type == workflow_type)
        if status:
            query = query.where(WorkItem.status == status)
        query = query.order_by(desc(WorkItem.updated_at), desc(WorkItem.created_at))
        return list(db.scalars(query).all())

    def get_item(self, db: Session, item_id: UUID) -> WorkItem | None:
        return db.get(WorkItem, item_id)

    def create_item(self, db: Session, payload: WorkItemCreate) -> WorkItem:
        item = WorkItem(**payload.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def update_item(self, db: Session, item_id: UUID, payload: WorkItemUpdate) -> WorkItem | None:
        item = db.get(WorkItem, item_id)
        if not item:
            return None
        updates = payload.model_dump(exclude_unset=True)
        for key, value in updates.items():
            setattr(item, key, value)
        db.commit()
        db.refresh(item)
        return item

    def duplicate_item(self, db: Session, item_id: UUID) -> WorkItem | None:
        item = db.get(WorkItem, item_id)
        if not item:
            return None
        clone = WorkItem(
            title=f"{item.title} (copia)",
            workflow_type=item.workflow_type,
            status="draft",
            source_url=item.source_url,
            competitor_url=item.competitor_url,
            summary=item.summary,
            input_data=item.input_data,
            keyword_data=item.keyword_data,
            generated_output=item.generated_output,
            project_folder_id=item.project_folder_id,
        )
        db.add(clone)
        db.commit()
        db.refresh(clone)
        return clone

    def delete_item(self, db: Session, item_id: UUID) -> bool:
        item = db.get(WorkItem, item_id)
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True

