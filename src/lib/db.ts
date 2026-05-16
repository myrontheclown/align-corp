import { 
  db, 
  collection, 
  addDoc, 
  serverTimestamp, 
  handleFirestoreError, 
  OperationType 
} from './firebase';

/**
 * Audit Logger helper
 */
export async function logAction(userId: string, action: string, resourceId: string, resourceType: string, details: any = {}) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      action,
      resourceId,
      resourceType,
      details,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log action', error);
  }
}

/**
 * Tracks a user session
 */
export async function trackSession(userId: string) {
  try {
    await addDoc(collection(db, 'sessions'), {
      userId,
      lastActive: serverTimestamp(),
      userAgent: navigator.userAgent,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to track session', error);
  }
}

/**
 * Goal service helpers
 */
export async function createCheckIn(goalId: string, userId: string, statusUpdate: string, progressUpdate: number) {
  try {
    const docRef = await addDoc(collection(db, 'checkins'), {
      goalId,
      userId,
      statusUpdate,
      progressUpdate,
      createdAt: serverTimestamp()
    });
    
    // Log the action
    await logAction(userId, 'CREATE_CHECKIN', docRef.id, 'checkin', { goalId, progressUpdate });
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'checkins');
  }
}
