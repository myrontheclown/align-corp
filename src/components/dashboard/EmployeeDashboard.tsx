import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Target, ListTodo, Loader2, Play, Pause, Square, Zap, 
    TrendingUp, Award, Clock, Download, ChevronRight, CheckCircle2, 
    AlertCircle, Sparkles, LayoutGrid, FileText
} from 'lucide-react';
import { db, collection, addDoc, Timestamp, doc, updateDoc } from '../../lib/firebase';
import { useAuth } from '../AuthProvider';
import { usePerformanceData } from '../../hooks/usePerformanceData';
import { useTasks } from '../../hooks/useTasks';
import { useToast } from '../ToastProvider';
import { generateVisualPDF } from '../../lib/reportGenerator';
import { Goal, GoalStatus, Task } from '../../types';
import { logAction } from '../../lib/db';
import { TaskList } from './tasks/TaskList';
import { getAchievements, getProductivityStats, updateDemoTask, updateProductivityStats } from '../../lib/demoDataManager';

const SkeletonCard = () => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 animate-pulse">
        <div className="flex justify-between mb-6">
            <div className="h-4 w-24 bg-slate-100 rounded-full" />
            <div className="h-6 w-6 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-6 w-48 bg-slate-100 rounded-lg mb-3" />
        <div className="h-4 w-full bg-slate-100 rounded-lg mb-8" />
        <div className="h-2 w-full bg-slate-100 rounded-full" />
    </div>
);

const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
  const statusColors: Record<GoalStatus, string> = {
    draft: 'bg-amber-100 text-amber-600',
    pending: 'bg-indigo-100 text-indigo-600',
    active: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    archived: 'bg-slate-100 text-slate-600'
  };

  return (
    <motion.div 
        whileHover={{ y: -5 }}
        layout
        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="relative z-10">
          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${statusColors[goal.status]}`}>
            {goal.status}
          </span>
          <h4 className="text-base font-black text-slate-900 dark:text-white mt-3 leading-tight">{goal.title}</h4>
        </div>
        <Target size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
      </div>

      <p className="text-xs text-slate-500 mb-6 line-clamp-2 min-h-[32px] font-medium leading-relaxed">
        {goal.description}
      </p>

      <div className="space-y-3">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
          <span className="text-slate-400">Alignment: {goal.weightage}%</span>
          <span className="text-indigo-600">{goal.progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};

export const EmployeeDashboard = () => {
  const { profile } = useAuth();
  const { goals, loading: goalsLoading } = usePerformanceData();
  const { tasks, loading: tasksLoading } = useTasks();
  const { showToast } = useToast();

  // Optimistic states
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [localGoals, setLocalGoals] = useState<Goal[]>([]);

  useEffect(() => { if (tasks) setLocalTasks(tasks); }, [tasks]);
  useEffect(() => { if (goals) setLocalGoals(goals); }, [goals]);

  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [stats, setStats] = useState(getProductivityStats());
  const [achievements, setAchievements] = useState(getAchievements());

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning]);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'Individual', weightage: 20 });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const overdueTasks = useMemo(() => localTasks.filter(t => t.deadline && t.deadline.toDate() < new Date() && t.status !== 'Completed'), [localTasks]);
  const inProgressTasks = useMemo(() => localTasks.filter(t => t.status === 'In Progress'), [localTasks]);
  const completedTasks = useMemo(() => localTasks.filter(t => t.status === 'Completed'), [localTasks]);
  const workloadLevel = inProgressTasks.length > 5 ? 'Critical' : localTasks.length > 10 ? 'High' : 'Moderate';
  
  const workloadColors = {
    'Low': 'bg-emerald-500',
    'Moderate': 'bg-blue-500',
    'High': 'bg-amber-500',
    'Critical': 'bg-red-600'
  };

  const productivityScore = Math.min(100, completedTasks.length * 8 + Math.floor(timerSeconds / 300) + (stats.streak * 2) - overdueTasks.length * 5);

  const startTimer = async (taskId: string) => {
    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'In Progress' as any } : t));
    setActiveTaskId(taskId);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    showToast('Focus engine initialized.', 'info');

    if (taskId.startsWith('demo-')) {
      updateDemoTask(taskId, { status: 'In Progress' });
    } else {
      try {
        await updateDoc(doc(db, 'tasks', taskId), { status: 'In Progress', updatedAt: Timestamp.now() });
      } catch (e) {
        showToast('Sync failed. Reverting...', 'error');
        setLocalTasks(tasks);
      }
    }
  };

  const toggleTaskCompletion = async (taskId: string, status: Task['status']) => {
    const prevTasks = [...localTasks];
    const durationMinutes = Math.floor(timerSeconds / 60);

    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    if (status === 'Completed') {
        showToast('Strategic objective reached.', 'success');
        if (activeTaskId === taskId) stopTimer();
    }

    if (taskId.startsWith('demo-')) {
      updateDemoTask(taskId, { status, actualDurationMinutes: status === 'Completed' ? durationMinutes : 0 });
      if (status === 'Completed') {
        updateProductivityStats({ totalFocusMinutes: stats.totalFocusMinutes + durationMinutes, completedTasks: stats.completedTasks + 1 });
      } else {
        updateProductivityStats({ completedTasks: Math.max(0, stats.completedTasks - 1) });
      }
      setStats(getProductivityStats());
    } else {
      try {
        await updateDoc(doc(db, 'tasks', taskId), {
          status,
          actualDurationMinutes: status === 'Completed' ? durationMinutes : 0,
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        showToast('Sync error. Rolling back state.', 'error');
        setLocalTasks(prevTasks);
      }
    }
  };

  const pauseTimer = () => setIsTimerRunning(false);
  const stopTimer = () => { setIsTimerRunning(false); setActiveTaskId(null); setTimerSeconds(0); };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSubmitting(true);
    
    const tempId = `temp-${Date.now()}`;
    const goalData = {
        ...newGoal,
        userId: profile.uid,
        managerId: profile.managerId || 'pending',
        status: 'draft' as GoalStatus,
        progress: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        targetDate: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
    };

    // Optimistic Update
    setLocalGoals(prev => [{ id: tempId, ...goalData } as Goal, ...prev]);
    showToast('Proposal transmitted to executive sector.', 'success');
    setShowGoalModal(false);
    setNewGoal({ title: '', description: '', category: 'Individual', weightage: 20 });

    try {
      const docRef = await addDoc(collection(db, 'goals'), goalData);
      setLocalGoals(prev => prev.map(g => g.id === tempId ? { ...g, id: docRef.id } : g));
    } catch (err) {
      showToast('Proposal failed. Local state purged.', 'error');
      setLocalGoals(goals);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    showToast('Capturing productivity landscape...', 'info');
    try {
        await generateVisualPDF({
            elementId: 'employee-dashboard-content',
            filename: 'productivity_audit',
            title: 'Personal Productivity Landscape'
        });
        showToast('PDF report generated and downloaded.', 'success');
    } catch (err: any) {
        showToast(`Export failed: ${err.message}`, 'error');
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div id="employee-dashboard-content" className={`max-w-7xl mx-auto space-y-12 transition-all duration-700 pb-20 ${isTimerRunning ? 'ring-[20px] ring-indigo-500/5 rounded-[4rem] p-8' : ''}`}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">
            {getGreeting()}, <span className="text-indigo-600">{profile?.displayName?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-500 mt-4 text-xl font-medium max-w-xl leading-relaxed">
            Your enterprise landscape is <span className="text-slate-900 font-black underline decoration-indigo-500 underline-offset-4">synchronized</span> and ready for high-velocity output.
          </p>
        </motion.div>

        <div className="flex gap-4">
            <button 
                onClick={handleExportReport}
                disabled={isExporting}
                className="bg-white text-slate-900 px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex items-center gap-2"
            >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Intelligence Export
            </button>
            <button
              onClick={() => setShowGoalModal(true)}
              className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/20"
            >
              <Plus size={16} strokeWidth={4} /> Proposed Objective
            </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between group overflow-hidden relative">
                <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-1000" />
                <div className="relative z-10 space-y-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Readiness</h3>
                    <p className="text-2xl font-black text-slate-900 leading-tight">
                        {overdueTasks.length > 0 
                          ? `Protocol mismatch: ${overdueTasks.length} critical items require priority resolution.` 
                          : "Status Nominal. Team velocity is currently optimized."}
                    </p>
                </div>
                <div className="flex items-center gap-8 mt-6 md:mt-0 relative z-10 bg-slate-50 p-6 rounded-[2rem] border border-white shadow-inner">
                    <div className="text-right">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Resource Load</span>
                        <span className={`font-black text-xl ${workloadLevel === 'Critical' ? 'text-red-600' : 'text-slate-900'}`}>{workloadLevel}</span>
                    </div>
                    <div className="w-40 h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: workloadLevel === 'Critical' ? '95%' : workloadLevel === 'High' ? '75%' : '45%' }}
                            className={`h-full ${workloadColors[workloadLevel as keyof typeof workloadColors] || 'bg-blue-500'} shadow-lg`} 
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Intelligence Score', value: `${productivityScore}%`, icon: TrendingUp, color: 'text-indigo-600', sub: 'Daily Momentum' },
                    { label: 'Active Streak', value: `${stats.streak}d`, icon: Zap, color: 'text-amber-500', sub: 'Continuity Index' },
                    { label: 'Global Rank', value: achievements.length, icon: Award, color: 'text-purple-500', sub: 'Governance Badges' }
                ].map((stat, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <stat.icon size={22} className={stat.color} />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <p className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{stat.sub}</p>
                    </motion.div>
                ))}
            </div>
        </div>
        
        <div className={`col-span-12 lg:col-span-4 p-10 rounded-[3.5rem] text-white transition-all duration-700 relative overflow-hidden flex flex-col justify-between shadow-2xl ${isTimerRunning ? 'bg-indigo-600 shadow-indigo-500/40 scale-105' : 'bg-slate-900 shadow-slate-900/40'}`}>
             {isTimerRunning && (
                 <motion.div 
                    animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }} 
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="absolute inset-0 bg-white rounded-full -m-32"
                 />
             )}
             
             <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                            <Sparkles size={16} />
                        </div>
                        <h3 className="font-black uppercase tracking-[0.3em] text-[10px] opacity-70">Focus Engine</h3>
                    </div>
                    {isTimerRunning && <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Deep Work Active</span>}
                </div>
                
                {activeTaskId ? (
                    <div>
                        <p className="text-2xl font-black leading-tight line-clamp-2 tracking-tight">{localTasks.find(t => t.id === activeTaskId)?.title}</p>
                        <div className="flex items-end gap-2 mt-8">
                            <p className="text-7xl font-mono font-black tracking-tighter tabular-nums">
                                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                            </p>
                            <span className="text-xl font-black opacity-30 mb-2 uppercase tracking-tighter">Min</span>
                        </div>
                        <div className="flex gap-4 mt-12">
                            <button onClick={pauseTimer} className="flex-1 p-5 bg-white/10 rounded-[1.75rem] hover:bg-white/20 transition-all flex justify-center border border-white/5"><Pause size={24} strokeWidth={3}/></button>
                            <button onClick={() => toggleTaskCompletion(activeTaskId, 'Completed')} className="flex-[2.5] p-5 bg-white text-indigo-600 rounded-[1.75rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all">Protocol Resolved</button>
                            <button onClick={stopTimer} className="flex-1 p-5 bg-white/10 rounded-[1.75rem] hover:bg-white/20 transition-all flex justify-center border border-white/5"><Square size={24} strokeWidth={3}/></button>
                        </div>
                    </div>
                ) : (
                    <div className="py-16 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-8 border border-white/5 shadow-inner">
                            <Clock size={32} className="opacity-20" />
                        </div>
                        <p className="text-slate-400 font-bold text-lg">Engine Standby</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-3 leading-loose">Initialize session from prioritized queue below</p>
                    </div>
                )}
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
              <div className="w-12 h-12 rounded-3xl bg-indigo-50 flex items-center justify-center">
                <Target className="text-indigo-600" size={24} />
              </div>
              Strategic Objectives
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <LayoutGrid size={14} /> Grid View
            </div>
          </div>

          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {goalsLoading ? [1,2,3,4].map(i => <SkeletonCard key={i} />) : (
                localGoals.map(goal => <GoalCard key={goal.id} goal={goal} />)
            )}
          </motion.div>
        </div>

        <div className="lg:col-span-4 space-y-10 bg-slate-50/80 p-10 rounded-[3.5rem] border border-slate-100 shadow-inner">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
             <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                <ListTodo className="text-blue-600" size={22} />
             </div>
             High-Velocity Queue
          </h2>

          <div className="space-y-12">
            <TaskList
                tasks={localTasks}
                status="In Progress"
                title="Authorized"
                onTimerStart={startTimer}
                onCompleteTask={toggleTaskCompletion}
            />

            <TaskList
                tasks={localTasks}
                status="Pending"
                title="Prioritized"
                onTimerStart={startTimer}
                onCompleteTask={toggleTaskCompletion}
            />
            
            <TaskList
                tasks={localTasks}
                status="Completed"
                title="Finalized"
                onCompleteTask={toggleTaskCompletion}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-4 z-[100]">
          <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white rounded-[3.5rem] p-12 max-w-lg w-full shadow-2xl border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter relative z-10">Propose Objective</h2>
            <p className="text-slate-400 text-sm mb-10 font-medium relative z-10">Define a high-alignment outcome for authorized review.</p>
            <form onSubmit={handleCreateGoal} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Objective Signature</label>
                <input required type="text" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="e.g. Infrastructure Decentralization" className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-black text-slate-900 placeholder:text-slate-300" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Strategic Description</label>
                <textarea required rows={3} value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Outcome parameters and alignment metrics..." className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300" />
              </div>
              <div className="flex gap-5 pt-4">
                <button type="button" onClick={() => setShowGoalModal(false)} className="flex-1 px-8 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100">Discard</button>
                <button type="submit" disabled={isSubmitting} className="flex-[1.5] bg-slate-900 text-white px-8 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Transmit Proposal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};
