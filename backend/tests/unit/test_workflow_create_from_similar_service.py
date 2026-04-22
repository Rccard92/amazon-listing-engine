from app.services.workflow_create_from_similar_service import (
    WORK_ITEM_TITLE_MAX_LEN,
    WorkflowCreateFromSimilarService,
)


def test_internal_title_is_trimmed_and_truncated() -> None:
    service = WorkflowCreateFromSimilarService()
    raw = (
        "Titolo lunghissimo con molte parole e dettagli che superano di molto il limite previsto per il titolo "
        "interno del work item - Amazon.it | Categoria Casa e Cucina"
    )

    title = service._build_internal_work_item_title(raw, "B08N5WRWNW")

    assert "Amazon.it" not in title
    assert len(title) <= WORK_ITEM_TITLE_MAX_LEN


def test_internal_title_fallback_when_missing() -> None:
    service = WorkflowCreateFromSimilarService()
    title = service._build_internal_work_item_title(None, "B08N5WRWNW")
    assert title == "Bozza da prodotto simile (B08N5WRWNW)"

