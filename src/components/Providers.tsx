'use client'

import { SessionProvider, useSession } from "next-auth/react";
import { CycleProvider } from "@/contexts/CycleContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";
import { OfflineSyncManager } from "@/components/OfflineSyncManager";
import { NavigationHeader } from "@/components/NavigationHeader";
import { MessagesPanel } from "@/components/MessagesPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface ProvidersProps {
  children: React.ReactNode;
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { isMessagesPanelOpen, setIsMessagesPanelOpen } = useNotifications();
  const { data: session } = useSession();

  return (
    <>
      <NavigationHeader />
      {/* Logged in: room for the desktop sidebar and the mobile floating tab bar */}
      <div className={session?.user ? "lg:pl-64 pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-0" : undefined}>
        {children}
      </div>
      <MessagesPanel 
        isOpen={isMessagesPanelOpen} 
        onClose={() => setIsMessagesPanelOpen(false)} 
      />
      <PWAInstallPrompt />
      <OfflineIndicator />
      <OfflineSyncManager />
    </>
  );
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <SessionProvider 
        refetchInterval={0}
        refetchOnWindowFocus={false}
      >
        <ServiceWorkerProvider />
        <LanguageProvider>
          <CycleProvider>
            <ToastProvider>
              <NotificationProvider>
                <AppContent>{children}</AppContent>
              </NotificationProvider>
            </ToastProvider>
          </CycleProvider>
        </LanguageProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
