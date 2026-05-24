'use client';

import { memo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Building2, ChevronsUpDown, Check, Settings, Plus } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import {
    selectSidebarCollapsed,
    setSidebarView,
    closeAllViews,
} from '@/src/store/slices/layoutSlice';
import { selectCurrentWorkspaceId, setCurrentWorkspaceId } from '@/src/store/slices/workspaceSlice';
import { useWorkspaces } from '@/src/hooks/queries/workspace-management';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/src/components/shared/ui/DropdownMenu';
import { UserAvatar } from '@/src/components/shared/ui';

const DURATION = 0.2;
const EASE = 'power2.out';

function SidebarWorkspaceSwitcherComponent() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const isCollapsed = useAppSelector(selectSidebarCollapsed);
    const currentWorkspaceId = useAppSelector(selectCurrentWorkspaceId);
    const { data } = useWorkspaces();

    const [isVisuallyCollapsed, setIsVisuallyCollapsed] = useState(isCollapsed);

    const labelRef = useRef<HTMLSpanElement>(null);
    const chevronRef = useRef<HTMLSpanElement>(null);
    const isFirstRender = useRef(true);

    useGSAP(() => {
        const label = labelRef.current;
        const chevron = chevronRef.current;

        if (isFirstRender.current) {
            isFirstRender.current = false;
            gsap.set(label, { maxWidth: isCollapsed ? 0 : 200, opacity: isCollapsed ? 0 : 1 });
            gsap.set(chevron, { opacity: isCollapsed ? 0 : 1 });
            return;
        }

        if (isCollapsed) {
            const tl = gsap.timeline({ onComplete: () => setIsVisuallyCollapsed(true) });
            tl.to(label, { opacity: 0, duration: 0.08, ease: 'power1.in' }, 0);
            tl.to(label, { maxWidth: 0, duration: DURATION, ease: EASE }, 0);
            tl.to(chevron, { opacity: 0, duration: 0.1, ease: EASE }, 0);
        } else {
            setIsVisuallyCollapsed(false);
            gsap.to(label, { maxWidth: 200, duration: DURATION, ease: EASE, overwrite: true });
            gsap.to(label, { opacity: 1, duration: 0.15, delay: 0.06, ease: 'power1.out', overwrite: false });
            gsap.to(chevron, { opacity: 1, duration: DURATION, ease: EASE, overwrite: true });
        }
    }, { dependencies: [isCollapsed] });

    const workspaces = data?.workspaces ?? [];
    const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);
    const workspaceName = currentWorkspace?.name ?? 'No workspace';
    const workspaceDescription = currentWorkspace?.description ?? '';

    const handleSelectWorkspace = (id: string) => {
        if (id === currentWorkspaceId) return;

        dispatch(setCurrentWorkspaceId(id));
        dispatch(closeAllViews());

        // Determine if we are deep-linked into a specific resource (project or client detail)
        // Format: /dashboard/[workspaceId]/[resource]/[resourceId]/...
        const pathParts = pathname.split('/').filter(Boolean);
        const isDeepLink = pathParts.length >= 4 && (pathParts[2] === 'projects' || pathParts[2] === 'clients');

        const destination = isDeepLink
            ? `/dashboard/${id}`
            : pathname.replace(/^\/dashboard\/[^/]+(\/|$)/, `/dashboard/${id}$1`);

        router.push(destination);
    };

    const handleManageWorkspaces = () => {
        dispatch(setSidebarView({ view: 'workspace-manager', width: 'md' }));
    };

    const itemClasses = [
        'sidebar-item',
        'sidebar-workspace-switcher',
        isVisuallyCollapsed ? 'sidebar-item--collapsed' : '',
    ].filter(Boolean).join(' ');

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={itemClasses}
                    title={isCollapsed ? workspaceName : undefined}
                    aria-label="Switch workspace"
                >
                    <span className="sidebar-item__icon">
                        <Building2 size={18} strokeWidth={2} />
                    </span>

                    <span
                        ref={labelRef}
                        className="sidebar-workspace-switcher__label"
                        style={{ overflow: 'hidden' }}
                    >
                        <span className="sidebar-workspace-switcher__name">{workspaceName}</span>
                        {workspaceDescription && (
                            <span className="sidebar-workspace-switcher__description">{workspaceDescription}</span>
                        )}
                    </span>

                    <span
                        ref={chevronRef}
                        className="sidebar-workspace-switcher__chevron"
                        style={{ overflow: 'hidden', marginLeft: 'auto' }}
                    >
                        <ChevronsUpDown size={14} strokeWidth={2} />
                    </span>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                side={isCollapsed ? "right" : "bottom"}
                sideOffset={isCollapsed ? 12 : 8}
                // className="workspace-switcher-dropdown"

            >
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {workspaces.map((ws) => (
                    <DropdownMenuItem
                        key={ws.id}
                        onSelect={() => handleSelectWorkspace(ws.id)}
                        className={ws.id === currentWorkspaceId ? 'is-active' : ''}
                    >
                        <div className="workspace-option">
                            <UserAvatar name={ws.name} size="xs" />
                            <div className="workspace-option__info">
                                <span className="workspace-option__name">{ws.name}</span>
                                {ws.description && (
                                    <span className="workspace-option__desc">{ws.description}</span>
                                )}
                            </div>
                            {ws.id === currentWorkspaceId && (
                                <Check size={14} className="workspace-option__check" />
                            )}
                        </div>
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem  icon='settings' iconSize={26} onSelect={handleManageWorkspaces}>
                    Manage Workspaces
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const SidebarWorkspaceSwitcher = memo(SidebarWorkspaceSwitcherComponent);
