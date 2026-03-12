import { ReactNode } from 'react';

interface ShellProps {
    view: string;
    onViewChange: (v: any) => void;
    children: ReactNode;
}

const NAV_ITEMS = [
    { key: 'modelo', icon: '📊', label: 'Modelo' },
    { key: 'contexto', icon: '🌍', label: 'Contexto' },
    { key: 'historico', icon: '📝', label: 'Histórico' },
    { key: 'custos', icon: '💰', label: 'Custos API' },
];

export function Shell({ view, onViewChange, children }: ShellProps) {
    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h1>HormuzPT</h1>
                    <div className="subtitle">Cenários Energéticos · Portugal</div>
                </div>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <div
                            key={item.key}
                            className={`nav-item ${view === item.key ? 'active' : ''}`}
                            onClick={() => onViewChange(item.key)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <p style={{ marginBottom: '8px' }}>
                        <strong>Aviso de Monitorização:</strong> Para fins de auditoria e melhoria do sistema, os seus acessos, ações e conversas com o modelo <strong>são registados</strong> confidencialmente.
                    </p>
                    <p>
                        Exercício de cenários com pressupostos explícitos e fórmulas auditáveis.
                        Não constitui previsão de mercado nem aconselhamento financeiro.
                    </p>
                </div>
            </aside>
            <main className="main-content">
                <div className="dev-banner">
                    <strong>⚠️ EM DESENVOLVIMENTO:</strong> O sistema encontra-se em fase experimental. Os resultados apresentados são estritamente exploratórios, dependem de pressupostos rígidos não validados empiricamente para a atual conjuntura, e <strong>NÃO</strong> devem ser usados como base exclusiva para decisões. Exigem validação humana especializada.
                </div>
                {children}
            </main>
        </div>
    );
}
