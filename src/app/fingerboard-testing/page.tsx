'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { FingerboardTestingProtocol } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { useConfirmation } from '@/hooks/useConfirmation'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import FingerboardTestingProtocolForm from '@/components/FingerboardTestingProtocolForm'
import Link from 'next/link'
import { useCsrfToken } from '@/hooks/useCsrfToken'

export default function FingerboardTestingPage() {
  return (
    <AuthGuard>
      <FingerboardTestingPageContent />
    </AuthGuard>
  )
}

function FingerboardTestingPageContent() {
  const { t } = useLanguage()
  const confirmation = useConfirmation()
  const { getToken } = useCsrfToken()
  const [protocols, setProtocols] = useState<FingerboardTestingProtocol[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProtocol, setEditingProtocol] = useState<FingerboardTestingProtocol | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingProtocolId, setDeletingProtocolId] = useState<string | null>(null)

  useEffect(() => {
    fetchProtocols()
  }, [])

  const fetchProtocols = async () => {
    try {
      const response = await fetch('/api/fingerboard-testing-protocols')
      if (response.ok) {
        const data = await response.json()
        setProtocols(data)
      }
    } catch (error) {
      console.error('Error fetching testing protocols:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProtocol = () => {
    setEditingProtocol(null)
    setShowForm(true)
  }

  const handleEditProtocol = (protocol: FingerboardTestingProtocol) => {
    setEditingProtocol(protocol)
    setShowForm(true)
  }

  const handleDeleteProtocol = async (id: string) => {
    confirmation.showConfirmation(
      {
        title: t('fingerboard.deleteTestingProtocolConfirmTitle') || 'Delete Testing Protocol',
        message: t('workouts.errors.deleteTestingProtocolConfirm') || 'Are you sure you want to delete this testing protocol? All test results will also be deleted. This action cannot be undone.',
        variant: 'danger',
      },
      async () => {
        try {
          setDeletingProtocolId(id)
          const token = await getToken()
          const response = await fetch(`/api/fingerboard-testing-protocols/${id}`, {
            method: 'DELETE',
            headers: {
              'x-csrf-token': token,
            },
          })

          if (response.ok) {
            await fetchProtocols()
          } else {
            alert(t('workouts.errors.deleteTestingProtocolFailed') || 'Failed to delete protocol')
          }
        } catch (error) {
          console.error('Error deleting protocol:', error)
          alert(t('workouts.errors.deleteTestingProtocolError') || 'Error deleting protocol')
        } finally {
          setDeletingProtocolId(null)
        }
      }
    )
  }

  const handleSubmitProtocol = async (protocolData: any) => {
    setIsSubmitting(true)
    try {
      const url = editingProtocol ? `/api/fingerboard-testing-protocols/${editingProtocol.id}` : '/api/fingerboard-testing-protocols'
      const method = editingProtocol ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(protocolData),
      })

      if (response.ok) {
        await fetchProtocols()
        setShowForm(false)
        setEditingProtocol(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        alert(`Failed to ${editingProtocol ? 'update' : 'create'} protocol: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`Error ${editingProtocol ? 'updating' : 'creating'} protocol:`, error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to save protocol'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingProtocol(null)
  }

  if (loading) {
    return <LoadingSpinner message="Loading testing protocols..." fullScreen />
  }

  return (
    <div className="min-h-screen bg-uc-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-uc-text-light">
                📊 Fingerboard Testing Protocols
              </h1>
              <p className="text-uc-text-muted mt-2">
                Create testing protocols to track your fingerboard progress over time
              </p>
            </div>
            <button
              onClick={handleCreateProtocol}
              className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
            >
              + Create Testing Protocol
            </button>
          </div>
        </div>

        {protocols.length === 0 ? (
          <div className="bg-uc-dark-bg rounded-xl p-12 border border-uc-purple/20 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-uc-text-light mb-2">
              No testing protocols yet
            </h2>
            <p className="text-uc-text-muted mb-6">
              Create your first testing protocol to track progress over time
            </p>
            <button
              onClick={handleCreateProtocol}
              className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
            >
              Create Your First Testing Protocol
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {protocols.map((protocol) => (
              <div
                key={protocol.id}
                className="bg-uc-dark-bg rounded-xl p-6 border border-uc-purple/20 hover:border-uc-purple/40 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-uc-text-light mb-1">
                      {protocol.name}
                    </h3>
                    {protocol.description && (
                      <p className="text-sm text-uc-text-muted">
                        {protocol.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-uc-text-muted">
                    <span className="mr-2">🖐️</span>
                    <span>
                      {protocol.testHangs.length} {protocol.testHangs.length === 1 ? 'test hang' : 'test hangs'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-uc-text-muted">
                    <span className="mr-2">📊</span>
                    <span>
                      {(protocol as any)._count?.testResults || 0} {(protocol as any)._count?.testResults === 1 ? 'test result' : 'test results'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-uc-purple/20">
                  <Link
                    href={`/fingerboard-testing/${protocol.id}`}
                    className="flex-1 bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
                  >
                    View Results
                  </Link>
                  <button
                    onClick={() => handleEditProtocol(protocol)}
                    className="flex-1 bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProtocol(protocol.id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <FingerboardTestingProtocolForm
            protocol={editingProtocol}
            onSubmit={handleSubmitProtocol}
            onCancel={handleCancelForm}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmation.isOpen}
          onClose={confirmation.onClose}
          onConfirm={confirmation.onConfirm}
          title={confirmation.title}
          message={confirmation.message}
          confirmText={confirmation.confirmText}
          cancelText={confirmation.cancelText}
          variant={confirmation.variant}
          isLoading={deletingProtocolId !== null}
        />
      </div>
    </div>
  )
}

