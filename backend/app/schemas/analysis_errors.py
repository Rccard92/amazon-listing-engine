"""Codici errore pipeline analisi prodotto e messaggi utente (IT)."""

from typing import Literal

ErrorCode = Literal[
    "INVALID_URL",
    "UNSUPPORTED_MARKETPLACE",
    "ASIN_NOT_FOUND",
    "FETCH_TIMEOUT",
    "FETCH_HTTP_403",
    "FETCH_HTTP_429",
    "FETCH_HTTP_ERROR",
    "CHALLENGE_DETECTED",
    "EXTRACTION_EMPTY",
    "EXTRACTION_PARTIAL",
    "PARSER_ERROR",
    "OPENAI_NOT_CONFIGURED",
    "OPENAI_REQUEST_FAILED",
    "OPENAI_RATE_LIMIT",
    "AI_OUTPUT_INVALID",
]

EXTRACTION_STATUS = Literal["complete", "partial", "failed"]

ERROR_MESSAGES_IT: dict[str, str] = {
    "INVALID_URL": "L'indirizzo inserito non è valido.",
    "UNSUPPORTED_MARKETPLACE": "Dominio Amazon non supportato.",
    "ASIN_NOT_FOUND": "Non siamo riusciti a individuare il codice prodotto (ASIN) dal link.",
    "FETCH_TIMEOUT": "La pagina ha impiegato troppo tempo a rispondere. Riprova più tardi.",
    "FETCH_HTTP_403": "Accesso alla pagina negato. Amazon potrebbe limitare la visualizzazione automatica.",
    "FETCH_HTTP_429": "Troppe richieste verso Amazon. Attendi qualche minuto e riprova.",
    "FETCH_HTTP_ERROR": "Errore durante il caricamento della pagina.",
    "CHALLENGE_DETECTED": "Amazon ha mostrato un controllo anti-bot. Apri il link nel browser e riprova più tardi.",
    "EXTRACTION_EMPTY": "Pagina caricata ma non abbiamo estratto dati prodotto utili.",
    "EXTRACTION_PARTIAL": "Estrazione parziale: alcuni dati mancano; puoi continuare con cautela.",
    "PARSER_ERROR": "Errore nell'analisi della pagina.",
    "OPENAI_NOT_CONFIGURED": "Servizio di analisi AI non configurato sul server.",
    "OPENAI_REQUEST_FAILED": "L'analisi automatica non è riuscita. Riprova.",
    "OPENAI_RATE_LIMIT": "Limite richieste al servizio AI. Riprova tra poco.",
    "AI_OUTPUT_INVALID": "Risposta dell'AI non valida. Riprova.",
}


def message_for_code(error_code: str, fallback: str | None = None) -> str:
    return ERROR_MESSAGES_IT.get(error_code, fallback or "Si è verificato un errore imprevisto.")
