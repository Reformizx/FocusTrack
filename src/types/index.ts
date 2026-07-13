export type GoalStatus = 'active' | 'ended';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  status: GoalStatus;
}

export interface Relapse {
  id: string;
  goalId: string;
  goalTitle: string;
  reason: string;
  notes?: string;
  createdAt: Date;
}

export interface Routine {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
}

export interface RoutineBlock {
  id: string;
  routineId: string;
  startTime: string;
  endTime?: string;
  topic: string;
  description?: string;
  order: number;
  linkedGoalId?: string;
  linkedGoalTitle?: string;
}

export interface RoutineCompletion {
  id: string;
  routineId: string;
  blockId: string;
  date: string;
  completedAt: Date;
  routineTitle?: string;
  blockTopic?: string;
  startTime?: string;
}
