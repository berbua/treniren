'use client'

import { useState, useEffect } from 'react'
import { FingerboardTestingProtocol, FingerboardTestResult } from '@/types/workout'
import { LoadingSpinner } from './LoadingSpinner'
import FingerboardTestingProtocolForm from './FingerboardTestingProtocolForm'
import PerformTestModal from './PerformTestModal'
import FingerboardTestChart from './FingerboardTestChart'
import { formatHangDescription } from '@/lib/fingerboard-utils'

interface FingerboardTestModalProps {
  onClose: () => void
}

type ModalStep = 'select' | 'create' | 'perform' | 'results'

export default function FingerboardTestModal({ onClose }: FingerboardTestModalProps) {
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
      const response = await fetch('/api/fingerboard-testing-protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        alert(`Failed to create testing protocol: ${errorData.error || 'Unknown error'}`)
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

      const response = await fetch('/api/fingerboard-testing-protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clonedData),
      })

      if (response.ok) {
        await fetchTestingProtocols()
        // Optionally show a success message or open the cloned protocol for editing
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`Failed to clone protocol: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error cloning protocol:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to clone protocol'}`)
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 'select':
        return 'Select Testing Protocol'
      case 'create':
        return 'Create Testing Protocol'
      case 'perform':
        return `Perform Test: ${selectedProtocol?.name}`
      case 'results':
        return `Test Results: ${selectedProtocol?.name}`
      default:
        return 'Test Yourself'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-uc-dark-bg rounded-xl border border-uc-purple/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-uc-dark-bg border-b border-uc-purple/20 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-uc-text-light">{getStepTitle()}</h2>
            {step === 'select' && (
              <p className="text-sm text-uc-text-muted mt-1">
                Track your fingerboard progress over time by performing regular tests
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step !== 'select' && (
              <button
                onClick={() => {
                  if (step === 'results') {
                    setStep('select')
                    setSelectedProtocol(null)
                  } else if (step === 'perform') {
                    setStep('select')
                    setSelectedProtocol(null)
                  } else {
                    setStep('select')
                  }
                }}
                className="text-uc-text-muted hover:text-uc-text-light transition-colors px-3 py-1"
              >
                ← Back
              </button>
            )}
            <button onClick={onClose} className="text-uc-text-muted hover:text-uc-text-light transition-colors">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && step === 'select' && !showCreateForm ? (
            <LoadingSpinner message="Loading testing protocols..." />
          ) : (step === 'create' || showCreateForm) ? (
            <FingerboardTestingProtocolForm
              protocol={null}
              onSubmit={handleSubmitTestingProtocol}
              onCancel={() => {
                setShowCreateForm(false)
                setStep('select')
              }}
              isSubmitting={isSubmitting}
            />
          ) : step === 'select' ? (
            <div className="space-y-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleCreateProtocol}
                  className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  + Create New Testing Protocol
                </button>
              </div>

              {testingProtocols.length === 0 ? (
                <div className="bg-uc-black/50 rounded-xl p-12 text-center border border-uc-purple/20">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-uc-text-muted mb-4">No testing protocols yet</p>
                  <button
                    onClick={handleCreateProtocol}
                    className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    Create Your First Testing Protocol
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testingProtocols.map((protocol) => (
                    <div
                      key={protocol.id}
                      className="bg-uc-black/50 rounded-xl p-4 border border-uc-purple/20 hover:border-uc-purple/40 transition-all"
                    >
                      <h3 className="text-lg font-semibold text-uc-text-light mb-2">{protocol.name}</h3>
                      {protocol.description && (
                        <p className="text-sm text-uc-text-muted mb-3">{protocol.description}</p>
                      )}
                      <div className="flex items-center text-sm text-uc-text-muted mb-4">
                        <span className="mr-2">🖐️</span>
                        <span>
                          {protocol.testHangs.length} {protocol.testHangs.length === 1 ? 'test hang' : 'test hangs'}
                        </span>
                        {(protocol as any)._count?.testResults > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{(protocol as any)._count.testResults} results</span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectProtocol(protocol)}
                          className="flex-1 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Perform Test
                        </button>
                        <button
                          onClick={() => handleViewResults(protocol)}
                          className="flex-1 bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          View Results
                        </button>
                      </div>
                      <button
                        onClick={() => handleCloneProtocol(protocol)}
                        className="w-full mt-2 bg-uc-black/50 hover:bg-uc-black text-uc-text-light px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-uc-purple/20"
                        title="Duplicate this protocol"
                      >
                        📋 Clone Protocol
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : step === 'perform' && selectedProtocol ? (
            <PerformTestModal
              protocol={selectedProtocol}
              onTestPerformed={handleTestPerformed}
              onClose={() => setStep('select')}
              onProtocolUpdated={handleProtocolUpdated}
            />
          ) : step === 'results' && selectedProtocol ? (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setStep('perform')}
                  className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  + Perform Another Test
                </button>
              </div>

              {testResults.length > 0 && (
                <FingerboardTestChart testResults={testResults} protocol={selectedProtocol} />
              )}

              <div className="bg-uc-black/50 rounded-xl border border-uc-purple/20 overflow-hidden">
                <div className="p-4 border-b border-uc-purple/20">
                  <h3 className="text-lg font-semibold text-uc-text-light">
                    Test Results ({testResults.length})
                  </h3>
                </div>
                {testResults.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-uc-text-muted">No test results yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-uc-black/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-uc-text-muted uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-uc-text-muted uppercase">
                            Hang Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-uc-text-muted uppercase">
                            Load (kg)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-uc-text-muted uppercase">
                            Time (s)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-uc-text-muted uppercase">
                            Success
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-uc-purple/10">
                        {testResults.map((result) => {
                          const hang = selectedProtocol.testHangs.find(
                            (h) => (h.id || `hang-${h.order}`) === result.testHangId
                          )
                          return (
                            <tr key={result.id} className="hover:bg-uc-black/30">
                              <td className="px-4 py-3 text-sm text-uc-text-light">
                                {new Date(result.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-uc-text-light">
                                {formatHangDescription(
                                  result.handType,
                                  result.gripType,
                                  result.crimpSize,
                                  result.customDescription
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-uc-text-light">
                                {result.load !== null && result.load !== undefined
                                  ? `+${result.load}`
                                  : result.unload !== null && result.unload !== undefined
                                  ? `-${result.unload}`
                                  : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-uc-text-light">
                                {result.timeSeconds || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {result.success === true ? (
                                  <span className="text-green-400">✓</span>
                                ) : result.success === false ? (
                                  <span className="text-red-400">✗</span>
                                ) : (
                                  <span className="text-uc-text-muted">-</span>
                                )}
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
          ) : null}
        </div>
      </div>
    </div>
  )
}

