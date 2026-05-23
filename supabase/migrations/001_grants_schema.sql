-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the past_grants table
create table past_grants (
  id uuid primary key default gen_random_uuid(),
  grant_id text not null,
  content text not null,
  embedding vector(384),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a function to search for past grants
create or replace function match_past_grants (
  query_embedding vector(384),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  grant_id text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    past_grants.id,
    past_grants.grant_id,
    past_grants.content,
    1 - (past_grants.embedding <=> query_embedding) as similarity
  from past_grants
  where 1 - (past_grants.embedding <=> query_embedding) > match_threshold
  order by past_grants.embedding <=> query_embedding
  limit match_count;
$$;
