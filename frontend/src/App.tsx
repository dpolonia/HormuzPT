import { useState, useMemo, useEffect } from 'react';
import { Controls, DEFAULT_CONTROLS, DEFAULT_MODEL_STATE } from './model/types';
import { compute } from './model/engine';
import { useModelState } from './api/useModelState';
import { apiPost } from './api/client';
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
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const { state: modelState, loading, source } = useModelState();

    const results = useMemo(
        () => compute(modelState, controls),
        [modelState, controls],
    );

    // Track scenario changes to history API
    useEffect(() => {
        apiPost('/history', {
            user: 'User',
            action: 'Mudança de Cenário',
            details: { scenario: controls.scenario }
        }).then(() => {
            setToastMsg('Configuração guardada no histórico.');
            setTimeout(() => setToastMsg(null), 3000);
        }).catch(err => console.warn('History tracking failed:', err));
    }, [controls.scenario]);

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
                                    <PriceDashboard results={results} controls={controls} modelState={modelState} />
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
            
            {toastMsg && (
                <div className="toast">
                    <span style={{ marginRight: 8 }}>✅</span> {toastMsg}
                </div>
            )}
        </>
    );
}
