import React, { useState } from 'react';
import {
    Shield,
    Users,
    Activity,
    FileText,
    CheckCircle2,
    AlertCircle,
    Clock,
    Search,
    Filter,
    MoreHorizontal,
    Zap,
    TrendingUp,
    ArrowRight,
    Server,
    Lock,
    Globe,
    Database,
    Download,
    ExternalLink,
    ShieldCheck,
    CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { useAdminData } from '../../hooks/useAdminData';
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
            <td className="py-5 px-6">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${workloadColors[user.workload as keyof typeof workloadColors] || 'bg-slate-300'}`} />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{user.workload || 'N/A'}</span>
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
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={48} strokeWidth={3} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Establishing Command Center Connectivity...</p>
        </div>
    );

    const activeSessionsCount = allUsers.filter(u => u.status === 'online').length;
    const criticalAudit = auditLogs.filter(l => l.severity === 'critical' || l.severity === 'high');

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            <header className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                            Command Center
                        </h1>
                        <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-slate-200">Global Admin</span>
                    </div>
                    <p className="text-slate-500 mt-3 text-lg font-medium">
                        Real-time infrastructure telemetry and <span className="text-indigo-600 font-bold">workforce governance</span>.
                    </p>
                </div>

                <div className="flex gap-4">
                    <Link to="/admin/calendar" className="bg-white text-slate-900 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-slate-100 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                        <CalendarDays size={16} /> Global Calendar
                    </Link>
                    <button className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                        <Download size={16} /> Export Reports
                    </button>
                </div>
            </header>

            {/* Global Intelligence Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard title="Platform Workforce" value={allUsers.length} subtext="Registered Enterprise Users" icon={Users} color="bg-indigo-600" trend="+2.4%" />
                <StatCard title="Active Traffic" value={systemHealth?.activeTraffic || 0} subtext="Concurrent Sessions" icon={Activity} color="bg-emerald-500" />
                <StatCard title="Security Alerts" value={alerts.filter(a => a.severity === 'critical').length} subtext="Critical Vulnerabilities" icon={Shield} color="bg-red-600" />
                <StatCard title="Audit Throughput" value={auditLogs.length} subtext="Events in 24h Window" icon={FileText} color="bg-slate-900" />
            </div>

            <div className="grid grid-cols-12 gap-10">
                <div className="col-span-12 lg:col-span-8 space-y-12">
                    {/* User Directory */}
                    <section className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                    <Users className="text-indigo-600" size={20} />
                                </div>
                                Enterprise Directory
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input type="text" placeholder="Search directory..." className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-1 focus:ring-indigo-600" />
                                </div>
                                <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"><Filter size={18} /></button>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dept</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Load</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map((user: any) => (
                                        <UserRow key={user.uid} user={user} onClick={() => setSelectedUser(user)} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Audit Governance */}
                    <section className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                                    <Shield className="text-white" size={20} />
                                </div>
                                Security Governance
                            </h2>
                        </div>
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actor</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity</th>
                                        <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {auditLogs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-900">{log.action}</td>
                                            <td className="py-4 px-6 text-slate-500 font-medium">{log.userName}</td>
                                            <td className="py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-tighter">{log.resourceType}</td>
                                            <td className="py-4 px-6">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${log.severity === 'critical' ? 'bg-red-100 text-red-600' :
                                                        log.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                                                            log.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {log.severity}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right text-[10px] font-bold text-slate-400">
                                                {new Date(log.createdAt.toDate()).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-12">
                    {/* System Health Telemetry */}
                    <section className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-10 shadow-2xl shadow-slate-200 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2 relative z-10">
                            <Server size={14} className="text-indigo-400" /> Infrastructure Health
                        </h3>

                        <div className="space-y-8 relative z-10">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API Availability</span>
                                    <span className="text-sm font-black text-emerald-400">{systemHealth?.apiUptime}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${systemHealth?.apiUptime}%` }} className="h-full bg-emerald-500" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DB Latency</span>
                                    <span className="text-sm font-black text-indigo-400">{systemHealth?.dbLatency}ms</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="h-full bg-indigo-500" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Storage Utilization</span>
                                    <span className="text-sm font-black text-amber-400">{systemHealth?.storageUsage}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${systemHealth?.storageUsage}%` }} className="h-full bg-amber-500" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Processing</p>
                                <p className="text-lg font-black">{systemHealth?.processingRate}/s</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Sync Status</p>
                                <p className="text-lg font-black text-emerald-400">{systemHealth?.syncHealth}</p>
                            </div>
                        </div>

                        <button className="w-full py-4 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 relative z-10">System Diagnostics</button>
                    </section>

                    {/* AI Global Insights */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Zap className="text-indigo-600" size={16} />
                            </div>
                            Workforce Intelligence
                        </h2>
                        <div className="space-y-4">
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                    <TrendingUp size={14} /> Productivity Trend
                                </div>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">Platform-wide output has increased by <span className="text-slate-900 font-bold">18.5%</span> across the Engineering and Infrastructure sectors.</p>
                            </div>
                            <div className="p-6 bg-white border border-slate-100 rounded-3xl space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                    <AlertCircle size={14} /> Workforce Risk
                                </div>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">Detected <span className="text-slate-900 font-bold">4 potential anomalies</span> in weekend access patterns. Recommend auditing remote sessions.</p>
                            </div>
                        </div>
                    </section>

                    {/* Enterprise Alert Center */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                                <AlertCircle className="text-red-600" size={16} />
                            </div>
                            Alert Center
                        </h2>
                        <div className="space-y-4">
                            {alerts.map((alert: any) => (
                                <div key={alert.id} className={`p-5 rounded-3xl border ${alert.severity === 'critical' ? 'bg-red-50 border-red-100' :
                                        alert.severity === 'medium' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
                                    }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${alert.severity === 'critical' ? 'text-red-600' :
                                                alert.severity === 'medium' ? 'text-amber-600' : 'text-slate-400'
                                            }`}>{alert.type}</span>
                                        <span className="text-[9px] font-bold text-slate-400">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900">{alert.message}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* User Detail Drawer */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-[60] flex justify-end">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto p-12">
                            <button onClick={() => setSelectedUser(null)} className="absolute top-10 right-10 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"><MoreHorizontal size={24} /></button>

                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-200">
                                    {selectedUser.displayName.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900">{selectedUser.displayName}</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{selectedUser.department} • {selectedUser.role}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-12">
                                <div className="p-6 bg-slate-50 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workload</p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">{selectedUser.workload || 'Moderate'}</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-3xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Productivity</p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">{selectedUser.productivityScore || 85}%</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <ShieldCheck className="text-indigo-600" size={24} />
                                    Governance Actions
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Modify Role</button>
                                    <button className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Reset Security</button>
                                    <button className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Audit History</button>
                                    <button className="py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest text-[10px]">Deactivate User</button>
                                </div>
                            </div>

                            <div className="mt-12 space-y-8">
                                <h4 className="text-xl font-black text-slate-900">Recent Audit Events</h4>
                                <div className="space-y-4">
                                    {auditLogs.filter(l => l.userName === selectedUser.displayName).map(log => (
                                        <div key={log.id} className="p-5 border border-slate-100 rounded-2xl">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-sm font-bold text-slate-900">{log.action}</p>
                                                <span className="text-[9px] font-bold text-slate-400">{new Date(log.createdAt.toDate()).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-400">{log.detail || 'Standard operational event.'}</p>
                                        </div>
                                    ))}
                                    {auditLogs.filter(l => l.userName === selectedUser.displayName).length === 0 && (
                                        <p className="text-slate-400 italic text-sm">No recent audit events for this user.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Loader2 = ({ className, size, strokeWidth }: any) => <Clock className={`${className} animate-spin`} size={size} />;
