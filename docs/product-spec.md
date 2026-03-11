# Product specification — HormuzPT

## Purpose
HormuzPT supports energy-scenario exploration for Portugal through an interactive application composed of a frontend, an API orchestration layer, and a model recalibration engine.

## System architecture
The platform is composed of three main services:

1. **Frontend**
   - User-facing interface for scenario definition, execution, and result inspection.
   - Runs locally on port `8080` in development.

2. **API proxy**
   - Mediates requests between the frontend and downstream services.
   - Handles LLM integration (`/api/chat`) via Anthropic Claude.
   - Manages local persistence for user sessions (`/api/history`) via SQLite.
   - Runs locally on port `8081` in development.

3. **Recalibrator**
   - Executes model-related recalibration and scenario computation logic.
   - Runs locally on port `8082` in development.

## Development model
Local development is driven by Docker Compose. A local `.env` file is used for development-only configuration. Secrets and deployment credentials must never be committed.

## Configuration model
- `.env.example` provides placeholders only.
- `.env` is local-only. Must contain `ANTHROPIC_API_KEY` for chat functionality.
- Production secrets should be handled through managed secret infrastructure rather than repository files.

## Validation model
`data/model_state_initial.json` is the baseline model-state artifact and should be used for regression checks and reference-value validation. Any change to the engine, routing, parameters, or scenario logic must preserve documented reference behavior unless an intentional model revision is being introduced.

## Operational boundaries
The following files are operational and should not be run automatically by coding agents:
- `infra/secrets.sh`
- deployment scripts
- production secret provisioning steps

## Documentation policy
Agent instructions belong in `AGENTS.md`. Product architecture, service contracts, and deployment notes belong in `docs/product-spec.md`. User-facing repository guidance belongs in `README.md`.

## Definition of done
A development change is considered complete only when:
1. The local stack starts successfully.
2. The affected service behaves as expected.
3. No secrets are introduced into version control.
4. Documentation remains aligned with the actual repository structure.
5. Baseline model behavior is revalidated when relevant.