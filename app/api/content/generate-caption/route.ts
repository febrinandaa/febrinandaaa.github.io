import { NextRequest, NextResponse } from 'next/server';
import { generateCaption } from '@/lib/groq';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');

        // Generate caption using Gemini
        const caption = await generateCaption(base64, image.type);

        return NextResponse.json({ caption });
    } catch (error) {
        console.error('Caption generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate caption' },
            { status: 500 }
        );
    }
}
