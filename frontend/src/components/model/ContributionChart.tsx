import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

interface OutputWithContributions {
    value: number;
    contributions: Record<string, number>;
    unit: string;
    label: string;
}

interface Props {
    title: string;
    output: OutputWithContributions;
}

const CONTRIBUTION_LABELS: Record<string, string> = {
    industrial_cost_pressure: 'Custo industrial',
    export_competitiveness_pressure: 'Competitividade export.',
    shock_duration: 'Duracao do choque',
    energy_import_cost_pressure: 'Custo energ. importado',
    transport_cost_pressure: 'Custo de transporte',
    import_bill_pressure: 'Factura importacao',
    gdp_contraction: 'Contracao PIB',
};

export function ContributionChart({ title, output }: Props) {
    const data = Object.entries(output.contributions).map(([key, value]) => ({
        name: CONTRIBUTION_LABELS[key] || key.replace(/_/g, ' '),
        value,
        key,
    }));

    // Sort by absolute value descending
    data.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return (
        <div className="card fade-in" style={{ padding: 16 }}>
            <div className="card-title" style={{ marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                Total: <span className="mono" style={{ fontWeight: 600 }}>
                    {output.value > 0 ? '+' : ''}{output.value.toFixed(2)} {output.unit}
                </span>
            </div>
            <ResponsiveContainer width="100%" height={data.length * 40 + 20}>
                <BarChart data={data} layout="vertical" margin={{ left: 110, right: 20, top: 5, bottom: 5 }}>
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        width={105}
                    />
                    <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }}
                        formatter={(value: number) => [`${value > 0 ? '+' : ''}${value.toFixed(3)} ${output.unit}`, 'Contribuicao']}
                    />
                    <ReferenceLine x={0} stroke="#475569" />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {data.map((entry, idx) => (
                            <Cell key={idx} fill={entry.value < 0 ? '#ef4444' : '#4ade80'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
