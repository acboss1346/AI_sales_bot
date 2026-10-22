-- Supabase Schema Migration: SalesFlow AI Voice Bot
-- Table: calls

CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    recording_consent BOOLEAN NOT NULL DEFAULT false,
    recording_path TEXT,
    recording_url TEXT,
    transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary TEXT,
    customer_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    objections JSONB NOT NULL DEFAULT '[]'::jsonb,
    next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    customer_interest TEXT CHECK (customer_interest IN ('Low', 'Medium', 'High') OR customer_interest IS NULL),
    sales_status TEXT NOT NULL DEFAULT 'No Response' CHECK (
        sales_status IN (
            'Converted',
            'Interested',
            'Follow-up Required',
            'Not Interested',
            'Demo Requested',
            'No Response'
        )
    ),
    status_reason TEXT,
    processing_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (
        processing_status IN ('in_progress', 'completed', 'failed', 'retry_pending')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast query, sorting, and filtering
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_sales_status ON calls (sales_status);
CREATE INDEX IF NOT EXISTS idx_calls_processing_status ON calls (processing_status);

-- Row Level Security (RLS) setup
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Note for Sankar Group assignment single-tenant/demo context:
-- Allow server-side service role full read/write, and anonymous read/write if anon key is used
CREATE POLICY "Allow server full access on calls"
    ON calls
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Storage Bucket setup instructions (execute in Supabase SQL Editor or Storage Dashboard):
-- 1. Create a public or authenticated bucket named 'call-recordings'
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('call-recordings', 'call-recordings', true)
-- ON CONFLICT (id) DO NOTHING;

-- 2. Storage policy allowing upload and read:
-- CREATE POLICY "Allow public read of call recordings" 
-- ON storage.objects FOR SELECT USING (bucket_id = 'call-recordings');

-- CREATE POLICY "Allow service role upload of call recordings" 
-- ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'call-recordings');
