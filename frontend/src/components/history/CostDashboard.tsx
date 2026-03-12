import React, { useState, useEffect } from 'react';

interface CostStats {
  period_days: number;
  total_cost_usd: number;
  max_limit_usd: number;
  percentage_used: number;
}

export const CostDashboard: React.FC = () => {
  const [stats, setStats] = useState<CostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCostStats();
  }, []);

  const fetchCostStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/stats/cost');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to fetch cost stats:', err);
      setError('Erro ao carregar estatísticas de custos (API indisponível ou em erro).');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">A carregar estatísticas de uso LLM...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!stats) return <div className="p-6">Nenhuma estatística disponível.</div>;

  let highlightClass = 'bg-blue-600';
  if (stats.percentage_used >= 50) highlightClass = 'bg-yellow-500';
  if (stats.percentage_used >= 80) highlightClass = 'bg-red-500';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold mb-4 text-emerald-800">Custos API (Painel Administrativo)</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-emerald-100 p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-700">Consumo Semanal (Últimos {stats.period_days} dias)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <div className="text-sm text-gray-500">Custo Acumulado</div>
            <div className="text-2xl font-bold text-gray-900">${stats.total_cost_usd.toFixed(4)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <div className="text-sm text-gray-500">Orçamento Semanal</div>
            <div className="text-2xl font-bold text-gray-900">${stats.max_limit_usd.toFixed(2)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <div className="text-sm text-gray-500">Taxa de Utilização</div>
            <div className="text-2xl font-bold text-gray-900">{stats.percentage_used}%</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm mb-1 text-gray-600">
            <span>Progressão do Limite</span>
            <span>{stats.percentage_used}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
                className={`${highlightClass} h-4 rounded-full transition-all duration-500 ease-in-out`}
                style={{ width: `${Math.min(stats.percentage_used, 100)}%` }}
            ></div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
            * O consumo inclui a soma das taxas de entrada (input) e saída (output) de tokens calculadas linearmente na camada do proxy API, limitadas em {stats.max_limit_usd} USD semanais pelo arquivo de configuração.
        </p>
      </div>
    </div>
  );
};
