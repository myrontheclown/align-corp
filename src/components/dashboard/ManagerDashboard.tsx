import React, { useState } from 'react';
import { 
  Target, Users, CheckCircle2, AlertCircle, Loader2, MessageSquare, 
  Edit3, Plus, Calendar as CalendarIcon, BarChart3, TrendingUp, 
  ArrowRight, Search, Filter, MoreHorizontal, Zap, Clock, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { useManagerData } from '../../hooks/useManagerData';
import { Goal, GoalStatus, Task, UserProfile } from '../../types';
import { updateGoalWithLog, createTask } from '../../lib/db';
import { getDemoData, updateDemoGoal } from '../../lib/demoDataManager';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, subtext, icon: Icon, color, trend }: { title: string, value: string | number, subtext?: string, icon: any, color: string, trend?: string }) => (
  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
    <div className={`absolute right-0 top-0 w-24 h-24 ${color} opacity-[0.03] rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700`} />
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      {trend && (
          <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-widest">{trend}</span>
      )}
    </div>
    <div className="relative z-10">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</h3>
        <p className="text-3xl font-black text-slate-900">{value}</p>
        {subtext && <p className="text-xs font-bold text-slate-400 mt-1">{subtext}</p>}
    </div>
  </div>
);

const ApprovalCard: React.FC<{ goal: Goal, onAction: () => void }> = ({ goal, onAction }) => {
  const { profile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [comments, setComments] = useState(goal.managerComments || '');

  const handleAction = async (status: GoalStatus) => {
    if (!profile) return;
    setIsUpdating(true);
    try {
        if (goal.id.startsWith('demo-')) {
            updateDemoGoal(goal.id, { status, managerComments: comments, isLocked: status === 'active' });
        } else {
            await updateGoalWithLog(profile, goal.id, { 
                status, 
                managerComments: comments,
                isLocked: status === 'active'
            }, goal);
        }
        onAction();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-indigo-100 transition-colors group">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-100 text-amber-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Awaiting Approval</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submission ID: {goal.id.slice(-6).toUpperCase()}</span>
          </div>
          <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{goal.title}</h4>
          <p className="text-sm text-slate-500 mt-1 font-medium">{goal.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-6 py-4 border-y border-slate-50">
        <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Weightage</p>
            <p className="text-sm font-black text-slate-700">{goal.weightage}%</p>
        </div>
        <div className="flex-1">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Alignment Category</p>
            <p className="text-sm font-black text-indigo-600">{goal.category}</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
          <MessageSquare size={12} /> Add Review Feedback
        </label>
        <textarea 
          value={comments}
          onChange={e => setComments(e.target.value)}
          placeholder="Guidance for this objective..."
          className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-300 min-h-[80px]"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button 
          onClick={() => handleAction('active')}
          disabled={isUpdating}
          className="flex-[2] bg-slate-900 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
        >
          {isUpdating ? <Loader2 className="animate-spin" size={14} /> : (
              <>
                <ShieldCheck size={14} /> Approve & Authorize
              </>
          )}
        </button>
        <button 
          onClick={() => handleAction('archived')}
          disabled={isUpdating}
          className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
        >
          Reject
        </button>
      </div>
    </div>
  );
};

const EmployeeRow: React.FC<{ member: any, tasks: Task[], goals: Goal[], onClick: () => void }> = ({ member, tasks, goals, onClick }) => {
    const memberTasks = tasks.filter(t => t.userId === member.uid);
    const memberGoals = goals.filter(g => g.userId === member.uid);
    const overdueCount = memberTasks.filter(t => t.deadline && t.deadline.toDate() < new Date() && t.status !== 'Completed').length;
    
    // Demo metrics if not available
    const productivity = member.productivityScore || 85;
    const workload = member.workload || (memberTasks.length > 8 ? 'Critical' : memberTasks.length > 5 ? 'High' : 'Moderate');
    
    const workloadColors = {
        'Low': 'bg-emerald-500',
        'Moderate': 'bg-blue-500',
        'High': 'bg-amber-500',
        'Critical': 'bg-red-600'
    };

    return (
        <tr className="group hover:bg-slate-50 transition-colors cursor-pointer" onClick={onClick}>
            <td className="py-5 px-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                        {member.displayName.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900">{member.displayName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.department}</p>
                    </div>
                </div>
            </td>
            <td className="py-5 px-6">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-20">
                        <div className="h-full bg-indigo-600" style={{ width: `${productivity}%` }} />
                    </div>
                    <span className="text-sm font-black text-slate-900">{productivity}%</span>
                </div>
            </td>
            <td className="py-5 px-6 text-center">
                <span className="text-sm font-black text-slate-900">{memberTasks.filter(t => t.status === 'Completed').length}</span>
            </td>
            <td className="py-5 px-6 text-center">
                <span className="text-sm font-black text-slate-900">{memberGoals.length}</span>
            </td>
            <td className="py-5 px-6 text-center">
                <span className={`text-sm font-black ${overdueCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>{overdueCount}</span>
            </td>
            <td className="py-5 px-6">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${workloadColors[workload as keyof typeof workloadColors]}`} />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{workload}</span>
                </div>
            </td>
            <td className="py-5 px-6 text-right">
                <div className={`w-2 h-2 rounded-full inline-block ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </td>
        </tr>
    );
};

const TaskAssignmentModal: React.FC<{ members: UserProfile[], onClose: () => void }> = ({ members, onClose }) => {
    const { profile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [task, setTask] = useState({
        title: '',
        description: '',
        userId: members[0]?.uid || '',
        priority: 'Medium' as const,
        estimatedDurationMinutes: 60,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;
        setIsSubmitting(true);
        try {
            await createTask(profile, {
                ...task,
                status: 'Pending',
                actualDurationMinutes: 0,
                subtasks: [],
                notes: [`Assigned by manager: ${profile.displayName}`],
                deadline: { toDate: () => new Date(task.deadline) } as any
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl">
                <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Assign Task</h2>
                <p className="text-slate-400 text-sm mb-10 font-medium">Orchestrate your team with high-priority objectives.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Task Title</label>
                            <input required type="text" value={task.title} onChange={e => setTask({ ...task, title: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-slate-900" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Assignee</label>
                            <select value={task.userId} onChange={e => setTask({ ...task, userId: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-slate-900 appearance-none">
                                {members.map(m => <option key={m.uid} value={m.uid}>{m.displayName}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Priority</label>
                            <select value={task.priority} onChange={e => setTask({ ...task, priority: e.target.value as any })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-slate-900 appearance-none">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Deadline</label>
                            <input required type="date" value={task.deadline} onChange={e => setTask({ ...task, deadline: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-slate-900" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Est. Minutes</label>
                            <input required type="number" value={task.estimatedDurationMinutes} onChange={e => setTask({ ...task, estimatedDurationMinutes: Number(e.target.value) })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-slate-900" />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Description</label>
                            <textarea required rows={3} value={task.description} onChange={e => setTask({ ...task, description: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-medium text-slate-900" />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 bg-slate-50 hover:bg-slate-100 transition-all">Discard</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                        {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Assign Task'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export const ManagerDashboard = () => {
  const { profile } = useAuth();
  const { teamMembers, teamGoals, teamTasks, loading } = useManagerData();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);

  const pendingGoals = teamGoals.filter(g => g.status === 'draft' || g.status === 'pending');
  const criticalTasks = teamTasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed');
  const avgProductivity = teamMembers.length ? Math.floor(teamMembers.reduce((acc, curr: any) => acc + (curr.productivityScore || 85), 0) / teamMembers.length) : 0;
  
  const { activity = [] } = getDemoData();

  if (loading) return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} strokeWidth={3} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Team Intelligence...</p>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                Workforce Hub
            </h1>
            <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">Management Level</span>
          </div>
          <p className="text-slate-500 mt-3 text-lg font-medium">
            Strategic orchestration for the <span className="text-slate-900 font-bold">{profile?.department || 'Operations'}</span> sector.
          </p>
        </div>

        <div className="flex gap-4">
            <Link to="/manager/calendar" className="bg-white text-slate-900 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-slate-100 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                <CalendarIcon size={16} /> Open Calendar
            </Link>
            <button 
                onClick={() => setShowTaskModal(true)}
                className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            >
                <Plus size={16} strokeWidth={3} /> Assign Task
            </button>
        </div>
      </header>

      {/* Intelligence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard title="Team Velocity" value={`${avgProductivity}%`} subtext="Avg Productivity Score" icon={TrendingUp} color="bg-indigo-600" trend="+14.2%" />
        <StatCard title="Resource Load" value={teamMembers.filter((m: any) => m.workload === 'High' || m.workload === 'Critical').length} subtext="High-Workload Personnel" icon={Users} color="bg-slate-900" />
        <StatCard title="Approval Queue" value={pendingGoals.length} subtext="Awaiting Authorization" icon={ShieldCheck} color="bg-amber-500" />
        <StatCard title="Active Risks" value={criticalTasks.length} subtext="Critical Items Pending" icon={AlertCircle} color="bg-red-600" />
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-12">
            {/* Team Performance Matrix */}
            <section className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                            <BarChart3 className="text-indigo-600" size={20} />
                        </div>
                        Performance Matrix
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input type="text" placeholder="Search team..." className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-600" />
                        </div>
                        <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"><Filter size={18} /></button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Productivity</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tasks</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Goals</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Overdue</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Load</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Auth</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamMembers.map((member: any) => (
                                <EmployeeRow 
                                    key={member.uid} 
                                    member={member} 
                                    tasks={teamTasks} 
                                    goals={teamGoals} 
                                    onClick={() => setSelectedEmployee(member)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Approval Queue */}
            {pendingGoals.length > 0 && (
                <section className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <ShieldCheck className="text-amber-600" size={20} />
                        </div>
                        Strategic Approvals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pendingGoals.map(goal => (
                            <ApprovalCard key={goal.id} goal={goal} onAction={() => {}} />
                        ))}
                    </div>
                </section>
            )}

            {/* Workload Heatmap */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                        <Zap className="text-red-600" size={20} />
                    </div>
                    Workload Heatmap
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teamMembers.map((m: any) => {
                        const mTasks = teamTasks.filter(t => t.userId === m.uid && t.status !== 'Completed');
                        const workload = m.workload || (mTasks.length > 8 ? 'Critical' : mTasks.length > 5 ? 'High' : 'Moderate');
                        const workloadColors = {
                            'Low': 'bg-emerald-500',
                            'Moderate': 'bg-blue-500',
                            'High': 'bg-amber-500',
                            'Critical': 'bg-red-600'
                        };
                        return (
                            <div key={m.uid} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black text-slate-900">{m.displayName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{mTasks.length} Active Tasks</p>
                                </div>
                                <div className="text-right">
                                    <div className={`w-3 h-3 rounded-full ml-auto mb-1 ${workloadColors[workload as keyof typeof workloadColors]}`} />
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{workload}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-12">
            {/* Smart Manager Insights */}
            <section className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl shadow-slate-200">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                    <Zap size={14} className="text-amber-500" /> Intelligence Insights
                </h3>
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                        <p className="text-sm font-medium leading-relaxed">3 employees approaching <span className="text-amber-400 font-bold">workload risk</span> threshold. Consider task redistribution.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <p className="text-sm font-medium leading-relaxed">Team productivity increased by <span className="text-emerald-400 font-bold">14.2%</span> compared to previous cycle.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                        <p className="text-sm font-medium leading-relaxed">2 critical deadlines due in the next <span className="text-indigo-400 font-bold">48 hours</span>. High focus required.</p>
                    </div>
                </div>
                <button className="w-full py-4 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Generate Full Report</button>
            </section>

            {/* Live Activity Feed */}
            <section className="space-y-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                        <Clock className="text-slate-400" size={16} />
                    </div>
                    Activity Feed
                </h2>
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-8">
                    {activity.map((a: any) => (
                        <div key={a.id} className="flex gap-4 group">
                            <div className="relative flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <ArrowRight size={14} />
                                </div>
                                <div className="w-0.5 h-full bg-slate-50 absolute top-8" />
                            </div>
                            <div className="flex-1 pb-2">
                                <p className="text-xs font-bold text-slate-900"><span className="text-indigo-600">{a.user}</span> {a.type.replace('_', ' ')}</p>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.detail}</p>
                                <p className="text-[9px] font-black text-slate-300 uppercase mt-2">{new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
      </div>

      {/* Employee Detail Drawer */}
      <AnimatePresence>
        {selectedEmployee && (
            <div className="fixed inset-0 z-[60] flex justify-end">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEmployee(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto p-12">
                    <button onClick={() => setSelectedEmployee(null)} className="absolute top-10 right-10 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"><MoreHorizontal size={24} /></button>
                    
                    <div className="flex items-center gap-6 mb-12">
                        <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-200">
                            {selectedEmployee.displayName.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-slate-900">{selectedEmployee.displayName}</h3>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{selectedEmployee.department} Sector</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="p-6 bg-slate-50 rounded-3xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Productivity</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{(selectedEmployee as any).productivityScore || 85}%</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Focus Hours</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{(selectedEmployee as any).focusHours || 32}h</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h4 className="text-xl font-black text-slate-900">Active Workload</h4>
                        <div className="space-y-4">
                            {teamTasks.filter(t => t.userId === selectedEmployee.uid && t.status !== 'Completed').map(task => (
                                <div key={task.id} className="p-5 border border-slate-100 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{task.title}</p>
                                        <p className="text-xs text-slate-400 mt-1">{task.priority} Priority</p>
                                    </div>
                                    <ArrowRight size={18} className="text-slate-300" />
                                </div>
                            ))}
                            {teamTasks.filter(t => t.userId === selectedEmployee.uid && t.status !== 'Completed').length === 0 && (
                                <p className="text-slate-400 italic text-sm">No active tasks.</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-12 space-y-8">
                        <h4 className="text-xl font-black text-slate-900">Strategic Objectives</h4>
                        <div className="space-y-4">
                            {teamGoals.filter(g => g.userId === selectedEmployee.uid).map(goal => (
                                <div key={goal.id} className="p-5 border border-slate-100 rounded-2xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="text-sm font-bold text-slate-900">{goal.title}</p>
                                        <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full uppercase">{goal.status}</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-600" style={{ width: `${goal.progress}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Assign Task</button>
                        <button className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Full Profile</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {showTaskModal && (
          <TaskAssignmentModal members={teamMembers} onClose={() => setShowTaskModal(false)} />
      )}
    </div>
  );
};
