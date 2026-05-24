
"use client";

import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, UserAvatar, useToast, Badge } from "@/src/components/shared/ui";
import { Button } from "@/src/components/shared/ui/Button";
import { useWorkspacePath } from "@/src/hooks/useWorkspacePath";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/shared/ui/DropdownMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/shared/ui/Dialog";
import { useDeleteClient } from "@/src/hooks/queries/client-management";

export interface Client {
  id: string;
  name: string;
  logo?: string;
  primary_email?: string;
  total_projects?: number;
  total_members?: number;
  status?: string;
}

interface ClientCardProps {
  client: Client;
  selected?: boolean;
  onSelect?: () => void;
}

function ClientCardComponent({ client }: ClientCardProps) {
  const router = useRouter();
  const workspacePath = useWorkspacePath();
  const toast = useToast();
  const deleteMutation = useDeleteClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const projects = client.total_projects ?? 0;
  const members = client.total_members ?? 0;
  const isActive = client.status === "active";

  const handleDelete = () => {
    deleteMutation.mutate(client.id, {
      onSuccess: () => {
        toast.success(`"${client.name}" deleted successfully`);
        setShowDeleteDialog(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete client");
        setShowDeleteDialog(false);
      },
    });
  };

  const cardClasses = ["client-card"]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        className={cardClasses}
        onClick={() => router.push(workspacePath(`clients/${client.id}`))}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter")
            router.push(workspacePath(`clients/${client.id}`));
        }}
      >
        {/* Top row: avatar + name + menu */}
        <div className="client-card__top">
          <div className="">
            {client.logo ? (
              <img
                src={client.logo}
                alt={client.name}
                className="client-card__logo"
              />
            ) : (
              <UserAvatar
                name={client.name}
                email={client.primary_email}
                size="lg"
              />
            )}
          </div>

          <div className="client-card__content">
            <div className="client-card__header">
              <h3 className="client-card__name">{client.name}</h3>
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      iconOnly
                      size="xs"
                      leftIcon="more-vertical"
                      className="client-card__menu"
                      aria-label="Client actions"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" size="sm">
                    <DropdownMenuItem
                      icon="eye"
                      onSelect={() =>
                        router.push(workspacePath(`clients/${client.id}`))
                      }
                    >
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      icon="settings"
                      onSelect={() =>
                        router.push(
                          workspacePath(`clients/${client.id}/settings`),
                        )
                      }
                    >
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      icon="trash"
                      variant="danger"
                      onSelect={() => setShowDeleteDialog(true)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {client.primary_email && (
              <span className="client-card__email">{client.primary_email}</span>
            )}
          </div>
        </div>

        {/* Stats columns */}
        <div className="client-card__stats">
          <div className="client-card__stat">
            <span className="client-card__stat-value">{projects}</span>
            <span className="client-card__stat-label">Projects</span>
          </div>
          <div className="client-card__stat">
            <span className="client-card__stat-value">{members}</span>
            <span className="client-card__stat-label">Members</span>
          </div>
        </div>

        {/* Activity health bar */}
        {projects > 0 && (
          <div className="client-card__health">
            <div className="client-card__health-bar">
              <div
                className="client-card__health-fill"
                style={{ width: "100%" }}
              />
            </div>
            <span className="client-card__health-text">{projects} active</span>
          </div>
        )}

        {/* Footer: status badge */}
        <div className="client-card__footer">
          <Badge size="sm" variant={isActive ? "success" : "default"}>
            {client.status || "inactive"}
          </Badge>
        </div>
      </div>

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{client.name}</strong>?
              This will remove all associated data. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const ClientCard = memo(ClientCardComponent);
