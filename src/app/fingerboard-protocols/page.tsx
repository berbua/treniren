'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { FingerboardProtocol } from '@/types/workout'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import FingerboardProtocolForm from '@/components/FingerboardProtocolForm'
import FingerboardTestModal from '@/components/FingerboardTestModal'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

export default function FingerboardProtocolsPage() {
  return (
    <AuthGuard>
      <FingerboardProtocolsPageContent />
    </AuthGuard>
  )
}

function FingerboardProtocolsPageContent() {
  const { t } = useLanguage()
  const [protocols, setProtocols] = useState<FingerboardProtocol[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [editingProtocol, setEditingProtocol] = useState<FingerboardProtocol | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    if (!confirm(t('fingerboard.deleteConfirm') || 'Are you sure you want to delete this protocol?')) {
      return
    }

    try {
      const response = await fetch(`/api/fingerboard-protocols/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchProtocols()
      } else {
        alert(t('fingerboard.deleteError') || 'Failed to delete protocol')
      }
    } catch (error) {
      console.error('Error deleting protocol:', error)
      alert(t('fingerboard.deleteErrorGeneric') || 'Error deleting protocol')
    }
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

  if (loading) {
    return <LoadingSpinner message={t('fingerboard.loading') || 'Loading protocols...'} fullScreen />
  }

  return (
    <div className="min-h-screen bg-uc-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-uc-text-light">
                🖐️ {t('fingerboard.title') || 'Fingerboard Protocols'}
              </h1>
              <p className="text-uc-text-muted mt-2">
                {t('fingerboard.subtitle') || 'Create reusable fingerboard training protocols'}
              </p>
            </div>
            <div className="flex gap-3 mt-4 lg:mt-0">
              <div className="relative group">
                <button
                  onClick={() => setShowTestModal(true)}
                  className="bg-uc-purple hover:bg-uc-purple/90 text-uc-text-light px-6 py-3 rounded-xl font-medium transition-colors shadow-lg flex items-center gap-2 w-full lg:w-auto"
                >
                  📊 {t('fingerboard.testYourself') || 'Test Yourself'}
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 bg-uc-black text-uc-text-light text-sm rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 border border-uc-purple/30 shadow-xl">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-uc-black border-r border-b border-uc-purple/30"></div>
                  {t('fingerboard.testYourselfTooltip') || 'Track your fingerboard progress over time by performing regular tests. Record how long you can hang and with what load to visualize your improvement.'}
                </div>
              </div>
              <button
                onClick={handleCreateProtocol}
                className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg w-full lg:w-auto"
              >
                + {t('fingerboard.createProtocol') || 'Create Protocol'}
              </button>
            </div>
          </div>
        </div>

        {protocols.length === 0 ? (
          <div className="bg-uc-dark-bg rounded-xl p-12 border border-uc-purple/20 text-center">
            <div className="text-6xl mb-4">🖐️</div>
            <h2 className="text-xl font-semibold text-uc-text-light mb-2">
              {t('fingerboard.noProtocols') || 'No protocols yet'}
            </h2>
            <p className="text-uc-text-muted mb-6">
              {t('fingerboard.noProtocolsDescription') || 'Create your first fingerboard protocol to quickly add hangs to workouts'}
            </p>
            <button
              onClick={handleCreateProtocol}
              className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-6 py-3 rounded-xl font-medium transition-colors shadow-lg"
            >
              {t('fingerboard.createFirstProtocol') || 'Create Your First Protocol'}
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
                      {protocol.hangs.length} {protocol.hangs.length === 1 
                        ? t('fingerboard.hang') || 'hang' 
                        : t('fingerboard.hangs') || 'hangs'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-uc-purple/20">
                  <button
                    onClick={() => handleEditProtocol(protocol)}
                    className="flex-1 bg-uc-purple/20 hover:bg-uc-purple/30 text-uc-text-light px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('fingerboard.edit') || 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeleteProtocol(protocol.id)}
                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('fingerboard.delete') || 'Delete'}
                  </button>
                </div>
              </div>
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
      </div>
    </div>
  )
}

