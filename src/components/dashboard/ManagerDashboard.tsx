import React, { useState } from 'react';
import { Target, Users, CheckCircle2, AlertCircle, Loader2, MessageSquare, Edit3 } from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { usePerformanceData } from '../../hooks/usePerformanceData';
import { Goal, GoalStatus } from '../../types';
import { updateGoalWithLog } from '../../lib/db';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const ApprovalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
  const { profile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [comments, setComments] = useState(goal.managerComments || '');
  const [editMode, setEditMode] = useState(false);
  const [editedWeightage, setEditedWeightage] = useState(goal.weightage);

  const handleAction = async (status: GoalStatus) => {
    if (!profile) return;
    setIsUpdating(true);
    try {
      await updateGoalWithLog(profile, goal.id, { 
        status, 
        managerComments: comments,
        weightage: editedWeightage,
        isLocked: status === 'active'
      }, goal);
      setEditMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnlock = async () => {
    if (!profile || profile.role !== 'admin') return;
    setIsUpdating(true);
    try {
      await updateGoalWithLog(profile, goal.id, { 
        status: 'draft',
        isLocked: false
      }, goal);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const isPending = goal.status === 'draft' || goal.status === 'pending';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isPending ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
          }`}>
            {isPending ? 'Pending Approval' : 'Approved & Active'}
          </span>
          <h4 className="text-lg font-bold text-slate-900 mt-2">{goal.title}</h4>
          <p className="text-sm text-slate-500 mt-1">{goal.description}</p>
        </div>
        {goal.isLocked && profile?.role === 'admin' && (
          <button 
            onClick={handleUnlock}
            disabled={isUpdating}
            className="text-[10px] font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-all uppercase tracking-widest"
          >
            {isUpdating ? '...' : 'Unlock Goal'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 py-2 border-y border-slate-50">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Weightage</label>
          {editMode ? (
            <input 
              type="number" 
              value={editedWeightage}
              onChange={e => setEditedWeightage(Number(e.target.value))}
              className="w-20 px-2 py-1 bg-slate-50 border-none rounded text-sm font-bold focus:ring-1 focus:ring-indigo-600"
            />
          ) : (
            <span className="text-sm font-bold text-slate-700">{goal.weightage}%</span>
          )}
        </div>
        {!goal.isLocked && (
          <button onClick={() => setEditMode(!editMode)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors">
            <Edit3 size={16} />
          </button>
        )}
      </div>

      {isPending && (
        <>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare size={12} /> Manager Feedback
            </label>
            <textarea 
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Add guidance or requirements for this goal..."
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-300 min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => handleAction('active')}
              disabled={isUpdating}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              {isUpdating ? <Loader2 className="animate-spin" size={14} /> : 'Approve & Lock'}
            </button>
            <button 
              onClick={() => handleAction('archived')}
              disabled={isUpdating}
              className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
            >
              Reject
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const ManagerDashboard = () => {
  const { profile } = useAuth();
  const { reportsGoals = [] } = usePerformanceData() as any;
  const safeReportsGoals = reportsGoals || [];
  const pendingGoals = safeReportsGoals.filter((g: any) => g.status === 'draft' || g.status === 'pending');
  const activeGoals = safeReportsGoals.filter((g: any) => g.status === 'active' || g.status === 'completed');

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header>
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {profile?.role === 'admin' ? 'Organization Hub' : 'Hub Management'}
          </h1>
          {profile?.role === 'admin' && (
            <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest">Admin Oversight</span>
          )}
        </div>
        <p className="text-slate-500 mt-2 text-lg">
          {profile?.role === 'admin' ? 'Monitoring organization-wide performance and goal alignment.' : 'Overseeing direct reports and alignment across departments.'}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Reports" value="12" icon={Users} color="bg-slate-900" />
        <StatCard title="Pending Approvals" value={pendingGoals.length} icon={AlertCircle} color="bg-amber-500" />
        <StatCard title="Team Completion" value="68%" icon={CheckCircle2} color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="text-amber-500" size={24} />
            Approval Queue
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {pendingGoals.map(goal => (
              <ApprovalCard key={goal.id} goal={goal} />
            ))}
            {pendingGoals.length === 0 && (
              <div className="p-10 bg-white rounded-3xl border border-dashed text-slate-400 italic text-center">
                Your approval queue is empty. Good job!
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="text-indigo-600" size={24} />
            Recent Activity
          </h2>
          <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4">
            {activeGoals.slice(0, 5).map(goal => (
              <div key={goal.id} className="flex items-center gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{goal.title}</p>
                  <p className="text-[10px] text-slate-400 font-medium">Status updated to {goal.status}</p>
                </div>
              </div>
            ))}
            {activeGoals.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center">No recent goal activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
