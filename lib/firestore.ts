import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Lazy initialization - only create instance when first accessed
let _db: Firestore | null = null;

function getFirebaseAdmin(): { app: App; db: Firestore } {
    let app: App;

    if (getApps().length === 0) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountKey) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');
        }

        // Fix newlines in private_key that may be corrupted by env var storage
        const serviceAccount = JSON.parse(serviceAccountKey);

        app = initializeApp({
            credential: cert(serviceAccount),
        });
    } else {
        app = getApps()[0];
    }

    const db = getFirestore(app);
    return { app, db };
}

// Lazy getter for db - only initialize on first access at runtime, not build time
export function getDb(): Firestore {
    if (!_db) {
        _db = getFirebaseAdmin().db;
    }
    return _db;
}

// For backward compatibility - export as getter
export const db = new Proxy({} as Firestore, {
    get(_, prop) {
        return Reflect.get(getDb(), prop);
    }
});

// Collections
export const COLLECTIONS = {
    CONTENT: 'content',
    PAGES: 'pages',
    SETTINGS: 'settings',
    LOCKS: 'locks',
    LOGS: 'logs',
};

// Kill Switch
export async function isSystemEnabled(): Promise<boolean> {
    const doc = await getDb().collection(COLLECTIONS.SETTINGS).doc('system').get();
    if (!doc.exists) return true;
    return doc.data()?.enabled !== false;
}

// Lock Management
export async function acquireLock(pageId: string, hour: string): Promise<boolean> {
    const lockId = `${new Date().toISOString().split('T')[0]}-${hour}-${pageId}`;
    const lockRef = getDb().collection(COLLECTIONS.LOCKS).doc(lockId);

    try {
        await getDb().runTransaction(async (transaction) => {
            const lockDoc = await transaction.get(lockRef);
            if (lockDoc.exists) {
                throw new Error('Lock already exists');
            }
            transaction.create(lockRef, {
                pageId,
                hour,
                createdAt: new Date(),
            });
        });
        return true;
    } catch {
        return false;
    }
}
