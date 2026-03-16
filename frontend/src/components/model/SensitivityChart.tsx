import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface Props {
    data: any;
    currentVar: string;
    onVarChange: (variable: string) => void;
}

const VARIABLES = [
    { key: 'oil_price_change_pct', label: 'Petroleo' },
    { key: 'gas_price_change_pct', label: 'Gas natural' },
    { key: 'electricity_price_change_pct', label: 'Electricidade' },
    { key: 'shipping_cost_change_pct', label: 'Frete' },
    { key: 'trade_disruption_pct', label: 'Disrupcao' },
    { key: 'shock_duration_days', label: 'Duracao' },
];

const OUTPUT_LINES = [
    { key: 'gdp_change_pct', label: 'PIB', color: '#ef4444' },
    { key: 'cpi_change_pct', label: 'IPC', color: '#facc15' },
    { key: 'unemployment_change_pct', label: 'Desemprego', color: '#fb923c' },
    { key: 'industrial_output_change_pct', label: 'Industria', color: '#3b82f6' },
    { key: 'trade_balance_change_pct', label: 'Balanca', color: '#a78bfa' },
];

export function SensitivityChart({ data, currentVar, onVarChange }: Props) {
    return (
        <div className="card fade-in" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="card-title">Analise de Sensibilidade</div>
                <div style={{ display: 'flex', gap: 4 }}>
                    {VARIABLES.map(v => (
                        <button
                            key={v.key}
                            style={{
                                padding: '4px 8px',
                                fontSize: '0.65rem',
                                background: currentVar === v.key ? 'var(--accent-blue)' : 'var(--bg-panel)',
                                color: currentVar === v.key ? '#fff' : 'var(--text-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: 4,
                                cursor: 'pointer',
                            }}
                            onClick={() => onVarChange(v.key)}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {data?.points ? (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.points} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                            dataKey={currentVar}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            label={{ value: data.variable_label || currentVar, position: 'bottom', fill: '#64748b', fontSize: 11, offset: -5 }}
                        />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }}
                            formatter={(value: number, name: string) => [`${value.toFixed(3)} p.p.`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {OUTPUT_LINES.map(line => (
                            <Line
                                key={line.key}
                                type="monotone"
                                dataKey={line.key}
                                name={line.label}
                                stroke={line.color}
                                strokeWidth={2}
                                dot={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    A carregar dados de sensibilidade...
                </div>
            )}
        </div>
    );
}
