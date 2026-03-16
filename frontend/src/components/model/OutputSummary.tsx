interface OutputWithContributions {
    value: number;
    unit: string;
    label: string;
}

interface Props {
    outputs: Record<string, OutputWithContributions>;
}

const OUTPUT_ORDER = [
    'gdp_change_pct',
    'cpi_change_pct',
    'trade_balance_change_pct',
    'unemployment_change_pct',
    'industrial_output_change_pct',
];

const OUTPUT_ICONS: Record<string, string> = {
    gdp_change_pct: 'PIB',
    cpi_change_pct: 'IPC',
    trade_balance_change_pct: 'Balanca',
    unemployment_change_pct: 'Desemprego',
    industrial_output_change_pct: 'Industria',
};

export function OutputSummary({ outputs }: Props) {
    return (
        <div className="card fade-in" style={{ padding: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Impactos Macroeconomicos</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {OUTPUT_ORDER.map(key => {
                    const out = outputs[key];
                    if (!out) return null;
                    const isNeg = out.value < 0;
                    const isPos = out.value > 0;
                    // GDP neg = bad, CPI pos = bad, unemployment pos = bad
                    const isBad = (key === 'gdp_change_pct' && isNeg) ||
                                  (key === 'cpi_change_pct' && isPos) ||
                                  (key === 'trade_balance_change_pct' && isNeg) ||
                                  (key === 'unemployment_change_pct' && isPos) ||
                                  (key === 'industrial_output_change_pct' && isNeg);

                    const color = out.value === 0 ? 'var(--text-secondary)' :
                                  isBad ? '#ef4444' : '#4ade80';

                    return (
                        <div key={key} style={{
                            textAlign: 'center',
                            padding: '12px 8px',
                            background: 'var(--bg-panel)',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                        }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>
                                {OUTPUT_ICONS[key] || key}
                            </div>
                            <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color }}>
                                {out.value > 0 ? '+' : ''}{out.value.toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                {out.unit}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
