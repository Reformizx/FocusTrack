import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Goal, GoalStatus } from '../types';

function goalsCollection(userId: string) {
  return collection(db, 'users', userId, 'goals');
}

function mapGoal(id: string, data: Record<string, unknown>): Goal {
  const createdAt = data.createdAt as { toDate: () => Date } | undefined;
  const status = data.status as GoalStatus | undefined;
  return {
    id,
    title: data.title as string,
    description: data.description as string | undefined,
    createdAt: createdAt?.toDate() ?? new Date(),
    status: status ?? 'active',
  };
}

export async function listActiveGoals(userId: string): Promise<Goal[]> {
  const goals = await listAllGoals(userId);
  return goals.filter((goal) => goal.status === 'active');
}

export async function listAllGoals(userId: string): Promise<Goal[]> {
  const q = query(goalsCollection(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapGoal(d.id, d.data()));
}

export async function createGoal(
  userId: string,
  title: string,
  description?: string,
): Promise<void> {
  await addDoc(goalsCollection(userId), {
    title,
    description: description ?? '',
    status: 'active',
    createdAt: serverTimestamp(),
  });
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'goals', goalId));
}
