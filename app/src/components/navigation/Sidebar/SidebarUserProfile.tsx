'use client';

import { memo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { selectSidebarCollapsed, setSidebarView } from '@/src/store/slices/layoutSlice';
import { useAuth } from '@/src/hooks/auth/useAuth';
import {
    UserAvatar,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    Icon,
} from '@/src/components/shared/ui';
import { Building2, LogOut, User as UserIcon } from 'lucide-react';

const DURATION = 0.2;
const EASE = 'power2.out';

function SidebarUserProfileComponent() {
    const dispatch = useAppDispatch();
    const isCollapsed = useAppSelector(selectSidebarCollapsed);
    const { user, logout } = useAuth();

    // Controls whether info/action are in the DOM.
    const [isRendered, setIsRendered] = useState(!isCollapsed);
    // Delays the CSS class so justify-content: center only applies
    // after the info/action have fully collapsed.
    const [isVisuallyCollapsed, setIsVisuallyCollapsed] = useState(isCollapsed);

    const infoRef = useRef<HTMLDivElement>(null);
    const actionRef = useRef<HTMLDivElement>(null);
    const isCollapseEffectMounted = useRef(true);
    const isExpandEffectMounted = useRef(true);

    // Phase 1 — collapse: animate out, unmount, then apply collapsed class.
    useGSAP(() => {
        if (isCollapseEffectMounted.current) {
            isCollapseEffectMounted.current = false;
            return;
        }

        const info = infoRef.current;
        const action = actionRef.current;

        if (isCollapsed) {
            if (!info || !action) return;
            const tl = gsap.timeline({
                onComplete: () => {
                    setIsRendered(false);
                    setIsVisuallyCollapsed(true);
                },
            });
            tl.to(info, { opacity: 0, maxWidth: 0, duration: DURATION, ease: EASE, overwrite: true }, 0);
            tl.to(action, { opacity: 0, width: 0, duration: DURATION, ease: EASE, overwrite: true }, 0);
        } else {
            // Remove collapsed class and mount elements immediately.
            setIsVisuallyCollapsed(false);
            setIsRendered(true);
        }
    }, { dependencies: [isCollapsed] });

    // Phase 2 — expand: after elements mount, animate them in from zero.
    useGSAP(() => {
        if (isExpandEffectMounted.current) {
            isExpandEffectMounted.current = false;
            return;
        }

        const info = infoRef.current;
        const action = actionRef.current;

        if (!info || !action || isCollapsed) return;

        gsap.fromTo(info, { maxWidth: 0, opacity: 0 }, { maxWidth: 200, opacity: 1, duration: DURATION, ease: EASE });
        gsap.fromTo(action, { width: 0, opacity: 0 }, { width: 'auto', opacity: 1, duration: DURATION, ease: EASE });
    }, { dependencies: [isRendered] });

    if (!user) return null;

    const handleEditProfile = () => {
        dispatch(setSidebarView({ view: 'profile', width: 'lg' }));
    };

    const handleSwitchWorkspace = () => {
        dispatch(setSidebarView({ view: 'workspace-switcher', width: 'md' }));
    };

    const handleLogout = async () => {
        await logout();
    };

    const items = [
        {
            id: 'profile',
            label: 'Edit Profile',
            icon: <UserIcon size={16} />,
            onClick: handleEditProfile,
        },
        {
            id: 'logout',
            label: 'Logout',
            icon: <LogOut size={16} />,
            onClick: handleLogout,
            danger: true,
        },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={`sidebar-user-profile ${isVisuallyCollapsed ? 'sidebar-user-profile--collapsed' : ''}`}
                    title={isCollapsed ? user.name || user.email : undefined}
                    type="button"
                >
                    <div className="sidebar-user-profile__avatar">
                        <UserAvatar
                            avatarUrl={user.avatar_url}
                            name={user.name}
                            email={user.email}
                            size="sm"
                        />
                    </div>

                    {isRendered && (
                        <>
                            <div
                                ref={infoRef}
                                className="sidebar-user-profile__info"
                                style={{ overflow: 'hidden' }}
                            >
                                <span className="sidebar-user-profile__name">{user.name || user.email}</span>
                                {user.name && <span className="sidebar-user-profile__email">{user.email}</span>}
                            </div>

                            <div
                                ref={actionRef}
                                className="sidebar-user-profile__action"
                                style={{ overflow: 'hidden' }}
                            >
                                <Icon name='chevron-up-down' size={16} />
                            </div>
                        </>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" sideOffset={25}>
                {items.map(item => (
                    <DropdownMenuItem
                        key={item.id}
                        onClick={item.onClick}
                        variant={item.danger ? 'danger' : 'default'}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.icon}
                            {item.label}
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export const SidebarUserProfile = memo(SidebarUserProfileComponent);
