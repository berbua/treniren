'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Icon, Skeleton } from '@/components/ui'

// Dynamic import for Recharts to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RechartsComponents: any = null

if (typeof window !== 'undefined') {
  try {
    // Try to import recharts - will fail if not installed
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const recharts = require('recharts')
    RechartsComponents = {
      LineChart: recharts.LineChart,
      Line: recharts.Line,
      AreaChart: recharts.AreaChart,
      Area: recharts.Area,
      BarChart: recharts.BarChart,
      Bar: recharts.Bar,
      XAxis: recharts.XAxis,
      YAxis: recharts.YAxis,
      CartesianGrid: recharts.CartesianGrid,
      Tooltip: recharts.Tooltip,
      Legend: recharts.Legend,
      ResponsiveContainer: recharts.ResponsiveContainer,
    }
  } catch (e) {
    // Recharts not installed
    console.warn('Recharts not installed. Please run: npm install recharts')
  }
}

export type TimeFrame = '1week' | '1month' | '3months' | '6months' | '1year' | 'all'
export type Metric = 'weight' | 'volume' | 'reps' | '1rm'
export type ChartType = 'line' | 'area' | 'bar'

export interface ExerciseProgressionChartProps {
  exerciseId: string
  metric?: Metric
  timeframe?: TimeFrame
  chartType?: ChartType
}

interface ProgressionDataPoint {
  date: string
  workoutId: string
  maxWeight: number
  totalVolume: number
  estimated1RM: number
  averageReps: number
  sets: number
  bestSet: {
    weight: number
    reps: number
    rir?: number
  }
}

interface ProgressionData {
  dataPoints: ProgressionDataPoint[]
  exercise: {
    defaultUnit: string
  }
}

export function ExerciseProgressionChart({
  exerciseId,
  metric = 'weight',
  timeframe = '1month',
  chartType = 'line',
}: ExerciseProgressionChartProps) {
  const { t, language } = useLanguage()
  const locale = language === 'pl' ? 'pl-PL' : 'en-GB'
  const [data, setData] = useState<ProgressionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProgressionData()
  }, [exerciseId, timeframe])

  const fetchProgressionData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/exercises/${exerciseId}/progression?timeframe=${timeframe}`)
      
      if (response.ok) {
        const progressionData = await response.json()
        setData(progressionData)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setError(errorData.error || 'Failed to load progression data')
      }
    } catch (error) {
      console.error('Error fetching progression data:', error)
      setError('Failed to load progression data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Skeleton className="h-[220px] w-full rounded-uc-input" />
    )
  }

  if (error || !data || data.dataPoints.length === 0) {
    return (
      <div className="rounded-uc-input border border-dashed border-uc-border px-4 py-8 text-center">
        <Icon name="stats" size={28} className="mx-auto mb-3 text-uc-text-muted" />
        <p className="text-sm font-semibold text-uc-text">
          {error || t('exercises.detail.noData') || 'No progression data available yet'}
        </p>
        <p className="text-[13px] text-uc-text-muted mt-1.5">
          {t('exercises.detail.noDataHint') || 'Add this exercise to workouts to start tracking progress'}
        </p>
      </div>
    )
  }

  // Format data for chart
  const chartData = data.dataPoints.map(point => {
    let value: number
    switch (metric) {
      case 'weight':
        value = point.maxWeight
        break
      case 'volume':
        value = point.totalVolume
        break
      case '1rm':
        value = point.estimated1RM
        break
      case 'reps':
        value = point.averageReps
        break
      default:
        value = point.maxWeight
    }

    return {
      date: new Date(point.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
      fullDate: point.date,
      value: Math.round(value * 10) / 10,
      workoutId: point.workoutId,
      reps: point.bestSet?.reps || point.averageReps || 0,
      sets: point.sets || 0,
    }
  })

  // Check if Recharts is available
  if (!RechartsComponents) {
    return (
      <div className="rounded-uc-input border border-uc-border p-6 text-center">
        <Icon name="stats" size={28} className="mx-auto mb-3 text-uc-text-muted" />
        <p className="text-uc-text-muted mb-2">
          Chart library not installed
        </p>
        <p className="text-sm text-uc-text-muted">
          {t('workouts.labels.installRecharts') || 'Please run: npm install recharts'}
        </p>
        {/* Fallback: Show data as table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-uc-border">
                <th className="p-2 text-uc-text-muted">Date</th>
                <th className="p-2 text-uc-text-muted">
                  {metric === 'weight' ? 'Max Weight' : 
                   metric === 'volume' ? 'Volume' : 
                   metric === '1rm' ? '1RM' : 'Reps'}
                </th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((point, index) => (
                <tr key={index} className="border-b border-uc-border">
                  <td className="p-2 text-uc-text">{point.date}</td>
                  <td className="p-2 text-uc-primary font-bold uc-num">
                    {point.value} {data.exercise.defaultUnit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
  } = RechartsComponents

  // Select chart component based on type
  const ChartComponent = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : BarChart
  const DataComponent = chartType === 'line' ? Line : chartType === 'area' ? Area : Bar

  const getUnit = () => {
    if (metric === 'volume') {
      return `${data.exercise.defaultUnit}`
    }
    if (metric === 'reps') {
      return 'reps'
    }
    return data.exercise.defaultUnit
  }

  const muted = 'var(--uc-text-muted)'
  const primary = 'var(--uc-primary)'

  return (
    <div>
      <p className="mb-3 text-[13px] font-semibold text-uc-text-muted">
        {t('exercises.detail.workoutsInPeriod', { count: data.dataPoints.length })}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <ChartComponent data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--uc-border)" />
          <XAxis
            dataKey="date"
            stroke={muted}
            tickLine={false}
            axisLine={false}
            tick={{ fill: muted, fontSize: 12 }}
          />
          <YAxis
            stroke={muted}
            tickLine={false}
            axisLine={false}
            tick={{ fill: muted, fontSize: 12 }}
            label={{
              value: getUnit(),
              angle: -90,
              position: 'insideLeft',
              style: { fill: muted, fontSize: 12 }
            }}
          />
          <Tooltip
            cursor={chartType === 'bar' ? { fill: 'var(--uc-elevated)' } : { stroke: 'var(--uc-border)' }}
            content={({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { reps: number; sets: number } }>; label?: string }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                const repsLabel = t('workouts.labels.reps') || t('workouts.placeholders.reps') || 'Reps'
                const setsLabel = t('workouts.labels.sets') || t('workouts.placeholders.sets') || 'Sets'
                
                // Format the date label
                const point = chartData.find(d => d.date === label)
                const formattedDate = point 
                  ? new Date(point.fullDate).toLocaleDateString(locale, { 
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : label
                
                return (
                  <div className="rounded-uc-input border border-uc-border bg-uc-elevated p-3 shadow-uc">
                    <p className="mb-2 text-sm font-bold text-uc-text">{formattedDate}</p>
                    <p className="mb-1 text-sm font-bold text-uc-primary uc-num">
                      {payload[0].value} {getUnit()}
                    </p>
                    {data.reps > 0 && (
                      <p className="text-xs text-uc-text-muted">{repsLabel}: {data.reps}</p>
                    )}
                    {data.sets > 0 && (
                      <p className="text-xs text-uc-text-muted">{setsLabel}: {data.sets}</p>
                    )}
                  </div>
                )
              }
              return null
            }}
          />
          <DataComponent 
            type="monotone" 
            dataKey="value" 
            stroke={primary}
            fill={primary}
            fillOpacity={chartType === 'area' ? 0.25 : 1}
            strokeWidth={2.5}
            radius={chartType === 'bar' ? [6, 6, 0, 0] : undefined}
            dot={{ fill: 'var(--uc-surface)', stroke: primary, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: primary }}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

