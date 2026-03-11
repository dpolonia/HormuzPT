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
3. Start the stack:

```bash

docker compose up
```

### Expected services
- Frontend: `http://localhost:8080`
- API proxy: `http://localhost:8081`
- Recalibrator: `http://localhost:8082`

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
