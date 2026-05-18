import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { auth } from './lib/firebase';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { CalendarPage } from './components/dashboard/calendar/CalendarPage';
import { ManagerDashboard } from './components/dashboard/ManagerDashboard';
import { ManagerCalendarPage } from './components/dashboard/calendar/ManagerCalendarPage';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { AdminCalendarPage } from './components/dashboard/calendar/AdminCalendarPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
 import { useTasks } from './hooks/useTasks';
import { usePerformanceData } from './hooks/usePerformanceData';
import {
  TrendingUp,
  Users,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Shield,
  Target
} from 'lucide-react';

import { ToastProvider } from './components/ToastProvider';

// --- Auth Components ---

const RoleRedirect = () => {
  const { profile, loading, user } = useAuth();

  // Use ONLY live profile role
  const effectiveRole = profile?.role;

  // Strict check: wait for complete user context if authenticated
  if (loading || (user && !effectiveRole)) {
    console.log('[Auth] RoleRedirect: Establishing enterprise identity context...');
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Establishing Secure Enterprise Session...</p>
      </div>
    );
  }

  // Redirect to login if unauthenticated
  if (!user) {
    console.log('[Auth] RoleRedirect: Session not found. Routing to /login');
    return <Navigate to="/login" replace />;
  }

  // Handle missing enterprise profile configuration
  if (!effectiveRole) {
    console.error('[Auth] RoleRedirect: Configuration mismatch - No enterprise role assigned to:', user.email);
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h1 className="text-2xl font-bold text-slate-900">Identity Configuration Error</h1>
        <p className="text-slate-500 mt-2 max-w-md">Successfully verified as <strong>{user.email}</strong>, but no workforce role has been assigned to your profile in the directory.</p>
        <div className="flex gap-4 mt-8">
          <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 transition-all">Retry Sync</button>
          <button onClick={() => auth.signOut()} className="bg-white border border-slate-200 text-slate-600 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all">Sign Out</button>
        </div>
      </div>
    );
  }

  console.log('[Auth] RoleRedirect: Identity established.', { email: user.email, role: effectiveRole });

  // Simplified: Default dashboard path based on role (Silent Correction)
  let targetPath = '/login';
  if (effectiveRole === 'admin') targetPath = '/admin';
  else if (effectiveRole === 'manager') targetPath = '/manager';
  else if (effectiveRole === 'employee') targetPath = '/employee';

  console.log('[Auth] RoleRedirect: Routing to dashboard:', targetPath);
  return <Navigate to={targetPath} replace />;
};

const DemoLoginCard = ({ role, description, icon: Icon, onClick }: { role: string, description: string, icon: any, onClick: () => void }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all group text-center"
  >
    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors mb-3">
      <Icon size={20} className="text-slate-400 group-hover:text-indigo-600" />
    </div>
    <h4 className="text-sm font-bold text-slate-900 mb-1">{role}</h4>
    <p className="text-[10px] text-slate-400 font-medium">{description}</p>
  </button>
);

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
    // Determine effective role: ONLY prioritize live profile
    const effectiveRole = profile?.role;

    // Only navigate when both Auth and Role context are fully established
    if (user && effectiveRole) {
      console.log('[Login] Enterprise session synchronized.', { email: user.email, role: effectiveRole });

      const from = (location.state as any)?.from?.pathname;
      if (from && from !== '/' && from !== '/login') {
        console.log(`[Login] Resuming intended session at: ${from}`);
        navigate(from, { replace: true });
        return;
      }

      // Silent correction for dashboards
      let targetPath = '/login';
      if (effectiveRole === 'admin') targetPath = '/admin';
      else if (effectiveRole === 'manager') targetPath = '/manager';
      else if (effectiveRole === 'employee') targetPath = '/employee';

      console.log('[Login] Routing to assigned sector:', targetPath);
      navigate(targetPath, { replace: true });
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

  const handleDemoLogin = async (email: string) => {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, '123456');
    } catch (err: any) {
      setError(err.message || 'Demo authentication failed');
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

        <div className="mt-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Demo Access</p>
          <div className="grid grid-cols-3 gap-3">
            <DemoLoginCard
              role="Employee"
              description="Track goals"
              icon={Target}
              onClick={() => handleDemoLogin('employee@test.com')}
            />
            <DemoLoginCard
              role="Manager"
              description="Review goals"
              icon={Users}
              onClick={() => handleDemoLogin('manager@test.com')}
            />
            <DemoLoginCard
              role="Admin"
              description="Monitor logs"
              icon={Shield}
              onClick={() => handleDemoLogin('admin@test.com')}
            />
          </div>
        </div>

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

// --- Main App ---
// Container to inject data to Calendar
const CalendarContainer = () => {
  const { tasks } = useTasks();
  const { goals } = usePerformanceData();
  return <CalendarPage tasks={tasks || []} goals={goals || []} />;
};
export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />




          <Route path="/employee" element={
            <ProtectedRoute allowedRoles={['employee']}>
              <DashboardLayout><EmployeeDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/employee/calendar" element={
            <ProtectedRoute allowedRoles={['employee']}>
              <DashboardLayout><CalendarContainer /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <DashboardLayout><ManagerDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/manager/calendar" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <DashboardLayout><ManagerCalendarPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><AdminDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/calendar" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout><AdminCalendarPage /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  </ToastProvider>
  );
}
