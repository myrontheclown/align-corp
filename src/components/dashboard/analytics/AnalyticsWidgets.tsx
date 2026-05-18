import React from 'react';
import { Task, TaskSession } from '../../../types';
import { CheckCircle2, Clock, Zap, Target } from 'lucide-react';

interface AnalyticsWidgetsProps {
  tasks?: Task[];
  sessions?: TaskSession[];
}

export const AnalyticsWidgets: React.FC<AnalyticsWidgetsProps> = ({
  tasks = [],
  sessions = [],
}) => {
  const completedTasks = tasks.filter(
    t => t.status === 'Completed'
  );

  const totalFocusMinutes = sessions.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0
  );

  const focusHours = (
    totalFocusMinutes / 60
  ).toFixed(1);

  const avgTaskDuration =
    completedTasks.length > 0
      ? Math.round(
        completedTasks.reduce(
          (sum, t) =>
            sum + (t.actualDurationMinutes || 0),
          0
        ) / completedTasks.length
      )
      : 0;

  // Simplified productivity calculation
  const productivityScore =
    completedTasks.length * 10;

  const widgets = [
    {
      title: 'Tasks Completed',
      value: completedTasks.length,
      icon: CheckCircle2,
      color: 'bg-emerald-500',
    },
    {
      title: 'Focus Hours',
      value: focusHours,
      icon: Clock,
      color: 'bg-blue-500',
    },
    {
      title: 'Avg Duration (min)',
      value: avgTaskDuration,
      icon: Target,
      color: 'bg-indigo-500',
    },
    {
      title: 'Productivity Score',
      value: productivityScore,
      icon: Zap,
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {widgets.map((widget, idx) => (
        <div
          key={idx}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {widget.title}
            </p>

            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {widget.value}
            </p>
          </div>

          <div
            className={`p-3 rounded-xl ${widget.color}`}
          >
            <widget.icon
              size={20}
              className="text-white"
            />
          </div>
        </div>
      ))}
    </div>
  );
};