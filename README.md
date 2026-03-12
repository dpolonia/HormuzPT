# HormuzPT: Methodological and Technical Guide

## 1. Purpose and Scope

HormuzPT is an interactive scenario-modeling environment designed to explore the socioeconomic cascade of severe crude oil supply shocks on the Portuguese energy system. 

It addresses the analytical problem of rapidly visualizing the downstream effects of defined energy crises—such as blockades or embargoes—before deploying slower, closed-loop macroeconomic models. The system supports deterministic parameter-driven "what-if" analyses regarding fuel price evolution, demand destruction, and state intervention costs.

**Implemented Capability**: The current system can compute a deterministic 12-week pricing and volumetric cascade based on static baseline inputs and user-configurable elasticities. It can contextualize these outputs via dynamically routed Large Language Models (LLMs).
**Intended Future Capability**: Expanding from a static linear recovery heuristic to empirical recovery curves, storing analytical sessions across users via relational databases, and enforcing hard cost-governance limits on API access.
**Current Analytical Boundary**: The current version does not execute Computable General Equilibrium (CGE) calculations. It contains no economic feedback loops (e.g., inflation suppressing discretionary spending, which then recursively suppresses fuel demand). Reviewers should not infer predictive foresight or dynamic market equilibrium from the current prototype; it is an exploratory illustration of shock magnitude.

## 2. System Overview

HormuzPT deploys a three-tier microservice architecture orchestrated locally via Docker Compose.

*   **Frontend (Vite/React - Port 8080):** 
    *   **Role**: Interactive dashboard and execution environment for the quantitative cascade.
    *   **Main Inputs**: Scenario severity, behavioural elasticities, intervention thresholds.
    *   **Main Outputs**: Graphical 12-week trajectories (prices/volumes/costs) and the chat UI.
    *   **Dependencies**: Relies on API Proxy for LLM context and cost tracking.
    *   **Design Rationale**: Executes the core engine (`engine.ts`) synchronously in the browser to guarantee zero-latency reactivity during parameter exploration, decoupling math from network lag.
*   **API Proxy (Node/Express - Port 8081):** 
    *   **Role**: Orchestration gateway bridging the deterministic frontend to external stochastic intelligence.
    *   **Main Inputs**: Chat prompts, model state vectors, cost telemetry endpoints.
    *   **Main Outputs**: Multi-provider LLM text streams, SQLite event records, and calculated USD metrics.
    *   **Dependencies**: Upstream providers (OpenAI/Anthropic/Vertex), Recalibrator (`/model-state`), and an internal SQLite local volume.
    *   **Design Rationale**: Node.js is utilized for high I/O concurrency when mediating external REST streams and database execution.
*   **Recalibrator (Python/FastAPI - Port 8082):** 
    *   **Role**: Backend computational engine intended for heavy model execution.
    *   **Main Inputs**: Network requests for baseline states.
    *   **Main Outputs**: Currently serves the static JSON payload mapping the structural constants (`/model-state`).
    *   **Dependencies**: None currently; isolated container.
    *   **Design Rationale**: Exists as a decoupled service boundary to prepare the architecture for future SciPy/Pandas integration independently of the UI.
*   **SQLite/History Layer**: A localized file-based database (`history.sqlite`) managed by the API Proxy that captures asynchronous tracking of user queries and token costs.
*   **LLM Routing Layer**: A deterministic arbitration sequence (`router.ts`) deciding which upstream AI provider and tier to query based on environment, task complexity, and cost bounds.
*   **Docker Compose**: The local orchestrator (`docker-compose.yml`) responsible for binding these decoupled services, injecting environment variables natively via `.env`, and exposing ports to the host.

## 3. Repository Structure and Source of Truth

**Operational Guidance:**
*   `AGENTS.md`: Strict operational directives for autonomous coding agents.
*   `infra/`: Deployment-oriented scripts (e.g., `secrets.sh`) intended for manual execution, not automated CI/CD.

**Architecture and Specification:**
*   `README.md`: This file. The analytical and methodological appraisal guide.
*   `docs/product-spec.md`: The technical contract defining service boundaries, definition of done, and LLM orchestration logic.

**Baseline Validation Source (Normative):**
*   `data/model_state_initial.json`: The singular source-of-truth artifact determining the baseline equilibrium behavior.

**Runtime Configuration:**
*   `.env.example`: The schema isolating required execution variables, API keys, and pricing bounds.
*   `docker-compose.yml`: The internal networking map binding containers together.

**Implementation Code:**
*   `frontend/`: Contains the normative mathematical algorithms (`src/model/engine.ts`).
*   `api-proxy/`: Contains tracking, routing, and cost estimation orchestration.
*   `recalibrator/`: Python backend logic structures.

A new developer should look to `data/model_state_initial.json` for deterministic baseline behavior, `.env.example` to understand runtime configurations, and `docs/product-spec.md` to grasp architectural intent.

## 4. Baseline Model and Validation Artifact

`data/model_state_initial.json` is the sole structural baseline mechanism.

*   **Representation**: It represents the pre-crisis steady-state equilibrium of the Portuguese fuel market.
*   **Contained Values**: Hardcoded baseline fuel volumes (`weekly_l_gas`), base effective prices (`base_eff_gas`), statutory tax constants (`vat_rate`), and scenario shock multipliers (`mult_gas`, `mult_die`).
*   **System Usage**: The frontend `engine.ts` mathematically mutates these baseline assumptions based on slider inputs, while the backend Recalibrator serves this state to the LLM for contextual analysis.
*   **Source of Truth**: It is the definitive reference for mathematical regression. Test suites (`scripts/test_regression.sh`) assert future outputs against the specific integers locked in this file.
*   **Validation Protocol**: Any change to `engine.ts` or routing logic must preserve these outputs exactly (e.g., `severo_s4_dieEff` = 2.30348). Mathematical drift is unacceptable unless explicitly accompanied by an intentional methodological revision to this JSON artifact.

## 5. Calculation Logic — End-to-End

The structural computation operates entirely inside `frontend/src/model/engine.ts`. 

1.  **Scenario Start:** The frontend loads `data/model_state_initial.json` into a generic `ModelState` and merges it with user-manipulated `Controls` (e.g., severity = 'severo').
2.  **Baseline Definition:** Pure pretax components (`TAX_GAS`, `OTH_GAS`) are extracted by subtracting explicit state constants (`ext_gas`) from the `base_eff` prices.
3.  **Shock Introduction:** The maximum crisis price (`termGas`, `termDie`) is calculated by multiplying the base extraction cost (`ext_gas`) by the designated scenario severity multiplier (`mult_gas[scenario]`).
4.  **12-Week Evolution:** 
    *   *Escalada (W1-4):* Prices linearly interpolate from Baseline to Terminal Peak over three steps.
    *   *Plateau (W5-8):* Prices lock mechanically at the Terminal Peak.
    *   *Descompressão (W9-12):* Prices follow an inverted linear recovery back to Baseline.
5.  **Direct Effects (Government Cost):** If the calculated pump price exceeds the user's `threshold` variable, the state mathematically absorbs the VAT fraction of the delta. This creates the state discounted price (`descGovGas`).
6.  **Indirect Effects (Demand Destruction):** Pumping volumes (`volGas`) are calculated by compressing the baseline historical volume against the user's selected price elasticity multiplier (`elast_gas`) mapped to the percentage price increase.
7.  **Final Output Compilation:** Weekly total cost (`costGas`) is the product of the direct state discount (`descGovGas`) and the compressed market volume (`volGas`). The UI loops this logic to chart the cascade arrays.

**Analytical Distinctions:**
*   **Deterministic Calculations:** Weekly pricing interpolation and intervention discount math.
*   **Parameter-Driven:** Volume compression is driven tightly by the configurable `elast_gas`.
*   **Heuristic:** The assumption that crisis recovery (`Descompressão`) is perfectly linear and symmetrical to the escalation phase is a structural simplification. 
*   **LLM-Assisted Outputs:** The conversational text in the Chat tab interpreting the crisis. (The LLM executes zero math).
*   **Placeholder/Stubbed:** The Python Recalibrator currently acts as a mocked endpoint serving the static JSON without executing dynamic backend data-manipulation. 

A reviewer should recognize that the current system is an illustration of arithmetic cascades bounded by rigid parameters, making it more demonstrative of shock magnitude than a fully validated predictive model.

## 6. Static Links, Coefficients, and Embedded Assumptions

The system depends on strict static relationships that dictate its behavior:

*   **Fixed Coefficients (`model_state_initial.json`)**: Constants like `vat_rate` (23%) and `temp_isp_die` represent Portuguese baseline taxation. If statutory tax laws change, these hardcoded values must be manually patched, otherwise the baseline is invalid.
*   **Scenario Mappings (`model_state_initial.json`)**: `mult_gas` confines shock variance to predefined rigid limits (1.20, 1.35, 1.50). Reviewers should question why intermediate nonlinear shocks cannot be freely inputted.
*   **12-Week Horizon (`engine.ts`)**: Embedded tightly in TypeScript. It forces all crises to resolve completely in 84 days. This is an arbitrary proxy for an average embargo cycle and is poorly grounded empirically.
*   **LLM Tier Mappings (`api-proxy/.env.example`)**: Assumes specific API models exist (e.g., `OPENAI_MODEL_BAIXO=gpt-5-mini-2025-08-07`). If OpenAI deprecates this string, the proxy route will systematically fail.
*   **Cost Mappings (`api-proxy/.env`)**: Cost coefficients (`OPENAI_COST_INTENSO_INPUT_USD_PER_1M`) are manually hardcoded approximations of provider billing architectures. 

These static links mean the application's fidelity degrades strictly alongside the staleness of its configuration.

## 7. Dynamic Links and Runtime Dependencies

To trace application behaviour at runtime, understand the following dynamics:

*   **Frontend ⇄ API Proxy:** The LLM query (`POST /api/chat`) and statistical aggregation (`GET /api/stats/cost`) depend completely on internal `localhost` / `127.0.0.1` Docker networking bindings.
*   **API Proxy ⇄ Recalibrator:** The Q&A prompt fetches `/api/model-state` dynamically from the Python container inside Docker to compose the context prompt. If the Python container is down, chat context defaults to a blind placeholder error string.
*   **API Proxy ⇄ LLM Providers:** Output generation relies entirely upon synchronous, external internet access to OpenAI, Anthropic, or Vertex logic API endpoints. This is the primary fragility of the system.
*   **SQLite Persistence:** History tracking expects a localized volume mapping (`history.sqlite`). It is vulnerable to container shutdown loops that lack host volume persistence mappings.
*   **Runtime Dependency Execution:** 
    *   Quantitative graphs require zero live HTTP calls (Frontend isolates math natively).
    *   Chat answers depend exclusively on LLM provider availability and successful API key environment bindings.

## 8. LLM Routing and Model Policy

The `api-proxy/src/llm/router.ts` governs dynamic arbitration of AI traffic:

*   **Environment Defaults:** `development` targets `baixo` models; `production` defaults to `intenso`. 
*   **Task-Based Overrides:** Frontend user Q&A is strictly forced to `moderado` (e.g., `claude-sonnet-4-6`) to prevent extreme token spending from repetitive user behaviour. Backend extraction queries default to `baixo` (e.g., `gemini-3.1-flash-lite-preview`).
*   **Complexity Escalation:** Specific tasks flagged as `high` computationally force an upgrade to `intenso`. 
*   **Provider Ordering:** If parameters permit, the router queries providers sequentially: `openai` → `anthropic` → `vertex` (except recalibration routes, which favor `vertex`). 
*   **Fallback and Downgrades:** If `openai` times out, it queries `anthropic` at the identical tier. If the entire tier fails, it gracefully suppresses to the next lower tier, printing a console warning but allowing the app to survive.
*   **Frontend Disclosure:** The `ModelMeta` response block statically returns exactly which model serviced the request, visibly badging the UI so users know exactly what answered them.

**Methodological Reality:** Model targeting is heavily configuration-based. Upgrading to a newer `claude-opus` build is just an `.env` modification, but the fallback sequences are hardcoded into the TypeScript router. Route safety drifts materially if upstream providers alter their billing definitions of "mini" or "flash".

## 9. Cost Logic and Budget Tracking

Cost approximation operates natively inside `api-proxy/src/llm/pricing.ts`.

*   **Token Capture:** The router intercepts explicit `prompt_tokens` and `completion_tokens` directly from the generic upstream SDK responses.
*   **`cost_usd` Derivation:** Tokens are mathematically separated, divided by `1,000,000`, and multiplied by explicitly mapped environment variables (e.g., `OPENAI_COST_MODERADO_INPUT_USD_PER_1M` from `.env`).
*   **SQLite Storage:** The computed `cost_usd` is appended into a JSON payload and asynchronously executed as `INSERT INTO history_events` mapped to a `qna` action string.
*   **Aggregation and Limits:** `GET /api/stats/cost` runs a 7-day trailing `SUM` query against the SQLite architecture. The frontend divides this dynamic total against the passive environment constant `MAX_WEEKLY_LLM_COST_USD`.

**Limitations:** The `cost_usd` value is a mathematically accurate internal estimate based on your configuration, but it is fundamentally disconnected from live provider billing APIs. A reviewer must realize this dashboard is **observational, not enforcing**. The backend Express router does not physically contain circuit breakers (e.g., HTTP 402) to block queries if you breach 100% boundary.

## 10. History, Persistence, and Auditability

*   **Current Storage:** The `history_events` SQLite table synchronously records ISO timestamps, action strings (`qna`), and stringified JSON payload configurations (`details`). 
*   **Usage**: It allows dashboard queries to visualize volumetric click events and quantitative token spending.
*   **Reconstruction Reality**: The current audit trail proves exactly *what was asked*, *when*, and *how much the engine estimated it cost*. However, because LLMs are stochastic generation engines, the audit trail **cannot** perfectly reconstruct the identical string output of the insight generated. 
*   **Design Weaknesses:** The SQLite deployment is entirely container-bound inside `api-proxy`. It is an exploratory mockup of persistence. In a catastrophic container redeployment, the historical timeline will be irreparably lost unless a physical host bind-mount is executed.

## 11. Evidence, Explainability, and Critical Appraisal

A critical review of this repository must acknowledge the following structural heuristics:

*   **A reviewer should question** the rigidity of the behavioural demand destruction (`elast_gas`). Treating short-term panic elasticity linearly against localized pump shocks ignores real-world psychological stockpiling behaviours.
*   **This currently assumes** the state possesses infinite liquidity to buffer prices. The lack of a macro-fiscal debt ceiling means `cumCost12` generates physically unrealistic state expenditure scenarios at extreme parameter bounds. The model assumes infinite fiscal capability.
*   **This output should not yet be interpreted as** predictive econometric foresight. The quantitative cascade is a deterministic arithmetic toy model. It is designed to frame qualitative LLM queries rather than provide bank-grade CGE output data.
*   **Lightly Tested:** While component tests exist for core algorithm bounds against the baseline artifact, edge-case network fallbacks internally (e.g., Anthropic to Vertex chain downgrading) are primarily stubbed or weakly verified in runtime testing. The Python Recalibrator is explicitly stubbed. 

## 12. Development and Validation Workflow

1.  **Configuration:** Copy `.env.example` to `.env`. Ensure `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` are populated. 
2.  **Start Stack:** `docker compose up -d`
3.  **Inspect Health:** Target `http://localhost:8081/health` and `http://localhost:8082/model-state` manually.
4.  **Inspect Logs:** `docker compose logs api-proxy -f`
5.  **Run Regression Tests:** `bash scripts/test_regression.sh` ensures engine math aligns with `model_state_initial.json` bounds.
6.  **Run Frontend Tests:** `cd frontend && npm run test` executes Vitest UI component boundary checks.
7.  **Validate Model Changes:** Modify `engine.ts`, then manually verify that graphical inflection points match the defined baseline inputs without breaking the script pipeline.
8.  **Stop Stack:** `docker compose down`

## 13. Production Readiness of the Current Configuration

The current repository uses structured microservices suitable for isolated scale, but **is NOT promotable to production in its current form.**

**Promotable Logic:**
*   Stateless React frontend architecture.
*   LLM failover router logic mapping generic SDKs natively into abstract tiers.

**Not Yet Production-Ready Because:** 
*   **Secret Hydration:** Development tightly binds to an orchestrated `.env` file mapping. Production mandates migrating to dynamically-injected secret managers (e.g., Google Secret Manager or Docker Swarm Secrets/Configs).
*   **Vertex / GCP Bindings:** The Vertex configuration locally assumes Application Default Credentials (ADC) are securely mapped. The Docker implementation lacks the required volume mounts `~/.config/gcloud` to actually access Vertex cleanly outside of isolated explicit APIs.
*   **Persistence:** The `history.sqlite` file is container-bound and will systematically shred during horizontal scaling iterations. It lacks proper external PostgreSQL migration configuration.
*   **Auth and Governance:** 100% of routes are publicly exposed locally. There is currently no JWT session orchestration or 402/Cost-Blocking algorithm to govern bad actors breaching the `MAX_WEEKLY_LLM_COST_USD` ceiling.

## 14. Prioritized Improvement Areas

Subsequent development sprints should tackle weaknesses hierarchically:

1.  **Model Fidelity (Analytical CGE):** 
    *   *Why it matters:* The 12-week symmetric "up/down" escalation block is heuristically fragile. Integrating external Python SciPy econometric libraries inside the Recalibrator will vastly out-perform React-side static JS linear interpolation constraints.
2.  **Cost Governance (API Hardening):** 
    *   *Why it matters:* The lack of physical API blockage allows infinite spending loops. We must convert the observational `/cost` UI warning into a strict `Express` middleware circuit breaker.
3.  **Persistence/Auditability (Data Scaling):** 
    *   *Why it matters:* Local container-bound SQLite risks imminent data loss. We must execute a database migration towards structured PostgreSQL instances with physical host/volume mappings to protect session history across lifecycle auto-scaling events.
4.  **Frontend Transparency:** 
    *   *Why it matters:* LLMs execute against the true numerical matrix internally, yet the frontend primarily visualizes abstracted cost totals. We must surface these deep parameters (e.g., discrete volumetric losses) cleanly into the React DOM so that users can instantly critique the underlying calculation logic without querying the AI.
