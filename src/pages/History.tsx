import { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { listAllGoals } from '../services/goals';
import { listRelapses } from '../services/relapses';
import type { Goal, Relapse } from '../types';
import { formatDate } from '../utils/format';

type Tab = 'relapses' | 'goals';

export function History() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('relapses');
  const [relapses, setRelapses] = useState<Relapse[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const [relapseData, goalData] = await Promise.all([
        listRelapses(user.uid),
        listAllGoals(user.uid),
      ]);
      setRelapses(relapseData);
      setGoals(goalData);
    } catch {
      setError('Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-indigo-600 text-white'
        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
    }`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Histórico</h2>
        <p className="text-sm text-slate-600">
          Visualize seus registros de metas e recaídas.
        </p>
      </div>

      <div className="flex gap-2">
        <button type="button" className={tabClass(tab === 'relapses')} onClick={() => setTab('relapses')}>
          Recaídas
        </button>
        <button type="button" className={tabClass(tab === 'goals')} onClick={() => setTab('goals')}>
          Metas
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-600">Carregando histórico...</p>
      ) : tab === 'relapses' ? (
        <Card title="Recaídas registradas">
          {relapses.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhuma recaída registrada.</p>
          ) : (
            <ul className="space-y-4">
              {relapses.map((relapse) => (
                <li
                  key={relapse.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-slate-900">{relapse.goalTitle}</p>
                    <time className="text-xs text-slate-500">
                      {formatDate(relapse.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-medium">Motivo:</span> {relapse.reason}
                  </p>
                  {relapse.notes && (
                    <p className="mt-1 text-sm text-slate-600">
                      <span className="font-medium">Observações:</span> {relapse.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Card title="Metas">
          {goals.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhuma meta encontrada.</p>
          ) : (
            <ul className="space-y-4">
              {goals.map((goal) => (
                <li
                  key={goal.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-slate-900">{goal.title}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          goal.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {goal.status === 'active' ? 'Ativa' : 'Encerrada'}
                      </span>
                      <time className="text-xs text-slate-500">
                        {formatDate(goal.createdAt)}
                      </time>
                    </div>
                  </div>
                  {goal.description && (
                    <p className="mt-2 text-sm text-slate-600">{goal.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
