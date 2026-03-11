import { useState, useEffect } from 'react';
import { apiGet } from '../../api/client';

interface HistoryEntry {
    version: string;
    created_at: string;
    summary: string;
    risk_class: string;
    model_used: string;
}

interface HistoryData {
    entries: HistoryEntry[];
}

export function HistoryPage() {
    const [data, setData] = useState<HistoryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet<HistoryData>('/history')
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="empty-state">
                <div className="icon">⏳</div>
                <p>A carregar histórico...</p>
            </div>
        );
    }

    if (!data || data.entries.length === 0) {
        return (
            <div className="empty-state fade-in">
                <div className="icon">📝</div>
                <p>Sem entradas no histórico de alterações.</p>
                <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    As recalibrações semanais aparecerão aqui com justificação académica,
                    diffs de parâmetros e referências Scopus.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data.entries.map((entry, i) => (
                <div className="card fade-in" key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{entry.version}</span>
                            <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {entry.created_at}
                            </span>
                        </div>
                        <span className={`phase-badge ${entry.risk_class === 'AUTO_APPLY' ? 'descompressao' : entry.risk_class === 'ADVISORY' ? 'plateau' : 'escalada'}`}>
                            {entry.risk_class}
                        </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{entry.summary}</p>
                    <div className="chat-badge" style={{ marginTop: 12 }}>
                        🤖 {entry.model_used}
                    </div>
                </div>
            ))}
        </div>
    );
}
