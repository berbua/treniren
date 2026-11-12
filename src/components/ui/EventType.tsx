import { EventType } from '@/types/event'
import { Icon, IconName } from './Icon'

interface EventTypeMeta {
  /** Key under `events.types.*` */
  key: string
  icon: IconName
  border: string
  text: string
  /** Tinted background for a selected type tile. */
  tint: string
}

// Full class strings so Tailwind can see them. Event colours from DESIGN.md "Event markers".
export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
  INJURY: { key: 'injury', icon: 'event-injury', border: 'border-uc-error', text: 'text-uc-error', tint: 'bg-uc-error-bg' },
  PHYSIO: { key: 'physio', icon: 'event-physio', border: 'border-uc-primary', text: 'text-uc-primary', tint: 'bg-uc-primary-container' },
  COMPETITION: { key: 'competition', icon: 'event-competition', border: 'border-uc-accent-text', text: 'text-uc-accent-text', tint: 'bg-uc-warning-bg' },
  TRIP: { key: 'trip', icon: 'event-trip', border: 'border-uc-success', text: 'text-uc-success', tint: 'bg-uc-success-bg' },
  OTHER: { key: 'other', icon: 'event-other', border: 'border-uc-text-muted', text: 'text-uc-text-muted', tint: 'bg-uc-elevated' },
}

export const eventTypeMeta = (type: EventType) => EVENT_TYPE_META[type] ?? EVENT_TYPE_META.OTHER

/** 44px outlined tile in the event colour (event cards, lists). */
export function EventIconTile({ type, className = '' }: { type: EventType; className?: string }) {
  const meta = eventTypeMeta(type)
  return (
    <span
      aria-hidden
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl border-[1.5px] bg-uc-elevated ${meta.border} ${meta.text} ${className}`}
    >
      <Icon name={meta.icon} size={22} />
    </span>
  )
}
