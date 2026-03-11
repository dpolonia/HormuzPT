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
                    Exercício de cenários com pressupostos explícitos e fórmulas auditáveis.
                    Não constitui previsão de mercado nem aconselhamento financeiro.
                </div>
            </aside>
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
