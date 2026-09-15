-- =========================================================================
-- GeoRemind: Supabase Schema & Row-Level Security (RLS) Setup
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =========================================================================

-- 1. Create table for User Settings (Stores Google Maps API Key, default location, map provider)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_maps_api_key TEXT,
  map_provider TEXT DEFAULT 'osm',
  default_location JSONB,
  preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only read and write their own settings
CREATE POLICY "Users can view own settings"
  ON public.user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update own settings"
  ON public.user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 2. Create table for User Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  category TEXT DEFAULT 'shopping',
  priority TEXT DEFAULT 'medium',
  type TEXT DEFAULT 'location',
  completed BOOLEAN DEFAULT false,
  location JSONB,
  due_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Users can only view and manage their own reminders
CREATE POLICY "Users can view own reminders"
  ON public.reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update own reminders"
  ON public.reminders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON public.reminders
  FOR DELETE
  USING (auth.uid() = user_id);
