import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization for Supabase
let _client: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!_client) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase environment variables');
        }

        _client = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    return _client;
}

// Export getter function
export const supabase = {
    from: (table: string) => getSupabase().from(table),
};

// Table names
export const TABLES = {
    PAGES: 'pages',
    CONTENT: 'content',
    POSTING_LOGS: 'posting_logs',
    CRON_RUNS: 'cron_runs',
    SETTINGS: 'settings'
} as const;

// Helper to check if system is enabled
export async function isSystemEnabled(): Promise<boolean> {
    try {
        const { data } = await getSupabase()
            .from(TABLES.SETTINGS)
            .select('value')
            .eq('key', 'systemEnabled')
            .single();

        return data?.value?.enabled ?? true;
    } catch {
        return true;
    }
}

// Types
export interface Page {
    id: string;
    name: string;
    fb_page_id: string | null;
    access_token: string | null;
    created_at: string;
}

export interface Content {
    id: string;
    page_id: string;
    file_name: string;
    cloudinary_url: string | null;
    cloudinary_public_id: string | null;
    base_caption: string;
    used_count: number;
    last_used_at: string | null;
    created_at: string;
}
