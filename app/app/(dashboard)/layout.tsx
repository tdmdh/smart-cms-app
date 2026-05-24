'use client';

import { useAuthRedirect } from '@/src/hooks/auth/useAuthRedirect';
import { useLayoutSync, useAutoHide } from '@/src/hooks/layout';
import { Sidebar } from '@/src/components/navigation';
import { WebSocketProvider } from '@/src/providers/WebSocketProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthRedirect({ redirectIfUnauthenticated: true });

  // Handle mobile detection
  useLayoutSync();

  // Enable auto-hide behavior for sidebar and topbar
  useAutoHide();

  return (
    <WebSocketProvider>
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-layout__main">
          <main className="dashboard-layout__content">
            {children}
          </main>
        </div>
      </div>
    </WebSocketProvider>
  );
}
