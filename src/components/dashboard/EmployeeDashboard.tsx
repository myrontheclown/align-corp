import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, ListTodo, Loader2 } from 'lucide-react';
import { db, collection, addDoc, Timestamp } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { usePerformanceData } from '../../hooks/usePerformanceData';
import { useTasks } from '../../hooks/useTasks';
// import { useTaskSessions } from '../../hooks/useTaskSessions';
// import { useAuditLogs } from '../../hooks/useAuditLogs';
import { Goal, GoalStatus } from '../../types';
import { logAction } from '../../lib/db';
import { TaskList } from './tasks/TaskList';
import { AnalyticsWidgets } from './analytics/AnalyticsWidgets';
// import { ActivityFeed } from './ActivityFeed';

const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
  const statusColors: Record<GoalStatus, string> = {
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

  return (
    <div className="max-w-7xl mx-auto space-y-10">
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

        <div className="flex gap-4 items-center">
          <PresenceIndicator
            status={profile?.status}
          />

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
      </header>

      {/* TEMPORARILY SIMPLIFIED */}
      <AnalyticsWidgets tasks={tasks} />

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
          />

          <TaskList
            tasks={tasks}
            status="Pending"
            title="Pending"
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