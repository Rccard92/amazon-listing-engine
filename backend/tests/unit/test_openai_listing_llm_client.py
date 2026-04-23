import sys
import types

from app.core import config
from app.services.listing_generation.openai_llm_client import OpenAIListingLLMClient


class _FakeMessage:
    def __init__(self, content: str) -> None:
        self.content = content


class _FakeChoice:
    def __init__(self, content: str) -> None:
        self.message = _FakeMessage(content)


class _FakeCompletion:
    def __init__(self, content: str) -> None:
        self.choices = [_FakeChoice(content)]


class _FakeCompletions:
    def create(self, **kwargs):  # noqa: ANN003
        if "max_completion_tokens" in kwargs:
            raise TypeError("unexpected keyword argument 'max_completion_tokens'")
        return _FakeCompletion("Titolo test")


class _FakeOpenAIClient:
    def __init__(self, **_kwargs):  # noqa: ANN003
        self.chat = types.SimpleNamespace(completions=_FakeCompletions())


def test_listing_client_fallbacks_to_max_tokens(monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    config.get_settings.cache_clear()
    fake_openai_module = types.SimpleNamespace(
        APIError=Exception,
        APITimeoutError=Exception,
        OpenAI=_FakeOpenAIClient,
    )
    monkeypatch.setitem(sys.modules, "openai", fake_openai_module)
    try:
        out = OpenAIListingLLMClient().generate_text(
            system_prompt="sys",
            user_prompt="usr",
            max_output_tokens=128,
        )
        assert out == "Titolo test"
    finally:
        config.get_settings.cache_clear()

