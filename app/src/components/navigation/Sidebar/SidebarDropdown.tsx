'use client';

import { memo, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { selectSidebarCollapsed, setSidebarCollapsed } from '@/src/store/slices/layoutSlice';
import { SidebarItem } from './SidebarItem';
import type { NavLink } from '@/src/config/navigation.config';

interface SidebarDropdownProps {
    link: NavLink;
}

const DURATION = 0.2;
const EASE = 'power2.out';

function SidebarDropdownComponent({ link }: SidebarDropdownProps) {
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const isCollapsed = useAppSelector(selectSidebarCollapsed);
    const [isOpen, setIsOpen] = useState(false);

    // Delays the CSS class so justify-content: center only applies
    // after the label has fully collapsed.
    const [isVisuallyCollapsed, setIsVisuallyCollapsed] = useState(isCollapsed);

    const labelRef = useRef<HTMLSpanElement>(null);
    const chevronRef = useRef<HTMLSpanElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const isFirstRender = useRef(true);
    const isOpenEffectMounted = useRef(true);

    const isChildActive =
        link.children?.some((child) => child.href && pathname.startsWith(child.href)) ?? false;

    const shouldBeOpen = isOpen || isChildActive;

    // Effect 1: handles sidebar collapse / expand.
    useGSAP(() => {
        const label = labelRef.current;
        const chevron = chevronRef.current;
        const content = contentRef.current;

        if (isFirstRender.current) {
            isFirstRender.current = false;
            gsap.set(label, { maxWidth: isCollapsed ? 0 : 200, opacity: isCollapsed ? 0 : 1 });
            gsap.set(chevron, {
                opacity: isCollapsed ? 0 : 1,
                rotate: shouldBeOpen && !isCollapsed ? 180 : 0,
            });
            gsap.set(content, {
                height: shouldBeOpen && !isCollapsed ? 'auto' : 0,
                opacity: shouldBeOpen && !isCollapsed ? 1 : 0,
            });
            return;
        }

        if (isCollapsed) {
            // Animate out first, THEN apply the collapsed class.
            const tl = gsap.timeline({
                onComplete: () => setIsVisuallyCollapsed(true),
            });
            tl.to(label, { opacity: 0, duration: 0.08, ease: 'power1.in' }, 0);
            tl.to(label, { maxWidth: 0, duration: DURATION, ease: EASE }, 0);
            tl.to(chevron, { opacity: 0, duration: 0.1, ease: EASE }, 0);
            tl.to(content, { height: 0, opacity: 0, duration: DURATION, ease: EASE }, 0);
        } else {
            // Remove collapsed class immediately, then animate in.
            setIsVisuallyCollapsed(false);
            gsap.to(label, { maxWidth: 200, duration: DURATION, ease: EASE, overwrite: true });
            gsap.to(label, { opacity: 1, duration: 0.15, delay: 0.06, ease: 'power1.out', overwrite: false });
            gsap.to(chevron, {
                opacity: 1,
                rotate: shouldBeOpen ? 180 : 0,
                duration: DURATION,
                ease: EASE,
                overwrite: true,
            });
            if (shouldBeOpen) {
                gsap.to(content, { height: 'auto', opacity: 1, duration: DURATION, ease: EASE, overwrite: true });
            }
        }
    }, { dependencies: [isCollapsed] });

    // Effect 2: handles dropdown open / close (chevron rotation + content height).
    useGSAP(() => {
        if (isOpenEffectMounted.current) {
            isOpenEffectMounted.current = false;
            return;
        }
        if (isCollapsed) return;

        gsap.to(chevronRef.current, { rotate: shouldBeOpen ? 180 : 0, duration: DURATION, ease: EASE, overwrite: true });
        gsap.to(contentRef.current, {
            height: shouldBeOpen ? 'auto' : 0,
            opacity: shouldBeOpen ? 1 : 0,
            duration: DURATION,
            ease: EASE,
            overwrite: true,
        });
    }, { dependencies: [shouldBeOpen] });

    const Icon = link.icon;

    const handleToggle = () => {
        if (isCollapsed) {
            dispatch(setSidebarCollapsed(false));
            setIsOpen(true);
        } else {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div
            className={[
                'sidebar-dropdown',
                shouldBeOpen && !isCollapsed ? 'is-open' : '',
                isCollapsed && shouldBeOpen ? 'sidebar-dropdown--open' : '',
            ].filter(Boolean).join(' ')}
        >
            <button
                type="button"
                className={[
                    'sidebar-item sidebar-dropdown__trigger',
                    isChildActive ? 'sidebar-item--active' : '',
                    isVisuallyCollapsed ? 'sidebar-item--collapsed' : '',
                ].filter(Boolean).join(' ')}
                onClick={handleToggle}
                aria-expanded={shouldBeOpen}
                title={isCollapsed ? link.label : undefined}
            >
                <span className="sidebar-item__icon">
                    <Icon size={18} strokeWidth={2} />
                </span>

                <span ref={labelRef} className="sidebar-item__label" style={{ overflow: 'hidden' }}>
                    {link.label}
                </span>

                <span ref={chevronRef} className="sidebar-dropdown__chevron">
                    <ChevronDown size={16} />
                </span>
            </button>

            <div ref={contentRef} className="sidebar-dropdown__content" style={{ overflow: 'hidden' }}>
                <div
                    className={[
                        'sidebar-dropdown__items',
                        shouldBeOpen && !isCollapsed ? 'is-open' : '',
                        isCollapsed && shouldBeOpen ? 'sidebar-dropdown__items--open' : '',
                    ].filter(Boolean).join(' ')}
                >
                    {link.children?.map((child) => (
                        <SidebarItem key={child.href} link={child} isChild />
                    ))}
                </div>
            </div>
        </div>
    );
}

export const SidebarDropdown = memo(SidebarDropdownComponent);
