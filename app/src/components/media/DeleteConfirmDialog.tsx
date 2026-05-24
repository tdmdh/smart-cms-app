'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/src/components/shared/ui/Dialog';
import { Icon } from '@/src/components/shared/ui';
import type { AssetItem } from './AssetCard';

interface DeleteConfirmDialogProps {
    asset: AssetItem | null;
    open: boolean;
    onClose: () => void;
    onConfirm: (asset: AssetItem) => void;
    isDeleting?: boolean;
}

export function DeleteConfirmDialog({
    asset,
    open,
    onClose,
    onConfirm,
    isDeleting = false,
}: DeleteConfirmDialogProps) {
    if (!asset) return null;

    const handleConfirm = () => {
        onConfirm(asset);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="delete-confirm-dialog">
                <DialogHeader>
                    <DialogTitle>Delete Asset</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{asset.name}"? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn--danger"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Icon name="loader" size={16} />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Icon name="trash" size={16} />
                                Delete
                            </>
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default DeleteConfirmDialog;
