'use client';

import { memo, Fragment } from 'react';
import { useAppSelector } from '@/src/store/hooks';
import { selectTopbarVisible, selectSidebarVisible } from '@/src/store/slices/layoutSlice';
import { selectBreadcrumbMapping } from '@/src/store/slices/breadcrumbSlice';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuTrigger,
    Button,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '../../shared/ui';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Logout from '../../auth/Logout';


function TopbarComponent() {
    const isVisible = useAppSelector(selectTopbarVisible);
    const isSidebarVisible = useAppSelector(selectSidebarVisible);
    const breadcrumbMapping = useAppSelector(selectBreadcrumbMapping);
    const pathname = usePathname();

    const pathSegments = pathname.split('/').filter(Boolean);

    const breadcrumbItems = pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;

        const label = breadcrumbMapping[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

        return { label, href, isLast };
    });

    const topbarClasses = [
        'header',
        'header--glass',
        !isVisible ? 'is-hidden' : '',
        !isSidebarVisible ? 'is-full-width' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <header className={topbarClasses} role="banner" aria-label="Top navigation">
            <div className='header__wrapper'>
                <div className="header__left">
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbItems.map((item, index) => (
                                <Fragment key={item.href}>
                                    {index > 0 && <BreadcrumbSeparator />}
                                    <BreadcrumbItem>
                                        {item.isLast ? (
                                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link href={item.href}>{item.label}</Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="header__center">
                    {/* Placeholder: Search */}
                    <div className="header__search-placeholder">
                        Search...
                    </div>
                </div>

                <div className="header__right">
                    {/* Placeholder: User menu */}
                    <div className="header__user-placeholder">
                        <Logout />
                    </div>
                </div>
            </div>
        </header>
    );
}

export const Topbar = memo(TopbarComponent);
