from fastapi.testclient import TestClient

from app.api.routes import workflows
from app.main import create_app
from app.schemas.analysis_exceptions import AnalysisPipelineError
from app.services.workflow_create_from_similar_service import WorkflowCreateFromSimilarError


def test_create_from_similar_returns_clean_422_on_service_error(monkeypatch, enable_url_ingestion) -> None:
    class FakeService:
        def execute(self, db, payload):  # noqa: ANN001
            raise WorkflowCreateFromSimilarError("Dati bozza non validi durante il salvataggio.")

    monkeypatch.setattr(workflows, "service", FakeService())
    client = TestClient(create_app())
    response = client.post(
        "/api/v1/workflows/create-from-similar",
        json={"competitor_url": "https://www.amazon.it/dp/B08N5WRWNW"},
    )

    assert response.status_code == 422
    assert "Dati bozza non validi" in response.json()["detail"]


def test_create_from_similar_returns_structured_detail_on_pipeline_error(monkeypatch, enable_url_ingestion) -> None:
    class FakeService:
        def execute(self, db, payload):  # noqa: ANN001
            raise AnalysisPipelineError("INVALID_URL", http_status=422)

    monkeypatch.setattr(workflows, "service", FakeService())
    client = TestClient(create_app())
    response = client.post(
        "/api/v1/workflows/create-from-similar",
        json={"competitor_url": "https://www.amazon.it/dp/B08N5WRWNW"},
    )

    assert response.status_code == 422
    body = response.json()["detail"]
    assert body["error_code"] == "INVALID_URL"
    assert "message_it" in body

