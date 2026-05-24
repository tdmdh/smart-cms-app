'use client';

import { useParams } from 'next/navigation';
import { useAuthRedirect } from '@/src/hooks/auth/useAuthRedirect';
import { useAutoHide, useLayoutSync } from '@/src/hooks/layout';
import { PortalSidebar } from '@/src/components/portal/PortalSidebar';
import { Topbar } from '@/src/components/navigation';
import { DebugPanel } from '@/src/components/debug/DebugPanel';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const clientSlug = params.clientSlug as string;

    useAuthRedirect({ redirectIfUnauthenticated: true });
    useLayoutSync();
    useAutoHide();

    return (
        <div className="dashboard-layout dashboard-layout--portal">
            <PortalSidebar clientSlug={clientSlug} />
            <div className="dashboard-layout__main">
                <Topbar />
                <main className="dashboard-layout__content">
                    {children}
                </main>
            </div>
            <DebugPanel />
        </div>
    );
}
