import { useState, useEffect } from 'react';
import {
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  handleFirestoreError,
  OperationType,
  limit
} from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Goal, Review } from '../types';

export function usePerformanceData() {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!profile) {
        setLoading(false);
        return;
      }

      try {
        // Fetch only user's own goals, limited to 50
        const goalsQuery = query(
          collection(db, 'goals'),
          where('userId', '==', profile.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        const goalsSnapshot = await getDocs(goalsQuery);
        if (isMounted) {
          setGoals(goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal)));
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          handleFirestoreError(error, OperationType.LIST, 'goals');
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [profile?.uid]);

  return {
    goals: goals || [],
    reportsGoals: (goals || []).filter(g => g.userId !== profile?.uid), // Simple fallback logic
    allUsers: [],
    auditLogs: [],
    activeSessions: [],
    loading
  };
}
