import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, ListTodo, Loader2, Play, Pause, Square, Zap } from 'lucide-react';
import { db, collection, addDoc, Timestamp, doc, updateDoc } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { usePerformanceData } from '../../hooks/usePerformanceData';
import { useTasks } from '../../hooks/useTasks';
import { Goal, GoalStatus, Task } from '../../types';
import { logAction } from '../../lib/db';
import { TaskList } from './tasks/TaskList';
import { AnalyticsWidgets } from './analytics/AnalyticsWidgets';

const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
// ... (rest of GoalCard component remains the same)

    draft: 'bg-amber-100 text-amber-600',
    pending: 'bg-indigo-100 text-indigo-600',
    active: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    archived: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors[goal.status]}`}
          >
            {goal.status}
          </span>

          <h4 className="text-base font-semibold text-gray-900 mt-2">
            {goal.title}
          </h4>
        </div>

        <Target size={18} className="text-slate-400" />
      </div>

      <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
        {goal.description}
      </p>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-400">
            Weightage: {goal.weightage}%
          </span>

          <span className="text-slate-900">
            {goal.progress}%
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      {goal.managerComments && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Manager Feedback
          </p>

          <p className="text-xs text-slate-600 italic">
            "{goal.managerComments}"
          </p>
        </div>
      )}
    </div>
  );
};

const PresenceIndicator = ({
  status
}: {
  status?: 'online' | 'offline';
}) => (
  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
    <div
      className={`w-2.5 h-2.5 rounded-full ${status === 'online'
          ? 'bg-green-500'
          : 'bg-slate-300'
        }`}
    />

    <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">
      {status || 'offline'}
    </span>
  </div>
);

export const EmployeeDashboard = () => {
  const { profile } = useAuth();

  const { goals } = usePerformanceData();
  const { tasks } = useTasks();
  
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // TEMPORARILY DISABLED FOR FIRESTORE STABILITY
  // const { sessions } = useTaskSessions();
  // const { logs } = useAuditLogs();

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'Individual',
    weightage: 20
  });

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';

    return 'Good Evening';
  };

  const safeTasks = tasks || [];
  const safeGoals = goals || [];

  const pendingTasksCount = safeTasks.filter(
    t => t.status === 'Pending'
  ).length;

  const criticalGoalsCount = safeGoals.filter(
    g => g.status === 'active' && g.weightage >= 20
  ).length;

  const handleCreateGoal = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!profile) return;

    if (goals.length >= 8) {
      alert(
        'Maximum 8 goals permitted per individual.'
      );
      return;
    }

    const totalWeightage =
      goals.reduce(
        (sum, g) => sum + (g.weightage || 0),
        0
      ) + newGoal.weightage;

    if (totalWeightage > 100) {
      alert(
        `Total weightage cannot exceed 100%. Current total with this goal: ${totalWeightage}%`
      );
      return;
    }

    if (newGoal.weightage < 10) {
      alert(
        'Minimum weightage per goal is 10%.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const docRef = await addDoc(
        collection(db, 'goals'),
        {
          ...newGoal,
          userId: profile.uid,
          managerId:
            profile.managerId || 'pending',
          status: 'draft',
          progress: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          targetDate: Timestamp.fromDate(
            new Date(
              Date.now() +
              90 *
              24 *
              60 *
              60 *
              1000
            )
          )
        }
      );

      await logAction(
        profile,
        'CREATE_GOAL',
        docRef.id,
        'goal',
        {
          newValue: newGoal
        }
      );

      setShowGoalModal(false);

      setNewGoal({
        title: '',
        description: '',
        category: 'Individual',
        weightage: 20
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (e) {
      console.error('Error updating task status:', e);
    }
  };

  const productivityScore = Math.min(100, Math.round((safeTasks.filter(t => t.status === 'Completed').length / (safeTasks.length || 1)) * 100));
  const focusHours = Math.round(safeTasks.reduce((acc, t) => acc + (t.actualDurationMinutes || 0), 0) / 60);

  const getRecommendations = () => {
    const recs = [];
    if (safeTasks.filter(t => t.status === 'Pending' && t.priority === 'High').length > 0) recs.push('Focus on your high-priority pending tasks.');
    if (safeTasks.filter(t => t.deadline && t.deadline.toDate() < new Date()).length > 2) recs.push('You have several overdue tasks; consider rescheduling.');
    if (productivityScore < 50) recs.push('Productivity is lower than usual; try a short focus session.');
    return recs;
  };

  const recommendations = getRecommendations();

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* (header remains the same) */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()},{' '}
            {profile?.displayName?.split(' ')[0]}
          </h1>

          <p className="text-slate-500 mt-2 text-lg">
            You have {pendingTasksCount} pending
            tasks and {criticalGoalsCount}{' '}
            critical objectives today.
          </p>
        </div>

        <div className="flex flex-col items-end gap-4">
          <PresenceIndicator
            status={profile?.status}
          />
          
          {activeTaskId && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center gap-4 shadow-xl shadow-indigo-200"
            >
              <div className="flex items-center gap-2">
                <Zap className="animate-pulse" size={18} fill="currentColor" />
                <span className="font-bold text-xs uppercase tracking-widest">
                  Deep Work Active
                </span>
              </div>
              <span className="font-mono text-xl font-bold tabular-nums">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </span>
              <div className="flex gap-2 border-l border-indigo-500 pl-4">
                {isTimerRunning ? (
                  <button onClick={pauseTimer}><Pause size={18} /></button>
                ) : (
                  <button onClick={() => setIsTimerRunning(true)}><Play size={18} /></button>
                )}
                <button onClick={stopTimer}><Square size={18} /></button>
              </div>
            </motion.div>
          )}

          <div className="flex gap-4">
            <button className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
              <Plus size={18} />
              New Task
            </button>

            <button
              onClick={() =>
                setShowGoalModal(true)
              }
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
            >
              <Plus size={18} />
              New Objective
            </button>
          </div>
        </div>
      </header>
      
      {/* Productivity Score Board */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Productivity Score</h3>
            <p className="text-4xl font-extrabold text-indigo-600 mt-2">{productivityScore}%</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Focus Hours</h3>
            <p className="text-4xl font-extrabold text-slate-900 mt-2">{focusHours}h</p>
        </div>
        <div className="col-span-2 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200">
            <h3 className="text-xs font-bold opacity-80 uppercase tracking-widest">Recommended Actions</h3>
            <ul className="mt-4 space-y-2">
                {recommendations.slice(0, 2).map((r, i) => <li key={i} className="text-sm font-medium flex items-center gap-2"><span>•</span> {r}</li>)}
            </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Target
                className="text-indigo-600"
                size={24}
              />

              Strategic Objectives
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
              />
            ))}

            {goals.length === 0 && (
              <div className="col-span-full p-20 bg-white rounded-3xl border border-dashed text-slate-400 italic text-center">
                No objectives defined for current
                cycle. Click "New Objective" to
                start.
              </div>
            )}
          </div>

          {/* TEMPORARILY DISABLED */}
          {/* <ActivityFeed logs={logs} /> */}
        </div>

        <div className="space-y-8 bg-slate-50 p-8 rounded-3xl border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ListTodo
              className="text-blue-600"
              size={24}
            />

            Daily Work Queue
          </h2>

          <TaskList
            tasks={tasks}
            status="In Progress"
            title="In Progress"
            onTimerStart={startTimer}
            onCompleteTask={completeTask}
          />

          <TaskList
            tasks={tasks}
            status="Pending"
            title="Pending"
            onTimerStart={startTimer}
            onCompleteTask={completeTask}
          />
        </div>
      </div>

      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{
              scale: 0.95,
              opacity: 0
            }}
            animate={{
              scale: 1,
              opacity: 1
            }}
            className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
              New Objective
            </h2>

            <p className="text-slate-400 text-sm mb-8 font-medium">
              Define clear, measurable outcomes
              for this cycle.
            </p>

            <form
              onSubmit={handleCreateGoal}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">
                  Title
                </label>

                <input
                  required
                  type="text"
                  value={newGoal.title}
                  onChange={e =>
                    setNewGoal({
                      ...newGoal,
                      title: e.target.value
                    })
                  }
                  placeholder="e.g. Scalable Infrastructure Audit"
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">
                  Description
                </label>

                <textarea
                  required
                  rows={3}
                  value={newGoal.description}
                  onChange={e =>
                    setNewGoal({
                      ...newGoal,
                      description: e.target.value
                    })
                  }
                  placeholder="Outline the steps and expected impact..."
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">
                  Weightage (%)
                </label>

                <input
                  required
                  type="number"
                  min="10"
                  max="100"
                  value={newGoal.weightage}
                  onChange={e =>
                    setNewGoal({
                      ...newGoal,
                      weightage: Number(
                        e.target.value
                      )
                    })
                  }
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setShowGoalModal(false)
                  }
                  className="flex-1 px-6 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  Discard
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <Loader2
                      className="animate-spin"
                      size={18}
                    />
                  ) : (
                    'Launch Goal'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};