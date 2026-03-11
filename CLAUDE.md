# CLAUDE.md — HormuzPT: Dashboard de Cenários Energéticos para Portugal

> **Prompt definitivo para Claude Code.** Este ficheiro substitui e consolida todos os prompts anteriores (v1, v2, v3 e adenda). É auto-contido — não requer leitura de outros documentos.

---

## 0. SETUP INICIAL

### 0.1 Ambiente de trabalho

```
Directório:  /home/dpolonia/HormuzPT
Repositório: https://github.com/dpolonia/HormuzPT
GCP Project: hormuzpt (ID), 487878867028 (number)
Billing:     Activo
Owner:       dpolonia@gmail.com
Region:      europe-west1
```

### 0.2 Primeiras acções do Claude Code

```bash
cd /home/dpolonia/HormuzPT
git pull origin main

# 1. Criar .env a partir do template (se não existir)
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Criado .env — editar com chaves reais antes de continuar"
fi

# 2. Verificar .gitignore protege .env
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore

# 3. Instalar dependências de cada serviço
(cd frontend && npm install)
(cd api-proxy && npm install)
(cd recalibrator && pip install -r requirements.txt)
```

### 0.3 Ficheiro `.env` (NUNCA comitar — protegido por .gitignore)

O ficheiro `.env` na raiz do projecto contém todas as chaves. Cada serviço lê apenas as que precisa. Em produção, estas chaves vivem no GCP Secret Manager — o `.env` é apenas para desenvolvimento local.

```bash
# ─── .env ─── NÃO COMITAR ───
# Copiar para .env e preencher com chaves reais

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXX

# OpenAI
OPENAI_API_KEY=sk-proj-XXXXXXXX

# Google / Vertex AI
GOOGLE_CLOUD_PROJECT=hormuzpt
VERTEX_AI_API_KEY=AQ.XXXXXXXX
VERTEX_AI_LOCATION=europe-west1
VERTEX_SA=vertex-express@hormuzpt.iam.gserviceaccount.com

# HuggingFace
HUGGINGFACE_API_KEY=hf_XXXXXXXX

# Scopus (Elsevier)
SCOPUS_API_KEY=XXXXXXXX

# API Aberta (combustíveis PT)
APIABERTA_API_KEY=ak_xdfxK8a1nHzD1Hl-virWIn1-Oq4tBmpr

# GCS Cache
GCS_BUCKET=hormuzpt-hormuz-cache

# Ambiente
HORMUZ_ENV=development
# Em produção: HORMUZ_ENV=production

# Custo máximo semanal LLMs (USD)
MAX_WEEKLY_LLM_COST_USD=50
```

### 0.4 Ficheiro `.env.example` (comitável — sem chaves reais)

```bash
# ─── .env.example ─── TEMPLATE ───
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
GOOGLE_CLOUD_PROJECT=hormuzpt
VERTEX_AI_API_KEY=YOUR_KEY_HERE
VERTEX_AI_LOCATION=europe-west1
VERTEX_SA=vertex-express@hormuzpt.iam.gserviceaccount.com
HUGGINGFACE_API_KEY=hf_YOUR_KEY_HERE
SCOPUS_API_KEY=YOUR_KEY_HERE
APIABERTA_API_KEY=YOUR_KEY_HERE
GCS_BUCKET=hormuzpt-hormuz-cache
HORMUZ_ENV=development
MAX_WEEKLY_LLM_COST_USD=50
```

### 0.5 Ficheiro `.gitignore`

```gitignore
# Secrets
.env
.env.local
.env.*.local

# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/
venv/

# Build
frontend/dist/
api-proxy/dist/
recalibrator/dist/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# GCP
*.key.json
service-account*.json

# Cache local
.cache/
*.log
```

---

## 1. OBJECTIVO

Construir e deployar na **Google Cloud Platform** uma aplicação web que:

1. **Modela cenários de preços** de combustíveis sob um bloqueio segurador do Estreito de Ormuz (4-12 semanas) — cálculo determinístico client-side
2. **Integra dados ao vivo** de 8+ APIs públicas portuguesas e europeias (INE, BPstat, BCE, Eurostat, dados.gov.pt, API Aberta, ENSE-EPE, MIBGAS/OMIE)
3. **Recalibra-se semanalmente** usando 4 LLMs em pipeline (Anthropic, OpenAI, Vertex AI, HuggingFace) + evidência Scopus
4. **Documenta todas as alterações** numa página pública de Changes History com justificação académica
5. **Oferece Q&A interactivo** onde o utilizador faz perguntas ao modelo, com indicação do LLM utilizado
6. **Cobre o mix energético completo**: combustíveis rodoviários + gás natural (MIBGAS/TTF) + electricidade (OMIE)

---

## 2. ARQUITECTURA

```
/home/dpolonia/HormuzPT/
├── .env                          # Chaves (NUNCA comitar)
├── .env.example                  # Template (comitável)
├── .gitignore
├── CLAUDE.md                     # Este ficheiro
├── README.md
├── docker-compose.yml            # Dev local
├── deploy.sh                     # Deploy GCP unificado
├── infra/
│   ├── lifecycle.json            # GCS auto-delete 30 dias
│   └── secrets.sh                # Provisionar Secret Manager
│
├── frontend/                     # → Cloud Run (hormuz-frontend) :8080
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── config.ts
│       ├── model/                # Motor de cálculo client-side
│       │   ├── engine.ts         # Fórmulas (12 semanas, 3 fases)
│       │   ├── types.ts          # ModelState, Controls, Results
│       │   ├── cascade.ts        # 18 efeitos por ordem
│       │   └── budget.ts         # Projecção OE 2026/2027/2028
│       ├── api/                  # Hooks de dados ao vivo
│       │   ├── client.ts
│       │   ├── useModelState.ts
│       │   ├── useContextData.ts
│       │   ├── useEnergyData.ts
│       │   ├── useBudgetData.ts
│       │   └── useComparisonData.ts
│       ├── components/
│       │   ├── layout/           # Shell, Sidebar, Header, Footer
│       │   ├── controls/         # ControlPanel, sliders, dropdowns
│       │   ├── model/            # PriceDashboard, CostDashboard, Cascade, etc.
│       │   ├── context/          # MacroPanel, EnergyPanel, EnergyMixPanel, etc.
│       │   ├── history/          # HistoryPage, ChangeEntry, ParameterDiff
│       │   ├── chat/             # ModelChat (Q&A com badge de modelo)
│       │   └── common/           # Card, Metric, MiniChart, StatusDot
│       └── hooks/
│           ├── useModel.ts
│           └── useApiStatus.ts
│
├── api-proxy/                    # → Cloud Run (hormuz-api-proxy) :8081
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── config.ts
│       ├── middleware/           # cors, cache, rateLimit
│       ├── providers/           # ine, bpstat, ecb, eurostat, dadosgov, apiaberta, ense
│       ├── services/            # macro, energy, budget, chat
│       ├── routes/              # context, energy, budget, comparison, fuel-prices,
│       │                        # energy-mix, price-decomposition, model-state,
│       │                        # history, chat, refresh, health
│       └── utils/               # gcs, transform, fallback
│
├── recalibrator/                 # → Cloud Run (hormuz-recalibrator) :8082
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       ├── main.py              # FastAPI
│       ├── config.py
│       ├── pipeline/            # orchestrator, data_collector, analyst,
│       │                        # evidence, validator, writer, applier
│       ├── llm/                 # router, anthropic, openai, vertex, huggingface
│       ├── scopus/              # client, queries
│       ├── storage/             # gcs, firestore
│       └── models/              # state, proposal, evidence, changelog
│
└── data/                         # Dados de referência (comitáveis)
    ├── model_state_initial.json  # Estado inicial do modelo
    ├── cascade.json              # 18 efeitos (para fallback)
    └── budget_baseline.json      # Dados OE 2026
```

### Serviços GCP

| Serviço | Nome | Config |
|---------|------|--------|
| Cloud Run (frontend) | `hormuz-frontend` | nginx, 256Mi, público, :8080 |
| Cloud Run (api-proxy) | `hormuz-api-proxy` | Node 20, 512Mi, público, :8081 |
| Cloud Run (recalibrator) | `hormuz-recalibrator` | Python 3.12, 1Gi, privado, :8082, timeout 600s |
| Cloud Storage | `hormuzpt-hormuz-cache` | Standard, europe-west1 |
| Cloud Scheduler | `hormuz-daily-refresh` | `0 6 * * *` → api-proxy `/api/refresh` |
| Cloud Scheduler | `hormuz-weekly-recal` | `0 4 * * 0` → recalibrator `/recalibrate` |
| Secret Manager | 7 segredos | Todas as API keys |

---

## 3. MOTOR DE CÁLCULO (client-side)

### 3.1 Constantes iniciais (lidas de `model_state.json` em produção)

```typescript
// src/model/types.ts
export interface ModelState {
  version: string;              // "2026-W11"
  updated_at: string;
  // Preços ERSE (semana 09-15 março 2026)
  base_eff_gas: number;         // 1.850 €/l
  base_eff_die: number;         // 1.955
  pretax_gas: number;           // 0.847
  pretax_die: number;           // 1.090
  ext_gas: number;              // 0.550
  ext_die: number;              // 0.7744
  // Descontos
  disc_gas: number;             // 0.047
  disc_die: number;             // 0.093
  // Semana referência governo (02-08 março)
  base_ref_eff_gas: number;     // 1.751
  base_ref_eff_die: number;     // 1.727
  base_ref_pump_gas: number;    // 1.704
  base_ref_pump_die: number;    // 1.633
  // Volumes semanais
  weekly_l_gas: number;         // 28_854_795
  weekly_l_die: number;         // 95_405_914
  // Fiscal
  vat_rate: number;             // 0.23
  temp_isp_die: number;         // 0.03553
  w1_off_die_disc: number;      // 0.0437
  // Cenários (multiplicadores)
  mult_gas: Record<string, number>;  // { moderado: 1.20, severo: 1.35, extremo: 1.50 }
  mult_die: Record<string, number>;  // { moderado: 1.25, severo: 1.45, extremo: 1.65 }
  // Elasticidades
  elast_gas: number;            // -0.20
  elast_die: number;            // -0.15
  // Gás natural / electricidade
  mibgas_spot?: number;
  omie_pt_avg?: number;
  gas_stress_mult: number;      // 1.15
  elec_gas_sensitivity: number; // 0.35
  // Mix energético
  mix_petroleum: number;        // 0.415
  mix_gas: number;              // 0.185
  mix_renewables: number;       // 0.182
  mix_biomass: number;          // 0.160
  mix_other: number;            // 0.058
}

export interface Controls {
  scenario: 'moderado' | 'severo' | 'extremo';
  elast_gas: number;
  elast_die: number;
  retain_disc_gas: number;      // 0-1
  retain_disc_die: number;      // 0-1
  threshold: number;            // 0.10 €/l
  horizon_weeks: number;        // 4-12
  use_official_w1: boolean;
  personal_die_l_week: number;  // para calculadora familiar
  personal_gas_l_week: number;
}
```

### 3.2 Fórmulas — 12 semanas, 3 fases

```typescript
// src/model/engine.ts
export function compute(state: ModelState, controls: Controls): WeeklyResult[] {
  const TAX_GAS = state.base_eff_gas - state.pretax_gas;
  const OTH_GAS = state.pretax_gas - state.ext_gas;
  const TAX_DIE = state.base_eff_die - state.pretax_die;
  const OTH_DIE = state.pretax_die - state.ext_die;

  const termGas = TAX_GAS + OTH_GAS + state.ext_gas * state.mult_gas[controls.scenario];
  const termDie = TAX_DIE + OTH_DIE + state.ext_die * state.mult_die[controls.scenario];

  const results: WeeklyResult[] = [];
  let cumCost = 0;

  for (let w = 1; w <= 12; w++) {
    let gasEff: number, dieEff: number, phase: string;

    if (w <= 4) {
      phase = 'Escalada';
      const step = Math.min(w - 1, 3);
      gasEff = state.base_eff_gas + (termGas - state.base_eff_gas) * step / 3;
      dieEff = state.base_eff_die + (termDie - state.base_eff_die) * step / 3;
    } else if (w <= 8) {
      phase = 'Plateau';
      gasEff = termGas;
      dieEff = termDie;
    } else {
      phase = 'Descompressão';
      const recovery = w - 8;
      gasEff = termGas - (termGas - state.base_eff_gas) * recovery / 12;
      dieEff = termDie - (termDie - state.base_eff_die) * recovery / 12;
    }

    const gasPump = gasEff - state.disc_gas * controls.retain_disc_gas;
    const diePump = dieEff - state.disc_die * controls.retain_disc_die;

    const deltaGas = gasEff - state.base_ref_eff_gas;
    const deltaDie = dieEff - state.base_ref_eff_die;

    const descGovGas = deltaGas > controls.threshold
      ? deltaGas * (state.vat_rate / (1 + state.vat_rate)) : 0;
    const descGovDie = (w === 1 && controls.use_official_w1)
      ? state.w1_off_die_disc
      : deltaDie > controls.threshold
        ? deltaDie * (state.vat_rate / (1 + state.vat_rate)) : 0;

    const volGas = Math.max(0, state.weekly_l_gas *
      (1 + controls.elast_gas * (gasPump / state.base_ref_pump_gas - 1)));
    const volDie = Math.max(0, state.weekly_l_die *
      (1 + controls.elast_die * (diePump / state.base_ref_pump_die - 1)));

    const costGas = descGovGas * volGas;
    const costDie = descGovDie * volDie;
    const weeklyTotal = w <= controls.horizon_weeks ? costGas + costDie : 0;
    cumCost += weeklyTotal;

    results.push({ week: w, phase, gasEff, gasPump, dieEff, diePump,
      deltaGas, deltaDie, descGovGas, descGovDie, volGas, volDie,
      costGas, costDie, weeklyTotal, cumCost });
  }
  return results;
}
```

### 3.3 Valores de verificação obrigatórios

O motor DEVE reproduzir exactamente (com estado inicial):

| Cenário | Semana | Gasolina efic. | Gasóleo efic. | Custo acum. 4 sem. | Custo acum. 12 sem. |
|---------|--------|---------------|---------------|--------------------|--------------------|
| Severo | S4 | **2.0425** | **2.30348** | **31,206,263** | **115,785,573** |
| Moderado | S4 | 1.960 | 2.1486 | 25,281,096 | 88,776,973 |
| Extremo | S4 | 2.125 | 2.45836 | 36,995,725 | 142,087,780 |

**Se estes valores não coincidirem, parar e corrigir antes de avançar.**

---

## 4. APIs DE DADOS ABERTOS

### 4.1 INE — Instituto Nacional de Estatística

```
Base: https://www.ine.pt/ine/json_indicador/pindica.jsp
Auth: Nenhuma
```

| Indicador | varcd | Painel |
|-----------|-------|--------|
| IPC (COICOP) | 0008350 | Macro: Inflação |
| PIB trimestral | 0009894 | Macro: PIB |
| Balança comercial | 0005692 | Macro: Balança |
| Vendas combustíveis | 0005985 | Validação volumes |
| Taxa desemprego | 0005599 | Macro: Emprego |
| Vol. negócios serviços | 0007916 | Impacto turismo |

### 4.2 BPstat — Banco de Portugal

```
Base: https://bpstat.bportugal.pt/data/v1
Auth: Nenhuma
Endpoints: /series/?series_ids=X  |  /observations/?series_ids=X
```

| Série | series_id | Painel |
|-------|-----------|--------|
| PIB real (var. homóloga) | 12559825 | Macro |
| IHPC Portugal | 12559619 | Macro |
| Balança corrente | 12517013 | Macro |
| Dívida pública (% PIB) | 12559829 | OE |
| Taxa juro dívida | 12516825 | OE |
| Crédito habitação — taxa média | 12516755 | Impacto famílias |
| Emprego total | 12559827 | Macro |
| Receita fiscal | 12517093 | OE |

### 4.3 BCE — Banco Central Europeu

```
Base: https://data-api.ecb.europa.eu/service/data
Auth: Nenhuma | Header: Accept: application/json
```

| Indicador | flowRef/key | Painel |
|-----------|-------------|--------|
| EUR/USD | EXR/D.USD.EUR.SP00.A | Pressupostos |
| Taxa facilidade depósito | FM/M.U2.EUR.4F.KR.DFR.LEV | Impacto 2.ª ordem |
| IHPC zona euro | ICP/M.U2.N.000000.4.ANR | Macro comparado |
| Brent (USD) | FM/M.U2.EUR.4F.KR.OIL_B.USD | Pressupostos |
| TTF gás natural | FM/M.U2.EUR.4F.KR.GAS_TTF.EUR | Mix energético |

### 4.4 Eurostat

```
Base: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data
Auth: Nenhuma
```

| Dataset | Código | Painel |
|---------|--------|--------|
| Preços energia | nrg_pc_204 | Comparação UE |
| Dependência energética | nrg_ind_id | Contexto |
| IHPC por COICOP | prc_hicp_manr | Comparação UE |
| Dívida pública | gov_10dd_edpt1 | OE comparado |

### 4.5 API Aberta — Preços reais combustíveis

```
Base: https://api.apiaberta.pt/v1
Auth: Header X-API-Key (ver .env APIABERTA_API_KEY)
```

| Endpoint | Dados | Painel |
|----------|-------|--------|
| `GET /v1/fuel/prices` | PVP por posto/marca/tipo | Preços reais vs modelo |
| `GET /v1/fuel/prices?type=gasoleo` | Gasóleo filtrado | Validação |

### 4.6 ENSE-EPE — Decomposição de preços

```
URLs:
  Decomposição: https://www.ense-epe.pt/decomposicao-de-preco/
  Referência:   https://www.ense-epe.pt/precos-de-referencia/
  Boletim:      https://www.ense-epe.pt/wp-content/uploads/{AAAA}/{MM}/Boletim_Diario_{AAAAMMDD}.pdf
```

Componentes: cotação internacional (Argus), frete, descarga/armazenagem, reservas ENSE, biocombustíveis (13%), ISP, taxa carbono, contribuição rodoviária, IVA.

### 4.7 Gás natural e electricidade

| Fonte | URL | Dados | Frequência |
|-------|-----|-------|-----------|
| MIBGAS | mibgas.es/pt (XLSX públicos) | Spot GN ibérico (€/MWh) | Diário |
| OMIE | omie.es/pt/market-results/daily | Spot electricidade PT (€/MWh) | Horário |
| REN DataHub | datahub.ren.pt/pt/gas-natural/mercado/ | Spot GN, interligação | Diário |

### 4.8 dados.gov.pt

```
Base: https://dados.gov.pt/api/1
Auth: Nenhuma
```

Organizações: IGCP (dívida), Entidade Orçamental (execução), AT (receita fiscal), CMVM, IMPIC.

### 4.9 Scopus — Literatura científica

```
Base: https://api.elsevier.com/content/search/scopus
Auth: Header X-ELS-APIKey (ver .env SCOPUS_API_KEY)
```

Queries pré-definidas:
- `TITLE-ABS-KEY("oil price" AND "pass-through" AND inflation) AND PUBYEAR > 2019`
- `TITLE-ABS-KEY("price elasticity" AND (gasoline OR diesel) AND "short run") AND PUBYEAR > 2018`
- `TITLE-ABS-KEY("energy shock" AND GDP AND (Europe OR Portugal)) AND PUBYEAR > 2019`
- `TITLE-ABS-KEY("fiscal policy" AND "energy crisis" AND budget) AND PUBYEAR > 2020`
- `TITLE-ABS-KEY("Strait of Hormuz" AND (disruption OR blockade OR insurance)) AND PUBYEAR > 2015`
- `TITLE-ABS-KEY("energy transition" AND "oil shock" AND accelerat*) AND PUBYEAR > 2020`

---

## 5. MODELOS AI — TIERS E ROUTING

### 5.1 Três tiers × três providers

| Tier | Quando | Anthropic | OpenAI | Vertex AI |
|------|--------|-----------|--------|-----------|
| **Intenso** | Análise complexa, recalibração >3 params, validação cruzada, changelog | `claude-opus-4-6` | `gpt-5.4-pro-2026-03-05` | `gemini-3.1-pro-preview` |
| **Moderado** | Q&A frontend, ajustes ERSE rotina, sumarização Scopus | `claude-sonnet-4-6` | `gpt-5.4-2026-03-05` | `gemini-3-flash-preview` |
| **Baixo** | Classificação risco, parsing, routing, fallbacks | `claude-haiku-4-5` | `gpt-5-mini-2025-08-07` | `gemini-3.1-flash-lite-preview` |

### 5.2 Routing por tarefa

| Tarefa | Tier | Primário → Fallback 1 → Fallback 2 |
|--------|------|-------------------------------------|
| Análise dados semanal | Intenso | claude-opus-4-6 → gpt-5.4-pro → gemini-3.1-pro |
| Proposta recalibração (complexa) | Intenso | claude-opus-4-6 → gpt-5.4-pro → gemini-3.1-pro |
| Proposta recalibração (rotina) | Moderado | claude-sonnet-4-6 → gpt-5.4 → gemini-3-flash |
| Pesquisa bibliográfica (Scopus) | Moderado | gemini-3-flash → claude-sonnet-4-6 → gpt-5.4 |
| Validação cruzada | Intenso | gpt-5.4-pro → claude-opus-4-6 → gemini-3.1-pro |
| Redacção changelog | Intenso | claude-opus-4-6 → claude-sonnet-4-6 → gpt-5.4 |
| Classificação risco | Baixo | claude-haiku-4-5 → gpt-5-mini → gemini-3.1-flash-lite |
| **Frontend Q&A** | **Moderado** | **claude-sonnet-4-6** → gpt-5.4 → gemini-3-flash |
| Parsing/routing | Baixo | gemini-3.1-flash-lite → claude-haiku-4-5 → gpt-5-mini |

### 5.3 Poupança de consumo

| Mecanismo | Descrição |
|-----------|-----------|
| `HORMUZ_ENV=development` | Nunca usa tier Intenso; downgrades automáticos para Moderado |
| Prompt caching (Anthropic) | System prompts com `cache_control: ephemeral` (5 min) — -90% input cost |
| Cached input (OpenAI) | Conversas multi-turn: $0.25 vs $2.50/MTok |
| Q&A cache | Hash da pergunta → GCS 1h (mesma pergunta não invoca LLM) |
| Budget tracker | Acumula custos estimados; se > `MAX_WEEKLY_LLM_COST_USD`, downgrades forçados |
| `?dry_run=true` | Pipeline completa sem escrita — para testar |

### 5.4 Frontend Q&A — Badge obrigatório

Cada resposta do chat mostra:

```
┌─────────────────────────────────────────────────┐
│ 💬 claude-sonnet-4-6 · Moderado                │
│ 1250 tok in · 340 tok out · ~€0,008             │
└─────────────────────────────────────────────────┘
```

---

## 6. PIPELINE DE RECALIBRAÇÃO SEMANAL

### 6.1 Fluxo (domingo 04:00 UTC)

```
1. DATA_COLLECTOR   → lê snapshots GCS últimos 7 dias
2. ANALYST          → Claude Opus 4-6 analisa dados, propõe ajustes (JSON)
3. EVIDENCE         → Gemini 3 Flash formula queries Scopus, sumariza abstracts
4. VALIDATOR        → GPT-5.4-pro verifica propostas contra evidência
5. RISK_CLASSIFIER  → Claude Haiku classifica: AUTO_APPLY / ADVISORY / HUMAN_REVIEW
6. WRITER           → Claude Opus 4-6 redige changelog em PT (APA 7th)
7. APPLIER          → se AUTO/ADVISORY: actualiza model_state.json
                      se HUMAN_REVIEW: grava como pending
8. CHANGELOG        → grava entrada em GCS /history/
```

### 6.2 Guardrails

- Ajuste > ±10% em qualquer parâmetro → `HUMAN_REVIEW` (não auto-aplica)
- Ajuste ≤ ±5% → `AUTO_APPLY`
- Entre 5-10% → `AUTO_APPLY` com `ADVISORY`
- DOI dos artigos Scopus validado contra API (evita alucinações)
- Cada entrada preserva `old_value` para rollback

---

## 7. CASCATA DE IMPACTOS (18 efeitos)

```typescript
export const CASCADE = [
  // ── 1.ª ordem (verde #DCEDC8) ── Semanas 1-4 ──
  { ordem:'1', canal:'Fatura energética',     mag:'+200-350 M€/mês',       hor:'Sem 1-4' },
  { ordem:'1', canal:'Preços combustíveis',   mag:'Gasóleo 2,21 €/l',      hor:'Sem 1-4' },
  { ordem:'1', canal:'IPC directo',           mag:'+0,7-1,0 p.p.',         hor:'Sem 1-4' },
  { ordem:'1', canal:'OE: mecanismo IVA',     mag:'~31 M€ (4 sem)',        hor:'Sem 1-4' },
  { ordem:'1', canal:'Famílias',              mag:'~70 €/mês',             hor:'Sem 1-4' },
  { ordem:'1', canal:'PME transportes',       mag:'-5 a -12 p.p. EBITDA',  hor:'Sem 1-4' },
  // ── 2.ª ordem (amarelo #FFF9C4) ── Meses 1-6 ──
  { ordem:'2', canal:'Pass-through inflac.',  mag:'+0,1-0,2 p.p. core',    hor:'M 1-3' },
  { ordem:'2', canal:'BCE / taxas juro',      mag:'Prob. hike 85%→95%+',   hor:'M 2-6' },
  { ordem:'2', canal:'Turismo',               mag:'-2 a -5% receitas',     hor:'M 2-6' },
  { ordem:'2', canal:'Cadeia alimentar',      mag:'+0,5-1,5 p.p.',        hor:'M 1-4' },
  { ordem:'2', canal:'Crédito habitação',     mag:'+15-30 €/mês',         hor:'M 3-9' },
  { ordem:'2', canal:'Indústria transf.',     mag:'Compressão margens',    hor:'M 1-4' },
  // ── 3.ª ordem (laranja #FFCCBC) ── Meses 3-18+ ──
  { ordem:'3', canal:'PIB real',              mag:'1,5-2,0% (vs 2,3%)',    hor:'2026' },
  { ordem:'3', canal:'Saldo orçamental',      mag:'-1,0 a -1,5% PIB',     hor:'2026' },
  { ordem:'3', canal:'Transição energética',  mag:'Reorientação PRR',      hor:'27-30' },
  { ordem:'3', canal:'Reestruct. sectorial',  mag:'-3 a -5% PME transp.', hor:'M 6-18' },
  { ordem:'3', canal:'Negociação salarial',   mag:'+0,5-1,0% desp. AP',   hor:'2027' },
  { ordem:'3', canal:'Defesa/segurança',      mag:'Não quantificável',     hor:'27-28' },
];
```

---

## 8. IMPACTO ORÇAMENTAL

| Rubrica | OE 2026 | 4 sem (Sev.) | 8 sem | 12 sem |
|---------|---------|-------------|-------|--------|
| Receita ISP | 4 254 M€ | 4 200-4 254 | 4 050-4 200 | 3 900-4 100 |
| IVA extra combust. | (base) | +160-240 | +350-550 | +400-700 |
| Custo mecanismo | — | ~-31 | ~-76 | ~-116 |
| Pressão despesa extra | — | -50 a -150 | -150 a -400 | -300 a -800 |
| Saldo (% PIB) | -0,6% | -0,6 a -0,8% | -0,7 a -1,0% | -1,0 a -1,5% |
| **OE suplementar?** | Não | Improvável | Possível | **Provável** |

Projecção: 2027 PIB 1,2-1,5% (vs 1,7%), saldo -1,0 a -1,2%. 2028 normalização condicionada.

---

## 9. DESIGN

Dark mode analítico, institucional (Bloomberg/BdP).

- Fundo: `#0F172A` (slate-900) — Painéis: `#1E293B` (slate-800)
- Texto: `#F1F5F9` primário / `#94A3B8` secundário
- Acentos: `#4ADE80` (1.ª ordem), `#FACC15` (2.ª), `#FB923C` (3.ª)
- Cenário Severo: `#3B82F6` — Alerta: `#EF4444`
- Font display: **DM Sans** (Google Fonts)
- Font dados: **JetBrains Mono** (Google Fonts)
- DataSourceBadge: dot verde=live, amarelo=cache, vermelho=fallback
- Animações: fade-in escalonado, transições 300ms

---

## 10. TRÊS VISTAS NO FRONTEND

| Vista | Sidebar | Conteúdo |
|-------|---------|----------|
| **A — Modelo** | 📊 | Cenários, preços 12 sem, custos, cascata, OE, calculadora familiar |
| **B — Contexto** | 🌍 | Macro (INE+BPstat), Energia (ECB+MIBGAS+OMIE), Mix energético, OE real, Comparação UE |
| **C — Histórico** | 📝 | Timeline de alterações, diffs de parâmetros, evidência Scopus, badge LLMs |

\+ Painel lateral **💬 Chat** (Q&A com LLM Moderado, badge obrigatório)

---

## 11. ENDPOINTS DO API-PROXY

| Endpoint | Método | Fontes | TTL | Uso |
|----------|--------|--------|-----|-----|
| `/api/context` | GET | INE + BPstat | 24h | Painel macro |
| `/api/energy` | GET | ECB + INE | 6h | Preços/volumes energia |
| `/api/energy-mix` | GET | MIBGAS + OMIE + REN + ECB(TTF) | 6h | Mix energético |
| `/api/fuel-prices` | GET | API Aberta | 6h | Preços reais postos |
| `/api/price-decomposition` | GET | ENSE-EPE | 24h | Decomposição preço |
| `/api/budget` | GET | BPstat + dados.gov.pt | 24h | Execução orçamental |
| `/api/comparison` | GET | Eurostat | 24h | Comparação UE |
| `/api/model-state` | GET | GCS | 1min | Estado actual modelo |
| `/api/history` | GET | GCS/Firestore | 5min | Changelog |
| `/api/chat` | POST | LLM Moderado | 1h hash | Q&A |
| `/api/meta` | GET | Todas | — | Timestamps |
| `/api/refresh` | POST | Todas | — | Forçar refresh |
| `/health` | GET | — | — | Healthcheck |

---

## 12. RESILIÊNCIA

Padrão **cache-first com 4 níveis de fallback**:

```
1. Cache GCS fresco → 2. API ao vivo → 3. Cache GCS stale → 4. Dados estáticos (/data/)
```

Se todas as APIs falharem: Vista A funciona normalmente (client-side); Vista B mostra badge vermelho "fallback".

---

## 13. DEPLOY

```bash
# deploy.sh — Executar de /home/dpolonia/HormuzPT/
#!/bin/bash
set -euo pipefail
PROJECT_ID="hormuzpt"
REGION="europe-west1"
BUCKET="gs://${PROJECT_ID}-hormuz-cache"

gcloud config set project $PROJECT_ID

# Secrets (executar apenas 1 vez — ver infra/secrets.sh)
# Bucket
gsutil mb -l $REGION $BUCKET 2>/dev/null || true
gsutil lifecycle set infra/lifecycle.json $BUCKET

# API Proxy
cd api-proxy && gcloud builds submit --tag gcr.io/$PROJECT_ID/hormuz-api-proxy
gcloud run deploy hormuz-api-proxy \
  --image gcr.io/$PROJECT_ID/hormuz-api-proxy \
  --platform managed --region $REGION --allow-unauthenticated \
  --memory 512Mi --cpu 1 --max-instances 5 --port 8081 \
  --set-env-vars "GCS_BUCKET=${PROJECT_ID}-hormuz-cache,NODE_ENV=production" \
  --set-secrets "APIABERTA_API_KEY=APIABERTA_API_KEY:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest"
API_URL=$(gcloud run services describe hormuz-api-proxy --region $REGION --format='value(status.url)')
cd ..

# Recalibrator
cd recalibrator && gcloud builds submit --tag gcr.io/$PROJECT_ID/hormuz-recalibrator
gcloud run deploy hormuz-recalibrator \
  --image gcr.io/$PROJECT_ID/hormuz-recalibrator \
  --platform managed --region $REGION --no-allow-unauthenticated \
  --memory 1Gi --cpu 2 --max-instances 1 --timeout 600 --port 8082 \
  --service-account vertex-express@hormuzpt.iam.gserviceaccount.com \
  --set-env-vars "GCS_BUCKET=${PROJECT_ID}-hormuz-cache,HORMUZ_ENV=production" \
  --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,VERTEX_AI_API_KEY=VERTEX_AI_API_KEY:latest,HUGGINGFACE_API_KEY=HUGGINGFACE_API_KEY:latest,SCOPUS_API_KEY=SCOPUS_API_KEY:latest,APIABERTA_API_KEY=APIABERTA_API_KEY:latest"
RECAL_URL=$(gcloud run services describe hormuz-recalibrator --region $REGION --format='value(status.url)')
cd ..

# Frontend
cd frontend
echo "VITE_API_URL=$API_URL" > .env.production
gcloud builds submit --tag gcr.io/$PROJECT_ID/hormuz-frontend
gcloud run deploy hormuz-frontend \
  --image gcr.io/$PROJECT_ID/hormuz-frontend \
  --platform managed --region $REGION --allow-unauthenticated \
  --memory 256Mi --cpu 1 --max-instances 3 --port 8080
FRONT_URL=$(gcloud run services describe hormuz-frontend --region $REGION --format='value(status.url)')
cd ..

# Schedulers
gcloud scheduler jobs delete hormuz-daily-refresh --location=$REGION -q 2>/dev/null || true
gcloud scheduler jobs create http hormuz-daily-refresh \
  --schedule="0 6 * * *" --uri="${API_URL}/api/refresh" \
  --http-method=POST --time-zone="Europe/Lisbon" --location=$REGION

gcloud scheduler jobs delete hormuz-weekly-recal --location=$REGION -q 2>/dev/null || true
gcloud scheduler jobs create http hormuz-weekly-recal \
  --schedule="0 4 * * 0" --uri="${RECAL_URL}/recalibrate" \
  --http-method=POST --time-zone="Europe/Lisbon" --location=$REGION \
  --oidc-service-account-email="vertex-express@hormuzpt.iam.gserviceaccount.com"

echo "Frontend:     $FRONT_URL"
echo "API Proxy:    $API_URL"
echo "Recalibrator: $RECAL_URL"
```

---

## 14. ORDEM DE IMPLEMENTAÇÃO

1. **Setup**: `.env`, `.gitignore`, `.env.example`, `package.json` dos 3 serviços
2. **Motor de cálculo** (`frontend/src/model/engine.ts`): implementar e **validar contra tabela §3.3**
3. **API Proxy providers**: INE, BPstat, ECB, Eurostat, API Aberta — testar cada um com `curl`
4. **API Proxy routes**: todos os endpoints de §11
5. **Frontend Vista A**: Layout → ControlPanel → PriceDashboard → CostDashboard → Cascade → BudgetImpact → FamilyCalc
6. **Frontend Vista B**: MacroPanel → EnergyPanel → EnergyMixPanel → BudgetPanel → EuropePanel
7. **Recalibrator**: LLM clients → Scopus client → Pipeline → Modelos Pydantic
8. **Frontend Vista C**: HistoryPage → ChangeEntry → ParameterDiff → EvidenceList
9. **Frontend Chat**: ModelChat com badge de modelo
10. **Docker + docker-compose**: testar localmente
11. **Deploy GCP**: `deploy.sh`
12. **Verificação final**: valores do motor, dados ao vivo, recalibração manual

**Prioridade absoluta**: correcção numérica > resiliência proxy > pipeline recalibração > estética

---

## 15. METADADOS

- **Autor**: Daniel Ferreira Polónia | DEGEIT, Universidade de Aveiro | GOVCOPP
- **Data**: Março 2026
- **Modelo base**: cenario_hormuz_portugal_impactos_20260310.xlsx
- **Licença**: CC BY-NC-SA 4.0 (modelo); dados APIs sob licença das entidades emissoras
- **Disclaimer footer**: "Exercício de cenários com pressupostos explícitos e fórmulas auditáveis. Não constitui previsão pontual de mercado nem aconselhamento financeiro."
