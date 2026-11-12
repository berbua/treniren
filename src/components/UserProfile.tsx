'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCycle } from '@/contexts/CycleContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOffline } from '@/hooks/useOffline';
import { useNotifications } from '@/contexts/NotificationContext';
import { notificationService } from '@/lib/notification-service';
import { exportAllData } from '@/lib/export-utils';
import { generateDummyData } from '@/lib/generate-dummy-data';
import { useCsrfToken } from '@/hooks/useCsrfToken';
import { toLocalDateString, toPeriodDateString } from '@/lib/date-utils';
import { useToast } from '@/contexts/ToastContext';
import { Button, Card, EmptyState, Icon, IconName, Input, Label, Overline, SegmentedControl, Select, Spinner, inputClasses } from '@/components/ui';

interface UserProfileProps {
  onClose: () => void;
  onPhotoUpdate?: (photoUrl: string | null) => void;
  initialTab?: 'profile' | 'cycle' | 'settings' | 'export';
}

type ProfileTab = 'profile' | 'cycle' | 'settings' | 'export';

export const UserProfile = ({ onClose, onPhotoUpdate, initialTab = 'profile' }: UserProfileProps) => {
  const { data: session } = useSession();
  const { t, language } = useLanguage();
  const { cycleSettings, isCycleTrackingEnabled, setCycleSettings, disableCycleTracking } = useCycle();
  const { isOnline, storageSize } = useOffline();
  const { settings: notificationSettings, updateSettings } = useNotifications();
  const { getToken } = useCsrfToken();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [profileData, setProfileData] = useState({
    googleName: session?.user?.name || 'Training User',
    // Saved nickname; empty means the first word of the Google name is used
    displayName: '',
    photoUrl: '',
    timezone: 'UTC',
    googleSheetsUrl: '',
  });
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [cycleData, setCycleData] = useState({
    cycleLength: cycleSettings?.cycleLength || 28,
    lastPeriodDate: cycleSettings?.lastPeriodDate ? toPeriodDateString(cycleSettings.lastPeriodDate) : '',
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
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isPushBlocked, setIsPushBlocked] = useState(false);
  const [showDisableCycleConfirm, setShowDisableCycleConfirm] = useState(false);
  
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

  // Check push subscription status
  useEffect(() => {
    const checkPushSubscription = async () => {
      try {
        const subscribed = await notificationService.isSubscribedToPush();
        setIsPushSubscribed(subscribed);
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }
    };
    checkPushSubscription();
    if ('Notification' in window && Notification.permission === 'denied') {
      setIsPushBlocked(true);
    }
  }, []);

  const handleTogglePushNotifications = async () => {
    setIsSubscribing(true);
    try {
      if (isPushSubscribed) {
        // Unsubscribe
        const success = await notificationService.unsubscribeFromPush();
        if (success) {
          setIsPushSubscribed(false);
          updateSettings({
            ...notificationSettings,
            pushNotificationsEnabled: false
          });
        }
      } else {
        // Subscribe
        // Check current permission status
        if ('Notification' in window) {
          const currentPermission = Notification.permission;
          
          if (currentPermission === 'denied') {
            setIsPushBlocked(true);
            setIsSubscribing(false);
            return;
          }
        } else {
          alert('Notifications are not supported in this browser');
          setIsSubscribing(false);
          return;
        }
        
        if (typeof notificationService.subscribeToPush !== 'function') {
          alert('Error: subscribeToPush is not available. This might be a cache issue. Please restart the dev server.');
          setIsSubscribing(false);
          return;
        }
        
        const success = await notificationService.subscribeToPush();
        if (success) {
          setIsPushSubscribed(true);
          updateSettings({
            ...notificationSettings,
            pushNotificationsEnabled: true
          });
        } else {
          alert(t('profile.pushSubscriptionFailed') || 'Failed to enable push notifications. Please check your browser settings and console for errors.');
        }
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      alert(t('profile.pushSubscriptionError') || 'Error enabling push notifications. Check console for details.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSaveTestReminder = async () => {
    setIsSavingTestReminder(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/test-reminder', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
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
              displayName: user.nickname || '',
            }))
            setMemberSince(user.createdAt || null)
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
          const token = await getToken();
          await fetch('/api/user-profile', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-csrf-token': token,
            },
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

  const handleProfileSave = async () => {
    setIsSavingProfile(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        credentials: 'include',
        body: JSON.stringify({
          nickname: profileData.displayName.trim(),
          timezone: profileData.timezone,
          googleSheetsUrl: profileData.googleSheetsUrl,
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to save profile: ${response.status}`);
      }
      // The user menu shows the display name; let it update without a reload
      window.dispatchEvent(new CustomEvent('display-name-changed', { detail: profileData.displayName.trim() || null }));
      showSuccess(t('profile.saved') || 'Profile saved');
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      showError(t('profile.saveFailed') || 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
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
    setShowDisableCycleConfirm(false);
    await disableCycleTracking();
    setCycleData((prev) => ({ ...prev, lastPeriodDate: '' }));
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

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    setExportError(null);
    try {
      await exportAllData(format);
    } catch (error) {
      setExportError(t('profile.exportError') || 'Failed to export data. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const firstName = profileData.googleName.split(' ')[0];
  const shownName = profileData.displayName.trim() || firstName;
  const initial = (shownName || '?').charAt(0).toUpperCase();
  const memberSinceLabel = memberSince
    ? new Date(memberSince).toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-GB', { month: 'long', year: 'numeric' })
    : null;
  const pushSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  // Slider spans 21–35 but never hides a saved length outside that range
  const cycleMin = Math.min(21, cycleData.cycleLength || 21);
  const cycleMax = Math.max(35, cycleData.cycleLength || 35);

  const tabs: { value: ProfileTab; label: string }[] = [
    { value: 'profile', label: t('profile.tabs.profile') || 'Profile' },
    { value: 'cycle', label: t('profile.tabs.cycle') || 'Cycle' },
    { value: 'settings', label: t('profile.tabs.settings') || 'Settings' },
    { value: 'export', label: t('profile.tabs.export') || 'Export' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar photoUrl={profileData.photoUrl} initial={initial} className="size-14 text-2xl" />
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold leading-tight text-uc-text truncate">{shownName}</h1>
          <p className="text-[13px] text-uc-text-muted">
            {memberSinceLabel
              ? `${t('profile.memberSince') || 'Member since'} ${memberSinceLabel}`
              : t('profile.description') || 'Manage your profile settings, cycle tracking, and app preferences'}
          </p>
        </div>
      </div>

      <SegmentedControl
        options={tabs}
        value={activeTab}
        onChange={setActiveTab}
        ariaLabel={t('profile.title') || 'User Profile'}
        equalWidth={false}
      />

      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar photoUrl={profileData.photoUrl} initial={initial} className="size-20 text-3xl" />
            <div>
              <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                <Icon name="user" /> {t('profile.uploadPhoto') || 'Upload Photo'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <p className="mt-1.5 text-xs text-uc-text-muted">{t('profile.photoHint') || 'JPG, PNG up to 5MB'}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="profile-google-name">{t('profile.googleName') || 'Google name'}</Label>
            <Input
              id="profile-google-name"
              type="text"
              value={profileData.googleName}
              readOnly
              className="border-dashed bg-transparent text-uc-text-muted cursor-not-allowed"
            />
            <p className="mt-1.5 text-xs text-uc-text-muted">{t('profile.googleNameHint') || 'Your full name from your Google account'}</p>
          </div>

          <div>
            <Label htmlFor="profile-display-name">{t('profile.displayName') || 'Display name'}</Label>
            <Input
              id="profile-display-name"
              type="text"
              value={profileData.displayName}
              onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder={firstName}
              maxLength={50}
            />
            <p className="mt-1.5 text-xs text-uc-text-muted">{t('profile.displayNameHint') || 'Your first name, used in the app'}</p>
          </div>

          <div>
            <Label htmlFor="profile-timezone">{t('profile.timezone') || 'Timezone'}</Label>
            <Select
              id="profile-timezone"
              value={profileData.timezone}
              onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
            >
              <option value="Europe/Warsaw">Europe/Warsaw</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="profile-sheets-url">{t('profile.googleSheetsUrl')}</Label>
            <Input
              id="profile-sheets-url"
              type="url"
              value={profileData.googleSheetsUrl}
              onChange={(e) => setProfileData(prev => ({ ...prev, googleSheetsUrl: e.target.value }))}
              placeholder="https://docs.google.com/spreadsheets/..."
            />
            <p className="mt-1.5 text-xs text-uc-text-muted">{t('profile.googleSheetsHint')}</p>
          </div>

          <Button variant="accent" size="lg" className="w-full" onClick={handleProfileSave} isLoading={isSavingProfile}>
            {isSavingProfile ? t('common.saving') || 'Saving...' : t('profile.saveProfile') || 'Save profile'}
          </Button>
        </div>
      )}

      {activeTab === 'cycle' && (
        <div className="space-y-4">
          <div
            className={`flex items-center gap-3 rounded-uc-card px-4 py-3 font-bold ${
              isCycleTrackingEnabled ? 'bg-uc-success-bg text-uc-text' : 'bg-uc-surface border border-uc-border text-uc-text-muted'
            }`}
          >
            <Icon
              name={isCycleTrackingEnabled ? 'success' : 'close'}
              className={isCycleTrackingEnabled ? 'text-uc-success' : undefined}
            />
            {isCycleTrackingEnabled ? t('profile.cycleEnabled') : t('profile.cycleDisabled')}
          </div>

          {isCycleTrackingEnabled ? (
            <>
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <Label htmlFor="profile-cycle-length" className="mb-0">{t('profile.cycleLength')}</Label>
                  <span className="text-[15px] font-extrabold text-uc-text uc-num">
                    {cycleData.cycleLength} {t('profile.days') || 'days'}
                  </span>
                </div>
                <input
                  id="profile-cycle-length"
                  type="range"
                  min={cycleMin}
                  max={cycleMax}
                  value={cycleData.cycleLength}
                  onChange={(e) => setCycleData(prev => ({ ...prev, cycleLength: parseInt(e.target.value) }))}
                  className="h-11 w-full cursor-pointer accent-uc-primary"
                />
                <div className="flex justify-between text-xs text-uc-text-muted uc-num">
                  <span>{cycleMin}</span>
                  <span>{cycleMax}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="profile-last-period">{t('profile.lastPeriodDate')}</Label>
                <Input
                  id="profile-last-period"
                  type="date"
                  value={cycleData.lastPeriodDate}
                  onChange={(e) => setCycleData(prev => ({ ...prev, lastPeriodDate: e.target.value }))}
                />
              </div>

              <Button variant="accent" size="lg" className="w-full" onClick={handleCycleSave}>
                {t('common.save')}
              </Button>

              {showDisableCycleConfirm ? (
                <Card tone="elevated" role="alertdialog" aria-labelledby="profile-disable-cycle-title">
                  <h3 id="profile-disable-cycle-title" className="text-lg font-bold text-uc-text">
                    {t('profile.disableCycleTitle') || 'Disable cycle tracking?'}
                  </h3>
                  <p className="mt-1 text-sm text-uc-text-muted">{t('profile.disableCycleConfirm')}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="ghost" className="flex-1 basis-32" onClick={() => setShowDisableCycleConfirm(false)}>
                      {t('profile.keepOn') || 'Keep on'}
                    </Button>
                    <Button variant="destructive" className="flex-1 basis-32" onClick={handleCycleDisable}>
                      {t('profile.disable') || 'Disable'}
                    </Button>
                  </div>
                </Card>
              ) : (
                <Button variant="ghost" className="w-full text-uc-error" onClick={() => setShowDisableCycleConfirm(true)}>
                  {t('profile.disableCycle')}
                </Button>
              )}
            </>
          ) : (
            <div className="rounded-uc-card border border-dashed border-uc-border">
              <EmptyState
                icon={<Icon name="cycle" size={28} />}
                title={t('profile.enableCycleTracking')}
                description={t('profile.cycleTrackingDescription')}
                action={
                  <Button
                    variant="accent"
                    onClick={() => setCycleData({ cycleLength: 28, lastPeriodDate: typeof window !== 'undefined' ? toLocalDateString() : '2024-01-15' })}
                  >
                    {t('profile.enableCycle')}
                  </Button>
                }
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-5">
          <section className="space-y-2">
            <Overline>{t('profile.appStatus')}</Overline>
            <SettingsGroup>
              <SettingsRow label={t('profile.connectionStatus')}>
                <span className="flex items-center gap-2 font-bold text-uc-text">
                  <span aria-hidden className={`size-2 rounded-full ${isOnline ? 'bg-uc-success' : 'bg-uc-warning'}`} />
                  {isOnline ? t('profile.online') : t('profile.offline')}
                </span>
              </SettingsRow>
              <SettingsRow label={t('profile.storageUsed')}>
                <span className="font-bold text-uc-text uc-num">
                  {formatStorageSize(storageSize.used)} / {formatStorageSize(storageSize.total)}
                </span>
              </SettingsRow>
            </SettingsGroup>
          </section>

          <section className="space-y-2">
            <Overline>{t('profile.privacy')}</Overline>
            <SettingsGroup>
              <SettingsRow label={t('profile.dataCollection')} description={t('profile.dataCollectionDesc')}>
                <span className="text-sm font-bold text-uc-success">{t('profile.enabled')}</span>
              </SettingsRow>
              <SettingsRow label={t('profile.cycleTracking')} description={t('profile.cycleTrackingDesc')}>
                {isCycleTrackingEnabled ? (
                  <span className="text-sm font-bold text-uc-success">{t('profile.enabled')}</span>
                ) : (
                  <Button
                    variant="tonal"
                    onClick={() => {
                      // Reset consent choice to show consent modal again
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('cycle-consent-declined')
                      }
                      // Force page reload to trigger consent modal
                      window.location.reload()
                    }}
                  >
                    {t('profile.setupCycle')}
                  </Button>
                )}
              </SettingsRow>
            </SettingsGroup>
          </section>

          <section className="space-y-2">
            <Overline>{t('profile.notificationsSection') || 'Notifications'}</Overline>
            <SettingsGroup>
              <SettingsRow
                label={t('profile.pushNotifications') || 'Push Notifications'}
                description={
                  pushSupported
                    ? t('profile.pushNotificationsDesc') || 'Receive notifications even when the app is closed'
                    : t('profile.pushNotSupported') || 'Push notifications are not supported in this browser'
                }
                htmlFor="profile-push"
              >
                <Checkbox
                  id="profile-push"
                  checked={isPushSubscribed}
                  onChange={handleTogglePushNotifications}
                  disabled={isSubscribing || !pushSupported}
                  busy={isSubscribing}
                />
              </SettingsRow>

              <SettingsRow
                label={t('profile.latePeriodNotifications')}
                description={t('profile.latePeriodNotificationsDesc')}
                htmlFor="profile-late-period"
              >
                <Checkbox
                  id="profile-late-period"
                  checked={notificationSettings.latePeriodNotificationsEnabled}
                  onChange={(e) => updateSettings({
                    ...notificationSettings,
                    latePeriodNotificationsEnabled: e.target.checked
                  })}
                />
              </SettingsRow>

              <SettingsRow
                label={t('profile.workoutInactivityNotifications') || 'Workout Inactivity Reminders'}
                description={t('profile.workoutInactivityNotificationsDesc') || 'Get reminded when you haven\'t logged a workout in a while'}
                htmlFor="profile-inactivity"
              >
                <Checkbox
                  id="profile-inactivity"
                  checked={notificationSettings.workoutInactivityEnabled || false}
                  onChange={(e) => updateSettings({
                    ...notificationSettings,
                    workoutInactivityEnabled: e.target.checked
                  })}
                />
              </SettingsRow>
              {notificationSettings.workoutInactivityEnabled && (
                <SettingsRow label={t('profile.workoutInactivityDays') || 'Days of inactivity before reminder'} htmlFor="profile-inactivity-days">
                  <div className="flex items-center gap-2">
                    <input
                      id="profile-inactivity-days"
                      type="number"
                      min="1"
                      max="14"
                      value={notificationSettings.workoutInactivityDays || 3}
                      onChange={(e) => updateSettings({
                        ...notificationSettings,
                        workoutInactivityDays: parseInt(e.target.value) || 3
                      })}
                      className={inputClasses('w-16 text-center uc-num')}
                    />
                    <span className="text-sm text-uc-text-muted">{t('profile.days') || 'days'}</span>
                  </div>
                </SettingsRow>
              )}

              <SettingsRow
                label={t('profile.testReminderNotifications') || 'Test Reminders'}
                description={t('profile.testReminderNotificationsDesc') || 'Get reminded when you haven\'t performed a fingerboard test in a while'}
                htmlFor="profile-test-reminder"
              >
                <Checkbox
                  id="profile-test-reminder"
                  checked={testReminderEnabled}
                  onChange={(e) => {
                    setTestReminderEnabled(e.target.checked);
                    // Auto-save on enable and disable
                    setTimeout(() => handleSaveTestReminder(), 100);
                  }}
                  disabled={isLoadingTestReminder || isSavingTestReminder}
                />
              </SettingsRow>
              {testReminderEnabled && (
                <SettingsRow label={t('profile.testReminderInterval') || 'Remind me to retest in'} htmlFor="profile-test-interval">
                  <div className="flex items-center gap-2">
                    <input
                      id="profile-test-interval"
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
                      className={inputClasses('w-16 text-center uc-num')}
                    />
                    <Select
                      aria-label={t('profile.testReminderInterval') || 'Remind me to retest in'}
                      value={testReminderUnit}
                      onChange={(e) => {
                        setTestReminderUnit(e.target.value as 'days' | 'weeks' | 'months');
                        setTimeout(() => handleSaveTestReminder(), 100);
                      }}
                      disabled={isSavingTestReminder}
                    >
                      <option value="days">{t('profile.days') || 'days'}</option>
                      <option value="weeks">{t('profile.weeks') || 'weeks'}</option>
                      <option value="months">{t('profile.months') || 'months'}</option>
                    </Select>
                  </div>
                </SettingsRow>
              )}
            </SettingsGroup>

            {isPushBlocked && (
              <div role="alert" className="flex gap-3 rounded-uc-card bg-uc-warning-bg px-4 py-3 text-sm text-uc-text">
                <Icon name="warning" className="mt-px text-uc-warning" />
                <p>
                  <strong>{t('profile.pushBlockedTitle') || 'Notifications blocked.'}</strong>{' '}
                  {t('profile.pushNotificationsDenied') || 'Push notifications are blocked in your browser. Please enable them in browser settings.'}
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-3">
          <p className="text-[15px] text-uc-text-muted">
            {t('profile.dataExportDescription') || 'Export all your training data, events, exercises, and more in JSON or CSV format.'}
          </p>

          <ActionRow
            icon="download"
            busy={isExporting}
            title={t('profile.exportJSON') || 'Export as JSON'}
            description={t('profile.exportJSONDesc') || 'Download all your data as JSON file'}
            onClick={() => handleExport('json')}
            disabled={isExporting}
          />
          <ActionRow
            icon="download"
            busy={isExporting}
            title={t('profile.exportCSV') || 'Export as CSV'}
            description={t('profile.exportCSVDesc') || 'Download all your data as CSV file'}
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          />

          {exportError && (
            <div role="alert" className="rounded-uc-card bg-uc-error-bg px-4 py-3 text-sm font-semibold text-uc-text">
              {exportError}
            </div>
          )}

          {/* Development Tools - Only visible in development */}
          {isDevelopment && (
            <div className="space-y-3 mt-6 pt-6 border-t border-uc-border">
              <Overline className="flex items-center gap-1.5"><Icon name="settings" size={14} /> Development Tools</Overline>
              <p className="text-sm text-uc-text-muted">
                These tools are only available in development mode for testing purposes.
              </p>

              {/* Generate Dummy Data */}
              <ActionRow
                icon="plus"
                title="Generate Dummy Data"
                description="Create and download sample data for testing"
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
              />

              {/* Import Dummy Data to Database */}
              <ActionRow
                icon="install"
                busy={isImporting}
                title="Import Dummy Data to DB"
                description={isImporting ? 'Importing...' : 'Import data directly to database (one-time)'}
                disabled={isImporting}
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
              />

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
                <ActionRow
                  icon="download"
                  busy={isImporting}
                  title={importFile ? 'Import Selected File' : 'Import Data (Dev)'}
                  description={importFile ? importFile.name : 'Import JSON file (development only)'}
                  disabled={isImporting}
                  onClick={() => {
                    if (importFile) {
                      handleImportData(importFile);
                    } else {
                      importFileInputRef.current?.click();
                    }
                  }}
                />
                {importFile && (
                  <Button
                    variant="ghost"
                    className="mt-2 border-0 text-uc-text-muted"
                    onClick={() => {
                      setImportFile(null);
                      if (importFileInputRef.current) {
                        importFileInputRef.current.value = '';
                      }
                    }}
                  >
                    Clear selection
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function Avatar({ photoUrl, initial, className }: { photoUrl: string; initial: string; className: string }) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full bg-uc-primary text-uc-on-primary font-extrabold flex items-center justify-center ${className}`}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="Profile" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </div>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return <Card padded={false} className="divide-y divide-uc-border px-4">{children}</Card>;
}

function SettingsRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="block text-[15px] font-bold text-uc-text">{label}</label>
        {description && <p className="text-xs text-uc-text-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Checkbox({
  busy,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { busy?: boolean }) {
  return (
    <span className="flex size-11 items-center justify-center">
      {busy ? (
        <span aria-hidden className="size-5 animate-spin rounded-full border-2 border-uc-primary border-r-transparent" />
      ) : (
        <input type="checkbox" className="size-6 cursor-pointer accent-uc-primary disabled:cursor-not-allowed" {...props} />
      )}
    </span>
  );
}

function ActionRow({
  icon,
  busy = false,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: IconName;
  /** Spinner instead of the icon while the action runs. */
  busy?: boolean;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full min-h-16 items-center gap-3 rounded-uc-card border border-uc-border bg-uc-surface px-4 py-3 text-left transition-colors hover:bg-uc-elevated disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span aria-hidden className="flex size-6 shrink-0 items-center justify-center text-uc-primary">
        {busy ? <Spinner /> : <Icon name={icon} />}
      </span>
      <span className="min-w-0">
        <span className="block font-bold text-uc-text">{title}</span>
        <span className="block text-xs text-uc-text-muted">{description}</span>
      </span>
    </button>
  );
}
