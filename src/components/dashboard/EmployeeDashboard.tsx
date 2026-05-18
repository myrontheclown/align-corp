import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, ListTodo, Loader2, Play, Pause, Square, Zap, TrendingUp, Award, Clock } from 'lucide-react';
import { db, collection, addDoc, Timestamp, doc, updateDoc } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { usePerformanceData } from '../../hooks/usePerformanceData';
import { useTasks } from '../../hooks/useTasks';
import { Goal, GoalStatus, Task } from '../../types';
import { logAction } from '../../lib/db';
import { TaskList } from './tasks/TaskList';
import { getAchievements, getProductivityStats, updateDemoTask, updateProductivityStats } from '../../lib/demoDataManager';

const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
  const statusColors: Record<GoalStatus, string> = {
    draft: 'bg-amber-100 text-amber-600',
    pending: 'bg-indigo-100 text-indigo-600',
    active: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    archived: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
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

        <Target size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
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
  
  const [stats, setStats] = useState(getProductivityStats());
  const [achievements, setAchievements] = useState(getAchievements());

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

  const pendingTasksCount = safeTasks.filter(t => t.status === 'Pending').length;
  const inProgressTasks = safeTasks.filter(t => t.status === 'In Progress');
  const completedTasks = safeTasks.filter(t => t.status === 'Completed');
  const overdueTasks = safeTasks.filter(t => t.deadline && t.deadline.toDate() < new Date() && t.status !== 'Completed');
  
  const workloadLevel = inProgressTasks.length > 5 ? 'Critical' : safeTasks.length > 10 ? 'High' : 'Moderate';
  const workloadColors = {
    'Low': 'bg-emerald-500',
    'Moderate': 'bg-blue-500',
    'High': 'bg-amber-500',
    'Critical': 'bg-red-600'
  };

  const focusHours = (timerSeconds / 3600).toFixed(1);
  const productivityScore = Math.min(
    100,
    completedTasks.length * 8 +
    Math.floor(timerSeconds / 300) +
    (stats.streak * 2) -
    overdueTasks.length * 5
  );

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(
        collection(db, 'goals'),
        {
          ...newGoal,
          userId: profile.uid,
          managerId: profile.managerId || 'pending',
          status: 'draft',
          progress: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          targetDate: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
        }
      );
      await logAction(profile, 'CREATE_GOAL', docRef.id, 'goal', { newValue: newGoal });
      setShowGoalModal(false);
      setNewGoal({ title: '', description: '', category: 'Individual', weightage: 20 });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startTimer = async (taskId: string) => {
    setActiveTaskId(taskId);
    setTimerSeconds(0);
    setIsTimerRunning(true);

    if (taskId.startsWith('demo-')) {
      updateDemoTask(taskId, { status: 'In Progress' });
    } else {
      try {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, { status: 'In Progress', updatedAt: Timestamp.now() });
      } catch (e) {
        console.error('Error starting firestore task timer:', e);
      }
    }
  };

  const pauseTimer = () => setIsTimerRunning(false);
  const stopTimer = () => {
    setIsTimerRunning(false);
    setActiveTaskId(null);
    setTimerSeconds(0);
  };

  const toggleTaskCompletion = async (taskId: string, status: Task['status']) => {
    const durationMinutes = Math.floor(timerSeconds / 60);
    if (taskId.startsWith('demo-')) {
      updateDemoTask(taskId, { status, actualDurationMinutes: status === 'Completed' ? durationMinutes : 0 });
      if (status === 'Completed') {
        updateProductivityStats({ 
            totalFocusMinutes: stats.totalFocusMinutes + durationMinutes,
            completedTasks: stats.completedTasks + 1
        });
      } else {
        updateProductivityStats({ 
            completedTasks: Math.max(0, stats.completedTasks - 1)
        });
      }
      setStats(getProductivityStats());
    } else {
      try {
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
          status,
          actualDurationMinutes: status === 'Completed' ? durationMinutes : 0,
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        console.error('Error toggling firestore task status:', error);
      }
    }
    if (status === 'Completed' && activeTaskId === taskId) {
        stopTimer();
    }
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-10 transition-all duration-500 pb-20 ${isTimerRunning ? 'ring-8 ring-indigo-500/5 rounded-[3rem] p-4' : ''}`}>
      <header className="flex justify-between items-start">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting()},{' '}
            <span className="text-indigo-600">{profile?.displayName?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 mt-3 text-lg font-medium">
            Your enterprise productivity landscape is looking <span className="text-slate-900 font-bold">optimized</span>.
          </p>
        </motion.div>

        <div className="flex flex-col items-end gap-5">
          <PresenceIndicator status={profile?.status} />
          <div className="flex gap-4">
            <button className="bg-white text-slate-900 px-6 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
                Analytics Deep-Dive
            </button>
            <button
              onClick={() => setShowGoalModal(true)}
              className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
            >
              <Plus size={16} strokeWidth={3} />
              New Objective
            </button>
          </div>
        </div>
      </header>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group overflow-hidden relative">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700 opacity-50" />
                <div className="relative z-10">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Morning Briefing</h3>
                    <p className="text-xl font-bold text-slate-900">
                        {overdueTasks.length > 0 
                          ? `You have ${overdueTasks.length} critical items requiring immediate resolution.` 
                          : "No pending work. Excellent momentum maintained."}
                    </p>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="text-right">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Workload</span>
                        <span className={`font-extrabold text-lg ${workloadLevel === 'Critical' ? 'text-red-600' : 'text-slate-900'}`}>{workloadLevel}</span>
                    </div>
                    <div className="w-40 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: workloadLevel === 'Critical' ? '95%' : workloadLevel === 'High' ? '75%' : '45%' }}
                            className={`h-full ${workloadColors[workloadLevel as keyof typeof workloadColors] || 'bg-blue-500'}`} 
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                    <div className="flex justify-between items-start">
                        <TrendingUp size={20} className="text-indigo-600" />
                        <span className="text-[10px] font-black text-slate-300 uppercase">Productivity</span>
                    </div>
                    <p className="text-4xl font-black text-slate-900 mt-4">{productivityScore}%</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Daily Efficiency</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                    <div className="flex justify-between items-start">
                        <Zap size={20} className="text-amber-500" />
                        <span className="text-[10px] font-black text-slate-300 uppercase">Streak</span>
                    </div>
                    <p className="text-4xl font-black text-slate-900 mt-4">{stats.streak}d</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Consistent Growth</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                    <div className="flex justify-between items-start">
                        <Award size={20} className="text-purple-500" />
                        <span className="text-[10px] font-black text-slate-300 uppercase">Badges</span>
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                        {achievements.slice(0, 3).map(a => (
                            <div key={a} className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                                {a}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs font-bold text-slate-400 mt-2">{achievements.length} Earned</p>
                </div>
            </div>
        </div>
        
        <div className={`col-span-4 p-10 rounded-[3rem] text-white transition-all duration-700 relative overflow-hidden flex flex-col justify-between ${isTimerRunning ? 'bg-indigo-600 shadow-2xl shadow-indigo-500/30 scale-105' : 'bg-slate-900'}`}>
             {isTimerRunning && (
                 <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} 
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute inset-0 bg-white rounded-full -m-20"
                 />
             )}
             
             <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black uppercase tracking-[0.2em] text-[10px] opacity-60">Focus Engine</h3>
                    {isTimerRunning && <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase animate-pulse">Deep Work Active</span>}
                </div>
                
                {activeTaskId ? (
                    <div>
                        <p className="text-xl font-bold leading-tight line-clamp-2">{safeTasks.find(t => t.id === activeTaskId)?.title}</p>
                        <p className="text-6xl font-mono font-black mt-6 tracking-tighter">
                            {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                        </p>
                        <div className="flex gap-4 mt-10">
                            <button onClick={pauseTimer} className="flex-1 p-4 bg-white/10 rounded-[1.25rem] hover:bg-white/20 transition-all flex justify-center"><Pause size={24} /></button>
                            <button onClick={() => toggleTaskCompletion(activeTaskId, 'Completed')} className="flex-[2] p-4 bg-white text-indigo-600 rounded-[1.25rem] font-black uppercase tracking-widest text-xs shadow-lg">Complete</button>
                            <button onClick={stopTimer} className="flex-1 p-4 bg-white/10 rounded-[1.25rem] hover:bg-white/20 transition-all flex justify-center"><Square size={24} /></button>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <Clock size={32} className="opacity-20" />
                        </div>
                        <p className="text-slate-400 font-medium italic">Your schedule is clear today.</p>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-2">No critical deadlines detected</p>
                    </div>
                )}
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <Target className="text-indigo-600" size={20} />
              </div>
              Strategic Objectives
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>

        <div className="space-y-10 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                <ListTodo className="text-blue-600" size={20} />
             </div>
             Work Queue
          </h2>

          <div className="space-y-10">
            <TaskList
                tasks={tasks}
                status="In Progress"
                title="Active"
                onTimerStart={startTimer}
                onCompleteTask={toggleTaskCompletion}
            />

            <TaskList
                tasks={tasks}
                status="Pending"
                title="Prioritized"
                onTimerStart={startTimer}
                onCompleteTask={toggleTaskCompletion}
            />
            
            <TaskList
                tasks={tasks}
                status="Completed"
                title="Completed"
                onCompleteTask={toggleTaskCompletion}
            />
          </div>
        </div>
      </div>

      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl">
            <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">New Objective</h2>
            <p className="text-slate-400 text-sm mb-10 font-medium">Define clear, measurable outcomes for this cycle.</p>
            <form onSubmit={handleCreateGoal} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Objective Title</label>
                <input required type="text" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-slate-900" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Description</label>
                <textarea required rows={3} value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium text-slate-900" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowGoalModal(false)} className="flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all">Discard</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Launch'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
