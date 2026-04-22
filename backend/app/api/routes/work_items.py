"""Route API per work item e cronologia."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.work_item import WorkItemCreate, WorkItemRead, WorkItemUpdate
from app.services.work_item_service import WorkItemService

router = APIRouter()
service = WorkItemService()


@router.get("/work-items", response_model=list[WorkItemRead])
def list_work_items(
    db: Session = Depends(get_db),
    project_folder_id: UUID | None = Query(default=None),
    workflow_type: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[WorkItemRead]:
    items = service.list_items(
        db,
        project_folder_id=project_folder_id,
        workflow_type=workflow_type,
        status=status_filter,
    )
    return [WorkItemRead.model_validate(i) for i in items]


@router.get("/work-items/{item_id}", response_model=WorkItemRead)
def get_work_item(item_id: UUID, db: Session = Depends(get_db)) -> WorkItemRead:
    item = service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elemento non trovato.")
    return WorkItemRead.model_validate(item)


@router.post("/work-items", response_model=WorkItemRead, status_code=status.HTTP_201_CREATED)
def create_work_item(payload: WorkItemCreate, db: Session = Depends(get_db)) -> WorkItemRead:
    return WorkItemRead.model_validate(service.create_item(db, payload))


@router.patch("/work-items/{item_id}", response_model=WorkItemRead)
def update_work_item(item_id: UUID, payload: WorkItemUpdate, db: Session = Depends(get_db)) -> WorkItemRead:
    item = service.update_item(db, item_id, payload)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elemento non trovato.")
    return WorkItemRead.model_validate(item)


@router.post("/work-items/{item_id}/duplicate", response_model=WorkItemRead, status_code=status.HTTP_201_CREATED)
def duplicate_work_item(item_id: UUID, db: Session = Depends(get_db)) -> WorkItemRead:
    item = service.duplicate_item(db, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elemento non trovato.")
    return WorkItemRead.model_validate(item)


@router.delete("/work-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_work_item(item_id: UUID, db: Session = Depends(get_db)) -> None:
    ok = service.delete_item(db, item_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elemento non trovato.")


@router.get("/history", response_model=list[WorkItemRead])
def history(db: Session = Depends(get_db)) -> list[WorkItemRead]:
    items = service.list_items(db)
    return [WorkItemRead.model_validate(i) for i in items]

