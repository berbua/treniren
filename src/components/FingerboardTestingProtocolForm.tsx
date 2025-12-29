'use client'

import { useState, useEffect } from 'react'
import { FingerboardTestingProtocol, FingerboardTestingProtocolFormData, FingerboardTestHang, HandType, GripType, FingerboardProtocol } from '@/types/workout'
import { HAND_TYPE_OPTIONS, GRIP_TYPE_OPTIONS, CRIMP_SIZE_OPTIONS, getHandTypeLabel, getHandTypeEmoji, formatHangDescription, shouldShowCrimpSize } from '@/lib/fingerboard-utils'

interface FingerboardTestingProtocolFormProps {
  protocol?: FingerboardTestingProtocol | null
  onSubmit: (data: FingerboardTestingProtocolFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export default function FingerboardTestingProtocolForm({
  protocol,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FingerboardTestingProtocolFormProps) {
  const [formData, setFormData] = useState<FingerboardTestingProtocolFormData>({
    name: '',
    description: '',
    testHangs: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showHangForm, setShowHangForm] = useState(false)
  const [editingHangIndex, setEditingHangIndex] = useState<number | null>(null)
  const [showProtocolSelector, setShowProtocolSelector] = useState(false)
  const [existingProtocols, setExistingProtocols] = useState<FingerboardProtocol[]>([])

  useEffect(() => {
    if (protocol) {
      setFormData({
        name: protocol.name,
        description: protocol.description || '',
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
      })
    }
  }, [protocol])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Protocol name is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || isSubmitting) return
    onSubmit(formData)
  }

  const handleAddHang = () => {
    setEditingHangIndex(null)
    setShowHangForm(true)
  }

  const handleLoadFromProtocol = async () => {
    setShowProtocolSelector(true)
    try {
      const response = await fetch('/api/fingerboard-protocols')
      if (response.ok) {
        const data = await response.json()
        setExistingProtocols(data)
      }
    } catch (error) {
      console.error('Error fetching protocols:', error)
    }
  }

  const handleSelectProtocol = (protocol: FingerboardProtocol) => {
    if (!protocol.hangs || protocol.hangs.length === 0) {
      alert('This protocol has no hangs')
      return
    }

    // Convert protocol hangs to test hangs
    const newTestHangs: FingerboardTestHang[] = protocol.hangs.map((ph) => ({
      order: formData.testHangs.length + ph.order,
      handType: ph.handType,
      gripType: ph.gripType,
      crimpSize: ph.crimpSize || undefined,
      customDescription: ph.customDescription || undefined,
      targetLoad: ph.defaultLoad || undefined,
      targetTimeSeconds: ph.defaultTimeSeconds || undefined,
      notes: ph.notes || undefined,
    }))

    // Merge with existing test hangs
    const mergedHangs = [...formData.testHangs, ...newTestHangs]
    mergedHangs.forEach((h, i) => {
      h.order = i
    })

    setFormData({ ...formData, testHangs: mergedHangs })
    setShowProtocolSelector(false)
  }

  const handleEditHang = (index: number) => {
    setEditingHangIndex(index)
    setShowHangForm(true)
  }

  const handleSaveHang = (hang: FingerboardTestHang) => {
    if (editingHangIndex !== null) {
      const newHangs = [...formData.testHangs]
      newHangs[editingHangIndex] = { ...hang, order: editingHangIndex }
      setFormData({ ...formData, testHangs: newHangs })
    } else {
      setFormData({
        ...formData,
        testHangs: [...formData.testHangs, { ...hang, order: formData.testHangs.length }],
      })
    }
    setShowHangForm(false)
    setEditingHangIndex(null)
  }

  const handleRemoveHang = (index: number) => {
    const newHangs = formData.testHangs.filter((_, i) => i !== index)
    newHangs.forEach((h, i) => {
      h.order = i
    })
    setFormData({ ...formData, testHangs: newHangs })
  }

  const handleMoveHang = (index: number, direction: 'up' | 'down') => {
    const newHangs = [...formData.testHangs]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newHangs.length) return

    const temp = newHangs[index]
    newHangs[index] = newHangs[targetIndex]
    newHangs[targetIndex] = temp
    newHangs.forEach((h, i) => {
      h.order = i
    })
    setFormData({ ...formData, testHangs: newHangs })
  }

  const currentHang = editingHangIndex !== null ? formData.testHangs[editingHangIndex] : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-uc-dark-bg border-b border-uc-purple/20 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-uc-text-light">
            {protocol ? 'Edit Testing Protocol' : 'Create Testing Protocol'}
          </h2>
          <button onClick={onCancel} className="text-uc-text-muted hover:text-uc-text-light transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              Protocol Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              placeholder="e.g., Max Strength Test"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              rows={2}
              placeholder="Brief description of this testing protocol"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-uc-text-light">
                Test Hangs ({formData.testHangs.length})
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLoadFromProtocol}
                  className="bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  📦 Load from Protocol
                </button>
                <button
                  type="button"
                  onClick={handleAddHang}
                  className="bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  + Add Test Hang
                </button>
              </div>
            </div>

            {formData.testHangs.length === 0 ? (
              <div className="bg-uc-black/50 rounded-lg p-8 text-center border border-uc-purple/20">
                <p className="text-uc-text-muted">No test hangs added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.testHangs.map((hang, index) => (
                  <div
                    key={index}
                    className="bg-uc-black/50 rounded-lg p-4 border border-uc-purple/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-uc-text-muted text-sm w-6">{index + 1}.</span>
                      <span className="text-uc-text-light font-medium">
                        {getHandTypeEmoji(hang.handType)} {formatHangDescription(hang.handType, hang.gripType, hang.crimpSize)}
                        {hang.customDescription && ` • ${hang.customDescription}`}
                      </span>
                      {hang.targetLoad !== undefined && (
                        <span className="text-xs text-uc-text-muted">Target: +{hang.targetLoad}kg</span>
                      )}
                      {hang.targetTimeSeconds && (
                        <span className="text-xs text-uc-text-muted">{hang.targetTimeSeconds}s</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMoveHang(index, 'up')}
                        disabled={index === 0}
                        className="text-uc-text-muted hover:text-uc-text-light disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveHang(index, 'down')}
                        disabled={index === formData.testHangs.length - 1}
                        className="text-uc-text-muted hover:text-uc-text-light disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditHang(index)}
                        className="text-uc-text-muted hover:text-uc-text-light"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveHang(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-uc-purple/20">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-uc-black/50 hover:bg-uc-black text-uc-text-light px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : protocol ? 'Update Protocol' : 'Create Protocol'}
            </button>
          </div>
        </form>

        {showHangForm && (
          <TestHangForm
            hang={currentHang}
            onSave={handleSaveHang}
            onCancel={() => {
              setShowHangForm(false)
              setEditingHangIndex(null)
            }}
          />
        )}

        {showProtocolSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4">
            <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-md">
              <div className="p-4 border-b border-uc-purple/20 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-uc-text-light">Load from Protocol</h3>
                <button onClick={() => setShowProtocolSelector(false)} className="text-uc-text-muted hover:text-uc-text-light">
                  ✕
                </button>
              </div>
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {existingProtocols.length === 0 ? (
                  <p className="text-uc-text-muted text-center">No protocols available. Create one first!</p>
                ) : (
                  <ul className="space-y-2">
                    {existingProtocols.map((protocol) => (
                      <li key={protocol.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectProtocol(protocol)}
                          className="w-full text-left p-3 bg-uc-black/50 hover:bg-uc-black rounded-lg transition-colors text-uc-text-light"
                        >
                          <span className="font-medium">{protocol.name}</span>
                          {protocol.description && (
                            <p className="text-xs text-uc-text-muted mt-1">{protocol.description}</p>
                          )}
                          <p className="text-xs text-uc-text-muted mt-1">
                            {protocol.hangs.length} {protocol.hangs.length === 1 ? 'hang' : 'hangs'}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TestHangForm({
  hang,
  onSave,
  onCancel,
}: {
  hang: FingerboardTestHang | null
  onSave: (hang: FingerboardTestHang) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<FingerboardTestHang>({
    order: hang?.order || 0,
    handType: hang?.handType || 'BOTH_HANDS',
    gripType: hang?.gripType || 'OPEN_HAND',
    crimpSize: hang?.crimpSize || undefined,
    customDescription: hang?.customDescription || '',
    targetLoad: hang?.targetLoad || undefined,
    targetTimeSeconds: hang?.targetTimeSeconds || undefined,
    notes: hang?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.handType) {
      alert('Hand type is required')
      return
    }
    if (!formData.gripType) {
      alert('Grip type is required')
      return
    }
    if (formData.gripType === 'CRIMP' && !formData.crimpSize) {
      alert('Crimp size is required when grip type is Crimp')
      return
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4">
      <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-md">
        <div className="p-4 border-b border-uc-purple/20 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-uc-text-light">
            {hang ? 'Edit Test Hang' : 'Add Test Hang'}
          </h3>
          <button onClick={onCancel} className="text-uc-text-muted hover:text-uc-text-light">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              Hand Type *
            </label>
            <select
              value={formData.handType}
              onChange={(e) => setFormData({ ...formData, handType: e.target.value as HandType })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
            >
              {HAND_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              Grip Type *
            </label>
            <select
              value={formData.gripType}
              onChange={(e) => {
                const newGripType = e.target.value as GripType
                setFormData({
                  ...formData,
                  gripType: newGripType,
                  crimpSize: newGripType === 'SLOPER' ? undefined : formData.crimpSize,
                })
              }}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
            >
              {GRIP_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
          </div>

          {shouldShowCrimpSize(formData.gripType) && (
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                Crimp Size (mm) {formData.gripType === 'CRIMP' && '*'}
              </label>
              <select
                value={formData.crimpSize || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    crimpSize: e.target.value === '' ? undefined : parseInt(e.target.value),
                  })
                }
                className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
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
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              Custom Description (optional)
            </label>
            <input
              type="text"
              value={formData.customDescription || ''}
              onChange={(e) => setFormData({ ...formData, customDescription: e.target.value })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              placeholder="e.g., 3-finger drag, half crimp"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                Target Load (kg)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.targetLoad || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetLoad: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                placeholder="0"
              />
              <p className="text-xs text-uc-text-muted mt-1">Optional target</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                Target Time (seconds)
              </label>
              <input
                type="number"
                value={formData.targetTimeSeconds || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetTimeSeconds: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                placeholder="10"
              />
              <p className="text-xs text-uc-text-muted mt-1">Optional target</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              rows={2}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-uc-black/50 hover:bg-uc-black text-uc-text-light px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

