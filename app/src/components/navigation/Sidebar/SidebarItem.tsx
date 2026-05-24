'use client';

import { memo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useAppSelector, useAppDispatch } from '@/src/store/hooks';
import { selectSidebarCollapsed, setSidebarView } from '@/src/store/slices/layoutSlice';
import { selectCurrentWorkspaceId } from '@/src/store/slices/workspaceSlice';
import type { NavLink } from '@/src/config/navigation.config';
import { Badge } from '@/src/components/shared/ui';
import { useWorkspaceNavHref } from '@/src/hooks/useWorkspacePath';

interface SidebarItemProps {
    link: NavLink;
    isChild?: boolean;
}

const DURATION = 0.2;
const EASE = 'power2.out';

function SidebarItemComponent({ link, isChild = false }: SidebarItemProps) {
    const pathname = usePathname();
    const isCollapsed = useAppSelector(selectSidebarCollapsed);
    const dispatch = useAppDispatch();
    const currentWorkspaceId = useAppSelector(selectCurrentWorkspaceId);

    // Delays the CSS class so justify-content: center only applies
    // after the label has fully collapsed.
    const [isVisuallyCollapsed, setIsVisuallyCollapsed] = useState(isCollapsed);

    const labelRef = useRef<HTMLSpanElement>(null);
    const badgeRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);

    useGSAP(() => {
        const label = labelRef.current;
        const badge = badgeRef.current;

        if (isFirstRender.current) {
            isFirstRender.current = false;
            gsap.set(label, { maxWidth: isCollapsed ? 0 : 200, opacity: isCollapsed ? 0 : 1 });
            if (badge) gsap.set(badge, { maxWidth: isCollapsed ? 0 : 80, opacity: isCollapsed ? 0 : 1 });
            return;
        }

        if (isCollapsed) {
            // Animate label/badge out first, THEN apply the collapsed class.
            const tl = gsap.timeline({
                onComplete: () => setIsVisuallyCollapsed(true),
            });
            tl.to(label, { opacity: 0, duration: 0.08, ease: 'power1.in' }, 0);
            tl.to(label, { maxWidth: 0, duration: DURATION, ease: EASE }, 0);
            if (badge) {
                tl.to(badge, { opacity: 0, maxWidth: 0, duration: DURATION, ease: EASE }, 0);
            }
        } else {
            // Remove collapsed class immediately so icon shifts back before label grows.
            setIsVisuallyCollapsed(false);
            gsap.to(label, { maxWidth: 200, duration: DURATION, ease: EASE, overwrite: true });
            gsap.to(label, { opacity: 1, duration: 0.15, delay: 0.06, ease: 'power1.out', overwrite: false });
            if (badge) {
                gsap.to(badge, { opacity: 1, maxWidth: 80, duration: DURATION, ease: EASE, overwrite: true });
            }
        }
    }, { dependencies: [isCollapsed] });

    if (!link.href) return null;

    // Rewrite static href → /dashboard/[workspaceId]/...
    const resolvedHref = useWorkspaceNavHref(link.href);
    // Active if the current pathname matches the workspace-scoped href
    const isActive = pathname === resolvedHref || pathname === link.href;
    const Icon = link.icon;

    const itemClasses = [
        'sidebar-item',
        isActive ? 'sidebar-item--active' : '',
        isVisuallyCollapsed ? 'sidebar-item--collapsed' : '',
        isChild ? 'sidebar-item--child' : '',
    ].filter(Boolean).join(' ');

    const handleClick = () => {
        if (link.setSideBarView && currentWorkspaceId) {
            dispatch(setSidebarView({
                view: link.setSideBarView.view,
                width: link.setSideBarView.width,
                data: { workspaceId: currentWorkspaceId },
            }));
        }
    };

    return (
        <Link
            href={resolvedHref}
            className={itemClasses}
            aria-current={isActive ? 'page' : undefined}
            title={isCollapsed ? link.label : undefined}
            onClick={handleClick}
        >
            <span className="sidebar-item__icon">
                <Icon size={isChild ? 16 : 18} strokeWidth={2} />
            </span>

            <span
                ref={labelRef}
                className="sidebar-item__label"
                style={{ overflow: 'hidden' }}
            >
                {link.label}
            </span>

            {link.badge && (
                <div
                    ref={badgeRef}
                    className="sidebar-item__badge-wrapper"
                    style={{ overflow: 'hidden', marginLeft: 'auto' }}
                >
                    <Badge size="xs" variant="primary">{link.badge}</Badge>
                </div>
            )}
        </Link>
    );
}

export const SidebarItem = memo(SidebarItemComponent);
