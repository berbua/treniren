'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { FingerboardTestingProtocol, FingerboardTestResult, FingerboardTestHang } from '@/types/workout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import FingerboardTestChart from '@/components/FingerboardTestChart'
import PerformTestModal from '@/components/PerformTestModal'
import { formatHangDescription } from '@/lib/fingerboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'

export default function FingerboardTestResultsPage() {
  return (
    <AuthGuard>
      <FingerboardTestResultsPageContent />
    </AuthGuard>
  )
}

function FingerboardTestResultsPageContent() {
  const { t } = useLanguage()
  const params = useParams()
  const protocolId = params.id as string

  const [protocol, setProtocol] = useState<FingerboardTestingProtocol | null>(null)
  const [testResults, setTestResults] = useState<FingerboardTestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [showPerformTest, setShowPerformTest] = useState(false)
  const [selectedHangId, setSelectedHangId] = useState<string | null>(null)

  useEffect(() => {
    if (protocolId) {
      fetchProtocol()
      fetchTestResults()
    }
  }, [protocolId])

  const fetchProtocol = async () => {
    try {
      const response = await fetch(`/api/fingerboard-testing-protocols/${protocolId}`)
      if (response.ok) {
        const data = await response.json()
        setProtocol(data)
      }
    } catch (error) {
      console.error('Error fetching protocol:', error)
    }
  }

  const fetchTestResults = async () => {
    try {
      const response = await fetch(`/api/fingerboard-test-results?protocolId=${protocolId}`)
      if (response.ok) {
        const data = await response.json()
        setTestResults(data)
      }
    } catch (error) {
      console.error('Error fetching test results:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestPerformed = () => {
    fetchTestResults()
    setShowPerformTest(false)
  }

  const filteredResults = selectedHangId
    ? testResults.filter((tr) => tr.testHangId === selectedHangId)
    : testResults

  if (loading) {
    return <LoadingSpinner message="Loading test results..." fullScreen />
  }

  if (!protocol) {
    return (
      <div className="min-h-screen bg-uc-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-uc-text-muted">Protocol not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-uc-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-uc-text-light">
                📊 {protocol.name}
              </h1>
              {protocol.description && (
                <p className="text-uc-text-muted mt-2">{protocol.description}</p>
              )}
            </div>
            <button
              onClick={() => setShowPerformTest(true)}
              className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
            >
              + Perform Test
            </button>
          </div>
        </div>

        {/* Filter by hang type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-uc-text-light mb-2">
            Filter by Hang Type
          </label>
          <select
            value={selectedHangId || ''}
            onChange={(e) => setSelectedHangId(e.target.value || null)}
            className="bg-uc-dark-bg border border-uc-purple/30 rounded-lg px-4 py-2 text-uc-text-light focus:outline-none focus:border-uc-purple"
          >
            <option value="">All Hangs</option>
            {protocol.testHangs.map((hang) => (
              <option key={hang.id || `hang-${hang.order}`} value={hang.id || `hang-${hang.order}`}>
                {formatHangDescription(hang.handType, hang.gripType, hang.crimpSize, hang.customDescription)}
              </option>
            ))}
          </select>
        </div>

        {/* Charts */}
        {filteredResults.length > 0 && (
          <div className="mb-8">
            <FingerboardTestChart testResults={filteredResults} protocol={protocol} />
          </div>
        )}

        {/* Test Results Table */}
        <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 overflow-hidden">
          <div className="p-6 border-b border-uc-purple/20">
            <h2 className="text-xl font-semibold text-uc-text-light">
              Test Results ({filteredResults.length})
            </h2>
          </div>
          {filteredResults.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-uc-text-light mb-2">
                {t('fingerboard.noTestResults') || 'No test results yet'}
              </h3>
              <p className="text-uc-text-muted mb-6 max-w-md mx-auto">
                {t('fingerboard.noTestResultsDescription') || 'Perform your first test to start tracking your fingerboard progress over time. Regular testing helps you see improvements and adjust your training.'}
              </p>
              <button
                onClick={() => setShowPerformTest(true)}
                className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
              >
                ➕ {t('fingerboard.performTest') || 'Perform Your First Test'}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-uc-black/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-uc-text-muted uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-uc-text-muted uppercase tracking-wider">
                      Hang Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-uc-text-muted uppercase tracking-wider">
                      Load (kg)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-uc-text-muted uppercase tracking-wider">
                      Time (s)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-uc-text-muted uppercase tracking-wider">
                      Success
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-uc-text-muted uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-uc-purple/10">
                  {filteredResults.map((result) => {
                    const hang = protocol.testHangs.find((h) => (h.id || `hang-${h.order}`) === result.testHangId)
                    return (
                      <tr key={result.id} className="hover:bg-uc-black/30">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-uc-text-light">
                          {new Date(result.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-uc-text-light">
                          {formatHangDescription(
                            result.handType,
                            result.gripType,
                            result.crimpSize,
                            result.customDescription
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-uc-text-light">
                          {result.load !== null && result.load !== undefined
                            ? `+${result.load}`
                            : result.unload !== null && result.unload !== undefined
                            ? `-${result.unload}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-uc-text-light">
                          {result.timeSeconds || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {result.success === true ? (
                            <span className="text-green-400">✓</span>
                          ) : result.success === false ? (
                            <span className="text-red-400">✗</span>
                          ) : (
                            <span className="text-uc-text-muted">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-uc-text-muted">
                          {result.notes || '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showPerformTest && (
        <PerformTestModal
          protocol={protocol}
          onTestPerformed={handleTestPerformed}
          onClose={() => setShowPerformTest(false)}
        />
      )}
    </div>
  )
}

