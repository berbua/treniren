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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-h-11 pl-1 pr-2 rounded-uc-pill border border-uc-border text-uc-text hover:bg-uc-elevated transition-colors"
        title={isOnline ? (t('common.online') || 'Online') : (t('common.offline') || 'Offline')}
      >
        <div className="relative">
          <div className="w-9 h-9 bg-uc-primary rounded-full flex items-center justify-center text-uc-on-primary text-sm font-extrabold overflow-hidden">
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
          {/* Online status dot badge - top right like notification badge */}
          <div 
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-uc-bg ${
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
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-uc-elevated rounded-uc-card shadow-uc border border-uc-border p-1.5 z-50">
          <div className="px-3 py-2.5 border-b border-uc-border mb-1">
            <p className="text-[15px] font-extrabold text-uc-text">
              {userNickname || session.user.name?.split(' ')[0] || 'User'}
            </p>
            <p className="text-xs text-uc-text-muted mt-1 flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-uc-success' : 'bg-uc-warning'}`} />
              <span>{isOnline ? (t('common.online') || 'Online') : (t('common.offline') || 'Offline')}</span>
            </p>
          </div>
          
          <button
            onClick={() => {
              router.push('/profile')
              setIsOpen(false)
            }}
            className="w-full text-left px-3 min-h-11 text-sm font-semibold text-uc-text hover:bg-uc-primary-container hover:text-uc-on-primary-container transition-colors rounded-uc-input"
          >
            👤 {t('nav.profile') || 'Profile'}
          </button>
          
          {/* Language Switcher */}
          <div className="border-t border-uc-border my-1"></div>
          <div className="px-3 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-uc-text flex items-center space-x-2">
                <span>{language === 'en' ? '🇺🇸' : '🇵🇱'}</span>
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
            className="w-full text-left px-3 min-h-11 text-sm font-bold text-uc-error hover:bg-uc-error-bg transition-colors rounded-uc-input"
          >
            {t('auth.signOut') || 'Sign Out'}
          </button>
        </div>
      )}
    </div>
  )
}
