import React, { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Palette, 
  User, 
  Shield, 
  Download, 
  Upload,
  Trash2,
  Save
} from 'lucide-react';
import { useTimer } from '../contexts/TimerContext';

const SettingsView: React.FC = () => {
  const { state: timerState, dispatch } = useTimer();
  
  const [settings, setSettings] = useState({
    // Timer Settings
    focusDuration: timerState.settings.focusDuration,
    shortBreakDuration: timerState.settings.shortBreakDuration,
    longBreakDuration: timerState.settings.longBreakDuration,
    longBreakInterval: timerState.settings.longBreakInterval,
    autoStartBreaks: timerState.settings.autoStartBreaks,
    autoStartFocus: timerState.settings.autoStartFocus,
    
    // Notification Settings
    enableNotifications: true,
    enableSounds: true,
    enableDesktopNotifications: true,
    reminderInterval: 30,
    
    // Appearance Settings
    theme: 'light',
    accentColor: 'blue',
    compactMode: false,
    showSeconds: true,
    
    // Productivity Settings
    weeklyGoal: 25,
    dailyGoal: 5,
    estimationReminders: true,
    insightFrequency: 'weekly',
    
    // Privacy & Data
    shareAnalytics: false,
    dataRetention: 90,
    backupData: true
  });

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        focusDuration: settings.focusDuration,
        shortBreakDuration: settings.shortBreakDuration,
        longBreakDuration: settings.longBreakDuration,
        longBreakInterval: settings.longBreakInterval,
        autoStartBreaks: settings.autoStartBreaks,
        autoStartFocus: settings.autoStartFocus
      }
    });
    
    // Save other settings to localStorage
    localStorage.setItem('cognitask-app-settings', JSON.stringify(settings));
    
    // Show success message (would implement toast notification)
    alert('Settings saved successfully!');
  };

  const handleExportData = () => {
    const data = {
      tasks: JSON.parse(localStorage.getItem('cognitask-tasks') || '[]'),
      sessions: JSON.parse(localStorage.getItem('cognitask-sessions') || '[]'),
      analytics: JSON.parse(localStorage.getItem('cognitask-analytics') || '{}'),
      settings: settings
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cognitask-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('cognitask-tasks');
      localStorage.removeItem('cognitask-sessions');
      localStorage.removeItem('cognitask-analytics');
      localStorage.removeItem('cognitask-app-settings');
      localStorage.removeItem('cognitask-timer-settings');
      alert('All data cleared successfully!');
      window.location.reload();
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const SettingSection = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
        <Icon className="w-5 h-5 text-blue-600 mr-2" />
        {title}
      </h3>
      {children}
    </div>
  );

  const SettingItem = ({ label, description, children }: any) => (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 mr-4">
        <label className="font-medium text-gray-900">{label}</label>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Customize CogniTask to match your productivity style.</p>
        </div>

        <div className="space-y-6">
          {/* Timer Settings */}
          <SettingSection title="Focus Timer" icon={Settings}>
            <div className="space-y-3">
              <SettingItem
                label="Focus Duration"
                description="Length of focus sessions in minutes"
              >
                <select
                  value={settings.focusDuration}
                  onChange={(e) => updateSetting('focusDuration', parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={25}>25 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </SettingItem>
              
              <SettingItem
                label="Short Break"
                description="Length of short breaks in minutes"
              >
                <select
                  value={settings.shortBreakDuration}
                  onChange={(e) => updateSetting('shortBreakDuration', parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3}>3 minutes</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                </select>
              </SettingItem>
              
              <SettingItem
                label="Long Break"
                description="Length of long breaks in minutes"
              >
                <select
                  value={settings.longBreakDuration}
                  onChange={(e) => updateSetting('longBreakDuration', parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                </select>
              </SettingItem>
              
              <SettingItem
                label="Auto-start Breaks"
                description="Automatically start break sessions"
              >
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreaks}
                    onChange={(e) => updateSetting('autoStartBreaks', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </SettingItem>
              
              <SettingItem
                label="Auto-start Focus"
                description="Automatically start focus sessions after breaks"
              >
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoStartFocus}
                    onChange={(e) => updateSetting('autoStartFocus', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </SettingItem>
            </div>
          </SettingSection>

          {/* Notifications */}
          <SettingSection title="Notifications" icon={Bell}>
            <div className="space-y-3">
              <SettingItem
                label="Enable Notifications"
                description="Receive notifications when sessions complete"
              >
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => updateSetting('enableNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </SettingItem>
              
              <SettingItem
                label="Sound Notifications"
                description="Play sounds when sessions complete"
              >
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableSounds}
                    onChange={(e) => updateSetting('enableSounds', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </SettingItem>
              
              <SettingItem
                label="Desktop Notifications"
                description="Show browser notifications"
              >
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableDesktopNotifications}
                    onChange={(e) => updateSetting('enableDesktopNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </SettingItem>
            </div>
          </SettingSection>

          {/* Appearance */}
          <SettingSection title="Appearance" icon={Palette}>
            <div className="space-y-3">
              <SettingItem
                label="Theme"
                description="Choose your preferred theme"
              >
                <select
                  value={settings.theme}
                  onChange={(e) => updateSetting('theme', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </SettingItem>
              
              <SettingItem
                label="Accent Color"
                description="Choose your accent color"
              >
                <select
                  value={settings.accentColor}
                  onChange={(e) => updateSetting('accentColor', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="green">Green</option>
                  <option value="orange">Orange</option>
                </select>
              </SettingItem>
              
              <SettingItem
                label="Compact Mode"
                description="Use a more compact interface"
              >
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={(e) => updateSetting('compactMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </SettingItem>
            </div>
          </SettingSection>

          {/* Productivity Goals */}
          <SettingSection title="Productivity Goals" icon={User}>
            <div className="space-y-3">
              <SettingItem
                label="Daily Focus Goal"
                description="Target number of focus sessions per day"
              >
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.dailyGoal}
                  onChange={(e) => updateSetting('dailyGoal', parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </SettingItem>
              
              <SettingItem
                label="Weekly Focus Goal"
                description="Target number of focus sessions per week"
              >
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={settings.weeklyGoal}
                  onChange={(e) => updateSetting('weeklyGoal', parseInt(e.target.value) || 5)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </SettingItem>
              
              <SettingItem
                label="Estimation Reminders"
                description="Remind to estimate task time"
              >
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.estimationReminders}
                    onChange={(e) => updateSetting('estimationReminders', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </SettingItem>
            </div>
          </SettingSection>

          {/* Data & Privacy */}
          <SettingSection title="Data & Privacy" icon={Shield}>
            <div className="space-y-3">
              <SettingItem
                label="Export Data"
                description="Download all your data as JSON"
              >
                <button
                  onClick={handleExportData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </SettingItem>
              
              <SettingItem
                label="Clear All Data"
                description="Permanently delete all your data"
              >
                <button
                  onClick={handleClearData}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Data</span>
                </button>
              </SettingItem>
              
              <SettingItem
                label="Data Retention"
                description="How long to keep completed tasks"
              >
                <select
                  value={settings.dataRetention}
                  onChange={(e) => updateSetting('dataRetention', parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>6 months</option>
                  <option value={365}>1 year</option>
                  <option value={-1}>Forever</option>
                </select>
              </SettingItem>
            </div>
          </SettingSection>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;