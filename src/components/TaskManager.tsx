import React, { useState } from 'react';
import { Search, Plus, Filter, SortAsc } from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import TaskCard from './shared/TaskCard';
import QuickAddTask from './shared/QuickAddTask';

const TaskManager: React.FC = () => {
  const { state, dispatch, completeTask } = useTask();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created'>('dueDate');

  const handleSearch = (query: string) => {
    dispatch({ type: 'SET_SEARCH', payload: query });
  };

  const handleFilterChange = (filter: typeof state.filter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const filteredTasks = state.tasks.filter(task => {
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      if (!task.title.toLowerCase().includes(query) && 
          !task.description?.toLowerCase().includes(query)) {
        return false;
      }
    }

    switch (state.filter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return !task.completed && (!task.dueDate || new Date(task.dueDate) <= today);
      case 'work':
      case 'personal':
      case 'urgent':
        return task.category === state.filter && !task.completed;
      case 'completed':
        return task.completed;
      default:
        return !task.completed;
    }
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  const filters = [
    { key: 'all', label: 'All Tasks', count: state.tasks.filter(t => !t.completed).length },
    { key: 'today', label: 'Today', count: state.tasks.filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !t.completed && (!t.dueDate || new Date(t.dueDate) <= today);
    }).length },
    { key: 'work', label: 'Work', count: state.tasks.filter(t => t.category === 'work' && !t.completed).length },
    { key: 'personal', label: 'Personal', count: state.tasks.filter(t => t.category === 'personal' && !t.completed).length },
    { key: 'urgent', label: 'Urgent', count: state.tasks.filter(t => t.category === 'urgent' && !t.completed).length },
    { key: 'completed', label: 'Completed', count: state.tasks.filter(t => t.completed).length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Manager</h1>
          <p className="text-gray-600">Organize and track all your tasks in one place.</p>
        </div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={state.searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center space-x-2">
              <SortAsc className="text-gray-400 w-5 h-5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="created">Created</option>
              </select>
            </div>

            {/* Add Task Button */}
            <button
              onClick={() => setShowQuickAdd(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => handleFilterChange(filter.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  state.filter === filter.key
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500">
                {state.searchQuery || state.filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first task!'
                }
              </p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={completeTask}
                showActions
              />
            ))
          )}
        </div>
      </div>

      {/* Quick Add Task Modal */}
      {showQuickAdd && (
        <QuickAddTask onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  );
};

export default TaskManager;