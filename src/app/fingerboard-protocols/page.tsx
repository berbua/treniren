'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { FingerboardProtocol } from '@/types/workout'
import { useLanguage } from '@/contexts/LanguageContext'
import { useConfirmation } from '@/hooks/useConfirmation'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import FingerboardProtocolForm from '@/components/FingerboardProtocolForm'
import FingerboardTestModal from '@/components/FingerboardTestModal'
import { useCsrfToken } from '@/hooks/useCsrfToken'
import { Button, Card, EmptyState, SkeletonRows, Spinner, WorkoutIconTile } from '@/components/ui'

export default function FingerboardProtocolsPage() {
  return (
    <AuthGuard>
      <FingerboardProtocolsPageContent />
    </AuthGuard>
  )
}

function FingerboardProtocolsPageContent() {
  const { t } = useLanguage()
  const confirmation = useConfirmation()
  const { getToken } = useCsrfToken()
  const [protocols, setProtocols] = useState<FingerboardProtocol[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [editingProtocol, setEditingProtocol] = useState<FingerboardProtocol | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingProtocolId, setDeletingProtocolId] = useState<string | null>(null)

  useEffect(() => {
    fetchProtocols()
  }, [])

  const fetchProtocols = async () => {
    try {
      const response = await fetch('/api/fingerboard-protocols')
      if (response.ok) {
        const data = await response.json()
        setProtocols(data)
      }
    } catch (error) {
      console.error('Error fetching protocols:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProtocol = () => {
    setEditingProtocol(null)
    setShowForm(true)
  }

  const handleEditProtocol = (protocol: FingerboardProtocol) => {
    setEditingProtocol(protocol)
    setShowForm(true)
  }

  const handleDeleteProtocol = async (id: string) => {
    confirmation.showConfirmation(
      {
        title: t('fingerboard.deleteConfirmTitle') || 'Delete Protocol',
        message: t('fingerboard.deleteConfirm') || 'Are you sure you want to delete this protocol? This action cannot be undone.',
        variant: 'danger',
      },
      async () => {
        try {
          setDeletingProtocolId(id)
          const token = await getToken()
          const response = await fetch(`/api/fingerboard-protocols/${id}`, {
            method: 'DELETE',
            headers: {
              'x-csrf-token': token,
            },
          })

          if (response.ok) {
            await fetchProtocols()
          } else {
            alert(t('fingerboard.deleteError') || 'Failed to delete protocol')
          }
        } catch (error) {
          console.error('Error deleting protocol:', error)
          alert(t('fingerboard.deleteErrorGeneric') || 'Error deleting protocol')
        } finally {
          setDeletingProtocolId(null)
        }
      }
    )
  }

  const handleSubmitProtocol = async (protocolData: any) => {
    setIsSubmitting(true)
    try {
      const url = editingProtocol ? `/api/fingerboard-protocols/${editingProtocol.id}` : '/api/fingerboard-protocols'
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
        const errorMsg = editingProtocol 
          ? t('fingerboard.updateError') || 'Failed to update protocol'
          : t('fingerboard.createError') || 'Failed to create protocol'
        alert(`${errorMsg}: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`Error ${editingProtocol ? 'updating' : 'creating'} protocol:`, error)
      alert(`Error: ${error instanceof Error ? error.message : (t('fingerboard.saveError') || 'Failed to save protocol')}`)
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
              {t('fingerboard.title') || 'Fingerboard Protocols'}
            </h1>
            <p className="mt-1 text-sm text-uc-text-muted">
              {t('fingerboard.subtitle') || 'Create reusable fingerboard training protocols'}
            </p>
          </div>
          <Button
            variant="accent"
            className="shrink-0"
            onClick={handleCreateProtocol}
            aria-label={t('fingerboard.createProtocol') || 'Create Protocol'}
          >
            +<span className="hidden sm:inline">{t('fingerboard.createProtocol') || 'Create Protocol'}</span>
          </Button>
        </div>

        {/* Test yourself */}
        <button
          type="button"
          onClick={() => setShowTestModal(true)}
          title={t('fingerboard.testYourselfTooltip')}
          className="mb-6 flex w-full min-h-16 items-center gap-3 rounded-uc-card bg-uc-primary-container px-4 py-3 text-left text-uc-on-primary-container transition-[filter] hover:brightness-110 lg:max-w-xl"
        >
          <span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center text-lg">📊</span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-extrabold">{t('fingerboard.testYourself') || 'Test Yourself'}</span>
            <span className="block text-[13px] font-medium opacity-80">
              {t('fingerboard.testYourselfSubtitle')}
            </span>
          </span>
          <svg aria-hidden className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>

        {/* Protocols */}
        {loading ? (
          <SkeletonRows />
        ) : protocols.length === 0 ? (
          <div className="rounded-uc-card border border-dashed border-uc-border">
            <EmptyState
              icon="🖐️"
              title={t('fingerboard.noProtocols') || 'No protocols yet'}
              description={t('fingerboard.noProtocolsDescription') || 'Create reusable fingerboard training protocols to quickly add hangs to your workouts. Save time by defining your favorite hang combinations once.'}
              action={
                <div className="flex flex-col items-center gap-3">
                  <Button variant="accent" onClick={handleCreateProtocol}>
                    + {t('fingerboard.createFirstProtocol') || 'Create Your First Protocol'}
                  </Button>
                  <p className="text-[13px] text-uc-text-muted">
                    {t('fingerboard.tip') || 'Tip: Create protocols for different training phases'}
                  </p>
                </div>
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {protocols.map((protocol) => (
              <Card key={protocol.id} className="flex items-start gap-3">
                <WorkoutIconTile workoutType="FINGERBOARD" icon="🖐️" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-extrabold leading-snug text-uc-text break-words">
                    {protocol.name}
                  </h3>
                  <p className="mt-0.5 text-[13px] font-semibold text-uc-text-muted uc-num">
                    {protocol.hangs.length} {protocol.hangs.length === 1
                      ? t('fingerboard.hang') || 'hang'
                      : t('fingerboard.hangs') || 'hangs'}
                  </p>
                  {protocol.description && (
                    <p className="mt-1 text-sm text-uc-text-muted">{protocol.description}</p>
                  )}
                </div>
                <div className="-mr-2 -mt-1 flex shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEditProtocol(protocol)}
                    aria-label={t('fingerboard.edit') || 'Edit'}
                    title={t('fingerboard.edit') || 'Edit'}
                    className="inline-flex size-11 items-center justify-center rounded-uc-input transition-colors hover:bg-uc-elevated"
                  >
                    <span aria-hidden>✏️</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProtocol(protocol.id)}
                    disabled={deletingProtocolId === protocol.id}
                    aria-label={t('fingerboard.delete') || 'Delete'}
                    title={t('fingerboard.delete') || 'Delete'}
                    className="inline-flex size-11 items-center justify-center rounded-uc-input text-uc-error transition-colors hover:bg-uc-elevated disabled:opacity-50"
                  >
                    {deletingProtocolId === protocol.id ? <Spinner /> : <span aria-hidden>🗑️</span>}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {showForm && (
          <FingerboardProtocolForm
            protocol={editingProtocol}
            onSubmit={handleSubmitProtocol}
            onCancel={handleCancelForm}
            isSubmitting={isSubmitting}
          />
        )}

        {showTestModal && (
          <FingerboardTestModal onClose={() => setShowTestModal(false)} />
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

