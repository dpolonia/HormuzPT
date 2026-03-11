import { Controls } from '../../model/types';

interface ControlPanelProps {
    controls: Controls;
    onChange: (c: Controls) => void;
}

export function ControlPanel({ controls, onChange }: ControlPanelProps) {
    const update = (partial: Partial<Controls>) =>
        onChange({ ...controls, ...partial });

    return (
        <div className="control-panel">
            <div className="control-group">
                <span className="control-label">Cenário</span>
                <div className="scenario-buttons">
                    {(['moderado', 'severo', 'extremo'] as const).map(s => (
                        <button
                            key={s}
                            className={`scenario-btn ${s} ${controls.scenario === s ? 'active' : ''}`}
                            onClick={() => update({ scenario: s })}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="control-group">
                <span className="control-label">
                    Elasticidade Gasolina: {controls.elast_gas.toFixed(2)}
                </span>
                <input
                    type="range"
                    className="control-slider"
                    min="-0.5"
                    max="0"
                    step="0.01"
                    value={controls.elast_gas}
                    onChange={e => update({ elast_gas: parseFloat(e.target.value) })}
                />
            </div>

            <div className="control-group">
                <span className="control-label">
                    Elasticidade Gasóleo: {controls.elast_die.toFixed(2)}
                </span>
                <input
                    type="range"
                    className="control-slider"
                    min="-0.5"
                    max="0"
                    step="0.01"
                    value={controls.elast_die}
                    onChange={e => update({ elast_die: parseFloat(e.target.value) })}
                />
            </div>

            <div className="control-group">
                <span className="control-label">
                    Horizonte: {controls.horizon_weeks} semanas
                </span>
                <input
                    type="range"
                    className="control-slider"
                    min="4"
                    max="12"
                    step="1"
                    value={controls.horizon_weeks}
                    onChange={e => update({ horizon_weeks: parseInt(e.target.value) })}
                />
            </div>

            <div className="control-group">
                <span className="control-label">
                    Retenção desconto gasolina: {(controls.retain_disc_gas * 100).toFixed(0)}%
                </span>
                <input
                    type="range"
                    className="control-slider"
                    min="0"
                    max="1"
                    step="0.1"
                    value={controls.retain_disc_gas}
                    onChange={e => update({ retain_disc_gas: parseFloat(e.target.value) })}
                />
            </div>

            <div className="control-group">
                <span className="control-label">
                    Retenção desconto gasóleo: {(controls.retain_disc_die * 100).toFixed(0)}%
                </span>
                <input
                    type="range"
                    className="control-slider"
                    min="0"
                    max="1"
                    step="0.1"
                    value={controls.retain_disc_die}
                    onChange={e => update({ retain_disc_die: parseFloat(e.target.value) })}
                />
            </div>

            <div className="control-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={controls.use_official_w1}
                        onChange={e => update({ use_official_w1: e.target.checked })}
                    />
                    <span className="control-label" style={{ margin: 0 }}>
                        Desconto oficial S1
                    </span>
                </label>
            </div>

            <div className="card" style={{ marginTop: 8 }}>
                <div className="card-title">Calculadora Familiar</div>
                <div className="control-group">
                    <span className="control-label">Gasóleo (l/semana)</span>
                    <input
                        type="number"
                        className="control-input"
                        value={controls.personal_die_l_week}
                        onChange={e => update({ personal_die_l_week: parseFloat(e.target.value) || 0 })}
                    />
                </div>
                <div className="control-group" style={{ marginTop: 8 }}>
                    <span className="control-label">Gasolina (l/semana)</span>
                    <input
                        type="number"
                        className="control-input"
                        value={controls.personal_gas_l_week}
                        onChange={e => update({ personal_gas_l_week: parseFloat(e.target.value) || 0 })}
                    />
                </div>
            </div>
        </div>
    );
}
