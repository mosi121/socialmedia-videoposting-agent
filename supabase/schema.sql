-- Social Media Video Posting Agent Schema for Supabase
-- Run this in the Supabase SQL Editor (1-click run)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Team Members / Users
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'creator', -- 'admin', 'creator', 'reviewer'
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Connected Social Media Accounts (Tokens & Profiles)
-- Scoped per user so each user can connect different channels
CREATE TABLE IF NOT EXISTS public.social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL, -- Isolated by team member
    platform TEXT NOT NULL,   -- 'youtube', 'instagram', 'facebook', 'tiktok'
    account_name TEXT NOT NULL,
    account_id TEXT, -- Channel ID, Page ID, or IG Business ID
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at BIGINT,
    avatar_url TEXT,
    is_connected BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_platform UNIQUE (user_email, platform)
);

-- 4. Video Posts & AI Generation Packs
CREATE TABLE IF NOT EXISTS public.video_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT, -- Stored per creator
    title TEXT NOT NULL,
    user_prompt TEXT,
    raw_video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds NUMERIC,
    status TEXT DEFAULT 'draft',
    ai_metadata JSONB DEFAULT '{}'::jsonb, 
    approved_copy JSONB DEFAULT '{}'::jsonb,
    platform_results JSONB DEFAULT '{}'::jsonb,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- 5. Heartbeat / Keep-Alive Table (Ensures project never pauses)
CREATE TABLE IF NOT EXISTS public.system_heartbeats (
    id SERIAL PRIMARY KEY,
    pinged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-seed the 2 Authorized Team Members
INSERT INTO public.team_members (email, full_name, role)
VALUES 
  ('amorousbrood@gmail.com', 'Amorous Brood', 'creator'),
  ('fatimamohsinkhokhar29@gmail.com', 'Fatima Mohsin Khokhar', 'creator')
ON CONFLICT (email) DO NOTHING;

-- RLS: Enable RLS and add basic service-role & authenticated policies
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_heartbeats ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all authenticated and service_role
CREATE POLICY "Allow all for authenticated users" ON public.team_members FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.social_accounts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.video_posts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.system_heartbeats FOR ALL USING (true);
