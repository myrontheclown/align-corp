import { useState, useEffect } from 'react';
import {
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  handleFirestoreError,
  OperationType
} from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Task } from '../types';
import { getDemoData } from '../lib/demoDataManager';

export function useTasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchTasks() {
      if (!profile) {
        setLoading(false);
        return;
      }

      try {
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', profile.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        const snapshot = await getDocs(tasksQuery);
        const firestoreTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        
        // Merge with demo data
        const { tasks: demoTasks } = getDemoData();
        const mergedTasks = [...firestoreTasks];
        
        // Only add demo tasks that don't overlap with firestore tasks (by title for simplicity in demo)
        const firestoreTaskTitles = new Set(firestoreTasks.map(t => t.title.toLowerCase()));
        demoTasks.forEach((dt: Task) => {
          if (!firestoreTaskTitles.has(dt.title.toLowerCase())) {
            mergedTasks.push(dt);
          }
        });

        if (isMounted) {
          setTasks(mergedTasks.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()));
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          handleFirestoreError(error, OperationType.LIST, 'tasks');
          // Fallback to demo data on error
          const { tasks: demoTasks } = getDemoData();
          setTasks(demoTasks as Task[]);
          setLoading(false);
        }
      }
    }

    fetchTasks();
    return () => { isMounted = false; };
  }, [profile?.uid]);

  return { tasks, loading };
}
