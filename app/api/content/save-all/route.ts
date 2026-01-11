import { NextRequest, NextResponse } from 'next/server';
import { uploadToDrive, getOrCreateFolder, DRIVE_FOLDER_ID } from '@/lib/drive';
import { getDb, COLLECTIONS } from '@/lib/firestore';
import { nowWIB } from '@/lib/dayjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const pageId = formData.get('pageId') as string;
        const files = formData.getAll('files') as File[];
        const captions = formData.getAll('captions') as string[];

        if (!pageId || files.length === 0) {
            return NextResponse.json(
                { error: 'Missing pageId or files' },
                { status: 400 }
            );
        }

        const db = getDb();

        // Get or create folder for this page
        const pageFolderId = await getOrCreateFolder(DRIVE_FOLDER_ID, pageId);
        const imagesFolderId = await getOrCreateFolder(pageFolderId, 'images');

        const results = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const caption = captions[i] || '';

            // Generate unique filename
            const timestamp = Date.now();
            const ext = file.name.split('.').pop() || 'jpg';
            const fileName = `${pageId}_${timestamp}_${i}.${ext}`;

            // Upload to Drive
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const driveFileId = await uploadToDrive(
                buffer,
                fileName,
                file.type,
                imagesFolderId
            );

            // Save to Firestore
            const contentData = {
                page_id: pageId,
                drive_file_id: driveFileId,
                file_name: fileName,
                base_caption: caption,
                generated_by_ai: true,
                edited_by_user: false,
                used_count: 0,
                created_at: nowWIB().toISOString(),
            };

            const docRef = await db
                .collection(COLLECTIONS.CONTENT)
                .add(contentData);

            results.push({
                id: docRef.id,
                driveFileId,
                fileName,
            });
        }

        return NextResponse.json({
            success: true,
            count: results.length,
            items: results,
        });
    } catch (error) {
        console.error('Save all error:', error);
        return NextResponse.json(
            { error: 'Failed to save content' },
            { status: 500 }
        );
    }
}
