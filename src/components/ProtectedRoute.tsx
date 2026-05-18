import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { UserRole } from '../types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading, persistedRole } = useAuth();
  const location = useLocation();

  // Determine effective role: prioritize live profile, fallback to localStorage
  const effectiveRole = profile?.role || persistedRole;

  console.log('[ProtectedRoute] Evaluation:', {
    path: location.pathname,
    loading,
    hasUser: !!user,
    hasProfile: !!profile,
    persistedRole,
    effectiveRole
  });

  // Show enterprise loader while authentication or profile synchronization is in progress
  if (loading || (user && !effectiveRole)) {
    console.log('[ProtectedRoute] Suspending rendering - established session or profile sync in progress...');
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Verifying Enterprise Credentials...</p>
      </div>
    );
  }

  // Redirect to login if no authenticated session exists
  if (!user) {
    console.log('[ProtectedRoute] No active session. Redirecting to /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Perform role-based authorization check
  if (allowedRoles) {
    if (!effectiveRole) {
      console.error('[ProtectedRoute] Authenticated but no enterprise role detected. Redirecting to login.');
      return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(effectiveRole)) {
      console.warn(`[ProtectedRoute] Silent correction: Role '${effectiveRole}' cannot access '${location.pathname}'. Redirecting to assigned dashboard.`);
      
      // Map role to correct dashboard for silent correction
      let correctionPath = '/login';
      if (effectiveRole === 'admin') correctionPath = '/admin';
      else if (effectiveRole === 'manager') correctionPath = '/manager';
      else if (effectiveRole === 'employee') correctionPath = '/employee';

      return <Navigate to={correctionPath} replace />;
    }
  }

  console.log('[ProtectedRoute] Access Granted.');
  return <>{children}</>;
};
