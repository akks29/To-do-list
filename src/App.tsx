import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import FocusTimer from './components/FocusTimer';
import PlanningView from './components/PlanningView';
import InsightsView from './components/InsightsView';
import SettingsView from './components/SettingsView';
import { TaskProvider } from './contexts/TaskContext';
import { TimerProvider } from './contexts/TimerContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <TaskProvider>
      <TimerProvider>
        <AnalyticsProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 flex">
              <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
              
              <div className="flex-1 flex flex-col">
                <main className="flex-1 overflow-hidden">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tasks" element={<TaskManager />} />
                    <Route path="/timer" element={<FocusTimer />} />
                    <Route path="/planning" element={<PlanningView />} />
                    <Route path="/insights" element={<InsightsView />} />
                    <Route path="/settings" element={<SettingsView />} />
                  </Routes>
                </main>
              </div>
            </div>
          </Router>
        </AnalyticsProvider>
      </TimerProvider>
    </TaskProvider>
  );
}

export default App;