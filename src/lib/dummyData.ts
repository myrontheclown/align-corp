import { db, collection, addDoc, Timestamp } from '../lib/firebase';

const generateDummyData = async (userId: string) => {
  const tasks = [
    { title: 'Resolve Firestore Scaling Bottleneck', description: 'Address latency in high-volume write operations.', status: 'In Progress', priority: 'Critical', estimatedDurationMinutes: 120, actualDurationMinutes: 45, deadline: Timestamp.fromDate(new Date()) },
    { title: 'Optimize Employee Dashboard', description: 'Refactor render cycle to reduce layout shifts.', status: 'Pending', priority: 'High', estimatedDurationMinutes: 90, actualDurationMinutes: 0, deadline: Timestamp.fromDate(new Date(Date.now() + 86400000)) },
    { title: 'Finalize Security Audit', description: 'Review Firestore rules against security_spec.md.', status: 'Blocked', priority: 'Critical', estimatedDurationMinutes: 180, actualDurationMinutes: 100, deadline: Timestamp.fromDate(new Date(Date.now() - 86400000)) },
    { title: 'Deploy Analytics Pipeline', description: 'Automate data aggregation for reporting dashboard.', status: 'Completed', priority: 'Medium', estimatedDurationMinutes: 240, actualDurationMinutes: 210, deadline: Timestamp.fromDate(new Date(Date.now() - 172800000)) },
    { title: 'Refactor Legacy Auth Service', description: 'Move to modular SDK v9+.', status: 'Pending', priority: 'Low', estimatedDurationMinutes: 300, actualDurationMinutes: 0, deadline: Timestamp.fromDate(new Date(Date.now() + 172800000)) },
  ];

  const goals = [
    { title: 'Build Workforce Intelligence Platform', description: 'Enable data-driven management decisions.', category: 'Strategic', weightage: 30, progress: 65, status: 'active', targetDate: Timestamp.fromDate(new Date(Date.now() + 30 * 86400000)) },
    { title: 'Enhance Team Collaboration', description: 'Improve feedback loop between managers/employees.', category: 'Operations', weightage: 20, progress: 40, status: 'active', targetDate: Timestamp.fromDate(new Date(Date.now() + 60 * 86400000)) },
  ];

  for (const task of tasks) {
    await addDoc(collection(db, 'tasks'), { ...task, userId, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
  }
  for (const goal of goals) {
    await addDoc(collection(db, 'goals'), { ...goal, userId, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
  }
};

export default generateDummyData;
