'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { FingerboardTestingProtocol, FingerboardTestResult } from '@/types/workout'
import Link from 'next/link'
import FingerboardTestChart from '@/components/FingerboardTestChart'
import FingerboardTestResultsTable from '@/components/FingerboardTestResultsTable'
import PerformTestModal from '@/components/PerformTestModal'
import { formatHangDescription } from '@/lib/fingerboard-utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button, Card, ChoiceChip, EmptyState, Icon, Overline, SkeletonRows } from '@/components/ui'

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

  const backLink = (
    <Link
      href="/fingerboard-testing"
      aria-label={t('fingerboardTesting.back') || 'Back'}
      className="-ml-3 inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text-muted transition-colors hover:bg-uc-surface hover:text-uc-text"
    >
      <svg aria-hidden className="size-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="m15 6-6 6 6 6" />
      </svg>
    </Link>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-uc-bg">
        <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
          <SkeletonRows />
        </div>
      </div>
    )
  }

  if (!protocol) {
    return (
      <div className="min-h-screen bg-uc-bg">
        <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
          {backLink}
          <EmptyState icon={<Icon name="test" size={28} />} title={t('fingerboardTesting.protocolNotFound')} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-5 flex items-start gap-1">
          {backLink}
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="text-[28px] font-extrabold leading-tight text-uc-text break-words">
              {protocol.name}
            </h1>
            {protocol.description && (
              <p className="mt-1 text-sm text-uc-text-muted">{protocol.description}</p>
            )}
          </div>
          <Button variant="accent" size="lg" className="hidden shrink-0 lg:inline-flex" onClick={() => setShowPerformTest(true)}>
            {t('fingerboardTesting.performTest')}
          </Button>
        </div>

        <Button variant="accent" size="lg" className="mb-4 w-full lg:hidden" onClick={() => setShowPerformTest(true)}>
          {t('fingerboardTesting.performTest')}
        </Button>

        {/* Filter by hang type */}
        {protocol.testHangs.length > 1 && (
          <div
            role="group"
            aria-label={t('fingerboardTesting.filterByHang')}
            className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
          >
            <ChoiceChip selected={selectedHangId === null} className="shrink-0" onClick={() => setSelectedHangId(null)}>
              {t('fingerboardTesting.allHangs')}
            </ChoiceChip>
            {protocol.testHangs.map((hang) => {
              const hangId = hang.id || `hang-${hang.order}`
              return (
                <ChoiceChip
                  key={hangId}
                  selected={selectedHangId === hangId}
                  className="shrink-0 whitespace-nowrap"
                  onClick={() => setSelectedHangId(hangId)}
                >
                  {formatHangDescription(t, hang.handType, hang.gripType, hang.crimpSize, hang.customDescription).replace(/ • /g, ' · ')}
                </ChoiceChip>
              )
            })}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          {/* Chart */}
          {filteredResults.length > 0 && (
            <FingerboardTestChart testResults={filteredResults} protocol={protocol} showHangFilter={false} />
          )}

          {/* Test Results Table */}
          <Card padded={false} className={`overflow-hidden ${filteredResults.length === 0 ? 'lg:col-span-2' : ''}`}>
            <Overline className="px-4 pt-4 pb-1 uc-num">
              {t('fingerboardTesting.testResults')} ({filteredResults.length})
            </Overline>
            {filteredResults.length === 0 ? (
              <EmptyState
                icon={<Icon name="test" size={28} />}
                title={t('fingerboard.noTestResults') || 'No test results yet'}
                description={t('fingerboard.noTestResultsDescription')}
                action={
                  <Button variant="accent" onClick={() => setShowPerformTest(true)}>
                    + {t('fingerboard.performTest') || 'Perform Your First Test'}
                  </Button>
                }
              />
            ) : (
              <FingerboardTestResultsTable testResults={filteredResults} />
            )}
          </Card>
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
