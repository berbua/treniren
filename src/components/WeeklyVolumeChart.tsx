'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { Workout } from '@/types/workout';

interface WeeklyVolumeChartProps {
  /** Workouts already filtered to the range. */
  workouts: Workout[];
  start: Date;
  end: Date;
}

interface WeekPoint {
  weekStart: number; // local midnight (ms) of the Monday
  points: number;
  sessions: number;
}

// TR1 = 1 point … TR5 = 5 points
const trPoints = (workout: Workout) => (workout.trainingVolume ? Number(workout.trainingVolume.slice(2)) : 0);

const mondayOf = (date: Date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

/** Training volume in TR points per week (Mon–Sun) over the stats range, as bars. */
export const WeeklyVolumeChart = ({ workouts, start, end }: WeeklyVolumeChartProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB';

  const weeks = useMemo(() => {
    const byWeek = new Map<number, WeekPoint>();
    for (let monday = mondayOf(start); monday <= end; monday.setDate(monday.getDate() + 7)) {
      byWeek.set(monday.getTime(), { weekStart: monday.getTime(), points: 0, sessions: 0 });
    }
    workouts.forEach(workout => {
      const points = trPoints(workout);
      if (!points) return;
      const week = byWeek.get(mondayOf(new Date(workout.startTime)).getTime());
      if (!week) return;
      week.points += points;
      week.sessions += 1;
    });
    return Array.from(byWeek.values());
  }, [workouts, start, end]);

  const total = weeks.reduce((sum, week) => sum + week.points, 0);
  const average = weeks.length > 0 ? total / weeks.length : 0;

  const formatDay = (ms: number, withYear = false) =>
    new Date(ms).toLocaleDateString(locale, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
  // Calendar arithmetic, so a DST change inside the week doesn't shift Sunday
  const weekRange = (ms: number) => {
    const sunday = new Date(ms);
    sunday.setDate(sunday.getDate() + 6);
    return `${formatDay(ms)} – ${formatDay(sunday.getTime(), true)}`;
  };
  const muted = 'var(--uc-text-muted)';

  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <p className="text-[13px] font-semibold text-uc-text-muted">
          {t('stats.volumeTotal') || 'Total'}{' '}
          <strong className="text-[22px] font-extrabold text-uc-text uc-num">{total}</strong>{' '}
          {t('stats.trPoints') || 'TR points'}
        </p>
        <p className="text-[13px] font-semibold text-uc-text-muted">
          {t('stats.volumeAvgPerWeek') || 'Avg per week'}{' '}
          <strong className="text-[22px] font-extrabold text-uc-text uc-num">{average.toFixed(1)}</strong>
        </p>
      </div>

      {total === 0 ? (
        <p className="mt-4 rounded-uc-card border border-dashed border-uc-border px-4 py-5 text-center text-sm text-uc-text-muted">
          {t('stats.noTrValues') || 'No workouts with a TR value in this range'}
        </p>
      ) : (
        <>
          <div className="mt-3" aria-hidden>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeks} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke="var(--uc-border)" />
                <XAxis
                  dataKey="weekStart"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: muted, fontSize: 12 }}
                  tickFormatter={(value: number) => formatDay(value)}
                  minTickGap={16}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: muted, fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'var(--uc-elevated)' }}
                  content={({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload: WeekPoint }> }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const week = payload[0].payload;
                    return (
                      <div className="rounded-uc-input border border-uc-border bg-uc-elevated p-3 shadow-uc">
                        <p className="mb-1 text-sm font-bold text-uc-text uc-num">{weekRange(week.weekStart)}</p>
                        <p className="text-sm text-uc-text uc-num">
                          <strong>{week.points}</strong> {t('stats.trPoints') || 'TR points'}
                          <span className="text-uc-text-muted"> · {t('stats.sessionsCount', { count: week.sessions })}</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="points" fill="var(--uc-primary)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Same numbers for screen readers */}
          <table className="sr-only">
            <caption>{t('stats.weeklyVolume') || 'Weekly volume'}</caption>
            <thead>
              <tr>
                <th scope="col">{t('stats.week') || 'Week'}</th>
                <th scope="col">{t('stats.trPoints') || 'TR points'}</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map(week => (
                <tr key={week.weekStart}>
                  <td>{weekRange(week.weekStart)}</td>
                  <td>{week.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};
