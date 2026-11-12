'use client';

import { ReactNode, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Workout } from '@/types/workout';

interface StatsSectorsProps {
  /** Workouts already filtered to the range. */
  workouts: Workout[];
  renderSection: (title: ReactNode, subtitle: ReactNode, body: ReactNode) => ReactNode;
}

interface SectorRow {
  name: string;
  days: number;
}

const TOP_SECTORS = 5;

// Sector is free text: "Bas Cuvier" and "bas  cuvier " are the same place
const sectorKey = (sector: string) => sector.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const localDayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/** Most visited sectors in the stats range; a visit is a day with at least one workout there. */
export const StatsSectors = ({ workouts, renderSection }: StatsSectorsProps) => {
  const { t } = useLanguage();

  const sectors = useMemo(() => {
    const byKey = new Map<string, { days: Set<string>; spellings: Map<string, number> }>();
    workouts.forEach(workout => {
      const sector = workout.sector?.trim().replace(/\s+/g, ' ');
      if (!sector) return;
      const key = sectorKey(sector);
      const entry = byKey.get(key) ?? { days: new Set<string>(), spellings: new Map<string, number>() };
      entry.days.add(localDayKey(new Date(workout.startTime)));
      entry.spellings.set(sector, (entry.spellings.get(sector) ?? 0) + 1);
      byKey.set(key, entry);
    });
    // Show each sector in the spelling used most often
    return Array.from(byKey.values())
      .map<SectorRow>(entry => ({
        name: Array.from(entry.spellings.entries()).sort((a, b) => b[1] - a[1])[0][0],
        days: entry.days.size,
      }))
      .sort((a, b) => b.days - a.days || a.name.localeCompare(b.name));
  }, [workouts]);

  const top = sectors.slice(0, TOP_SECTORS);
  const maxDays = Math.max(1, ...top.map(row => row.days));

  const body = sectors.length === 0 ? (
    <p className="rounded-uc-card border border-dashed border-uc-border px-4 py-5 text-center text-sm text-uc-text-muted">
      {t('stats.noSectors') || 'Add a sector to your workouts to see where you climb most'}
    </p>
  ) : (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <p className="min-w-0 text-[13px] font-semibold text-uc-text-muted">
          {t('stats.topSector') || 'Top sector'}{' '}
          <strong className="break-words text-[22px] font-extrabold text-uc-text">{sectors[0].name}</strong>
        </p>
        <p className="text-[13px] font-semibold text-uc-text-muted">
          {t('stats.sectorDays') || 'Days'}{' '}
          <strong className="text-[22px] font-extrabold text-uc-text uc-num">{sectors[0].days}</strong>
        </p>
        <p className="text-[13px] font-semibold text-uc-text-muted">
          {t('stats.sectorsVisited') || 'Sectors'}{' '}
          <strong className="text-[22px] font-extrabold text-uc-text uc-num">{sectors.length}</strong>
        </p>
      </div>

      {/* Days per sector, most visited first */}
      <ul className="space-y-2">
        {top.map(row => (
          <li key={row.name}>
            <p className="truncate text-sm font-bold text-uc-text">{row.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-uc-pill bg-uc-skeleton overflow-hidden">
                <div className="h-full rounded-uc-pill bg-uc-primary" style={{ width: `${(row.days / maxDays) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-sm font-bold text-uc-text uc-num">{row.days}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return renderSection(
    t('stats.sectors') || 'Sectors',
    t('stats.sectorsSubtitle') || 'Days at each sector in the selected range',
    body,
  );
};
