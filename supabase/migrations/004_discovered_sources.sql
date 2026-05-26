CREATE TABLE IF NOT EXISTS public.discovered_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    source_opportunity_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'discovered'
);

-- Enable RLS
ALTER TABLE public.discovered_sources ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can manage their own discovered sources"
    ON public.discovered_sources
    FOR ALL
    USING (auth.uid() = user_id);
