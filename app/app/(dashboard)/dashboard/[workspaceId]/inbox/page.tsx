'use client';

import { useEffect, useReducer, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Badge,
    Button,
    EmptyState,
    Modal,
    ModalBody,
    useToast,
    Icon,
} from '@/src/components/shared/ui';
import {
    useReceivedInvitations,
    useSentInvitations,
    useRevokeInvitation,
    useResendInvitation,
    type WorkspaceInvitation,
} from '@/src/hooks/queries/workspace-management';
import { useWebSocketContext } from '@/src/providers/WebSocketProvider';
import { useAppDispatch, useAppSelector } from '@/src/store/hooks';
import { closeSidebarView } from '@/src/store/slices/layoutSlice';
import { selectUser } from '@/src/store/slices/authSlice';
import { FluidScopeStep } from '@/src/components/onboarding/steps';
import { usePublishKnowledgeDoc, useRejectKnowledgeDraft } from '@/src/hooks/queries/knowledge';

// --------------------------------------------------------------------------
// Activity feed
// --------------------------------------------------------------------------

interface ActivityEvent {
    id: string;
    type: string;
    description: string;
    timestamp: number;
}

type ActivityAction =
    | { type: 'PUSH'; event: ActivityEvent }
    | { type: 'CLEAR' };

function activityReducer(state: ActivityEvent[], action: ActivityAction): ActivityEvent[] {
    switch (action.type) {
        case 'PUSH':
            return [action.event, ...state].slice(0, 50);
        case 'CLEAR':
            return [];
        default:
            return state;
    }
}

function describeEvent(type: string, payload: Record<string, unknown>): string {
    switch (type) {
        case 'task.created':
            return `Task "${payload.title ?? 'Untitled'}" was created`;
        case 'task.updated':
            return `Task "${payload.title ?? 'Untitled'}" was updated`;
        case 'task.moved':
            return `Task "${payload.title ?? 'Untitled'}" moved to ${payload.status ?? 'a new column'}`;
        case 'task.deleted':
            return `A task was deleted`;
        case 'comment.created':
            return `${payload.user_name ?? 'Someone'} added a comment`;
        case 'notification.new':
            return String(payload.title ?? 'New notification');
        case 'invitation.accepted':
            return `A workspace invitation was accepted`;
        case 'invitation.received':
            return `You received a workspace invitation`;
        case 'project.updated':
            return `A project was updated`;
        case 'member.joined':
            return `A new member joined the workspace`;
        case 'member.left':
            return `A member left the workspace`;
        case 'knowledge.draft_created':
            return `New knowledge draft: "${payload.title ?? 'Untitled'}" (${payload.source_type ?? 'unknown'})`;
        default:
            return `Event: ${type}`;
    }
}

function relativeTime(ms: number): string {
    const diff = Date.now() - ms;
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
}

const ACTIVITY_STORAGE_KEY = (workspaceId: string) => `activity-feed:${workspaceId}`;
const MAX_STORED_EVENTS = 50;

function loadStoredEvents(workspaceId: string): ActivityEvent[] {
    try {
        const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY(workspaceId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function ActivityFeed({ workspaceId }: { workspaceId: string }) {
    const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketContext();
    const [events, dispatch] = useReducer(
        activityReducer,
        undefined,
        () => loadStoredEvents(workspaceId),
    );

    useEffect(() => {
        try {
            localStorage.setItem(
                ACTIVITY_STORAGE_KEY(workspaceId),
                JSON.stringify(events.slice(0, MAX_STORED_EVENTS)),
            );
        } catch {
            // localStorage may be unavailable (private mode, quota exceeded)
        }
    }, [events, workspaceId]);

    useEffect(() => {
        if (!isConnected || !workspaceId) return;

        const wsChannel = `workspace:${workspaceId}`;
        subscribe(wsChannel);

        const removeListener = onMessage((msg) => {
            dispatch({
                type: 'PUSH',
                event: {
                    id: `${Date.now()}-${Math.random()}`,
                    type: msg.type,
                    description: describeEvent(msg.type, msg.payload ?? {}),
                    timestamp: Date.now(),
                },
            });
        });

        return () => {
            unsubscribe(wsChannel);
            removeListener();
        };
    }, [isConnected, workspaceId, subscribe, unsubscribe, onMessage]);

    if (events.length === 0) {
        return (
            <EmptyState
                icon="activity"
                title="No activity yet"
                description="Events like task updates, comments, and invitations will appear here in real time."
            />
        );
    }

    return (
        <div className="inbox-activity">
            <div className="inbox-activity__header">
                <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => dispatch({ type: 'CLEAR' })}
                    leftIcon="trash"
                    iconSize={13}
                >
                    Clear
                </Button>
            </div>
            {events.map((ev) => (
                <div key={ev.id} className="inbox-activity__item">
                    <span className="inbox-activity__dot" />
                    <div className="inbox-activity__body">
                        <p className="inbox-activity__description">{ev.description}</p>
                        <span className="inbox-activity__time">{relativeTime(ev.timestamp)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --------------------------------------------------------------------------
// Invitation cards
// --------------------------------------------------------------------------

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' | 'default' }> = {
    pending:  { label: 'Pending',  variant: 'warning' },
    accepted: { label: 'Accepted', variant: 'success' },
    revoked:  { label: 'Revoked',  variant: 'danger' },
    expired:  { label: 'Expired',  variant: 'secondary' },
};

const roleConfig: Record<string, { label: string; variant: 'primary' | 'info' | 'default' }> = {
    admin:  { label: 'Admin',  variant: 'primary' },
    member: { label: 'Member', variant: 'info' },
    viewer: { label: 'Viewer', variant: 'default' },
};

function formatExpiry(expiresAt: string): string {
    const date = new Date(expiresAt);
    const now = new Date();
    if (date < now) return 'Expired';
    const days = Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
    return days === 1 ? 'Expires tomorrow' : `Expires in ${days} days`;
}

function ReceivedInvitationCard({ inv }: { inv: WorkspaceInvitation }) {
    const router = useRouter();
    const role = roleConfig[inv.role] ?? roleConfig.member;

    const handleClick = () => {
        if (inv.token) {
            router.push(`/accept-invitation?token=${encodeURIComponent(inv.token)}`);
        }
    };

    return (
        <div
            className="inbox-invitation inbox-invitation--clickable"
            onClick={handleClick}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            <div className="inbox-invitation__info">
                <p className="inbox-invitation__workspace">{inv.workspace_name ?? inv.workspace_id}</p>
                <div className="inbox-invitation__meta">
                    <Badge variant={role.variant as any}>{role.label}</Badge>
                    <span className="inbox-invitation__expiry">
                        <Icon name='clock' size={12} />
                        {formatExpiry(inv.expires_at)}
                    </span>
                </div>
            </div>
            <div className="inbox-invitation__actions">
                <Icon name='chevron-right' size={16} />
            </div>
        </div>
    );
}

function SentInvitationCard({ inv, workspaceId }: { inv: WorkspaceInvitation; workspaceId: string }) {
    const revoke = useRevokeInvitation();
    const resend = useResendInvitation();
    const toast = useToast();
    const status = statusConfig[inv.status] ?? statusConfig.pending;
    const role = roleConfig[inv.role] ?? roleConfig.member;

    const handleRevoke = () => {
        revoke.mutate(
            { workspaceId, invitationId: inv.id },
            {
                onSuccess: () => toast.success('Invitation revoked'),
                onError: (err) => toast.error(err.message || 'Failed to revoke'),
            }
        );
    };

    const handleResend = () => {
        resend.mutate(
            { workspaceId, invitationId: inv.id },
            {
                onSuccess: () => toast.success(`Invitation resent to ${inv.email}`),
                onError: (err) => toast.error(err.message || 'Failed to resend'),
            }
        );
    };

    return (
        <div className="inbox-invitation">
            <div className="inbox-invitation__info">
                <p className="inbox-invitation__email">{inv.email}</p>
                <div className="inbox-invitation__meta">
                    <Badge variant={role.variant as any}>{role.label}</Badge>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {inv.status === 'pending' && (
                        <span className="inbox-invitation__expiry">
                            <Icon name='clock' size={12} />
                            {formatExpiry(inv.expires_at)}
                        </span>
                    )}
                </div>
            </div>
            {inv.status === 'pending' && (
                <div className="inbox-invitation__actions">
                    <Button
                        size="xs"
                        variant="ghost"
                        onClick={handleResend}
                        loading={resend.isPending}
                        disabled={resend.isPending || revoke.isPending}
                        leftIcon='rotate-ccw'
                        iconSize={14}
                    >
                        Resend
                    </Button>
                    <Button
                        size="xs"
                        variant="danger"
                        onClick={handleRevoke}
                        loading={revoke.isPending}
                        disabled={revoke.isPending || resend.isPending}
                        leftIcon='close'
                        iconSize={14}
                    >
                        Revoke
                    </Button>
                </div>
            )}
        </div>
    );
}

// --------------------------------------------------------------------------
// Tab panels
// --------------------------------------------------------------------------

function ReceivedTab() {
    const { data, isLoading } = useReceivedInvitations();
    const invitations = data?.invitations ?? [];

    if (isLoading) {
        return (
            <div className="inbox-list">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="inbox-invitation inbox-invitation--skeleton" />
                ))}
            </div>
        );
    }

    if (invitations.length === 0) {
        return (
            <EmptyState
                icon="mail"
                title="No pending invitations"
                description="When someone invites you to a workspace, you'll see it here."
            />
        );
    }

    return (
        <div className="inbox-list">
            {invitations.map((inv) => (
                <ReceivedInvitationCard key={inv.id} inv={inv} />
            ))}
        </div>
    );
}

function SentTab({ workspaceId }: { workspaceId: string }) {
    const { data, isLoading } = useSentInvitations(workspaceId);
    const invitations = data?.invitations ?? [];

    if (isLoading) {
        return (
            <div className="inbox-list">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="inbox-invitation inbox-invitation--skeleton" />
                ))}
            </div>
        );
    }

    if (invitations.length === 0) {
        return (
            <EmptyState
                icon="send"
                title="No invitations sent"
                description="Invite team members from the Settings → Team page."
            />
        );
    }

    return (
        <div className="inbox-list">
            {invitations.map((inv) => (
                <SentInvitationCard key={inv.id} inv={inv} workspaceId={workspaceId} />
            ))}
        </div>
    );
}

// --------------------------------------------------------------------------
// Fluid Scope invitation trigger
// --------------------------------------------------------------------------

const FLUID_SCOPE_PROMPTED_KEY = (workspaceId: string) => `fluid-scope-prompted:${workspaceId}`;

function FluidScopeInvitationTrigger({ workspaceId }: { workspaceId: string }) {
    const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketContext();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!isConnected || !workspaceId) return;
        const channel = `workspace:${workspaceId}`;
        subscribe(channel);
        const off = onMessage((msg) => {
            if (msg.type !== 'invitation.accepted') return;
            const key = FLUID_SCOPE_PROMPTED_KEY(workspaceId);
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, '1');
                setIsOpen(true);
            }
        });
        return () => { unsubscribe(channel); off(); };
    }, [isConnected, workspaceId, subscribe, unsubscribe, onMessage]);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Set Up Your Focus Profile">
            <ModalBody>
                <FluidScopeStep onNext={() => setIsOpen(false)} onSkip={() => setIsOpen(false)} />
            </ModalBody>
        </Modal>
    );
}

// --------------------------------------------------------------------------
// Knowledge draft review trigger
// --------------------------------------------------------------------------


interface KnowledgeDraftPayload {
    doc_id: string;
    project_id: string;
    source_type: string;
    title: string;
    confidence_score: number;
}

function KnowledgeDraftReviewTrigger({ workspaceId }: { workspaceId: string }) {
    const { isConnected, subscribe, unsubscribe, onMessage } = useWebSocketContext();
    const [pending, setPending] = useState<KnowledgeDraftPayload | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const publish = usePublishKnowledgeDoc(pending?.project_id ?? '');
    const reject = useRejectKnowledgeDraft(pending?.project_id ?? '');

    useEffect(() => {
        if (!isConnected || !workspaceId) return;
        const channel = `workspace:${workspaceId}`;
        subscribe(channel);
        const off = onMessage((msg) => {
            if (msg.type === 'knowledge.draft_created') {
                setPending(msg.payload as unknown as KnowledgeDraftPayload);
            }
        });
        return () => { unsubscribe(channel); off(); };
    }, [isConnected, workspaceId, subscribe, unsubscribe, onMessage]);

    if (!pending) return null;

    return (
        <Modal isOpen onClose={() => setPending(null)} title="Knowledge Draft — Review Required">
            <ModalBody>
                <div className="knowledge-draft-modal">
                    <p className="knowledge-draft-modal__meta">
                        Source: <strong>{pending.source_type}</strong> &middot; Confidence: <strong>{pending.confidence_score}%</strong>
                    </p>
                    <h3 className="knowledge-draft-modal__title">{pending.title}</h3>
                    <div className="knowledge-draft-modal__actions">
                        <Button
                            onClick={() => { publish.mutate(pending.doc_id); setPending(null); }}
                            disabled={publish.isPending}
                        >
                            {publish.isPending ? 'Publishing…' : 'Approve'}
                        </Button>
                        <input
                            className="knowledge-draft-modal__reason"
                            placeholder="Reject reason (optional)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <Button
                            variant="ghost"
                            onClick={() => { reject.mutate({ id: pending.doc_id, reason: rejectReason }); setPending(null); }}
                            disabled={reject.isPending}
                        >
                            Reject
                        </Button>
                        <Button variant="ghost" onClick={() => setPending(null)}>Later</Button>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
}

// --------------------------------------------------------------------------
// Page
// --------------------------------------------------------------------------

export default function InboxPage() {
    const params = useParams<{ workspaceId: string }>();
    const workspaceId = params.workspaceId;
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState('received');

    const { data: receivedData } = useReceivedInvitations();
    const pendingCount = receivedData?.invitations?.length ?? 0;

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
            dispatch(closeSidebarView());
        
    };

    useEffect(() => {
        return () => {
            dispatch(closeSidebarView());
        };
    }, [dispatch]);

    return (
        <div className="dashboard-page">
            <FluidScopeInvitationTrigger workspaceId={workspaceId} />
            <KnowledgeDraftReviewTrigger workspaceId={workspaceId} />
            <div className="dashboard-page__header">
                <h1 className="dashboard-page__title">Inbox</h1>
                <p className="dashboard-page__description">
                    Manage your workspace invitations, activity, and messages.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} withBg={true} className="inbox-tabs">
                <TabsList variant='default'>
                    <TabsTrigger value="received" badge={pendingCount > 0 ? pendingCount : undefined}>
                        <Icon name='mail' size={15} />
                        Received
                    </TabsTrigger>
                    <TabsTrigger value="sent">
                        <Icon name='send' size={15} />
                        Sent
                    </TabsTrigger>
                    <TabsTrigger value="activity">
                        <Icon name='activity' size={15} />
                        Activity
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="received" transparant animated>
                    <ReceivedTab />
                </TabsContent>

                <TabsContent value="sent" transparant animated>
                    <SentTab workspaceId={workspaceId} />
                </TabsContent>

                <TabsContent value="activity" transparant animated>
                    <ActivityFeed workspaceId={workspaceId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
