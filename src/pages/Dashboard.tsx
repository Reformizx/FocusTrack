import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { DayTimeline } from '../components/DayTimeline';
import { useAuth } from '../contexts/AuthContext';
import { listActiveGoals } from '../services/goals';
import { listRelapses } from '../services/relapses';
import {
  listBlocks,
  listCompletionsForDate,
  listRoutines,
  setBlockCompleted,
} from '../services/routines';
import type { Goal, Relapse, Routine, RoutineBlock } from '../types';
import { compareTime, getTodayDateString, selectedRoutineKey } from '../utils/date';
import {
  alertErrorClassName,
  mutedTextClassName,
  pageSubtitleClassName,
  pageTitleClassName,
} from '../utils/styles';
import { calculateGoalStreak, formatStreak } from '../utils/streak';

export function Dashboard() {
  const { user } = useAuth();
  const today = getTodayDateString();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [relapses, setRelapses] = useState<Relapse[]>([]);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [completedBlockIds, setCompletedBlockIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const [goalData, relapseData] = await Promise.all([
        listActiveGoals(user.uid),
        listRelapses(user.uid),
      ]);
      setGoals(goalData);
      setRelapses(relapseData);

      const storedRoutineId = localStorage.getItem(selectedRoutineKey(user.uid));
      if (!storedRoutineId) {
        setRoutine(null);
        setBlocks([]);
        setCompletedBlockIds(new Set());
        return;
      }

      const routines = await listRoutines(user.uid);
      const selected = routines.find((r) => r.id === storedRoutineId);
      if (!selected) {
        setRoutine(null);
        setBlocks([]);
        setCompletedBlockIds(new Set());
        return;
      }

      const [blockData, completions] = await Promise.all([
        listBlocks(user.uid, storedRoutineId),
        listCompletionsForDate(user.uid, today),
      ]);

      const sorted = [...blockData].sort(
        (a, b) => compareTime(a.startTime, b.startTime) || a.order - b.order,
      );

      setRoutine(selected);
      setBlocks(sorted);
      setCompletedBlockIds(
        new Set(
          completions
            .filter((c) => c.routineId === storedRoutineId)
            .map((c) => c.blockId),
        ),
      );
    } catch {
      setError('Não foi possível carregar o dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleBlock(block: RoutineBlock, completed: boolean) {
    if (!user || !routine) return;

    setError('');

    try {
      await setBlockCompleted(
        user.uid,
        routine.id,
        block.id,
        today,
        completed,
        completed
          ? {
              routineTitle: routine.title,
              blockTopic: block.topic,
              startTime: block.startTime,
            }
          : undefined,
      );
      setCompletedBlockIds((prev) => {
        const next = new Set(prev);
        if (completed) next.add(block.id);
        else next.delete(block.id);
        return next;
      });
    } catch {
      setError('Não foi possível atualizar o bloco.');
    }
  }

  const completedCount = blocks.filter((b) => completedBlockIds.has(b.id)).length;
  const progressPercent =
    blocks.length > 0 ? Math.round((completedCount / blocks.length) * 100) : 0;

  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className={pageTitleClassName}>Dashboard</h2>
        <p className={pageSubtitleClassName}>
          Visão geral do seu dia — {todayLabel}.
        </p>
      </div>

      {error && <p className={alertErrorClassName}>{error}</p>}

      {loading ? (
        <p className={mutedTextClassName}>Carregando...</p>
      ) : (
        <>
          <Card title="Metas ativas">
            {goals.length === 0 ? (
              <p className={mutedTextClassName}>
                Nenhuma meta ativa.{' '}
                <Link
                  to="/metas"
                  className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Criar meta →
                </Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {goals.map((goal) => {
                  const streak = calculateGoalStreak(goal.id, goal.createdAt, relapses);
                  return (
                    <li
                      key={goal.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {goal.title}
                        </p>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          🔥 {formatStreak(streak)}
                        </span>
                      </div>
                      {goal.description && (
                        <p className={`mt-1 ${mutedTextClassName}`}>{goal.description}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {goals.length > 0 && (
              <Link
                to="/metas"
                className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Gerenciar metas →
              </Link>
            )}
          </Card>

          <Card title="Rotina de hoje">
            {!routine ? (
              <p className={mutedTextClassName}>
                Nenhuma rotina selecionada.{' '}
                <Link
                  to="/rotina"
                  className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Configurar rotina →
                </Link>
              </p>
            ) : blocks.length === 0 ? (
              <div>
                <p className={mutedTextClassName}>
                  A rotina <strong>{routine.title}</strong> ainda não tem blocos.
                </p>
                <Link
                  to="/rotina"
                  className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Adicionar horários →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className={mutedTextClassName}>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {routine.title}
                    </span>{' '}
                    — {completedCount}/{blocks.length} blocos ({progressPercent}%)
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all dark:bg-indigo-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Timeline do dia
                  </h3>
                  <DayTimeline
                    blocks={blocks}
                    completedBlockIds={completedBlockIds}
                    onToggle={handleToggleBlock}
                  />
                </div>

                <Link
                  to="/rotina"
                  className="inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Editar rotina →
                </Link>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
