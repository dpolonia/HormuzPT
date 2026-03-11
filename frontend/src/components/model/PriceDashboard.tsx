import { useMemo } from 'react';
import { WeeklyResult, Controls, ModelState } from '../../model/types';
import { CASCADE } from '../../model/cascade';
import { compute } from '../../model/engine';

interface PriceDashboardProps {
    results: WeeklyResult[];
    controls: Controls;
    modelState: ModelState;
}

function formatEur(n: number): string {
    return n.toFixed(4) + ' €/l';
}

function formatMEur(n: number): string {
    return (n / 1_000_000).toFixed(1) + ' M€';
}

function deltaPercent(current: number, baseline: number): { pct: string; dir: 'up' | 'down' } {
    const pct = ((current - baseline) / baseline) * 100;
    return {
        pct: (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%',
        dir: pct >= 0 ? 'up' : 'down',
    };
}

/** Parse a numeric value from magnitude strings like "+200-350 M€/mês" or "+0,7-1,0 p.p." */
function parseMagScale(mag: string): number {
    const nums = mag.match(/[\d]+[,.]?[\d]*/g);
    if (!nums || nums.length === 0) return 0;
    const parsed = nums.map(n => parseFloat(n.replace(',', '.')));
    return Math.max(...parsed);
}

/** Normalize magnitude to a 0-1 scale within a group for inline bars */
function normalizeMagnitudes(items: { mag: string }[]): number[] {
    const scales = items.map(i => parseMagScale(i.mag));
    const max = Math.max(...scales, 1);
    return scales.map(s => Math.max(0.05, s / max));
}

function costCellClass(weeklyTotal: number): string {
    const meur = weeklyTotal / 1_000_000;
    if (meur > 10) return 'cost-cell-high';
    if (meur > 5) return 'cost-cell-medium';
    return '';
}

const CASCADE_GROUPS = [
    {
        ordem: '1',
        label: '1.ª Ordem — Impacto directo',
        sublabel: 'Semanas 1–4',
        desc: 'Efeitos imediatos no preço dos combustíveis, custo de vida e mecanismos fiscais automáticos.',
    },
    {
        ordem: '2',
        label: '2.ª Ordem — Transmissão',
        sublabel: 'Meses 1–6',
        desc: 'Transmissão para inflação subjacente, taxas de juro, turismo e cadeia alimentar.',
    },
    {
        ordem: '3',
        label: '3.ª Ordem — Efeitos estruturais',
        sublabel: 'Meses 3–18+',
        desc: 'Impactos no PIB, saldo orçamental, reestruturação sectorial e transição energética.',
    },
];

const SCENARIO_KEYS = ['moderado', 'severo', 'extremo'] as const;
const SALARY_MIN_2026 = 870; // Salário mínimo 2026 (€/mês)

export function PriceDashboard({ results, controls, modelState }: PriceDashboardProps) {
    const s4 = results[3]; // Week 4
    const s12 = results[11]; // Week 12

    // Compute S4 dieselEff for all 3 scenarios for comparison strip
    const scenarioComparison = useMemo(() => {
        return SCENARIO_KEYS.map(sc => {
            const r = compute(modelState, { ...controls, scenario: sc });
            const w4 = r[3];
            return {
                scenario: sc,
                dieEff: w4.dieEff,
                gasEff: w4.gasEff,
                cumCost4: w4.cumCost,
            };
        });
    }, [modelState, controls]);

    // Family impact (personal weekly cost increase)
    const personalWeeklyCost = useMemo(() => {
        if (!s4) return 0;
        const gasDelta = s4.gasPump - modelState.base_ref_pump_gas;
        const dieDelta = s4.diePump - modelState.base_ref_pump_die;
        return gasDelta * controls.personal_gas_l_week + dieDelta * controls.personal_die_l_week;
    }, [s4, controls, modelState]);

    const personalMonthlyCost = personalWeeklyCost * 4.33;
    const pctSalarioMin = ((personalMonthlyCost / SALARY_MIN_2026) * 100).toFixed(1);

    const scenarioLabel = controls.scenario.charAt(0).toUpperCase() + controls.scenario.slice(1);

    const gasDelta = s4 ? deltaPercent(s4.gasEff, modelState.base_eff_gas) : null;
    const dieDelta = s4 ? deltaPercent(s4.dieEff, modelState.base_eff_die) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPI Summary */}
            <div className="section-group">
                <div className="section-label">
                    <span className="section-icon">📊</span>
                    Indicadores-chave — Cenário {scenarioLabel} (S4)
                </div>
                <div className="section-subtitle">
                    Valores no pico da crise (Semana 4) vs. referência ERSE
                </div>
                <div className="grid-4">
                    <div className="card card-scenario fade-in stagger-1">
                        <div className="card-title">Gasolina S4</div>
                        <div className="metric">
                            <div className="metric-value" style={{ color: 'var(--accent-blue)' }}>
                                {s4 ? formatEur(s4.gasEff) : '—'}
                            </div>
                            <div className="metric-label">Preço eficiente</div>
                            <div className="baseline-ref">
                                Base: {formatEur(modelState.base_eff_gas)}
                            </div>
                            {gasDelta && (
                                <div className={`delta-badge ${gasDelta.dir}`}>
                                    {gasDelta.dir === 'up' ? '↑' : '↓'} {gasDelta.pct}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="card card-scenario fade-in stagger-2">
                        <div className="card-title">Gasóleo S4</div>
                        <div className="metric">
                            <div className="metric-value" style={{ color: 'var(--accent-blue)' }}>
                                {s4 ? formatEur(s4.dieEff) : '—'}
                            </div>
                            <div className="metric-label">Preço eficiente</div>
                            <div className="baseline-ref">
                                Base: {formatEur(modelState.base_eff_die)}
                            </div>
                            {dieDelta && (
                                <div className={`delta-badge ${dieDelta.dir}`}>
                                    {dieDelta.dir === 'up' ? '↑' : '↓'} {dieDelta.pct}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="card fade-in stagger-3">
                        <div className="card-title">Custo Acumulado 4 Sem</div>
                        <div className="metric">
                            <div className="metric-value" style={{ color: 'var(--accent-2nd)' }}>
                                {s4 ? formatMEur(s4.cumCost) : '—'}
                            </div>
                            <div className="metric-label">Mecanismo IVA — custo fiscal</div>
                        </div>
                    </div>
                    <div className="card fade-in stagger-4">
                        <div className="card-title">Custo Acumulado 12 Sem</div>
                        <div className="metric">
                            <div className="metric-value" style={{ color: 'var(--accent-3rd)' }}>
                                {s12 ? formatMEur(s12.cumCost) : '—'}
                            </div>
                            <div className="metric-label">Mecanismo IVA — custo fiscal</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scenario comparison strip */}
            <div className="section-group">
                <div className="section-label">
                    <span className="section-icon">⚖️</span>
                    Comparação de cenários (S4)
                </div>
                <div className="section-subtitle">
                    Preço do gasóleo eficiente e custo fiscal acumulado em cada cenário na Semana 4
                </div>
                <div className="scenario-strip">
                    {scenarioComparison.map(sc => (
                        <div
                            key={sc.scenario}
                            className={`scenario-strip-card ${sc.scenario} ${controls.scenario === sc.scenario ? 'active' : ''}`}
                        >
                            <div className="strip-label">
                                {sc.scenario.charAt(0).toUpperCase() + sc.scenario.slice(1)}
                            </div>
                            <div className="strip-value">{formatEur(sc.dieEff)}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                                {formatMEur(sc.cumCost4)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Family impact */}
            <div className="section-group">
                <div className="section-label">
                    <span className="section-icon">👤</span>
                    Impacto pessoal
                </div>
                <div className="section-subtitle">
                    Custo extra estimado para o consumo pessoal configurado na calculadora
                </div>
                <div className="card fade-in">
                    <div className="card-title">💰 Custo Extra — Família (S4)</div>
                    <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="metric">
                            <div className="metric-value" style={{
                                color: personalWeeklyCost > 10 ? 'var(--accent-red)' : 'var(--accent-2nd)',
                            }}>
                                +{personalWeeklyCost.toFixed(2)} €/semana
                            </div>
                            <div className="metric-label">
                                {controls.personal_gas_l_week}l gasolina + {controls.personal_die_l_week}l gasóleo vs. preço de referência
                            </div>
                        </div>
                        <div className="metric">
                            <div className="metric-value" style={{
                                color: personalMonthlyCost > 40 ? 'var(--accent-red)' : 'var(--accent-3rd)',
                                fontSize: '1.2rem',
                            }}>
                                +{personalMonthlyCost.toFixed(0)} €/mês
                            </div>
                            <div className="metric-label">
                                ≈ {pctSalarioMin}% do salário mínimo ({SALARY_MIN_2026} €)
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 12-week results table */}
            <div className="section-group">
                <div className="section-label">
                    <span className="section-icon">📈</span>
                    Projecção semanal
                </div>
                <div className="section-subtitle">
                    Evolução semanal dos preços e custo fiscal — semana 4 destacada como pico de impacto
                </div>
                <div className="card fade-in">
                    <div className="card-title">
                        Cenário {scenarioLabel} — Multiplicador gasolina ×{modelState.mult_gas[controls.scenario]}, gasóleo ×{modelState.mult_die[controls.scenario]}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Sem</th>
                                    <th>Fase</th>
                                    <th>Gasolina (€/l)</th>
                                    <th>Gasóleo (€/l)</th>
                                    <th>Custo Semanal</th>
                                    <th>Custo Acum.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map(r => (
                                    <tr
                                        key={r.week}
                                        className={r.week === 4 ? 'row-peak' : ''}
                                        style={{
                                            opacity: r.week > controls.horizon_weeks ? 0.4 : 1,
                                        }}
                                    >
                                        <td>{r.week === 4 ? '▸ S4' : `S${r.week}`}</td>
                                        <td>
                                            <span className={`phase-badge ${r.phase.toLowerCase().replace('ã', 'a')}`}>
                                                {r.phase}
                                            </span>
                                        </td>
                                        <td>{r.gasEff.toFixed(4)}</td>
                                        <td>{r.dieEff.toFixed(4)}</td>
                                        <td className={costCellClass(r.weeklyTotal)}>{formatMEur(r.weeklyTotal)}</td>
                                        <td style={{ fontWeight: 600 }}>{formatMEur(r.cumCost)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Cascade effects — grouped by order with connectors */}
            <div className="section-group">
                <div className="section-label">
                    <span className="section-icon">⚡</span>
                    Cascata de impactos (18 efeitos)
                </div>
                <div className="section-subtitle">
                    Cadeia de transmissão ordenada por horizonte temporal — do impacto imediato ao estrutural
                </div>
                <div className="card fade-in">
                    {CASCADE_GROUPS.map((group, gi) => {
                        const items = CASCADE.filter(c => c.ordem === group.ordem);
                        const barScales = normalizeMagnitudes(items);
                        return (
                            <div key={group.ordem}>
                                {gi > 0 && (
                                    <div className="cascade-connector">
                                        <span className="cascade-connector-chevron">▼</span>
                                    </div>
                                )}
                                <div className="cascade-group">
                                    <div className={`cascade-group-header o${group.ordem}`}>
                                        <span>{group.label}</span>
                                        <span style={{ marginLeft: 'auto', fontWeight: 400, fontSize: '0.65rem' }}>
                                            {group.sublabel}
                                        </span>
                                    </div>
                                    <div className="cascade-desc">{group.desc}</div>
                                    {items.map((c, i) => (
                                        <div className="cascade-item" key={i}>
                                            <div className={`cascade-order o${c.ordem}`}>{c.ordem}ª</div>
                                            <div style={{ flex: 1 }}>
                                                <div className="cascade-canal">{c.canal}</div>
                                                <div className="cascade-mag">
                                                    <span>{c.mag}</span>
                                                    <span
                                                        className={`cascade-bar o${c.ordem}`}
                                                        style={{ width: `${barScales[i] * 80}px` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="cascade-hor">{c.hor}</div>
                                        </div>
                                    ))}
                                    <div className="cascade-summary">
                                        <span className="cascade-summary-count">{items.length} efeitos</span>
                                        <span>Horizonte: {group.sublabel}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
