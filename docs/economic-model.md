# HormuzPT Economic Transmission Model

**Version**: 1.0.0-sprint14
**Date**: March 2026
**Author**: Daniel Ferreira Polonia | ISCA, Universidade de Aveiro | GOVCOPP

---

## 1. Purpose

This model simulates the macroeconomic impact of an energy supply disruption (Strait of Hormuz blockade) on the Portuguese economy. It is designed as a **transparent policy simulation engine** with:

- Explicit equations
- Configurable coefficients
- Full decomposition of outputs into driver contributions
- Sensitivity analysis capability

**This is NOT an econometric model.** It does not claim causal identification. It is a structured scenario analysis tool with auditable logic, suitable for policy analytics and academic demonstration.

---

## 2. Model Structure

The model has three explicit layers:

```
Layer 1: Exogenous Shock Inputs (user-defined)
    ↓ (weighted aggregation)
Layer 2: Intermediate Transmission Variables (computed)
    ↓ (scaled transmission)
Layer 3: Final Macroeconomic Outputs (computed)
```

Each output includes a **contribution decomposition** showing how each intermediate driver contributed to the final value.

---

## 3. Scenario Inputs (Layer 1)

| Variable | Label | Unit | Range |
|----------|-------|------|-------|
| `oil_price_change_pct` | Crude oil price change | % | 0-150 |
| `gas_price_change_pct` | Natural gas price change | % | 0-200 |
| `electricity_price_change_pct` | Electricity price change | % | 0-100 |
| `shipping_cost_change_pct` | Maritime freight cost change | % | 0-150 |
| `trade_disruption_pct` | Trade disruption intensity | % | 0-50 |
| `shock_duration_days` | Duration of the shock | days | 7-120 |

### Predefined Scenario Presets

| Scenario | Oil | Gas | Electricity | Shipping | Trade | Duration |
|----------|-----|-----|-------------|----------|-------|----------|
| **Moderado** | +20% | +15% | +8% | +25% | 5% | 21 days |
| **Severo** | +40% | +60% | +25% | +50% | 15% | 42 days |
| **Extremo** | +80% | +120% | +50% | +100% | 30% | 84 days |

---

## 4. Intermediate Variables (Layer 2)

| Variable | Label | Computation |
|----------|-------|-------------|
| `energy_import_cost_pressure` | Weighted energy cost pressure | Eq. 1 |
| `transport_cost_pressure` | Transport sector cost pressure | Eq. 2 |
| `industrial_cost_pressure` | Industrial sector cost pressure | Eq. 3 |
| `consumer_price_pressure` | Consumer price pressure | Eq. 4 |
| `export_competitiveness_pressure` | Export competitiveness loss | Eq. 5 |
| `import_bill_pressure` | Import bill increase | Eq. 6 |
| `normalized_duration` | Shock duration in months | shock_duration_days / 30 |

These intermediate variables represent **percentage pressures** — they indicate how much each transmission channel is stressed by the exogenous shocks.

---

## 5. Output Variables (Layer 3)

| Variable | Label | Unit | Sign convention |
|----------|-------|------|-----------------|
| `gdp_change_pct` | GDP change | p.p. | Negative = contraction |
| `cpi_change_pct` | CPI change | p.p. | Positive = inflation |
| `trade_balance_change_pct` | Trade balance change | p.p. | Negative = deterioration |
| `unemployment_change_pct` | Unemployment change | p.p. | Positive = increase |
| `industrial_output_change_pct` | Industrial output change | p.p. | Negative = decline |

---

## 6. Equations

### Layer 1 → Layer 2 (Pressure Aggregation)

**Eq. 1: Energy import cost pressure**
```
energy_import_cost_pressure = w_oil × oil_price_change + w_gas × gas_price_change + w_electricity × electricity_price_change
```

**Eq. 2: Transport cost pressure**
```
transport_cost_pressure = a_shipping × shipping_cost_change + a_oil_transport × oil_price_change
```

**Eq. 3: Industrial cost pressure**
```
industrial_cost_pressure = b_energy_industry × energy_import_cost_pressure + b_trade_industry × trade_disruption
```

**Eq. 4: Consumer price pressure**
```
consumer_price_pressure = c_energy_cpi × energy_import_cost_pressure + c_transport_cpi × transport_cost_pressure
```

**Eq. 5: Export competitiveness pressure**
```
export_competitiveness_pressure = d_shipping × shipping_cost_change + d_trade × trade_disruption + d_energy × industrial_cost_pressure
```

**Eq. 6: Import bill pressure**
```
import_bill_pressure = e_energy × energy_import_cost_pressure + e_trade × trade_disruption
```

### Layer 2 → Layer 3 (Macro Impact with Scale Factors)

Each output equation has the form:
`output = scale_factor × (weighted sum of intermediate pressures)`

The **weights** (g_*, t_*, i_*) determine the **relative contribution** of each driver.
The **scale factors** (gdp_scale, cpi_scale, etc.) convert percentage pressures into **percentage-point macro impact**.

**Eq. 7: GDP change**
```
gdp_raw = g_industry × industrial_cost_pressure + g_exports × export_competitiveness_pressure + g_duration × normalized_duration
gdp_change_pct = -gdp_scale × gdp_raw
```

**Eq. 8: CPI change**
```
cpi_change_pct = cpi_scale × p_consumer × consumer_price_pressure
```

**Eq. 9: Trade balance change**
```
trade_raw = t_imports × import_bill_pressure + t_exports × export_competitiveness_pressure
trade_balance_change_pct = -trade_scale × trade_raw
```

**Eq. 10: Unemployment change (Okun-like)**
```
unemployment_change_pct = u_gdp × |min(gdp_change_pct, 0)|
```

**Eq. 11: Industrial output change**
```
ind_raw = i_cost × industrial_cost_pressure + i_duration × normalized_duration
industrial_output_change_pct = -industrial_scale × ind_raw
```

---

## 7. Parameter Definitions

### Mixing Weights (Layer 1 → Layer 2)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `w_oil` | 0.50 | Oil weight in energy import cost (Portugal imports ~50% petroleum-based energy) |
| `w_gas` | 0.30 | Gas weight in energy import cost |
| `w_electricity` | 0.20 | Electricity weight in energy import cost |
| `a_shipping` | 0.70 | Shipping cost contribution to transport pressure |
| `a_oil_transport` | 0.30 | Oil price contribution to transport pressure (fuel) |
| `b_energy_industry` | 0.60 | Energy cost pass-through to industry |
| `b_trade_industry` | 0.40 | Trade disruption impact on industry (supply chains) |
| `c_energy_cpi` | 0.70 | Energy cost pass-through to consumer prices |
| `c_transport_cpi` | 0.30 | Transport cost pass-through to consumer prices |
| `d_shipping_exports` | 0.40 | Shipping cost impact on export competitiveness |
| `d_trade_exports` | 0.40 | Trade disruption impact on exports |
| `d_energy_exports` | 0.20 | Industrial cost spill-over to exports |
| `e_energy_imports` | 0.70 | Energy cost contribution to import bill |
| `e_trade_imports` | 0.30 | Trade disruption contribution to import bill |

### Transmission Weights (Layer 2 → Layer 3)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `g_industry` | 0.50 | Relative weight of industrial cost pressure in GDP impact |
| `g_exports` | 0.30 | Relative weight of export competitiveness in GDP impact |
| `g_duration` | 0.20 | Relative weight of shock duration in GDP impact |
| `p_consumer` | 1.00 | Consumer price pressure multiplier for CPI |
| `t_imports` | 0.60 | Import bill weight in trade balance impact |
| `t_exports` | 0.40 | Export competitiveness weight in trade balance impact |
| `u_gdp` | 0.35 | GDP-to-unemployment Okun-like coefficient |
| `i_cost` | 0.70 | Cost pressure weight in industrial output impact |
| `i_duration` | 0.30 | Duration weight in industrial output impact |

### Macro Scale Factors

| Parameter | Default | Description |
|-----------|---------|-------------|
| `gdp_scale` | 0.06 | Converts weighted intermediate pressure → GDP p.p. impact |
| `cpi_scale` | 0.055 | Converts consumer pressure → CPI p.p. impact |
| `trade_scale` | 0.06 | Converts trade pressure → balance p.p. impact |
| `industrial_scale` | 0.09 | Converts cost pressure → industrial output p.p. impact |

**Calibration note**: Scale factors are calibrated so that the Severe scenario (oil +40%, gas +60%, 42 days) produces GDP ≈ -1.5 p.p. and CPI ≈ +2.5 p.p., consistent with IMF and ECB estimates for comparable energy shocks in small open economies.

---

## 8. Explainability Logic

Every final output returns a **contribution decomposition**:

```json
{
  "gdp_change_pct": {
    "value": -1.55,
    "contributions": {
      "industrial_cost_pressure": -0.95,
      "export_competitiveness_pressure": -0.58,
      "shock_duration": -0.01
    }
  }
}
```

The decomposition is **exact** — contributions sum to the total value. This is possible because the model is linear in the transmission layer: each contribution is computed as `scale × weight × intermediate_pressure`.

No SHAP values or post-hoc explainers are used. The model itself IS the explanation.

---

## 9. Sensitivity Analysis

The sensitivity engine varies one chosen input across a specified range while holding all other inputs fixed at baseline values.

**Endpoint**: `POST /api/model/sensitivity`

**Request**:
```json
{
  "variable": "oil_price_change_pct",
  "min": 0,
  "max": 80,
  "step": 10,
  "baseline": {
    "gas_price_change_pct": 20,
    "electricity_price_change_pct": 10,
    "shipping_cost_change_pct": 15,
    "trade_disruption_pct": 5,
    "shock_duration_days": 30
  }
}
```

**Response**: Array of points, each containing the varied input value and all five output values. The curves are monotonic for each output (linear model), making directional interpretation straightforward.

---

## 10. Data Dependencies

The model can reference current baseline macro and energy conditions from live providers:

| Provider | Data Used | Purpose |
|----------|-----------|---------|
| INE | CPI, GDP growth, unemployment | Baseline context |
| ECB | EUR/USD, deposit rate, mortgage rate | Monetary context |
| Eurostat | HICP, public debt, energy dependency | EU comparison |
| OMIE | PT electricity day-ahead price | Energy baseline |
| MIBGAS | Iberian gas spot price | Gas baseline |
| API Aberta | Real fuel pump prices | Price validation |
| ENSE | Reference fuel prices | Price decomposition |

Baseline data is used for **contextualisation only** — the scenario model operates on percentage changes from baseline, not absolute prices.

---

## 11. Assumptions and Limitations

### Assumptions

1. **Linearity**: The transmission model is linear. In reality, extreme shocks may exhibit non-linear responses (threshold effects, capacity constraints).

2. **Static coefficients**: Transmission coefficients are fixed for a given run. In reality, they may vary with shock magnitude and duration.

3. **Instantaneous transmission**: The model does not incorporate time lags. In reality, CPI pass-through takes 3-9 months; GDP impact is spread over quarters.

4. **Single-country focus**: The model captures Portugal's direct exposure. It does not model EU-level feedback loops or monetary policy responses.

5. **No substitution effects**: The model assumes fixed energy mix weights. In reality, consumers and firms adjust consumption patterns.

### Limitations

1. **Not an econometric model**: Parameters are calibrated for coherence, not estimated from historical data. They should be treated as informed assumptions.

2. **No confidence intervals**: The model produces point estimates. Uncertainty should be explored via sensitivity analysis and scenario comparison.

3. **Scale factor dependency**: Final output magnitudes depend critically on the four macro scale factors (gdp_scale, cpi_scale, trade_scale, industrial_scale). These are the most influential parameters and should be the first candidates for empirical calibration.

4. **No dynamic adjustment**: The model does not account for policy responses (fiscal stimulus, strategic reserves, EU solidarity mechanisms) that would mitigate impacts over time.

5. **Shock independence**: The model assumes exogenous inputs are independently controllable. In reality, oil, gas, and shipping costs are correlated during a Hormuz disruption.

### Recommended Next Steps

- Calibrate scale factors against historical energy shock episodes (1973, 1979, 1990, 2022)
- Add time-lag structure to transmission equations
- Incorporate policy response scenarios (fiscal measures, strategic reserves)
- Add correlation structure between exogenous inputs for Monte Carlo analysis
- Validate against ECB/IMF stress test results for Portugal
