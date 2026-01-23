import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const googleKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '';
    const firebaseKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';

    let googleKeyId = 'EMPTY';
    let firebaseKeyId = 'EMPTY';

    try {
        if (googleKey) {
            const parsed = JSON.parse(googleKey);
            googleKeyId = parsed.private_key_id || 'NO_KEY_ID';
        }
    } catch (e: any) {
        googleKeyId = `PARSE_ERROR: ${e.message}`;
    }

    try {
        if (firebaseKey) {
            const parsed = JSON.parse(firebaseKey);
            firebaseKeyId = parsed.private_key_id || 'NO_KEY_ID';
        }
    } catch (e: any) {
        firebaseKeyId = `PARSE_ERROR: ${e.message}`;
    }

    return NextResponse.json({
        google_key_id: googleKeyId.substring(0, 12) + '...',
        firebase_key_id: firebaseKeyId.substring(0, 12) + '...',
        has_google_key: googleKey.length > 0,
        has_firebase_key: firebaseKey.length > 0,
        drive_folder_id: (process.env.GOOGLE_DRIVE_FOLDER_ID || '').substring(0, 12) + '...',
    });
}
