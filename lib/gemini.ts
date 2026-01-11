import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-flash-latest'
});

export const CAPTION_PROMPT = `You are a social media copywriter.
This image contains a quote.

Write a short Facebook caption (2–4 lines)
that reflects the meaning of the quote in the image.

Rules:
- Indonesian language
- No emojis
- No hashtags
- No selling
- Soft, reflective tone`;

export async function generateCaption(imageBase64: string, mimeType: string): Promise<string> {
    const result = await geminiModel.generateContent([
        CAPTION_PROMPT,
        {
            inlineData: {
                data: imageBase64,
                mimeType: mimeType,
            },
        },
    ]);

    const response = result.response;
    return response.text();
}
