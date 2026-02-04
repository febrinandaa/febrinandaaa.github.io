-- ============================================
-- Multi-Photo Post Feature - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create content_groups table
CREATE TABLE IF NOT EXISTS content_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id TEXT NOT NULL,
    title TEXT NOT NULL,
    main_caption TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'used')),
    created_at TIMESTAMPTZ DEFAULT now(),
    used_at TIMESTAMPTZ
);

-- 2. Add new columns to content table
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES content_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS individual_caption TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_content_group_id ON content(group_id);
CREATE INDEX IF NOT EXISTS idx_content_groups_page_status ON content_groups(page_id, status);

-- 4. Enable RLS (Row Level Security) if needed
ALTER TABLE content_groups ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role full access" ON content_groups
    FOR ALL 
    USING (true)
    WITH CHECK (true);
