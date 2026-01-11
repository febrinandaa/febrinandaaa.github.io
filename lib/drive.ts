import { google } from 'googleapis';
import { Readable } from 'stream';

const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

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

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
    });

    return response.data.id || '';
}

export async function getOrCreateFolder(
    parentFolderId: string,
    folderName: string
): Promise<string> {
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
    });

    return folder.data.id || '';
}

export async function downloadFromDrive(fileId: string): Promise<Buffer> {
    const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
}
