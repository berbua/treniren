'use client'

import { useState } from 'react'
import { FingerboardTestingProtocol, FingerboardTestResultFormData } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { toLocalDateString } from '@/lib/date-utils'
import { formatHangDescription } from '@/lib/fingerboard-utils'
import { BottomSheet, Button, Icon, Input, Label, Overline, SegmentedControl, Select, Spinner, UnitInput } from './ui'

interface PerformTestModalProps {
  protocol: FingerboardTestingProtocol
  onTestPerformed: () => void
  onClose: () => void
  onProtocolUpdated?: () => void
}

export default function PerformTestModal({
  protocol,
  onTestPerformed,
  onClose,
  onProtocolUpdated,
}: PerformTestModalProps) {
  const { t } = useLanguage()
  const { getToken } = useCsrfToken()
  const [date, setDate] = useState(toLocalDateString())
  const [results, setResults] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [protocolName, setProtocolName] = useState(protocol.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [remindMeToRetest, setRemindMeToRetest] = useState(false)
  const [reminderInterval, setReminderInterval] = useState(4)
  const [reminderUnit, setReminderUnit] = useState<'days' | 'weeks' | 'months'>('weeks')

  const handleResultChange = (testHangId: string, field: string, value: any) => {
    setResults((prev) => ({
      ...prev,
      [testHangId]: {
        ...prev[testHangId],
        testHangId,
        [field]: value,
      },
    }))
  }

  const handleSaveProtocolName = async () => {
    if (!protocolName.trim() || protocolName === protocol.name) {
      setIsEditingName(false)
      return
    }

    setIsSavingName(true)
    try {
      const response = await fetch(`/api/fingerboard-testing-protocols/${protocol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Rename only - test hangs are left untouched
        body: JSON.stringify({
          name: protocolName.trim(),
          description: protocol.description,
        }),
      })

      if (response.ok) {
        setIsEditingName(false)
        onProtocolUpdated?.() // Refresh protocol list in parent
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`${t('fingerboardTesting.renameError') || 'Failed to update protocol name'}: ${errorData.error || 'Unknown error'}`)
        setProtocolName(protocol.name) // Revert on error
      }
    } catch (error) {
      console.error('Error updating protocol name:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to update protocol name'}`)
      setProtocolName(protocol.name) // Revert on error
    } finally {
      setIsSavingName(false)
    }
  }

  const handleCancelEditName = () => {
    setProtocolName(protocol.name)
    setIsEditingName(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const resultsArray = protocol.testHangs.map((hang) => ({
        testHangId: hang.id || `hang-${hang.order}`,
        load: results[hang.id!]?.load || undefined,
        unload: results[hang.id!]?.unload || undefined,
        timeSeconds: results[hang.id!]?.timeSeconds || undefined,
        success: results[hang.id!]?.success ?? undefined,
        notes: results[hang.id!]?.notes || undefined,
      }))

      const csrfToken = await getToken()
      const response = await fetch('/api/fingerboard-test-results', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          protocolId: protocol.id,
          date,
          results: resultsArray,
          reminderSettings: remindMeToRetest ? {
            enabled: true,
            interval: reminderInterval,
            unit: reminderUnit
          } : null,
        }),
      })

      if (response.ok) {
        onTestPerformed()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`${t('fingerboardTesting.saveTestError') || 'Failed to save test'}: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving test:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save test'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const smallIconButton = 'inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text-muted transition-colors hover:bg-uc-surface hover:text-uc-text disabled:opacity-50'

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      dismissible={false}
      closeLabel={t('common.close') || 'Close'}
      title={
        <span className="block min-w-0">
          <span className="mb-0.5 block text-[11px] font-bold uppercase leading-[14px] tracking-[0.08em] text-uc-text-muted">
            {t('fingerboardTesting.performTest') || 'Perform Test'}
          </span>
          {isEditingName ? (
            <span className="flex items-center gap-1">
              <Input
                type="text"
                value={protocolName}
                onChange={(e) => setProtocolName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSaveProtocolName()
                  } else if (e.key === 'Escape') {
                    handleCancelEditName()
                  }
                }}
                aria-label={t('fingerboardTesting.protocolName') || 'Protocol name'}
                className="text-lg font-bold"
                autoFocus
                disabled={isSavingName}
              />
              <button
                type="button"
                onClick={handleSaveProtocolName}
                disabled={isSavingName || !protocolName.trim()}
                aria-label={t('common.save') || 'Save'}
                className={`${smallIconButton} text-uc-success`}
              >
                {isSavingName ? <Spinner /> : <Icon name="success" />}
              </button>
              <button
                type="button"
                onClick={handleCancelEditName}
                disabled={isSavingName}
                aria-label={t('common.cancel') || 'Cancel'}
                className={smallIconButton}
              >
                <Icon name="close" />
              </button>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="min-w-0 break-words">{protocolName}</span>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                aria-label={t('fingerboardTesting.editName') || 'Edit protocol name'}
                title={t('fingerboardTesting.editName') || 'Edit protocol name'}
                className={`${smallIconButton} text-base`}
              >
                <Icon name="edit" />
              </button>
            </span>
          )}
        </span>
      }
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" size="lg" className="flex-1" onClick={onClose}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button type="submit" form="perform-test-form" variant="accent" size="lg" className="flex-[2]" isLoading={isSubmitting}>
            {isSubmitting ? t('common.saving') || 'Saving...' : t('fingerboardTesting.saveResults') || 'Save results'}
          </Button>
        </div>
      }
    >
      <form id="perform-test-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Overline as="label" htmlFor="test-date" className="mb-2 block">
            {t('fingerboardTesting.testDate') || 'Test date'} *
          </Overline>
          <Input
            id="test-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <Overline>{t('workouts.labels.testResults') || 'Test Results'}</Overline>
        {protocol.testHangs.map((hang, index) => {
          const hangId = hang.id || `hang-${hang.order}`
          const result = results[hangId] || {}
          const targets = [
            hang.targetLoad !== undefined && hang.targetLoad !== null && `+${hang.targetLoad} kg`,
            hang.targetTimeSeconds && `${hang.targetTimeSeconds} s`,
          ].filter(Boolean).join(' · ')
          return (
            <div key={hangId} className="space-y-3 rounded-uc-card border border-uc-border bg-uc-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <h4 className="font-bold text-uc-text uc-num">
                  {t('fingerboard.hangNumber', { number: index + 1 })} · {formatHangDescription(t, hang.handType, hang.gripType, hang.crimpSize, hang.customDescription).replace(/ • /g, ' · ')}
                </h4>
                {targets && (
                  <span className="text-[13px] font-semibold text-uc-text-muted uc-num">
                    {t('fingerboardTesting.target') || 'target'} {targets}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <Label htmlFor={`${hangId}-load`} className="flex-1">{t('fingerboardTesting.metricLoad') || 'Load'}</Label>
                  <UnitInput
                    id={`${hangId}-load`}
                    unit="kg"
                    step="0.5"
                    value={result.load !== undefined ? result.load : (result.unload !== undefined ? -result.unload : '')}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined
                      if (value !== undefined && value < 0) {
                        // Negative value means unload
                        handleResultChange(hangId, 'load', undefined)
                        handleResultChange(hangId, 'unload', Math.abs(value))
                      } else {
                        // Positive value means load
                        handleResultChange(hangId, 'load', value)
                        handleResultChange(hangId, 'unload', undefined)
                      }
                    }}
                    placeholder={t('workouts.placeholders.testLoad') || '0'}
                  />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor={`${hangId}-time`} className="flex-1">{t('fingerboardTesting.metricTime') || 'Time'}</Label>
                  <UnitInput
                    id={`${hangId}-time`}
                    unit="s"
                    value={result.timeSeconds || ''}
                    onChange={(e) =>
                      handleResultChange(hangId, 'timeSeconds', e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder={t('workouts.placeholders.testUnload') || '10'}
                  />
                </div>
              </div>

              <div>
                <Label>{t('fingerboardTesting.successQuestion') || 'Success?'}</Label>
                <SegmentedControl
                  ariaLabel={t('fingerboardTesting.successQuestion') || 'Success?'}
                  options={[
                    { value: 'true', label: t('fingerboardTesting.yes') || 'Yes' },
                    { value: 'false', label: t('fingerboardTesting.no') || 'No' },
                  ]}
                  value={result.success === undefined ? null : result.success ? 'true' : 'false'}
                  onChange={(value) => {
                    // Tap the selected segment again to clear it (success stays optional)
                    const next = value === 'true'
                    handleResultChange(hangId, 'success', result.success === next ? undefined : next)
                  }}
                />
              </div>

              <Input
                type="text"
                value={result.notes || ''}
                onChange={(e) => handleResultChange(hangId, 'notes', e.target.value)}
                aria-label={t('protocolForm.notes') || 'Notes (optional)'}
                placeholder={t('workouts.placeholders.testNotes') || 'Any notes...'}
              />
            </div>
          )
        })}
        <p className="text-[13px] text-uc-text-muted">
          {t('protocolForm.load')}: {t('protocolForm.loadHint')}
        </p>

        {/* Reminder Settings */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label htmlFor="remindMeToRetest" className="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              id="remindMeToRetest"
              checked={remindMeToRetest}
              onChange={(e) => setRemindMeToRetest(e.target.checked)}
              className="size-5 shrink-0 cursor-pointer accent-[var(--uc-primary)]"
            />
            <span className="text-sm font-bold text-uc-text">
              {t('fingerboardTesting.remindRetest') || 'Remind me to retest every'}
            </span>
          </label>
          {remindMeToRetest && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="12"
                value={reminderInterval}
                onChange={(e) => setReminderInterval(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                aria-label={t('fingerboardTesting.reminderInterval') || 'Interval'}
                className="w-20 text-center uc-num"
              />
              <Select
                value={reminderUnit}
                onChange={(e) => setReminderUnit(e.target.value as 'days' | 'weeks' | 'months')}
                aria-label={t('fingerboardTesting.reminderUnit') || 'Unit'}
              >
                <option value="days">{t('fingerboardTesting.units.days') || 'days'}</option>
                <option value="weeks">{t('fingerboardTesting.units.weeks') || 'weeks'}</option>
                <option value="months">{t('fingerboardTesting.units.months') || 'months'}</option>
              </Select>
            </div>
          )}
        </div>
      </form>
    </BottomSheet>
  )
}
