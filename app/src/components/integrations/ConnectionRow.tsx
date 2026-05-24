"use client";

import { memo } from "react";
import { Badge } from "@/src/components/shared/ui";
import type { IntegrationConnection } from "@/src/hooks/queries/integrations";

interface ConnectionRowProps {
    connection: IntegrationConnection;
    onDisconnect: (connection: IntegrationConnection) => void;
    disconnecting?: boolean;
}

const statusVariants: Record<string, string> = {
    active: "success",
    expired: "warning",
    revoked: "error",
    error: "error",
};

export const ConnectionRow = memo(function ConnectionRow({
    connection,
    onDisconnect,
    disconnecting,
}: ConnectionRowProps) {
    const connectedDate = connection.connected_at
        ? new Date(connection.connected_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        : "—";

    const lastUsedDate = connection.last_used_at
        ? new Date(connection.last_used_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        : "Never";

    const isActive = connection.status === "active";

    return (
        <div className={`connection-row${isActive ? " connection-row--active" : ""}`}>
            <div className="connection-row__provider">
                <div className="connection-row__icon-wrap">
                    {connection.provider_icon_url ? (
                        <img
                            src={connection.provider_icon_url}
                            alt={connection.provider_name}
                            className="connection-row__icon"
                        />
                    ) : (
                        <div className="connection-row__icon-placeholder">
                            {connection.provider_name?.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="connection-row__info">
                    <span className="connection-row__provider-name">
                        {connection.provider_name}
                    </span>
                    <span className="connection-row__account">
                        {connection.external_account_name ||
                            connection.external_account_email ||
                            connection.external_account_id}
                    </span>
                </div>
            </div>

            <div className="connection-row__meta">
                <Badge
                    size="sm"
                    variant={(statusVariants[connection.status] || "secondary") as any}
                >
                    {connection.status}
                </Badge>
            </div>

            <div className="connection-row__dates">
                <span className="connection-row__date">
                    <span className="connection-row__date-label">
                        Connected:
                    </span>{" "}
                    {connectedDate}
                </span>
                <span className="connection-row__date">
                    <span className="connection-row__date-label">
                        Last used:
                    </span>{" "}
                    {lastUsedDate}
                </span>
            </div>

            <div className="connection-row__scopes">
                {connection.scopes?.map((scope) => (
                    <Badge key={scope} size="sm" variant="secondary">
                        {scope}
                    </Badge>
                ))}
            </div>

            <div className="connection-row__actions">
                <button
                    className="btn btn-danger btn--sm btn-outline"
                    onClick={() => onDisconnect(connection)}
                    disabled={disconnecting}
                >
                    {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
            </div>
        </div>
    );
});
