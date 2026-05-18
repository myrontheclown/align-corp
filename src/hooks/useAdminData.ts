import { useState, useEffect } from 'react';
import {
  db,
  collection,
  query,
  getDocs,
  orderBy,
  handleFirestoreError,
  OperationType,
  limit
} from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Goal, Task, UserProfile, AuditLog } from '../types';
import { getDemoData } from '../lib/demoDataManager';

export function useAdminData() {
  const { profile } = useAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchAdminData() {
      if (!profile || profile.role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const firestoreUsers = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));

        // 2. Fetch all goals (limited for performance)
        const goalsQuery = query(
          collection(db, 'goals'),
          orderBy('createdAt', 'desc'),
          limit(200)
        );
        const goalsSnapshot = await getDocs(goalsQuery);
        const firestoreGoals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));

        // 3. Fetch all tasks
        const tasksQuery = query(
            collection(db, 'tasks'),
            orderBy('createdAt', 'desc'),
            limit(200)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const firestoreTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        // Merge with Demo Data
        const { 
            tasks: demoTasks, 
            goals: demoGoals, 
            users: demoUsers, 
            auditLogs: demoAudit, 
            health: demoHealth, 
            alerts: demoAlerts 
        } = getDemoData();
        
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
          setAllUsers(mergedUsers);
          setAllGoals(mergedGoals);
          setAllTasks(mergedTasks);
          setAuditLogs(demoAudit); // Prioritize demo audit for enterprise feel
          setSystemHealth(demoHealth);
          setAlerts(demoAlerts);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          handleFirestoreError(error, OperationType.LIST, 'admin_data');
          const { tasks: demoTasks, goals: demoGoals, users: demoUsers, auditLogs: demoAudit, health: demoHealth, alerts: demoAlerts } = getDemoData();
          setAllUsers(demoUsers);
          setAllGoals(demoGoals);
          setAllTasks(demoTasks);
          setAuditLogs(demoAudit);
          setSystemHealth(demoHealth);
          setAlerts(demoAlerts);
          setLoading(false);
        }
      }
    }

    fetchAdminData();
    return () => { isMounted = false; };
  }, [profile?.uid, profile?.role]);

  return {
    allUsers,
    allGoals,
    allTasks,
    auditLogs,
    systemHealth,
    alerts,
    loading
  };
}
