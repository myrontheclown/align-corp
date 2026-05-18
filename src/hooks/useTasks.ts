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
          limit(15)
        );

        const snapshot = await getDocs(tasksQuery);
        if (isMounted) {
          setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          handleFirestoreError(error, OperationType.LIST, 'tasks');
          setLoading(false);
        }
      }
    }

    fetchTasks();
    return () => { isMounted = false; };
  }, [profile?.uid]);

  return { tasks, loading };
}
