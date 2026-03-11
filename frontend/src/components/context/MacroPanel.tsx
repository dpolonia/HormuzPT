import { useState, useEffect } from 'react';
import { apiGet } from '../../api/client';

interface ContextData {
    source: string;
    updated_at: string;
    ine: Array<{ label: string; value: number | null; period: string; unit: string }>;
    bpstat: Array<{ label: string; value: number | null; period: string; unit: string }>;
}

export function MacroPanel() {
    const [data, setData] = useState<ContextData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet<ContextData>('/context')
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="empty-state">
                <div className="icon">⏳</div>
                <p>A carregar dados macroeconómicos...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="empty-state">
                <div className="icon">⚠️</div>
                <p>Dados indisponíveis — a usar fallback</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card fade-in">
                <div className="card-title">🏛️ INE — Instituto Nacional de Estatística</div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Indicador</th>
                            <th>Valor</th>
                            <th>Período</th>
                            <th>Unidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.ine.map((ind, i) => (
                            <tr key={i}>
                                <td style={{ fontFamily: 'var(--font-display)' }}>{ind.label}</td>
                                <td>{ind.value !== null ? ind.value : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                <td>{ind.period}</td>
                                <td>{ind.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card fade-in stagger-1">
                <div className="card-title">🏦 BPstat — Banco de Portugal</div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Série</th>
                            <th>Valor</th>
                            <th>Período</th>
                            <th>Unidade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.bpstat.map((s, i) => (
                            <tr key={i}>
                                <td style={{ fontFamily: 'var(--font-display)' }}>{s.label}</td>
                                <td>{s.value !== null ? s.value : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                                <td>{s.period}</td>
                                <td>{s.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card fade-in stagger-2" style={{ padding: 24 }}>
                <div className="card-title">ℹ️ Nota</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Os valores serão preenchidos quando os providers de dados (INE, BPstat, ECB, Eurostat)
                    forem conectados às APIs reais. Actualmente a mostrar a estrutura dos dados com placeholders.
                </p>
            </div>
        </div>
    );
}
