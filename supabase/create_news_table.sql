create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  role text default 'user',
  created_at timestamptz default now()
);

create table watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  coin_id text not null,
  created_at timestamptz default now(),
  unique(user_id, coin_id)
);


create table news_likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  article_id int references news(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, article_id)
);

