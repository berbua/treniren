'use client'

import { useState, useEffect } from 'react'
import { FingerboardProtocol, FingerboardProtocolFormData, FingerboardProtocolHang, HandType, GripType } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { HAND_TYPE_OPTIONS, GRIP_TYPE_OPTIONS, CRIMP_SIZE_OPTIONS, getHandTypeLabel, getHandTypeEmoji, formatHangDescription, shouldShowCrimpSize } from '@/lib/fingerboard-utils'

interface FingerboardProtocolFormProps {
  protocol?: FingerboardProtocol | null
  onSubmit: (data: FingerboardProtocolFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export default function FingerboardProtocolForm({
  protocol,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FingerboardProtocolFormProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<FingerboardProtocolFormData>({
    name: '',
    description: '',
    hangs: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showHangForm, setShowHangForm] = useState(false)
  const [editingHangIndex, setEditingHangIndex] = useState<number | null>(null)

  useEffect(() => {
    if (protocol) {
      setFormData({
        name: protocol.name,
        description: protocol.description || '',
        hangs: protocol.hangs.map((h) => ({
          order: h.order,
          handType: h.handType,
          gripType: h.gripType,
          crimpSize: h.crimpSize || undefined,
          customDescription: h.customDescription || undefined,
          defaultLoad: h.defaultLoad || undefined,
          defaultUnload: h.defaultUnload || undefined,
          defaultReps: h.defaultReps || undefined,
          defaultTimeSeconds: h.defaultTimeSeconds || undefined,
          notes: h.notes || undefined,
        })),
      })
    }
  }, [protocol])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = t('protocolForm.nameRequired')
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

  const handleEditHang = (index: number) => {
    setEditingHangIndex(index)
    setShowHangForm(true)
  }

  const handleSaveHang = (hang: FingerboardProtocolHang) => {
    if (editingHangIndex !== null) {
      const newHangs = [...formData.hangs]
      newHangs[editingHangIndex] = { ...hang, order: editingHangIndex }
      setFormData({ ...formData, hangs: newHangs })
    } else {
      setFormData({
        ...formData,
        hangs: [...formData.hangs, { ...hang, order: formData.hangs.length }],
      })
    }
    setShowHangForm(false)
    setEditingHangIndex(null)
  }

  const handleRemoveHang = (index: number) => {
    const newHangs = formData.hangs.filter((_, i) => i !== index)
    newHangs.forEach((h, i) => {
      h.order = i
    })
    setFormData({ ...formData, hangs: newHangs })
  }

  const handleMoveHang = (index: number, direction: 'up' | 'down') => {
    const newHangs = [...formData.hangs]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newHangs.length) return

    const temp = newHangs[index]
    newHangs[index] = newHangs[targetIndex]
    newHangs[targetIndex] = temp
    newHangs.forEach((h, i) => {
      h.order = i
    })
    setFormData({ ...formData, hangs: newHangs })
  }

  const currentHang = editingHangIndex !== null ? formData.hangs[editingHangIndex] : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-uc-dark-bg border-b border-uc-purple/20 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-uc-text-light">
            {protocol ? t('protocolForm.editTitle') : t('fingerboard.createProtocol')}
          </h2>
          <button onClick={onCancel} className="text-uc-text-muted hover:text-uc-text-light transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('protocolForm.name')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              placeholder={t('workouts.placeholders.protocolName') || 'e.g., Max Strength Protocol'}
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('protocolForm.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              rows={2}
              placeholder={t('workouts.placeholders.protocolDescription') || 'Brief description of this protocol'}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-uc-text-light">
                Hangs ({formData.hangs.length})
              </label>
              <button
                type="button"
                onClick={handleAddHang}
                className="bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + {t('protocolForm.addHang')}
              </button>
            </div>

            {formData.hangs.length === 0 ? (
              <div className="bg-uc-black/50 rounded-lg p-8 text-center border border-uc-purple/20">
                <p className="text-uc-text-muted">{t('workouts.labels.noHangsAdded')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.hangs.map((hang, index) => (
                  <div
                    key={index}
                    className="bg-uc-black/50 rounded-lg p-4 border border-uc-purple/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-uc-text-muted text-sm w-6">{index + 1}.</span>
                      <span className="text-uc-text-light font-medium">
                        {getHandTypeEmoji(hang.handType)} {formatHangDescription(t, hang.handType, hang.gripType, hang.crimpSize)}
                        {hang.customDescription && ` • ${hang.customDescription}`}
                      </span>
                      {hang.defaultLoad !== undefined && (
                        <span className="text-xs text-uc-text-muted">+{hang.defaultLoad}kg</span>
                      )}
                      {hang.defaultUnload !== undefined && (
                        <span className="text-xs text-uc-text-muted">-{hang.defaultUnload}kg</span>
                      )}
                      {hang.defaultReps && (
                        <span className="text-xs text-uc-text-muted">{hang.defaultReps} reps</span>
                      )}
                      {hang.defaultTimeSeconds && (
                        <span className="text-xs text-uc-text-muted">{hang.defaultTimeSeconds}s</span>
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
                        disabled={index === formData.hangs.length - 1}
                        className="text-uc-text-muted hover:text-uc-text-light disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditHang(index)}
                        className="text-uc-text-muted hover:text-uc-text-light"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveHang(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        {t('protocolForm.remove')}
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? t('protocolForm.saving') : protocol ? t('protocolForm.update') : t('fingerboard.createProtocol')}
            </button>
          </div>
        </form>

        {showHangForm && (
          <HangForm
            hang={currentHang}
            onSave={handleSaveHang}
            onCancel={() => {
              setShowHangForm(false)
              setEditingHangIndex(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function HangForm({
  hang,
  onSave,
  onCancel,
}: {
  hang: FingerboardProtocolHang | null
  onSave: (hang: FingerboardProtocolHang) => void
  onCancel: () => void
}) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState<FingerboardProtocolHang>({
    order: hang?.order || 0,
    handType: hang?.handType || 'BOTH_HANDS',
    gripType: hang?.gripType || 'OPEN_HAND',
    crimpSize: hang?.crimpSize || undefined,
    customDescription: hang?.customDescription || '',
    defaultLoad: hang?.defaultLoad || undefined,
    defaultUnload: hang?.defaultUnload || undefined,
    defaultReps: hang?.defaultReps || undefined,
    defaultTimeSeconds: hang?.defaultTimeSeconds || undefined,
    notes: hang?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.handType) {
      alert(t('workouts.errors.handTypeRequired') || 'Hand type is required')
      return
    }
    if (!formData.gripType) {
      alert(t('workouts.errors.gripTypeRequired') || 'Grip type is required')
      return
    }
    // Validate crimp size if grip type is CRIMP (required for crimp)
    if (formData.gripType === 'CRIMP' && !formData.crimpSize) {
      alert(t('workouts.errors.crimpSizeRequired') || 'Crimp size is required when grip type is Crimp')
      return
    }
    // Clear crimp size if grip type is SLOPER
    if (formData.gripType === 'SLOPER') {
      formData.crimpSize = undefined
    }
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4">
      <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-md">
        <div className="p-4 border-b border-uc-purple/20 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-uc-text-light">
            {hang ? t('protocolForm.editHang') : t('protocolForm.addHang')}
          </h3>
          <button onClick={onCancel} className="text-uc-text-muted hover:text-uc-text-light">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('workouts.labels.handType')} *
            </label>
            <select
              value={formData.handType}
              onChange={(e) => setFormData({ ...formData, handType: e.target.value as HandType })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
            >
              {HAND_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('workouts.labels.gripType')} *
            </label>
            <select
              value={formData.gripType}
              onChange={(e) => {
                const newGripType = e.target.value as GripType
                setFormData({
                  ...formData,
                  gripType: newGripType,
                  // Clear crimp size only if switching to sloper
                  crimpSize: newGripType === 'SLOPER' ? undefined : formData.crimpSize,
                })
              }}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
            >
              {GRIP_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.emoji} {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {shouldShowCrimpSize(formData.gripType) && (
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                {t('protocolForm.crimpSize')} {formData.gripType === 'CRIMP' && '*'}
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
                <option value="">{t('common.selectSize') || 'Select size...'}</option>
                {CRIMP_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.emoji} {opt.label}
                  </option>
                ))}
              </select>
              {formData.gripType === 'OPEN_HAND' && (
                <p className="text-xs text-uc-text-muted mt-1">
                  {t('protocolForm.crimpSizeHint')}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('workouts.labels.customDescription')}
            </label>
            <input
              type="text"
              value={formData.customDescription || ''}
              onChange={(e) => setFormData({ ...formData, customDescription: e.target.value })}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              placeholder={t('workouts.placeholders.customDescription') || 'e.g., 3-finger drag, half crimp'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('protocolForm.load')} <span className="text-xs text-uc-text-muted font-normal">({t('protocolForm.loadHint')})</span>
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.defaultLoad !== undefined ? formData.defaultLoad : (formData.defaultUnload !== undefined ? -formData.defaultUnload : '')}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : undefined
                if (value !== undefined && value < 0) {
                  // Negative value means unload
                  setFormData({
                    ...formData,
                    defaultLoad: undefined,
                    defaultUnload: Math.abs(value),
                  })
                } else {
                  // Positive value means load
                  setFormData({
                    ...formData,
                    defaultLoad: value,
                    defaultUnload: undefined,
                  })
                }
              }}
              className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
              placeholder={t('workouts.placeholders.load') || '0'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                {t('workouts.labels.reps')}
              </label>
              <input
                type="number"
                value={formData.defaultReps || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultReps: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                placeholder={t('workouts.placeholders.unload') || '5'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-uc-text-light mb-2">
                {t('protocolForm.time')}
              </label>
              <input
                type="number"
                value={formData.defaultTimeSeconds || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultTimeSeconds: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full bg-uc-black border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
                placeholder={t('workouts.placeholders.timeSeconds') || '10'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-uc-text-light mb-2">
              {t('protocolForm.notes')}
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

