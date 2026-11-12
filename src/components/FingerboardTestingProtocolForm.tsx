'use client'

import { useState, useEffect } from 'react'
import { FingerboardTestingProtocol, FingerboardTestingProtocolFormData, FingerboardTestHang, HandType, GripType, FingerboardProtocol } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { HAND_TYPE_OPTIONS, GRIP_TYPE_OPTIONS, CRIMP_SIZE_OPTIONS, formatHangDescription, shouldShowCrimpSize } from '@/lib/fingerboard-utils'
import { BottomSheet, Button, EmptyState, FieldError, Icon, Input, Label, Overline, SegmentedControl, Select, Textarea, UnitInput } from './ui'

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
  const { t } = useLanguage()
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
          // Keep the id so the update keeps this hang (and its test results)
          id: h.id,
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
      alert(t('workouts.errors.protocolNoHangs') || 'This protocol has no hangs')
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
      // Keep the original id so this hang's test results stay linked
      newHangs[editingHangIndex] = { ...hang, id: newHangs[editingHangIndex].id, order: editingHangIndex }
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

  const iconButtonBase = 'inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text-muted transition-colors hover:bg-uc-elevated disabled:opacity-30 disabled:hover:bg-transparent'
  const iconButton = `${iconButtonBase} hover:text-uc-text`
  const removeButton = `${iconButtonBase} hover:text-uc-error`

  const hangDetails = (hang: FingerboardTestHang) => {
    const targets = [
      hang.targetLoad !== undefined && `+${hang.targetLoad} kg`,
      hang.targetTimeSeconds && `${hang.targetTimeSeconds} s`,
    ].filter(Boolean).join(' · ')
    return [
      formatHangDescription(t, hang.handType, hang.gripType, hang.crimpSize, hang.customDescription).replace(/ • /g, ' · '),
      targets && `${t('fingerboardTesting.target') || 'target'} ${targets}`,
    ].filter(Boolean).join(' · ')
  }

  return (
    <>
      <BottomSheet
        isOpen
        onClose={onCancel}
        title={protocol ? t('fingerboardTesting.editProtocol') || 'Edit Testing Protocol' : t('fingerboardTesting.createProtocol') || 'Create Testing Protocol'}
        closeLabel={t('common.close') || 'Close'}
        dismissible={false}
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" size="lg" className="flex-1" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="testing-protocol-form" variant="accent" size="lg" className="flex-[2]" isLoading={isSubmitting}>
              {isSubmitting ? t('protocolForm.saving') : protocol ? t('protocolForm.update') : t('fingerboard.createProtocol')}
            </Button>
          </div>
        }
      >
        <form id="testing-protocol-form" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Overline as="label" htmlFor="testing-protocol-name" className="mb-2 block">
              {t('protocolForm.name')} *
            </Overline>
            <Input
              id="testing-protocol-name"
              type="text"
              value={formData.name}
              aria-invalid={!!errors.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('workouts.placeholders.testingProtocolName') || 'e.g., Max Strength Test'}
            />
            <FieldError>{errors.name}</FieldError>
          </div>

          <div>
            <Overline as="label" htmlFor="testing-protocol-description" className="mb-2 block">
              {t('protocolForm.description')}
            </Overline>
            <Textarea
              id="testing-protocol-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder={t('workouts.placeholders.testingProtocolDescription') || 'Brief description of this testing protocol'}
            />
          </div>

          <div>
            <Overline className="mb-2 uc-num">
              {t('fingerboardTesting.testHangs') || 'Test hangs'} ({formData.testHangs.length})
            </Overline>

            <Button variant="tonal" className="mb-2 w-full" onClick={handleLoadFromProtocol}>
              <Icon name="download" /> {t('fingerboardTesting.loadFromProtocol') || 'Load from protocol'}
            </Button>

            {formData.testHangs.length > 0 && (
              <div className="mb-2 space-y-2">
                {formData.testHangs.map((hang, index) => (
                  <div
                    key={index}
                    className="flex min-h-14 items-center gap-1 rounded-uc-input border border-uc-border bg-uc-surface py-2 pl-4 pr-1"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-uc-text uc-num">
                        {t('fingerboard.hangNumber', { number: index + 1 })}
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
                      disabled={index === formData.testHangs.length - 1}
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
              + {t('fingerboardTesting.addTestHang') || 'Add test hang'}
              {formData.testHangs.length === 0 && (
                <span className="text-[13px] font-medium text-uc-text-muted">
                  {t('fingerboardTesting.noTestHangs') || 'No test hangs added yet'}
                </span>
              )}
            </button>
          </div>
        </form>
      </BottomSheet>

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

      <BottomSheet
        isOpen={showProtocolSelector}
        onClose={() => setShowProtocolSelector(false)}
        title={t('fingerboardTesting.loadFromProtocol') || 'Load from protocol'}
        closeLabel={t('common.close') || 'Close'}
      >
        {existingProtocols.length === 0 ? (
          <EmptyState
            icon={<Icon name="type-fingerboard" size={28} />}
            title={t('workouts.labels.noProtocolsAvailableCreate') || 'No protocols available. Create one first!'}
          />
        ) : (
          <ul className="space-y-2">
            {existingProtocols.map((protocol) => (
              <li key={protocol.id}>
                <button
                  type="button"
                  onClick={() => handleSelectProtocol(protocol)}
                  className="flex min-h-14 w-full flex-col items-start rounded-uc-input border border-uc-border bg-uc-surface px-4 py-2.5 text-left transition-colors hover:border-uc-primary"
                >
                  <span className="font-bold text-uc-text">{protocol.name}</span>
                  {protocol.description && (
                    <span className="mt-0.5 text-[13px] text-uc-text-muted">{protocol.description}</span>
                  )}
                  <span className="mt-0.5 text-[13px] font-semibold text-uc-text-muted uc-num">
                    {protocol.hangs.length} {protocol.hangs.length === 1
                      ? t('fingerboard.hang') || 'hang'
                      : t('fingerboard.hangs') || 'hangs'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </BottomSheet>
    </>
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
  const { t } = useLanguage()
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
      alert(t('workouts.errors.handTypeRequired') || 'Hand type is required')
      return
    }
    if (!formData.gripType) {
      alert(t('workouts.errors.gripTypeRequired') || 'Grip type is required')
      return
    }
    if (formData.gripType === 'CRIMP' && !formData.crimpSize) {
      alert(t('workouts.errors.crimpSizeRequired') || 'Crimp size is required when grip type is Crimp')
      return
    }
    onSave(formData)
  }

  return (
    <BottomSheet
      isOpen
      onClose={onCancel}
      title={hang ? t('fingerboardTesting.editTestHang') || 'Edit test hang' : t('fingerboardTesting.addTestHang') || 'Add test hang'}
      closeLabel={t('common.close') || 'Close'}
      dismissible={false}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" size="lg" className="flex-1" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="test-hang-form" variant="accent" size="lg" className="flex-[2]">
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <form id="test-hang-form" onSubmit={handleSubmit} className="space-y-4">
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
                crimpSize: newGripType === 'SLOPER' ? undefined : formData.crimpSize,
              })
            }}
          />
        </div>

        {shouldShowCrimpSize(formData.gripType) && (
          <div>
            <Label htmlFor="test-hang-crimp-size">
              {t('protocolForm.crimpSize')} {formData.gripType === 'CRIMP' && '*'}
            </Label>
            <Select
              id="test-hang-crimp-size"
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
          </div>
        )}

        <div>
          <Label htmlFor="test-hang-custom-description">{t('workouts.labels.customDescription')}</Label>
          <Input
            id="test-hang-custom-description"
            type="text"
            value={formData.customDescription || ''}
            onChange={(e) => setFormData({ ...formData, customDescription: e.target.value })}
            placeholder={t('workouts.placeholders.customDescription') || 'e.g., 3-finger drag, half crimp'}
          />
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col">
              <Label htmlFor="test-hang-target-load" className="flex-1">
                {t('fingerboardTesting.targetLoad') || 'Target load'}
              </Label>
              <UnitInput
                id="test-hang-target-load"
                unit="kg"
                step="0.5"
                value={formData.targetLoad || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetLoad: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                placeholder={t('workouts.placeholders.testLoad') || '0'}
              />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="test-hang-target-time" className="flex-1">
                {t('fingerboardTesting.targetTime') || 'Target time'}
              </Label>
              <UnitInput
                id="test-hang-target-time"
                unit="s"
                value={formData.targetTimeSeconds || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetTimeSeconds: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder={t('workouts.placeholders.testUnload') || '10'}
              />
            </div>
          </div>
          <p className="mt-1.5 text-[13px] text-uc-text-muted">{t('workouts.labels.optionalTarget') || 'Optional target'}</p>
        </div>

        <div>
          <Label htmlFor="test-hang-notes">{t('protocolForm.notes')}</Label>
          <Textarea
            id="test-hang-notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />
        </div>
      </form>
    </BottomSheet>
  )
}
