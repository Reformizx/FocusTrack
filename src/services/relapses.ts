import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Relapse } from '../types';

function relapsesCollection(userId: string) {
  return collection(db, 'users', userId, 'relapses');
}

function mapRelapse(id: string, data: Record<string, unknown>): Relapse {
  const createdAt = data.createdAt as { toDate: () => Date } | undefined;
  return {
    id,
    goalId: data.goalId as string,
    goalTitle: data.goalTitle as string,
    reason: data.reason as string,
    notes: data.notes as string | undefined,
    createdAt: createdAt?.toDate() ?? new Date(),
  };
}

export async function listRelapses(userId: string): Promise<Relapse[]> {
  const q = query(relapsesCollection(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapRelapse(d.id, d.data()));
}

export async function createRelapse(
  userId: string,
  goalId: string,
  goalTitle: string,
  reason: string,
  notes?: string,
): Promise<void> {
  await addDoc(relapsesCollection(userId), {
    goalId,
    goalTitle,
    reason,
    notes: notes ?? '',
    createdAt: serverTimestamp(),
  });
}
