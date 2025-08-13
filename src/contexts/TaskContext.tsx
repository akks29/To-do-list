import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: 'work' | 'personal' | 'urgent';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  estimatedTime: number; // in minutes
  actualTime?: number;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  isRecurring?: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly';
  scheduledTime?: string; // 'morning', 'afternoon', 'evening'
  scheduledOrder?: number; // Order within the time block
}

interface TaskState {
  tasks: Task[];
  filter: 'all' | 'today' | 'work' | 'personal' | 'urgent' | 'completed';
  searchQuery: string;
}

type TaskAction = 
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'COMPLETE_TASK'; payload: { id: string; actualTime: number } }
  | { type: 'SET_FILTER'; payload: TaskState['filter'] }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SCHEDULE_TASK'; payload: { id: string; timeBlock: string; order: number } }
  | { type: 'UNSCHEDULE_TASK'; payload: string };

const TaskContext = createContext<{
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string, actualTime: number) => void;
  scheduleTask: (id: string, timeBlock: string, order: number) => void;
  unscheduleTask: (id: string) => void;
  getTodaysTasks: () => Task[];
  getScheduledTasks: (timeBlock: string) => Task[];
  getUnscheduledTasks: () => Task[];
  getTasksByCategory: (category: string) => Task[];
  getEstimationAccuracy: () => number;
} | undefined>(undefined);

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        )
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    case 'COMPLETE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? {
                ...task,
                completed: true,
                actualTime: action.payload.actualTime,
                completedAt: new Date()
              }
            : task
        )
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SCHEDULE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { 
                ...task, 
                scheduledTime: action.payload.timeBlock,
                scheduledOrder: action.payload.order
              }
            : task
        )
      };
    case 'UNSCHEDULE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { 
                ...task, 
                scheduledTime: undefined,
                scheduledOrder: undefined
              }
            : task
        )
      };
    default:
      return state;
  }
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: [],
    filter: 'all',
    searchQuery: ''
  });

  // Load tasks from localStorage on init
  useEffect(() => {
    const savedTasks = localStorage.getItem('cognitask-tasks');
    if (savedTasks) {
      const tasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined
      }));
      dispatch({ type: 'SET_TASKS', payload: tasks });
    }
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('cognitask-tasks', JSON.stringify(state.tasks));
  }, [state.tasks]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    dispatch({ type: 'ADD_TASK', payload: task });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  const completeTask = (id: string, actualTime: number) => {
    dispatch({ type: 'COMPLETE_TASK', payload: { id, actualTime } });
  };

  const scheduleTask = (id: string, timeBlock: string, order: number) => {
    dispatch({ type: 'SCHEDULE_TASK', payload: { id, timeBlock, order } });
  };

  const unscheduleTask = (id: string) => {
    dispatch({ type: 'UNSCHEDULE_TASK', payload: id });
  };

  const getTodaysTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return state.tasks.filter(task => {
      if (task.completed) return false;
      
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today;
      }
      
      return !task.dueDate; // Include tasks without due dates
    });
  };

  const getTasksByCategory = (category: string) => {
    return state.tasks.filter(task => 
      task.category === category && !task.completed
    );
  };

  const getScheduledTasks = (timeBlock: string) => {
    return state.tasks
      .filter(task => 
        task.scheduledTime === timeBlock && 
        !task.completed
      )
      .sort((a, b) => (a.scheduledOrder || 0) - (b.scheduledOrder || 0));
  };

  const getUnscheduledTasks = () => {
    return state.tasks.filter(task => 
      !task.scheduledTime && !task.completed
    );
  };

  const getEstimationAccuracy = () => {
    const completedTasks = state.tasks.filter(task => 
      task.completed && task.actualTime && task.estimatedTime
    );
    
    if (completedTasks.length === 0) return 0;
    
    const accuracies = completedTasks.map(task => {
      const accuracy = Math.abs(task.estimatedTime - task.actualTime!) / task.estimatedTime;
      return Math.max(0, 1 - accuracy);
    });
    
    return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  };

  return (
    <TaskContext.Provider value={{
      state,
      dispatch,
      addTask,
      updateTask,
      deleteTask,
      completeTask,
      scheduleTask,
      unscheduleTask,
      getTodaysTasks,
      getScheduledTasks,
      getUnscheduledTasks,
      getTasksByCategory,
      getEstimationAccuracy
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};