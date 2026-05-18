import { Timestamp } from 'firebase/firestore';

const DEMO_TASKS_KEY = 'align_corp_demo_tasks';
const DEMO_GOALS_KEY = 'align_corp_demo_goals';
const ACHIEVEMENTS_KEY = 'align_corp_achievements';
const PRODUCTIVITY_STATS_KEY = 'align_corp_productivity_stats';

const enterpriseTasks = [
  { title: 'Resolve Firestore Scaling Bottleneck', description: 'Address latency in high-volume write operations by implementing a sharding strategy.', priority: 'Critical', duration: 120 },
  { title: 'Optimize Dashboard Rendering', description: 'Refactor render cycle to reduce layout shifts and improve First Contentful Paint.', priority: 'High', duration: 90 },
  { title: 'Finalize Security Audit', description: 'Review Firestore rules and IAM permissions against the latest security spec.', priority: 'Critical', duration: 180 },
  { title: 'Deploy Analytics Pipeline', description: 'Automate data aggregation for the new executive reporting dashboard.', priority: 'Medium', duration: 240 },
  { title: 'Improve Calendar Responsiveness', description: 'Fix overflow issues on mobile views and optimize event rendering performance.', priority: 'Medium', duration: 60 },
  { title: 'Refactor Notification Service', description: 'Decouple notification logic from the main application flow using Cloud Functions.', priority: 'High', duration: 150 },
  { title: 'Reduce API Latency', description: 'Identify and optimize slow-running queries in the legacy backend services.', priority: 'High', duration: 200 },
  { title: 'Implement Productivity Intelligence', description: 'Integrate ML-based task recommendations for improved workforce efficiency.', priority: 'Medium', duration: 300 },
  { title: 'Audit Workforce Metrics', description: 'Ensure data integrity across all performance tracking modules.', priority: 'Low', duration: 120 },
  { title: 'Update Enterprise Security Protocol', description: 'Roll out mandatory 2FA and hardware key support across all departments.', priority: 'Critical', duration: 90 },
  { title: 'Migrate Legacy Data to Firestore', description: 'Execute the final phase of the data migration for the regional offices.', priority: 'High', duration: 480 },
  { title: 'Conduct UX Research Session', description: 'Gather feedback from the engineering team on the new dashboard layout.', priority: 'Low', duration: 60 },
  { title: 'Optimize Asset Loading', description: 'Implement lazy loading and image optimization for the asset library.', priority: 'Medium', duration: 90 },
  { title: 'Fix CSS Grid Overflow Bug', description: 'Address layout breakage on ultra-wide monitors in the manager view.', priority: 'Low', duration: 45 },
  { title: 'Review PRs for Sprint 24', description: 'Conduct deep-dive reviews for the core infrastructure changes.', priority: 'High', duration: 120 },
];

const enterpriseGoals = [
  { title: 'Improve Productivity Tracking', description: 'Increase the granularity of focus session data across all engineering teams.', category: 'Strategic', weightage: 25 },
  { title: 'Build Workforce Intelligence Platform', description: 'Deliver a centralized dashboard for real-time workforce analytics.', category: 'Strategic', weightage: 30 },
  { title: 'Reduce Task Completion Delays', description: 'Decrease average task cycle time by 15% through optimized workflows.', category: 'Operations', weightage: 15 },
  { title: 'Increase Focus Session Efficiency', description: 'Target an average of 4 hours of deep work per employee per day.', category: 'Development', weightage: 10 },
  { title: 'Optimize Enterprise Reporting', description: 'Automate the generation of quarterly performance reports.', category: 'Operations', weightage: 10 },
  { title: 'Enhance Team Collaboration', description: 'Implement a structured feedback loop for cross-departmental projects.', category: 'Strategic', weightage: 10 },
  { title: 'Improve Operational Visibility', description: 'Achieve 99.9% uptime for the performance monitoring subsystem.', category: 'Operations', weightage: 5 },
];

const generateMockData = () => {
  const now = new Date();
  return enterpriseTasks.map((t, i) => {
    const status = i % 4 === 0 ? 'In Progress' : i % 3 === 0 ? 'Completed' : i % 5 === 0 ? 'Blocked' : 'Pending';
    const daysOffset = (i - 7) * 2; // Some overdue, some future
    const deadline = new Date(now.getTime() + daysOffset * 86400000);
    
    return {
      id: `demo-task-${i}`,
      ...t,
      status,
      estimatedDurationMinutes: t.duration,
      actualDurationMinutes: status === 'Completed' ? t.duration + 10 : 0,
      deadline: deadline.toISOString(),
      createdAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
      subtasks: [
        { id: `st-${i}-1`, title: 'Initial Research', completed: true },
        { id: `st-${i}-2`, title: 'Technical Design', completed: status === 'Completed' },
      ],
      notes: [`Generated for demo purposes on ${now.toLocaleDateString()}`],
    };
  });
};

const generateMockGoals = () => {
  const now = new Date();
  return enterpriseGoals.map((g, i) => {
    const status = i === 0 ? 'completed' : 'active';
    const progress = status === 'completed' ? 100 : Math.floor(Math.random() * 80);
    const targetDate = new Date(now.getTime() + (30 + i * 10) * 86400000);

    return {
      id: `demo-goal-${i}`,
      ...g,
      status,
      progress,
      targetDate: targetDate.toISOString(),
      createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
      managerComments: i === 1 ? 'Excellent progress on the architecture phase.' : undefined,
    };
  });
};

export const getDemoData = () => {
  let storedTasks = localStorage.getItem(DEMO_TASKS_KEY);
  let storedGoals = localStorage.getItem(DEMO_GOALS_KEY);
  
  if (!storedTasks) {
    storedTasks = JSON.stringify(generateMockData());
    localStorage.setItem(DEMO_TASKS_KEY, storedTasks);
  }
  if (!storedGoals) {
    storedGoals = JSON.stringify(generateMockGoals());
    localStorage.setItem(DEMO_GOALS_KEY, storedGoals);
  }

  const tasks = JSON.parse(storedTasks);
  const goals = JSON.parse(storedGoals);

  return { 
    tasks: tasks.map((t: any) => ({ 
        ...t, 
        deadline: t.deadline ? { toDate: () => new Date(t.deadline) } : undefined,
        createdAt: { toDate: () => new Date(t.createdAt) },
        updatedAt: { toDate: () => new Date(t.updatedAt) }
    })), 
    goals: goals.map((g: any) => ({ 
        ...g, 
        targetDate: g.targetDate ? { toDate: () => new Date(g.targetDate) } : undefined,
        createdAt: { toDate: () => new Date(g.createdAt) },
        updatedAt: { toDate: () => new Date(g.updatedAt) }
    })) 
  };
};

export const updateDemoTask = (id: string, updates: any) => {
  const tasks = JSON.parse(localStorage.getItem(DEMO_TASKS_KEY) || '[]');
  const updated = tasks.map((t: any) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
  localStorage.setItem(DEMO_TASKS_KEY, JSON.stringify(updated));
};

export const getAchievements = () => {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!stored) {
        const initial = ['Focus Master', 'Consistency Expert'];
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(initial));
        return initial;
    }
    return JSON.parse(stored);
};

export const addAchievement = (achievement: string) => {
  const current = getAchievements();
  if (!current.includes(achievement)) {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...current, achievement]));
  }
};

export const getProductivityStats = () => {
    const stored = localStorage.getItem(PRODUCTIVITY_STATS_KEY);
    if (!stored) {
        const initial = {
            streak: 5,
            totalFocusMinutes: 1240,
            completedTasks: 42,
            weeklyProgress: [65, 78, 45, 92, 88, 0, 0]
        };
        localStorage.setItem(PRODUCTIVITY_STATS_KEY, JSON.stringify(initial));
        return initial;
    }
    return JSON.parse(stored);
};

export const updateProductivityStats = (updates: any) => {
    const current = getProductivityStats();
    localStorage.setItem(PRODUCTIVITY_STATS_KEY, JSON.stringify({ ...current, ...updates }));
};
