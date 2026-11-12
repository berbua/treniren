'use client'

import { useState, useMemo } from 'react'
import { FingerboardTestingProtocol, FingerboardTestResult } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { formatHangDescription } from '@/lib/fingerboard-utils'
import { Card, SegmentedControl, Select } from './ui'

// Dynamic import for Recharts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RechartsComponents: any = null

if (typeof window !== 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const recharts = require('recharts')
    RechartsComponents = {
      LineChart: recharts.LineChart,
      Line: recharts.Line,
      XAxis: recharts.XAxis,
      YAxis: recharts.YAxis,
      CartesianGrid: recharts.CartesianGrid,
      Tooltip: recharts.Tooltip,
      ResponsiveContainer: recharts.ResponsiveContainer,
    }
  } catch (e) {
    console.warn('Recharts not installed. Please run: npm install recharts')
  }
}

interface FingerboardTestChartProps {
  testResults: FingerboardTestResult[]
  protocol: FingerboardTestingProtocol
  /** false when the page already filters by hang (testing protocol detail). */
  showHangFilter?: boolean
  /** true: no card around it (it sits inside another card, e.g. on Statistics). */
  plain?: boolean
}

// First line in the fingerboard colour, then tag colours
const LINE_COLORS = ['var(--uc-workout-fingerboard)', 'var(--uc-tag-1)', 'var(--uc-tag-5)', 'var(--uc-tag-3)', 'var(--uc-tag-4)', 'var(--uc-tag-2)']

export default function FingerboardTestChart({ testResults, protocol, showHangFilter = true, plain = false }: FingerboardTestChartProps) {
  const { t, language } = useLanguage()
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB'
  const hangLabel = (hang: FingerboardTestingProtocol['testHangs'][number]) =>
    formatHangDescription(t, hang.handType, hang.gripType, hang.crimpSize, hang.customDescription).replace(/ • /g, ' · ')
  const [metric, setMetric] = useState<'time' | 'load'>('load')
  const [selectedHangId, setSelectedHangId] = useState<string | null>(null)

  // Group results by date and hang
  const chartData = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grouped: Record<string, any> = {}

    testResults.forEach((result) => {
      const dateKey = new Date(result.date).toISOString().split('T')[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey }
      }

      const hangKey = result.testHangId
      if (selectedHangId && hangKey !== selectedHangId) {
        return
      }

      const hang = protocol.testHangs.find((h) => (h.id || `hang-${h.order}`) === hangKey)
      const label = hang ? hangLabel(hang) : hangKey

      if (metric === 'time') {
        grouped[dateKey][label] = result.timeSeconds || 0
      } else {
        grouped[dateKey][label] = result.load || result.unload ? (result.load || 0) - (result.unload || 0) : 0
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testResults, metric, selectedHangId, protocol, language])

  const availableHangs = useMemo(() => {
    return protocol.testHangs.filter((hang) =>
      testResults.some((result) => result.testHangId === (hang.id || `hang-${hang.order}`))
    )
  }, [protocol, testResults])

  if (!RechartsComponents) {
    return (
      <Card className="text-center">
        <p className="text-sm text-uc-text-muted">
          Charts require Recharts library. Please run: npm install recharts
        </p>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return null
  }

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } =
    RechartsComponents

  const uniqueHangLabels = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chartData.forEach((point: any) => {
    Object.keys(point).forEach((key) => {
      if (key !== 'date') {
        uniqueHangLabels.add(key)
      }
    })
  })
  const lines = Array.from(uniqueHangLabels)

  const muted = 'var(--uc-text-muted)'
  const unit = metric === 'time' ? 's' : 'kg'
  const formatDate = (value: string, long = false) =>
    new Date(value).toLocaleDateString(locale, long ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'short' })

  const Wrapper = plain ? 'div' : Card

  return (
    <Wrapper className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-extrabold text-uc-text">
          {metric === 'time'
            ? t('fingerboardTesting.chartTitleTime') || 'Hang time per test'
            : t('fingerboardTesting.chartTitleLoad') || 'Added load per test'}
        </h3>
        <span className="shrink-0 text-[13px] font-semibold text-uc-text-muted">{unit}</span>
      </div>

      {showHangFilter && availableHangs.length > 1 && (
        <Select
          value={selectedHangId || ''}
          onChange={(e) => setSelectedHangId(e.target.value || null)}
          aria-label={t('workouts.labels.filterByHang') || 'Filter by Hang'}
        >
          <option value="">{t('common.allHangs') || 'All Hangs'}</option>
          {availableHangs.map((hang) => {
            const hangId = hang.id || `hang-${hang.order}`
            return (
              <option key={hangId} value={hangId}>
                {hangLabel(hang)}
              </option>
            )
          })}
        </Select>
      )}

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--uc-border)" />
          <XAxis
            dataKey="date"
            stroke={muted}
            tickLine={false}
            axisLine={false}
            tick={{ fill: muted, fontSize: 12 }}
            tickFormatter={(value: string) => formatDate(value)}
          />
          <YAxis
            stroke={muted}
            tickLine={false}
            axisLine={false}
            tick={{ fill: muted, fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: 'var(--uc-border)' }}
            content={({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
              if (!active || !payload || payload.length === 0 || !label) return null
              return (
                <div className="rounded-uc-input border border-uc-border bg-uc-elevated p-3 shadow-uc">
                  <p className="mb-1.5 text-sm font-bold text-uc-text">{formatDate(label, true)}</p>
                  {payload.map((entry) => (
                    <p key={entry.name} className="flex items-center gap-2 text-sm text-uc-text uc-num">
                      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: entry.color }} />
                      {lines.length > 1 && <span className="text-uc-text-muted">{entry.name}</span>}
                      <span className="font-bold">
                        {metric === 'load' && entry.value > 0 ? '+' : ''}{entry.value} {unit}
                      </span>
                    </p>
                  ))}
                </div>
              )
            }}
          />
          {lines.map((label, index) => {
            const color = LINE_COLORS[index % LINE_COLORS.length]
            return (
              <Line
                key={label}
                type="monotone"
                dataKey={label}
                stroke={color}
                strokeWidth={2.5}
                dot={{ fill: 'var(--uc-surface)', stroke: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: color }}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>

      {lines.length > 1 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {lines.map((label, index) => (
            <li key={label} className="flex items-center gap-2 text-[13px] font-semibold text-uc-text-muted">
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: LINE_COLORS[index % LINE_COLORS.length] }} />
              {label}
            </li>
          ))}
        </ul>
      )}

      <SegmentedControl
        ariaLabel={t('fingerboardTesting.metric') || 'Metric'}
        options={[
          { value: 'load', label: t('fingerboardTesting.metricLoad') || 'Load' },
          { value: 'time', label: t('fingerboardTesting.metricTime') || 'Time' },
        ]}
        value={metric}
        onChange={setMetric}
      />
    </Wrapper>
  )
}
