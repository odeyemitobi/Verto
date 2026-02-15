"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import AuthGuard from "@/components/auth/AuthGuard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { usePaymentMonitor } from "@/hooks/usePaymentMonitor";
import { useOverdueDetector } from "@/hooks/useOverdueDetector";
import { useEscrowSync } from "@/hooks/useEscrowSync";

function BackgroundTasks({ children }: { children: React.ReactNode }) {
  usePaymentMonitor();
  useOverdueDetector();
  useEscrowSync();
  return <>{children}</>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <ErrorBoundary>
      <AuthGuard>
        <BackgroundTasks>
          <div className="min-h-screen bg-gray-50/50 dark:bg-black">
            <Sidebar />
            <MobileNav
              isOpen={isMobileNavOpen}
              onClose={() => setIsMobileNavOpen(false)}
            />
            <div className="lg:pl-64">
              <Header onMenuClick={() => setIsMobileNavOpen(true)} />
              <main className="mx-auto max-w-7xl p-4 pt-6 lg:p-6 lg:pt-8">
                {children}
              </main>
            </div>
          </div>
        </BackgroundTasks>
      </AuthGuard>
    </ErrorBoundary>
  );
}
