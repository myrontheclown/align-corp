import { Timestamp } from 'firebase/firestore';

export type UserRole = 'employee' | 'manager' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  managerId?: string;
  department?: string;
  createdAt?: Timestamp;
}

export type GoalStatus = 'draft' | 'active' | 'completed' | 'archived';

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
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  action: string;
  resourceId: string;
  resourceType: 'goal' | 'review' | 'checkin' | 'user';
  details: any;
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
