
'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { useClients } from '@/src/hooks/queries/client-management';
import { useClientOnboardingInvitations } from '@/src/hooks/queries/client-management';
import { useAppDispatch } from '@/src/store/hooks';
import { setSidebarView } from '@/src/store/slices/layoutSlice';
import { useDebounce } from '@/src/hooks/useDebounce';
import { Input } from '@/src/components/shared/ui/Input';
import { Button } from '@/src/components/shared/ui/Button';
import { Icon } from '@/src/components/shared/ui/Icon';
import EmptyState from '@/src/components/shared/ui/EmptyState';
import { Skeleton, Alert, Badge, UserAvatar, useToast } from '@/src/components/shared/ui';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/src/components/shared/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsHeader } from '@/src/components/shared/ui/Tabs';
import { DashboardListPage, type BulkAction } from '@/src/components/shared/DashboardListPage';
import { ClientCard, type Client } from './ClientCard';
import type { ClientOnboardingInvitationResponse } from '@/src/hooks/queries/client-management/config';
import { MailOpen, Clock, CheckCircle2, XCircle, Building2 } from 'lucide-react';

// ─── Pending Invitations List ────────────────────────────────────────────────

function InvitationRow({ inv }: { inv: ClientOnboardingInvitationResponse }) {
    const isExpired = inv.status === 'expired' || new Date(inv.expires_at) < new Date();

    const statusVariant = inv.status === 'accepted'
        ? 'success'
        : isExpired ? 'error' : 'warning';

    const StatusIcon = inv.status === 'accepted'
        ? CheckCircle2
        : isExpired ? XCircle : Clock;

    return (
        <div className="invitation-row">
            <div className="invitation-row__avatar">
                <UserAvatar name={inv.email} email={inv.email} size="md" />
            </div>
            <div className="invitation-row__info">
                <span className="invitation-row__email">{inv.email}</span>
                <span className="invitation-row__meta">
                    Sent {new Date(inv.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                    })}
                </span>
            </div>
            <Badge
                size="sm"
                variant={statusVariant}
                className="invitation-row__status"
            >
                <StatusIcon size={11} />
                {inv.status === 'accepted' ? 'Accepted' : isExpired ? 'Expired' : 'Pending'}
            </Badge>
            <span className="invitation-row__expires">
                {inv.status !== 'accepted' && (
                    isExpired
                        ? 'Expired'
                        : `Expires ${new Date(inv.expires_at).toLocaleDateString()}`
                )}
            </span>
        </div>
    );
}

function PendingInvitationsPanel() {
    const { data, isLoading, isError } = useClientOnboardingInvitations();
    const invitations = data?.invitations ?? [];

    if (isLoading) {
        return (
            <div className="invitation-list">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="invitation-row invitation-row--skeleton" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <Alert variant="error" title="Failed to load invitations">
                Something went wrong. Please try again.
            </Alert>
        );
    }

    if (invitations.length === 0) {
        return (
            <EmptyState
                icon="mail"
                title="No invitations sent"
                description="Invite a client via the 'Add Client' button to get started."
            />
        );
    }

    return (
        <div className="invitation-list">
            {invitations.map(inv => (
                <InvitationRow key={inv.id} inv={inv} />
            ))}
        </div>
    );
}

// ─── Active Clients Panel ─────────────────────────────────────────────────────

function ActiveClientsPanel() {
    const dispatch = useAppDispatch();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const { data, isLoading, isError } = useClients();
    const clients = (data?.clients || []) as Client[];

    const filteredClients = useMemo(() => {
        let result = clients;
        if (debouncedSearch.trim()) {
            const q = debouncedSearch.toLowerCase();
            result = result.filter(c => c.name?.toLowerCase().includes(q));
        }
        if (statusFilter !== 'all') {
            result = result.filter(c => c.status === statusFilter);
        }
        return result;
    }, [clients, debouncedSearch, statusFilter]);

    const stats = useMemo(() => {
        const total = clients.length;
        const active = clients.filter(c => c.status === 'active').length;
        const totalProjects = clients.reduce((sum, c) => sum + (c.total_projects || 0), 0);
        const totalMembers = clients.reduce((sum, c) => sum + (c.total_members || 0), 0);
        return { total, active, totalProjects, totalMembers };
    }, [clients]);

    const handleCreateClient = useCallback(() => {
        dispatch(setSidebarView({ view: 'client-form' }));
    }, [dispatch]);

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const allClientIds = useMemo(() => filteredClients.map(c => c.id), [filteredClients]);

    const bulkActions: BulkAction[] = useMemo(() => [
        {
            label: 'Archive',
            variant: 'ghost' as const,
            onClick: (ids: string[]) => {
                console.log('bulk archive', ids);
                setSelectedIds([]);
            },
        },
        {
            label: 'Delete',
            variant: 'danger' as const,
            onClick: (ids: string[]) => {
                console.log('bulk delete', ids);
                setSelectedIds([]);
            },
        },
    ], []);

    const statsElement = !isLoading && clients.length > 0 ? (
        <>
            <span className="project-team__stat project-team__stat--default">
                <Icon name="building" size={12} />
                {stats.total} client{stats.total !== 1 ? 's' : ''}
            </span>
            {stats.active > 0 && (
                <span className="project-team__stat project-team__stat--success">
                    <Icon name="activity" size={12} />
                    {stats.active} active
                </span>
            )}
            {stats.totalProjects > 0 && (
                <span className="project-team__stat project-team__stat--info">
                    <Icon name="folder" size={12} />
                    {stats.totalProjects} project{stats.totalProjects !== 1 ? 's' : ''}
                </span>
            )}
            {stats.totalMembers > 0 && (
                <span className="project-team__stat project-team__stat--warning">
                    <Icon name="users" size={12} />
                    {stats.totalMembers} member{stats.totalMembers !== 1 ? 's' : ''}
                </span>
            )}
        </>
    ) : null;

    const actionsElement = !isLoading && clients.length > 0 ? (
        <>
            <Input
                leftIcon="search"
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="primary" rightIcon="plus" iconSize={14} size="xs" onClick={handleCreateClient}>
                Add Client
            </Button>
        </>
    ) : null;

    if (isLoading) {
        return (
            <DashboardListPage>
                <div className="clients-list">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="client-card client-card--skeleton" />
                    ))}
                </div>
            </DashboardListPage>
        );
    }

    if (isError) {
        return (
            <DashboardListPage>
                <Alert variant="error" title="Failed to load clients">
                    Something went wrong while loading your clients. Please try again.
                </Alert>
            </DashboardListPage>
        );
    }

    if (clients.length === 0) {
        return (
            <DashboardListPage>
                <EmptyState
                    icon="building"
                    title="No clients yet"
                    description="Get started by adding your first client to manage their projects and team members."
                    cta={{ label: 'Add Your First Client', onClick: handleCreateClient }}
                />
            </DashboardListPage>
        );
    }

    return (
        <DashboardListPage
            stats={statsElement}
            actions={actionsElement}
            bulkActions={bulkActions}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            allItemIds={allClientIds}
            totalItems={filteredClients.length}
        >
            {filteredClients.length > 0 ? (
                <div className="clients-list">
                    {filteredClients.map(client => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            selected={selectedIds.includes(client.id)}
                            onSelect={() => toggleSelection(client.id)}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon="search"
                    title="No clients match"
                    description="Try adjusting your search or filters"
                    cta={{
                        label: 'Clear Filters',
                        onClick: () => { setSearchQuery(''); setStatusFilter('all'); },
                    }}
                />
            )}
        </DashboardListPage>
    );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

function ClientsBoardComponent() {
    const { data: invData } = useClientOnboardingInvitations();
    const pendingCount = invData?.invitations?.filter(i => i.status === 'pending').length ?? 0;
    const [activeTab, setActiveTab] = useState<'clients' | 'pending'>('clients');

    return (
        <div className='project-detail'>
            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'clients' | 'pending')}
                orientation="horizontal"
                className="clients-board"
            >
                <TabsHeader
                    layout="row"
                >
                    <TabsList className="tabs-nav">
                        <TabsTrigger
                            value="clients"
                            className="tabs-nav__link"
                            showIndicator={activeTab === 'clients'}
                            indicatorLayoutId="clients-board-tab-indicator"
                            indicatorTransition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 35,
                            }}
                        >
                            <Building2 size={16} className="tabs-nav__foreground" />
                            <span className="tabs-nav__label tabs-nav__foreground">Clients</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="pending"
                            className="tabs-nav__link"
                            badge={pendingCount > 0 ? pendingCount : undefined}
                            showIndicator={activeTab === 'pending'}
                            indicatorLayoutId="clients-board-tab-indicator"
                            indicatorTransition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 35,
                            }}
                        >
                            <MailOpen size={16} className="tabs-nav__foreground" />
                            <span className="tabs-nav__label tabs-nav__foreground">Pending</span>
                        </TabsTrigger>
                    </TabsList>
                </TabsHeader>

                <TabsContent value="clients">
                    <ActiveClientsPanel />
                </TabsContent>

                <TabsContent value="pending">
                    <PendingInvitationsPanel />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export const ClientsBoard = memo(ClientsBoardComponent);