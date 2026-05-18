import React, { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { Task } from '../../../types';
import { useAuth } from '../../AuthProvider';
import { createTaskSession } from '../../../lib/db';

interface TaskTimerProps {
  task: Task;
}

export const TaskTimer: React.FC<TaskTimerProps> = ({ task }) => {
  const { profile } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = async () => {
    if (!profile) return;

    if (isActive) {
      // Stop
      setIsActive(false);
      const durationMinutes = Math.round(seconds / 60);
      await createTaskSession(profile, {
        taskId: task.id,
        userId: profile.uid,
        durationMinutes: durationMinutes,
      });
      setSeconds(0);
      setStartTime(null);
    } else {
      // Start
      setStartTime(new Date());
      setIsActive(true);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
      <div className={`font-mono text-sm ${isActive ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
        {formatTime(seconds)}
      </div>
      <button
        onClick={toggleTimer}
        className={`p-2 rounded-lg transition-all ${
          isActive 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
        }`}
      >
        {isActive ? <Square size={16} /> : <Play size={16} />}
      </button>
    </div>
  );
};
