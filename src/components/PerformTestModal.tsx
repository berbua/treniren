'use client'

import { useState } from 'react'
import { FingerboardTestingProtocol, FingerboardTestResultFormData } from '@/types/workout'
import { formatHangDescription } from '@/lib/fingerboard-utils'

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
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
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
        body: JSON.stringify({
          name: protocolName.trim(),
          description: protocol.description,
          testHangs: protocol.testHangs.map((h) => ({
            order: h.order,
            handType: h.handType,
            gripType: h.gripType,
            crimpSize: h.crimpSize || undefined,
            customDescription: h.customDescription || undefined,
            targetLoad: h.targetLoad || undefined,
            targetTimeSeconds: h.targetTimeSeconds || undefined,
            notes: h.notes || undefined,
          })),
        }),
      })

      if (response.ok) {
        setIsEditingName(false)
        onProtocolUpdated?.() // Refresh protocol list in parent
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`Failed to update protocol name: ${errorData.error || 'Unknown error'}`)
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

      const response = await fetch('/api/fingerboard-test-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        alert(`Failed to save test: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving test:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save test'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-uc-dark-bg border-b border-uc-purple/20 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
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
                    className="flex-1 bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light text-xl font-bold focus:outline-none focus:border-uc-purple"
                    autoFocus
                    disabled={isSavingName}
                  />
                  <button
                    type="button"
                    onClick={handleSaveProtocolName}
                    disabled={isSavingName || !protocolName.trim()}
                    className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isSavingName ? 'Saving...' : '✓'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditName}
                    disabled={isSavingName}
                    className="bg-uc-black/50 hover:bg-uc-black text-uc-text-light px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-uc-text-light">Perform Test: {protocolName}</h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="text-uc-text-muted hover:text-uc-text-light transition-colors text-sm"
                    title="Edit protocol name"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-uc-text-muted hover:text-uc-text-light transition-colors ml-4">
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              Test Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-uc-text-light">Test Results</h3>
            {protocol.testHangs.map((hang, index) => {
              const hangId = hang.id || `hang-${hang.order}`
              const result = results[hangId] || {}
              return (
                <div
                  key={hangId}
                  className="bg-uc-black/50 rounded-lg p-4 border border-uc-purple/20"
                >
                  <div className="mb-4">
                    <span className="text-uc-text-muted text-sm">#{index + 1}</span>
                    <h4 className="text-uc-text-light font-medium mt-1">
                      {formatHangDescription(hang.handType, hang.gripType, hang.crimpSize, hang.customDescription)}
                    </h4>
                    {hang.targetLoad !== undefined && (
                      <p className="text-xs text-uc-text-muted mt-1">
                        Target: +{hang.targetLoad}kg
                      </p>
                    )}
                    {hang.targetTimeSeconds && (
                      <p className="text-xs text-uc-text-muted">
                        Target: {hang.targetTimeSeconds}s
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-uc-text-muted mb-1">
                      Load (kg) <span className="text-uc-text-muted/70">(negative value for unload)</span>
                    </label>
                    <input
                      type="number"
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
                      className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                      placeholder="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-xs text-uc-text-muted mb-1">
                        Time (seconds)
                      </label>
                      <input
                        type="number"
                        value={result.timeSeconds || ''}
                        onChange={(e) =>
                          handleResultChange(hangId, 'timeSeconds', e.target.value ? parseInt(e.target.value) : undefined)
                        }
                        className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-uc-text-muted mb-1">
                        Success
                      </label>
                      <select
                        value={result.success === undefined ? '' : result.success ? 'true' : 'false'}
                        onChange={(e) =>
                          handleResultChange(
                            hangId,
                            'success',
                            e.target.value === '' ? undefined : e.target.value === 'true'
                          )
                        }
                        className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                      >
                        <option value="">-</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs text-uc-text-muted mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={result.notes || ''}
                      onChange={(e) => handleResultChange(hangId, 'notes', e.target.value)}
                      rows={1}
                      className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple resize-none"
                      placeholder="Any notes..."
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Reminder Settings */}
          <div className="bg-uc-black/50 rounded-lg p-4 border border-uc-purple/20">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="remindMeToRetest"
                checked={remindMeToRetest}
                onChange={(e) => setRemindMeToRetest(e.target.checked)}
                className="mt-1 h-4 w-4 text-uc-purple focus:ring-uc-purple border-uc-purple/20 rounded"
              />
              <div className="flex-1">
                <label htmlFor="remindMeToRetest" className="block text-sm font-medium text-uc-text-light cursor-pointer">
                  Remind me to retest in
                </label>
                {remindMeToRetest && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={reminderInterval}
                      onChange={(e) => setReminderInterval(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                      className="w-20 bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                    />
                    <select
                      value={reminderUnit}
                      onChange={(e) => setReminderUnit(e.target.value as 'days' | 'weeks' | 'months')}
                      className="bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                    >
                      <option value="days">days</option>
                      <option value="weeks">weeks</option>
                      <option value="months">months</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-uc-purple/20">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-uc-black/50 hover:bg-uc-black text-uc-text-light px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Test Results'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

