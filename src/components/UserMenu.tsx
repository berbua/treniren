'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

export default function UserMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [userNickname, setUserNickname] = useState<string | null>(session?.user?.name?.split(' ')[0] || null)
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load user data (nickname and photo)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user data (nickname)
        const userResponse = await fetch('/api/user')
        if (userResponse.ok) {
          const user = await userResponse.json()
          console.log('Loaded user data:', user) // Debug log
          // Only set nickname if it exists, otherwise keep the Google name fallback
          if (user.nickname) {
            setUserNickname(user.nickname)
          }
        }
        
        // Load profile data (photo)
        const profileResponse = await fetch('/api/user-profile')
        if (profileResponse.ok) {
          const profile = await profileResponse.json()
          console.log('Loaded profile data:', profile) // Debug log
          setUserPhotoUrl(profile?.photoUrl || null)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }
    
    if (session?.user) {
      loadUserData()
    }
  }, [session?.user])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    // Redirect to logout page instead of directly signing out
    router.push('/auth/logout')
  }

  if (!session?.user) {
    return (
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push('/auth/signin')}
          className="text-uc-text-muted hover:text-uc-mustard font-medium transition-colors"
        >
          {t('auth.signIn') || 'Sign In'}
        </button>
        <button
          onClick={() => router.push('/auth/signup')}
          className="bg-uc-mustard hover:bg-uc-mustard/90 text-uc-black px-4 py-2 rounded-xl font-medium transition-colors shadow-lg"
        >
          {t('auth.signUp') || 'Sign Up'}
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-uc-text-light hover:text-uc-mustard transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-uc-purple to-uc-mustard rounded-full flex items-center justify-center text-uc-black text-sm font-medium overflow-hidden">
          {userPhotoUrl ? (
            <img 
              src={userPhotoUrl} 
              alt="Profile" 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span>
              {(userNickname || session.user.name)?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <span className="hidden sm:block font-medium">
          {(() => {
            const displayName = userNickname || session.user.name?.split(' ')[0] || session.user.email;
            console.log('Display name:', { userNickname, googleName: session.user.name, displayName });
            return displayName;
          })()}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-uc-dark-bg rounded-xl shadow-lg border border-uc-purple/20 py-1 z-50">
          <div className="px-4 py-2 border-b border-uc-purple/20">
            <p className="text-sm font-medium text-uc-text-light">
              {userNickname || session.user.name?.split(' ')[0] || 'User'}
            </p>
          </div>
          
          <button
            onClick={() => {
              router.push('/profile')
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-2 text-sm text-uc-text-light hover:bg-uc-purple/20 transition-colors rounded-lg mx-1"
          >
            👤 {t('nav.profile') || 'Profile'}
          </button>
          
          <div className="border-t border-uc-purple/20 my-1"></div>
          
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm text-uc-alert hover:bg-uc-alert/20 transition-colors rounded-lg mx-1"
          >
            {t('auth.signOut') || 'Sign Out'}
          </button>
        </div>
      )}
    </div>
  )
}
