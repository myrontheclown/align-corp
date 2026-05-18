import { Timestamp } from 'firebase/firestore';

export type UserRole = 'employee' | 'manager' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  managerId?: string;

  department?: string;

  workload?: 'Low' | 'Moderate' | 'High' | 'Critical';

  productivityScore?: number;

  focusHours?: number;

  completedTasks?: number;

  activeGoals?: number;

  avatarUrl?: string;

  lastActive?: Timestamp;

  status?: 'online' | 'offline';

  createdAt?: Timestamp;
}

export type GoalStatus = 'draft' | 'pending' | 'active' | 'completed' | 'archived';

export interface Goal {
  id: string;
  userId: string;
  managerId: string;
  title: string;
  description: string;
  status: GoalStatus;
  category: string;
  targetDate: Timestamp;
  progress: number;
  weightage: number;
  managerComments?: string;
  isLocked?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Review Needed' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline?: Timestamp;
  estimatedDurationMinutes: number;
  actualDurationMinutes: number;
  subtasks: Subtask[];
  notes: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskSession {
  id: string;
  taskId: string;
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  durationMinutes: number;
}

export type ReviewStatus = 'draft' | 'submitted' | 'reviewed' | 'finalized';

export interface Review {
  id: string;
  userId: string;
  managerId: string;
  quarter: number;
  year: number;
  selfAssessment: string;
  managerFeedback: string;
  rating: number;
  status: ReviewStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CheckIn {
  id: string;
  goalId: string;
  userId: string;
  statusUpdate: string;
  progressUpdate: number;
  createdAt: Timestamp;
}

export interface AuditLog {
  id: string;

  userId: string;

  userName: string;

  userRole: UserRole;

  action: string;

  resourceId: string;

  resourceType:
  | 'goal'
  | 'review'
  | 'checkin'
  | 'user'
  | 'task'
  | 'task_session';

  severity?: 'low' | 'medium' | 'high' | 'critical';

  detail?: string;

  details: {
    oldValue?: any;
    newValue?: any;
    [key: string]: any;
  };

  createdAt: Timestamp;
}

export interface UserSession {
  id: string;
  userId: string;
  lastActive: Timestamp;
  userAgent: string;
  ipAddress?: string;
  createdAt: Timestamp;
}
