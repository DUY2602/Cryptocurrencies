-- =============================================================================
-- RAG Production Setup — run in Supabase Studio > SQL Editor
-- =============================================================================

-- 0) Unique constraint for upsert (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'documents_source_source_id_key'
  ) then
    alter table public.documents add constraint documents_source_source_id_key unique (source, source_id);
  end if;
end $$;

-- 1) Full-text search index on documents content
create index if not exists idx_documents_fts_content
  on public.documents using gin (to_tsvector('english', coalesce(content, '')));

-- 2) Vector-only search (returns similarity 0-1)
drop function if exists match_documents(vector, int);
create function match_documents(
  query_embedding vector(768),
  match_count int default 5
) returns table (
  id bigint, source text, source_id text, title text, content text, similarity float
) language plpgsql as $$
begin
  return query
  select d.id, d.source, d.source_id, d.title, d.content,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where d.embedding is not null
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 3) Full-text search function (keyword-based via PostgreSQL tsvector)
create or replace function match_documents_fts(
  query_text text,
  match_count int default 20
) returns table (
  id bigint, source text, source_id text, title text, content text, rank float
) language plpgsql as $$
begin
  return query
  select d.id, d.source, d.source_id, d.title, d.content,
    ts_rank(to_tsvector('english', coalesce(d.content, '')), plainto_tsquery('english', query_text)) as rank
  from documents d
  where d.embedding is not null
    and to_tsvector('english', coalesce(d.content, '')) @@ plainto_tsquery('english', query_text)
  order by rank desc
  limit match_count;
end;
$$;
