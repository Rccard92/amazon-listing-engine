"""Schema keyword planning (pre-content) e input per backend terms finali."""

from pydantic import BaseModel, Field


class SemanticCluster(BaseModel):
    name: str = ""
    keywords: list[str] = Field(default_factory=list)


class KeywordPlanning(BaseModel):
    keyword_primaria_finale: str = ""
    keyword_secondarie_prioritarie: list[str] = Field(default_factory=list)
    cluster_semantici: list[SemanticCluster] = Field(default_factory=list)
    parole_da_spingere_nel_frontend: list[str] = Field(default_factory=list)
    parole_da_tenere_per_backend: list[str] = Field(default_factory=list)
    note_su_keyword_da_non_forzare: list[str] = Field(default_factory=list)


class GeneratedFrontendContent(BaseModel):
    seo_title: str | None = None
    bullets: list[str] = Field(default_factory=list)
    description: str | None = None
