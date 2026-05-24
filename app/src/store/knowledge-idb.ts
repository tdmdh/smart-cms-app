import { getIndexedDb } from './indexedDb';
import { knowledgeApi, KnowledgeDoc } from '@/src/api/knowledge';

const STORE = 'knowledge-docs';
const cursorKey = (projectId: string) => `${projectId}:__cursor__`;
const docKey = (projectId: string, docId: string) => `${projectId}:${docId}`;

export async function syncKnowledgeIDB(projectId: string): Promise<void> {
    const db = await getIndexedDb();
    const since = (await db.get<string>(STORE, cursorKey(projectId))) ?? '';
    const { docs, next_cursor } = await knowledgeApi.list(projectId, { since, limit: 200 });
    for (const doc of docs) {
        await db.put(STORE, doc, docKey(projectId, doc.id));
    }
    if (next_cursor) {
        await db.put(STORE, next_cursor, cursorKey(projectId));
    }
}

export async function readAllForProject(projectId: string): Promise<KnowledgeDoc[]> {
    const db = await getIndexedDb();
    // Use key-range prefix scan instead of loading every project's docs.
    // Keys are stored as `${projectId}:${docId}`, so bounding on the prefix
    // gives O(matching docs) rather than O(all docs in IDB).
    const lower = `${projectId}:`;
    const upper = `${projectId}:￿`;
    const all = await db.getAll<KnowledgeDoc>(STORE, IDBKeyRange.bound(lower, upper));
    return all.filter((d): d is KnowledgeDoc => !!d && typeof d === 'object' && 'project_id' in d);
}

export async function upsertDocIDB(projectId: string, doc: KnowledgeDoc): Promise<void> {
    const db = await getIndexedDb();
    await db.put(STORE, doc, docKey(projectId, doc.id));
}

export async function deleteDocIDB(projectId: string, docId: string): Promise<void> {
    const db = await getIndexedDb();
    await db.delete(STORE, docKey(projectId, docId));
}
