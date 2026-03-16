import { useState, useCallback, useEffect, useRef, Component, ReactNode } from 'react';
import { apiPost, apiGet } from '../../api/client';
import { ScenarioControls } from './ScenarioControls';
import { OutputSummary } from './OutputSummary';
import { ContributionChart } from './ContributionChart';
import { SensitivityChart } from './SensitivityChart';
import { ScenarioComparison } from './ScenarioComparison';
import { TransmissionFlow } from './TransmissionFlow';

interface ScenarioInputs {
    oil_price_change_pct: number;
    gas_price_change_pct: number;
    electricity_price_change_pct: number;
    shipping_cost_change_pct: number;
    trade_disruption_pct: number;
    shock_duration_days: number;
}

const DEFAULT_INPUTS: ScenarioInputs = {
    oil_price_change_pct: 40,
    gas_price_change_pct: 60,
    electricity_price_change_pct: 25,
    shipping_cost_change_pct: 50,
    trade_disruption_pct: 15,
    shock_duration_days: 42,
};

/** Error boundary wrapping each section independently */
class SectionBoundary extends Component<
    { name: string; children: ReactNode },
    { error: Error | null }
> {
    state = { error: null as Error | null };
    static getDerivedStateFromError(error: Error) { return { error }; }
    render() {
        if (this.state.error) {
            return (
                <div className="card" style={{ padding: 16, border: '1px solid #ef4444' }}>
                    <div style={{ color: '#ef4444', fontWeight: 600 }}>
                        Erro em {this.props.name}
                    </div>
                    <pre style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 8, whiteSpace: 'pre-wrap' }}>
                        {this.state.error.message}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

export function EconomicDashboard() {
    const [inputs, setInputs] = useState<ScenarioInputs>(DEFAULT_INPUTS);
    const [result, setResult] = useState<any>(null);
    const [sensitivity, setSensitivity] = useState<any>(null);
    const [comparison, setComparison] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [sensVar, setSensVar] = useState('oil_price_change_pct');
    const [error, setError] = useState<string | null>(null);
    const initDone = useRef(false);

    const runModel = useCallback(async (scenarioInputs: ScenarioInputs) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiPost('/model/run', { inputs: scenarioInputs });
            setResult(res);
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    }, []);

    const runSensitivity = useCallback(async (variable: string, baseline: ScenarioInputs) => {
        try {
            const res = await apiPost('/model/sensitivity', {
                variable,
                min: 0,
                max: variable === 'shock_duration_days' ? 120 : 100,
                step: variable === 'shock_duration_days' ? 10 : 5,
                baseline,
            });
            setSensitivity(res);
        } catch (e: any) {
            console.warn('Sensitivity failed:', e);
        }
    }, []);

    const runComparison = useCallback(async (currentInputs: ScenarioInputs) => {
        try {
            const presets = await apiGet<any>('/model/presets');
            const scenarios: Record<string, ScenarioInputs> = {};
            for (const [key, preset] of Object.entries(presets.presets) as any[]) {
                scenarios[key] = preset.inputs;
            }
            scenarios['personalizado'] = currentInputs;
            const res = await apiPost('/model/compare', { scenarios });
            setComparison(res);
        } catch (e: any) {
            console.warn('Comparison failed:', e);
        }
    }, []);

    // Run model when inputs change
    useEffect(() => {
        runModel(inputs);
    }, [inputs, runModel]);

    // Run sensitivity + comparison on first load only
    useEffect(() => {
        if (initDone.current) return;
        initDone.current = true;
        runSensitivity(sensVar, inputs);
        runComparison(inputs);
    }, []);

    const handleInputChange = useCallback((newInputs: ScenarioInputs) => {
        setInputs(newInputs);
    }, []);

    const handleSensVarChange = useCallback((variable: string) => {
        setSensVar(variable);
        runSensitivity(variable, inputs);
    }, [runSensitivity, inputs]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
                <div className="card" style={{ background: 'rgba(239,68,68,0.15)', borderColor: '#ef4444', padding: 16 }}>
                    <strong style={{ color: '#ef4444' }}>Erro API:</strong> {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
                {/* Left: Controls */}
                <div>
                    <SectionBoundary name="ScenarioControls">
                        <ScenarioControls
                            inputs={inputs}
                            onChange={handleInputChange}
                            loading={loading}
                        />
                    </SectionBoundary>
                </div>

                {/* Right: Results */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Output Summary */}
                    {result && (
                        <SectionBoundary name="OutputSummary">
                            <OutputSummary outputs={result.outputs} />
                        </SectionBoundary>
                    )}

                    {/* Transmission Flow */}
                    {result && (
                        <SectionBoundary name="TransmissionFlow">
                            <TransmissionFlow
                                inputs={result.inputs}
                                intermediate={result.intermediate}
                                outputs={result.outputs}
                            />
                        </SectionBoundary>
                    )}

                    {/* Contribution Charts */}
                    {result && (
                        <SectionBoundary name="ContributionCharts">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <ContributionChart
                                    title="Contribuicoes para PIB"
                                    output={result.outputs.gdp_change_pct}
                                />
                                <ContributionChart
                                    title="Contribuicoes para IPC"
                                    output={result.outputs.cpi_change_pct}
                                />
                            </div>
                        </SectionBoundary>
                    )}

                    {/* Sensitivity */}
                    <SectionBoundary name="SensitivityChart">
                        <SensitivityChart
                            data={sensitivity}
                            currentVar={sensVar}
                            onVarChange={handleSensVarChange}
                        />
                    </SectionBoundary>

                    {/* Scenario Comparison */}
                    {comparison && (
                        <SectionBoundary name="ScenarioComparison">
                            <ScenarioComparison data={comparison} />
                        </SectionBoundary>
                    )}
                </div>
            </div>
        </div>
    );
}
