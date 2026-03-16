import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Cell } from 'recharts';

interface Props {
    data: {
        scenarios: Record<string, { summary: Record<string, number> }>;
    };
}

const OUTPUTS = [
    { key: 'gdp_change_pct', label: 'PIB' },
    { key: 'cpi_change_pct', label: 'IPC' },
    { key: 'trade_balance_change_pct', label: 'Balanca' },
    { key: 'unemployment_change_pct', label: 'Desemprego' },
    { key: 'industrial_output_change_pct', label: 'Industria' },
];

const SCENARIO_COLORS: Record<string, string> = {
    moderado: '#4ade80',
    severo: '#facc15',
    extremo: '#ef4444',
    personalizado: '#3b82f6',
};

const SCENARIO_LABELS: Record<string, string> = {
    moderado: 'Moderado',
    severo: 'Severo',
    extremo: 'Extremo',
    personalizado: 'Personalizado',
};

export function ScenarioComparison({ data }: Props) {
    const scenarioKeys = Object.keys(data.scenarios);

    // Build chart data: one row per output, one bar per scenario
    const chartData = OUTPUTS.map(out => {
        const row: any = { output: out.label };
        for (const sk of scenarioKeys) {
            row[sk] = data.scenarios[sk]?.summary?.[out.key] ?? 0;
        }
        return row;
    });

    return (
        <div className="card fade-in" style={{ padding: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Comparacao de Cenarios</div>

            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="output" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }}
                        formatter={(value: number, name: string) => [`${value > 0 ? '+' : ''}${value.toFixed(2)} p.p.`, SCENARIO_LABELS[name] || name]}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: 11 }}
                        formatter={(value: string) => SCENARIO_LABELS[value] || value}
                    />
                    {scenarioKeys.map(sk => (
                        <Bar key={sk} dataKey={sk} fill={SCENARIO_COLORS[sk] || '#64748b'} radius={[3, 3, 0, 0]} />
                    ))}
                </BarChart>
            </ResponsiveContainer>

            {/* Numeric table */}
            <div style={{ marginTop: 16, overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>Indicador</th>
                            {scenarioKeys.map(sk => (
                                <th key={sk} style={{ textAlign: 'right', padding: '4px 8px', color: SCENARIO_COLORS[sk] || 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                                    {SCENARIO_LABELS[sk] || sk}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {OUTPUTS.map(out => (
                            <tr key={out.key}>
                                <td style={{ padding: '4px 8px', color: 'var(--text-primary)' }}>{out.label}</td>
                                {scenarioKeys.map(sk => {
                                    const val = data.scenarios[sk]?.summary?.[out.key] ?? 0;
                                    return (
                                        <td key={sk} className="mono" style={{
                                            textAlign: 'right', padding: '4px 8px',
                                            color: val === 0 ? 'var(--text-muted)' : val < 0 ? '#ef4444' : '#4ade80',
                                        }}>
                                            {val > 0 ? '+' : ''}{val.toFixed(2)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
