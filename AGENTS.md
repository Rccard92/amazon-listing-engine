# AGENTS.md

## Project
This repository contains an AI-assisted Amazon listing optimization platform.

### MVP direction (manual-first, 2026)
Primary flow for the current MVP:
1. **Manual structured product input** (work item / form: product facts, benefits, keywords).
2. **Strategic enrichment** (optional LLM pass on structured data — not on scraped pages as the first step).
3. **AI generation of final Amazon outputs** (distinct pipelines: SEO title, bullets, description, backend keywords) via the listing generation orchestrator.

Legacy flows that **ingest or analyze Amazon product URLs** (fetch, parse, competitor prefill) remain in the codebase for optional reuse but are **disabled by default**:
- Backend: set `ENABLE_URL_INGESTION=true` to mount routers that expose `POST /api/v1/amazon/analyze` and `POST /api/v1/workflows/create-from-similar`. When disabled, those paths are **not registered** (clients see **404**, not a dedicated “disabled” JSON error).
- Frontend: `/competitor` and `/improve` **redirect to `/new-listing`** (MVP manuale-first); there is no separate UI flag for URL workflows in the current MVP shell.

Persisted **Fase 1** brief: `input_data.product_brief` (`PRODUCT_BRIEF_KEY`). **Fase 2** enrichment: `input_data.strategic_enrichment`. La strategia per la generazione è assemblata da questi due blocchi. Legacy: `input_data.manual_product_strategy` (`MANUAL_PRODUCT_STRATEGY_KEY`) se il brief nuovo non c’è. Regole copy centrali in root `DOGMA.md`, caricate da `app.core.dogma`.

### Historical use cases (still valid as product vision, not all MVP-primary)
1. Generate a new Amazon listing from structured product inputs. **(MVP primary)**
2. Improve an existing Amazon product listing starting from an Amazon product URL. **(Phase 2 / optional ingestion)**
3. Build a new listing starting from a competitor Amazon product page. **(Phase 2 / optional ingestion)**
4. Accept keywords both manually and via Helium10 CSV import.

## Current architecture goals
- Backend: FastAPI
- Database: PostgreSQL
- ORM: SQLAlchemy 2
- Migrations: Alembic
- Validation: Pydantic v2
- Deployment: Railway
- Frontend: Next.js + TypeScript
- Styling: Tailwind CSS

## Product principles
- The system must not be a generic text generator.
- The system must act as a listing engine with:
  - ingestion
  - normalization
  - scoring
  - generation
  - validation
- Separate data extraction, analysis, and generation logic.
- Prefer deterministic business rules where possible.
- Keep LLM usage isolated in dedicated services.

## Amazon URL analysis (optional / phase 2)
When `ENABLE_URL_INGESTION` is enabled, the following constraints apply (unchanged engineering intent):
- Only analyze a single user-provided Amazon URL at a time.
- Do not build mass crawling features.
- Use conservative rate limits.
- Add caching by ASIN.
- Stop on anti-bot or challenge responses.
- Build parsers with layered fallbacks:
  1. URL normalization
  2. ASIN extraction
  3. structured data parsing
  4. DOM parsing fallback
  5. normalized internal output

## Keyword ingestion
Support two keyword input modes:
1. manual keyword entry
2. Helium10 CSV upload and parsing

The application must normalize keywords into:
- primary keywords
- secondary keywords
- long-tail keywords
- backend-only keywords
- excluded/irrelevant keywords

## Required modules (domain map)
Design code so these domains are clearly separated. **MVP-critical today:** keyword handling, listing generation orchestrator, work items/projects, validation of generated sections. **Optional until URL ingestion is re-enabled:** amazon_url_service, amazon_fetcher, amazon_parser_*, amazon_normalizer, page ingestion, workflow create-from-similar.

- amazon_url_service
- amazon_fetcher
- amazon_parser_structured
- amazon_parser_dom
- amazon_normalizer
- helium10_csv_parser
- keyword_service
- listing_audit_service
- competitor_analysis_service
- listing_generation_service (implemented as `listing_generation` package + API)
- listing_scoring_service
- compliance_service

## Frontend UI principles
- The UI must feel modern, premium, clean, and conversion-oriented.
- Use rounded corners generously across the interface.
- Prefer 2xl rounded cards, inputs, modals, and section containers.
- Use soft shadows, strong spacing, and clear visual hierarchy.
- The design must be mobile-first and responsive.
- Avoid clutter and avoid legacy admin-dashboard aesthetics.
- Prefer a polished SaaS look.
- Build a visually attractive interface with card-based layout.
- Use modern upload areas, segmented controls, tabs, and step-based workflows.
- Forms should feel guided and simple.
- Keep components reusable and consistent.

## Engineering rules
- Prefer small focused modules.
- Prefer explicit typing everywhere.
- Avoid large files when possible.
- Add docstrings to service classes and key functions.
- Write code that is easy to test.
- Do not hide business logic inside route handlers.
- Routes should stay thin.
- Services contain business logic.
- Schemas contain request/response contracts.

## Testing expectations
For every non-trivial change:
- add or update tests
- run tests
- run lint/format checks
- report what was changed and what remains open

## Output behavior
When asked to implement a feature:
1. first analyze the current codebase
2. propose a concrete implementation plan with file-by-file changes
3. implement incrementally
4. run checks
5. summarize results, assumptions, and follow-up tasks

## Prompting behavior
- Do not jump straight into code for large tasks.
- Start with a brief plan.
- Surface assumptions explicitly.
- Prefer pragmatic MVP implementations first, extensible later.
