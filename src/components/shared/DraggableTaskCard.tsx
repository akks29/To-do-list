import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../contexts/TaskContext';
import TaskCard from './TaskCard';

interface DraggableTaskCardProps {
  task: Task;
  onComplete?: (taskId: string, actualTime: number) => void;
  onStartFocus?: (taskId: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({
  task,
  onComplete,
  onStartFocus,
  showActions = true,
  compact = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'z-50' : ''}`}
    >
      <TaskCard
        task={task}
        onComplete={onComplete}
        onStartFocus={onStartFocus}
        showActions={showActions}
        compact={compact}
      />
    </div>
  );
};

export default DraggableTaskCard;
