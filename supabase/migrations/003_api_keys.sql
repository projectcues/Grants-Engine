-- Create api_keys table
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  key_hash text not null unique,
  prefix text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  last_used_at timestamp with time zone
);

-- Enable RLS
alter table public.api_keys enable row level security;

-- Policies
create policy "Users can view own api keys" on public.api_keys
  for select using (auth.uid() = user_id);

create policy "Users can insert own api keys" on public.api_keys
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own api keys" on public.api_keys
  for delete using (auth.uid() = user_id);
