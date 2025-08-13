import React, { useState } from 'react';
import { Clock, Play, Check, AlertCircle, Calendar, Tag } from 'lucide-react';
import { Task } from '../../contexts/TaskContext';

interface TaskCardProps {
  task: Task;
  onComplete?: (taskId: string, actualTime: number) => void;
  onStartFocus?: (taskId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onComplete, 
  onStartFocus, 
  showActions = true,
  compact = false 
}) => {
  const [actualTime, setActualTime] = useState(task.estimatedTime);
  const [showTimeInput, setShowTimeInput] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-green-100 text-green-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const handleComplete = () => {
    if (showTimeInput && onComplete) {
      onComplete(task.id, actualTime);
      setShowTimeInput(false);
    } else {
      setShowTimeInput(true);
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
        <button
          onClick={handleComplete}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {task.completed && <Check className="w-3 h-3" />}
        </button>
        <div className="flex-1">
          <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {task.title}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
          {task.category}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-4 hover:shadow-md transition-all duration-200 ${
      isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start space-x-4">
        <button
          onClick={handleComplete}
          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {task.completed && <Check className="w-4 h-4" />}
        </button>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className={`font-semibold ${
              task.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {task.title}
            </h3>
            <div className="flex items-center space-x-2 ml-4">
              <AlertCircle className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(task.category)}`}>
                {task.category}
              </span>
            </div>
          </div>

          {task.description && (
            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{task.estimatedTime}m estimated</span>
            </div>
            {task.dueDate && (
              <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : ''}`}>
                <Calendar className="w-4 h-4" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            {task.actualTime && (
              <div className="flex items-center space-x-1 text-green-600">
                <Check className="w-4 h-4" />
                <span>{task.actualTime}m actual</span>
              </div>
            )}
          </div>

          {showTimeInput && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How long did it actually take?
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  value={actualTime}
                  onChange={(e) => setActualTime(parseInt(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
                <span className="text-sm text-gray-600">minutes</span>
                <button
                  onClick={() => onComplete?.(task.id, actualTime)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  Complete
                </button>
                <button
                  onClick={() => setShowTimeInput(false)}
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {showActions && !task.completed && (
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => onStartFocus?.(task.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start Focus</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;