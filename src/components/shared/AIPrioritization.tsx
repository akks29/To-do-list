import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Task } from '../../contexts/TaskContext';
import { AIService, TaskWithPriority, PrioritizationRequest } from '../../aiService';

interface AIPrioritizationProps {
  tasks: Task[];
  energyLevel: number;
  availableTime: number;
  onPrioritize?: (prioritizedTasks: TaskWithPriority[]) => void;
}

const AIPrioritization: React.FC<AIPrioritizationProps> = ({
  tasks,
  energyLevel,
  availableTime,
  onPrioritize
}) => {
  const [prioritizedTasks, setPrioritizedTasks] = useState<TaskWithPriority[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrioritize = async () => {
    if (tasks.length < 3) {
      setPrioritizedTasks([]);
      setRecommendations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: PrioritizationRequest = {
        tasks,
        energyLevel,
        availableTime,
        userPreferences: 'Focus on high-impact tasks that match my energy level'
      };

      const response = await AIService.prioritizeTasks(request);
      setPrioritizedTasks(response.prioritizedTasks);
      setRecommendations(response.recommendations);
      onPrioritize?.(response.prioritizedTasks);
    } catch (err) {
      setError('Failed to get AI prioritization. Using fallback method.');
      console.error('AI prioritization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tasks.length >= 3) {
      handlePrioritize();
    } else {
      setPrioritizedTasks([]);
      setRecommendations([]);
    }
  }, [tasks, energyLevel, availableTime]);

  if (tasks.length < 3) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <Brain className="w-5 h-5 text-purple-600 mr-2" />
          AI Task Prioritization
        </h3>
        <p className="text-gray-500 text-sm">Add at least 3 tasks to get AI-powered prioritization suggestions.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Brain className="w-5 h-5 text-purple-600 mr-2" />
          AI Task Prioritization
        </h3>
        <button
          onClick={handlePrioritize}
          disabled={isLoading || tasks.length < 3}
          className="flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
          <p className="text-yellow-700 text-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Analyzing your tasks...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Priority Tasks */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Sparkles className="w-4 h-4 text-yellow-500 mr-2" />
              Top Priority Tasks
            </h4>
            <div className="space-y-2">
              {prioritizedTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">{task.aiReason}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-purple-600">
                      Priority: {task.aiPriority}/10
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">AI Recommendations</h4>
              <div className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border-l-3 border-blue-400">
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Energy Level Insights */}
          <div className="p-3 bg-green-50 rounded-lg border-l-3 border-green-400">
            <p className="text-sm text-gray-700">
              <strong>Energy Level {energyLevel}/10:</strong> {
                energyLevel >= 7 ? 'Perfect for tackling complex, high-impact tasks!' :
                energyLevel >= 4 ? 'Good for moderate tasks. Consider breaking down larger items.' :
                'Focus on lighter, routine tasks. Save challenging work for higher energy times.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPrioritization;
