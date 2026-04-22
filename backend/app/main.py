"""Punto di ingresso FastAPI."""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import build_api_router
from app.core.config import get_settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Hook ciclo vita (connessioni pool, warm-up) — MVP vuoto."""
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    cors_origins = settings.cors_origins_list
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS origins configurate: %s", cors_origins)
    application.include_router(build_api_router(), prefix=settings.api_v1_prefix)
    return application


app = create_app()
