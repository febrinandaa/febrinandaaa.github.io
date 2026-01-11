import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App | null = null;
let db: Firestore | null = null;

function getFirebaseAdmin(): { app: App; db: Firestore } {
    if (!db) {
        if (getApps().length === 0) {
            const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

            if (!serviceAccountKey) {
                throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');
            }

            const serviceAccount = JSON.parse(serviceAccountKey);

            app = initializeApp({
                credential: cert(serviceAccount),
            });
        } else {
            app = getApps()[0];
        }

        db = getFirestore(app!);
    }

    return { app: app!, db };
}

// Lazy getter for firestore
export function getDb(): Firestore {
    return getFirebaseAdmin().db;
}

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
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.SETTINGS).doc('system').get();
    if (!doc.exists) return true;
    return doc.data()?.enabled !== false;
}

// Lock Management
export async function acquireLock(pageId: string, hour: string): Promise<boolean> {
    const db = getDb();
    const lockId = `${new Date().toISOString().split('T')[0]}-${hour}-${pageId}`;
    const lockRef = db.collection(COLLECTIONS.LOCKS).doc(lockId);

    try {
        await db.runTransaction(async (transaction) => {
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
