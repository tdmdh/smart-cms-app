'use client';

import { memo, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useAppSelector } from '@/src/store/hooks';
import { selectSidebarCollapsed } from '@/src/store/slices/layoutSlice';
import { navigationConfig, type NavSection, type NavLink } from '@/src/config/navigation.config';
import { useRole } from '@/src/hooks/auth/useRole';
import { SidebarItem } from './SidebarItem';
import { SidebarDropdown } from './SidebarDropdown';
import { SidebarWorkspaceSwitcher } from './SidebarWorkspaceSwitcher';

const DURATION = 0.2;
const EASE = 'power2.out';

function SidebarNavComponent() {
    const isCollapsed = useAppSelector(selectSidebarCollapsed);
    const { meetsAgencyRole, hasPermission, isLoading } = useRole();
    const [isRendered, setIsRendered] = useState(!isCollapsed);

    const titleRef = useRef<HTMLHeadingElement>(null);
    const isCollapseEffectMounted = useRef(true);
    const isExpandEffectMounted = useRef(true);

    useGSAP(() => {
        if (isCollapseEffectMounted.current) {
            isCollapseEffectMounted.current = false;
            return;
        }

        const title = titleRef.current;

        if (isCollapsed) {
            if (!title) return;
            const tl = gsap.timeline({ onComplete: () => setIsRendered(false) });
            tl.to(title, { opacity: 0, maxWidth: 0, duration: DURATION, ease: EASE, overwrite: true }, 0)
        } else {
            setIsRendered(true)
        }
    }, { dependencies: [isCollapsed] })


    useGSAP(() => {
        if (isExpandEffectMounted.current) {
            isExpandEffectMounted.current = false;
            return;
        }

        const title = titleRef.current;

        if (!title || isCollapsed) return;
        
        gsap.fromTo(title, { maxWidth: 0, opacity: 0 }, { maxWidth: 200, opacity: 0, duration: DURATION, ease: EASE })
    }, { dependencies: [isRendered] })

    const filteredNavigation = useMemo(() => {
        if (isLoading) {
            return navigationConfig.filter(section => !section.requiredAgencyRole && !section.requiredPermission);
        }

        const filterLinks = (links: NavLink[]): NavLink[] => {
            return links
                .filter(link => {
                    if (link.requiredAgencyRole && !meetsAgencyRole(link.requiredAgencyRole)) {
                        return false;
                    }
                    if (link.requiredPermission && !hasPermission(link.requiredPermission)) {
                        return false;
                    }
                    return true;
                })
                .map(link => {
                    if (link.children) {
                        const filteredChildren = filterLinks(link.children);
                        if (filteredChildren.length === 0 && !link.href) {
                            return null;
                        }
                        return { ...link, children: filteredChildren.length > 0 ? filteredChildren : undefined };
                    }
                    return link;
                })
                .filter((link): link is NavLink => link !== null);
        };

        return navigationConfig
            .filter(section => {
                if (section.requiredAgencyRole && !meetsAgencyRole(section.requiredAgencyRole)) {
                    return false;
                }
                if (section.requiredPermission && !hasPermission(section.requiredPermission)) {
                    return false;
                }
                return true;
            })
            .map(section => ({
                ...section,
                links: filterLinks(section.links),
            }))
            .filter(section => section.links.length > 0);
    }, [isLoading, meetsAgencyRole, hasPermission]);

    return (
        <nav className="sidebar-nav" aria-label="Main navigation">
            <SidebarWorkspaceSwitcher />
            {filteredNavigation.map((section, sectionIndex) => (
                <div key={sectionIndex} className="sidebar-nav__section">
                        {section.title && !isCollapsed && (
                            <h3
                                key={`title-${sectionIndex}`}
                                className="sidebar-nav__section-title"
                            >
                                {section.title}
                            </h3>
                        )}
                    <ul className="sidebar-nav__list">
                        {section.links.map((link) => (
                            <li key={link.label}>
                                {link.children ? (
                                    <SidebarDropdown link={link} />
                                ) : (
                                    <SidebarItem link={link} />
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

export const SidebarNav = memo(SidebarNavComponent);


