import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

// Lazy initialization for Google Drive
let _drive: drive_v3.Drive | null = null;

function getDrive(): drive_v3.Drive {
    if (!_drive) {
        // Get service account credentials
        const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}';
        const credentials = JSON.parse(rawKey);

        // User email to impersonate (uses their storage quota)
        // This requires Domain-Wide Delegation to be enabled for the service account
        const impersonateUser = process.env.GOOGLE_DRIVE_USER_EMAIL || '';

        const authConfig: any = {
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive'],
        };

        // If user email is set, impersonate that user to use their quota
        if (impersonateUser) {
            authConfig.clientOptions = {
                subject: impersonateUser,
            };
        }

        const auth = new google.auth.GoogleAuth(authConfig);

        _drive = google.drive({ version: 'v3', auth });
    }
    return _drive;
}

export const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

export async function uploadToDrive(
    file: Buffer,
    fileName: string,
    mimeType: string,
    folderId: string
): Promise<string> {
    const fileMetadata = {
        name: fileName,
        parents: [folderId],
    };

    const media = {
        mimeType: mimeType,
        body: Readable.from(file),
    };

    const response = await getDrive().files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
        supportsAllDrives: true,
    });

    return response.data.id || '';
}

export async function getOrCreateFolder(
    parentFolderId: string,
    folderName: string
): Promise<string> {
    const drive = getDrive();

    // Check if folder exists
    const response = await drive.files.list({
        q: `'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
    });

    if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id || '';
    }

    // Create folder
    const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
    };

    const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
        supportsAllDrives: true,
    });

    return folder.data.id || '';
}

export async function downloadFromDrive(fileId: string): Promise<Buffer> {
    const response = await getDrive().files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
}
