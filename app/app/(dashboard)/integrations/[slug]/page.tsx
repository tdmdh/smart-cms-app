"use client";

import { useState, useCallback, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Badge,
    Skeleton,
    Button,
    Card,
    CardBody,
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
    Icon,
    EmptyState,
} from "@/src/components/shared/ui";
import { useToast } from "@/src/components/shared/ui/Toast";
import {
    useProviders,
    useConnections,
    useBeginConnect,
    useDisconnect,
    useOAuthPopup,
    type IntegrationConnection,
} from "@/src/hooks/queries/integrations";
import { DisconnectDialog } from "@/src/components/integrations";


const providerTypeLabels: Record<string, string> = {
    devops: "DevOps",
    cloud: "Cloud",
    productivity: "Productivity",
};

const providerTypeVariants: Record<string, string> = {
    devops: "info",
    cloud: "primary",
    productivity: "warning",
};

function IntegrationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const slug = params.slug as string;

    const { data: providersData, isLoading: loadingProviders } = useProviders();
    const { data: connectionsData, isLoading: loadingConnections } = useConnections();
    const beginConnect = useBeginConnect();
    const disconnect = useDisconnect();
    const { openPopup } = useOAuthPopup();

    const [connectingProvider, setConnectingProvider] = useState(false);
    const [disconnectTarget, setDisconnectTarget] = useState<IntegrationConnection | null>(null);

    const provider = useMemo(
        () => providersData?.providers?.find((p) => p.slug === slug),
        [providersData, slug]
    );

    const providerConnections = useMemo(
        () =>
            connectionsData?.connections?.filter(
                (c) => c.provider_slug === slug
            ) ?? [],
        [connectionsData, slug]
    );

    const isConnected = providerConnections.length > 0;
    const isLoading = loadingProviders || loadingConnections;

    const handleConnect = useCallback(async () => {
        if (!provider) return;
        setConnectingProvider(true);

        // Open blank popup synchronously before any await (iOS Safari compat)
        const { navigate, abort } = openPopup({
            onSuccess: () => toast.success(`${provider.name} connected successfully`),
            onError: (_, error) => toast.error(error),
        });

        try {
            const result = await beginConnect.mutateAsync({
                provider: provider.slug,
                data: {
                    redirect_uri: `${window.location.origin}/callback/${provider.slug}`,
                },
            });
            navigate(result.auth_url);
        } catch (error) {
            abort();
            toast.error(
                error instanceof Error ? error.message : "Failed to start connection"
            );
        } finally {
            setConnectingProvider(false);
        }
    }, [provider, beginConnect, toast, openPopup]);

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

    // ── Loading State ────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="integration-detail">
                <Skeleton style={{ width: 200, height: 20, borderRadius: 8 }} />
                <Card variant="transparent" className="integration-detail__hero">
                    <CardBody>
                        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                            <Skeleton style={{ width: 72, height: 72, borderRadius: 16, flexShrink: 0 }} />
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                                <Skeleton style={{ width: 200, height: 28, borderRadius: 8 }} />
                                <Skeleton style={{ width: 320, height: 14, borderRadius: 6 }} />
                                <Skeleton style={{ width: 140, height: 36, borderRadius: 10, marginTop: 8 }} />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    // ── Not Found State ──────────────────────────────────────────────
    if (!provider) {
        return (
            <div className="integration-detail">
                <EmptyState
                    title="Integration Not Found"
                    description="The integration provider you are looking for does not exist."
                    icon="search"
                    actions={
                        <Button
                            variant="secondary"
                            size="sm"
                            href="/integrations"
                        >
                            Back to Integrations
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="integration-detail">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/integrations">Integrations</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{provider.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <Card variant='transparent' className="integration-detail__hero">
                <CardBody>
                    <div className="integration-detail__hero-layout">
                        <div className="integration-detail__icon-wrap">
                            <div className="integration-detail__icon">
                                {provider.icon_url ? (
                                    <img
                                        src={provider.icon_url}
                                        alt={provider.name}
                                        className="integration-detail__icon-img"
                                    />
                                ) : (
                                    <div className="integration-detail__icon-placeholder">
                                        {provider.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="integration-detail__ring integration-detail__ring--1" aria-hidden="true" />
                            <div className="integration-detail__ring integration-detail__ring--2" aria-hidden="true" />
                        </div>

                        <div className="integration-detail__hero-content">
                            <div className="integration-detail__hero-title-row">
                                <h1 className="integration-detail__title">{provider.name}</h1>
                                <Badge
                                    size="sm"
                                    variant={(providerTypeVariants[provider.type] || "secondary") as any}
                                >
                                    {providerTypeLabels[provider.type] || provider.type}
                                </Badge>
                                {isConnected && (
                                    <Badge variant="success" dot>
                                        Connected
                                    </Badge>
                                )}
                            </div>

                            <p className="integration-detail__description">
                                Connect your {provider.name} account to enable seamless integration
                                with your workflow. Manage deployments, repositories, and services
                                directly from your dashboard.
                            </p>

                        </div>
                            <div className="integration-detail__hero-actions">
                                {isConnected ? (
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => setDisconnectTarget(providerConnections[0])}
                                    >
                                        Uninstall
                                    </Button>
                                ) : (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={handleConnect}
                                        loading={connectingProvider}
                                        disabled={connectingProvider}
                                    >
                                        Install {provider.name}
                                    </Button>
                                )}
                            </div>
                    </div>
                </CardBody>
            </Card>

            <div className="integration-detail__info-grid">
                <Card variant="transparent">
                    <CardBody>
                        <div className="integration-detail__info-header">
                            <div className="integration-detail__info-icon integration-detail__info-icon--primary">
                                <Icon name="shield" size={18} />
                            </div>
                            <h3 className="integration-detail__info-title">Permissions</h3>
                        </div>
                        <p className="integration-detail__info-desc">
                            Scopes requested when connecting this integration.
                        </p>
                        {provider.default_scopes?.length > 0 ? (
                            <div className="integration-detail__scopes-list">
                                {provider.default_scopes.map((scope) => (
                                    <div key={scope} className="integration-detail__scope-item">
                                        <Icon name="check" size={14} />
                                        <span>{scope}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="integration-detail__info-empty">
                                No specific scopes required.
                            </p>
                        )}
                    </CardBody>
                </Card>

                <Card variant="transparent">
                    <CardBody>
                        <div className="integration-detail__info-header">
                            <div className="integration-detail__info-icon integration-detail__info-icon--success">
                                <Icon name="link" size={18} />
                            </div>
                            <h3 className="integration-detail__info-title">Connection Status</h3>
                        </div>
                        {providerConnections.length > 0 ? (
                            <div className="integration-detail__connections">
                                {providerConnections.map((conn) => (
                                    <div key={conn.id} className="integration-detail__connection-item">
                                        <div className="integration-detail__connection-info">
                                            <span className="integration-detail__connection-account">
                                                {conn.external_account_name ||
                                                    conn.external_account_email ||
                                                    conn.external_account_id}
                                            </span>
                                            <Badge size="sm" variant="success">
                                                {conn.status}
                                            </Badge>
                                        </div>
                                        <div className="integration-detail__connection-dates">
                                            <span className="integration-detail__connection-date">
                                                <Icon name="clock" size={12} />
                                                Connected{" "}
                                                {conn.connected_at
                                                    ? new Date(conn.connected_at).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })
                                                    : "—"}
                                            </span>
                                        </div>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => setDisconnectTarget(conn)}
                                            disabled={disconnect.isPending}
                                        >
                                            Uninstall
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="integration-detail__info-empty">
                                Not connected yet
                            </p>
                        )}
                    </CardBody>
                </Card>
            </div>


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

export default memo(IntegrationDetailPage);
