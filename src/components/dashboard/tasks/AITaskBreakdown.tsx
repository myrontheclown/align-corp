import React, { useState } from 'react';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { Subtask } from '../../../types';

interface AITaskBreakdownProps {
  taskTitle: string;
  onAddSubtasks: (subtasks: Subtask[]) => void;
}

export const AITaskBreakdown: React.FC<AITaskBreakdownProps> = ({ taskTitle, onAddSubtasks }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Mock AI recommendation logic
    setTimeout(() => {
      const mockSubtasks: Subtask[] = [
        { id: '1', title: `Research ${taskTitle} requirements`, completed: false },
        { id: '2', title: 'Draft initial plan', completed: false },
        { id: '3', title: 'Review with stakeholders', completed: false },
      ];
      onAddSubtasks(mockSubtasks);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl space-y-4">
      <div className="flex items-center gap-2 text-indigo-900">
        <Sparkles size={20} />
        <h3 className="text-sm font-bold">AI Task Assistant</h3>
      </div>
      <p className="text-xs text-indigo-700">Need help breaking down "{taskTitle}"? Let AI generate a structured plan for you.</p>
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
      >
        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Generate Subtasks</>}
      </button>
    </div>
  );
};
