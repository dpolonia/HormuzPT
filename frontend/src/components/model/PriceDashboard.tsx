import { useMemo } from 'react';
import { WeeklyResult, Controls } from '../../model/types';
import { CASCADE } from '../../model/cascade';

interface PriceDashboardProps {
    results: WeeklyResult[];
    controls: Controls;
}

function formatEur(n: number): string {
    return n.toFixed(4) + ' €/l';
}

function formatMEur(n: number): string {
    return (n / 1_000_000).toFixed(1) + ' M€';
}

export function PriceDashboard({ results, controls }: PriceDashboardProps) {
    const s4 = results[3]; // Week 4
    const s12 = results[11]; // Week 12
    const activeResults = results.filter(r => r.week <= controls.horizon_weeks);

    // Family impact (personal weekly cost increase)
    const personalWeeklyCost = useMemo(() => {
        if (!s4) return 0;
        const gasDelta = s4.gasPump - 1.704; // vs base pump price
        const dieDelta = s4.diePump - 1.633;
        return gasDelta * controls.personal_gas_l_week + dieDelta * controls.personal_die_l_week;
    }, [s4, controls]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Summary metrics */}
            <div className="grid-4">
                <div className="card fade-in stagger-1">
                    <div className="card-title">Gasolina S4</div>
                    <div className="metric">
                        <div className="metric-value" style={{ color: 'var(--accent-blue)' }}>
                            {s4 ? formatEur(s4.gasEff) : '—'}
                        </div>
                        <div className="metric-label">Preço eficiente</div>
                    </div>
                </div>
                <div className="card fade-in stagger-2">
                    <div className="card-title">Gasóleo S4</div>
                    <div className="metric">
                        <div className="metric-value" style={{ color: 'var(--accent-blue)' }}>
                            {s4 ? formatEur(s4.dieEff) : '—'}
                        </div>
                        <div className="metric-label">Preço eficiente</div>
                    </div>
                </div>
                <div className="card fade-in stagger-3">
                    <div className="card-title">Custo Acumulado 4 Sem</div>
                    <div className="metric">
                        <div className="metric-value" style={{ color: 'var(--accent-2nd)' }}>
                            {s4 ? formatMEur(s4.cumCost) : '—'}
                        </div>
                        <div className="metric-label">Mecanismo IVA</div>
                    </div>
                </div>
                <div className="card fade-in stagger-4">
                    <div className="card-title">Custo Acumulado 12 Sem</div>
                    <div className="metric">
                        <div className="metric-value" style={{ color: 'var(--accent-3rd)' }}>
                            {s12 ? formatMEur(s12.cumCost) : '—'}
                        </div>
                        <div className="metric-label">Mecanismo IVA</div>
                    </div>
                </div>
            </div>

            {/* Family impact */}
            <div className="card fade-in">
                <div className="card-title">💰 Impacto Familiar Semanal (S4)</div>
                <div className="metric">
                    <div className="metric-value" style={{
                        color: personalWeeklyCost > 10 ? 'var(--accent-red)' : 'var(--accent-2nd)',
                    }}>
                        +{personalWeeklyCost.toFixed(2)} €/semana
                    </div>
                    <div className="metric-label">
                        Custo extra ({controls.personal_gas_l_week}l gasolina + {controls.personal_die_l_week}l gasóleo)
                    </div>
                </div>
            </div>

            {/* 12-week results table */}
            <div className="card fade-in">
                <div className="card-title">📈 Projecção 12 Semanas — {controls.scenario.toUpperCase()}</div>
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
                                <tr key={r.week} style={{
                                    opacity: r.week > controls.horizon_weeks ? 0.4 : 1,
                                }}>
                                    <td>S{r.week}</td>
                                    <td>
                                        <span className={`phase-badge ${r.phase.toLowerCase().replace('ã', 'a')}`}>
                                            {r.phase}
                                        </span>
                                    </td>
                                    <td>{r.gasEff.toFixed(4)}</td>
                                    <td>{r.dieEff.toFixed(4)}</td>
                                    <td>{formatMEur(r.weeklyTotal)}</td>
                                    <td style={{ fontWeight: 600 }}>{formatMEur(r.cumCost)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Cascade effects */}
            <div className="card fade-in">
                <div className="card-title">⚡ Cascata de Impactos (18 efeitos)</div>
                {CASCADE.map((c, i) => (
                    <div className="cascade-item" key={i}>
                        <div className={`cascade-order o${c.ordem}`}>{c.ordem}ª</div>
                        <div style={{ flex: 1 }}>
                            <div className="cascade-canal">{c.canal}</div>
                            <div className="cascade-mag">{c.mag}</div>
                        </div>
                        <div className="cascade-hor">{c.hor}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
