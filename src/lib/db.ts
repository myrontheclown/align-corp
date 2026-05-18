import { 
  db, 
  collection, 
  addDoc, 
  doc,
  updateDoc,
  serverTimestamp, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { UserProfile, Task, TaskSession } from '../types';

/**
 * Sanitizes an object to remove undefined values before sending to Firestore
 */
function sanitizePayload(payload: Record<string, any>): Record<string, any> {
  const sanitized = { ...payload };
  for (const key in sanitized) {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !(sanitized[key] instanceof Date)) {
      sanitized[key] = sanitizePayload(sanitized[key]);
    }
  }
  return sanitized;
}

/**
 * Audit Logger helper (DISABLED)
 */
export async function logAction(
  user: UserProfile, 
  action: string, 
  resourceId: string, 
  resourceType: 'goal' | 'review' | 'checkin' | 'user' | 'task' | 'task_session', 
  details: { oldValue?: any; newValue?: any; [key: string]: any } = {}
) {
  console.log('[Audit Log - DISABLED]', action, resourceType, resourceId);
  return Promise.resolve();
}

/**
 * Tracks a user session (DISABLED)
 */
export async function trackSession(userId: string) {
  console.log('[Session Tracking - DISABLED]', userId);
  return Promise.resolve();
}

/**
 * Task service helpers
 */
export async function createTask(user: UserProfile, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const payload = sanitizePayload({
      ...taskData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const docRef = await addDoc(collection(db, 'tasks'), payload);
    
    // await logAction(user, 'CREATE_TASK', docRef.id, 'task', { newValue: taskData });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'tasks');
  }
}

export async function createTaskSession(user: UserProfile, sessionData: Omit<TaskSession, 'id' | 'startTime'>) {
  console.log('[Task Session Persistence - DISABLED]', sessionData);
  return Promise.resolve();
}

/**
 * Goal service helpers
 */
export async function createCheckIn(user: UserProfile, goalId: string, statusUpdate: string, progressUpdate: number) {
  try {
    const payload = sanitizePayload({
      goalId,
      userId: user.uid,
      statusUpdate,
      progressUpdate,
      createdAt: serverTimestamp()
    });

    const docRef = await addDoc(collection(db, 'checkins'), payload);
    
    // await logAction(user, 'CREATE_CHECKIN', docRef.id, 'checkin', { goalId, progressUpdate });
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'checkins');
  }
}

/**
 * Update Goal and Log
 */
export async function updateGoalWithLog(user: UserProfile, goalId: string, updates: any, oldValue: any) {
  try {
    const goalRef = doc(db, 'goals', goalId);
    
    const sanitizedUpdates = sanitizePayload({
      ...updates,
      updatedAt: serverTimestamp()
    });

    await updateDoc(goalRef, sanitizedUpdates);

    // await logAction(user, 'UPDATE_GOAL', goalId, 'goal', { oldValue, newValue: updates });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `goals/${goalId}`);
  }
}
