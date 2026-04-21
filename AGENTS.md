# AGENTS.md

## Project
This repository contains an AI-assisted Amazon listing optimization platform.

Primary goal:
Build a production-ready web application that helps create and improve Amazon product listings.

Core use cases:
1. Generate a new Amazon listing from structured product inputs.
2. Improve an existing Amazon product listing starting from an Amazon product URL.
3. Build a new listing starting from a competitor Amazon product page.
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

## Amazon URL analysis constraints
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

## Required modules
Design code so these domains are clearly separated:
- amazon_url_service
- amazon_fetcher
- amazon_parser_structured
- amazon_parser_dom
- amazon_normalizer
- helium10_csv_parser
- keyword_service
- listing_audit_service
- competitor_analysis_service
- listing_generation_service
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