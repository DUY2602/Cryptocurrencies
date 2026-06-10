-- =============================================================================
-- RAG Setup — run in Supabase Studio > SQL Editor
-- =============================================================================

-- 0) Add unique constraint for upsert (if not exists)
alter table public.documents
  add constraint documents_source_source_id_key unique (source, source_id);

-- 1) Vector search function (used by the chat Edge Function)
create or replace function match_documents(
  query_embedding vector(768),
  match_count int default 5
) returns table (
  id bigint, source text, title text, content text, similarity float
) language plpgsql as $$
begin
  return query
  select d.id, d.source, d.title, d.content,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where d.embedding is not null
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
