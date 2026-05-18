import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Target, FileText, Users, Shield, LogOut, 
    TrendingUp, Calendar, Download, ChevronRight, Menu, X, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthProvider';
import { trackSession } from '../../lib/db';

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (profile) {
      trackSession(profile.uid);
      const interval = setInterval(() => trackSession(profile.uid), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [profile]);

  const navItems = [
    { id: 'dashboard', path: `/${profile?.role}`, name: 'Operations Hub', icon: LayoutDashboard },
    ...(profile?.role === 'employee' ? [{ id: 'calendar', path: '/employee/calendar', name: 'Focus Calendar', icon: Calendar }] : []),
    ...(profile?.role === 'manager' ? [{ id: 'calendar', path: '/manager/calendar', name: 'Team Calendar', icon: Calendar }] : []),
    ...(profile?.role === 'admin' ? [
        { id: 'admin', path: '/admin', name: 'System Admin', icon: Shield },
        { id: 'admin-calendar', path: '/admin/calendar', name: 'Global Calendar', icon: Calendar }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`w-72 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-50 transition-all duration-300 ${!isSidebarOpen ? '-ml-72' : ''}`}>
        <div className="p-8 flex items-center gap-3 mb-4">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-100">
            <TrendingUp size={22} className="text-white" />
          </div>
          <span className="font-black text-slate-900 tracking-tighter uppercase text-xs">Align Enterprise</span>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
                <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
                    isActive 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' 
                    : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
                >
                <item.icon size={20} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                <span className="flex-1 text-left">{item.name}</span>
                {isActive && <ChevronRight size={14} className="opacity-60" />}
                </button>
            );
          })}

          <div className="pt-10">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 px-4">Organization</p>
              <button className="w-full flex items-center gap-3.5 px-4 py-3 text-slate-400 font-bold text-sm hover:text-indigo-600 transition-colors">
                  <Bell size={18} /> Notifications
              </button>
              <button className="w-full flex items-center gap-3.5 px-4 py-3 text-slate-400 font-bold text-sm hover:text-indigo-600 transition-colors">
                  <FileText size={18} /> Documentation
              </button>
          </div>
        </nav>

        <div className="p-6">
          <div className="bg-slate-900 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group cursor-pointer" onClick={logout}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-white text-xs">
                {profile?.displayName?.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black truncate text-white leading-tight">{profile?.displayName}</p>
                <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mt-1">{profile?.role}</p>
              </div>
            </div>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all relative z-10">
                Authorize Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-10 shrink-0">
              <div className="flex items-center gap-4">
                  <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                      {isSidebarOpen ? <Menu size={20} /> : <X size={20} />}
                  </button>
                  <div className="h-4 w-px bg-slate-100 mx-2" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Global Sector Access</span>
              </div>
              <div className="flex items-center gap-6">
                  <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {String.fromCharCode(64 + i)}
                          </div>
                      ))}
                  </div>
                  <button className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-colors">
                      <Bell size={20} />
                  </button>
              </div>
          </header>
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {children}
                  </motion.div>
              </AnimatePresence>
          </div>
      </main>
    </div>
  );
};
