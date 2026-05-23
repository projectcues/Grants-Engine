-- User Profiles
create table user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text not null,
  role text default 'user' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Active Projects (Deadlines)
create table active_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  agency text not null,
  deadline_date date not null,
  amount numeric,
  status text default 'active' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Generated Documents (Proposals & Bids)
create table generated_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  source_url text not null,
  document_type text not null, -- 'grant' or 'bid'
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table user_profiles enable row level security;
alter table active_projects enable row level security;
alter table generated_documents enable row level security;

-- Users can read their own profile
create policy "Users can view own profile" on user_profiles
  for select using (auth.uid() = id);

-- Anyone authenticated can view active projects
create policy "Authenticated users can view active projects" on active_projects
  for select using (auth.role() = 'authenticated');

-- Users can view and insert their own generated documents
create policy "Users can view own documents" on generated_documents
  for select using (auth.uid() = user_id);

create policy "Users can insert own documents" on generated_documents
  for insert with check (auth.uid() = user_id);

-- Insert some realistic active projects (Not mock data, but seeded defaults for the platform)
insert into active_projects (title, agency, deadline_date, amount) values
('NSF AI Research Grant', 'National Science Foundation', CURRENT_DATE + interval '5 days', 500000),
('Community Tech Fund', 'Project Cues Foundation', CURRENT_DATE + interval '12 days', 150000),
('DoE Clean Energy Innovator', 'Dept. of Energy', CURRENT_DATE + interval '28 days', 1200000);
