import { useState } from 'react';
import { apiPost } from '../../api/client';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    model?: string;
    tier?: string;
    tokens_in?: number;
    tokens_out?: number;
    cost_eur?: number;
}

interface ChatResponse {
    answer: string;
    model: string;
    tier: string;
    tokens_in: number;
    tokens_out: number;
    cost_eur: number;
}

interface ModelChatProps {
    open: boolean;
    onToggle: () => void;
}

export function ModelChat({ open, onToggle }: ModelChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const send = async () => {
        const question = input.trim();
        if (!question || loading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: question }]);
        setLoading(true);

        try {
            const res = await apiPost<ChatResponse>('/chat', { question });
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: res.answer,
                model: res.model,
                tier: res.tier,
                tokens_in: res.tokens_in,
                tokens_out: res.tokens_out,
                cost_eur: res.cost_eur,
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Erro ao contactar o servidor. Tente novamente.',
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button className="chat-toggle" onClick={onToggle} aria-label="Chat">
                💬
            </button>

            <div className={`chat-panel ${open ? 'open' : ''}`}>
                <div className="chat-header">
                    <h3>💬 Q&A com o Modelo</h3>
                    <button
                        onClick={onToggle}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '1.2rem',
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            <p style={{ fontSize: '0.85rem' }}>
                                Faça perguntas sobre o modelo, cenários ou impactos.
                            </p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`chat-msg ${msg.role}`}>
                            <div>{msg.content}</div>
                            {msg.model && (
                                <div className="chat-badge">
                                    🤖 {msg.model} · {msg.tier}
                                    {msg.tokens_in !== undefined && (
                                        <span> · {msg.tokens_in} in · {msg.tokens_out} out</span>
                                    )}
                                    {msg.cost_eur !== undefined && msg.cost_eur > 0 && (
                                        <span> · ~€{msg.cost_eur.toFixed(4)}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-msg assistant" style={{ opacity: 0.6 }}>
                            A pensar...
                        </div>
                    )}
                </div>

                <div className="chat-input-area">
                    <input
                        className="chat-input"
                        placeholder="Escreva a sua pergunta..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && send()}
                        disabled={loading}
                    />
                    <button className="chat-send" onClick={send} disabled={loading}>
                        Enviar
                    </button>
                </div>
            </div>
        </>
    );
}
