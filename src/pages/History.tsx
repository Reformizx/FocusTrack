import { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { listAllGoals } from '../services/goals';
import { listRelapses } from '../services/relapses';
import { listAllCompletions } from '../services/routines';
import type { Goal, Relapse, RoutineCompletion } from '../types';
import { formatDate } from '../utils/format';
import {
  alertErrorClassName,
  mutedTextClassName,
  pageSubtitleClassName,
  pageTitleClassName,
  tabClass,
} from '../utils/styles';
import { calculateGoalStreak, formatStreak } from '../utils/streak';

type Tab = 'relapses' | 'goals' | 'routines';

export function History() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('relapses');
  const [relapses, setRelapses] = useState<Relapse[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<RoutineCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const [relapseData, goalData, completionData] = await Promise.all([
        listRelapses(user.uid),
        listAllGoals(user.uid),
        listAllCompletions(user.uid),
      ]);
      setRelapses(relapseData);
      setGoals(goalData);
      setCompletions(completionData);
    } catch {
      setError('Não foi possível carregar o histórico.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completionsByDate = completions.reduce<Record<string, RoutineCompletion[]>>(
    (acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    },
    {},
  );

  const sortedDates = Object.keys(completionsByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div>
        <h2 className={pageTitleClassName}>Histórico</h2>
        <p className={pageSubtitleClassName}>
          Visualize metas, recaídas e conclusões de rotina.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabClass(tab === 'relapses')} onClick={() => setTab('relapses')}>
          Recaídas
        </button>
        <button type="button" className={tabClass(tab === 'goals')} onClick={() => setTab('goals')}>
          Metas
        </button>
        <button type="button" className={tabClass(tab === 'routines')} onClick={() => setTab('routines')}>
          Rotinas
        </button>
      </div>

      {error && <p className={alertErrorClassName}>{error}</p>}

      {loading ? (
        <p className={mutedTextClassName}>Carregando histórico...</p>
      ) : tab === 'relapses' ? (
        <Card title="Recaídas registradas">
          {relapses.length === 0 ? (
            <p className={mutedTextClassName}>Nenhuma recaída registrada.</p>
          ) : (
            <ul className="space-y-4">
              {relapses.map((relapse) => (
                <li
                  key={relapse.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {relapse.goalTitle}
                    </p>
                    <time className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(relapse.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Motivo:</span> {relapse.reason}
                  </p>
                  {relapse.notes && (
                    <p className={`mt-1 ${mutedTextClassName}`}>
                      <span className="font-medium">Observações:</span> {relapse.notes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : tab === 'goals' ? (
        <Card title="Metas">
          {goals.length === 0 ? (
            <p className={mutedTextClassName}>Nenhuma meta encontrada.</p>
          ) : (
            <ul className="space-y-4">
              {goals.map((goal) => {
                const streak = calculateGoalStreak(goal.id, goal.createdAt, relapses);
                return (
                  <li
                    key={goal.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {goal.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          🔥 {formatStreak(streak)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            goal.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {goal.status === 'active' ? 'Ativa' : 'Encerrada'}
                        </span>
                        <time className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(goal.createdAt)}
                        </time>
                      </div>
                    </div>
                    {goal.description && (
                      <p className={`mt-2 ${mutedTextClassName}`}>{goal.description}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ) : (
        <Card title="Rotinas concluídas">
          {sortedDates.length === 0 ? (
            <p className={mutedTextClassName}>Nenhum bloco de rotina concluído ainda.</p>
          ) : (
            <ul className="space-y-6">
              {sortedDates.map((date) => (
                <li key={date}>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h3>
                  <ul className="space-y-2">
                    {completionsByDate[date].map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {item.blockTopic || 'Bloco concluído'}
                        </p>
                        <p className={`mt-1 ${mutedTextClassName}`}>
                          {item.routineTitle && `${item.routineTitle} · `}
                          {item.startTime && `${item.startTime} · `}
                          {formatDate(item.completedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
