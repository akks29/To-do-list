import React, { useState } from 'react';
import { 
  TrendingUp, 
  Brain, 
  Target, 
  Clock, 
  Award,
  Calendar,
  BarChart3,
  Lightbulb,
  Zap
} from 'lucide-react';
import { useTask } from '../contexts/TaskContext';
import { useTimer } from '../contexts/TimerContext';
import { useAnalytics } from '../contexts/AnalyticsContext';

const InsightsView: React.FC = () => {
  const { state: taskState, getEstimationAccuracy } = useTask();
  const { getSessionsToday, state: timerState } = useTimer();
  const { state: analyticsState, calculateWeeklyScore, generateWeeklyInsights } = useAnalytics();

  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  // Calculate metrics
  const completedTasks = taskState.tasks.filter(task => task.completed);
  const totalTasks = taskState.tasks.length;
  const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
  const estimationAccuracy = getEstimationAccuracy() * 100;
  const sessionsToday = getSessionsToday();
  const weeklyScore = calculateWeeklyScore();
  const weeklyInsights = generateWeeklyInsights();

  // Task completion patterns
  const getCompletionPatterns = () => {
    const patterns: { [key: string]: number } = { morning: 0, afternoon: 0, evening: 0 };
    
    completedTasks.forEach(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        if (hour >= 6 && hour < 12) patterns.morning++;
        else if (hour >= 12 && hour < 18) patterns.afternoon++;
        else patterns.evening++;
      }
    });

    const total = Object.values(patterns).reduce((sum, count) => sum + count, 0);
    if (total === 0) return { morning: 33, afternoon: 33, evening: 34 };
    
    return {
      morning: Math.round((patterns.morning / total) * 100),
      afternoon: Math.round((patterns.afternoon / total) * 100),
      evening: Math.round((patterns.evening / total) * 100)
    };
  };

  const completionPatterns = getCompletionPatterns();
  const bestTime = Object.entries(completionPatterns).reduce((a, b) => 
    completionPatterns[a[0]] > completionPatterns[b[0]] ? a : b
  )[0];

  // Category performance
  const getCategoryPerformance = () => {
    const categories: { [key: string]: { completed: number; total: number } } = {};
    
    taskState.tasks.forEach(task => {
      if (!categories[task.category]) {
        categories[task.category] = { completed: 0, total: 0 };
      }
      categories[task.category].total++;
      if (task.completed) categories[task.category].completed++;
    });

    return Object.entries(categories).map(([category, stats]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      total: stats.total
    }));
  };

  const categoryPerformance = getCategoryPerformance();

  // Focus session trends (mock data for demo)
  const getFocusSessionTrends = () => [
    { day: 'Mon', sessions: 3, avgDuration: 25 },
    { day: 'Tue', sessions: 4, avgDuration: 28 },
    { day: 'Wed', sessions: 2, avgDuration: 22 },
    { day: 'Thu', sessions: 5, avgDuration: 30 },
    { day: 'Fri', sessions: 3, avgDuration: 26 },
    { day: 'Sat', sessions: 2, avgDuration: 20 },
    { day: 'Sun', sessions: 1, avgDuration: 15 }
  ];

  const focusTrends = getFocusSessionTrends();

  const stats = [
    {
      title: 'Completion Rate',
      value: `${Math.round(completionRate)}%`,
      change: '+5% from last week',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Time Accuracy',
      value: `${Math.round(estimationAccuracy)}%`,
      change: '+12% from last week',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Focus Sessions',
      value: sessionsToday.filter(s => s.sessionType === 'focus').length.toString(),
      change: 'Today',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Weekly Score',
      value: `${weeklyScore}/10`,
      change: '+1.2 from last week',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Cognitive Insights</h1>
              <p className="text-gray-600">Track your productivity patterns and cognitive improvements.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTimeRange('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === 'week'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === 'month'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Performance Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                Focus Session Trends
              </h3>
              <div className="space-y-4">
                {focusTrends.map((day) => (
                  <div key={day.day} className="flex items-center space-x-4">
                    <div className="w-8 text-sm font-medium text-gray-600">{day.day}</div>
                    <div className="flex-1 flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                          style={{ width: `${(day.sessions / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12">
                        {day.sessions} sessions
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 w-16">{day.avgDuration}m avg</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completion Patterns */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 text-purple-600 mr-2" />
                Task Completion Patterns
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {Object.entries(completionPatterns).map(([time, percentage]) => (
                  <div key={time} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
                    <div className="text-sm text-gray-600 capitalize">{time}</div>
                    {time === bestTime && (
                      <div className="mt-2 text-xs text-green-600 font-medium">🏆 Best Time</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-blue-700 text-sm">
                  <strong>Insight:</strong> You complete {completionPatterns[bestTime]}% more tasks in the {bestTime}. 
                  Try scheduling your most important work during this time!
                </p>
              </div>
            </div>

            {/* Category Performance */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 text-green-600 mr-2" />
                Category Performance
              </h3>
              <div className="space-y-4">
                {categoryPerformance.map((category) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{category.category}</span>
                      <span className="text-sm text-gray-500">({category.total} tasks)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            category.completionRate >= 80 ? 'bg-green-500' :
                            category.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${category.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12">
                        {Math.round(category.completionRate)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weekly Performance Score - REMOVED */}
            {/* Weekly Insights - REMOVED */}
            {/* Achievements - REMOVED */}
            {/* Productivity Boost - REMOVED */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsView;