# HormuzPT — Dashboard de Cenários Energéticos para Portugal

Dashboard interactivo que modela o impacto de um bloqueio segurador do Estreito de Ormuz sobre os preços dos combustíveis, o mix energético e o Orçamento de Estado portugueses.

## Funcionalidades

- **Modelo de cenários** (Moderado / Severo / Extremo) com preços, elasticidade da procura e custo orçamental para 4-12 semanas
- **Dados ao vivo** de INE, Banco de Portugal, BCE, Eurostat, API Aberta e ENSE-EPE
- **Mix energético completo**: combustíveis rodoviários + gás natural (MIBGAS/TTF) + electricidade (OMIE)
- **Recalibração semanal** com pipeline multi-LLM (Anthropic, OpenAI, Vertex AI) + evidência Scopus
- **Página de histórico** com justificação académica de todas as alterações
- **Q&A interactivo** com indicação do modelo LLM utilizado

## Arquitectura

```
frontend/       → React + TypeScript + Vite (Cloud Run :8080)
api-proxy/      → Node + Express (Cloud Run :8081)
recalibrator/   → Python + FastAPI (Cloud Run :8082)
```

## Quickstart (desenvolvimento local)

```bash
cp .env.example .env
# Editar .env com chaves reais
docker compose up
```

- Frontend: http://localhost:8080
- API: http://localhost:8081
- Recalibrador: http://localhost:8082

## Deploy no GCP

```bash
bash infra/secrets.sh   # 1 vez: provisionar Secret Manager
bash deploy.sh           # Build + deploy dos 3 serviços + schedulers
```

## Projecto GCP

- **Project ID**: `hormuzpt`
- **Region**: `europe-west1`

## Documentação

- `CLAUDE.md` — Prompt completo para Claude Code (especificação técnica exaustiva)
- `data/model_state_initial.json` — Estado inicial do modelo com valores verificados

## Autor

Daniel Ferreira Polónia | dpolonia@gmail.com

## Licença

CC BY-NC-SA 4.0 (modelo). Dados das APIs sujeitos às licenças das entidades emissoras.
