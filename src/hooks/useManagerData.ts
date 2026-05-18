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
import { Goal, Task, UserProfile } from '../types';
import { getDemoData } from '../lib/demoDataManager';

export function useManagerData() {
  const { profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const [teamGoals, setTeamGoals] = useState<Goal[]>([]);
  const [teamTasks, setTeamTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchTeamData() {
      if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch team members (direct reports)
        const usersQuery = query(
          collection(db, 'users'),
          where('managerId', '==', profile.uid)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const firestoreUsers = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));

        // 2. Fetch goals for team members
        const goalsQuery = query(
          collection(db, 'goals'),
          where('managerId', '==', profile.uid),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const goalsSnapshot = await getDocs(goalsQuery);
        const firestoreGoals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));

        // 3. Fetch tasks for team members (This is tricky because firestore doesn't support 'where in' well for many IDs)
        // For demo/simplicity, we'll fetch all tasks if manager, but in real app we'd scope this better
        const tasksQuery = query(
            collection(db, 'tasks'),
            limit(100)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const firestoreTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        // Merge with Demo Data
        const { tasks: demoTasks, goals: demoGoals, users: demoUsers } = getDemoData();
        
        const mergedUsers = [...firestoreUsers];
        const firestoreUserEmails = new Set(firestoreUsers.map(u => u.email.toLowerCase()));
        demoUsers.forEach((du: any) => {
            if (!firestoreUserEmails.has(du.email.toLowerCase())) {
                mergedUsers.push(du);
            }
        });

        const mergedGoals = [...firestoreGoals];
        const firestoreGoalTitles = new Set(firestoreGoals.map(g => g.title.toLowerCase()));
        demoGoals.forEach((dg: Goal) => {
            if (!firestoreGoalTitles.has(dg.title.toLowerCase())) {
                mergedGoals.push(dg);
            }
        });

        const mergedTasks = [...firestoreTasks];
        const firestoreTaskTitles = new Set(firestoreTasks.map(t => t.title.toLowerCase()));
        demoTasks.forEach((dt: Task) => {
            if (!firestoreTaskTitles.has(dt.title.toLowerCase())) {
                mergedTasks.push(dt);
            }
        });

        if (isMounted) {
          setTeamMembers(mergedUsers);
          setTeamGoals(mergedGoals.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()));
          setTeamTasks(mergedTasks.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()));
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          handleFirestoreError(error, OperationType.LIST, 'team_data');
          // Fallback to demo data
          const { tasks: demoTasks, goals: demoGoals, users: demoUsers } = getDemoData();
          setTeamMembers(demoUsers);
          setTeamGoals(demoGoals);
          setTeamTasks(demoTasks);
          setLoading(false);
        }
      }
    }

    fetchTeamData();
    return () => { isMounted = false; };
  }, [profile?.uid, profile?.role]);

  return {
    teamMembers,
    teamGoals,
    teamTasks,
    loading
  };
}
