import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { useAuth } from '../contexts/AuthContext';
import { createGoal, deleteGoal, listActiveGoals } from '../services/goals';
import { createRelapse } from '../services/relapses';
import type { Goal } from '../types';

export function Dashboard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
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

  const loadGoals = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const data = await listActiveGoals(user.uid);
      setGoals(data);
    } catch {
      setError('Não foi possível carregar suas metas.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

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
      await loadGoals();
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
      await loadGoals();
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
    } catch {
      setError('Não foi possível registrar a recaída.');
    } finally {
      setCreatingRelapse(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-600">
          Gerencie suas metas e registre recaídas.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

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
          <p className="text-sm text-slate-600">Carregando metas...</p>
        ) : goals.length === 0 ? (
          <p className="text-sm text-slate-600">
            Você ainda não tem metas. Crie sua primeira meta acima.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {goals.map((goal) => (
              <li
                key={goal.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{goal.title}</p>
                  {goal.description && (
                    <p className="mt-1 text-sm text-slate-600">{goal.description}</p>
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
            ))}
          </ul>
        )}
      </Card>

      <Card title="Registrar recaída">
        {goals.length === 0 ? (
          <p className="text-sm text-slate-600">
            Crie uma meta ativa antes de registrar uma recaída.
          </p>
        ) : (
          <form onSubmit={handleCreateRelapse} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="goal-select"
                className="block text-sm font-medium text-slate-700"
              >
                Meta
              </label>
              <select
                id="goal-select"
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

            {relapseSuccess && (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                {relapseSuccess}
              </p>
            )}

            <Button type="submit" disabled={creatingRelapse}>
              {creatingRelapse ? 'Registrando...' : 'Registrar recaída'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
