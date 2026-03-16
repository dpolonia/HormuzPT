import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: Error | null }
> {
    state = { error: null as Error | null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <div style={{
                    padding: 40, color: '#EF4444', background: '#0F172A',
                    fontFamily: 'monospace', minHeight: '100vh',
                }}>
                    <h1 style={{ color: '#F1F5F9' }}>HormuzPT — Runtime Error</h1>
                    <pre style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>
                        {this.state.error.message}
                    </pre>
                    <pre style={{ marginTop: 8, fontSize: '0.8rem', color: '#94A3B8' }}>
                        {this.state.error.stack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
);
