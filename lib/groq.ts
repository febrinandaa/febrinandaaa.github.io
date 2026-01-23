import Groq from 'groq-sdk';

// Key rotation state
let currentKeyIndex = 0;
let clients: Groq[] = [];
let rateLimitedKeys: Set<number> = new Set();
let rateLimitResetTime: Map<number, number> = new Map();

function initializeClients(): void {
    if (clients.length > 0) return;

    const keys = [
        process.env.GROQ_API_KEY,
        process.env.GROQ_API_KEY_2,
    ].filter(Boolean) as string[];

    if (keys.length === 0) {
        throw new Error('No GROQ_API_KEY environment variables set');
    }

    clients = keys.map(apiKey => new Groq({ apiKey }));
    console.log(`[GROQ] Initialized ${clients.length} API key(s) for rotation`);
}

function getNextClient(): { client: Groq; keyIndex: number } {
    initializeClients();

    // Clean up expired rate limits (reset after 1 minute)
    const now = Date.now();
    rateLimitedKeys.forEach(index => {
        const resetTime = rateLimitResetTime.get(index) || 0;
        if (now > resetTime) {
            rateLimitedKeys.delete(index);
            rateLimitResetTime.delete(index);
            console.log(`[GROQ] Key ${index + 1} rate limit cleared`);
        }
    });

    // Find available key
    for (let i = 0; i < clients.length; i++) {
        const tryIndex = (currentKeyIndex + i) % clients.length;
        if (!rateLimitedKeys.has(tryIndex)) {
            currentKeyIndex = tryIndex;
            return { client: clients[tryIndex], keyIndex: tryIndex };
        }
    }

    // All keys rate limited - use the one with soonest reset
    let earliestReset = Infinity;
    let bestIndex = 0;
    rateLimitResetTime.forEach((time, index) => {
        if (time < earliestReset) {
            earliestReset = time;
            bestIndex = index;
        }
    });

    console.log(`[GROQ] All keys rate limited, using key ${bestIndex + 1}`);
    return { client: clients[bestIndex], keyIndex: bestIndex };
}

function markKeyRateLimited(keyIndex: number): void {
    rateLimitedKeys.add(keyIndex);
    rateLimitResetTime.set(keyIndex, Date.now() + 60000); // Reset after 1 minute
    console.log(`[GROQ] Key ${keyIndex + 1} marked as rate limited`);
}

export const CAPTION_PROMPT = `You are a social media copywriter.
This image contains a quote.

Write a short Facebook caption (2–4 lines)
that reflects the meaning of the quote in the image.

Rules:
- Indonesian language
- No emojis
- No hashtags
- No selling
- Soft, reflective tone

Just output the caption directly, no explanation.`;

export async function generateCaption(imageBase64: string, mimeType: string): Promise<string> {
    const maxRetries = 3;
    let lastError: any;
    let attemptedKeys = new Set<number>();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const { client: groq, keyIndex } = getNextClient();

        try {
            const completion = await groq.chat.completions.create({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: CAPTION_PROMPT },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 300,
                temperature: 0.7,
            });

            return completion.choices[0]?.message?.content || '';

        } catch (error: any) {
            lastError = error;
            console.error(`[GROQ] Key ${keyIndex + 1} error (attempt ${attempt + 1}):`, error.message);

            // If rate limited, mark key and try next
            if (error.status === 429 || error.message?.includes('rate')) {
                markKeyRateLimited(keyIndex);
                attemptedKeys.add(keyIndex);

                // If we haven't tried all keys yet, immediately try next
                if (attemptedKeys.size < clients.length) {
                    continue;
                }

                // All keys tried and rate limited, wait before retry
                const waitTime = (attempt + 1) * 5000;
                console.log(`[GROQ] All keys rate limited, waiting ${waitTime / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                // Non-rate-limit error, short wait
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    throw lastError || new Error('Failed to generate caption after retries');
}
