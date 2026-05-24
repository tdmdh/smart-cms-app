'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWorkspacePath } from '@/src/hooks/useWorkspacePath';
import { motion } from 'framer-motion';
import {
    Building2,
    Globe,
    Briefcase,
    FolderKanban,
    Users,
    Settings,
    ArrowLeft,
    Edit,
    Trash2
} from 'lucide-react';
import { useClient, useDeleteClient } from '@/src/hooks/queries/client-management';
import { ClientMembersSection } from './ClientMembersSection';

interface ClientDetailProps {
    clientId: string;
}

type TabType = 'overview' | 'projects' | 'members' | 'settings';

function ClientDetailComponent({ clientId }: ClientDetailProps) {
    const router = useRouter();
    const workspacePath = useWorkspacePath();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data, isLoading, isError } = useClient(clientId);
    const deleteMutation = useDeleteClient();

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(clientId);
            router.push(workspacePath('clients'));
        } catch (error) {
            console.error('Failed to delete client:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="client-detail">
                <div className="client-detail__loading">
                    <div className="skeleton skeleton--header" />
                    <div className="skeleton skeleton--content" />
                </div>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="client-detail">
                <div className="client-detail__error">
                    <p>Failed to load client details</p>
                    <Link href={workspacePath('clients')} className="btn btn--ghost">
                        Back to Clients
                    </Link>
                </div>
            </div>
        );
    }

    const client = data as any;

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'overview', label: 'Overview', icon: <Building2 size={18} /> },
        { id: 'projects', label: 'Projects', icon: <FolderKanban size={18} /> },
        { id: 'members', label: 'Members', icon: <Users size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    ];

    return (
        <motion.div
            className="client-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className="client-detail__nav">
                <Link href={workspacePath('clients')} className="client-detail__back">
                    <ArrowLeft size={18} />
                    Back to Clients
                </Link>
            </div>

            <header className="client-detail__header">
                <div className="client-detail__avatar">
                    {client.logo ? (
                        <img src={client.logo} alt={client.name} />
                    ) : (
                        <span>{client.name?.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div className="client-detail__info">
                    <h1 className="client-detail__name">{client.name}</h1>
                    {client.description && (
                        <p className="client-detail__description">{client.description}</p>
                    )}
                    <div className="client-detail__meta">
                        {client.website && (
                            <a
                                href={client.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="client-detail__meta-item"
                            >
                                <Globe size={14} />
                                {client.website}
                            </a>
                        )}
                        {client.industry && (
                            <span className="client-detail__meta-item">
                                <Briefcase size={14} />
                                {client.industry}
                            </span>
                        )}
                    </div>
                </div>
                <div className="client-detail__actions">
                    <Link
                        href={workspacePath(`clients/${clientId}/edit`)}
                        className="btn btn--ghost"
                    >
                        <Edit size={16} />
                        Edit
                    </Link>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="btn btn--ghost btn--danger"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                </div>
            </header>

            <nav className="client-detail__tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`client-detail__tab ${activeTab === tab.id ? 'client-detail__tab--active' : ''}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div className="client-detail__content">
                {activeTab === 'overview' && (
                    <div className="client-detail__overview">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <FolderKanban size={24} />
                                <div className="stat-card__value">{client.total_projects || 0}</div>
                                <div className="stat-card__label">Projects</div>
                            </div>
                            <div className="stat-card">
                                <Users size={24} />
                                <div className="stat-card__value">{client.total_members || 0}</div>
                                <div className="stat-card__label">Members</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div className="client-detail__projects">
                        <p>Projects for this client will be listed here.</p>
                    </div>
                )}

                {activeTab === 'members' && (
                    <ClientMembersSection clientId={clientId} />
                )}

                {activeTab === 'settings' && (
                    <div className="client-detail__settings">
                        <p>Client settings and configuration options.</p>
                    </div>
                )}
            </div>

            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal__title">Delete Client</h3>
                        <p className="modal__message">
                            Are you sure you want to delete "{client.name}"? This action cannot be undone.
                        </p>
                        <div className="modal__actions">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="btn btn--ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="btn btn--danger"
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

export const ClientDetail = memo(ClientDetailComponent);
