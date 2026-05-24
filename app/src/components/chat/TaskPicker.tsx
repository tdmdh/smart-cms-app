'use client';

import { useState } from 'react';
import { DialogFooter, Icon, Input } from '@/src/components/shared/ui';
import { useUserTasks } from '@/src/hooks/queries/project-management';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Button,
} from '@/src/components/shared/ui';

interface Props {
    onSelect: (taskId: string) => void;
    onClose: () => void;
}

interface TaskItem {
    id: string;
    title?: string;
}

export function TaskPicker({ onSelect, onClose }: Props) {
    const [search, setSearch] = useState('');
    const { data, isLoading } = useUserTasks();
    const tasks = ((data?.tasks ?? []) as TaskItem[]).filter((t) =>
        t.title?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Attach a task</DialogTitle>
                </DialogHeader>
                <div className="picker-modal">
                    <Input
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    <div className="picker-modal__list">
                        {isLoading ? (
                            <p className="picker-modal__empty">Loading...</p>
                        ) : tasks.length === 0 ? (
                            <p className="picker-modal__empty">No tasks found</p>
                        ) : (
                            tasks.map((task) => (
                                <button
                                    key={task.id}
                                    className="picker-modal__item"
                                    onClick={() => onSelect(task.id)}
                                >
                                    <Icon name="list-checks" size={16} className="picker-modal__item-icon" />
                                    <span className="picker-modal__item-label">{task.title ?? task.id}</span>
                                </button>
                            ))
                        )}
                    </div>
                    <DialogFooter >
                        <Button size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
