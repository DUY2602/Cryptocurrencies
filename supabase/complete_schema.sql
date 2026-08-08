-- =============================================================================
-- Complete Supabase Schema — Cryptocurrencies Dashboard
-- Profiles stores all accounts with email + bcrypt password.
-- Idempotent: safe to run multiple times (IF NOT EXISTS / OR REPLACE).
-- Run in Supabase Studio > SQL Editor.
-- =============================================================================
-- Run this in Supabase Studio > SQL Editor
-- =============================================================================

-- 0) Extensions ---------------------------------------------------------------
create extension if not exists vector;

-- 1) Tables -------------------------------------------------------------------

-- 1a) User profiles — source of truth for all accounts.
--     id = auth.users.id (FK kept for RLS compatibility).
create table if not exists public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  email      text not null,
  password   text,                     -- bcrypt hash (null until set)
  name       text,
  role       text not null default 'user',
  created_at timestamptz not null default now()
);

-- 1b) Watchlist
create table if not exists public.watchlist (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  coin_id    text not null,
  created_at timestamptz not null default now(),
  unique(user_id, coin_id)
);

-- 1c) News articles (created before news_likes which references it)
create table if not exists public.news (
  id           bigint generated always as identity primary key,
  title        text not null,
  summary      text,
  content      text not null default '',
  category     text not null default 'General',
  image_url    text,
  source_url   text,
  source_name  text,
  author_name  text,
  author_avatar text,
  tags         text[] not null default '{}',
  featured     boolean not null default false,
  trending     boolean not null default false,
  read_time    integer not null default 3,
  published_at timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 1d) News likes
create table if not exists public.news_likes (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  article_id bigint not null references public.news(id) on delete cascade,
  type       text not null default 'like' check (type in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  unique(user_id, article_id)
);

-- 1e) Comments
create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  article_id bigint not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  user_name  text not null,
  text       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- 1f) RAG documents — embeddings match gemini-embedding-2 (768 dims).
create table if not exists public.documents (
  id        bigint generated always as identity primary key,
  source    text not null,            -- 'coin' | 'news'
  source_id text not null,            -- coin.id (string) or news.id (cast)
  title     text not null,
  content   text not null,            -- plain text used for embedding
  metadata  jsonb default '{}',
  embedding vector(768),
  created_at timestamptz not null default now()
);

-- 2) Functions -----------------------------------------------------------------

-- 2a) Check if auth user is admin
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to anon;

-- 2b) Auto-update updated_at on news
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3) Triggers ------------------------------------------------------------------

drop trigger if exists trg_news_touch_updated_at on public.news;
create trigger trg_news_touch_updated_at
  before update on public.news
  for each row execute function public.touch_updated_at();

-- 4) Row Level Security --------------------------------------------------------

-- 4a) Comments RLS
alter table public.comments enable row level security;

drop policy if exists "Users can view all comments" on public.comments;
create policy "Users can view all comments"
  on public.comments for select
  using (true);

drop policy if exists "Authenticated users can insert comments" on public.comments;
create policy "Authenticated users can insert comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own comments" on public.comments;
create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can update own comments" on public.comments;
create policy "Users can update own comments"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4b) News RLS
alter table public.news enable row level security;

drop policy if exists "Public can read news" on public.news;
create policy "Public can read news"
  on public.news for select
  using (true);

drop policy if exists "Admins can insert news" on public.news;
create policy "Admins can insert news"
  on public.news for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update news" on public.news;
create policy "Admins can update news"
  on public.news for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete news" on public.news;
create policy "Admins can delete news"
  on public.news for delete
  using (public.is_admin(auth.uid()));

-- 4c) Watchlist RLS
alter table public.watchlist enable row level security;

drop policy if exists "Users can view own watchlist" on public.watchlist;
create policy "Users can view own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own watchlist" on public.watchlist;
create policy "Users can insert own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own watchlist" on public.watchlist;
create policy "Users can delete own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);

-- 4d) News likes RLS
alter table public.news_likes enable row level security;

drop policy if exists "Users can view all likes" on public.news_likes;
create policy "Users can view all likes"
  on public.news_likes for select
  using (true);

drop policy if exists "Users can insert own likes" on public.news_likes;
create policy "Users can insert own likes"
  on public.news_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own likes" on public.news_likes;
create policy "Users can update own likes"
  on public.news_likes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own likes" on public.news_likes;
create policy "Users can delete own likes"
  on public.news_likes for delete
  using (auth.uid() = user_id);

-- 4e) Documents RLS (public read, admin write)
alter table public.documents enable row level security;

drop policy if exists "Public can read documents" on public.documents;
create policy "Public can read documents"
  on public.documents for select
  using (true);

drop policy if exists "Admins can insert documents" on public.documents;
create policy "Admins can insert documents"
  on public.documents for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update documents" on public.documents;
create policy "Admins can update documents"
  on public.documents for update
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete documents" on public.documents;
create policy "Admins can delete documents"
  on public.documents for delete
  using (public.is_admin(auth.uid()));

-- 5) Indexes -------------------------------------------------------------------

-- 5a) Comments
create index if not exists idx_comments_article
  on public.comments(article_id, created_at asc);

-- 5b) News
create index if not exists idx_news_published_at
  on public.news (published_at desc);
create index if not exists idx_news_category
  on public.news (category);
create index if not exists idx_news_featured
  on public.news (featured) where featured = true;
create index if not exists idx_news_trending
  on public.news (trending) where trending = true;
create index if not exists idx_news_tags
  on public.news using gin (tags);

-- 5c) RAG documents — HNSW index for fast vector similarity search
create index if not exists idx_documents_embedding
  on public.documents using hnsw (embedding vector_cosine_ops);

-- 6) Realtime ------------------------------------------------------------------

alter publication supabase_realtime add table public.news;

-- =============================================================================
-- 7) Make a user an admin (run AFTER registering via the site)
--    Replace 'admin@crypto.local' with the email you registered with.
-- =============================================================================insert into public.profiles (id, email, password, name, role)
select
  id,
  email,
  null,         -- password already set via registration
  split_part(email, '@', 1),
  'admin'
from auth.users
where email = 'admin@crypto.local'
on conflict (id) do update set role = 'admin';

-- =============================================================================
-- 8) Schedule auto-fetch news from CoinDesk RSS (every hour)
-- Requires pg_cron extension (enable in Supabase Dashboard > Database > Extensions).
-- Already enabled. Run the following in Supabase Dashboard > SQL Editor
-- (replace YOUR_SERVICE_ROLE_KEY):
-- select cron.schedule(
--   'fetch-news-hourly',
--   '0 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://zahkrafltxhvttoxhars.supabase.co/functions/v1/fetch-news',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--     ),
--     body := '{}'::jsonb
--   ) as request_id;
--   $$
-- );
