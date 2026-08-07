-- Migration: add like/dislike type to news_likes
alter table public.news_likes
  add column type text not null default 'like'
  check (type in ('like', 'dislike'));

-- Drop old unique constraint and keep same (user_id, article_id) unique
-- (type is NOT part of unique so one user can only have ONE reaction per article)
alter table public.news_likes drop constraint if exists news_likes_user_id_article_id_key;
alter table public.news_likes add constraint news_likes_user_id_article_id_key unique (user_id, article_id);

-- Add update policy for upsert
drop policy if exists "Users can update own likes" on public.news_likes;
create policy "Users can update own likes"
  on public.news_likes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
