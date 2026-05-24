'use client';

import { useState } from 'react';
import { DocumentArchetype } from '@/src/api/knowledge/archetypes';
import { useDeleteArchetype } from '@/src/hooks/queries/knowledge/archetypes';
import { Card, CardHeader, CardBody, CardActions, Button } from '@/src/components/shared/ui';

interface ArchetypeCardProps {
    archetype: DocumentArchetype;
    projectId: string;
    onEdit: (archetype: DocumentArchetype) => void;
}

export default function ArchetypeCard({ archetype, projectId, onEdit }: ArchetypeCardProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const deleteArchetype = useDeleteArchetype(projectId);

    const handleDelete = () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        deleteArchetype.mutate(archetype.id, {
            onSuccess: () => setConfirmDelete(false),
        });
    };

    return (
        <Card variant="bordered">
            <CardHeader
                title={archetype.name}
                subtitle={archetype.description || undefined}
                action={
                    <CardActions>
                        <Button
                            variant="ghost"
                            size="xs"
                            iconOnly
                            leftIcon="edit"
                            iconSize={13}
                            onClick={() => onEdit(archetype)}
                            aria-label="Edit archetype"
                        />
                        {confirmDelete ? (
                            <Button
                                variant="danger"
                                size="xs"
                                leftIcon="trash"
                                iconSize={13}
                                onClick={handleDelete}
                                disabled={deleteArchetype.isPending}
                                aria-label="Confirm delete"
                            >
                                Confirm?
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                size="xs"
                                iconOnly
                                leftIcon="trash"
                                iconSize={13}
                                onClick={handleDelete}
                                aria-label="Delete archetype"
                            />
                        )}
                    </CardActions>
                }
            />
            {archetype.prompt_template && (
                <CardBody>
                    <details>
                        <summary className="archetype-prompt-summary">View prompt template</summary>
                        <pre className="archetype-prompt-preview">{archetype.prompt_template}</pre>
                    </details>
                </CardBody>
            )}
        </Card>
    );
}
