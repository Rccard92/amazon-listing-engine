"""Fetcher Amazon isolato e conservativo."""

import time
from dataclasses import dataclass

import httpx

from app.core.config import get_settings


class AmazonFetchError(RuntimeError):
    """Errore fetch pagina Amazon."""


class AmazonFetchChallengeError(AmazonFetchError):
    """Challenge/anti-bot rilevato nella risposta."""


@dataclass(frozen=True)
class FetchedPage:
    """Payload HTML fetchato."""

    url: str
    status_code: int
    html: str


class AmazonFetcher:
    """Client HTTP con configurazione conservativa e hook futuri."""

    def __init__(self) -> None:
        self.settings = get_settings()

    def fetch_product_page(self, url: str) -> FetchedPage:
        """Fetch sincrono con retry limitato."""
        headers = {
            "User-Agent": self.settings.amazon_fetch_user_agent,
            "Accept-Language": "en-US,en;q=0.9,it;q=0.8",
        }
        timeout = self.settings.amazon_fetch_timeout_seconds
        last_exc: Exception | None = None

        for attempt in range(self.settings.amazon_fetch_max_retries + 1):
            try:
                with httpx.Client(timeout=timeout, follow_redirects=True, headers=headers) as client:
                    response = client.get(url)
                if response.status_code >= 400:
                    raise AmazonFetchError(f"Errore HTTP durante fetch Amazon: {response.status_code}")
                html = response.text
                self._raise_if_challenge(html)
                return FetchedPage(url=str(response.url), status_code=response.status_code, html=html)
            except (httpx.HTTPError, AmazonFetchError) as exc:
                last_exc = exc
                if attempt < self.settings.amazon_fetch_max_retries:
                    time.sleep(self.settings.amazon_fetch_min_delay_ms / 1000)

        raise AmazonFetchError("Fetch Amazon fallito.") from last_exc

    @staticmethod
    def _raise_if_challenge(html: str) -> None:
        lower_html = html.lower()
        challenge_markers = (
            "captcha",
            "enter the characters you see below",
            "automated access",
            "robot check",
        )
        if any(marker in lower_html for marker in challenge_markers):
            raise AmazonFetchChallengeError("Challenge anti-bot rilevato.")

