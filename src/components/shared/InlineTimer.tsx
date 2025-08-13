import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

interface InlineTimerProps {
  taskTitle: string;
  estimatedTime: number;
  onComplete: (actualTime: number) => void;
  onCancel: () => void;
}

const InlineTimer: React.FC<InlineTimerProps> = ({
  taskTitle,
  estimatedTime,
  onComplete,
  onCancel
}) => {
  console.log('InlineTimer rendered for task:', taskTitle);
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    const actualMinutes = Math.ceil(timeElapsed / 60);
    onComplete(actualMinutes);
  };

  const handleReset = () => {
    setTimeElapsed(0);
    setIsRunning(false);
    setIsPaused(false);
  };

  const progressPercentage = Math.min((timeElapsed / (estimatedTime * 60)) * 100, 100);

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Focus Session: {taskTitle}</h4>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          Cancel
        </button>
      </div>

      <div className="text-center mb-4">
        <div className="text-3xl font-mono font-bold text-blue-600 mb-2">
          {formatTime(timeElapsed)}
        </div>
        <div className="text-sm text-gray-600">
          Estimated: {estimatedTime}m | Actual: {Math.ceil(timeElapsed / 60)}m
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <div className="flex justify-center space-x-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={handleResume}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Complete</span>
            </button>
          </>
        )}
        <button
          onClick={handleReset}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

export default InlineTimer;
