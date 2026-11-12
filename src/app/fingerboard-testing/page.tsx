'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { FingerboardTestingProtocol } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { useConfirmation } from '@/hooks/useConfirmation'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import FingerboardTestingProtocolForm from '@/components/FingerboardTestingProtocolForm'
import Link from 'next/link'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { Button, Card, EmptyState, Icon, SkeletonRows, Spinner } from '@/components/ui'

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

  return (
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[1120px] px-5 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[28px] font-extrabold leading-tight text-uc-text">
              {t('fingerboardTesting.title')}
            </h1>
            <p className="mt-1 text-sm text-uc-text-muted">
              {t('fingerboardTesting.subtitle')}
            </p>
          </div>
          <Button
            variant="accent"
            className="shrink-0"
            onClick={handleCreateProtocol}
            aria-label={t('fingerboardTesting.createProtocol')}
          >
            <Icon name="plus" /><span className="hidden sm:inline">{t('fingerboardTesting.createProtocol')}</span>
          </Button>
        </div>

        {loading ? (
          <SkeletonRows />
        ) : protocols.length === 0 ? (
          <div className="rounded-uc-card border border-dashed border-uc-border">
            <EmptyState
              icon={<Icon name="test" size={28} />}
              title={t('fingerboardTesting.emptyTitle')}
              description={t('fingerboardTesting.emptyDescription')}
              action={
                <Button variant="accent" onClick={handleCreateProtocol}>
                  + {t('fingerboardTesting.createFirstProtocol')}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {protocols.map((protocol) => {
              const resultsCount = (protocol as FingerboardTestingProtocol & { _count?: { testResults?: number } })._count?.testResults || 0
              return (
                <Card key={protocol.id} className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[17px] font-extrabold leading-snug text-uc-text break-words">
                      {protocol.name}
                    </h3>
                    <p className="mt-0.5 text-[13px] font-semibold text-uc-text-muted uc-num">
                      {protocol.testHangs.length} {protocol.testHangs.length === 1
                        ? t('fingerboard.hang') || 'hang'
                        : t('fingerboard.hangs') || 'hangs'}
                      {' · '}
                      {t('fingerboardTesting.resultsCount', { count: resultsCount })}
                    </p>
                    {protocol.description && (
                      <p className="mt-1 text-sm text-uc-text-muted">{protocol.description}</p>
                    )}
                  </div>
                  <div className="-mr-2 -mt-1 flex shrink-0 items-center">
                    <Link
                      href={`/fingerboard-testing/${protocol.id}`}
                      title={t('fingerboardTesting.viewResults')}
                      className="inline-flex min-h-11 items-center rounded-uc-input px-2 text-sm font-bold text-uc-primary transition-colors hover:bg-uc-elevated"
                    >
                      {t('fingerboardTesting.view')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleEditProtocol(protocol)}
                      aria-label={t('common.edit')}
                      title={t('common.edit')}
                      className="inline-flex size-11 items-center justify-center rounded-uc-input transition-colors hover:bg-uc-elevated"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProtocol(protocol.id)}
                      disabled={deletingProtocolId === protocol.id}
                      aria-label={t('common.delete')}
                      title={t('common.delete')}
                      className="inline-flex size-11 items-center justify-center rounded-uc-input text-uc-error transition-colors hover:bg-uc-elevated disabled:opacity-50"
                    >
                      {deletingProtocolId === protocol.id ? <Spinner /> : <Icon name="delete" />}
                    </button>
                  </div>
                </Card>
              )
            })}
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

