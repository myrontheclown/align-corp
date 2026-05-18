import React from 'react';
import { Shield, Users, Activity, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { usePerformanceData } from '../../hooks/usePerformanceData';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

export const AdminDashboard = () => {
  const { allUsers = [], auditLogs = [], activeSessions = [] } = usePerformanceData() as any;

  const safeUsers = allUsers || [];
  const safeLogs = auditLogs || [];
  const safeSessions = activeSessions || [];

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <header>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter flex items-center gap-3">
          <Shield className="text-indigo-600" size={36} />
          Enterprise Administration
        </h1>
        <p className="text-slate-500 mt-2 text-lg">System-wide configuration, access control, and platform auditing.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Workforce" value={safeUsers.length} icon={Users} color="bg-slate-900" />
        <StatCard title="Active Sessions" value={safeSessions.length} icon={Activity} color="bg-indigo-600" />
        <StatCard title="Audit Events" value={safeLogs.length} icon={FileText} color="bg-emerald-500" />
        <StatCard title="System Health" value="Stable" icon={CheckCircle2} color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management Table */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">User Directory</h2>
            <button className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Active</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {safeUsers.slice(0, 10).map((user: any) => (
                  <tr key={user.uid} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{user.displayName}</td>
                    <td className="px-6 py-4 uppercase text-[10px] font-black text-indigo-500">{user.role}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${user.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="capitalize text-xs font-medium text-slate-500">{user.status || 'Offline'}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {user.lastActive ? new Date(user.lastActive.seconds * 1000).toLocaleTimeString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Security Audit Logs</h2>
            <button className="text-xs font-bold text-indigo-600 uppercase tracking-widest hover:underline">Export CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Resource</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {safeLogs.slice(0, 10).map((log: any) => (
                  <tr key={log.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{log.action}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{log.userName}</td>
                    <td className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">{log.resourceType}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
                {safeLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">No audit logs available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
