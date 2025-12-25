import React, { useState } from 'react';
import { Task, Priority } from '../types';
import { CheckCircle2, Circle, Trash2, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';
import { geminiService } from '../services/geminiService';

interface TaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate, onDelete }) => {
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleComplete = () => {
    onUpdate({ ...task, isCompleted: !task.isCompleted });
  };

  const togglePriority = (e: React.MouseEvent) => {
    e.stopPropagation();
    const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH];
    const currentIndex = priorities.indexOf(task.priority);
    const nextPriority = priorities[(currentIndex + 1) % priorities.length];
    onUpdate({ ...task, priority: nextPriority });
  };

  const handleBreakdown = async () => {
    if (task.subtasks && task.subtasks.length > 0) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsBreakingDown(true);
    try {
      const subtaskTitles = await geminiService.breakDownTask(task.title);
      const newSubtasks: Task[] = subtaskTitles.map(title => ({
        id: crypto.randomUUID(),
        title,
        isCompleted: false,
        priority: Priority.MEDIUM,
        createdAt: Date.now()
      }));
      
      onUpdate({ ...task, subtasks: newSubtasks });
      setIsExpanded(true);
    } finally {
      setIsBreakingDown(false);
    }
  };

  const toggleSubtask = (subtaskId: string) => {
    if (!task.subtasks) return;
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const priorityColors = {
    [Priority.HIGH]: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100',
    [Priority.MEDIUM]: 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    [Priority.LOW]: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100',
  };

  return (
    <div className={`group border rounded-xl p-4 transition-all duration-200 ${task.isCompleted ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
      <div className="flex items-start gap-4">
        <button 
          onClick={toggleComplete}
          className={`mt-1 flex-shrink-0 transition-colors ${task.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
        >
          {task.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-lg font-medium truncate ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            <button
              onClick={togglePriority}
              className={`px-2 py-0.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${priorityColors[task.priority]}`}
              title="Click to cycle priority"
            >
              {task.priority}
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleBreakdown}
              disabled={isBreakingDown || task.isCompleted}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                (task.subtasks?.length || 0) > 0 ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Wand2 className="w-3 h-3" />
              {isBreakingDown ? 'AI Thinking...' : (task.subtasks?.length ? `${task.subtasks.length} Subtasks` : 'AI Breakdown')}
              {task.subtasks && task.subtasks.length > 0 && (
                isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </button>
          </div>
        </div>

        <button 
          onClick={() => onDelete(task.id)}
          className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-red-50"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Subtasks Section */}
      {isExpanded && task.subtasks && (
        <div className="mt-4 pl-10 space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">AI Suggested Steps</div>
          {task.subtasks.map(subtask => (
            <div key={subtask.id} className="flex items-center gap-3 text-sm">
              <button 
                onClick={() => toggleSubtask(subtask.id)}
                className={`${subtask.isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-gray-400'}`}
              >
                {subtask.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </button>
              <span className={subtask.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
