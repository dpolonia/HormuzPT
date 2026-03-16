interface Props {
    inputs: Record<string, number>;
    intermediate: Record<string, number>;
    outputs: Record<string, { value: number; label: string; unit: string }>;
}

const INPUT_LABELS: Record<string, string> = {
    oil_price_change_pct: 'Petroleo',
    gas_price_change_pct: 'Gas natural',
    electricity_price_change_pct: 'Electricidade',
    shipping_cost_change_pct: 'Frete maritimo',
    trade_disruption_pct: 'Disrupcao comercial',
    shock_duration_days: 'Duracao (dias)',
};

const INTERMEDIATE_LABELS: Record<string, string> = {
    energy_import_cost_pressure: 'Custo energ. importado',
    transport_cost_pressure: 'Custo transporte',
    industrial_cost_pressure: 'Custo industrial',
    consumer_price_pressure: 'Precos consumidor',
    export_competitiveness_pressure: 'Competitividade export.',
    import_bill_pressure: 'Factura importacao',
    normalized_duration: 'Duracao (meses)',
};

const OUTPUT_LABELS: Record<string, string> = {
    gdp_change_pct: 'PIB',
    cpi_change_pct: 'IPC',
    trade_balance_change_pct: 'Balanca comercial',
    unemployment_change_pct: 'Desemprego',
    industrial_output_change_pct: 'Produto industrial',
};

export function TransmissionFlow({ inputs, intermediate, outputs }: Props) {
    const inputKeys = Object.keys(inputs).filter(k => k in INPUT_LABELS);
    const interKeys = Object.keys(intermediate).filter(k => k in INTERMEDIATE_LABELS);
    const outputKeys = Object.keys(outputs).filter(k => k in OUTPUT_LABELS);

    return (
        <div className="card fade-in" style={{ padding: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Cadeia de Transmissao</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 1fr 30px 1fr', gap: 0, alignItems: 'start' }}>
                {/* Layer 1: Inputs */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Choques Exogenos
                    </div>
                    {inputKeys.map(key => (
                        <FlowCard
                            key={key}
                            label={INPUT_LABELS[key] || key}
                            value={inputs[key]}
                            unit={key === 'shock_duration_days' ? 'dias' : '%'}
                            color="var(--accent-green)"
                            prefix={key !== 'shock_duration_days' ? '+' : ''}
                        />
                    ))}
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 30 }}>
                    <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>→</span>
                </div>

                {/* Layer 2: Intermediate */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-yellow)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Transmissao
                    </div>
                    {interKeys.map(key => (
                        <FlowCard
                            key={key}
                            label={INTERMEDIATE_LABELS[key] || key}
                            value={intermediate[key]}
                            unit={key === 'normalized_duration' ? 'meses' : '%'}
                            color="var(--accent-yellow)"
                        />
                    ))}
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', paddingTop: 30 }}>
                    <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>→</span>
                </div>

                {/* Layer 3: Outputs */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Impactos Macro
                    </div>
                    {outputKeys.map(key => {
                        const out = outputs[key];
                        return (
                            <FlowCard
                                key={key}
                                label={OUTPUT_LABELS[key] || key}
                                value={out.value}
                                unit={out.unit}
                                color={out.value < 0 ? '#ef4444' : out.value > 0 ? (
                                    // Positive CPI/unemployment = bad
                                    key === 'cpi_change_pct' || key === 'unemployment_change_pct' ? '#ef4444' : '#4ade80'
                                ) : 'var(--text-muted)'}
                            />
                        );
                    })}
                </div>
            </div>

            <div style={{ marginTop: 12, fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Os coeficientes de transmissao sao configuraveis. Cada seta representa equacoes explicitas documentadas.
            </div>
        </div>
    );
}

function FlowCard({ label, value, unit, color, prefix = '' }: {
    label: string; value: number; unit: string; color: string; prefix?: string;
}) {
    return (
        <div style={{
            background: 'var(--bg-panel)',
            border: `1px solid var(--border)`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 6,
            padding: '6px 10px',
            marginBottom: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{label}</span>
            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600, color }}>
                {prefix}{value > 0 && !prefix ? '+' : ''}{value.toFixed(2)} {unit}
            </span>
        </div>
    );
}
