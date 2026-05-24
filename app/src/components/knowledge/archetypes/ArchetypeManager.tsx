'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DocumentArchetype } from '@/src/api/knowledge/archetypes';
import { useDeleteArchetype, useArchetypeLivingDoc } from '@/src/hooks/queries/knowledge/archetypes';
import { Button } from '@/src/components/shared/ui';
import LivingDocCard from '@/src/components/knowledge/LivingDocCard';

interface ArchetypeManagerProps {
    projectId: string;
    archetype: DocumentArchetype;
    onEdit: () => void;
    onDeleted: () => void;
}

function ArchetypeLivingDocView({ projectId, archetypeId, archetype }: {
    projectId: string;
    archetypeId: string;
    archetype: DocumentArchetype;
}) {
    const { data: livingDoc, isLoading } = useArchetypeLivingDoc(projectId, archetypeId);

    if (isLoading) {
        return (
            <div className="archetype-manager__loading">
                <Loader2 size={16} className="animate-spin" />
            </div>
        );
    }

    if (!livingDoc) {
        return (
            <div className="archetype-manager__empty">
                <p className="archetype-manager__description">{archetype.description}</p>
                <span className="archetype-manager__empty-hint">
                    AI will build this living document automatically as git, upload, and task events arrive.
                </span>
            </div>
        );
    }

    return <LivingDocCard doc={livingDoc} />;
}

export default function ArchetypeManager({ projectId, archetype, onEdit, onDeleted }: ArchetypeManagerProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const deleteArchetype = useDeleteArchetype(projectId);

    const handleDelete = () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        deleteArchetype.mutate(archetype.id, {
            onSuccess: () => { setConfirmDelete(false); onDeleted(); },
        });
    };

    return (
        <div className="archetype-manager">
            <ArchetypeLivingDocView
                projectId={projectId}
                archetypeId={archetype.id}
                archetype={archetype}
            />
            <div className="archetype-manager__actions">
                <Button variant="ghost" size="xs" leftIcon="edit" iconSize={13} onClick={onEdit}>
                    Edit
                </Button>
                {confirmDelete ? (
                    <Button
                        variant="danger"
                        size="xs"
                        leftIcon="trash"
                        iconSize={13}
                        onClick={handleDelete}
                        loading={deleteArchetype.isPending}
                    >
                        Confirm?
                    </Button>
                ) : (
                    <Button variant="ghost" size="xs" leftIcon="trash" iconSize={13} onClick={handleDelete}>
                        Delete
                    </Button>
                )}
            </div>
        </div>
    );
}
