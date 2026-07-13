import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { useAuth } from '../contexts/AuthContext';
import { createGoal, deleteGoal, listActiveGoals } from '../services/goals';
import { createRelapse, listRelapses } from '../services/relapses';
import type { Goal, Relapse } from '../types';
import {
  alertErrorClassName,
  alertSuccessClassName,
  labelClassName,
  mutedTextClassName,
  pageSubtitleClassName,
  pageTitleClassName,
  selectClassName,
} from '../utils/styles';
import { calculateGoalStreak, formatStreak } from '../utils/streak';

export function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [relapses, setRelapses] = useState<Relapse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creatingGoal, setCreatingGoal] = useState(false);

  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [creatingRelapse, setCreatingRelapse] = useState(false);
  const [relapseSuccess, setRelapseSuccess] = useState('');

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
    } catch {
      setError('Não foi possível carregar suas metas.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (goals.length > 0 && !goals.some((g) => g.id === selectedGoalId)) {
      setSelectedGoalId(goals[0].id);
    } else if (goals.length === 0) {
      setSelectedGoalId('');
    }
  }, [goals, selectedGoalId]);

  async function handleCreateGoal(e: FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setCreatingGoal(true);
    setError('');

    try {
      await createGoal(user.uid, title.trim(), description.trim());
      setTitle('');
      setDescription('');
      await loadData();
    } catch {
      setError('Não foi possível criar a meta.');
    } finally {
      setCreatingGoal(false);
    }
  }

  async function handleDeleteGoal(goalId: string, goalTitle: string) {
    if (!user) return;
    if (!confirm(`Remover a meta "${goalTitle}"?`)) return;

    setError('');

    try {
      await deleteGoal(user.uid, goalId);
      await loadData();
    } catch {
      setError('Não foi possível remover a meta.');
    }
  }

  async function handleCreateRelapse(e: FormEvent) {
    e.preventDefault();
    if (!user || goals.length === 0) return;

    const goal = goals.find((g) => g.id === selectedGoalId);
    if (!goal || !reason.trim()) return;

    setCreatingRelapse(true);
    setRelapseSuccess('');
    setError('');

    try {
      await createRelapse(
        user.uid,
        goal.id,
        goal.title,
        reason.trim(),
        notes.trim(),
      );
      setReason('');
      setNotes('');
      setRelapseSuccess('Recaída registrada com sucesso.');
      await loadData();
    } catch {
      setError('Não foi possível registrar a recaída.');
    } finally {
      setCreatingRelapse(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className={pageTitleClassName}>Metas</h2>
        <p className={pageSubtitleClassName}>
          Crie metas de autocontrole, acompanhe streaks e registre recaídas.
        </p>
      </div>

      {error && <p className={alertErrorClassName}>{error}</p>}

      <Card title="Nova meta">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Ex: Reduzir uso de redes sociais"
          />
          <Textarea
            label="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes sobre sua meta..."
          />
          <Button type="submit" disabled={creatingGoal}>
            {creatingGoal ? 'Adicionando...' : 'Adicionar meta'}
          </Button>
        </form>
      </Card>

      <Card title="Metas ativas">
        {loading ? (
          <p className={mutedTextClassName}>Carregando metas...</p>
        ) : goals.length === 0 ? (
          <p className={mutedTextClassName}>
            Você ainda não tem metas. Crie sua primeira meta acima.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {goals.map((goal) => {
              const streak = calculateGoalStreak(goal.id, goal.createdAt, relapses);
              return (
                <li
                  key={goal.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {goal.title}
                      </p>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        🔥 {formatStreak(streak)} sem recaída
                      </span>
                    </div>
                    {goal.description && (
                      <p className={`mt-1 ${mutedTextClassName}`}>{goal.description}</p>
                    )}
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteGoal(goal.id, goal.title)}
                    className="shrink-0"
                  >
                    Remover
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Registrar recaída">
        {goals.length === 0 ? (
          <p className={mutedTextClassName}>
            Crie uma meta ativa antes de registrar uma recaída.
          </p>
        ) : (
          <form onSubmit={handleCreateRelapse} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="goal-select" className={labelClassName}>
                Meta
              </label>
              <select
                id="goal-select"
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className={selectClassName}
                required
              >
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Motivo da recaída"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="O que levou à recaída?"
            />
            <Textarea
              label="Observações (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexto adicional..."
            />

            {relapseSuccess && <p className={alertSuccessClassName}>{relapseSuccess}</p>}

            <Button type="submit" disabled={creatingRelapse}>
              {creatingRelapse ? 'Registrando...' : 'Registrar recaída'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
