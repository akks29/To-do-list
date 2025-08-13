import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Brain, 
  Target, 
  Zap,
  Plus,
  Play,
  Calendar,
  Award,
  Timer
} from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import { useTimer } from '../contexts/TimerContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import TaskCard from './shared/TaskCard';
import QuickAddTask from './shared/QuickAddTask';

const Dashboard: React.FC = () => {
  const { getTodaysTasks, getEstimationAccuracy, completeTask } = useTask();
  const { startFocusSession, getSessionsToday, getTotalFocusTime, state: timerState } = useTimer();
  const { state: analyticsState, generateWeeklyInsights } = useAnalytics();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  const todaysTasks = getTodaysTasks();
  const completedToday = todaysTasks.filter(task => task.completed).length;
  const sessionsToday = getSessionsToday();
  const focusTimeToday = Math.round(getTotalFocusTime() / 60); // Convert to minutes
  const estimationAccuracy = Math.round(getEstimationAccuracy() * 100);

  const stats = [
    {
      title: 'Tasks Completed',
      value: `${completedToday}/${todaysTasks.length}`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Focus Time',
      value: `${focusTimeToday}m`,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Focus Sessions',
      value: sessionsToday.filter(s => s.sessionType === 'focus' && s.completed).length.toString(),
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Time Accuracy',
      value: `${estimationAccuracy}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const recentAchievements = analyticsState.achievements
    .filter(achievement => achievement.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3);

  const weeklyInsights = generateWeeklyInsights();

  const handleTaskComplete = (taskId: string, actualTime: number) => {
    completeTask(taskId, actualTime);
  };

  const handleStartFocus = (taskId: string) => {
    // Just log for now - the inline timer will handle the focus session
    console.log('Start focus for task:', taskId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Good morning! 🌅</h1>
          <p className="text-gray-600">Let's make today productive and focused.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-3 rounded-lg mr-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Tasks */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                  Today's Tasks
                </h2>
                <button
                  onClick={() => setShowQuickAdd(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>
              
              {todaysTasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tasks for today. Add one to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysTasks.slice(0, 5).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleTaskComplete}
                      onStartFocus={handleStartFocus}
                      showActions
                    />
                  ))}
                  {todaysTasks.length > 5 && (
                    <p className="text-sm text-gray-500 text-center pt-4">
                      And {todaysTasks.length - 5} more tasks...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Timer */}
            {timerState.currentSession && (
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Timer className="w-5 h-5 mr-2" />
                  Current Session
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {Math.floor(timerState.timeRemaining / 60)}:{(timerState.timeRemaining % 60).toString().padStart(2, '0')}
                  </div>
                  <p className="opacity-90 capitalize">{timerState.currentSession.sessionType.replace('-', ' ')}</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm mt-2 ${
                    timerState.isRunning ? 'bg-green-500 bg-opacity-20' : 'bg-yellow-500 bg-opacity-20'
                  }`}>
                    {timerState.isRunning ? 'Running' : 'Paused'}
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Score */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 text-purple-600 mr-2" />
                Weekly Performance
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {analyticsState.currentWeekScore}/10
                </div>
                <p className="text-sm text-gray-600 mb-4">Cognitive Performance Score</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(analyticsState.currentWeekScore / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="w-5 h-5 text-yellow-600 mr-2" />
                  Recent Achievements
                </h3>
                <div className="space-y-3">
                  {recentAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-3 p-2 bg-yellow-50 rounded-lg">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{achievement.name}</p>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Insights */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-orange-600 mr-2" />
                Quick Insights
              </h3>
              <div className="space-y-3">
                {weeklyInsights.slice(0, 2).map((insight, index) => (
                  <div key={index} className="p-3 bg-orange-50 rounded-lg border-l-3 border-orange-400">
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Task Modal */}
      {showQuickAdd && (
        <QuickAddTask onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  );
};

export default Dashboard;