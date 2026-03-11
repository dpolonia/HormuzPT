# Developer Handoff — HormuzPT

## Overview & Architecture
HormuzPT is a dashboard simulating the economic and social impacts of energy price shocks in Portugal. The application is composed of three main services orchestrated via `docker compose`:

1.  **Frontend (Port 8080)**: React/Vite/TypeScript client. Contains the central user interface, model projection logic (`src/model/engine.ts`), and static content parameters.
2.  **API Proxy (Port 8081)**: Node.js/Express server mediating calls to downstream LLM/analysis services (like Scopus/Anthropic, though currently using mocks or stubs).
3.  **Recalibrator (Port 8082)**: Python/FastAPI service responsible for complex external mathematical/economic calibrations (currently placeholder behavior).

### Working Status
- **What's working:** The interactive 12-week scenario projections (Moderado, Severo, Extremo), the UI layout, state persistence, impact comparisons, and cascade presentation.
- **Source of Truth:** The `data/model_state_initial.json` file dictates the baseline assumptions, prices, elasticities, and vat rates used by the engine.

## Stubs and Risks
- **LLM/Chat Integrations:** The chat interface (`/api/chat`) and background reporting currently rely on stubs or mock endpoints in `api-proxy`.
- **Recalibrator Logic:** The recalibration endpoints exist and are healthy, but their actual mathematical calibration logic requires implementation.
- **External Dependencies:** Future Scopus or Anthropic API integration needs proper secrets management (the `.env` file should be populated from `.env.example`).
- **QA:** Only lightweight smoke and shape-level regression checks are active. Deep functional testing of React components is missing.

## Local Workflow & Startup
1.  **Environment Check**: Copy `.env.example` to `.env` if not already present.
2.  **Start Services**: `docker compose up -d` (or `--build` if you've changed Dockerfiles).
3.  **Access App**: Navigate to `http://localhost:8080`.

## Running the Regression Suite
Instead of introducing a heavy E2E framework at this stage, the project uses a focused smoke-testing script to protect critical endpoints and baseline computations.

**Command:**
```bash
./scripts/test_regression.sh
```

**What it tests:**
- Reachability of Frontend (`:8080`), API Proxy (`:8081`), and Recalibrator (`:8082`).
- The API shape of `/api/model-state` ensuring critical attributes exist.
- Validation of the core `engine` computations, ensuring S4 peak assumptions drift hasn't occurred vs the initial JSON.

*(The command stops and prints a distinct error if any regression is caught).*

## Prioritized Next-Step Backlog

### Critical & Immediate
1.  **Recalibrator implementation**: Switch the `/recalibrate` endpoint from stubs to the actual Python economic models.
2.  **API Proxy fidelity**: Connect the mock AI completions in `api-proxy/src/routes/chat.ts` to Anthropic models cleanly without UI blocking.

### Medium-Priority Improvements
1.  **Evidence/Provenance links**: Ensure cascade effects dynamically link to explicit external literature references instead of hardcoded statements.
2.  **History/Audit trail generation**: The History view (`<HistoryPage />`) should pull from an actual persistence layer (e.g., Redis or SQLite) rather than static data.

### Future Enhancements
1.  **Frontend QA Framework**: If UI components become more brittle, introduce Jest/Vitest for unit-level assertion of isolated components before reaching browser automation.
2.  **Telemetry**: Basic request latency metrics on the API Proxy.
