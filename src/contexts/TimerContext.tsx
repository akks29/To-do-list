import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface FocusSession {
  id: string;
  taskId?: string;
  duration: number; // in seconds
  completed: boolean;
  startTime: Date;
  endTime?: Date;
  sessionType: 'focus' | 'short-break' | 'long-break';
}

interface TimerState {
  isRunning: boolean;
  currentSession: FocusSession | null;
  timeRemaining: number; // in seconds
  sessions: FocusSession[];
  settings: {
    focusDuration: number; // in minutes
    shortBreakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartFocus: boolean;
  };
  completedSessions: number;
  streak: number;
}

type TimerAction = 
  | { type: 'START_SESSION'; payload: { type: 'focus' | 'short-break' | 'long-break'; taskId?: string } }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'STOP_SESSION' }
  | { type: 'TICK' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<TimerState['settings']> }
  | { type: 'SET_SESSIONS'; payload: FocusSession[] };

const TimerContext = createContext<{
  state: TimerState;
  dispatch: React.Dispatch<TimerAction>;
  startFocusSession: (taskId?: string) => void;
  startBreakSession: (type: 'short-break' | 'long-break') => void;
  pauseSession: () => void;
  resumeSession: () => void;
  completeSession: () => void;
  stopSession: () => void;
  getSessionsToday: () => FocusSession[];
  getTotalFocusTime: () => number;
  getCurrentStreak: () => number;
} | undefined>(undefined);

const defaultSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false
};

const timerReducer = (state: TimerState, action: TimerAction): TimerState => {
  switch (action.type) {
    case 'START_SESSION': {
      const duration = action.payload.type === 'focus' 
        ? state.settings.focusDuration * 60
        : action.payload.type === 'short-break'
        ? state.settings.shortBreakDuration * 60
        : state.settings.longBreakDuration * 60;

      const session: FocusSession = {
        id: Date.now().toString(),
        taskId: action.payload.taskId,
        duration,
        completed: false,
        startTime: new Date(),
        sessionType: action.payload.type
      };

      return {
        ...state,
        isRunning: true,
        currentSession: session,
        timeRemaining: duration
      };
    }
    case 'PAUSE_SESSION':
      return { ...state, isRunning: false };
    case 'RESUME_SESSION':
      return { ...state, isRunning: true };
    case 'COMPLETE_SESSION': {
      if (!state.currentSession) return state;

      const completedSession = {
        ...state.currentSession,
        completed: true,
        endTime: new Date()
      };

      return {
        ...state,
        isRunning: false,
        currentSession: null,
        timeRemaining: 0,
        sessions: [...state.sessions, completedSession],
        completedSessions: state.currentSession.sessionType === 'focus' 
          ? state.completedSessions + 1 
          : state.completedSessions,
        streak: state.currentSession.sessionType === 'focus' 
          ? state.streak + 1 
          : state.streak
      };
    }
    case 'STOP_SESSION':
      return {
        ...state,
        isRunning: false,
        currentSession: null,
        timeRemaining: 0
      };
    case 'TICK':
      if (state.timeRemaining <= 1) {
        // Auto-complete when time runs out
        return timerReducer(state, { type: 'COMPLETE_SESSION' });
      }
      return { ...state, timeRemaining: state.timeRemaining - 1 };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    default:
      return state;
  }
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(timerReducer, {
    isRunning: false,
    currentSession: null,
    timeRemaining: 0,
    sessions: [],
    settings: defaultSettings,
    completedSessions: 0,
    streak: 0
  });

  // Load sessions and settings from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('cognitask-sessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined
      }));
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
    }

    const savedSettings = localStorage.getItem('cognitask-timer-settings');
    if (savedSettings) {
      dispatch({ type: 'UPDATE_SETTINGS', payload: JSON.parse(savedSettings) });
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('cognitask-sessions', JSON.stringify(state.sessions));
  }, [state.sessions]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('cognitask-timer-settings', JSON.stringify(state.settings));
  }, [state.settings]);

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isRunning && state.timeRemaining > 0) {
      interval = setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [state.isRunning, state.timeRemaining]);

  const startFocusSession = (taskId?: string) => {
    dispatch({ type: 'START_SESSION', payload: { type: 'focus', taskId } });
  };

  const startBreakSession = (type: 'short-break' | 'long-break') => {
    dispatch({ type: 'START_SESSION', payload: { type } });
  };

  const pauseSession = () => dispatch({ type: 'PAUSE_SESSION' });
  const resumeSession = () => dispatch({ type: 'RESUME_SESSION' });
  const completeSession = () => dispatch({ type: 'COMPLETE_SESSION' });
  const stopSession = () => dispatch({ type: 'STOP_SESSION' });

  const getSessionsToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return state.sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
  };

  const getTotalFocusTime = () => {
    const today = getSessionsToday();
    return today
      .filter(session => session.sessionType === 'focus' && session.completed)
      .reduce((total, session) => total + session.duration, 0);
  };

  const getCurrentStreak = () => {
    return state.streak;
  };

  return (
    <TimerContext.Provider value={{
      state,
      dispatch,
      startFocusSession,
      startBreakSession,
      pauseSession,
      resumeSession,
      completeSession,
      stopSession,
      getSessionsToday,
      getTotalFocusTime,
      getCurrentStreak
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};