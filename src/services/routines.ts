import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Routine, RoutineBlock, RoutineCompletion } from '../types';

function routinesCollection(userId: string) {
  return collection(db, 'users', userId, 'routines');
}

function blocksCollection(userId: string, routineId: string) {
  return collection(db, 'users', userId, 'routines', routineId, 'blocks');
}

function completionsCollection(userId: string) {
  return collection(db, 'users', userId, 'routineCompletions');
}

function mapRoutine(id: string, data: Record<string, unknown>): Routine {
  const createdAt = data.createdAt as { toDate: () => Date } | undefined;
  return {
    id,
    title: data.title as string,
    description: data.description as string | undefined,
    createdAt: createdAt?.toDate() ?? new Date(),
  };
}

function mapBlock(id: string, routineId: string, data: Record<string, unknown>): RoutineBlock {
  const linkedGoalId = data.linkedGoalId as string | undefined;
  const linkedGoalTitle = data.linkedGoalTitle as string | undefined;
  return {
    id,
    routineId,
    startTime: data.startTime as string,
    endTime: (data.endTime as string) || undefined,
    topic: data.topic as string,
    description: (data.description as string) || undefined,
    order: data.order as number,
    linkedGoalId: linkedGoalId || undefined,
    linkedGoalTitle: linkedGoalTitle || undefined,
  };
}

function mapCompletion(id: string, data: Record<string, unknown>): RoutineCompletion {
  const completedAt = data.completedAt as { toDate: () => Date } | undefined;
  return {
    id,
    routineId: data.routineId as string,
    blockId: data.blockId as string,
    date: data.date as string,
    completedAt: completedAt?.toDate() ?? new Date(),
    routineTitle: (data.routineTitle as string) || undefined,
    blockTopic: (data.blockTopic as string) || undefined,
    startTime: (data.startTime as string) || undefined,
  };
}

export async function listRoutines(userId: string): Promise<Routine[]> {
  const q = query(routinesCollection(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapRoutine(d.id, d.data()));
}

export async function createRoutine(
  userId: string,
  title: string,
  description?: string,
): Promise<string> {
  const ref = await addDoc(routinesCollection(userId), {
    title,
    description: description ?? '',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteRoutine(userId: string, routineId: string): Promise<void> {
  const blocks = await listBlocks(userId, routineId);
  await Promise.all(blocks.map((block) => deleteBlock(userId, routineId, block.id)));
  await deleteDoc(doc(db, 'users', userId, 'routines', routineId));
}

export async function listBlocks(userId: string, routineId: string): Promise<RoutineBlock[]> {
  const q = query(blocksCollection(userId, routineId), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapBlock(d.id, routineId, d.data()));
}

export async function createBlock(
  userId: string,
  routineId: string,
  startTime: string,
  topic: string,
  order: number,
  endTime?: string,
  description?: string,
  linkedGoalId?: string,
  linkedGoalTitle?: string,
): Promise<void> {
  await addDoc(blocksCollection(userId, routineId), {
    startTime,
    endTime: endTime ?? '',
    topic,
    description: description ?? '',
    order,
    linkedGoalId: linkedGoalId ?? '',
    linkedGoalTitle: linkedGoalTitle ?? '',
  });
}

export async function deleteBlock(
  userId: string,
  routineId: string,
  blockId: string,
): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'routines', routineId, 'blocks', blockId));
}

export async function listCompletionsForDate(
  userId: string,
  date: string,
): Promise<RoutineCompletion[]> {
  const q = query(completionsCollection(userId), where('date', '==', date));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapCompletion(d.id, d.data()));
}

export async function listAllCompletions(userId: string): Promise<RoutineCompletion[]> {
  const snapshot = await getDocs(completionsCollection(userId));
  const completions = snapshot.docs.map((d) => mapCompletion(d.id, d.data()));
  return completions.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
}

export async function setBlockCompleted(
  userId: string,
  routineId: string,
  blockId: string,
  date: string,
  completed: boolean,
  snapshots?: {
    routineTitle: string;
    blockTopic: string;
    startTime: string;
  },
): Promise<void> {
  const docId = `${date}_${blockId}`;
  const ref = doc(db, 'users', userId, 'routineCompletions', docId);

  if (completed) {
    await setDoc(ref, {
      routineId,
      blockId,
      date,
      completedAt: serverTimestamp(),
      routineTitle: snapshots?.routineTitle ?? '',
      blockTopic: snapshots?.blockTopic ?? '',
      startTime: snapshots?.startTime ?? '',
    });
  } else {
    await deleteDoc(ref);
  }
}
