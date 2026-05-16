import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { usePerformanceData } from './hooks/usePerformanceData';
import { db, collection, addDoc, updateDoc, doc, Timestamp } from './lib/firebase';
import { trackSession } from './lib/db';
import { 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText, 
  Plus, 
  Shield, 
  ChevronRight, 
  LogOut, 
  BarChart3, 
  LayoutDashboard,
  Mail,
  Lock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal, Review, GoalStatus } from './types';

// --- Sub-components ---

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

const GoalCard: React.FC<{ goal: Goal, isManagerView?: boolean }> = ({ goal, isManagerView }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(goal.progress);

  const updateProgress = async () => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'goals', goal.id), { 
        progress,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const setStatus = async (status: GoalStatus) => {
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'goals', goal.id), { 
        status,
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusColors: Record<GoalStatus, string> = {
    draft: 'bg-amber-100 text-amber-600',
    active: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    archived: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
      {goal.status === 'draft' && (
         <div className="absolute top-0 right-0 left-0 h-1 bg-amber-400" />
      )}
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColors[goal.status]}`}>
            {goal.status}
          </span>
          <h4 className="text-base font-semibold text-gray-900 mt-2">{goal.title}</h4>
        </div>
        <Target size={18} className="text-slate-400" />
      </div>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">{goal.description}</p>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-400">Completion</span>
          <span className="text-slate-900">{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div 
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {!isManagerView && goal.status !== 'draft' && (
        <div className="mt-4 flex items-center gap-2">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress} 
            onChange={(e) => setProgress(Number(e.target.value))}
            className="flex-1 accent-indigo-600 h-1"
          />
          <button 
            onClick={updateProgress}
            disabled={isUpdating || progress === goal.progress}
            className="text-[10px] bg-slate-900 text-white px-2.5 py-1.5 rounded-md disabled:opacity-50 font-bold uppercase tracking-wider whitespace-nowrap"
          >
            {isUpdating ? '...' : 'Sync'}
          </button>
        </div>
      )}

      {isManagerView && goal.status === 'draft' && (
        <div className="mt-4 flex gap-2">
          <button 
            onClick={() => setStatus('active')}
            className="flex-1 text-[10px] bg-indigo-600 text-white py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors hover:bg-indigo-700"
          >
            Approve
          </button>
          <button 
            onClick={() => setStatus('archived')}
            className="flex-1 text-[10px] bg-slate-100 text-slate-600 py-1.5 rounded-md font-bold uppercase tracking-wider transition-colors hover:bg-slate-200"
          >
            Reject
          </button>
        </div>
      )}

      {goal.status === 'draft' && !isManagerView && (
        <p className="mt-4 text-[10px] font-bold text-amber-500 uppercase tracking-widest text-center">Awaiting manager approval</p>
      )}
    </div>
  );
};

// --- Pages ---

const LoginPage = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, profile, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && profile) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      // Role based redirection if not going to a specific from page
      if (from === '/dashboard' || from === '/') {
        if (profile.role === 'admin') navigate('/admin');
        else if (profile.role === 'manager') navigate('/manager');
        else navigate('/dashboard');
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, profile, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">Enterprise Goal Portal</h1>
          <p className="text-slate-400 text-sm font-medium">Sync Your Performance, Align Success.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required
                type="text" 
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              required
              type="email" 
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              required
              type="password" 
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 text-white py-3.5 px-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98] mt-2 shadow-lg shadow-slate-200"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <button 
          onClick={signInWithGoogle}
          className="w-full mt-6 bg-white border-2 border-slate-50 py-3.5 px-4 rounded-2xl font-semibold text-slate-700 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 font-bold hover:underline">
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      trackSession(profile.uid);
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
            { id: 'dashboard', path: '/dashboard', name: 'Overview', icon: LayoutDashboard },
            { id: 'goals', path: '/goals', name: 'My Goals', icon: Target },
            { id: 'reviews', path: '/reviews', name: 'Performance', icon: FileText },
            ...(profile?.role === 'manager' || profile?.role === 'admin' ? [{ id: 'reports', path: '/reports', name: 'Team Hub', icon: Users }] : []),
            ...(profile?.role === 'admin' ? [{ id: 'admin', path: '/admin', name: 'Administration', icon: Shield }] : [])
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

const OverviewPage = () => {
  const { profile } = useAuth();
  const { goals } = usePerformanceData();
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'Individual' });

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    // Validation Rules
    if (goals.length >= 8) {
      alert("Maximum 8 goals permitted per individual.");
      return;
    }

    const weightage = 20; // Default weightage for new goals
    const totalWeightage = goals.reduce((sum, g) => sum + (g.weightage || 0), 0) + weightage;

    try {
      await addDoc(collection(db, 'goals'), {
        ...newGoal,
        userId: profile.uid,
        managerId: profile.managerId || 'pending',
        status: 'draft', // New goals start as draft for approval
        progress: 0,
        weightage: weightage,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        targetDate: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
      });
      setShowGoalModal(false);
      setNewGoal({ title: '', description: '', category: 'Individual' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Focus on Excellence</h1>
          <p className="text-slate-500 mt-2 text-lg">Aligning your individual goals with enterprise success.</p>
        </div>
        <button 
          onClick={() => setShowGoalModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
        >
          <Plus size={18} /> New Objective
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Goals" value={goals.length} icon={Target} color="bg-slate-900" />
        <StatCard title="Avg Progress" value={`${Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / (goals.length || 1))}%`} icon={TrendingUp} color="bg-indigo-600" />
        <StatCard title="Completed" value={goals.filter(g => g.status === 'completed').length} icon={CheckCircle2} color="bg-emerald-500" />
        <StatCard title="Next Cycle" value="Q3 2026" icon={BarChart3} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="text-indigo-600" size={24} />
              Strategic Objectives
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.slice(0, 4).map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
            {goals.length === 0 && <div className="col-span-2 p-10 bg-white rounded-3xl border border-dashed text-slate-400 italic text-center">No objectives defined for current cycle.</div>}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Enterprise Feed</h2>
          <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6 shadow-sm">
            {[
              { text: 'Quarterly Town Hall - Q2 Highlights', type: 'Announcement' },
              { text: 'New Performance Framework deployed', type: 'System' },
              { text: 'Goal Cycle closing in 12 days', type: 'Deadline' },
            ].map((act, i) => (
              <div key={i} className="flex flex-col gap-1 border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                <span className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-widest">{act.type}</span>
                <p className="text-sm font-bold text-slate-700">{act.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">New Objective</h2>
            <p className="text-slate-400 text-sm mb-8 font-medium">Define clear, measurable outcomes for this cycle.</p>
            <form onSubmit={handleCreateGoal} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Title</label>
                <input 
                  required
                  type="text" 
                  value={newGoal.title}
                  onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="e.g. Scalable Infrastructure Audit"
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-300 font-medium" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest ml-1">Strategy</label>
                <textarea 
                  required
                  rows={4}
                  value={newGoal.description}
                  onChange={e => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="Outline the steps and expected impact..."
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-300 font-medium"
                ></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 px-6 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all active:scale-[0.98]"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                >
                  Launch Goal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AdminPage = () => (
  <div className="max-w-5xl mx-auto py-10">
    <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 text-center space-y-6">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
        <Shield size={40} />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter">Enterprise Administration</h1>
      <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">
        System-wide configuration, access control, and auditing tools for administrators.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10">
        {['User Directory', 'Platform Logs', 'Role Gating'].map(tool => (
          <div key={tool} className="p-6 bg-slate-50 rounded-2xl font-bold text-slate-700 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
            {tool}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ReportsPage = () => {
  const { reportsGoals } = usePerformanceData();
  return (
    <div className="max-w-5xl mx-auto space-y-10">
       <header>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Hub Management</h1>
        <p className="text-slate-500 mt-2 text-lg">Overseeing direct reports and alignment across departments.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        {reportsGoals.map(goal => (
          <div key={goal.id} className="relative group">
            <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[9px] font-black px-2 py-1.5 rounded-lg shadow-md z-10 uppercase tracking-widest">
              Direct Report
            </div>
            <GoalCard goal={goal} isManagerView={true} />
          </div>
        ))}
        {reportsGoals.length === 0 && <div className="col-span-2 p-20 bg-white rounded-[2rem] border border-dashed text-slate-400 italic text-center">No subordinate sync data available at this time.</div>}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout><OverviewPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/goals" element={
            <ProtectedRoute>
              <DashboardLayout><OverviewPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <DashboardLayout><ReportsPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <DashboardLayout><ReportsPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><AdminPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
              <Shield className="text-red-500 mb-4" size={64} />
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Access Denied</h1>
              <p className="text-slate-500 mt-4 max-w-md">Your security clearance does not permit entry to this sector. Contact your administrator if you believe this is an error.</p>
              <button onClick={() => window.history.back()} className="mt-8 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs">Return to Safety</button>
            </div>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
