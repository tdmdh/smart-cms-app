'use client';

import { memo, useState } from 'react';
import {
    Button,
    Skeleton,
    useToast,
    Modal,
    ModalBody,
    Form,
    FormGroup,
    FormInput,
    FormLabel,
    FormActions,
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Input,
    Icon,
    TableContainer,
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableEmpty,
    EmptyState,
} from '@/src/components/shared/ui';

import { useAssets, useFolders, useUploadAsset, useCreateFolder, useDeleteAsset, type Asset, type Folder } from '@/src/hooks/queries/asset-management';
import { UploadZone, AssetCard, AssetRow, AssetPreviewDialog, type AssetItem, type AssetRowItem } from '@/src/components/media';

interface ProjectMediaProps {
    projectId: string;
}

function toAssetItem(asset: Asset): AssetItem {
    return {
        id: asset.id,
        name: asset.name,
        thumbnailUrl: asset.thumbnail_url,
        url: asset.url,
        mimeType: asset.mime_type,
        sizeBytes: asset.size_bytes,
        createdAt: asset.created_at,
        assetType: asset.asset_type,
    };
}

function formatBytes(bytes: number): string {
    if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

type ViewMode = 'grid' | 'list';

function ProjectMediaComponent({ projectId }: ProjectMediaProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
    const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [previewAsset, setPreviewAsset] = useState<AssetItem | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const toast = useToast();
    const { data: assetsData, isLoading: assetsLoading } = useAssets(projectId, {
        folder_id: currentFolderId,
    });
    const { data: foldersData, isLoading: foldersLoading } = useFolders(projectId, currentFolderId);
    const uploadMutation = useUploadAsset();
    const createFolderMutation = useCreateFolder();
    const deleteMutation = useDeleteAsset();

    const isLoading = assetsLoading || foldersLoading;
    const assets = (assetsData?.assets || []).map(toAssetItem);
    const folders = foldersData?.folders || [];
    const totalSize = assetsData?.assets?.reduce((acc, a) => acc + a.size_bytes, 0) || 0;

    const handleFilesSelected = async (files: File[]) => {
        for (const file of files) {
            try {
                await uploadMutation.mutateAsync({
                    projectId,
                    file,
                    options: currentFolderId ? { folder_id: currentFolderId } : undefined,
                });
                toast.success(`Uploaded ${file.name}`);
            } catch {
                toast.error(`Failed to upload ${file.name}`);
            }
        }
    };

    const handleAssetSelect = (asset: AssetItem, addToSelection?: boolean) => {
        if (addToSelection) {
            setSelectedAssets((prev) => {
                const next = new Set(prev);
                if (next.has(asset.id)) {
                    next.delete(asset.id);
                } else {
                    next.add(asset.id);
                }
                return next;
            });
        }
    };

    const handleSelectAllRows = () => {
        const allAssetIds = assets.map(a => a.id);
        const allSelected = allAssetIds.every(id => selectedAssets.has(id));
        if (allSelected) {
            setSelectedAssets(new Set());
        } else {
            setSelectedAssets(new Set(allAssetIds));
        }
    }

    const handleAssetClick = (asset: AssetItem) => {
        setPreviewAsset(asset);
    };

    const handleRowClick = (item: AssetRowItem) => {
        if (item.type === 'folder') {
            const folder = folders.find(f => f.id === item.data.id);
            if (folder) handleFolderClick(folder);
        } else {
            handleAssetClick(item.data);
        }
    };

    const handleRowSelect = (item: AssetRowItem, addToSelection?: boolean) => {
        if (item.type === 'asset') {
            handleAssetSelect(item.data, addToSelection);
        }
    };

    const handleDeleteSelected = async () => {
        const idsToDelete = Array.from(selectedAssets);
        try {
            for (const id of idsToDelete) {
                await deleteMutation.mutateAsync({ id });
            }
            toast.success(`Deleted ${idsToDelete.length} asset(s)`);
            setSelectedAssets(new Set());
        } catch {
            toast.error('Failed to delete some assets');
        }
        setShowDeleteConfirm(false);
    };

    const handleClearSelection = () => {
        setSelectedAssets(new Set());
    };

    const handleFolderClick = (folder: Folder) => {
        setCurrentFolderId(folder.id);
        setCurrentFolderName(folder.name);
        setSelectedAssets(new Set());
    };

    const handleBackToRoot = () => {
        setCurrentFolderId(undefined);
        setCurrentFolderName(null);
        setSelectedAssets(new Set());
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            await createFolderMutation.mutateAsync({
                projectId,
                name: newFolderName.trim(),
                parentId: currentFolderId,
            });
            toast.success(`Folder "${newFolderName}" created`);
            setShowNewFolderModal(false);
            setNewFolderName('');
        } catch {
            toast.error('Failed to create folder');
        }
    };

    if (isLoading) {
        return (
            <div className="project-media project-media--loading">
                <div className="project-media__header">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="project-media__grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            </div>
        );
    }

    const isEmpty = assets.length === 0 && folders.length === 0;

    return (
        <>
            <div className="project-media">
                <div className="project-media__header">
                    <div className="project-media__header-left">

                        <div className="project-team__stats">
                            <span className="project-team__stat project-team__stat--default">
                                <Icon name="image" size={12} />
                                {assets.length} file{assets.length !== 1 ? 's' : ''}
                            </span>
                            {folders.length > 0 && (
                                <span className="project-team__stat project-team__stat--info">
                                    <Icon name="folder-plus" size={12} />
                                    {folders.length} folder{folders.length !== 1 ? 's' : ''}
                                </span>
                            )}
                            {totalSize > 0 && (
                                <span className="project-team__stat project-team__stat--secondary">
                                    <Icon name="hard-drive" size={12} />
                                    {formatBytes(totalSize)}
                                </span>
                            )}
                        </div>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    {currentFolderName ? (
                                        <BreadcrumbLink
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleBackToRoot();
                                            }}
                                            className="flex items-center gap-1"
                                        >
                                            <Icon name="home" size={14} />
                                            Files
                                        </BreadcrumbLink>
                                    ) : (
                                        <BreadcrumbPage className="flex items-center gap-1">
                                            <Icon name="home" size={14} />
                                            Files
                                        </BreadcrumbPage>
                                    )}
                                </BreadcrumbItem>
                                {currentFolderName && (
                                    <>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>{currentFolderName}</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </>
                                )}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <div className="project-media__header-center">
                        {/* Placeholder for centering header content if needed in the future */}
                    </div>

                    <div className="project-media__header-actions">
                        <div className="project-media__view-toggle">
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                iconOnly
                                size="xs"
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                                leftIcon="grid"
                                iconSize={14}
                            />
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                iconOnly
                                size="xs"
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                                leftIcon="list"
                                iconSize={14}
                            />
                        </div>

                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setShowNewFolderModal(true)}
                            rightIcon="folder-plus"
                            iconSize={14}
                        >
                            New Folder
                        </Button>

                        <Button
                            variant="primary"
                            size="xs"
                            onClick={() => document.getElementById('project-file-input')?.click()}
                            loading={uploadMutation.isPending}
                            rightIcon="upload"
                            iconSize={14}
                        >
                            Upload
                        </Button>
                        {selectedAssets.size > 0 && (
                            <div className="project-media__selection-actions">
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={handleClearSelection}
                                >
                                    Clear
                                </Button>
                                <span className="project-media__selection-count">
                                    {selectedAssets.size}
                                </span>
                                <Button
                                    variant="danger"
                                    size="xs"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    rightIcon="trash"
                                    iconSize={14}
                                >
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>

                </div>

                <Input
                    id="project-file-input"
                    type="file"
                    multiple
                    accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                            handleFilesSelected(Array.from(files));
                            e.target.value = '';
                        }
                    }}
                />

                <div className="project-media__content">
                    {isEmpty ? (
                        <div>
                            <EmptyState
                                icon="folder"
                                title="No files or folders"
                                description="Upload files or create a folder to get started."
                                actions={
                                    <div className="w-full max-w-2xl mx-auto">
                                        <UploadZone
                                            onFilesSelected={handleFilesSelected}
                                            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                            disabled={uploadMutation.isPending}
                                        />
                                    </div>
                                }
                            />
                        </div>
                    ) : viewMode === 'grid' ? (
                        <>
                            {folders.length > 0 && (
                                <div className="project-media__folders">
                                    {folders.map((folder) => (
                                        <button
                                            key={folder.id}
                                            className="project-media__folder"
                                            onClick={() => handleFolderClick(folder)}
                                        >
                                            <Icon name="folder-plus" size={24} />
                                            <span className="project-media__folder-name">{folder.name}</span>
                                            <span className="project-media__folder-count">
                                                {folder.asset_count} item{folder.asset_count !== 1 ? 's' : ''}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {assets.length > 0 && (
                                <div className="project-media__grid">
                                    {assets.map((asset) => (
                                        <AssetCard
                                            key={asset.id}
                                            asset={asset}
                                            selected={selectedAssets.has(asset.id)}
                                            onSelect={handleAssetSelect}
                                            onClick={handleAssetClick}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <TableContainer className="asset-table">
                            <Table variant='transparent'>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            onClick={handleSelectAllRows}
                                        >
                                            <div className={`asset-table__checkbox ${assets.length > 0 && assets.every(a => selectedAssets.has(a.id)) ? 'asset-table__checkbox--checked' : ''}`}>
                                                {assets.length > 0 && assets.every(a => selectedAssets.has(a.id)) && <Icon name="check" size={12} />}
                                            </div>
                                        </TableHead>
                                        <TableHead style={{ width: 40 }} />
                                        <TableHead>Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {folders.map((folder) => (
                                        <AssetRow
                                            key={`folder-${folder.id}`}
                                            item={{
                                                type: 'folder',
                                                data: {
                                                    id: folder.id,
                                                    name: folder.name,
                                                    assetCount: folder.asset_count,
                                                    createdAt: folder.created_at,
                                                },
                                            }}
                                            onClick={handleRowClick}
                                            onSelect={handleRowSelect}
                                        />
                                    ))}
                                    {assets.map((asset) => (
                                        <AssetRow
                                            key={asset.id}
                                            item={{ type: 'asset', data: asset }}
                                            selected={selectedAssets.has(asset.id)}
                                            onClick={handleRowClick}
                                            onSelect={handleRowSelect}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                            {folders.length === 0 && assets.length === 0 && (
                                <div className="py-12">
                                    <EmptyState
                                        icon="image"
                                        title="No files yet"
                                        description="Upload files or create a folder to get started."
                                    />
                                </div>
                            )}
                        </TableContainer>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showNewFolderModal}
                onClose={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                }}
                title="Create Folder"
                titleIcon={<Icon name="folder-plus" size={20} />}
            >
                <Form onSubmit={handleCreateFolder}>
                    <ModalBody>
                        <FormGroup>
                            <FormLabel htmlFor="folderName">Folder Name</FormLabel>
                            <FormInput
                                type="text"
                                id="folderName"
                                placeholder="Enter folder name"
                                value={newFolderName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
                                required
                                autoFocus
                            />
                        </FormGroup>
                    </ModalBody>
                    <FormActions className="modal__footer">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setShowNewFolderModal(false);
                                setNewFolderName('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createFolderMutation.isPending || !newFolderName.trim()}
                            loading={createFolderMutation.isPending}
                        >
                            Create
                        </Button>
                    </FormActions>
                </Form>
            </Modal>

            <AssetPreviewDialog
                asset={previewAsset}
                open={!!previewAsset}
                onClose={() => setPreviewAsset(null)}
            />

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Assets</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeleteSelected}
                            loading={deleteMutation.isPending}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export const ProjectMedia = memo(ProjectMediaComponent);
