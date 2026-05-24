"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Button, EmptyState } from "@/src/components/shared/ui";
import { Skeleton } from "@/src/components/shared/ui";
import { useToast } from "@/src/components/shared/ui/Toast";
import {
    ProviderCard,
    ConnectionRow,
    DisconnectDialog,
} from "@/src/components/integrations";
import {
    useProviders,
    useConnections,
    useDisconnect,
    type IntegrationConnection,
} from "@/src/hooks/queries/integrations";
import { Link2, Plug, Unplug, Zap, Cable } from "lucide-react";

function IntegrationsPage() {
    const searchParams = useSearchParams();
    const { data: providersData, isLoading: loadingProviders, error: providersError } = useProviders();
    const { data: connectionsData, isLoading: loadingConnections, error: connectionsError } = useConnections();
    const disconnect = useDisconnect();
    const toast = useToast();

    const [disconnectTarget, setDisconnectTarget] = useState<IntegrationConnection | null>(null);

    // Show toast for OAuth callback results (?connected=provider or ?error=msg)
    useEffect(() => {
        const connected = searchParams.get("connected");
        const oauthError = searchParams.get("error");
        if (connected) {
            toast.success(`Successfully connected ${connected}`);
        } else if (oauthError) {
            toast.error(`Connection failed: ${decodeURIComponent(oauthError)}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const providers = providersData?.providers ?? [];
    const connections = connectionsData?.connections ?? [];

    const connectedSlugs = useMemo(
        () => new Set(connections.map((c) => c.provider_slug)),
        [connections]
    );

    const handleDisconnect = useCallback(
        async (connectionId: string) => {
            try {
                await disconnect.mutateAsync(connectionId);
                toast.success("Integration disconnected successfully");
                setDisconnectTarget(null);
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to disconnect"
                );
            }
        },
        [disconnect, toast]
    );

    const isLoading = loadingProviders || loadingConnections;
    const error = providersError || connectionsError;

    if (error) {
        return (
            <div className="integrations-page">
                <EmptyState
                    title="Error"
                    description="Failed to load integrations"
                    icon="error"
                    color="error"
                    
                    cta={{
                        label: 'Retry',
                        onClick: () => window.location.reload()
                    }}
                />
            </div>
        );
    }

    if (!providers.length) {
        return (
            <div className="integrations-page">
                <EmptyState
                    title="No Providers"
                    description="No providers found"
                    icon="info"
                    color='default'
                />
            </div>
        );
    }

    return (
        <div className="integrations-page">
            {/* ── Page Header ───────────────────────────────────────── */}
            <div className="integrations-page__header">
                <div className="integrations-page__title-group">
                    <h1 className="integrations-page__title">Integrations</h1>
                    <p className="integrations-page__subtitle">
                        Connect third-party services to enhance your workflow
                        and streamline deployments.
                    </p>
                </div>
            </div>

            {/* ── Stats ─────────────────────────────────────────────── */}
            {/* <div className="integrations-page__stats">
                <div className="integrations-page__stat-card">
                    <div className="integrations-page__stat-icon integrations-page__stat-icon--primary">
                        <Plug size={22} />
                    </div>
                    <div className="integrations-page__stat-text">
                        <span className="integrations-page__stat-value">
                            {isLoading ? "—" : providers.length}
                        </span>
                        <span className="integrations-page__stat-label">
                            Available
                        </span>
                    </div>
                </div>

                <div className="integrations-page__stat-card">
                    <div className="integrations-page__stat-icon integrations-page__stat-icon--success">
                        <Link2 size={22} />
                    </div>
                    <div className="integrations-page__stat-text">
                        <span className="integrations-page__stat-value">
                            {isLoading ? "—" : connections.length}
                        </span>
                        <span className="integrations-page__stat-label">
                            Connected
                        </span>
                    </div>
                </div>

                <div className="integrations-page__stat-card">
                    <div className="integrations-page__stat-icon integrations-page__stat-icon--warning">
                        <Unplug size={22} />
                    </div>
                    <div className="integrations-page__stat-text">
                        <span className="integrations-page__stat-value">
                            {isLoading
                                ? "—"
                                : providers.length - connections.length}
                        </span>
                        <span className="integrations-page__stat-label">
                            Not Connected
                        </span>
                    </div>
                </div>
            </div> */}

            {/* ── Available Providers ───────────────────────────────── */}
            <section className="integrations-page__section">
                <div className="integrations-page__section-header">
                    <h2 className="integrations-page__section-title">
                        Available Providers
                    </h2>
                    <p className="integrations-page__section-desc">
                        Browse and connect services to extend your platform capabilities.
                    </p>
                </div>

                {isLoading ? (
                    <div className="integrations-page__providers-grid">
                        {[1, 2, 3].map((i) => (
                            <Skeleton
                                key={i}
                                className="integrations-page__skeleton-card"
                            />
                        ))}
                    </div>
                ) : providers.length === 0 ? (
                    <div className="empty-state empty-state--default empty-state--compact">
                        <div className="empty-state__icon-wrap">
                            <div className="empty-state__icon-box">
                                <Zap size={28} />
                            </div>
                            <div className="empty-state__ring empty-state__ring--1" aria-hidden="true" />
                            <div className="empty-state__ring empty-state__ring--2" aria-hidden="true" />
                        </div>
                        <h2 className="empty-state__title">No providers yet</h2>
                        <p className="empty-state__description">
                            Integration providers will appear here once configured.
                        </p>
                    </div>
                ) : (
                    <div className="integrations-page__providers-grid">
                        {providers.map((provider) => (
                            <ProviderCard
                                key={provider.id}
                                provider={provider}
                                isConnected={connectedSlugs.has(provider.slug)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Active Connections ────────────────────────────────── */}
            <section className="integrations-page__section">
                <div className="integrations-page__section-header">
                    <h2 className="integrations-page__section-title">
                        Active Connections
                    </h2>
                    <p className="integrations-page__section-desc">
                        Manage your connected services and monitor their status.
                    </p>
                </div>

                {isLoading ? (
                    <div className="integrations-page__connections-list">
                        {[1, 2].map((i) => (
                            <Skeleton
                                key={i}
                                className="integrations-page__skeleton-row"
                            />
                        ))}
                    </div>
                ) : connections.length === 0 ? (
                    <div className="empty-state empty-state--default empty-state--compact">
                        <div className="empty-state__icon-wrap">
                            <div className="empty-state__icon-box">
                                <Cable size={28} />
                            </div>
                            <div className="empty-state__ring empty-state__ring--1" aria-hidden="true" />
                            <div className="empty-state__ring empty-state__ring--2" aria-hidden="true" />
                        </div>
                        <h2 className="empty-state__title">No connections</h2>
                        <p className="empty-state__description">
                            Connect a provider above to get started with your integrations.
                        </p>
                    </div>
                ) : (
                    <div className="integrations-page__connections-list">
                        {connections.map((connection) => (
                            <ConnectionRow
                                key={connection.id}
                                connection={connection}
                                onDisconnect={setDisconnectTarget}
                                disconnecting={
                                    disconnect.isPending &&
                                    disconnectTarget?.id === connection.id
                                }
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Disconnect Confirmation Dialog */}
            <DisconnectDialog
                connection={disconnectTarget}
                open={!!disconnectTarget}
                onOpenChange={(open) => {
                    if (!open) setDisconnectTarget(null);
                }}
                onConfirm={handleDisconnect}
                loading={disconnect.isPending}
            />
        </div>
    );
}

export default memo(IntegrationsPage);
