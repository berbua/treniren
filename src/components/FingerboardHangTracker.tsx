'use client'

import { useState, useEffect } from 'react'
import { FingerboardWorkoutHang, FingerboardProtocol, HandType, GripType } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { HAND_TYPE_OPTIONS, GRIP_TYPE_OPTIONS, CRIMP_SIZE_OPTIONS, getHandTypeLabel, getHandTypeEmoji, formatHangDescription, shouldShowCrimpSize } from '@/lib/fingerboard-utils'
import Link from 'next/link'

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
      alert('This protocol has no hangs')
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
    const newHangs = [...hangs]
    newHangs[index] = { ...newHangs[index], [field]: value }
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          🖐️ Hangs
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowProtocolSelector(true)}
            className="px-4 py-2 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black rounded-lg text-sm font-medium transition-colors"
          >
            📦 Load Protocol
          </button>
          <button
            type="button"
            onClick={handleAddHang}
            className="px-4 py-2 bg-uc-purple hover:bg-uc-purple/90 text-uc-text-light rounded-lg text-sm font-medium transition-colors"
          >
            + Add Hang
          </button>
        </div>
      </div>

      {/* Hangs List */}
      {hangs.length === 0 ? (
        <div className="bg-uc-dark-bg rounded-xl p-8 text-center border border-uc-purple/20">
          <div className="text-4xl mb-2">🖐️</div>
          <p className="text-uc-text-muted">No hangs added yet</p>
          <p className="text-sm text-uc-text-muted mt-1">Click "Add Hang" or "Load Protocol" to start</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hangs.map((hang, index) => (
            <div
              key={index}
              className="bg-uc-dark-bg rounded-xl p-4 border border-uc-purple/20"
            >
              {/* Hang Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-uc-text-muted text-sm">#{index + 1}</span>
                  <span className="font-semibold text-uc-text-light">
                    {getHandTypeEmoji(hang.handType)} {formatHangDescription(hang.handType, hang.gripType, hang.crimpSize)}
                    {hang.customDescription && ` • ${hang.customDescription}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMoveHang(index, 'up')}
                    disabled={index === 0}
                    className="text-uc-text-muted hover:text-uc-text-light disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveHang(index, 'down')}
                    disabled={index === hangs.length - 1}
                    className="text-uc-text-muted hover:text-uc-text-light disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveHang(index)}
                    className="text-uc-text-muted hover:text-red-500 transition-colors"
                    title="Remove hang"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Hang Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-uc-text-muted mb-1">Hand Type</label>
                    <select
                      value={hang.handType}
                      onChange={(e) => handleHangChange(index, 'handType', e.target.value as HandType)}
                      className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                    >
                      {HAND_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.emoji} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-uc-text-muted mb-1">Grip Type</label>
                    <select
                      value={hang.gripType}
                      onChange={(e) => {
                        const newGripType = e.target.value as GripType
                        handleHangChange(index, 'gripType', newGripType)
                        // Clear crimp size only if switching to sloper
                        if (newGripType === 'SLOPER') {
                          handleHangChange(index, 'crimpSize', undefined)
                        }
                      }}
                      className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                    >
                      {GRIP_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.emoji} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {shouldShowCrimpSize(hang.gripType) && (
                  <div>
                    <label className="block text-xs text-uc-text-muted mb-1">
                      Crimp Size (mm) {hang.gripType === 'CRIMP' && '*'}
                    </label>
                    <select
                      value={hang.crimpSize || ''}
                      onChange={(e) =>
                        handleHangChange(
                          index,
                          'crimpSize',
                          e.target.value === '' ? undefined : parseInt(e.target.value)
                        )
                      }
                      className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                    >
                      <option value="">Select size...</option>
                      {CRIMP_SIZE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.emoji} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-uc-text-muted mb-1">Custom Description (optional)</label>
                  <input
                    type="text"
                    value={hang.customDescription || ''}
                    onChange={(e) => handleHangChange(index, 'customDescription', e.target.value)}
                    placeholder="e.g., 3-finger drag, half crimp"
                    className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-uc-text-muted mb-1">
                      Load (kg) <span className="text-uc-text-muted/70">(negative for unload)</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={hang.load !== undefined ? hang.load : (hang.unload !== undefined ? -hang.unload : '')}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined
                        if (value !== undefined && value < 0) {
                          // Negative value means unload
                          handleHangChange(index, 'load', undefined)
                          handleHangChange(index, 'unload', Math.abs(value))
                        } else {
                          // Positive value means load
                          handleHangChange(index, 'load', value)
                          handleHangChange(index, 'unload', undefined)
                        }
                      }}
                      placeholder="0"
                      className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-uc-text-muted mb-1">Reps</label>
                    <input
                      type="number"
                      value={hang.reps || ''}
                      onChange={(e) =>
                        handleHangChange(
                          index,
                          'reps',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="5"
                      className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-uc-text-muted mb-1">Time (s)</label>
                    <input
                      type="number"
                      value={hang.timeSeconds || ''}
                      onChange={(e) =>
                        handleHangChange(
                          index,
                          'timeSeconds',
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="10"
                      className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-uc-text-muted mb-1">Notes</label>
                  <textarea
                    value={hang.notes || ''}
                    onChange={(e) => handleHangChange(index, 'notes', e.target.value)}
                    placeholder="Optional notes..."
                    rows={2}
                    className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple resize-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Protocol Selector Modal */}
      {showProtocolSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4">
          <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-uc-purple/20 flex items-center justify-between sticky top-0 bg-uc-dark-bg">
              <h3 className="text-lg font-semibold text-uc-text-light">Load Protocol</h3>
              <button
                onClick={() => setShowProtocolSelector(false)}
                className="text-uc-text-muted hover:text-uc-text-light"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              {protocols.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-uc-text-muted mb-4">No protocols available</p>
                  <Link
                    href="/fingerboard-protocols"
                    className="text-uc-mustard hover:text-uc-mustard/80 transition-colors"
                  >
                    Create your first protocol →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {protocols.map((protocol) => (
                    <div
                      key={protocol.id}
                      className="bg-uc-black/50 rounded-lg p-4 border border-uc-purple/20"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-uc-text-light">{protocol.name}</h4>
                          {protocol.description && (
                            <p className="text-sm text-uc-text-muted mt-1">{protocol.description}</p>
                          )}
                          <div className="text-xs text-uc-text-muted mt-2">
                            {protocol.hangs.length} {protocol.hangs.length === 1 ? 'hang' : 'hangs'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLoadProtocol(protocol)}
                        className="w-full bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Load Protocol
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

