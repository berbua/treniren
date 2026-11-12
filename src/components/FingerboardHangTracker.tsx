'use client'

import { useState, useEffect } from 'react'
import { FingerboardWorkoutHang, FingerboardProtocol, HandType, GripType } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { HAND_TYPE_OPTIONS, GRIP_TYPE_OPTIONS, CRIMP_SIZE_OPTIONS, getHandTypeLabel, getHandTypeEmoji, formatHangDescription, shouldShowCrimpSize } from '@/lib/fingerboard-utils'
import Link from 'next/link'
import { BottomSheet, Button, Card, EmptyState, Input, Label, Overline, SegmentedControl, Select, Textarea, UnitInput } from './ui'

interface FingerboardHangTrackerProps {
  hangs: FingerboardWorkoutHang[]
  onHangsChange: (hangs: FingerboardWorkoutHang[]) => void
}

export default function FingerboardHangTracker({
  hangs,
  onHangsChange,
}: FingerboardHangTrackerProps) {
  const { t } = useLanguage()
  const [showProtocolSelector, setShowProtocolSelector] = useState(false)
  const [protocols, setProtocols] = useState<FingerboardProtocol[]>([])

  useEffect(() => {
    if (showProtocolSelector) {
      fetchProtocols()
    }
  }, [showProtocolSelector])

  const fetchProtocols = async () => {
    try {
      const response = await fetch('/api/fingerboard-protocols')
      if (response.ok) {
        const data = await response.json()
        setProtocols(data)
      }
    } catch (error) {
      console.error('Error fetching protocols:', error)
    }
  }

  const handleLoadProtocol = (protocol: FingerboardProtocol) => {
    if (!protocol.hangs || protocol.hangs.length === 0) {
      alert(t('workouts.errors.protocolNoHangs') || 'This protocol has no hangs')
      return
    }

    // Convert protocol hangs to workout hangs
    const newHangs: FingerboardWorkoutHang[] = protocol.hangs.map((ph) => ({
      order: ph.order,
      handType: ph.handType,
      gripType: ph.gripType,
      crimpSize: ph.crimpSize || undefined,
      customDescription: ph.customDescription || undefined,
      load: ph.defaultLoad || undefined,
      unload: ph.defaultUnload || undefined,
      reps: ph.defaultReps || undefined,
      timeSeconds: ph.defaultTimeSeconds || undefined,
      notes: ph.notes || undefined,
    }))

    // Merge with existing hangs (append)
    const mergedHangs = [...hangs, ...newHangs]
    mergedHangs.forEach((h, i) => {
      h.order = i
    })

    onHangsChange(mergedHangs)
    setShowProtocolSelector(false)
  }

  const handleAddHang = () => {
    const newHang: FingerboardWorkoutHang = {
      order: hangs.length,
      handType: 'BOTH_HANDS',
      gripType: 'OPEN_HAND',
      crimpSize: undefined,
      customDescription: undefined,
      load: undefined,
      unload: undefined,
      reps: undefined,
      timeSeconds: undefined,
      notes: undefined,
    }
    onHangsChange([...hangs, newHang])
  }

  const handleRemoveHang = (index: number) => {
    const newHangs = hangs.filter((_, i) => i !== index)
    newHangs.forEach((h, i) => {
      h.order = i
    })
    onHangsChange(newHangs)
  }

  const handleHangChange = (
    index: number,
    field: keyof FingerboardWorkoutHang,
    value: string | number | undefined
  ) => {
    updateHang(index, { [field]: value })
  }

  // Apply several field changes at once - two separate calls would both start from the same `hangs` prop
  const updateHang = (index: number, changes: Partial<FingerboardWorkoutHang>) => {
    const newHangs = [...hangs]
    newHangs[index] = { ...newHangs[index], ...changes }
    onHangsChange(newHangs)
  }

  const handleMoveHang = (index: number, direction: 'up' | 'down') => {
    const newHangs = [...hangs]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newHangs.length) return

    const temp = newHangs[index]
    newHangs[index] = newHangs[targetIndex]
    newHangs[targetIndex] = temp
    newHangs.forEach((h, i) => {
      h.order = i
    })
    onHangsChange(newHangs)
  }

  return (
    <div className="space-y-3">
      <Overline>🖐️ Hangs</Overline>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="tonal" onClick={() => setShowProtocolSelector(true)}>
          <span aria-hidden>📦</span> {t('workouts.labels.loadProtocol') || 'Load Protocol'}
        </Button>
        <Button variant="ghost" onClick={handleAddHang}>
          <span aria-hidden>+</span> {t('workouts.labels.addHang') || 'Add Hang'}
        </Button>
      </div>

      {/* Hangs List */}
      {hangs.length === 0 ? (
        <div className="rounded-uc-card border border-dashed border-uc-border">
          <EmptyState
            icon="🖐️"
            title={t('workouts.labels.noHangsAdded') || 'No hangs added yet'}
            description={t('workouts.labels.noHangsDescription') || 'Add individual hangs or load a saved protocol to quickly set up your fingerboard training session.'}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {hangs.map((hang, index) => (
            <Card key={index}>
              {/* Hang Header */}
              <div className="flex items-center gap-1 mb-3">
                <h4 className="flex-1 min-w-0 font-bold text-uc-text">
                  <span className="text-uc-text-muted uc-num">#{index + 1}</span>{' '}
                  {getHandTypeEmoji(hang.handType)} {formatHangDescription(t, hang.handType, hang.gripType, hang.crimpSize)}
                  {hang.customDescription && ` • ${hang.customDescription}`}
                </h4>
                <button
                  type="button"
                  onClick={() => handleMoveHang(index, 'up')}
                  disabled={index === 0}
                  className={iconButtonClass}
                  title="Move up"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveHang(index, 'down')}
                  disabled={index === hangs.length - 1}
                  className={iconButtonClass}
                  title="Move down"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveHang(index)}
                  className={`${iconButtonClass} hover:text-uc-error`}
                  title="Remove hang"
                  aria-label="Remove hang"
                >
                  🗑️
                </button>
              </div>

              {/* Hang Fields */}
              <div className="space-y-4">
                <div>
                  <Label>{t('workouts.labels.handType') || 'Hand Type'}</Label>
                  <SegmentedControl
                    ariaLabel={t('workouts.labels.handType') || 'Hand Type'}
                    options={HAND_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey), icon: opt.emoji }))}
                    value={hang.handType}
                    onChange={(value) => handleHangChange(index, 'handType', value as HandType)}
                  />
                </div>

                <div>
                  <Label>{t('workouts.labels.gripType') || 'Grip Type'}</Label>
                  <SegmentedControl
                    ariaLabel={t('workouts.labels.gripType') || 'Grip Type'}
                    options={GRIP_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey), icon: opt.emoji }))}
                    value={hang.gripType}
                    onChange={(value) => {
                      const newGripType = value as GripType
                      // Clear crimp size only if switching to sloper
                      updateHang(index, newGripType === 'SLOPER'
                        ? { gripType: newGripType, crimpSize: undefined }
                        : { gripType: newGripType })
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {shouldShowCrimpSize(hang.gripType) && (
                    <div>
                      <Label htmlFor={`hang-${index}-crimp`}>
                        Crimp Size {hang.gripType === 'CRIMP' && '*'}
                      </Label>
                      <Select
                        id={`hang-${index}-crimp`}
                        value={hang.crimpSize || ''}
                        onChange={(e) =>
                          handleHangChange(
                            index,
                            'crimpSize',
                            e.target.value === '' ? undefined : parseInt(e.target.value)
                          )
                        }
                      >
                        <option value="">{t('common.selectSize') || 'Select size...'}</option>
                        {CRIMP_SIZE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.emoji} {opt.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor={`hang-${index}-load`}>Load</Label>
                    <UnitInput
                      id={`hang-${index}-load`}
                      unit="kg"
                      step="0.5"
                      value={hang.load !== undefined ? hang.load : (hang.unload !== undefined ? -hang.unload : '')}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined
                        if (value !== undefined && value < 0) {
                          // Negative value means unload
                          updateHang(index, { load: undefined, unload: Math.abs(value) })
                        } else {
                          // Positive value means load
                          updateHang(index, { load: value, unload: undefined })
                        }
                      }}
                      placeholder={t('workouts.placeholders.load') || '0'}
                      aria-describedby={`hang-${index}-load-hint`}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`hang-${index}-reps`}>Reps</Label>
                    <UnitInput
                      id={`hang-${index}-reps`}
                      unit="×"
                      value={hang.reps || ''}
                      onChange={(e) =>
                        handleHangChange(
                          index,
                          'reps',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder={t('workouts.placeholders.unload') || '5'}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`hang-${index}-time`}>Time</Label>
                    <UnitInput
                      id={`hang-${index}-time`}
                      unit="s"
                      value={hang.timeSeconds || ''}
                      onChange={(e) =>
                        handleHangChange(
                          index,
                          'timeSeconds',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder={t('workouts.placeholders.timeSeconds') || '10'}
                    />
                  </div>
                  <p id={`hang-${index}-load-hint`} className="col-span-2 -mt-1 text-[13px] text-uc-text-muted">
                    Load: negative for unload
                  </p>
                </div>

                <div>
                  <Label htmlFor={`hang-${index}-description`}>{t('workouts.labels.customDescription') || 'Custom Description (optional)'}</Label>
                  <Input
                    id={`hang-${index}-description`}
                    type="text"
                    value={hang.customDescription || ''}
                    onChange={(e) => handleHangChange(index, 'customDescription', e.target.value)}
                    placeholder={t('workouts.placeholders.customDescription') || 'e.g., 3-finger drag, half crimp'}
                  />
                </div>

                <div>
                  <Label htmlFor={`hang-${index}-notes`}>Notes</Label>
                  <Textarea
                    id={`hang-${index}-notes`}
                    value={hang.notes || ''}
                    onChange={(e) => handleHangChange(index, 'notes', e.target.value)}
                    placeholder={t('workouts.placeholders.notes') || 'Optional notes...'}
                    rows={2}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Protocol Selector */}
      <BottomSheet
        isOpen={showProtocolSelector}
        onClose={() => setShowProtocolSelector(false)}
        title={t('workouts.labels.loadProtocol') || 'Load Protocol'}
        closeLabel={t('common.close') || 'Close'}
      >
        {protocols.length === 0 ? (
          <EmptyState
            title={t('workouts.labels.noProtocolsAvailable') || 'No protocols available'}
            action={
              <Link href="/fingerboard-protocols" className="text-sm font-bold text-uc-primary hover:underline">
                Create your first protocol →
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {protocols.map((protocol) => (
              <Card key={protocol.id}>
                <h4 className="font-bold text-uc-text">{protocol.name}</h4>
                {protocol.description && (
                  <p className="text-sm text-uc-text-muted mt-1">{protocol.description}</p>
                )}
                <p className="text-xs font-semibold text-uc-text-muted mt-2 mb-3 uc-num">
                  {protocol.hangs.length} {protocol.hangs.length === 1 ? 'hang' : 'hangs'}
                </p>
                <Button variant="tonal" onClick={() => handleLoadProtocol(protocol)} className="w-full">
                  Load Protocol
                </Button>
              </Card>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

const iconButtonClass =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-lg text-uc-text-muted hover:text-uc-text hover:bg-uc-elevated disabled:opacity-30 disabled:pointer-events-none transition-colors'
