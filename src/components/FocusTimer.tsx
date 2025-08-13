import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Settings, Coffee, Target } from 'lucide-react';
import { useTimer } from '../contexts/TimerContext';
import { useTask } from '../contexts/TaskContext';

const FocusTimer: React.FC = () => {
  const { 
    state, 
    startFocusSession, 
    startBreakSession, 
    pauseSession, 
    resumeSession, 
    stopSession,
    getSessionsToday,
    getCurrentStreak
  } = useTimer();
  
  const { getTodaysTasks } = useTask();
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  const todaysTasks = getTodaysTasks().filter(task => !task.completed);
  const sessionsToday = getSessionsToday();
  const focusSessionsToday = sessionsToday.filter(s => s.sessionType === 'focus' && s.completed).length;
  const currentStreak = getCurrentStreak();

  // Auto-select first task if none selected
  useEffect(() => {
    if (!selectedTaskId && todaysTasks.length > 0) {
      setSelectedTaskId(todaysTasks[0].id);
    }
  }, [selectedTaskId, todaysTasks]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!state.currentSession) return 0;
    const elapsed = state.currentSession.duration - state.timeRemaining;
    return (elapsed / state.currentSession.duration) * 100;
  };

  const handleStart = () => {
    if (!state.currentSession) {
      startFocusSession(selectedTaskId);
    } else if (state.isRunning) {
      pauseSession();
    } else {
      resumeSession();
    }
  };

  const handleStop = () => {
    stopSession();
  };

  const shouldShowBreakOptions = () => {
    return !state.currentSession && focusSessionsToday > 0;
  };

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case 'focus': return 'from-blue-500 to-purple-600';
      case 'short-break': return 'from-green-400 to-blue-500';
      case 'long-break': return 'from-orange-400 to-red-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const brainBreakExercises = [
    "Take 5 deep breaths slowly",
    "Look at something 20 feet away for 20 seconds", 
    "Stretch your neck and shoulders",
    "Write down 3 things you're grateful for",
    "Do 10 jumping jacks"
  ];

  const selectedTask = todaysTasks.find(task => task.id === selectedTaskId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Focus Timer</h1>
          <p className="text-gray-600">Stay focused and productive with the Pomodoro technique.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Timer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-8">
              {/* Current Session Info */}
              {state.currentSession && (
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-white font-medium bg-gradient-to-r ${
                    getSessionTypeColor(state.currentSession.sessionType)
                  }`}>
                    <Target className="w-4 h-4 mr-2" />
                    {state.currentSession.sessionType === 'focus' ? 'Focus Session' : 
                     state.currentSession.sessionType === 'short-break' ? 'Short Break' : 'Long Break'}
                  </div>
                  {selectedTask && state.currentSession.sessionType === 'focus' && (
                    <p className="text-gray-600 mt-2">Working on: {selectedTask.title}</p>
                  )}
                </div>
              )}

              {/* Timer Display */}
              <div className="text-center mb-8">
                <div className="relative inline-block">
                  <svg className="w-64 h-64" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * getProgressPercentage()) / 100}
                      transform="rotate(-90 50 50)"
                      className="transition-all duration-1000 ease-in-out"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">
                        {formatTime(state.timeRemaining)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {state.isRunning ? 'Running' : state.currentSession ? 'Paused' : 'Ready'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Selection */}
              {!state.currentSession && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select a task to focus on:
                  </label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No specific task</option>
                    {todaysTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title} ({task.estimatedTime}m)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Timer Controls */}
              <div className="flex justify-center space-x-4 mb-6">
                <button
                  onClick={handleStart}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    state.isRunning
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {state.isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{state.isRunning ? 'Pause' : 'Start'}</span>
                </button>

                {state.currentSession && (
                  <button
                    onClick={handleStop}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
                  >
                    <Square className="w-5 h-5" />
                    <span>Stop</span>
                  </button>
                )}
              </div>

              {/* Session Type Buttons */}
              {!state.currentSession && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => startFocusSession(selectedTaskId)}
                    className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-blue-200 transition-colors"
                  >
                    <Target className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-blue-700">Focus Session</div>
                    <div className="text-xs text-blue-600">{state.settings.focusDuration} minutes</div>
                  </button>

                  {shouldShowBreakOptions() && (
                    <>
                      <button
                        onClick={() => startBreakSession('short-break')}
                        className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-200 transition-colors"
                      >
                        <Coffee className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <div className="text-sm font-medium text-green-700">Short Break</div>
                        <div className="text-xs text-green-600">{state.settings.shortBreakDuration} minutes</div>
                      </button>

                      <button
                        onClick={() => startBreakSession('long-break')}
                        className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border-2 border-orange-200 transition-colors"
                      >
                        <RotateCcw className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                        <div className="text-sm font-medium text-orange-700">Long Break</div>
                        <div className="text-xs text-orange-600">{state.settings.longBreakDuration} minutes</div>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Today's Progress</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Focus Sessions</span>
                  <span className="font-semibold text-blue-600">{focusSessionsToday}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Streak</span>
                  <span className="font-semibold text-orange-600">{currentStreak}🔥</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Focus Time</span>
                  <span className="font-semibold text-purple-600">
                    {Math.round(sessionsToday.reduce((total, session) => 
                      session.sessionType === 'focus' && session.completed 
                        ? total + session.duration 
                        : total, 0) / 60)}m
                  </span>
                </div>
              </div>
            </div>

            {/* Brain Break Suggestions */}
            {state.currentSession?.sessionType.includes('break') && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">🧘 Brain Break Ideas</h3>
                <div className="space-y-3">
                  {brainBreakExercises.slice(0, 3).map((exercise, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg border-l-3 border-green-400">
                      <p className="text-sm text-gray-700">{exercise}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Timer Settings</h3>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              
              {showSettings && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Focus Duration (min)
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      step="5"
                      value={state.settings.focusDuration}
                      onChange={(e) => {/* Update settings */}}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600 text-center">{state.settings.focusDuration}m</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Break (min)
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="15"
                      step="1"
                      value={state.settings.shortBreakDuration}
                      onChange={(e) => {/* Update settings */}}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-600 text-center">{state.settings.shortBreakDuration}m</div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Sessions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Sessions</h3>
              {sessionsToday.length === 0 ? (
                <p className="text-gray-500 text-sm">No sessions today yet.</p>
              ) : (
                <div className="space-y-2">
                  {sessionsToday.slice(-5).reverse().map((session) => (
                    <div key={session.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          session.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>
                        <span className="text-sm capitalize">
                          {session.sessionType.replace('-', ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(session.startTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;