import { HandType, GripType } from '@/types/workout'

type Translate = (key: string) => string

// Labels are translation keys - render them with t(option.labelKey)
export const HAND_TYPE_OPTIONS: { value: HandType; labelKey: string; emoji: string }[] = [
  { value: 'ONE_HAND', labelKey: 'fingerboard.handTypes.ONE_HAND', emoji: '✋' },
  { value: 'BOTH_HANDS', labelKey: 'fingerboard.handTypes.BOTH_HANDS', emoji: '🤲' },
]

export const GRIP_TYPE_OPTIONS: { value: GripType; labelKey: string; emoji: string }[] = [
  { value: 'OPEN_HAND', labelKey: 'fingerboard.gripTypes.OPEN_HAND', emoji: '🖐️' },
  { value: 'CRIMP', labelKey: 'fingerboard.gripTypes.CRIMP', emoji: '✊' },
  { value: 'SLOPER', labelKey: 'fingerboard.gripTypes.SLOPER', emoji: '🫳' },
]

export const CRIMP_SIZE_OPTIONS = [
  { value: 6, label: '6mm', emoji: '📏' },
  { value: 8, label: '8mm', emoji: '📏' },
  { value: 10, label: '10mm', emoji: '📏' },
  { value: 12, label: '12mm', emoji: '📏' },
  { value: 15, label: '15mm', emoji: '📏' },
  { value: 18, label: '18mm', emoji: '📏' },
  { value: 20, label: '20mm', emoji: '📏' },
  { value: 25, label: '25mm', emoji: '📏' },
  { value: 30, label: '30mm', emoji: '📏' },
]

export function getHandTypeLabel(handType: HandType, t: Translate): string {
  const option = HAND_TYPE_OPTIONS.find(opt => opt.value === handType)
  return option ? t(option.labelKey) : handType
}

export function getHandTypeEmoji(handType: HandType): string {
  const option = HAND_TYPE_OPTIONS.find(opt => opt.value === handType)
  return option ? option.emoji : '🖐️'
}

export function getGripTypeLabel(gripType: GripType, t: Translate): string {
  const option = GRIP_TYPE_OPTIONS.find(opt => opt.value === gripType)
  return option ? t(option.labelKey) : gripType
}

export function getGripTypeEmoji(gripType: GripType): string {
  const option = GRIP_TYPE_OPTIONS.find(opt => opt.value === gripType)
  return option ? option.emoji : '🖐️'
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

