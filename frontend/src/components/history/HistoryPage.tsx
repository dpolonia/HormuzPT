import { useState, useEffect } from 'react';
import { apiGet } from '../../api/client';

interface HistoryEntry {
    id: number;
    timestamp: string;
    user: string;
    action: string;
    details: string;
}

interface HistoryData {
    events: HistoryEntry[];
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

    if (!data || data.events.length === 0) {
        return (
            <div className="empty-state fade-in">
                <div className="icon">📝</div>
                <p>Sem entradas no histórico de alterações.</p>
                <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    As interações com o dashboard e recalibrações aparecem aqui.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data.events.map((entry, i) => (
                <div className="card fade-in" key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>#{entry.id} {entry.action}</span>
                            <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(entry.timestamp).toLocaleString('pt-PT')}
                            </span>
                        </div>
                        <span className="phase-badge plateau">
                            {entry.user}
                        </span>
                    </div>
                    {entry.details && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Detalhes: {entry.details}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}
