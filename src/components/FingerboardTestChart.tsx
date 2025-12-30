'use client'

import { useState, useMemo } from 'react'
import { FingerboardTestingProtocol, FingerboardTestResult } from '@/types/workout'
import { LoadingSpinner } from './LoadingSpinner'

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
      Legend: recharts.Legend,
      ResponsiveContainer: recharts.ResponsiveContainer,
    }
  } catch (e) {
    console.warn('Recharts not installed. Please run: npm install recharts')
  }
}

interface FingerboardTestChartProps {
  testResults: FingerboardTestResult[]
  protocol: FingerboardTestingProtocol
}

export default function FingerboardTestChart({ testResults, protocol }: FingerboardTestChartProps) {
  const [metric, setMetric] = useState<'time' | 'load'>('time')
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
      const hangLabel = hang
        ? `${hang.handType === 'ONE_HAND' ? '1H' : '2H'} ${hang.gripType}${hang.crimpSize ? ` ${hang.crimpSize}mm` : ''}`
        : hangKey

      if (metric === 'time') {
        grouped[dateKey][hangLabel] = result.timeSeconds || 0
      } else {
        grouped[dateKey][hangLabel] = result.load || result.unload ? (result.load || 0) - (result.unload || 0) : 0
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date))
  }, [testResults, metric, selectedHangId, protocol])

  const availableHangs = useMemo(() => {
    return protocol.testHangs.filter((hang) =>
      testResults.some((result) => result.testHangId === (hang.id || `hang-${hang.order}`))
    )
  }, [protocol, testResults])

  if (!RechartsComponents) {
    return (
      <div className="bg-uc-dark-bg rounded-xl p-8 border border-uc-purple/20 text-center">
        <p className="text-uc-text-muted">
          Charts require Recharts library. Please run: npm install recharts
        </p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return null
  }

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } =
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

  const colors = ['#FCD34D', '#A78BFA', '#60A5FA', '#34D399', '#F87171', '#FB7185']

  return (
    <div className="bg-uc-dark-bg rounded-xl p-6 border border-uc-purple/20">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs text-uc-text-muted mb-1">Metric</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as 'time' | 'load')}
            className="bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
          >
            <option value="time">Time (seconds)</option>
            <option value="load">Load (kg)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-uc-text-muted mb-1">Filter by Hang</label>
          <select
            value={selectedHangId || ''}
            onChange={(e) => setSelectedHangId(e.target.value || null)}
            className="bg-uc-black border border-uc-purple/30 rounded-lg px-3 py-2 text-uc-text-light text-sm focus:outline-none focus:border-uc-purple"
          >
            <option value="">All Hangs</option>
            {availableHangs.map((hang) => {
              const hangId = hang.id || `hang-${hang.order}`
              return (
                <option key={hangId} value={hangId}>
                  {hang.handType === 'ONE_HAND' ? '1H' : '2H'} {hang.gripType}
                  {hang.crimpSize ? ` ${hang.crimpSize}mm` : ''}
                </option>
              )
            })}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#6B7280" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            label={{
              value: metric === 'time' ? 'Time (seconds)' : 'Load (kg)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#9CA3AF' },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #6B21A8',
              borderRadius: '8px',
            }}
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <Legend />
          {Array.from(uniqueHangLabels).map((label, index) => (
            <Line
              key={label}
              type="monotone"
              dataKey={label}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

