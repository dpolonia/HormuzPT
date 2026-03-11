import { useState, useMemo } from 'react';
import { Controls, DEFAULT_CONTROLS, DEFAULT_MODEL_STATE } from './model/types';
import { compute } from './model/engine';
import { useModelState } from './api/useModelState';
import { Shell } from './components/layout/Shell';
import { ControlPanel } from './components/controls/ControlPanel';
import { PriceDashboard } from './components/model/PriceDashboard';
import { MacroPanel } from './components/context/MacroPanel';
import { HistoryPage } from './components/history/HistoryPage';
import { ModelChat } from './components/chat/ModelChat';

type View = 'modelo' | 'contexto' | 'historico';

export default function App() {
    const [view, setView] = useState<View>('modelo');
    const [controls, setControls] = useState<Controls>(DEFAULT_CONTROLS);
    const [chatOpen, setChatOpen] = useState(false);
    const { state: modelState, loading, source } = useModelState();

    const results = useMemo(
        () => compute(modelState, controls),
        [modelState, controls],
    );

    return (
        <>
            <Shell view={view} onViewChange={setView}>
                {view === 'modelo' && (
                    <div className="fade-in">
                        <div className="page-header">
                            <h2>📊 Modelo — Cenários de Preços</h2>
                            <span className="header-badge">
                                <span className="dot" />
                                {source === 'fallback' ? 'Fallback' : modelState.version}
                            </span>
                        </div>
                        <div className="page-body">
                            <div className="grid-2" style={{ gridTemplateColumns: '300px 1fr' }}>
                                <div>
                                    <ControlPanel controls={controls} onChange={setControls} />
                                </div>
                                <div>
                                    <PriceDashboard results={results} controls={controls} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'contexto' && (
                    <div className="fade-in">
                        <div className="page-header">
                            <h2>🌍 Contexto — Dados Macroeconómicos</h2>
                            <span className="header-badge">
                                <span className="dot" />
                                APIs
                            </span>
                        </div>
                        <div className="page-body">
                            <MacroPanel />
                        </div>
                    </div>
                )}

                {view === 'historico' && (
                    <div className="fade-in">
                        <div className="page-header">
                            <h2>📝 Histórico — Alterações ao Modelo</h2>
                            <span className="header-badge">
                                <span className="dot" />
                                Changelog
                            </span>
                        </div>
                        <div className="page-body">
                            <HistoryPage />
                        </div>
                    </div>
                )}
            </Shell>

            <ModelChat open={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
        </>
    );
}
