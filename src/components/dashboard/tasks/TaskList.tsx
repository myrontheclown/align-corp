import React from 'react';
import { Task, TaskStatus } from '../../../types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  status: TaskStatus;
  title: string;
  onTimerStart?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, status, title, onTimerStart, onCompleteTask }) => {
  const filteredTasks = tasks.filter(t => t.status === status);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title} ({filteredTasks.length})</h3>
      <div className="space-y-3">
        {filteredTasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onTimerStart={onTimerStart} 
            onCompleteTask={onCompleteTask}
          />
        ))}
        {filteredTasks.length === 0 && (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs italic">
            No {status.toLowerCase()} tasks.
          </div>
        )}
      </div>
    </div>
  );
};
