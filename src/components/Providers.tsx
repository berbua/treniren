'use client'

import { SessionProvider } from "next-auth/react";
import { CycleProvider } from "@/contexts/CycleContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";
import { NavigationHeader } from "@/components/NavigationHeader";
import { MessagesPanel } from "@/components/MessagesPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface ProvidersProps {
  children: React.ReactNode;
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { isMessagesPanelOpen, setIsMessagesPanelOpen } = useNotifications();

  return (
    <>
      <NavigationHeader />
      {children}
      <MessagesPanel 
        isOpen={isMessagesPanelOpen} 
        onClose={() => setIsMessagesPanelOpen(false)} 
      />
      <PWAInstallPrompt />
      <OfflineIndicator />
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
            <NotificationProvider>
              <AppContent>{children}</AppContent>
            </NotificationProvider>
          </CycleProvider>
        </LanguageProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
