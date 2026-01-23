import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}';
        const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

        const parsed = JSON.parse(rawKey);

        const auth = new google.auth.GoogleAuth({
            credentials: parsed,
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const drive = google.drive({ version: 'v3', auth });

        // Try to list files in the folder
        const response = await drive.files.list({
            q: `'${folderId}' in parents`,
            fields: 'files(id, name)',
        });

        return NextResponse.json({
            success: true,
            folder_id: folderId,
            files_count: response.data.files?.length || 0,
            files: response.data.files,
            service_account_email: parsed.client_email,
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
            folder_id: process.env.GOOGLE_DRIVE_FOLDER_ID || 'NOT_SET',
        }, { status: 500 });
    }
}
