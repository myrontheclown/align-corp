import React, { useState, useEffect, useMemo } from 'react';
import { 
  Target, Users, CheckCircle2, AlertCircle, Loader2, MessageSquare, 
  Edit3, Plus, Calendar as CalendarIcon, BarChart3, TrendingUp, 
  ArrowRight, Search, Filter, MoreHorizontal, Zap, Clock, ShieldCheck, Download, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { useManagerData } from '../../hooks/useManagerData';
import { useToast } from '../ToastProvider';
import { generateVisualPDF } from '../../lib/reportGenerator';
import { exportToCSV } from '../../lib/csvExport';
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

const ApprovalCard: React.FC<{ goal: Goal, onAction: (status: GoalStatus) => void }> = ({ goal, onAction }) => {
  const [comments, setComments] = useState(goal.managerComments || '');
  const [isUpdating, setIsUpdating] = useState(false);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 hover:border-indigo-100 transition-colors group">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-100 text-amber-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Awaiting Approval</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {goal.id.slice(-6).toUpperCase()}</span>
          </div>
          <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{goal.title}</h4>
        </div>
      </div>

      <div className="space-y-2">
        <textarea 
          value={comments}
          onChange={e => setComments(e.target.value)}
          placeholder="Add guidance feedback..."
          className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-300 min-h-[80px]"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button 
          onClick={() => { onAction('active'); setIsUpdating(true); }}
          className="flex-[2] bg-slate-900 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <ShieldCheck size={14} /> Authorize
        </button>
        <button 
          onClick={() => { onAction('archived'); setIsUpdating(true); }}
          className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export const ManagerDashboard = () => {
  const { profile } = useAuth();
  const { teamMembers, teamGoals, teamTasks, loading } = useManagerData();
  const { showToast } = useToast();

  const [localMembers, setLocalMembers] = useState<UserProfile[]>([]);
  const [localGoals, setLocalGoals] = useState<Goal[]>([]);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<UserProfile | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => { if (teamMembers) setLocalMembers(teamMembers); }, [teamMembers]);
  useEffect(() => { if (teamGoals) setLocalGoals(teamGoals); }, [teamGoals]);
  useEffect(() => { if (teamTasks) setLocalTasks(teamTasks); }, [teamTasks]);

  const pendingGoals = useMemo(() => localGoals.filter(g => g.status === 'draft' || g.status === 'pending'), [localGoals]);
  const criticalTasks = useMemo(() => localTasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed'), [localTasks]);
  const avgProductivity = localMembers.length ? Math.floor(localMembers.reduce((acc, curr: any) => acc + (curr.productivityScore || 85), 0) / localMembers.length) : 0;
  
  const { activity = [] } = getDemoData();

  const handleGoalApproval = async (goalId: string, status: GoalStatus) => {
    const originalGoals = [...localGoals];
    const goal = localGoals.find(g => g.id === goalId);
    if (!goal || !profile) return;

    // Optimistic Update
    setLocalGoals(prev => prev.filter(g => g.id !== goalId));
    showToast(status === 'active' ? 'Objective authorized.' : 'Objective rejected.', 'success');

    try {
        if (goalId.startsWith('demo-')) {
            updateDemoGoal(goalId, { status, isLocked: status === 'active' });
        } else {
            await updateGoalWithLog(profile, goalId, { status, isLocked: status === 'active' }, goal);
        }
    } catch (err) {
        showToast('Approval synchronization failed.', 'error');
        setLocalGoals(originalGoals);
    }
  };

  const handleExportTeamReport = async (format: 'PDF' | 'CSV') => {
    setIsExporting(true);
    showToast(`Synthesizing team data as ${format}...`, 'info');
    try {
        if (format === 'PDF') {
            await generateVisualPDF({
                elementId: 'manager-dashboard-content',
                filename: 'team_performance_audit',
                title: 'Team Performance & Alignment Audit'
            });
        } else {
            exportToCSV(localMembers.map(m => ({
                Name: m.displayName,
                Email: m.email,
                Productivity: `${(m as any).productivityScore || 85}%`,
                Workload: (m as any).workload || 'Moderate',
                Role: m.role,
                Department: m.department
            })), 'team_workforce_data');
        }
        showToast('Export successful.', 'success');
    } catch (err: any) {
        showToast(`Export failed: ${err.message}`, 'error');
    } finally {
        setIsExporting(false);
    }
  };

  if (loading) return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} strokeWidth={3} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Establishing Team Connectivity...</p>
      </div>
  );

  return (
    <div id="manager-dashboard-content" className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Workforce Hub</h1>
            <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">Management</span>
          </div>
          <p className="text-slate-500 mt-3 text-lg font-medium">Strategic orchestration for the <span className="text-slate-900 font-bold">{profile?.department || 'Operations'}</span> sector.</p>
        </div>

        <div className="flex gap-4">
            <div className="flex bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button 
                    onClick={() => handleExportTeamReport('PDF')}
                    disabled={isExporting}
                    className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-900 hover:bg-slate-50 border-r border-slate-100 transition-all flex items-center gap-2"
                >
                    <FileText size={16} /> PDF
                </button>
                <button 
                    onClick={() => handleExportTeamReport('CSV')}
                    disabled={isExporting}
                    className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <Download size={16} /> CSV
                </button>
            </div>
            <button 
                onClick={() => setShowTaskModal(true)}
                className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            >
                <Plus size={16} strokeWidth={3} /> Assign Objective
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard title="Team Velocity" value={`${avgProductivity}%`} icon={TrendingUp} color="bg-indigo-600" trend="+14.2%" />
        <StatCard title="Resource Load" value={localMembers.filter((m: any) => m.workload === 'High' || m.workload === 'Critical').length} icon={Users} color="bg-slate-900" />
        <StatCard title="Approval Queue" value={pendingGoals.length} icon={ShieldCheck} color="bg-amber-500" />
        <StatCard title="Active Risks" value={criticalTasks.length} icon={AlertCircle} color="bg-red-600" />
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-12">
            <section className="space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Productivity</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tasks</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Load</th>
                                <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Auth</th>
                            </tr>
                        </thead>
                        <tbody>
                            {localMembers.map((member: any) => (
                                <tr key={member.uid} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedEmployee(member)}>
                                    <td className="py-5 px-6 font-black text-sm text-slate-900">{member.displayName}</td>
                                    <td className="py-5 px-6 font-bold text-slate-700">{member.productivityScore || 85}%</td>
                                    <td className="py-5 px-6 text-center text-slate-500">{localTasks.filter(t => t.userId === member.uid).length}</td>
                                    <td className="py-5 px-6 text-center">
                                        <span className="text-[10px] font-black uppercase text-slate-900">{member.workload || 'Moderate'}</span>
                                    </td>
                                    <td className="py-5 px-6 text-right">
                                        <div className={`w-2 h-2 rounded-full inline-block ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <AnimatePresence>
            {pendingGoals.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="space-y-6">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                            <ShieldCheck className="text-amber-600" size={20} />
                        </div>
                        Strategic Approvals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pendingGoals.map(goal => (
                            <ApprovalCard key={goal.id} goal={goal} onAction={(s) => handleGoalApproval(goal.id, s)} />
                        ))}
                    </div>
                </motion.section>
            )}
            </AnimatePresence>
        </div>

        <div className="col-span-12 lg:col-span-4">
            <section className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-8 shadow-2xl">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                    <Zap size={14} className="text-amber-500" /> Intelligence Insights
                </h3>
                <div className="space-y-6">
                    <p className="text-sm font-medium leading-relaxed">3 employees approaching <span className="text-amber-400 font-bold">workload risk</span> threshold.</p>
                    <p className="text-sm font-medium leading-relaxed">Team velocity increased by <span className="text-emerald-400 font-bold">14.2%</span>.</p>
                </div>
            </section>
        </div>
      </div>

      {showTaskModal && <TaskAssignmentModal members={localMembers} onClose={() => setShowTaskModal(false)} />}
    </div>
  );
};

const TaskAssignmentModal = ({ members, onClose }: any) => {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setIsSubmitting(true);
        showToast('Objective assigned to member.', 'success');
        setTimeout(() => onClose(), 500);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full shadow-2xl">
                <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Assign Objective</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <input required placeholder="Task signature..." className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
                    <select className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold appearance-none">
                        {members.map((m: any) => <option key={m.uid}>{m.displayName}</option>)}
                    </select>
                    <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Confirm Assignment</button>
                    <button type="button" onClick={onClose} className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
                </form>
            </div>
        </div>
    );
};
