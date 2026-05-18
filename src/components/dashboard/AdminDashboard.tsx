import React, { useState, useEffect, useMemo } from 'react';
import { 
    Shield, Users, Activity, FileText, CheckCircle2, AlertCircle, 
    Clock, Search, Filter, MoreHorizontal, Zap, TrendingUp, 
    ArrowRight, Server, Lock, Globe, Database, Download, ExternalLink, ShieldCheck,
    CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { useAdminData } from '../../hooks/useAdminData';
import { useToast } from '../ToastProvider';
import { generateVisualPDF } from '../../lib/reportGenerator';
import { exportToCSV } from '../../lib/csvExport';
import { UserProfile, Goal, Task, AuditLog } from '../../types';
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

const UserRow: React.FC<{ user: any, onClick: () => void }> = ({ user, onClick }) => {
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
                        {user.displayName.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900">{user.displayName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
                    </div>
                </div>
            </td>
            <td className="py-5 px-6">
                <span className="text-[10px] font-black px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full uppercase tracking-widest">{user.role}</span>
            </td>
            <td className="py-5 px-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.department || 'General'}</p>
            </td>
            <td className="py-5 px-6">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-xs font-bold text-slate-500 capitalize">{user.status || 'Offline'}</span>
                </div>
            </td>
            <td className="py-5 px-6 text-right">
                <MoreHorizontal size={18} className="text-slate-300 inline-block" />
            </td>
        </tr>
    );
};

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const { allUsers, allGoals, allTasks, auditLogs, systemHealth, alerts, loading } = useAdminData();
  const { showToast } = useToast();

  const [localUsers, setLocalUsers] = useState<UserProfile[]>([]);
  const [localLogs, setLocalLogs] = useState<AuditLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => { if (allUsers) setLocalUsers(allUsers); }, [allUsers]);
  useEffect(() => { if (auditLogs) setLocalLogs(auditLogs); }, [auditLogs]);

  const handleExportGovernance = async (format: 'PDF' | 'CSV') => {
    setIsExporting(true);
    showToast(`Archiving governance data as ${format}...`, 'info');
    try {
        if (format === 'PDF') {
            await generateVisualPDF({
                elementId: 'admin-dashboard-content',
                filename: 'system_governance_audit',
                title: 'Global Security & Workforce Governance Audit'
            });
        } else {
            exportToCSV(localLogs.map(l => ({
                Action: l.action,
                Actor: l.userName,
                Resource: l.resourceType,
                Severity: l.severity,
                Timestamp: l.createdAt.toDate().toISOString()
            })), 'security_governance_audit');
        }
        showToast('Governance report exported successfully.', 'success');
    } catch (err: any) {
        showToast(`Export failed: ${err.message}`, 'error');
    } finally {
        setIsExporting(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} strokeWidth={3} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Establishing Command Center...</p>
    </div>
  );

  return (
    <div id="admin-dashboard-content" className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Command Center</h1>
            <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">Global Admin</span>
          </div>
          <p className="text-slate-500 mt-3 text-lg font-medium">Real-time infrastructure telemetry and <span className="text-indigo-600 font-bold">workforce governance</span>.</p>
        </div>

        <div className="flex gap-4">
            <div className="flex bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <button 
                    onClick={() => handleExportGovernance('PDF')}
                    disabled={isExporting}
                    className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-900 hover:bg-slate-50 border-r border-slate-100 transition-all flex items-center gap-2"
                >
                    <FileText size={16} /> PDF
                </button>
                <button 
                    onClick={() => handleExportGovernance('CSV')}
                    disabled={isExporting}
                    className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <Download size={16} /> CSV
                </button>
            </div>
            <Link to="/admin/calendar" className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl">
                <CalendarDays size={16} /> Global Calendar
            </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard title="Total Workforce" value={localUsers.length} icon={Users} color="bg-indigo-600" trend="+2.4%" />
        <StatCard title="Active Traffic" value={systemHealth?.activeTraffic || 0} icon={Activity} color="bg-emerald-500" />
        <StatCard title="Security Alerts" value={alerts.filter((a: any) => a.severity === 'critical').length} icon={Shield} color="bg-red-600" />
        <StatCard title="Audit Events" value={localLogs.length} icon={FileText} color="bg-slate-900" />
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-12 lg:col-span-8 space-y-12">
            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dept</th>
                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {localUsers.map((user: any) => (
                            <UserRow key={user.uid} user={user} onClick={() => setSelectedUser(user)} />
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor</th>
                            <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Severity</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {localLogs.slice(0, 10).map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-6 font-bold text-slate-900">{log.action}</td>
                                <td className="py-4 px-6 text-slate-500 font-medium">{log.userName}</td>
                                <td className="py-4 px-6 text-right">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                        log.severity === 'critical' ? 'bg-red-100 text-red-600' : 
                                        log.severity === 'high' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {log.severity}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>

        <div className="col-span-12 lg:col-span-4">
            <section className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-10 shadow-2xl">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                    <Server size={14} className="text-indigo-400" /> Infrastructure Health
                </h3>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">API Availability</span>
                            <span className="text-xs font-black text-emerald-400">{systemHealth?.apiUptime}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${systemHealth?.apiUptime}%` }} />
                        </div>
                    </div>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className, size, strokeWidth }: any) => <Clock className={`${className} animate-spin`} size={size} />;
