// SSR-safe IndexedDB wrapper — returns a noop on the server, the real IDB on the client.
// Usage: const db = getIndexedDb(); await db.get(storeName, key);

export interface IndexedDbStore {
    get<T = unknown>(store: string, key: IDBValidKey): Promise<T | undefined>;
    getAll<T = unknown>(store: string, query?: IDBValidKey | IDBKeyRange): Promise<T[]>;
    put<T = unknown>(store: string, value: T, key?: IDBValidKey): Promise<IDBValidKey>;
    delete(store: string, key: IDBValidKey): Promise<void>;
    clear(store: string): Promise<void>;
}

const noopStore: IndexedDbStore = {
    get: async () => undefined,
    getAll: async () => [],
    put: async (_store, _value, key) => key ?? '',
    delete: async () => undefined,
    clear: async () => undefined,
};


function openDb(name: string, version: number, stores: string[]): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(name, version);
        req.onupgradeneeded = () => {
            for (const store of stores) {
                if (!req.result.objectStoreNames.contains(store)) {
                    req.result.createObjectStore(store);
                }
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function wrapDb(db: IDBDatabase): IndexedDbStore {
    const tx = (store: string, mode: IDBTransactionMode) =>
        db.transaction(store, mode).objectStore(store);

    const promisify = <T>(req: IDBRequest<T>): Promise<T> =>
        new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

    return {
        get: (store, key) => promisify(tx(store, 'readonly').get(key)),
        getAll: (store, query?) => promisify(tx(store, 'readonly').getAll(query)),
        put: (store, value, key) => promisify(tx(store, 'readwrite').put(value, key)),
        delete: (store, key) => promisify(tx(store, 'readwrite').delete(key)),
        clear: (store) => promisify(tx(store, 'readwrite').clear()),
    };
}

const DB_NAME = 'noname-cms';
const DB_VERSION = 1;
const STORES = ['knowledge-docs'];

let dbPromise: Promise<IndexedDbStore> | null = null;

export function getIndexedDb(): Promise<IndexedDbStore> {
    if (typeof window === 'undefined') {
        return Promise.resolve(noopStore);
    }
    if (!dbPromise) {
        dbPromise = openDb(DB_NAME, DB_VERSION, STORES).then(wrapDb);
    }
    return dbPromise;
}
