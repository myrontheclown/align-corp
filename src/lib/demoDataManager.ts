import { Timestamp } from 'firebase/firestore';

const DEMO_TASKS_KEY = 'align_corp_demo_tasks';
const DEMO_GOALS_KEY = 'align_corp_demo_goals';
const ACHIEVEMENTS_KEY = 'align_corp_achievements';
const PRODUCTIVITY_STATS_KEY = 'align_corp_productivity_stats';
const DEMO_USERS_KEY = 'align_corp_demo_users';
const ACTIVITY_FEED_KEY = 'align_corp_activity_feed';
const AUDIT_LOGS_KEY = 'align_corp_audit_logs';
const SYSTEM_HEALTH_KEY = 'align_corp_system_health';
const ALERTS_KEY = 'align_corp_alerts';

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

const mockUsers = [
  { uid: 'u1', displayName: 'Sarah Chen', email: 'sarah.c@align-corp.com', role: 'employee', department: 'Engineering', status: 'online', productivityScore: 94, tasksCompleted: 12, focusHours: 32, workload: 'High', lastActive: new Date().toISOString() },
  { uid: 'u2', displayName: 'Marcus Thorne', email: 'marcus.t@align-corp.com', role: 'employee', department: 'Product', status: 'online', productivityScore: 88, tasksCompleted: 8, focusHours: 24, workload: 'Moderate', lastActive: new Date().toISOString() },
  { uid: 'u3', displayName: 'Elena Rodriguez', email: 'elena.r@align-corp.com', role: 'employee', department: 'Engineering', status: 'offline', productivityScore: 91, tasksCompleted: 15, focusHours: 40, workload: 'Low', lastActive: new Date(Date.now() - 3600000).toISOString() },
  { uid: 'u4', displayName: 'David Kim', email: 'david.k@align-corp.com', role: 'employee', department: 'Design', status: 'online', productivityScore: 76, tasksCompleted: 5, focusHours: 18, workload: 'Critical', lastActive: new Date().toISOString() },
  { uid: 'u5', displayName: 'Aisha Jallow', email: 'aisha.j@align-corp.com', role: 'employee', department: 'Engineering', status: 'online', productivityScore: 98, tasksCompleted: 22, focusHours: 56, workload: 'High', lastActive: new Date().toISOString() },
  { uid: 'u6', displayName: 'Michael Reyes', email: 'michael.r@align-corp.com', role: 'manager', department: 'Operations', status: 'online', productivityScore: 85, tasksCompleted: 0, focusHours: 45, workload: 'Moderate', lastActive: new Date().toISOString() },
  { uid: 'u7', displayName: 'Priya Nair', email: 'priya.n@align-corp.com', role: 'employee', department: 'Security', status: 'online', productivityScore: 92, tasksCompleted: 18, focusHours: 38, workload: 'High', lastActive: new Date().toISOString() },
  { uid: 'u8', displayName: 'Daniel Brooks', email: 'daniel.b@align-corp.com', role: 'employee', department: 'Infrastructure', status: 'online', productivityScore: 89, tasksCompleted: 14, focusHours: 42, workload: 'Moderate', lastActive: new Date().toISOString() },
];

const generateActivityFeed = () => {
    const now = new Date();
    return [
        { id: 'a1', type: 'task_completed', user: 'Sarah Chen', detail: 'Resolved Firestore Scaling Bottleneck', timestamp: new Date(now.getTime() - 15 * 60000).toISOString() },
        { id: 'a2', type: 'goal_updated', user: 'Marcus Thorne', detail: 'Increased progress on Workforce Intelligence Platform to 65%', timestamp: new Date(now.getTime() - 45 * 60000).toISOString() },
        { id: 'a3', type: 'focus_started', user: 'Aisha Jallow', detail: 'Deep work session: Enterprise Security Protocol', timestamp: new Date(now.getTime() - 2 * 3600000).toISOString() },
        { id: 'a4', type: 'task_assigned', user: 'David Kim', detail: 'Assigned: Fix CSS Grid Overflow Bug', timestamp: new Date(now.getTime() - 4 * 3600000).toISOString() },
        { id: 'a5', type: 'deadline_missed', user: 'Elena Rodriguez', detail: 'Finalize Security Audit reached deadline', timestamp: new Date(now.getTime() - 24 * 3600000).toISOString() },
    ];
};

const generateAuditLogs = () => {
    const now = new Date();
    return [
        { id: 'log1', action: 'LOGIN_SUCCESS', userName: 'Sarah Chen', resourceType: 'auth', severity: 'low', createdAt: new Date(now.getTime() - 10 * 60000).toISOString() },
        { id: 'log2', action: 'ROLE_UPDATE', userName: 'Admin', resourceType: 'user', severity: 'high', detail: 'Promoted Elena Rodriguez to Manager', createdAt: new Date(now.getTime() - 2 * 3600000).toISOString() },
        { id: 'log3', action: 'FAILED_LOGIN', userName: 'Unknown', resourceType: 'auth', severity: 'medium', detail: 'Invalid credentials from 192.168.1.45', createdAt: new Date(now.getTime() - 5 * 3600000).toISOString() },
        { id: 'log4', action: 'GOAL_APPROVED', userName: 'Michael Reyes', resourceType: 'goal', severity: 'low', detail: 'Approved: Improve Productivity Tracking', createdAt: new Date(now.getTime() - 12 * 3600000).toISOString() },
        { id: 'log5', action: 'EXPORT_DATA', userName: 'Michael Reyes', resourceType: 'analytics', severity: 'medium', detail: 'Exported department performance report', createdAt: new Date(now.getTime() - 18 * 3600000).toISOString() },
        { id: 'log6', action: 'PERMISSION_CHANGE', userName: 'Admin', resourceType: 'security', severity: 'critical', detail: 'Modified firewall rules for API gateway', createdAt: new Date(now.getTime() - 24 * 3600000).toISOString() },
        { id: 'log7', action: 'TASK_ASSIGNED', userName: 'Michael Reyes', resourceType: 'task', severity: 'low', createdAt: new Date(now.getTime() - 36 * 3600000).toISOString() },
    ];
};

const generateSystemHealth = () => ({
    apiUptime: 99.98,
    dbLatency: 45,
    authStability: 100,
    activeTraffic: 1240,
    storageUsage: 64,
    syncHealth: 'Healthy',
    processingRate: 850
});

const generateAlerts = () => {
    const now = new Date();
    return [
        { id: 'al1', type: 'security', message: 'Failed login surge detected from IP 45.2.11.9', severity: 'critical', timestamp: new Date(now.getTime() - 30 * 60000).toISOString() },
        { id: 'al2', type: 'workload', message: '3 Engineering members exceeding 90% capacity', severity: 'medium', timestamp: new Date(now.getTime() - 2 * 3600000).toISOString() },
        { id: 'al3', type: 'system', message: 'Storage utilization approaching 80%', severity: 'low', timestamp: new Date(now.getTime() - 5 * 3600000).toISOString() },
        { id: 'al4', type: 'performance', message: 'Average task delay increased by 12% in Product', severity: 'medium', timestamp: new Date(now.getTime() - 24 * 3600000).toISOString() }
    ];
};

const generateMockData = (userId?: string) => {
  const now = new Date();
  return enterpriseTasks.map((t, i) => {
    const status = i % 4 === 0 ? 'In Progress' : i % 3 === 0 ? 'Completed' : i % 5 === 0 ? 'Blocked' : 'Pending';
    const daysOffset = (i - 7) * 2;
    const deadline = new Date(now.getTime() + daysOffset * 86400000);
    
    return {
      id: `demo-task-${i}`,
      ...t,
      userId: userId || mockUsers[i % mockUsers.length].uid,
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

const generateMockGoals = (userId?: string) => {
  const now = new Date();
  return enterpriseGoals.map((g, i) => {
    const status = i === 0 ? 'completed' : i === 2 ? 'draft' : 'active';
    const progress = status === 'completed' ? 100 : Math.floor(Math.random() * 80);
    const targetDate = new Date(now.getTime() + (30 + i * 10) * 86400000);

    return {
      id: `demo-goal-${i}`,
      ...g,
      userId: userId || mockUsers[i % mockUsers.length].uid,
      status,
      progress,
      targetDate: targetDate.toISOString(),
      createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
      managerComments: i === 1 ? 'Excellent progress on the architecture phase.' : undefined,
    };
  });
};

export const getDemoData = (userId?: string) => {
  let storedTasks = localStorage.getItem(DEMO_TASKS_KEY);
  let storedGoals = localStorage.getItem(DEMO_GOALS_KEY);
  let storedUsers = localStorage.getItem(DEMO_USERS_KEY);
  let storedActivity = localStorage.getItem(ACTIVITY_FEED_KEY);
  let storedAudit = localStorage.getItem(AUDIT_LOGS_KEY);
  let storedHealth = localStorage.getItem(SYSTEM_HEALTH_KEY);
  let storedAlerts = localStorage.getItem(ALERTS_KEY);
  
  if (!storedTasks) {
    storedTasks = JSON.stringify(generateMockData());
    localStorage.setItem(DEMO_TASKS_KEY, storedTasks);
  }
  if (!storedGoals) {
    storedGoals = JSON.stringify(generateMockGoals());
    localStorage.setItem(DEMO_GOALS_KEY, storedGoals);
  }
  if (!storedUsers) {
    storedUsers = JSON.stringify(mockUsers);
    localStorage.setItem(DEMO_USERS_KEY, storedUsers);
  }
  if (!storedActivity) {
    storedActivity = JSON.stringify(generateActivityFeed());
    localStorage.setItem(ACTIVITY_FEED_KEY, storedActivity);
  }
  if (!storedAudit) {
    storedAudit = JSON.stringify(generateAuditLogs());
    localStorage.setItem(AUDIT_LOGS_KEY, storedAudit);
  }
  if (!storedHealth) {
    storedHealth = JSON.stringify(generateSystemHealth());
    localStorage.setItem(SYSTEM_HEALTH_KEY, storedHealth);
  }
  if (!storedAlerts) {
    storedAlerts = JSON.stringify(generateAlerts());
    localStorage.setItem(ALERTS_KEY, storedAlerts);
  }

  const tasks = JSON.parse(storedTasks);
  const goals = JSON.parse(storedGoals);
  const users = JSON.parse(storedUsers);
  const activity = JSON.parse(storedActivity);
  const auditLogs = JSON.parse(storedAudit);
  const health = JSON.parse(storedHealth);
  const alerts = JSON.parse(storedAlerts);

  const filterTasks = userId ? tasks.filter((t: any) => t.userId === userId) : tasks;
  const filterGoals = userId ? goals.filter((g: any) => g.userId === userId) : goals;

  return { 
    tasks: filterTasks.map((t: any) => ({ 
        ...t, 
        deadline: t.deadline ? { toDate: () => new Date(t.deadline) } : undefined,
        createdAt: { toDate: () => new Date(t.createdAt) },
        updatedAt: { toDate: () => new Date(t.updatedAt) }
    })), 
    goals: filterGoals.map((g: any) => ({ 
        ...g, 
        targetDate: g.targetDate ? { toDate: () => new Date(g.targetDate) } : undefined,
        createdAt: { toDate: () => new Date(g.createdAt) },
        updatedAt: { toDate: () => new Date(g.updatedAt) }
    })),
    users,
    activity,
    auditLogs: auditLogs.map((log: any) => ({
        ...log,
        createdAt: { toDate: () => new Date(log.createdAt) }
    })),
    health,
    alerts
  };
};

export const updateDemoTask = (id: string, updates: any) => {
  const tasks = JSON.parse(localStorage.getItem(DEMO_TASKS_KEY) || '[]');
  const updated = tasks.map((t: any) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t);
  localStorage.setItem(DEMO_TASKS_KEY, JSON.stringify(updated));
};

export const updateDemoGoal = (id: string, updates: any) => {
    const goals = JSON.parse(localStorage.getItem(DEMO_GOALS_KEY) || '[]');
    const updated = goals.map((g: any) => g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g);
    localStorage.setItem(DEMO_GOALS_KEY, JSON.stringify(updated));
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
