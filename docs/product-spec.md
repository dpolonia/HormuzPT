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
   - Handles LLM integration (`/api/chat`) via a dynamically routed multi-provider client (OpenAI, Anthropic, Vertex AI).
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

## LLM Routing Policy
HormuzPT implements an explicit, multi-provider LLM routing policy (`api-proxy/src/llm/router.ts` and `recalibrator/src/llm/router.py`) to manage costs, latency, and capability requirements. The router selects the optimal model dynamically based on a rigid evaluation sequence:

1. **Environment Tiers**: Defaults map directly to `development` -> `baixo`, `test` -> `moderado`, and `production` -> `intenso`.
2. **Task Adjustments**: 
   - `frontend_qa` defaults to `moderado`.
   - Operational tasks (`backoffice_analysis`, `background_job`, `simple_extraction`, `summarization`) default to `baixo`.
   - `recalibration` guarantees a minimum of `moderado`.
   - Complex reasoning/synthesis guarantees `intenso`.
3. **Complexity Scaling**: `low` caps operational tasks at `baixo`; `medium` targets `moderado`; `high` escalates strictly to `intenso`.
4. **Cost & Latency Controls**: `development` and background tasks actively downgrade to `baixo`. Latency-sensitive requests cap workloads to `moderado`. Frontend Q&A strictly caps at `moderado` to prevent runaway costs from unintended user behavior.
5. **Provider Priorities**: The model map utilizes three cost-aligned tiers mapping identical capacity profiles across OpenAI, Anthropic, and Vertex. The standard fallback executes sequentially (`openai` -> `anthropic` -> `vertex`), except for the backend `recalibration` route which executes `vertex` first for native Python alignment.
6. **Fallback & Downgrading**: If a provider is unavailable, the router drops to the next available provider. It gracefully degrades the tier only if no same-tier replacements are available, logging a distinct warning if it overrides explicitly requested high-tier operations.

## Definition of done
A development change is considered complete only when:
1. The local stack starts successfully.
2. The affected service behaves as expected.
3. No secrets are introduced into version control.
4. Documentation remains aligned with the actual repository structure.
5. Baseline model behavior is revalidated when relevant.