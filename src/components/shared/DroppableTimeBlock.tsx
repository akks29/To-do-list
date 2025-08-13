import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../../contexts/TaskContext';
import DraggableTaskCard from './DraggableTaskCard';

interface DroppableTimeBlockProps {
  id: string;
  label: string;
  capacity: number;
  tasks: Task[];
  onComplete?: (taskId: string, actualTime: number) => void;
  onStartFocus?: (taskId: string) => void;
}

const DroppableTimeBlock: React.FC<DroppableTimeBlockProps> = ({
  id,
  label,
  capacity,
  tasks,
  onComplete,
  onStartFocus
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  const usedTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
  const capacityPercentage = Math.round((usedTime / capacity) * 100);
  
  const getCapacityColor = () => {
    if (capacityPercentage > 100) return 'bg-red-100 border-red-300';
    if (capacityPercentage > 80) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <span>{usedTime}m / {capacity}m</span>
            <div className={`w-16 h-2 rounded-full ${getCapacityColor()} border`}>
              <div 
                className={`h-full rounded-full ${
                  capacityPercentage > 100 ? 'bg-red-500' :
                  capacityPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div
        ref={setNodeRef}
        className={`min-h-32 border-2 border-dashed rounded-lg p-4 transition-colors ${
          isOver 
            ? 'border-blue-400 bg-blue-50' 
            : tasks.length === 0 
              ? 'border-gray-200' 
              : 'border-gray-300'
        }`}
      >
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>Drag tasks here to schedule them</p>
            <p className="text-sm mt-1">Or click tasks to auto-schedule</p>
          </div>
        ) : (
          <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {tasks.map((task) => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  onStartFocus={onStartFocus}
                  compact
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
};

export default DroppableTimeBlock;
