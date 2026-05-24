"use client";

import { memo } from "react";
import Link from "next/link";
import { Badge } from "@/src/components/shared/ui";
import type { IntegrationProvider } from "@/src/hooks/queries/integrations";
import { ArrowRight } from "lucide-react";

interface ProviderCardProps {
    provider: IntegrationProvider;
    isConnected: boolean;
}

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

export const ProviderCard = memo(function ProviderCard({
    provider,
    isConnected,
}: ProviderCardProps) {
    return (
        <Link
            href={`/integrations/${provider.slug}`}
            className="provider-card"
        >
            <div className="card__body">
                <div className="provider-card__header">
                    <div className="provider-card__icon-wrap">
                        <div className="provider-card__icon">
                            {provider.icon_url ? (
                                <img
                                    src={provider.icon_url}
                                    alt={provider.name}
                                    className="provider-card__icon-img"
                                />
                            ) : (
                                <div className="provider-card__icon-placeholder">
                                    {provider.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <Badge
                        size="sm"
                        variant={(providerTypeVariants[provider.type] || "secondary") as any}
                    >
                        {providerTypeLabels[provider.type] || provider.type}
                    </Badge>
                </div>

                <div className="provider-card__content">
                    <h3 className="provider-card__name">{provider.name}</h3>
                    {provider.default_scopes?.length > 0 && (
                        <div className="provider-card__scopes">
                            {provider.default_scopes.map((scope) => (
                                <Badge
                                    key={scope}
                                    size="sm"
                                    variant="secondary"
                                >
                                    {scope}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <div className="provider-card__footer">
                    {isConnected && (
                        <Badge variant="success" dot>
                            Connected
                        </Badge>
                    )}
                    <span className="provider-card__view-link">
                        View details
                        <ArrowRight size={14} />
                    </span>
                </div>
            </div>
        </Link>
    );
});
