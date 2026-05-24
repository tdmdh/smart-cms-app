'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, Loader2, Sparkles } from 'lucide-react';
import { knowledgeApi, KnowledgeDoc } from '@/src/api/knowledge';
import { useKnowledgeDocs, useUploadKnowledgeDoc, useLivingDoc, useSearchKnowledge } from '@/src/hooks/queries/knowledge';
import { DocumentArchetype } from '@/src/api/knowledge/archetypes';
import { useArchetypes } from '@/src/hooks/queries/knowledge/archetypes';
import { useAiTaskTracker } from '@/src/hooks/useAiTaskTracker';
import { KnowledgeFilterBar } from './SourceTypeFilter';
import KnowledgeDocCard from './KnowledgeDocCard';
import LivingDocCard from './LivingDocCard';
import AiTaskIndicator from './AiTaskIndicator';
import ArchetypeManager from './archetypes/ArchetypeManager';
import ArchetypeFormPanel from './archetypes/ArchetypeFormPanel';
import { EmptyState, Input, Button, Modal, ModalBody } from '../shared/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsHeader } from '../shared/ui/Tabs';

interface KnowledgeBaseProps {
  projectId: string;
}

const ACCEPTED = '.pdf,.docx,.pptx,.txt,.md';
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const PAGE_SIZE = 20;

export default function KnowledgeBase({ projectId }: KnowledgeBaseProps) {
  const [activeTab, setActiveTab] = useState('knowledge-docs');
  const [sourceType, setSourceType] = useState('');
  const [status, setStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [extraDocs, setExtraDocs] = useState<KnowledgeDoc[]>([]);
  const [loadMoreCursor, setLoadMoreCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [archetypeModalOpen, setArchetypeModalOpen] = useState(false);
  const [editingArchetype, setEditingArchetype] = useState<DocumentArchetype | null>(null);

  const { tasks, addTask } = useAiTaskTracker(projectId);
  const { data: archetypes = [] } = useArchetypes(projectId);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setExtraDocs([]);
    setLoadMoreCursor(null);
    setHasMore(false);
  }, [sourceType, status]);

  const { data, isLoading } = useKnowledgeDocs(projectId, {
    source_type: sourceType || undefined,
    status: status || undefined,
  });

  useEffect(() => {
    if (!data?.docs) return;
    const docs = data.docs;
    setHasMore(docs.length >= PAGE_SIZE);
    setLoadMoreCursor(docs.length > 0 ? docs[docs.length - 1].updated_at : null);
  }, [data]);

  const { data: livingDoc } = useLivingDoc(projectId);
  const { data: searchData, isFetching: isSearching } = useSearchKnowledge(projectId, debouncedQuery);
  const upload = useUploadKnowledgeDoc(projectId);

  const handleFile = useCallback((file: File) => {
    setUploadError('');
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(`"${file.name}" exceeds the 10 MB limit.`);
      return;
    }
    upload.mutate(
      { file },
      {
        onSuccess: () => addTask({
          id: `doc-gen-${Date.now()}`,
          type: 'doc_gen',
          label: 'Generating knowledge document…',
        }),
      },
    );
  }, [upload, addTask]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(handleFile);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(handleFile);
    e.target.value = '';
  };

  const handlePublish = useCallback(() => {
    addTask({
      id: `living-doc-${Date.now()}`,
      type: 'living_doc',
      label: 'Updating living document…',
    });
  }, [addTask]);

  const handleLoadMore = useCallback(async () => {
    if (!loadMoreCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await knowledgeApi.list(projectId, {
        source_type: sourceType || undefined,
        status: status || undefined,
        before: loadMoreCursor,
        limit: PAGE_SIZE,
      });
      setExtraDocs((prev) => {
        const existingIds = new Set(prev.map((d) => d.id));
        return [...prev, ...result.docs.filter((d) => !existingIds.has(d.id))];
      });
      setHasMore(result.docs.length >= PAGE_SIZE);
      if (result.docs.length > 0) {
        setLoadMoreCursor(result.docs[result.docs.length - 1].updated_at);
      }
    } catch {
      // Silent fail — user can retry
    } finally {
      setIsLoadingMore(false);
    }
  }, [loadMoreCursor, isLoadingMore, projectId, sourceType, status]);

  const openCreateArchetype = () => {
    setEditingArchetype(null);
    setArchetypeModalOpen(true);
  };

  const handleArchetypeModalDone = (createdId?: string) => {
    if (createdId) setActiveTab(createdId);
    setArchetypeModalOpen(false);
    setEditingArchetype(null);
  };

  const handleArchetypeDeleted = useCallback(() => {
    const remaining = archetypes.filter((a) => a.id !== activeTab);
    setActiveTab(remaining[0]?.id ?? 'knowledge-docs');
  }, [archetypes, activeTab]);

  const isArchetypeTab = archetypes.some((a) => a.id === activeTab);

  const firstPageDocs = data?.docs ?? [];
  const firstPageIds = new Set(firstPageDocs.map((d) => d.id));
  const allDocs = [...firstPageDocs, ...extraDocs.filter((d) => !firstPageIds.has(d.id))];
  const draftCount = allDocs.filter((d) => d.status === 'draft').length;
  const isSearchActive = debouncedQuery.length > 1;
  const searchResults = searchData?.results?.map((r) => r.doc) ?? [];

  return (
    <div className="knowledge-base">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="knowledge-base__tabs"
      >
        <TabsHeader
          layout="row"
          topContent={
            <TabsList className="tabs-nav">
              <TabsTrigger
                value="living-doc"
                className="tabs-nav__link"
                showIndicator={activeTab === 'living-doc'}
                indicatorLayoutId="knowledge-tab-indicator"
                indicatorTransition={{ type: 'spring', stiffness: 500, damping: 35 }}
              >
                <Sparkles size={16} className="tabs-nav__foreground" />
                <span className="tabs-nav__label tabs-nav__foreground">Living Document</span>
              </TabsTrigger>
              <TabsTrigger
                value="knowledge-docs"
                className="tabs-nav__link"
                badge={allDocs.length > 0 ? allDocs.length : undefined}
                showIndicator={activeTab === 'knowledge-docs'}
                indicatorLayoutId="knowledge-tab-indicator"
                indicatorTransition={{ type: 'spring', stiffness: 500, damping: 35 }}
              >
                <span className="tabs-nav__label tabs-nav__foreground">Knowledge Docs</span>
              </TabsTrigger>
              {archetypes.map((a) => (
                <TabsTrigger
                  key={a.id}
                  value={a.id}
                  className="tabs-nav__link"
                  showIndicator={activeTab === a.id}
                  indicatorLayoutId="knowledge-tab-indicator"
                  indicatorTransition={{ type: 'spring', stiffness: 500, damping: 35 }}
                >
                  <span className="tabs-nav__label tabs-nav__foreground">{a.name}</span>
                </TabsTrigger>
              ))}
              <Button
                variant="ghost"
                size="xs"
                iconOnly
                leftIcon="plus"
                iconSize={14}
                onClick={openCreateArchetype}
                aria-label="New archetype"
              />
            </TabsList>
          }
          actions={
            activeTab === 'knowledge-docs' ? (
              <div className="knowledge-base__tab-actions">
                {!isSearchActive && (
                  <KnowledgeFilterBar
                    projectId={projectId}
                    sourceType={sourceType}
                    status={status}
                    onSourceChange={setSourceType}
                    onStatusChange={setStatus}
                  />
                )}
                <label
                  className={`knowledge-base__upload-zone ${dragOver ? 'knowledge-base__upload-zone--active' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' &&
                    (e.currentTarget.querySelector('input') as HTMLInputElement)?.click()}
                >
                  <input
                    type="file"
                    accept={ACCEPTED}
                    multiple
                    className="sr-only"
                    onChange={handleInputChange}
                    disabled={upload.isPending}
                  />
                  {upload.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processing…</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Upload</span>
                    </>
                  )}
                </label>
              </div>
            ) : undefined
          }
          statusContent={<AiTaskIndicator tasks={tasks} />}
        >
          {activeTab === 'knowledge-docs' && (
            <div className="knowledge-base__search">
              <Input
                type="search"
                placeholder="Search knowledge…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search knowledge base"
                iconSize={15}
                leftIcon='search'
              />
            </div>
          )}
        </TabsHeader>

        {/* ── Living Document tab ─────────────────────────── */}
        <TabsContent value="living-doc" transparant>
          {livingDoc ? (
            <LivingDocCard doc={livingDoc} />
          ) : (
            <div className="knowledge-base__living-empty">
              <Sparkles size={14} />
              <span>AI will create a living summary automatically after the first knowledge event.</span>
            </div>
          )}
        </TabsContent>

        {/* ── Knowledge Docs tab ──────────────────────────── */}
        <TabsContent value="knowledge-docs" transparant>
          {uploadError && (
            <div className="knowledge-base__upload-error">{uploadError}</div>
          )}

          {draftCount > 0 && !isSearchActive && (
            <div className="knowledge-base__draft-banner">
              {draftCount} draft{draftCount > 1 ? 's' : ''} awaiting review
            </div>
          )}

          {isSearchActive ? (
            <>
              {isSearching && (
                <div className="knowledge-base__loading">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              )}
              {!isSearching && searchResults.length === 0 && (
                <div className="knowledge-base__empty">
                  <EmptyState
                    icon={'search'}
                    title="No results"
                    description={`No published documents match "${debouncedQuery}"`}
                    color='default'
                  />
                </div>
              )}
              <div>
                {searchResults.map((doc) => (
                  <KnowledgeDocCard key={doc.id} doc={doc} projectId={projectId} canReview={false} />
                ))}
              </div>
            </>
          ) : (
            <>
              {isLoading && (
                <div className="knowledge-base__loading">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              )}

              {!isLoading && allDocs.length === 0 && (
                <div className="knowledge-base__empty">
                  <EmptyState
                    icon={'book-open'}
                    title="No knowledge documents"
                    description="Upload a file or push a commit — drafts appear here automatically"
                    color='default'
                  />
                </div>
              )}

              <div>
                {allDocs.map((doc) => (
                  <KnowledgeDocCard
                    key={doc.id}
                    doc={doc}
                    projectId={projectId}
                    canReview
                    onPublish={handlePublish}
                    archetypeName={doc.archetype_id ? archetypes.find((a) => a.id === doc.archetype_id)?.name : undefined}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="knowledge-base__load-more">
                  <button
                    className="knowledge-base__load-more-btn"
                    onClick={() => void handleLoadMore()}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <><Loader2 size={14} className="animate-spin" /> Loading…</>
                    ) : (
                      'Load more'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Per-archetype tabs ──────────────────────────── */}
        {archetypes.map((a) => (
          <TabsContent key={a.id} value={a.id} transparant>
            <ArchetypeManager
              projectId={projectId}
              archetype={a}
              onEdit={() => { setEditingArchetype(a); setArchetypeModalOpen(true); }}
              onDeleted={handleArchetypeDeleted}
            />
          </TabsContent>
        ))}

        {/* Empty archetypes prompt — shown when no archetypes exist and tab list "+ " is clicked */}
        {archetypes.length === 0 && isArchetypeTab && (
          <TabsContent value={activeTab} transparant>
            <EmptyState
              icon="file-text"
              title="No archetypes yet"
              description="Define document types to guide the AI's output structure and focus."
              color="default"
              cta={{ label: 'New Archetype', onClick: openCreateArchetype }}
            />
          </TabsContent>
        )}
      </Tabs>

      <Modal
        isOpen={archetypeModalOpen}
        onClose={() => { setArchetypeModalOpen(false); setEditingArchetype(null); }}
        title={editingArchetype ? 'Edit archetype' : 'New archetype'}
        size="default"
      >
        <ModalBody>
          <ArchetypeFormPanel
            projectId={projectId}
            editing={editingArchetype}
            onDone={handleArchetypeModalDone}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}
