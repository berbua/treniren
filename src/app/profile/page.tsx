'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserProfile } from '@/components/UserProfile'
import AuthGuard from '@/components/AuthGuard'

function ProfilePageContent() {
  const router = useRouter()
  // ?tab=cycle opens the profile on the Cycle tab (link from the Cycle screen)
  const tab = useSearchParams().get('tab')
  const initialTab = tab === 'cycle' || tab === 'settings' || tab === 'export' ? tab : 'profile'

  return (
    <div className="min-h-screen bg-uc-bg">
      <div className="mx-auto max-w-[640px] px-5 py-6 lg:px-8 lg:py-8">
        <UserProfile onClose={() => router.push('/dashboard')} initialTab={initialTab} />
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <Suspense>
        <ProfilePageContent />
      </Suspense>
    </AuthGuard>
  )
}
