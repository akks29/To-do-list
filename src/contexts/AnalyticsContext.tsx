import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useTask } from './TaskContext';
import { useTimer } from './TimerContext';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

export interface WeeklyInsight {
  id: string;
  week: string;
  performanceScore: number;
  completionRate: number;
  focusTime: number;
  estimationAccuracy: number;
  insights: string[];
  createdAt: Date;
}

interface AnalyticsState {
  achievements: Achievement[];
  weeklyInsights: WeeklyInsight[];
  currentWeekScore: number;
  bestCompletionTime: string; // 'morning' | 'afternoon' | 'evening'
  taskTypePerformance: Record<string, number>;
  energyLevels: { date: string; level: number; tasksCompleted: number }[];
}

type AnalyticsAction = 
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: string }
  | { type: 'UPDATE_ACHIEVEMENT_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'ADD_WEEKLY_INSIGHT'; payload: WeeklyInsight }
  | { type: 'UPDATE_WEEKLY_SCORE'; payload: number }
  | { type: 'UPDATE_COMPLETION_TIME'; payload: string }
  | { type: 'ADD_ENERGY_LEVEL'; payload: { date: string; level: number; tasksCompleted: number } }
  | { type: 'SET_ANALYTICS_DATA'; payload: Partial<AnalyticsState> };

const defaultAchievements: Achievement[] = [
  {
    id: 'first-task',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '🎯',
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'focus-master',
    name: 'Focus Master',
    description: 'Complete 10 focus sessions',
    icon: '🧘',
    progress: 0,
    maxProgress: 10
  },
  {
    id: 'estimation-guru',
    name: 'Time Oracle',
    description: 'Achieve 80% estimation accuracy',
    icon: '🔮',
    progress: 0,
    maxProgress: 80
  },
  {
    id: 'weekly-warrior',
    name: 'Weekly Warrior',
    description: 'Complete all planned tasks for a week',
    icon: '⚔️',
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'streak-champion',
    name: 'Streak Champion',
    description: 'Maintain a 7-day focus streak',
    icon: '🔥',
    progress: 0,
    maxProgress: 7
  }
];

const AnalyticsContext = createContext<{
  state: AnalyticsState;
  dispatch: React.Dispatch<AnalyticsAction>;
  calculateWeeklyScore: () => number;
  generateWeeklyInsights: () => string[];
  updateAchievements: () => void;
  getCompletionPatterns: () => Record<string, number>;
  addEnergyLevel: (level: number) => void;
} | undefined>(undefined);

const analyticsReducer = (state: AnalyticsState, action: AnalyticsAction): AnalyticsState => {
  switch (action.type) {
    case 'UNLOCK_ACHIEVEMENT':
      return {
        ...state,
        achievements: state.achievements.map(achievement =>
          achievement.id === action.payload
            ? { ...achievement, unlockedAt: new Date() }
            : achievement
        )
      };
    case 'UPDATE_ACHIEVEMENT_PROGRESS':
      return {
        ...state,
        achievements: state.achievements.map(achievement =>
          achievement.id === action.payload.id
            ? { ...achievement, progress: Math.min(action.payload.progress, achievement.maxProgress) }
            : achievement
        )
      };
    case 'ADD_WEEKLY_INSIGHT':
      return {
        ...state,
        weeklyInsights: [...state.weeklyInsights, action.payload]
      };
    case 'UPDATE_WEEKLY_SCORE':
      return { ...state, currentWeekScore: action.payload };
    case 'UPDATE_COMPLETION_TIME':
      return { ...state, bestCompletionTime: action.payload };
    case 'ADD_ENERGY_LEVEL':
      return {
        ...state,
        energyLevels: [...state.energyLevels, action.payload]
      };
    case 'SET_ANALYTICS_DATA':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(analyticsReducer, {
    achievements: defaultAchievements,
    weeklyInsights: [],
    currentWeekScore: 0,
    bestCompletionTime: 'morning',
    taskTypePerformance: {},
    energyLevels: []
  });

  // Load analytics data from localStorage
  useEffect(() => {
    const savedAnalytics = localStorage.getItem('cognitask-analytics');
    if (savedAnalytics) {
      const data = JSON.parse(savedAnalytics);
      // Convert dates back to Date objects
      const processedData = {
        ...data,
        achievements: data.achievements?.map((achievement: any) => ({
          ...achievement,
          unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt) : undefined
        })) || defaultAchievements,
        weeklyInsights: data.weeklyInsights?.map((insight: any) => ({
          ...insight,
          createdAt: new Date(insight.createdAt)
        })) || []
      };
      dispatch({ type: 'SET_ANALYTICS_DATA', payload: processedData });
    }
  }, []);

  // Save analytics data to localStorage
  useEffect(() => {
    localStorage.setItem('cognitask-analytics', JSON.stringify(state));
  }, [state]);

  const calculateWeeklyScore = () => {
    const { tasks } = useTask();
    const { getSessionsToday } = useTimer();
    
    // Get this week's tasks
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getDay() === 0 ? now.getDate() - 6 : now.getDate() - now.getDay(), 1);
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const thisWeeksTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= startOfWeek && taskDate < endOfWeek;
    });
    
    const completedTasks = thisWeeksTasks.filter(task => task.completed);
    const completionRate = thisWeeksTasks.length > 0 ? completedTasks.length / thisWeeksTasks.length : 0;
    
    // Calculate score based on completion rate and other factors
    let score = Math.round(completionRate * 10); // Base score from completion rate
    
    // Bonus points for consistency
    if (thisWeeksTasks.length >= 5) score += 1;
    if (completionRate >= 0.8) score += 1;
    
    // Ensure score is between 1-10
    score = Math.max(1, Math.min(10, score));
    
    dispatch({ type: 'UPDATE_WEEKLY_SCORE', payload: score });
    return score;
  };

  const generateWeeklyInsights = () => {
    const insights = [
      "You're most productive in the morning - try scheduling important tasks early!",
      "Your focus sessions are getting longer - great improvement in concentration!",
      "Work tasks are completed 20% faster than personal tasks - consider time blocking.",
      "You complete 85% more tasks on days when you start with a focus session.",
      "Your estimation accuracy has improved by 15% this week - keep practicing!"
    ];

    // Return 2-3 random insights
    const selectedInsights = insights
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 2) + 2);
    
    return selectedInsights;
  };

  const updateAchievements = () => {
    // This would be called when tasks are completed, sessions finished, etc.
    // For now, just a placeholder
  };

  const getCompletionPatterns = () => {
    return {
      morning: 45,
      afternoon: 35,
      evening: 20
    };
  };

  const addEnergyLevel = (level: number) => {
    const today = new Date().toISOString().split('T')[0];
    dispatch({
      type: 'ADD_ENERGY_LEVEL',
      payload: { date: today, level, tasksCompleted: 0 }
    });
  };

  return (
    <AnalyticsContext.Provider value={{
      state,
      dispatch,
      calculateWeeklyScore,
      generateWeeklyInsights,
      updateAchievements,
      getCompletionPatterns,
      addEnergyLevel
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};