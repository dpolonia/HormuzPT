# Migration notes

## Objective
Move from a tool-specific `CLAUDE.md` workflow to a neutral `AGENTS.md` workflow suitable for AntiGravity-style development environments.

## Required repository actions
1. Add `AGENTS.md`.
2. Keep `CLAUDE.md` as a compatibility bridge.
3. Move operational files into `infra/` where appropriate.
4. Move baseline model artifacts into `data/` where appropriate.
5. Update `README.md` so it reflects the real structure.
6. Keep secrets and local runtime artifacts out of version control.

## Important caution
The placeholder `data/model_state_initial.json`, `infra/lifecycle.json`, `infra/secrets.sh`, and `docker-compose.yml` shown in this package should be reconciled against the repository’s real contents before replacing production-relevant files.
