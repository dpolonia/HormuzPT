import { useCallback } from 'react';

interface ScenarioInputs {
    oil_price_change_pct: number;
    gas_price_change_pct: number;
    electricity_price_change_pct: number;
    shipping_cost_change_pct: number;
    trade_disruption_pct: number;
    shock_duration_days: number;
}

interface Props {
    inputs: ScenarioInputs;
    onChange: (inputs: ScenarioInputs) => void;
    loading: boolean;
}

const PRESETS: Record<string, { label: string; inputs: ScenarioInputs }> = {
    moderado: {
        label: 'Moderado',
        inputs: { oil_price_change_pct: 20, gas_price_change_pct: 15, electricity_price_change_pct: 8, shipping_cost_change_pct: 25, trade_disruption_pct: 5, shock_duration_days: 21 },
    },
    severo: {
        label: 'Severo',
        inputs: { oil_price_change_pct: 40, gas_price_change_pct: 60, electricity_price_change_pct: 25, shipping_cost_change_pct: 50, trade_disruption_pct: 15, shock_duration_days: 42 },
    },
    extremo: {
        label: 'Extremo',
        inputs: { oil_price_change_pct: 80, gas_price_change_pct: 120, electricity_price_change_pct: 50, shipping_cost_change_pct: 100, trade_disruption_pct: 30, shock_duration_days: 84 },
    },
};

const SLIDERS: { key: keyof ScenarioInputs; label: string; min: number; max: number; step: number; unit: string }[] = [
    { key: 'oil_price_change_pct', label: 'Petroleo', min: 0, max: 150, step: 5, unit: '%' },
    { key: 'gas_price_change_pct', label: 'Gas natural', min: 0, max: 200, step: 5, unit: '%' },
    { key: 'electricity_price_change_pct', label: 'Electricidade', min: 0, max: 100, step: 5, unit: '%' },
    { key: 'shipping_cost_change_pct', label: 'Frete maritimo', min: 0, max: 150, step: 5, unit: '%' },
    { key: 'trade_disruption_pct', label: 'Disrupcao comercial', min: 0, max: 50, step: 1, unit: '%' },
    { key: 'shock_duration_days', label: 'Duracao do choque', min: 7, max: 120, step: 7, unit: 'dias' },
];

export function ScenarioControls({ inputs, onChange, loading }: Props) {
    const handleSlider = useCallback((key: keyof ScenarioInputs, value: number) => {
        onChange({ ...inputs, [key]: value });
    }, [inputs, onChange]);

    return (
        <div className="card fade-in" style={{ padding: 16 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>
                Choques Exogenos
                {loading && <span style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)', marginLeft: 8 }}>a calcular...</span>}
            </div>

            {/* Preset buttons */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {Object.entries(PRESETS).map(([key, preset]) => (
                    <button
                        key={key}
                        className="scenario-btn"
                        style={{
                            flex: 1,
                            padding: '6px 8px',
                            fontSize: '0.75rem',
                            background: isPresetActive(inputs, preset.inputs) ? 'var(--accent-blue)' : 'var(--bg-card)',
                            color: isPresetActive(inputs, preset.inputs) ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            cursor: 'pointer',
                        }}
                        onClick={() => onChange(preset.inputs)}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* Sliders */}
            {SLIDERS.map(slider => (
                <div key={slider.key} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{slider.label}</span>
                        <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {slider.key === 'shock_duration_days'
                                ? `${inputs[slider.key]} ${slider.unit}`
                                : `+${inputs[slider.key]}${slider.unit}`
                            }
                        </span>
                    </div>
                    <input
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        value={inputs[slider.key]}
                        onChange={e => handleSlider(slider.key, Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        <span>{slider.min}</span>
                        <span>{slider.max}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function isPresetActive(current: ScenarioInputs, preset: ScenarioInputs): boolean {
    return Object.keys(preset).every(
        k => current[k as keyof ScenarioInputs] === preset[k as keyof ScenarioInputs]
    );
}
