'use client'

import { useState, useEffect } from 'react'
import { FingerboardProtocol, FingerboardProtocolFormData, FingerboardProtocolHang, HandType, GripType } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { HAND_TYPE_OPTIONS, GRIP_TYPE_OPTIONS, CRIMP_SIZE_OPTIONS, formatHangDescription, shouldShowCrimpSize } from '@/lib/fingerboard-utils'
import { BottomSheet, Button, FieldError, Icon, Input, Label, Overline, SegmentedControl, Select, Textarea, UnitInput } from './ui'

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

  const iconButtonBase = 'inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text-muted transition-colors hover:bg-uc-elevated disabled:opacity-30 disabled:hover:bg-transparent'
  const iconButton = `${iconButtonBase} hover:text-uc-text`
  const removeButton = `${iconButtonBase} hover:text-uc-error`

  const hangDetails = (hang: FingerboardProtocolHang) => [
    formatHangDescription(t, hang.handType, hang.gripType, hang.crimpSize).replace(/ • /g, ' · '),
    hang.customDescription,
    hang.defaultLoad !== undefined && `+${hang.defaultLoad} kg`,
    hang.defaultUnload !== undefined && `−${hang.defaultUnload} kg`,
    hang.defaultReps && `${hang.defaultReps} ${t('workouts.labels.reps') || 'reps'}`,
    hang.defaultTimeSeconds && `${hang.defaultTimeSeconds} s`,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <BottomSheet
        isOpen
        onClose={onCancel}
        title={protocol ? t('protocolForm.editTitle') : t('fingerboard.createProtocol')}
        closeLabel={t('common.close') || 'Close'}
        dismissible={false}
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" size="lg" className="flex-1" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="fingerboard-protocol-form" variant="accent" size="lg" className="flex-[2]" isLoading={isSubmitting}>
              {isSubmitting ? t('protocolForm.saving') : protocol ? t('protocolForm.update') : t('fingerboard.createProtocol')}
            </Button>
          </div>
        }
      >
        <form id="fingerboard-protocol-form" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Overline as="label" htmlFor="protocol-name" className="mb-2 block">
              {t('protocolForm.name')} *
            </Overline>
            <Input
              id="protocol-name"
              type="text"
              value={formData.name}
              aria-invalid={!!errors.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('workouts.placeholders.protocolName') || 'e.g., Max Strength Protocol'}
            />
            <FieldError>{errors.name}</FieldError>
          </div>

          <div>
            <Overline as="label" htmlFor="protocol-description" className="mb-2 block">
              {t('protocolForm.description')}
            </Overline>
            <Textarea
              id="protocol-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder={t('workouts.placeholders.protocolDescription') || 'Brief description of this protocol'}
            />
          </div>

          <div>
            <Overline className="mb-2 uc-num">
              {t('protocolForm.hangs') || 'Hangs'} ({formData.hangs.length})
            </Overline>

            {formData.hangs.length > 0 && (
              <div className="mb-2 space-y-2">
                {formData.hangs.map((hang, index) => (
                  <div
                    key={index}
                    className="flex min-h-14 items-center gap-1 rounded-uc-input border border-uc-border bg-uc-surface py-2 pl-4 pr-1"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-uc-text uc-num">
                        {t('fingerboard.hangNumber', { number: String(index + 1) }) || `Hang ${index + 1}`}
                      </div>
                      <div className="text-[13px] font-semibold text-uc-text-muted break-words uc-num">
                        {hangDetails(hang)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMoveHang(index, 'up')}
                      disabled={index === 0}
                      aria-label={t('routines.form.moveUp') || 'Move up'}
                      className={iconButton}
                    >
                      <Icon name="move-up" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveHang(index, 'down')}
                      disabled={index === formData.hangs.length - 1}
                      aria-label={t('routines.form.moveDown') || 'Move down'}
                      className={iconButton}
                    >
                      <Icon name="move-down" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditHang(index)}
                      aria-label={t('common.edit')}
                      title={t('common.edit')}
                      className={iconButton}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveHang(index)}
                      aria-label={t('protocolForm.remove')}
                      title={t('protocolForm.remove')}
                      className={removeButton}
                    >
                      <Icon name="close" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddHang}
              className="flex min-h-14 w-full flex-col items-center justify-center rounded-uc-input border border-dashed border-uc-border px-4 py-2 text-sm font-bold text-uc-primary transition-colors hover:border-uc-primary"
            >
              + {t('protocolForm.addHang')}
              {formData.hangs.length === 0 && (
                <span className="text-[13px] font-medium text-uc-text-muted">{t('workouts.labels.noHangsAdded')}</span>
              )}
            </button>
          </div>
        </form>
      </BottomSheet>

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
    </>
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
    <BottomSheet
      isOpen
      onClose={onCancel}
      title={hang ? t('protocolForm.editHang') : t('protocolForm.addHang')}
      closeLabel={t('common.close') || 'Close'}
      dismissible={false}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" size="lg" className="flex-1" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="fingerboard-hang-form" variant="accent" size="lg" className="flex-[2]">
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <form id="fingerboard-hang-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>{t('workouts.labels.handType')} *</Label>
          <SegmentedControl
            ariaLabel={t('workouts.labels.handType')}
            options={HAND_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))}
            value={formData.handType}
            onChange={(value) => setFormData({ ...formData, handType: value as HandType })}
          />
        </div>

        <div>
          <Label>{t('workouts.labels.gripType')} *</Label>
          <SegmentedControl
            ariaLabel={t('workouts.labels.gripType')}
            options={GRIP_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))}
            value={formData.gripType}
            onChange={(value) => {
              const newGripType = value as GripType
              setFormData({
                ...formData,
                gripType: newGripType,
                // Clear crimp size only if switching to sloper
                crimpSize: newGripType === 'SLOPER' ? undefined : formData.crimpSize,
              })
            }}
          />
        </div>

        {shouldShowCrimpSize(formData.gripType) && (
          <div>
            <Label htmlFor="hang-crimp-size">
              {t('protocolForm.crimpSize')} {formData.gripType === 'CRIMP' && '*'}
            </Label>
            <Select
              id="hang-crimp-size"
              value={formData.crimpSize || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  crimpSize: e.target.value === '' ? undefined : parseInt(e.target.value),
                })
              }
            >
              <option value="">{t('common.selectSize') || 'Select size...'}</option>
              {CRIMP_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {formData.gripType === 'OPEN_HAND' && (
              <p className="mt-1.5 text-[13px] text-uc-text-muted">
                {t('protocolForm.crimpSizeHint')}
              </p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="hang-custom-description">{t('workouts.labels.customDescription')}</Label>
          <Input
            id="hang-custom-description"
            type="text"
            value={formData.customDescription || ''}
            onChange={(e) => setFormData({ ...formData, customDescription: e.target.value })}
            placeholder={t('workouts.placeholders.customDescription') || 'e.g., 3-finger drag, half crimp'}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col">
            <Label htmlFor="hang-load" className="flex-1">
              {t('protocolForm.load')}
            </Label>
            <UnitInput
              id="hang-load"
              unit="kg"
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
              placeholder={t('workouts.placeholders.load') || '0'}
              aria-describedby="hang-load-hint"
            />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="hang-reps" className="flex-1">{t('workouts.labels.reps')}</Label>
            <UnitInput
              id="hang-reps"
              unit="×"
              value={formData.defaultReps || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultReps: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder={t('workouts.placeholders.unload') || '5'}
            />
          </div>
          <div className="flex flex-col">
            <Label htmlFor="hang-time" className="flex-1">{t('protocolForm.time')}</Label>
            <UnitInput
              id="hang-time"
              unit="s"
              value={formData.defaultTimeSeconds || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultTimeSeconds: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              placeholder={t('workouts.placeholders.timeSeconds') || '10'}
            />
          </div>
        </div>
        <p id="hang-load-hint" className="-mt-2 text-[13px] text-uc-text-muted">
          {t('protocolForm.load')}: {t('protocolForm.loadHint')}
        </p>

        <div>
          <Label htmlFor="hang-notes">{t('protocolForm.notes')}</Label>
          <Textarea
            id="hang-notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />
        </div>
      </form>
    </BottomSheet>
  )
}
