import React, { useState, useCallback } from 'react';
import { Calendar, Target, AlertCircle, Plus, Brain } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTask } from '../contexts/TaskContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { TaskWithPriority } from '../aiService';
import TaskCard from './shared/TaskCard';
import DraggableTaskCard from './shared/DraggableTaskCard';
import DroppableTimeBlock from './shared/DroppableTimeBlock';
import AIPrioritization from './shared/AIPrioritization';
import QuickAddTask from './shared/QuickAddTask';

const PlanningView: React.FC = () => {
  const { 
    getTodaysTasks, 
    getScheduledTasks, 
    getUnscheduledTasks,
    scheduleTask, 
    unscheduleTask,
    completeTask
  } = useTask();
  const { getCompletionPatterns } = useAnalytics();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [activeTask, setActiveTask] = useState<TaskWithPriority | null>(null);
  const [prioritizedTasks, setPrioritizedTasks] = useState<TaskWithPriority[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const todaysTasks = getTodaysTasks();
  const unscheduledTasks = getUnscheduledTasks();
  const completionPatterns = getCompletionPatterns();

  // Time blocks with scheduled tasks
  const timeBlocks = [
    { 
      id: 'morning', 
      label: 'Morning (6-12 PM)', 
      capacity: 180,
      tasks: getScheduledTasks('morning')
    },
    { 
      id: 'afternoon', 
      label: 'Afternoon (12-6 PM)', 
      capacity: 240,
      tasks: getScheduledTasks('afternoon')
    },
    { 
      id: 'evening', 
      label: 'Evening (6-10 PM)', 
      capacity: 120,
      tasks: getScheduledTasks('evening')
    }
  ];

  const totalEstimatedTime = todaysTasks.reduce((sum, task) => sum + task.estimatedTime, 0);
  const totalCapacity = timeBlocks.reduce((sum, block) => sum + block.capacity, 0);
  const capacityUtilization = Math.round((totalEstimatedTime / totalCapacity) * 100);

  const getBestTimeRecommendation = () => {
    const best = Object.entries(completionPatterns)
      .sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : 'morning';
  };

  const getCapacityColor = () => {
    if (capacityUtilization > 100) return 'text-red-600';
    if (capacityUtilization > 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const generateDailyInsights = () => [
    `You're most productive in the ${getBestTimeRecommendation()}`,
    `Your capacity utilization is ${capacityUtilization}%`,
    energyLevel >= 7 ? 'High energy day - tackle challenging tasks!' : 
    energyLevel >= 4 ? 'Moderate energy - balance work and breaks' : 
    'Low energy - focus on lighter tasks today'
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = [...todaysTasks, ...timeBlocks.flatMap(block => block.tasks)]
      .find(t => t.id === active.id);
    if (task) {
      setActiveTask(task as TaskWithPriority);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Handle dropping into time blocks
    if (['morning', 'afternoon', 'evening'].includes(overId as string)) {
      const task = todaysTasks.find(t => t.id === activeId);
      if (task) {
        const timeBlock = overId as string;
        const existingTasks = getScheduledTasks(timeBlock);
        scheduleTask(activeId as string, timeBlock, existingTasks.length);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      setActiveTask(null);
      return;
    }

    // Handle reordering within time blocks
    if (['morning', 'afternoon', 'evening'].includes(overId as string)) {
      const timeBlock = overId as string;
      const tasks = getScheduledTasks(timeBlock);
      const oldIndex = tasks.findIndex(task => task.id === activeId);
      const newIndex = tasks.findIndex(task => task.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newTasks = arrayMove(tasks, oldIndex, newIndex);
        // Update the order of tasks in the time block
        newTasks.forEach((task, index) => {
          scheduleTask(task.id, timeBlock, index);
        });
      }
    }

    // Handle dropping back to unscheduled
    if (overId === 'unscheduled') {
      unscheduleTask(activeId as string);
    }

    setActiveTask(null);
  };

  const handlePrioritize = useCallback((tasks: TaskWithPriority[]) => {
    setPrioritizedTasks(tasks);
  }, []);

  const handleAutoSchedule = () => {
    if (prioritizedTasks.length === 0) return;

    // Clear existing schedules
    todaysTasks.forEach(task => {
      if (task.scheduledTime) {
        unscheduleTask(task.id);
      }
    });

    // Auto-schedule based on AI prioritization and energy level
    const timeBlockCapacities = {
      morning: 180,
      afternoon: 240,
      evening: 120
    };

    const timeBlockUsage = {
      morning: 0,
      afternoon: 0,
      evening: 0
    };

    prioritizedTasks.forEach(task => {
      let bestTimeBlock = 'morning';
      let bestScore = -1;

      // Find the best time block for this task
      Object.entries(timeBlockCapacities).forEach(([timeBlock, capacity]) => {
        const usage = timeBlockUsage[timeBlock as keyof typeof timeBlockUsage];
        const remainingCapacity = capacity - usage;
        
        if (remainingCapacity >= task.estimatedTime) {
          let score = 0;
          
          // Prefer morning for high-priority tasks
          if (timeBlock === 'morning' && (task.aiPriority || 0) >= 7) score += 3;
          
          // Prefer afternoon for medium-priority tasks
          if (timeBlock === 'afternoon' && (task.aiPriority || 0) >= 5) score += 2;
          
          // Prefer evening for low-energy tasks
          if (timeBlock === 'evening' && task.estimatedTime <= 30) score += 1;
          
          // Prefer blocks with more remaining capacity
          score += remainingCapacity / capacity;
          
          if (score > bestScore) {
            bestScore = score;
            bestTimeBlock = timeBlock;
          }
        }
      });

      if (bestScore > -1) {
        const currentTasks = getScheduledTasks(bestTimeBlock);
        scheduleTask(task.id, bestTimeBlock, currentTasks.length);
        timeBlockUsage[bestTimeBlock as keyof typeof timeBlockUsage] += task.estimatedTime;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Planning</h1>
          <p className="text-gray-600">Plan your day strategically for maximum productivity.</p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Planning Panel */}
            <div className="lg:col-span-3">
              {/* Date Selection & Energy */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Planning Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Energy Level (1-10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={energyLevel}
                      onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span className="font-medium">{energyLevel}</span>
                      <span>High</span>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => setShowQuickAdd(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Task</span>
                    </button>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleAutoSchedule}
                      disabled={prioritizedTasks.length === 0 || todaysTasks.length < 3}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                    >
                      <Brain className="w-4 h-4" />
                      <span>Auto-Schedule</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Capacity Overview */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 text-blue-600 mr-2" />
                  Day Capacity Overview
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{todaysTasks.length}</div>
                    <div className="text-sm text-gray-600">Total Tasks</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{totalEstimatedTime}m</div>
                    <div className="text-sm text-gray-600">Estimated Time</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getCapacityColor()}`}>{capacityUtilization}%</div>
                    <div className="text-sm text-gray-600">Capacity Used</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{prioritizedTasks.length}</div>
                    <div className="text-sm text-gray-600">AI Prioritized</div>
                  </div>
                </div>

                {capacityUtilization > 100 && (
                  <div className="flex items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-red-700 text-sm">
                      Your day is overloaded! Consider rescheduling some tasks.
                    </p>
                  </div>
                )}
              </div>

              {/* Time Blocks */}
              <div className="space-y-4">
                {timeBlocks.map((block) => (
                  <DroppableTimeBlock
                    key={block.id}
                    id={block.id}
                    label={block.label}
                    capacity={block.capacity}
                    tasks={block.tasks}
                    onComplete={completeTask}
                  />
                ))}
              </div>

              {/* Unscheduled Tasks */}
              <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Unscheduled Tasks</h3>
                {unscheduledTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No unscheduled tasks.</p>
                  </div>
                ) : (
                  <div
                    id="unscheduled"
                    className="min-h-32 border-2 border-dashed border-gray-200 rounded-lg p-4"
                  >
                    <SortableContext items={unscheduledTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {unscheduledTasks.map((task) => (
                          <DraggableTaskCard
                            key={task.id}
                            task={task}
                            onComplete={completeTask}
                            compact
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Prioritization */}
              <AIPrioritization
                tasks={todaysTasks}
                energyLevel={energyLevel}
                availableTime={totalCapacity}
                onPrioritize={handlePrioritize}
              />

              {/* Daily Insights */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 text-purple-600 mr-2" />
                  Planning Insights
                </h3>
                <div className="space-y-3">
                  {generateDailyInsights().map((insight, index) => (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg border-l-3 border-purple-400">
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion Patterns */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Your Best Times</h3>
                <div className="space-y-3">
                  {Object.entries(completionPatterns).map(([time, percentage]) => (
                    <div key={time} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{time}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-blue-600">{percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Planning Tips</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <p>Drag and drop tasks to schedule them in time blocks</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <p>Use AI prioritization to get smart task ordering</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <p>Match task complexity to your energy level</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                    <p>Leave buffer time for unexpected interruptions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <div className="opacity-80">
                <TaskCard task={activeTask} compact />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Quick Add Task Modal */}
      {showQuickAdd && (
        <QuickAddTask onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  );
};

export default PlanningView;