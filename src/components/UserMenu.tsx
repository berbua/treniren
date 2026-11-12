'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

interface UserMenuProps {
  isOnline?: boolean
}

export default function UserMenu({ isOnline = true }: UserMenuProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { t, language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [userNickname, setUserNickname] = useState<string | null>(session?.user?.name?.split(' ')[0] || null)
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load user data (nickname and photo)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user data (nickname)
        const userResponse = await fetch('/api/user', { credentials: 'include' })
        if (userResponse.ok) {
          const user = await userResponse.json()
          // Only set nickname if it exists, otherwise keep the Google name fallback
          if (user.nickname) {
            setUserNickname(user.nickname)
          }
        }
        
        // Load profile data (photo)
        const profileResponse = await fetch('/api/user-profile', { credentials: 'include' })
        if (profileResponse.ok) {
          const profile = await profileResponse.json()
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

  const handleLanguageChange = (newLanguage: 'en' | 'pl') => {
    setLanguage(newLanguage)
  }

  const avatar = (sizeClass: string) => (
    <div className={`${sizeClass} shrink-0 bg-uc-primary rounded-full flex items-center justify-center text-uc-on-primary font-extrabold overflow-hidden`}>
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
  )

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-2 min-h-11 p-0.5 sm:pr-2 rounded-uc-pill text-uc-text hover:bg-uc-elevated transition-colors"
        title={isOnline ? (t('common.online') || 'Online') : (t('common.offline') || 'Offline')}
      >
        <div className="relative">
          <div className={`rounded-full transition-shadow ${isOpen ? 'ring-4 ring-uc-primary-container' : ''}`}>
            {avatar('size-10 text-base')}
          </div>
          {/* Online status dot badge */}
          <div 
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-uc-bg ${
              isOnline ? 'bg-uc-success' : 'bg-uc-warning'
            }`}
            title={isOnline ? (t('common.online') || 'Online') : (t('common.offline') || 'Offline')}
          />
        </div>
        <span className="hidden sm:block font-bold">
          {(() => {
            const displayName = userNickname || session.user.name?.split(' ')[0] || session.user.email;
            return displayName;
          })()}
        </span>
        <svg
          className={`hidden sm:block w-4 h-4 text-uc-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div role="menu" className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-32px)] bg-uc-elevated rounded-uc-card shadow-uc border border-uc-border p-1.5 z-50">
          <div className="flex items-center gap-3 px-3 py-3 border-b border-uc-border mb-1">
            {avatar('size-10 text-base')}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold text-uc-text">
                {userNickname || session.user.name?.split(' ')[0] || 'User'}
              </p>
              <p className="text-[13px] text-uc-text-muted flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-uc-success' : 'bg-uc-warning'}`} />
                <span>{isOnline ? (t('common.online') || 'Online') : (t('common.offline') || 'Offline')}</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              router.push('/profile')
              setIsOpen(false)
            }}
            className="w-full flex items-center gap-3 text-left px-3 min-h-11 text-[15px] font-bold text-uc-text hover:bg-uc-primary-container hover:text-uc-on-primary-container transition-colors rounded-uc-input"
          >
            <span aria-hidden className="inline-flex size-6 items-center justify-center">👤</span>
            {t('nav.profile') || 'Profile'}
          </button>
          
          {/* Language Switcher */}
          <div className="px-3 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-uc-text flex items-center gap-3">
                <span aria-hidden className="inline-flex size-6 items-center justify-center">{language === 'en' ? '🇺🇸' : '🇵🇱'}</span>
                <span>{t('common.language') || 'Language'}</span>
              </span>
              <div className="flex items-center p-0.5 rounded-uc-input border border-uc-border">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`min-w-10 min-h-9 px-2 rounded-[10px] text-xs font-extrabold transition-colors ${
                    language === 'en'
                      ? 'bg-uc-primary text-uc-on-primary'
                      : 'text-uc-text-muted hover:text-uc-text'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleLanguageChange('pl')}
                  className={`min-w-10 min-h-9 px-2 rounded-[10px] text-xs font-extrabold transition-colors ${
                    language === 'pl'
                      ? 'bg-uc-primary text-uc-on-primary'
                      : 'text-uc-text-muted hover:text-uc-text'
                  }`}
                >
                  PL
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-uc-border my-1"></div>
          
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 min-h-11 text-[15px] font-bold text-uc-error hover:bg-uc-error-bg transition-colors rounded-uc-input"
          >
            {t('auth.signOut') || 'Sign Out'}
          </button>
        </div>
      )}
    </div>
  )
}
