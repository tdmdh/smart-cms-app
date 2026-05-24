'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button, EmptyState } from '@/src/components/shared/ui';
import { ConfidenceBadge } from '@/src/components/shared/ui/ConfidenceBadge';
import { useCoSignRequests, CoSignStatus } from '@/src/hooks/queries/cosign';
import { useAppDispatch } from '@/src/store/hooks';
import { setSidebarView } from '@/src/store/slices/layoutSlice';

const statusTabs: { value: CoSignStatus | 'all'; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'auto_approved', label: 'Auto-Approved' },
    { value: 'rejected', label: 'Rejected' },
];

const outputTypeLabels: Record<string, string> = {
    doc: 'Doc',
    doc_upload: 'Upload',
    triage: 'Triage',
    assignment: 'Assignment',
};

export default function CoSignQueuePage() {
    const params = useParams<{ workspaceId: string }>();
    const workspaceId = params.workspaceId;
    const dispatch = useAppDispatch();

    const [activeTab, setActiveTab] = useState<string>('pending'); 
    const { data, isLoading } = useCoSignRequests(workspaceId, { status: activeTab });

    const handleReview = (requestId: string) => {
        dispatch(setSidebarView({ view: 'cosign-review', data: { requestId, workspaceId } }));
    };

    const requests = data?.requests ?? [];

    return (
        <div className="dashboard-page">
            <div className="dashboard-page__header">
                <h1 className="dashboard-page__title">Co Sign</h1>
                <p className="dashboard-page__description">
                    
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                {statusTabs.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value}>
                        <TabsList>
                            {statusTabs.map((tab) => (
                                <TabsTrigger 
                                    key={tab.value} 
                                    value={tab.value}
                                    indicatorTransition={{
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 35,
                                    }}
                                    showIndicator={activeTab === tab.value}
                                    indicatorLayoutId="knowledge-tab-indicator"
                                    >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {isLoading ? (
                            <p className="cosign-queue__empty">Loading…</p>
                        ) : requests.length === 0 ? (
                            <EmptyState
                                icon="shield"
                                title={`No ${tab.label.toLowerCase()} reviews`}
                                description={
                                    tab.value === 'pending'
                                        ? 'The AI is confident in all recent outputs — nothing needs your approval right now.'
                                        : `No ${tab.label.toLowerCase()} items yet.`
                                }
                            />
                        ) : (
                            requests.map((req) => (
                                <div key={req.id} className="cosign-queue__row">
                                    <div className="cosign-queue__row-meta">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span className="badge badge--default badge--sm">
                                                {outputTypeLabels[req.output_type] ?? req.output_type}
                                            </span>
                                            <ConfidenceBadge score={req.confidence_score} size="sm" />
                                        </div>
                                        <p className="cosign-queue__row-rationale">
                                            {req.rationale
                                                ? <>{req.rationale.slice(0, 120)}{req.rationale.length > 120 ? '…' : ''}</>
                                                : <span className="cosign-queue__row-rationale--empty">No rationale provided</span>
                                            }
                                        </p>
                                        <span className="cosign-queue__row-date">
                                            {new Date(req.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    {tab.value === 'pending' && (
                                        <Button size="sm" variant="secondary" onClick={() => handleReview(req.id)}>
                                            Review
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
