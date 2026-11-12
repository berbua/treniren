'use client'

import { useState, useEffect } from 'react'
import { FingerboardTestingProtocol, FingerboardTestResult } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import FingerboardTestingProtocolForm from './FingerboardTestingProtocolForm'
import PerformTestModal from './PerformTestModal'
import FingerboardTestChart from './FingerboardTestChart'
import FingerboardTestResultsTable from './FingerboardTestResultsTable'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { BottomSheet, Button, Card, EmptyState, Icon, Overline, SkeletonRows } from './ui'

interface FingerboardTestModalProps {
  onClose: () => void
}

type ModalStep = 'select' | 'create' | 'perform' | 'results'

export default function FingerboardTestModal({ onClose }: FingerboardTestModalProps) {
  const { t } = useLanguage()
  const { getToken } = useCsrfToken()
  const [step, setStep] = useState<ModalStep>('select')
  const [testingProtocols, setTestingProtocols] = useState<FingerboardTestingProtocol[]>([])
  const [selectedProtocol, setSelectedProtocol] = useState<FingerboardTestingProtocol | null>(null)
  const [testResults, setTestResults] = useState<FingerboardTestResult[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchTestingProtocols()
  }, [])

  useEffect(() => {
    if (selectedProtocol && step === 'results') {
      fetchTestResults()
    }
  }, [selectedProtocol, step])

  const fetchTestingProtocols = async () => {
    try {
      const response = await fetch('/api/fingerboard-testing-protocols')
      if (response.ok) {
        const data = await response.json()
        setTestingProtocols(data)
      }
    } catch (error) {
      console.error('Error fetching testing protocols:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTestResults = async () => {
    if (!selectedProtocol) return

    try {
      const response = await fetch(`/api/fingerboard-test-results?protocolId=${selectedProtocol.id}`)
      if (response.ok) {
        const data = await response.json()
        setTestResults(data)
      }
    } catch (error) {
      console.error('Error fetching test results:', error)
    }
  }

  const handleSelectProtocol = (protocol: FingerboardTestingProtocol) => {
    setSelectedProtocol(protocol)
    setStep('perform')
  }

  const handleCreateProtocol = () => {
    setStep('create')
    setShowCreateForm(true)
  }

  const handleSubmitTestingProtocol = async (protocolData: any) => {
    setIsSubmitting(true)
    try {
      const token = await getToken()
      const response = await fetch('/api/fingerboard-testing-protocols', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify(protocolData),
      })

      if (response.ok) {
        const newProtocol = await response.json()
        await fetchTestingProtocols()
        setSelectedProtocol(newProtocol)
        setShowCreateForm(false)
        setStep('perform')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`${t('fingerboardTesting.createError') || 'Failed to create testing protocol'}: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating testing protocol:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create protocol'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTestPerformed = () => {
    setStep('results')
    fetchTestResults()
  }

  const handleProtocolUpdated = async () => {
    await fetchTestingProtocols()
    // Update selectedProtocol if it exists
    if (selectedProtocol) {
      const response = await fetch(`/api/fingerboard-testing-protocols/${selectedProtocol.id}`)
      if (response.ok) {
        const updatedProtocol = await response.json()
        setSelectedProtocol(updatedProtocol)
      }
    }
  }

  const handleViewResults = (protocol: FingerboardTestingProtocol) => {
    setSelectedProtocol(protocol)
    setStep('results')
  }

  const handleCloneProtocol = async (protocol: FingerboardTestingProtocol) => {
    try {
      const clonedData = {
        name: `${protocol.name} (Copy)`,
        description: protocol.description || '',
        testHangs: protocol.testHangs.map((hang) => ({
          order: hang.order,
          handType: hang.handType,
          gripType: hang.gripType,
          crimpSize: hang.crimpSize || undefined,
          customDescription: hang.customDescription || undefined,
          targetLoad: hang.targetLoad || undefined,
          targetTimeSeconds: hang.targetTimeSeconds || undefined,
          notes: hang.notes || undefined,
        })),
      }

      const token = await getToken()
      const response = await fetch('/api/fingerboard-testing-protocols', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-csrf-token': token,
        },
        body: JSON.stringify(clonedData),
      })

      if (response.ok) {
        await fetchTestingProtocols()
        // Optionally show a success message or open the cloned protocol for editing
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`${t('fingerboardTesting.cloneError') || 'Failed to clone protocol'}: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error cloning protocol:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to clone protocol'}`)
    }
  }

  const handleBack = () => {
    setStep('select')
    setSelectedProtocol(null)
  }

  // The create form and the perform form are sheets of their own
  if (step === 'create' || showCreateForm) {
    return (
      <FingerboardTestingProtocolForm
        protocol={null}
        onSubmit={handleSubmitTestingProtocol}
        onCancel={() => {
          setShowCreateForm(false)
          setStep('select')
        }}
        isSubmitting={isSubmitting}
      />
    )
  }

  if (step === 'perform' && selectedProtocol) {
    return (
      <PerformTestModal
        protocol={selectedProtocol}
        onTestPerformed={handleTestPerformed}
        onClose={() => setStep('select')}
        onProtocolUpdated={handleProtocolUpdated}
      />
    )
  }

  const stepNumber = step === 'results' ? 3 : 1
  const resultsCount = (protocol: FingerboardTestingProtocol) =>
    (protocol as FingerboardTestingProtocol & { _count?: { testResults?: number } })._count?.testResults || 0

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      size={step === 'results' ? 'lg' : 'md'}
      closeLabel={t('common.close') || 'Close'}
      title={
        step === 'results' && selectedProtocol ? (
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleBack}
              aria-label={t('fingerboardTesting.back') || 'Back'}
              className="-ml-3 inline-flex size-11 shrink-0 items-center justify-center rounded-uc-input text-uc-text-muted transition-colors hover:bg-uc-surface hover:text-uc-text"
            >
              <svg aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <span className="break-words">{selectedProtocol.name}</span>
          </span>
        ) : (
          t('fingerboard.testYourself') || 'Test Yourself'
        )
      }
    >
      {/* Step indicator */}
      <div className="mb-4">
        <p className="mb-2 text-right text-[13px] font-semibold text-uc-text-muted uc-num">
          {t('fingerboardTesting.stepOf', { step: stepNumber, total: 3 }) || `Step ${stepNumber} of 3`}
        </p>
        <div aria-hidden className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`h-1 rounded-uc-pill ${n <= stepNumber ? 'bg-uc-primary' : 'bg-uc-border'}`} />
          ))}
        </div>
      </div>

      {step === 'select' ? (
        loading ? (
          <SkeletonRows />
        ) : testingProtocols.length === 0 ? (
          <div className="rounded-uc-card border border-dashed border-uc-border">
            <EmptyState
              icon={<Icon name="test" size={28} />}
              title={t('workouts.labels.noTestingProtocols') || 'No testing protocols yet'}
              description={t('fingerboard.testYourselfTooltip')}
              action={
                <Button variant="accent" onClick={handleCreateProtocol}>
                  + {t('fingerboardTesting.createFirstProtocol') || 'Create Your First Testing Protocol'}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-uc-text-muted">
              {t('fingerboardTesting.chooseProtocol') || 'Choose a test protocol'}
            </p>
            {testingProtocols.map((protocol) => (
              <Card key={protocol.id} className="space-y-3">
                <div>
                  <h3 className="text-[17px] font-extrabold leading-snug text-uc-text break-words">{protocol.name}</h3>
                  <p className="mt-0.5 text-[13px] font-semibold text-uc-text-muted uc-num">
                    {protocol.testHangs.length} {protocol.testHangs.length === 1
                      ? t('fingerboard.hang') || 'hang'
                      : t('fingerboard.hangs') || 'hangs'}
                    {resultsCount(protocol) > 0 && (
                      <> · {t('fingerboardTesting.resultsCount', { count: resultsCount(protocol) })}</>
                    )}
                  </p>
                  {protocol.description && (
                    <p className="mt-1 text-sm text-uc-text-muted">{protocol.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="accent" className="px-2" onClick={() => handleSelectProtocol(protocol)}>
                    {t('fingerboardTesting.performTest') || 'Perform Test'}
                  </Button>
                  <Button variant="ghost" className="px-2" onClick={() => handleViewResults(protocol)}>
                    {t('fingerboardTesting.results') || 'Results'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-2"
                    onClick={() => handleCloneProtocol(protocol)}
                    title={t('fingerboardTesting.cloneTitle') || 'Duplicate this protocol'}
                  >
                    {t('fingerboardTesting.clone') || 'Clone'}
                  </Button>
                </div>
              </Card>
            ))}
            <button
              type="button"
              onClick={handleCreateProtocol}
              className="flex min-h-14 w-full items-center justify-center rounded-uc-card border border-dashed border-uc-border px-4 text-sm font-bold text-uc-primary transition-colors hover:border-uc-primary"
            >
              + {t('fingerboardTesting.createProtocol') || 'Create Testing Protocol'}
            </button>
          </div>
        )
      ) : step === 'results' && selectedProtocol ? (
        <div className="space-y-4">
          <Button variant="accent" size="lg" className="w-full" onClick={() => setStep('perform')}>
            {t('fingerboardTesting.performAnother') || 'Perform another test'}
          </Button>

          {testResults.length > 0 && (
            <FingerboardTestChart testResults={testResults} protocol={selectedProtocol} />
          )}

          <Card padded={false} className="overflow-hidden">
            <Overline className="px-4 pt-4 pb-1 uc-num">
              {t('fingerboardTesting.testResults') || 'Test Results'} ({testResults.length})
            </Overline>
            {testResults.length === 0 ? (
              <p className="px-4 pb-6 pt-4 text-center text-sm text-uc-text-muted">
                {t('fingerboard.noTestResults') || 'No test results yet'}
              </p>
            ) : (
              <FingerboardTestResultsTable testResults={testResults} />
            )}
          </Card>
        </div>
      ) : null}
    </BottomSheet>
  )
}
