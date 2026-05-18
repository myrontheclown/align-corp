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
import { Goal } from '../types';
import { getDemoData } from '../lib/demoDataManager';

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
        const goalsQuery = query(
          collection(db, 'goals'),
          where('userId', '==', profile.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        const goalsSnapshot = await getDocs(goalsQuery);
        const firestoreGoals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
        
        // Merge with demo data
        const { goals: demoGoals } = getDemoData();
        const mergedGoals = [...firestoreGoals];
        
        const firestoreGoalTitles = new Set(firestoreGoals.map(g => g.title.toLowerCase()));
        demoGoals.forEach((dg: Goal) => {
          if (!firestoreGoalTitles.has(dg.title.toLowerCase())) {
            mergedGoals.push(dg);
          }
        });

        if (isMounted) {
          setGoals(mergedGoals.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()));
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          handleFirestoreError(error, OperationType.LIST, 'goals');
          const { goals: demoGoals } = getDemoData();
          setGoals(demoGoals as Goal[]);
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { isMounted = false; };
  }, [profile?.uid]);

  return {
    goals: goals || [],
    reportsGoals: (goals || []).filter(g => g.userId !== profile?.uid),
    allUsers: [],
    auditLogs: [],
    activeSessions: [],
    loading
  };
}
