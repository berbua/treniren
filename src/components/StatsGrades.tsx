'use client';

import { ReactNode, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { SendStyle, Workout } from '@/types/workout';
import { ClimbKind, GradeSystem, climbKindFor, gradeAtRank, gradeRank, isSend } from '@/lib/grades';
import { SegmentedControl } from './ui';

interface StatsGradesProps {
  /** Workouts already filtered to the range. */
  workouts: Workout[];
  start: Date;
  end: Date;
  renderSection: (title: ReactNode, subtitle: ReactNode, body: ReactNode) => ReactNode;
}

interface GradedClimb {
  kind: ClimbKind;
  system: GradeSystem;
  rank: number;
  style?: SendStyle;
  tries?: number;
  date: Date;
}

interface MonthPoint {
  monthStart: number; // local midnight (ms) of the 1st
  rank: number | null; // hardest send that month
}

const climbTypes = ['LEAD_ROCK', 'LEAD_ARTIFICIAL', 'BOULDERING'];
const PYRAMID_ROWS = 6;

/** Grade progress for lead and bouldering: hardest send per month and a pyramid of sends in the stats range. */
export const StatsGrades = ({ workouts, start, end, renderSection }: StatsGradesProps) => {
  const { t, language } = useLanguage();
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB';

  const climbs = useMemo(() => {
    const result: GradedClimb[] = [];
    workouts.forEach(workout => {
      if (!climbTypes.includes(workout.type)) return;
      const kind = climbKindFor(workout.type);
      workout.mentalState?.climbSections?.forEach(section => {
        const rank = gradeRank(section.gradeSystem, kind, section.grade);
        if (rank === null) return;
        result.push({
          kind,
          system: section.gradeSystem as GradeSystem,
          rank,
          style: section.style,
          tries: section.tries,
          date: new Date(workout.startTime),
        });
      });
    });
    return result;
  }, [workouts]);

  const kinds = (['route', 'boulder'] as ClimbKind[]).filter(kind => climbs.some(climb => climb.kind === kind));
  const [selectedKind, setSelectedKind] = useState<ClimbKind | null>(null);
  const kind = selectedKind && kinds.includes(selectedKind) ? selectedKind : kinds[0] ?? 'route';

  const kindClimbs = climbs.filter(climb => climb.kind === kind);
  const sends = kindClimbs.filter(isSend);

  // Grades show in the system used most for this kind; others are converted
  const systemCounts = new Map<GradeSystem, number>();
  kindClimbs.forEach(climb => systemCounts.set(climb.system, (systemCounts.get(climb.system) ?? 0) + 1));
  const displaySystem = Array.from(systemCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'french';
  const label = (rank: number) => gradeAtRank(displaySystem, kind, rank);

  const hardest = sends.reduce<number | null>((max, climb) => (max === null || climb.rank > max ? climb.rank : max), null);
  const redpointTries = sends.filter(climb => climb.style === 'REDPOINT' && climb.tries);
  const avgRedpointTries = redpointTries.length > 0
    ? redpointTries.reduce((sum, climb) => sum + (climb.tries ?? 0), 0) / redpointTries.length
    : null;

  const months: MonthPoint[] = [];
  for (let month = new Date(start.getFullYear(), start.getMonth(), 1); month <= end; month.setMonth(month.getMonth() + 1)) {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const inMonth = sends.filter(climb => climb.date >= month && climb.date < next);
    months.push({
      monthStart: month.getTime(),
      rank: inMonth.length > 0 ? Math.max(...inMonth.map(climb => climb.rank)) : null,
    });
  }

  // Pyramid: sends per displayed grade, hardest first
  const pyramidRows = new Map<string, { rank: number; count: number; styles: Partial<Record<SendStyle, number>> }>();
  sends.forEach(climb => {
    const grade = label(climb.rank);
    const row = pyramidRows.get(grade) ?? { rank: gradeRank(displaySystem, kind, grade) ?? climb.rank, count: 0, styles: {} };
    row.count += 1;
    if (climb.style) row.styles[climb.style] = (row.styles[climb.style] ?? 0) + 1;
    pyramidRows.set(grade, row);
  });
  const pyramid = Array.from(pyramidRows.entries())
    .map(([grade, row]) => ({ grade, ...row }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, PYRAMID_ROWS);
  const pyramidMax = Math.max(1, ...pyramid.map(row => row.count));

  const sendRanks = months.flatMap(point => (point.rank === null ? [] : [point.rank]));
  const yMin = sendRanks.length > 0 ? Math.max(0, Math.min(...sendRanks) - 1) : 0;
  const yMax = sendRanks.length > 0 ? Math.max(...sendRanks) + 1 : 1;
  const yTicks = Array.from({ length: yMax - yMin + 1 }, (_, i) => yMin + i);

  const formatMonth = (ms: number) => new Date(ms).toLocaleDateString(locale, { month: 'short' });
  const formatMonthLong = (ms: number) => new Date(ms).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const styleLabel = (style: SendStyle) => t(`workouts.sendStyles.${style}`);
  const muted = 'var(--uc-text-muted)';

  const body = climbs.length === 0 ? (
    <p className="rounded-uc-card border border-dashed border-uc-border px-4 py-5 text-center text-sm text-uc-text-muted">
      {t('stats.noGradedClimbs') || 'Add grades to climbs in Lead or Bouldering sessions to see your progress'}
    </p>
  ) : (
    <div className="space-y-5">
      {kinds.length > 1 && (
        <SegmentedControl
          ariaLabel={t('stats.climbKind') || 'Climb type'}
          options={[
            { value: 'route', label: t('stats.routes') || 'Routes' },
            { value: 'boulder', label: t('stats.boulders') || 'Boulders' },
          ]}
          value={kind}
          onChange={setSelectedKind}
        />
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <p className="text-[13px] font-semibold text-uc-text-muted">
          {t('stats.hardestSend') || 'Hardest send'}{' '}
          <strong className="text-[22px] font-extrabold text-uc-text uc-num">{hardest === null ? '—' : label(hardest)}</strong>
        </p>
        <p className="text-[13px] font-semibold text-uc-text-muted">
          {t('stats.sends') || 'Sends'}{' '}
          <strong className="text-[22px] font-extrabold text-uc-text uc-num">{sends.length}</strong>
          <span className="uc-num"> / {kindClimbs.length}</span>
        </p>
        {avgRedpointTries !== null && (
          <p className="text-[13px] font-semibold text-uc-text-muted">
            {t('stats.avgRedpointTries') || 'Avg tries per redpoint'}{' '}
            <strong className="text-[22px] font-extrabold text-uc-text uc-num">{avgRedpointTries.toFixed(1)}</strong>
          </p>
        )}
      </div>

      {sends.length === 0 ? (
        <p className="rounded-uc-card border border-dashed border-uc-border px-4 py-5 text-center text-sm text-uc-text-muted">
          {t('stats.noSends') || 'No sends in this range yet'}
        </p>
      ) : (
        <>
          {/* Hardest send per month */}
          <div>
            <h3 className="text-sm font-bold text-uc-text">{t('stats.hardestSendPerMonth') || 'Hardest send per month'}</h3>
            <div className="mt-2" aria-hidden>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={months} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--uc-border)" />
                  <XAxis
                    dataKey="monthStart"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: muted, fontSize: 12 }}
                    tickFormatter={(value: number) => formatMonth(value)}
                    minTickGap={8}
                  />
                  <YAxis
                    domain={[yMin, yMax]}
                    ticks={yTicks}
                    interval={yTicks.length > 6 ? 1 : 0}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: muted, fontSize: 12 }}
                    tickFormatter={(value: number) => label(value)}
                  />
                  <Tooltip
                    cursor={{ stroke: 'var(--uc-border)' }}
                    content={({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload: MonthPoint }> }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const point = payload[0].payload;
                      return (
                        <div className="rounded-uc-input border border-uc-border bg-uc-elevated p-3 shadow-uc">
                          <p className="mb-1 text-sm font-bold text-uc-text">{formatMonthLong(point.monthStart)}</p>
                          <p className="text-sm text-uc-text uc-num">
                            {point.rank === null ? (t('stats.noSends') || 'No sends') : <strong>{label(point.rank)}</strong>}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rank"
                    stroke="var(--uc-primary)"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--uc-primary)', stroke: 'var(--uc-surface)', strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <table className="sr-only">
              <caption>{t('stats.hardestSendPerMonth') || 'Hardest send per month'}</caption>
              <tbody>
                {months.map(point => (
                  <tr key={point.monthStart}>
                    <td>{formatMonthLong(point.monthStart)}</td>
                    <td>{point.rank === null ? '—' : label(point.rank)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grade pyramid */}
          <div>
            <h3 className="text-sm font-bold text-uc-text">{t('stats.gradePyramid') || 'Grade pyramid'}</h3>
            <ul className="mt-2 space-y-2">
              {pyramid.map(row => (
                <li key={row.grade} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3">
                  <span className="text-sm font-extrabold text-uc-text uc-num">{row.grade}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 rounded-uc-pill bg-uc-skeleton overflow-hidden">
                        <div className="h-full rounded-uc-pill bg-uc-primary" style={{ width: `${(row.count / pyramidMax) * 100}%` }} />
                      </div>
                      <span className="w-6 text-right text-sm font-bold text-uc-text uc-num">{row.count}</span>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-uc-text-muted">
                      {(Object.entries(row.styles) as [SendStyle, number][])
                        .map(([style, count]) => `${styleLabel(style)} ${count}`)
                        .join(' · ')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );

  return renderSection(
    t('stats.grades') || 'Grades',
    t('stats.gradesSubtitle') || 'Lead and bouldering sends in the selected range',
    body,
  );
};
