'use client';

import { useState, useRef } from 'react';
import { useCycle } from '@/contexts/CycleContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOffline } from '@/hooks/useOffline';

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile = ({ onClose }: UserProfileProps) => {
  const { t } = useLanguage();
  const { cycleSettings, isCycleTrackingEnabled, setCycleSettings, disableCycleTracking } = useCycle();
  const { isOnline, storageSize } = useOffline();
  const [activeTab, setActiveTab] = useState<'profile' | 'cycle' | 'settings'>('profile');
  const [profileData, setProfileData] = useState({
    name: 'Training User',
    photoUrl: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    googleSheetsUrl: '',
  });
  const [cycleData, setCycleData] = useState({
    cycleLength: cycleSettings?.cycleLength || 28,
    lastPeriodDate: cycleSettings?.lastPeriodDate?.toISOString().slice(0, 10) || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({ ...prev, photoUrl: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCycleSave = () => {
    if (cycleData.lastPeriodDate) {
      const settings = {
        cycleLength: cycleData.cycleLength,
        lastPeriodDate: new Date(cycleData.lastPeriodDate),
        timezone: profileData.timezone,
      };
      setCycleSettings(settings);
    }
  };

  const handleCycleDisable = () => {
    if (confirm(t('profile.disableCycleConfirm'))) {
      disableCycleTracking();
      setCycleData({ cycleLength: 28, lastPeriodDate: '' });
    }
  };

  const formatStorageSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            👤 {t('profile.title') || 'User Profile'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
            {[
              { id: 'profile', label: t('profile.tabs.profile') || 'Profile', icon: '👤' },
              { id: 'cycle', label: t('profile.tabs.cycle') || 'Cycle', icon: '🔄' },
              { id: 'settings', label: t('profile.tabs.settings') || 'Settings', icon: '⚙️' },
            ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'profile' | 'cycle' | 'settings')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
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
                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                  {profileData.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileData.photoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-slate-500">👤</span>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
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
                    <p className="text-xs text-slate-500 mt-1">{t('profile.photoHint') || 'JPG, PNG up to 5MB'}</p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('profile.name') || 'Name'}
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('profile.timezone') || 'Timezone'}
                  </label>
                  <select
                    value={profileData.timezone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('profile.googleSheetsUrl')}
                </label>
                <input
                  type="url"
                  value={profileData.googleSheetsUrl}
                  onChange={(e) => setProfileData(prev => ({ ...prev, googleSheetsUrl: e.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">{t('profile.googleSheetsHint')}</p>
              </div>
            </div>
          )}

          {activeTab === 'cycle' && (
            <div className="space-y-6">
              {/* Cycle Status */}
              <div className={`p-4 rounded-lg ${
                isCycleTrackingEnabled 
                  ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{isCycleTrackingEnabled ? '✅' : '❌'}</span>
                  <span className={`font-medium ${
                    isCycleTrackingEnabled 
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-slate-600 dark:text-slate-400'
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
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('profile.cycleLength')}
                      </label>
                      <input
                        type="number"
                        min="21"
                        max="35"
                        value={cycleData.cycleLength}
                        onChange={(e) => setCycleData(prev => ({ ...prev, cycleLength: parseInt(e.target.value) }))}
                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('profile.lastPeriodDate')}
                      </label>
                      <input
                        type="date"
                        value={cycleData.lastPeriodDate}
                        onChange={(e) => setCycleData(prev => ({ ...prev, lastPeriodDate: e.target.value }))}
                        className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleCycleSave}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      💾 {t('common.save')}
                    </button>
                    <button
                      onClick={handleCycleDisable}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      🚫 {t('profile.disableCycle')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🔄</div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-2">
                    {t('profile.enableCycleTracking')}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {t('profile.cycleTrackingDescription')}
                  </p>
                  <button
                    onClick={() => setCycleData({ cycleLength: 28, lastPeriodDate: typeof window !== 'undefined' ? new Date().toISOString().slice(0, 10) : '2024-01-15' })}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
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
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">
                  📱 {t('profile.appStatus')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      <span className="font-medium text-slate-900 dark:text-slate-50">
                        {t('profile.connectionStatus')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {isOnline ? t('profile.online') : t('profile.offline')}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">💾</span>
                      <span className="font-medium text-slate-900 dark:text-slate-50">
                        {t('profile.storageUsed')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {formatStorageSize(storageSize.used)} / {formatStorageSize(storageSize.total)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">
                  🔒 {t('profile.privacy')}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">
                        {t('profile.dataCollection')}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('profile.dataCollectionDesc')}
                      </p>
                    </div>
                    <div className="text-green-600">
                      ✅ {t('profile.enabled')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">
                        {t('profile.cycleTracking')}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('profile.cycleTrackingDesc')}
                      </p>
                    </div>
                    <div className={isCycleTrackingEnabled ? 'text-green-600' : 'text-slate-400'}>
                      {isCycleTrackingEnabled ? '✅' : '❌'} {isCycleTrackingEnabled ? t('profile.enabled') : t('profile.disabled')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Data */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">
                  📤 {t('profile.dataExport')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-left">
                    <div className="font-medium text-blue-900 dark:text-blue-200">📊 {t('profile.exportWorkouts')}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">{t('profile.exportWorkoutsDesc')}</div>
                  </button>
                  
                  <button className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-left">
                    <div className="font-medium text-green-900 dark:text-green-200">📈 {t('profile.exportStats')}</div>
                    <div className="text-sm text-green-700 dark:text-green-300">{t('profile.exportStatsDesc')}</div>
                  </button>
                </div>
              </div>
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
