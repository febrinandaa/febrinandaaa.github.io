import { NextResponse } from 'next/server';
import { supabase, TABLES } from '@/lib/supabase';
import { FANPAGES } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stockCounts: Record<string, number> = {};

        // 1. Get Stock Configuration
        const { data: configData } = await supabase
            .from(TABLES.SETTINGS)
            .select('value')
            .eq('key', 'stockConfig')
            .single();

        const config = configData?.value || { interval: 1, duration: 30 };

        // Calculate Target
        const activeHours = 17;
        const postsPerDay = Math.ceil(activeHours / (config?.interval || 1));
        const target = Math.ceil(postsPerDay * (config?.duration || 30) * 1.25);

        // 2. Fetch counts for each fanpage concurrently
        const promises = FANPAGES.map(async (page) => {
            const { count } = await supabase
                .from(TABLES.CONTENT)
                .select('*', { count: 'exact', head: true })
                .eq('page_id', page.id)
                .eq('used_count', 0);

            return { id: page.id, count: count || 0 };
        });

        const results = await Promise.all(promises);
        results.forEach(r => {
            stockCounts[r.id] = r.count;
        });

        return NextResponse.json({
            stock: stockCounts,
            target: target,
            config: config
        });

    } catch (error) {
        console.error('Stock check error:', error);
        return NextResponse.json({ error: 'Failed to check stock' }, { status: 500 });
    }
}
