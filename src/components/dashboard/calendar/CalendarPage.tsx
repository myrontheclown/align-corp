import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Calendar as CalendarIcon, Clock, X, AlertCircle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Task, Goal } from '../../../types';

const localizer = momentLocalizer(moment);

interface CalendarPageProps {
  tasks: Task[];
  goals: Goal[];
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ tasks, goals }) => {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const safeTasks = tasks || [];
  const safeGoals = goals || [];

  const events = [
    ...safeTasks.filter(t => t.deadline).map(t => ({
      ...t,
      title: t.title,
      start: t.deadline!.toDate(),
      end: t.deadline!.toDate(),
      allDay: true,
      type: 'task'
    })),
    ...safeGoals.filter(g => g.targetDate).map(g => ({
      ...g,
      title: g.title,
      start: g.targetDate!.toDate(),
      end: g.targetDate!.toDate(),
      allDay: true,
      type: 'goal'
    }))
  ];

  const eventPropGetter = (event: any) => {
    let backgroundColor = 'bg-slate-500';
    let borderLeft = 'border-l-4 border-l-slate-700';
    
    if (event.type === 'task') {
      const isOverdue = event.status !== 'Completed' && event.deadline.toDate() < new Date();
      
      if (event.status === 'Completed') {
        backgroundColor = 'bg-emerald-500/10 text-emerald-700';
        borderLeft = 'border-l-4 border-l-emerald-500';
      } else if (event.status === 'In Progress') {
        backgroundColor = 'bg-blue-500/10 text-blue-700';
        borderLeft = 'border-l-4 border-l-blue-500';
      } else if (event.status === 'Blocked') {
        backgroundColor = 'bg-red-500/10 text-red-700';
        borderLeft = 'border-l-4 border-l-red-500';
      } else if (isOverdue) {
        backgroundColor = 'bg-red-600/10 text-red-600';
        borderLeft = 'border-l-4 border-l-red-600';
      } else {
        backgroundColor = 'bg-amber-500/10 text-amber-700';
        borderLeft = 'border-l-4 border-l-amber-500';
      }
    } else {
        backgroundColor = 'bg-indigo-600/10 text-indigo-700';
        borderLeft = 'border-l-4 border-l-indigo-600';
    }
    
    return { 
        className: `${backgroundColor} ${borderLeft} rounded-md text-[10px] font-bold px-2 py-1 shadow-sm border-y-0 border-r-0` 
    };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Productivity Calendar</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Unified landscape of your strategic objectives and daily commitments.</p>
        </div>
        <div className="flex gap-4">
            <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">Focus Mode</button>
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Add Objective</button>
        </div>
      </header>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden h-[850px] relative">
        <style>{`
          .rbc-calendar { font-family: inherit; }
          .rbc-header { padding: 15px; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em; color: #94a3b8; border-bottom: 2px solid #f1f5f9 !important; }
          .rbc-month-view { border: none !important; }
          .rbc-day-bg { border-left: 1px solid #f8fafc !important; }
          .rbc-month-row { border-top: 1px solid #f8fafc !important; border-bottom: none !important; }
          .rbc-today { background-color: #f5f3ff !important; }
          .rbc-off-range-bg { background-color: #fafafa !important; }
          .rbc-event { padding: 0 !important; margin: 2px 5px !important; }
          .rbc-show-more { font-weight: 800; color: #6366f1; font-size: 10px; }
          .rbc-toolbar button { border-radius: 12px !important; border: 1px solid #f1f5f9 !important; font-weight: 700 !important; text-transform: uppercase !important; font-size: 10px !important; letter-spacing: 0.05em !important; padding: 8px 16px !important; color: #64748b !important; }
          .rbc-toolbar button:hover { background-color: #f8fafc !important; }
          .rbc-toolbar button.rbc-active { background-color: #0f172a !important; color: white !important; border-color: #0f172a !important; }
        `}</style>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventPropGetter}
          onSelectEvent={(e) => setSelectedEvent(e)}
          views={['month', 'week', 'day', 'agenda']}
        />
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {selectedEvent.type === 'goal' && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />}
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedEvent.type === 'task' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {selectedEvent.type}
                        </span>
                        <button onClick={() => setSelectedEvent(null)} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={24}/></button>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 pr-8 leading-tight">{selectedEvent.title}</h3>
                    <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed">{selectedEvent.description || 'No detailed description provided for this enterprise record.'}</p>
                    
                    <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <CalendarIcon size={18}/>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</p>
                                <p className="text-sm font-bold text-slate-900">{moment(selectedEvent.start).format('MMMM Do, YYYY')}</p>
                            </div>
                        </div>

                        {selectedEvent.type === 'task' && (
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Clock size={18}/>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status & Priority</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-sm font-bold text-slate-900">{selectedEvent.status}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className={`text-sm font-bold ${selectedEvent.priority === 'Critical' ? 'text-red-600' : 'text-slate-900'}`}>{selectedEvent.priority} Priority</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedEvent.type === 'goal' && (
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Target size={18}/>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-end mb-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Goal Progress</p>
                                        <p className="text-sm font-black text-indigo-600">{selectedEvent.progress}%</p>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${selectedEvent.progress}%` }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Open Details</button>
                        <button className="px-5 py-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all"><MoreHorizontal size={20}/></button>
                    </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
