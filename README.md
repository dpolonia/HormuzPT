# HormuzPT

HormuzPT is a scenario-modeling environment for Portuguese energy-system exploration. The repository is structured for local development with Docker Compose and for controlled deployment to cloud infrastructure.

## Development entry points

- `AGENTS.md` contains operational guidance for coding agents and development assistants.
- `docs/product-spec.md` contains the technical product specification, architecture notes, API contracts, routing assumptions, and deployment context.
- `data/model_state_initial.json` contains the baseline model state used for validation and regression checking.

## Local development

### Prerequisites
- Docker and Docker Compose
- A local `.env` file derived from `.env.example`

### Quick start
1. Copy `.env.example` to `.env`
2. Fill in local development values
3. Start the stack in the background:
```bash
docker compose up -d
```
4. Verify the stack is up and healthy:
```bash
bash scripts/test_regression.sh
```
5. To stop the stack:
```bash
docker compose down
```

### Developer Handoff
For architecture specifics, current stubs, and prioritized next steps for incoming developers, please read `docs/developer-handoff.md` and `docs/product-spec.md`.

### Testing and QA
A lightweight test suite protects critical API boundaries and model baseline calculations. Keep this passing before committing:
```bash
bash scripts/test_regression.sh
```

Frontend UI components use **Vitest**. To run the component unit tests locally:
```bash
cd frontend
npm install # Ensure local dependencies are synced
npm run test
```

### Expected services
- Frontend (Vite/React): `http://localhost:8080`
- API proxy (Node/Express): `http://localhost:8081` — required: `ANTHROPIC_API_KEY` in `.env` for LLM, uses `better-sqlite3` for local history persistence.
- Recalibrator (Python/FastAPI): `http://localhost:8082`

## Repository layout

```text
.
├── AGENTS.md
├── README.md
├── docs/
│   └── product-spec.md
├── infra/
│   ├── lifecycle.json
│   └── secrets.sh
├── data/
│   └── model_state_initial.json
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Operational guidance

- Keep secrets out of version control.
- Treat `infra/secrets.sh` and deployment-oriented infrastructure actions as manual operations.
- Validate model changes against the baseline state before merging.

## Migration note
This repository previously used `CLAUDE.md` as the main agent-oriented instruction file. It now uses `AGENTS.md` as the neutral operational entry point, while `CLAUDE.md` remains as a compatibility bridge.
