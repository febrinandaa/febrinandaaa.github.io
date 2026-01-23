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
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
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
        } catch (error: any) {
            lastError = error;
            console.error(`Gemini API error (attempt ${attempt + 1}/${maxRetries}):`, error.message);

            // If rate limited, wait longer before retry
            if (error.message?.includes('429') || error.message?.includes('rate')) {
                const waitTime = (attempt + 1) * 10000; // 10s, 20s, 30s
                console.log(`Rate limited, waiting ${waitTime / 1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                // For other errors, wait less
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    throw lastError || new Error('Failed to generate caption after retries');
}
