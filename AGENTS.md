# AGENTS.md — HormuzPT

## Context
HormuzPT is a Portugal energy-scenario modeling project with a React frontend, a Node API proxy, and a Python recalibrator service.

## Local bootstrap
1. Work from the repository root.
2. If `.env` does not exist, copy `.env.example` to `.env`.
3. Start the stack with `docker compose up`.
4. Confirm services are reachable on frontend `:8080`, API `:8081`, and recalibrator `:8082`.

## Constraints
- Never commit `.env`, real API keys, service-account files, or local secret material.
- Do not run deployment scripts or secret-provisioning scripts unless explicitly requested.
- Treat `data/model_state_initial.json` as a control artifact.
- Do not change the model engine without revalidating reference values.

## Required validation
Any change affecting model logic, parameters, routing, or API behavior must be validated against the reference values documented in `data/model_state_initial.json` and the product specification.

## Sources of truth
- `README.md` for quickstart and repository layout.
- `docs/product-spec.md` for architecture, APIs, routing, and deployment behavior.
- `data/model_state_initial.json` for baseline parameters and validation checks.

## Working style
- Prefer minimal, reversible changes.
- Keep documentation aligned with the real repository structure.
- When paths in docs and code diverge, fix the docs or move the files so both match.