import React from 'react';
import { AuditLog } from '../../../types';
import { Target, CheckCircle2, Play, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityFeedProps {
  logs: AuditLog[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE_TASK': return <Target size={16} className="text-blue-500" />;
      case 'UPDATE_TASK': return <AlertCircle size={16} className="text-amber-500" />;
      case 'CREATE_TASK_SESSION': return <Play size={16} className="text-emerald-500" />;
      case 'COMPLETE_TASK': return <CheckCircle2 size={16} className="text-green-500" />;
      default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Activity Feed</h2>
      <div className="space-y-6">
        {logs.map(log => (
          <div key={log.id} className="flex gap-4">
            <div className="mt-1">{getActionIcon(log.action)}</div>
            <div>
              <p className="text-sm font-medium text-slate-900 capitalize">{log.action.replace('_', ' ').toLowerCase()}</p>
              <p className="text-xs text-slate-500">
                {format(log.createdAt.toDate(), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="text-xs text-slate-400 italic">No recent activity.</p>}
      </div>
    </div>
  );
};
