'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCycle } from '@/contexts/CycleContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOffline } from '@/hooks/useOffline';
import { useNotifications } from '@/contexts/NotificationContext';
import { exportAllData } from '@/lib/export-utils';
import { generateDummyData } from '@/lib/generate-dummy-data';

interface UserProfileProps {
  onClose: () => void;
  onPhotoUpdate?: (photoUrl: string | null) => void;
}

export const UserProfile = ({ onClose, onPhotoUpdate }: UserProfileProps) => {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { cycleSettings, isCycleTrackingEnabled, setCycleSettings, disableCycleTracking } = useCycle();
  const { isOnline, storageSize } = useOffline();
  const { settings: notificationSettings, updateSettings } = useNotifications();
  const [activeTab, setActiveTab] = useState<'profile' | 'cycle' | 'settings' | 'export'>('profile');
  const [profileData, setProfileData] = useState({
    googleName: session?.user?.name || 'Training User',
    displayName: session?.user?.name?.split(' ')[0] || 'Training User',
    photoUrl: '',
    timezone: 'UTC',
    googleSheetsUrl: '',
  });
  const [cycleData, setCycleData] = useState({
    cycleLength: cycleSettings?.cycleLength || 28,
    lastPeriodDate: cycleSettings?.lastPeriodDate?.toISOString().slice(0, 10) || '',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [testReminderEnabled, setTestReminderEnabled] = useState(false);
  const [testReminderInterval, setTestReminderInterval] = useState(4);
  const [testReminderUnit, setTestReminderUnit] = useState<'days' | 'weeks' | 'months'>('weeks');
  const [isLoadingTestReminder, setIsLoadingTestReminder] = useState(true);
  const [isSavingTestReminder, setIsSavingTestReminder] = useState(false);
  
  // Check if we're in development mode
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost'));

  // Load test reminder settings
  useEffect(() => {
    const loadTestReminderSettings = async () => {
      try {
        const response = await fetch('/api/test-reminder');
        if (response.ok) {
          const data = await response.json();
          setTestReminderEnabled(data.testReminderEnabled || false);
          setTestReminderInterval(data.testReminderInterval || 4);
          setTestReminderUnit((data.testReminderUnit as 'days' | 'weeks' | 'months') || 'weeks');
        }
      } catch (error) {
        console.error('Error loading test reminder settings:', error);
      } finally {
        setIsLoadingTestReminder(false);
      }
    };
    loadTestReminderSettings();
  }, []);

  const handleSaveTestReminder = async () => {
    setIsSavingTestReminder(true);
    try {
      const response = await fetch('/api/test-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: testReminderEnabled,
          interval: testReminderEnabled ? testReminderInterval : null,
          unit: testReminderEnabled ? testReminderUnit : null,
        }),
      });
      if (response.ok) {
        // Success - settings saved
      } else {
        alert(t('workouts.errors.saveTestReminderFailed') || 'Failed to save test reminder settings');
      }
    } catch (error) {
      console.error('Error saving test reminder settings:', error);
      alert(t('workouts.errors.saveTestReminderError') || 'Error saving test reminder settings');
    } finally {
      setIsSavingTestReminder(false);
    }
  };

  // Load profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Load user profile data
        const profileResponse = await fetch('/api/user-profile', { credentials: 'include' })
        if (profileResponse.ok) {
          const profile = await profileResponse.json()
          if (profile) {
            setProfileData(prev => ({
              ...prev,
              photoUrl: profile.photoUrl || '',
              timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              googleSheetsUrl: profile.googleSheetsUrl || '',
            }))
          }
        }
        
        // Load user data (Google name and display name)
        const userResponse = await fetch('/api/user', { credentials: 'include' })
        if (userResponse.ok) {
          const user = await userResponse.json()
          if (user) {
            setProfileData(prev => ({
              ...prev,
              googleName: user.name || 'Training User',
              displayName: user.name?.split(' ')[0] || 'Training User',
            }))
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error)
        // Set timezone on client side
        setProfileData(prev => ({
          ...prev,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }))
      }
    }
    
    loadProfileData()
  }, [])

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const photoUrl = e.target?.result as string;
        setProfileData(prev => ({ ...prev, photoUrl }));
        
        // Update parent component's avatar
        if (onPhotoUpdate) {
          onPhotoUpdate(photoUrl);
        }
        
        // Save to database
        try {
          await fetch('/api/user-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              photoUrl,
              cycleAvgLengthDays: cycleData.cycleLength,
              lastPeriodDate: cycleData.lastPeriodDate,
              timezone: profileData.timezone,
              googleSheetsUrl: profileData.googleSheetsUrl,
            })
          })
        } catch (error) {
          console.error('Error saving photo:', error)
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCycleSave = async () => {
    if (cycleData.lastPeriodDate) {
      const settings = {
        cycleLength: cycleData.cycleLength,
        lastPeriodDate: new Date(cycleData.lastPeriodDate),
        timezone: profileData.timezone,
      };
      await setCycleSettings(settings);
    }
  };

  const handleCycleDisable = async () => {
    if (confirm(t('profile.disableCycleConfirm'))) {
      await disableCycleTracking();
      setCycleData({ cycleLength: 28, lastPeriodDate: '' });
    }
  };


  const formatStorageSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleImportData = async (file: File) => {
    if (!isDevelopment) {
      setExportError('Import is only available in development mode');
      return;
    }

    setIsImporting(true);
    setExportError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate basic structure
      if (!data.metadata || !data.metadata.schemaVersion) {
        throw new Error('Invalid export file: missing metadata or schemaVersion');
      }

      // For now, just log the data structure
      // TODO: Implement actual import logic
      if (process.env.NODE_ENV === 'development') {
        console.log('Importing data:', {
          schemaVersion: data.metadata.schemaVersion,
          workouts: data.workouts?.length || 0,
          events: data.events?.length || 0,
          exercises: data.exercises?.length || 0,
        });
      }

      // Show success message
      alert(
        `Import preview:\n` +
        `- Schema Version: ${data.metadata.schemaVersion}\n` +
        `- Workouts: ${data.workouts?.length || 0}\n` +
        `- Events: ${data.events?.length || 0}\n` +
        `- Exercises: ${data.exercises?.length || 0}\n` +
        `\nNote: Actual import functionality will be implemented later.`
      );

      setImportFile(null);
      if (importFileInputRef.current) {
        importFileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import data';
      setExportError(errorMessage);
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-uc-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-uc-dark-bg rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-uc-purple/20">
          <h2 className="text-2xl font-bold text-uc-text-light">
            👤 {t('profile.title') || 'User Profile'}
          </h2>
          <button
            onClick={onClose}
            className="text-uc-text-muted hover:text-uc-text-light transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-uc-purple/20">
            {[
              { id: 'profile', label: t('profile.tabs.profile') || 'Profile', icon: '👤' },
              { id: 'cycle', label: t('profile.tabs.cycle') || 'Cycle', icon: '🔄' },
              { id: 'settings', label: t('profile.tabs.settings') || 'Settings', icon: '⚙️' },
              { id: 'export', label: t('profile.tabs.export') || 'Export', icon: '📤' },
            ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'profile' | 'cycle' | 'settings' | 'export')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-uc-mustard border-b-2 border-uc-mustard bg-uc-purple/20'
                  : 'text-uc-text-muted hover:text-uc-text-light hover:bg-uc-dark-bg/50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-uc-black/50 border border-uc-purple/20 flex items-center justify-center overflow-hidden">
                  {profileData.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileData.photoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-uc-text-muted">👤</span>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-xl font-medium transition-colors shadow-lg"
                  >
                    📷 {t('profile.uploadPhoto') || 'Upload Photo'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                    <p className="text-xs text-uc-text-muted mt-1">{t('profile.photoHint') || 'JPG, PNG up to 5MB'}</p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-1">
                    Google Name
                  </label>
                  <input
                    type="text"
                    value={profileData.googleName}
                    readOnly
                    className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black/50 text-uc-text-muted cursor-not-allowed"
                    placeholder="Google account name"
                  />
                  <p className="text-xs text-uc-text-muted mt-1">
                    This is your full name from Google account
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    readOnly
                    className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black/50 text-uc-text-muted cursor-not-allowed"
                    placeholder="First name"
                  />
                  <p className="text-xs text-uc-text-muted mt-1">
                    This is your first name used in the app
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-uc-text-light mb-1">
                    {t('profile.timezone') || 'Timezone'}
                  </label>
                  <select
                    value={profileData.timezone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black/50 text-uc-text-light focus:ring-2 focus:ring-uc-mustard focus:border-uc-mustard"
                  >
                    <option value="Europe/Warsaw">Europe/Warsaw</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                  </select>
                </div>
              </div>

              {/* Google Sheets Integration */}
              <div>
                <label className="block text-sm font-medium text-uc-text-light mb-1">
                  {t('profile.googleSheetsUrl')}
                </label>
                <input
                  type="url"
                  value={profileData.googleSheetsUrl}
                  onChange={(e) => setProfileData(prev => ({ ...prev, googleSheetsUrl: e.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black/50 text-uc-text-light focus:ring-2 focus:ring-uc-mustard focus:border-uc-mustard"
                />
                <p className="text-xs text-uc-text-muted mt-1">{t('profile.googleSheetsHint')}</p>
              </div>
            </div>
          )}

          {activeTab === 'cycle' && (
            <div className="space-y-6">
              {/* Cycle Status */}
              <div className={`p-4 rounded-xl ${
                isCycleTrackingEnabled 
                  ? 'bg-uc-success/20 border border-uc-success/30'
                  : 'bg-uc-dark-bg/50 border border-uc-purple/20'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{isCycleTrackingEnabled ? '✅' : '❌'}</span>
                  <span className={`font-medium ${
                    isCycleTrackingEnabled 
                      ? 'text-uc-success'
                      : 'text-uc-text-muted'
                  }`}>
                    {isCycleTrackingEnabled ? t('profile.cycleEnabled') : t('profile.cycleDisabled')}
                  </span>
                </div>
              </div>

              {/* Cycle Settings */}
              {isCycleTrackingEnabled ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-uc-text-light mb-1">
                        {t('profile.cycleLength')}
                      </label>
                      <input
                        type="number"
                        min="21"
                        max="35"
                        value={cycleData.cycleLength}
                        onChange={(e) => setCycleData(prev => ({ ...prev, cycleLength: parseInt(e.target.value) }))}
                        className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black/50 text-uc-text-light focus:ring-2 focus:ring-uc-mustard focus:border-uc-mustard"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-uc-text-light mb-1">
                        {t('profile.lastPeriodDate')}
                      </label>
                      <input
                        type="date"
                        value={cycleData.lastPeriodDate}
                        onChange={(e) => setCycleData(prev => ({ ...prev, lastPeriodDate: e.target.value }))}
                        className="w-full border border-uc-purple/20 rounded-xl px-3 py-2 bg-uc-black/50 text-uc-text-light focus:ring-2 focus:ring-uc-mustard focus:border-uc-mustard"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleCycleSave}
                      className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-xl font-medium transition-colors shadow-lg"
                    >
                      💾 {t('common.save')}
                    </button>
                    <button
                      onClick={handleCycleDisable}
                      className="bg-uc-alert hover:bg-uc-alert/90 text-uc-text-light px-4 py-2 rounded-xl font-medium transition-colors shadow-lg"
                    >
                      🚫 {t('profile.disableCycle')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔄</div>
                  <h3 className="text-lg font-medium text-uc-text-light mb-2">
                    {t('profile.enableCycleTracking')}
                  </h3>
                  <p className="text-uc-text-muted mb-4">
                    {t('profile.cycleTrackingDescription')}
                  </p>
                  <button
                    onClick={() => setCycleData({ cycleLength: 28, lastPeriodDate: typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : '2024-01-15' })}
                    className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
                  >
                    ✅ {t('profile.enableCycle')}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* App Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-uc-text-light">
                  📱 {t('profile.appStatus')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-uc-success' : 'bg-uc-mustard'}`}></span>
                      <span className="font-medium text-uc-text-light">
                        {t('profile.connectionStatus')}
                      </span>
                    </div>
                    <p className="text-sm text-uc-text-muted">
                      {isOnline ? t('profile.online') : t('profile.offline')}
                    </p>
                  </div>

                  <div className="p-4 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">💾</span>
                      <span className="font-medium text-uc-text-light">
                        {t('profile.storageUsed')}
                      </span>
                    </div>
                    <p className="text-sm text-uc-text-muted">
                      {formatStorageSize(storageSize.used)} / {formatStorageSize(storageSize.total)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-uc-text-light">
                  🔒 {t('profile.privacy')}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <div>
                      <p className="font-medium text-uc-text-light">
                        {t('profile.dataCollection')}
                      </p>
                      <p className="text-sm text-uc-text-muted">
                        {t('profile.dataCollectionDesc')}
                      </p>
                    </div>
                    <div className="text-uc-success">
                      ✅ {t('profile.enabled')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <div>
                      <p className="font-medium text-uc-text-light">
                        {t('profile.cycleTracking')}
                      </p>
                      <p className="text-sm text-uc-text-muted">
                        {t('profile.cycleTrackingDesc')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={isCycleTrackingEnabled ? 'text-uc-success' : 'text-uc-text-muted'}>
                        {isCycleTrackingEnabled ? '✅' : '❌'} {isCycleTrackingEnabled ? t('profile.enabled') : t('profile.disabled')}
                      </div>
                      {!isCycleTrackingEnabled && (
                        <button
                          onClick={() => {
                            // Reset consent choice to show consent modal again
                            if (typeof window !== 'undefined') {
                              localStorage.removeItem('cycle-consent-declined')
                            }
                            // Force page reload to trigger consent modal
                            window.location.reload()
                          }}
                          className="px-3 py-1 text-xs bg-uc-purple hover:bg-uc-purple/90 text-uc-text-light rounded-xl transition-colors"
                        >
                          {t('profile.setupCycle')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <div>
                      <p className="font-medium text-uc-text-light">
                        {t('profile.latePeriodNotifications')}
                      </p>
                      <p className="text-sm text-uc-text-muted">
                        {t('profile.latePeriodNotificationsDesc')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={notificationSettings.latePeriodNotificationsEnabled}
                        onChange={(e) => updateSettings({
                          ...notificationSettings,
                          latePeriodNotificationsEnabled: e.target.checked
                        })}
                        className="h-4 w-4 text-uc-purple focus:ring-uc-purple border-uc-purple/20 rounded"
                      />
                      <span className={notificationSettings.latePeriodNotificationsEnabled ? 'text-uc-success' : 'text-uc-text-muted'}>
                        {notificationSettings.latePeriodNotificationsEnabled ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>

                  {/* Workout Inactivity Notifications */}
                  <div className="p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-uc-text-light">
                          {t('profile.workoutInactivityNotifications') || 'Workout Inactivity Reminders'}
                        </p>
                        <p className="text-sm text-uc-text-muted">
                          {t('profile.workoutInactivityNotificationsDesc') || 'Get reminded when you haven\'t logged a workout in a while'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={notificationSettings.workoutInactivityEnabled || false}
                          onChange={(e) => updateSettings({
                            ...notificationSettings,
                            workoutInactivityEnabled: e.target.checked
                          })}
                          className="h-4 w-4 text-uc-purple focus:ring-uc-purple border-uc-purple/20 rounded"
                        />
                        <span className={notificationSettings.workoutInactivityEnabled ? 'text-uc-success' : 'text-uc-text-muted'}>
                          {notificationSettings.workoutInactivityEnabled ? '✅' : '❌'}
                        </span>
                      </div>
                    </div>
                    {notificationSettings.workoutInactivityEnabled && (
                      <div className="mt-3 pt-3 border-t border-uc-purple/20">
                        <label className="block text-sm font-medium text-uc-text-light mb-2">
                          {t('profile.workoutInactivityDays') || 'Days of inactivity before reminder'}
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="1"
                            max="14"
                            value={notificationSettings.workoutInactivityDays || 3}
                            onChange={(e) => updateSettings({
                              ...notificationSettings,
                              workoutInactivityDays: parseInt(e.target.value) || 3
                            })}
                            className="w-20 bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                          />
                          <span className="text-sm text-uc-text-muted">
                            {t('profile.days') || 'days'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Test Reminder Settings */}
                  <div className="p-3 bg-uc-black/50 rounded-xl border border-uc-purple/20">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-uc-text-light">
                          {t('profile.testReminderNotifications') || 'Test Reminders'}
                        </p>
                        <p className="text-sm text-uc-text-muted">
                          {t('profile.testReminderNotificationsDesc') || 'Get reminded when you haven\'t performed a fingerboard test in a while'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={testReminderEnabled}
                          onChange={(e) => {
                            setTestReminderEnabled(e.target.checked);
                            if (e.target.checked) {
                              // Auto-save when enabled
                              setTimeout(() => handleSaveTestReminder(), 100);
                            } else {
                              // Auto-save when disabled
                              setTimeout(() => handleSaveTestReminder(), 100);
                            }
                          }}
                          disabled={isLoadingTestReminder || isSavingTestReminder}
                          className="h-4 w-4 text-uc-purple focus:ring-uc-purple border-uc-purple/20 rounded"
                        />
                        <span className={testReminderEnabled ? 'text-uc-success' : 'text-uc-text-muted'}>
                          {testReminderEnabled ? '✅' : '❌'}
                        </span>
                      </div>
                    </div>
                    {testReminderEnabled && (
                      <div className="mt-3 pt-3 border-t border-uc-purple/20">
                        <label className="block text-sm font-medium text-uc-text-light mb-2">
                          {t('profile.testReminderInterval') || 'Remind me to retest in'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={testReminderInterval}
                            onChange={(e) => {
                              const value = Math.max(1, Math.min(12, parseInt(e.target.value) || 1));
                              setTestReminderInterval(value);
                              setTimeout(() => handleSaveTestReminder(), 500);
                            }}
                            disabled={isSavingTestReminder}
                            className="w-20 bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                          />
                          <select
                            value={testReminderUnit}
                            onChange={(e) => {
                              setTestReminderUnit(e.target.value as 'days' | 'weeks' | 'months');
                              setTimeout(() => handleSaveTestReminder(), 100);
                            }}
                            disabled={isSavingTestReminder}
                            className="bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                          >
                            <option value="days">{t('profile.days') || 'days'}</option>
                            <option value="weeks">{t('profile.weeks') || 'weeks'}</option>
                            <option value="months">{t('profile.months') || 'months'}</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Export Data */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-uc-text-light">
                  📤 {t('profile.dataExport')}
                </h3>
                
                <p className="text-sm text-uc-text-muted">
                  {t('profile.dataExportDescription') || 'Export all your training data, events, exercises, and more in JSON or CSV format.'}
                </p>
                
                {exportError && (
                  <div className="p-3 bg-uc-alert/20 border border-uc-alert/30 rounded-xl text-sm text-uc-alert">
                    {exportError}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      setIsExporting(true);
                      setExportError(null);
                      try {
                        await exportAllData('json');
                      } catch (error) {
                        setExportError(t('profile.exportError') || 'Failed to export data. Please try again.');
                        console.error('Export error:', error);
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                    disabled={isExporting}
                    className="p-3 bg-uc-purple/20 border border-uc-purple/30 rounded-xl hover:bg-uc-purple/30 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-uc-text-light">
                      {isExporting ? '⏳' : '📊'} {t('profile.exportJSON') || 'Export as JSON'}
                    </div>
                    <div className="text-sm text-uc-text-muted">
                      {t('profile.exportJSONDesc') || 'Download all your data as JSON file'}
                    </div>
                  </button>
                  
                  <button
                    onClick={async () => {
                      setIsExporting(true);
                      setExportError(null);
                      try {
                        await exportAllData('csv');
                      } catch (error) {
                        setExportError(t('profile.exportError') || 'Failed to export data. Please try again.');
                        console.error('Export error:', error);
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                    disabled={isExporting}
                    className="p-3 bg-uc-success/20 border border-uc-success/30 rounded-xl hover:bg-uc-success/30 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-uc-text-light">
                      {isExporting ? '⏳' : '📈'} {t('profile.exportCSV') || 'Export as CSV'}
                    </div>
                    <div className="text-sm text-uc-text-muted">
                      {t('profile.exportCSVDesc') || 'Download all your data as CSV file'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Development Tools - Only visible in development */}
              {isDevelopment && (
                <div className="space-y-4 mt-8 pt-8 border-t border-uc-purple/20">
                  <h3 className="text-lg font-medium text-uc-text-light">
                    🛠️ Development Tools
                  </h3>
                  
                  <p className="text-sm text-uc-text-muted">
                    These tools are only available in development mode for testing purposes.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Generate Dummy Data */}
                    <button
                      onClick={() => {
                        const dummyData = generateDummyData({
                          workoutsCount: 30,
                          eventsCount: 10,
                          exercisesCount: 15,
                          routinesCount: 5,
                          tagsCount: 8,
                          plansCount: 12,
                          fingerboardProtocolsCount: 3,
                          fingerboardTestingProtocolsCount: 2,
                          fingerboardTestResultsCount: 20,
                        });
                        
                        const jsonString = JSON.stringify(dummyData, null, 2);
                        const blob = new Blob([jsonString], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `treniren-dummy-data-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                      className="p-3 bg-uc-purple/20 border border-uc-purple/30 rounded-xl hover:bg-uc-purple/30 text-left transition-colors"
                    >
                      <div className="font-medium text-uc-text-light">
                        🎲 Generate Dummy Data
                      </div>
                      <div className="text-sm text-uc-text-muted">
                        Create and download sample data for testing
                      </div>
                    </button>
                    
                    {/* Import Dummy Data to Database */}
                    <button
                      onClick={async () => {
                        if (!confirm(t('workouts.errors.importDummyDataConfirm') || 'This will import dummy data directly into your database. Continue?')) {
                          return;
                        }
                        
                        setIsImporting(true);
                        setExportError(null);
                        
                        try {
                          const response = await fetch('/api/import/dummy-data', {
                            method: 'POST',
                          });
                          
                          const data = await response.json();
                          
                          if (!response.ok) {
                            throw new Error(data.error || data.message || 'Failed to import dummy data');
                          }
                          
                          alert(
                            `Dummy data imported successfully!\n\n` +
                            `- Tags: ${data.results.tags}\n` +
                            `- Exercises: ${data.results.exercises}\n` +
                            `- Workouts: ${data.results.workouts}\n` +
                            `- Events: ${data.results.events}\n` +
                            `- Routines: ${data.results.routines}\n` +
                            `- Plans: ${data.results.plans}\n` +
                            `- Fingerboard Protocols: ${data.results.fingerboardProtocols}\n` +
                            `- Testing Protocols: ${data.results.fingerboardTestingProtocols}\n` +
                            `- Test Results: ${data.results.fingerboardTestResults}\n\n` +
                            `Refresh the page to see your new data!`
                          );
                          
                          // Optionally refresh the page
                          window.location.reload();
                        } catch (error) {
                          const errorMessage = error instanceof Error ? error.message : 'Failed to import dummy data';
                          setExportError(errorMessage);
                          console.error('Import error:', error);
                        } finally {
                          setIsImporting(false);
                        }
                      }}
                      disabled={isImporting}
                      className="p-3 bg-uc-mustard/20 border border-uc-mustard/30 rounded-xl hover:bg-uc-mustard/30 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-uc-text-light">
                        {isImporting ? '⏳' : '🚀'} Import Dummy Data to DB
                      </div>
                      <div className="text-sm text-uc-text-muted">
                        {isImporting ? 'Importing...' : 'Import generated data directly to database (one-time)'}
                      </div>
                    </button>
                    
                    {/* Import Data (Development) */}
                    <div>
                      <input
                        ref={importFileInputRef}
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImportFile(file);
                          }
                        }}
                        className="hidden"
                      />
                      <button
                        onClick={() => {
                          if (importFile) {
                            handleImportData(importFile);
                          } else {
                            importFileInputRef.current?.click();
                          }
                        }}
                        disabled={isImporting}
                        className="w-full p-3 bg-uc-mustard/20 border border-uc-mustard/30 rounded-xl hover:bg-uc-mustard/30 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="font-medium text-uc-text-light">
                          {isImporting ? '⏳' : '📥'} {importFile ? 'Import Selected File' : 'Import Data (Dev)'}
                        </div>
                        <div className="text-sm text-uc-text-muted">
                          {importFile ? importFile.name : 'Import JSON file (development only)'}
                        </div>
                      </button>
                      {importFile && (
                        <button
                          onClick={() => {
                            setImportFile(null);
                            if (importFileInputRef.current) {
                              importFileInputRef.current.value = '';
                            }
                          }}
                          className="mt-2 text-xs text-uc-text-muted hover:text-uc-text-light"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
          >
            {t('common.close')}
          </button>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            💾 {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};
