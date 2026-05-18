import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Target, FileText, Users, Shield, LogOut, TrendingUp } from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { trackSession } from '../../lib/db';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      trackSession(profile.uid);
      // Track session every 5 minutes
      const interval = setInterval(() => trackSession(profile.uid), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-3 mb-4">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-md shadow-indigo-100">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight">Sync Portal</span>
        </div>

        <nav className="flex-1 px-5 space-y-1">
          {[
            { id: 'dashboard', path: `/${profile?.role}`, name: 'Dashboard Overview', icon: LayoutDashboard },
            ...(profile?.role === 'admin' ? [{ id: 'admin', path: '/admin', name: 'System Admin', icon: Shield }] : [])
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                window.location.pathname === item.path ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm text-indigo-600 flex items-center justify-center font-bold text-sm">
                {profile?.displayName?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-slate-900 leading-tight">{profile?.displayName}</p>
                <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest">{profile?.role}</p>
              </div>
            </div>
            <button onClick={logout} className="w-full py-2 bg-white text-red-500 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
