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
