'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingSpinner } from './LoadingSpinner'

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
  const { t } = useLanguage()
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
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Loading progression data..." />
      </div>
    )
  }

  if (error || !data || data.dataPoints.length === 0) {
    return (
      <div className="bg-uc-dark-bg rounded-xl p-8 text-center border border-uc-purple/20">
        <div className="text-4xl mb-4">📊</div>
        <p className="text-uc-text-muted">
          {error || 'No progression data available yet'}
        </p>
        <p className="text-sm text-uc-text-muted mt-2">
          Add this exercise to workouts to start tracking progress
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
      date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
      <div className="bg-uc-dark-bg rounded-xl p-8 text-center border border-uc-purple/20">
        <div className="text-4xl mb-4">📊</div>
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
              <tr className="border-b border-uc-purple/20">
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
                <tr key={index} className="border-b border-uc-purple/10">
                  <td className="p-2 text-uc-text-light">{point.date}</td>
                  <td className="p-2 text-uc-mustard font-medium">
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
    Legend,
    ResponsiveContainer,
  } = RechartsComponents

  // Select chart component based on type
  const ChartComponent = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : BarChart
  const DataComponent = chartType === 'line' ? Line : chartType === 'area' ? Area : Bar

  const getMetricLabel = () => {
    switch (metric) {
      case 'weight':
        return 'Max Weight'
      case 'volume':
        return 'Total Volume'
      case '1rm':
        return 'Estimated 1RM'
      case 'reps':
        return 'Average Reps'
      default:
        return 'Weight'
    }
  }

  const getUnit = () => {
    if (metric === 'volume') {
      return `${data.exercise.defaultUnit}`
    }
    if (metric === 'reps') {
      return 'reps'
    }
    return data.exercise.defaultUnit
  }

  return (
    <div className="bg-uc-dark-bg rounded-xl p-6 border border-uc-purple/20">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-uc-text-light">
          {getMetricLabel()} Over Time
        </h3>
        <p className="text-sm text-uc-text-muted">
          {data.dataPoints.length} {data.dataPoints.length === 1 ? 'workout' : 'workouts'} in this period
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ 
              value: getUnit(), 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: '#9CA3AF' }
            }}
          />
          <Tooltip 
            content={({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { reps: number; sets: number } }>; label?: string }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                const repsLabel = t('workouts.labels.reps') || t('workouts.placeholders.reps') || 'Reps'
                const setsLabel = t('workouts.labels.sets') || t('workouts.placeholders.sets') || 'Sets'
                
                // Format the date label
                const point = chartData.find(d => d.date === label)
                const formattedDate = point 
                  ? new Date(point.fullDate).toLocaleDateString('en-US', { 
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : label
                
                return (
                  <div style={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #4B5563',
                    borderRadius: '8px',
                    padding: '12px',
                  }}>
                    <p style={{ 
                      color: '#F3F4F6', 
                      marginBottom: '8px', 
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {formattedDate}
                    </p>
                    <p style={{ 
                      color: '#FCD34D', 
                      marginBottom: '4px',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {payload[0].value} {getUnit()}
                    </p>
                    {data.reps > 0 && (
                      <p style={{ 
                        color: '#D1D5DB', 
                        marginBottom: '2px',
                        fontSize: '12px'
                      }}>
                        {repsLabel}: {data.reps}
                      </p>
                    )}
                    {data.sets > 0 && (
                      <p style={{ 
                        color: '#D1D5DB', 
                        marginBottom: '0',
                        fontSize: '12px'
                      }}>
                        {setsLabel}: {data.sets}
                      </p>
                    )}
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
          <DataComponent 
            type="monotone" 
            dataKey="value" 
            stroke="#FCD34D" 
            fill="#FCD34D"
            fillOpacity={chartType === 'area' ? 0.3 : 1}
            strokeWidth={2}
            dot={{ fill: '#FCD34D', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

