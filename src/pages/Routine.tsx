import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { useAuth } from '../contexts/AuthContext';
import { listActiveGoals } from '../services/goals';
import {
  createBlock,
  createRoutine,
  deleteBlock,
  deleteRoutine,
  listBlocks,
  listCompletionsForDate,
  listRoutines,
  setBlockCompleted,
} from '../services/routines';
import type { Goal, Routine, RoutineBlock } from '../types';
import {
  compareTime,
  getTodayDateString,
  selectedRoutineKey,
} from '../utils/date';
import {
  alertErrorClassName,
  labelClassName,
  mutedTextClassName,
  pageSubtitleClassName,
  pageTitleClassName,
  selectClassName,
} from '../utils/styles';

export function RoutinePage() {
  const { user } = useAuth();
  const today = getTodayDateString();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [completedBlockIds, setCompletedBlockIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [routineTitle, setRoutineTitle] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [creatingRoutine, setCreatingRoutine] = useState(false);

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [topic, setTopic] = useState('');
  const [blockDescription, setBlockDescription] = useState('');
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [creatingBlock, setCreatingBlock] = useState(false);

  const selectedRoutine = routines.find((r) => r.id === selectedRoutineId);

  const loadRoutines = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      const data = await listRoutines(user.uid);
      setRoutines(data);

      const storedId = localStorage.getItem(selectedRoutineKey(user.uid));
      const validStored = data.some((r) => r.id === storedId);
      const nextId = validStored ? storedId! : data[0]?.id ?? '';
      setSelectedRoutineId(nextId);
    } catch {
      setError('Não foi possível carregar suas rotinas.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadRoutineDetails = useCallback(async () => {
    if (!user || !selectedRoutineId) {
      setBlocks([]);
      setCompletedBlockIds(new Set());
      return;
    }

    setError('');

    try {
      const [blockData, completions] = await Promise.all([
        listBlocks(user.uid, selectedRoutineId),
        listCompletionsForDate(user.uid, today),
      ]);

      const sorted = [...blockData].sort(
        (a, b) => compareTime(a.startTime, b.startTime) || a.order - b.order,
      );
      setBlocks(sorted);

      const completed = new Set(
        completions
          .filter((c) => c.routineId === selectedRoutineId)
          .map((c) => c.blockId),
      );
      setCompletedBlockIds(completed);
    } catch {
      setError('Não foi possível carregar os blocos da rotina.');
    }
  }, [user, selectedRoutineId, today]);

  useEffect(() => {
    if (!user) return;
    listActiveGoals(user.uid).then(setGoals).catch(() => {});
  }, [user]);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  useEffect(() => {
    loadRoutineDetails();
  }, [loadRoutineDetails]);

  useEffect(() => {
    if (user && selectedRoutineId) {
      localStorage.setItem(selectedRoutineKey(user.uid), selectedRoutineId);
    }
  }, [user, selectedRoutineId]);

  async function handleCreateRoutine(e: FormEvent) {
    e.preventDefault();
    if (!user || !routineTitle.trim()) return;

    setCreatingRoutine(true);
    setError('');

    try {
      const id = await createRoutine(user.uid, routineTitle.trim(), routineDescription.trim());
      setRoutineTitle('');
      setRoutineDescription('');
      await loadRoutines();
      setSelectedRoutineId(id);
    } catch {
      setError('Não foi possível criar a rotina.');
    } finally {
      setCreatingRoutine(false);
    }
  }

  async function handleDeleteRoutine() {
    if (!user || !selectedRoutine) return;
    if (!confirm(`Remover a rotina "${selectedRoutine.title}" e todos os blocos?`)) return;

    setError('');

    try {
      await deleteRoutine(user.uid, selectedRoutine.id);
      localStorage.removeItem(selectedRoutineKey(user.uid));
      setSelectedRoutineId('');
      await loadRoutines();
    } catch {
      setError('Não foi possível remover a rotina.');
    }
  }

  async function handleCreateBlock(e: FormEvent) {
    e.preventDefault();
    if (!user || !selectedRoutineId || !startTime || !topic.trim()) return;

    setCreatingBlock(true);
    setError('');

    try {
      const linkedGoal = goals.find((g) => g.id === linkedGoalId);
      await createBlock(
        user.uid,
        selectedRoutineId,
        startTime,
        topic.trim(),
        blocks.length,
        endTime.trim() || undefined,
        blockDescription.trim() || undefined,
        linkedGoal?.id,
        linkedGoal?.title,
      );
      setStartTime('');
      setEndTime('');
      setTopic('');
      setBlockDescription('');
      setLinkedGoalId('');
      await loadRoutineDetails();
    } catch {
      setError('Não foi possível adicionar o bloco.');
    } finally {
      setCreatingBlock(false);
    }
  }

  async function handleDeleteBlock(blockId: string, blockTopic: string) {
    if (!user || !selectedRoutineId) return;
    if (!confirm(`Remover o bloco "${blockTopic}"?`)) return;

    setError('');

    try {
      await deleteBlock(user.uid, selectedRoutineId, blockId);
      await loadRoutineDetails();
    } catch {
      setError('Não foi possível remover o bloco.');
    }
  }

  async function handleToggleBlock(block: RoutineBlock, completed: boolean) {
    if (!user || !selectedRoutineId || !selectedRoutine) return;

    setError('');

    try {
      await setBlockCompleted(
        user.uid,
        selectedRoutineId,
        block.id,
        today,
        completed,
        completed
          ? {
              routineTitle: selectedRoutine.title,
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
      setError('Não foi possível atualizar o status do bloco.');
    }
  }

  const completedCount = blocks.filter((b) => completedBlockIds.has(b.id)).length;
  const progressPercent =
    blocks.length > 0 ? Math.round((completedCount / blocks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className={pageTitleClassName}>Rotina</h2>
        <p className={pageSubtitleClassName}>
          Organize seu dia em blocos de horário e marque o que concluiu hoje.
        </p>
      </div>

      {error && <p className={alertErrorClassName}>{error}</p>}

      <Card title="Nova rotina">
        <form onSubmit={handleCreateRoutine} className="space-y-4">
          <Input
            label="Nome da rotina"
            value={routineTitle}
            onChange={(e) => setRoutineTitle(e.target.value)}
            required
            placeholder="Ex: Dia de estudo"
          />
          <Textarea
            label="Descrição (opcional)"
            value={routineDescription}
            onChange={(e) => setRoutineDescription(e.target.value)}
            placeholder="Para que serve esta rotina..."
          />
          <Button type="submit" disabled={creatingRoutine}>
            {creatingRoutine ? 'Criando...' : 'Criar rotina'}
          </Button>
        </form>
      </Card>

      {loading ? (
        <p className={mutedTextClassName}>Carregando rotinas...</p>
      ) : routines.length === 0 ? (
        <Card title="Suas rotinas">
          <p className={mutedTextClassName}>
            Você ainda não tem rotinas. Crie a primeira acima.
          </p>
        </Card>
      ) : (
        <>
          <Card title="Rotina de hoje">
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="routine-select" className={labelClassName}>
                  Escolha a rotina
                </label>
                <select
                  id="routine-select"
                  value={selectedRoutineId}
                  onChange={(e) => setSelectedRoutineId(e.target.value)}
                  className={selectClassName}
                >
                  {routines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRoutine?.description && (
                <p className={mutedTextClassName}>{selectedRoutine.description}</p>
              )}

              {blocks.length > 0 && (
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Progresso de hoje
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {completedCount}/{blocks.length} blocos ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all dark:bg-indigo-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <Button variant="danger" onClick={handleDeleteRoutine}>
                Remover rotina
              </Button>
            </div>
          </Card>

          {selectedRoutineId && (
            <>
              <Card title="Adicionar bloco de horário">
                <form onSubmit={handleCreateBlock} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Início"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                    <Input
                      label="Fim (opcional)"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                  <Input
                    label="Tópico"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    placeholder="Ex: Revisão de matéria"
                  />
                  <Textarea
                    label="Descrição (opcional)"
                    value={blockDescription}
                    onChange={(e) => setBlockDescription(e.target.value)}
                    placeholder="Detalhes do que fazer neste horário..."
                  />
                  {goals.length > 0 && (
                    <div className="space-y-1">
                      <label htmlFor="linked-goal" className={labelClassName}>
                        Vincular a meta (opcional)
                      </label>
                      <select
                        id="linked-goal"
                        value={linkedGoalId}
                        onChange={(e) => setLinkedGoalId(e.target.value)}
                        className={selectClassName}
                      >
                        <option value="">Nenhuma meta</option>
                        {goals.map((goal) => (
                          <option key={goal.id} value={goal.id}>
                            {goal.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <Button type="submit" disabled={creatingBlock}>
                    {creatingBlock ? 'Adicionando...' : 'Adicionar bloco'}
                  </Button>
                </form>
              </Card>

              <Card title="Timeline do dia">
                {blocks.length === 0 ? (
                  <p className={mutedTextClassName}>
                    Nenhum bloco ainda. Adicione horários acima.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {blocks.map((block) => {
                      const isCompleted = completedBlockIds.has(block.id);
                      return (
                        <li
                          key={block.id}
                          className={`rounded-lg border p-4 transition-colors ${
                            isCompleted
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                              : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-3">
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={(e) =>
                                  handleToggleBlock(block, e.target.checked)
                                }
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
                                aria-label={`Marcar "${block.topic}" como concluído`}
                              />
                              <div>
                                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                  {block.startTime}
                                  {block.endTime ? ` – ${block.endTime}` : ''}
                                </p>
                                <p
                                  className={`font-medium ${
                                    isCompleted
                                      ? 'text-slate-500 line-through dark:text-slate-400'
                                      : 'text-slate-900 dark:text-slate-100'
                                  }`}
                                >
                                  {block.topic}
                                </p>
                                {block.linkedGoalTitle && (
                                  <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                                    Meta: {block.linkedGoalTitle}
                                  </span>
                                )}
                                {block.description && (
                                  <p className={`mt-1 ${mutedTextClassName}`}>
                                    {block.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              onClick={() => handleDeleteBlock(block.id, block.topic)}
                              className="shrink-0 self-start"
                            >
                              Remover
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
