import { HandType, GripType } from '@/types/workout'

type Translate = (key: string) => string

// Labels are translation keys - render them with t(option.labelKey)
export const HAND_TYPE_OPTIONS: { value: HandType; labelKey: string }[] = [
  { value: 'ONE_HAND', labelKey: 'fingerboard.handTypes.ONE_HAND' },
  { value: 'BOTH_HANDS', labelKey: 'fingerboard.handTypes.BOTH_HANDS' },
]

export const GRIP_TYPE_OPTIONS: { value: GripType; labelKey: string }[] = [
  { value: 'OPEN_HAND', labelKey: 'fingerboard.gripTypes.OPEN_HAND' },
  { value: 'CRIMP', labelKey: 'fingerboard.gripTypes.CRIMP' },
  { value: 'SLOPER', labelKey: 'fingerboard.gripTypes.SLOPER' },
]

export const CRIMP_SIZE_OPTIONS = [
  { value: 6, label: '6mm' },
  { value: 8, label: '8mm' },
  { value: 10, label: '10mm' },
  { value: 12, label: '12mm' },
  { value: 15, label: '15mm' },
  { value: 18, label: '18mm' },
  { value: 20, label: '20mm' },
  { value: 25, label: '25mm' },
  { value: 30, label: '30mm' },
]

export function getHandTypeLabel(handType: HandType, t: Translate): string {
  const option = HAND_TYPE_OPTIONS.find(opt => opt.value === handType)
  return option ? t(option.labelKey) : handType
}

export function getGripTypeLabel(gripType: GripType, t: Translate): string {
  const option = GRIP_TYPE_OPTIONS.find(opt => opt.value === gripType)
  return option ? t(option.labelKey) : gripType
}

export function getCrimpSizeLabel(crimpSize: number | null | undefined): string {
  if (crimpSize === null || crimpSize === undefined) {
    return ''
  }
  return `${crimpSize}mm`
}

export function formatHangDescription(t: Translate, handType: HandType, gripType: GripType, crimpSize?: number | null, customDescription?: string | null): string {
  const handLabel = getHandTypeLabel(handType, t)
  const gripLabel = getGripTypeLabel(gripType, t)
  const crimpLabel = gripType === 'CRIMP' && crimpSize ? ` • ${crimpSize}mm` : ''
  const customLabel = customDescription ? ` • ${customDescription}` : ''
  return `${handLabel} • ${gripLabel}${crimpLabel}${customLabel}`
}

export function shouldShowCrimpSize(gripType: GripType): boolean {
  return gripType !== 'SLOPER'
}

