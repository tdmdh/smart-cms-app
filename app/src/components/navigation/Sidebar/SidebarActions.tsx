'use client';


import { memo, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/src/components/shared/ui';
import { getConfigForPath, type PageAction, type PageActionsConfig } from '@/src/config/pageActions.config';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { selectSidebarCollapsed, setSidebarView, openModal } from '@/src/store/slices/layoutSlice';
import { useProjects } from '@/src/hooks/queries/project-management';

interface SidebarActionsProps {
    className?: string;
}

function SidebarActionsComponent({ className = '' }: SidebarActionsProps) {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const isCollapsed = useAppSelector(selectSidebarCollapsed);

    const pageConfig = getConfigForPath(pathname);

    const shouldFetchProjects = pageConfig?.dynamicActions?.dataType === 'projects';
    const { data: projectsData } = useProjects(shouldFetchProjects ? {} : undefined);

    const actions = useMemo<PageAction[]>(() => {
        if (!pageConfig) return [];

        const result: PageAction[] = [];

        if (pageConfig.actions) {
            result.push(...pageConfig.actions);
        }

        if (pageConfig.dynamicActions) {
            const { dataType, config } = pageConfig.dynamicActions;

            let hasData = false;

            switch (dataType) {
                case 'projects':
                    hasData = (projectsData?.projects?.length ?? 0) > 0;
                    break;
            }

            result.push(hasData ? config.whenHasData : config.whenEmpty);
        }



        return result;
    }, [pageConfig, projectsData]);

    const handleAction = useCallback((action: PageAction) => {
        switch (action.action) {
            case 'create':
                if (action.opensView) {
                    dispatch(setSidebarView({ view: action.opensView }));
                }
                break;
            case 'switch':
                if (action.opensView) {
                    dispatch(setSidebarView({ view: action.opensView, width: 'sm' }));
                }
                break;
            case 'back':
                router.back();
                break;
            case 'modal':
                dispatch(openModal(action.id));
                break;
            case 'refresh':
                router.refresh();
                break;
            case 'filter':
                break;
            case 'search':
                break;
            default:
                if (action.opensView) {
                    dispatch(setSidebarView({ view: action.opensView, width: 'sm' }));
                }
        }
    }, [pathname, router, dispatch]);

    if (actions.length === 0) {
        return null;
    }

    return (
        <div className={`sidebar-actions ${className}`}>
            {actions.map((action) => (
                <button
                    key={action.id}
                    type="button"
                    className={isCollapsed ? 'sidebar-actions__btn--collapsed' : 'sidebar-actions__btn'}
                    onClick={() => handleAction(action)}
                    aria-label={action.label}
                    title={action.label}
                >
                    <Icon
                        name={action.icon}
                        size={16}
                    />
                </button>
            ))}
        </div>
    );
}

export const SidebarActions = memo(SidebarActionsComponent);

