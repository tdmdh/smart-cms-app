"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/src/components/shared/ui";
import type { IntegrationConnection } from "@/src/hooks/queries/integrations";

interface DisconnectDialogProps {
    connection: IntegrationConnection | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (connectionId: string) => void;
    loading?: boolean;
}

export function DisconnectDialog({
    connection,
    open,
    onOpenChange,
    onConfirm,
    loading,
}: DisconnectDialogProps) {
    if (!connection) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Disconnect Integration</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to disconnect{" "}
                        <strong>{connection.provider_name}</strong>
                        {connection.external_account_name && (
                            <>
                                {" "}
                                ({connection.external_account_name})
                            </>
                        )}
                        ? This will revoke access and remove the connection.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <button
                        className="btn btn-secondary btn--sm"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-danger btn--sm"
                        onClick={() => onConfirm(connection.id)}
                        disabled={loading}
                    >
                        {loading ? "Disconnecting..." : "Disconnect"}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
