import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, TrendingUp, TrendingDown, CheckCircle, Circle } from 'lucide-react';
import { Task } from '../../../types';

export const TaskCard: React.FC<{ 
  task: Task;
  onTimerStart?: (taskId: string) => void;
  onCompleteTask?: (taskId: string, status: Task['status']) => void;
}> = ({ task, onTimerStart, onCompleteTask }) => {
  const isOverdue = task.deadline && task.deadline.toDate() < new Date() && task.status !== 'Completed';
  const timeVariance = task.actualDurationMinutes - task.estimatedDurationMinutes;
  const isInefficient = timeVariance > 0;
  const isCompleted = task.status === 'Completed';

  const statusColors = {
    'Pending': 'bg-slate-100 text-slate-600',
    'In Progress': 'bg-blue-100 text-blue-600',
    'Review Needed': 'bg-amber-100 text-amber-600',
    'Completed': 'bg-green-100 text-green-600',
    'Blocked': 'bg-red-100 text-red-600'
  };

  const priorityColors = {
    'Low': 'text-slate-400',
    'Medium': 'text-blue-500',
    'High': 'text-amber-500',
    'Critical': 'text-red-500'
  };

  const toggleComplete = () => {
    onCompleteTask?.(task.id, isCompleted ? 'Pending' : 'Completed');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white p-5 rounded-xl border ${isOverdue ? 'border-red-200' : 'border-gray-100'} shadow-sm hover:shadow-md transition-all space-y-4 ${isCompleted ? 'opacity-60' : ''}`}
    >
      <div className="flex justify-between items-start gap-3">
        <button onClick={toggleComplete} className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-emerald-500 transition-colors">
            {isCompleted ? <CheckCircle size={20} className="text-emerald-500" /> : <Circle size={20} />}
        </button>
        <div className="flex-1">
            <h4 className={`text-sm font-semibold text-gray-900 ${isCompleted ? 'line-through text-slate-400' : ''}`}>{task.title}</h4>
            <p className="text-xs text-slate-500 line-clamp-2 mt-1">{task.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isOverdue && <AlertTriangle size={14} className="text-red-500" />}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColors[task.status]}`}>
            {task.status}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{task.estimatedDurationMinutes}m</span>
            {task.actualDurationMinutes > 0 && !isCompleted && (
              <span className={`flex items-center gap-0.5 ${isInefficient ? 'text-amber-600' : 'text-emerald-600'}`}>
                ({isInefficient ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                {Math.abs(timeVariance)}m)
              </span>
            )}
          </div>
          <div className={`font-bold ${priorityColors[task.priority]}`}>
            {task.priority}
          </div>
        </div>
        <div className="flex items-center gap-2">
            {!isCompleted && (
                <button 
                    onClick={() => onTimerStart?.(task.id)}
                    className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded"
                >
                    <Clock size={16} />
                </button>
            )}
        </div>
      </div>
    </motion.div>
  );
};
