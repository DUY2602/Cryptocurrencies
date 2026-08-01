-- =============================================================================
-- Seed 300 demo user accounts + profiles + watchlist + comments
-- Run in Supabase Studio > SQL Editor
-- Password for all test accounts: Test1234!
-- Hardcoded coin IDs (no external API calls)
-- Created_at: bursty daily signups across past ~6 months so the dashboard
-- "registrations per day" chart shows realistic up/down fluctuations.
-- =============================================================================
create extension if not exists pgcrypto;
do $$
declare v_password text := crypt('Test1234!', gen_salt('bf', 10));
v_user_id uuid;
v_email text;
v_name text;
v_role text;
v_date timestamptz;
v_burst_day timestamptz;
v_burst_left int := 0;
v_coin_ids text [];
v_comment_texts text [] := array [
    'Great article, very informative! Thanks for sharing.',
    'Interesting perspective. I think the market will recover soon.',
    'This aged well 🚀',
    'Can someone explain what this means for retail investors?',
    'Finally some good analysis on this topic.',
    'Not sure I agree with the conclusion, but good read.',
    'Bullish on this take.',
    'Bearish honestly, the fundamentals are weak.',
    'Where do you see BTC this time next year?',
    'Solid technical analysis right here.',
    'This is exactly what I was looking for, thanks!',
    'Bookmarked for later reference.',
    'I wish more people understood this concept.',
    'Price prediction? I say $100k EOY.',
    'Zoom out — this is nothing in the grand scheme.',
    'Follow for more crypto insights!',
    'What wallet do you recommend for storing these?',
    'Be careful with leverage, folks.',
    'DCA is the way. Time in the market > timing the market.',
    'First time commenting here, love the community!',
    'The FUD is real today lol',
    'Imagine selling now 😂',
    'Serious question — how do taxes work for this?',
    'My portfolio is up 40% thanks to this tip!',
    'Always DYOR before investing.'
  ];
v_article_ids bigint [];
v_article_id bigint;
v_i int;
v_j int;
v_coin_id text;
v_num_coins int;
v_num_comments int;
v_comment_text text;
begin -- Use hardcoded coin IDs (no external API calls)
v_coin_ids := array [
    'bitcoin','ethereum','solana','ripple','cardano','dogecoin','polkadot',
    'chainlink','polygon','litecoin','tron','shiba-inu','avalanche-2',
    'uniswap','stellar','monero','cosmos','filecoin','aptos','sui',
    'arbitrum','optimism','near','internet-computer','vechain','algorand',
    'theta-token','fantom','hedera-hashgraph','gala','flow','aave',
    'quant','eos','neo','tezos','decentraland','the-sandbox','axie-infinity',
    'stacks','conflux','kava','mina-protocol','iota','enjincoin',
    'basic-attention-token','zilliqa','waves','icon','ontology','nano'
  ];
-- Existing articles for comment seeding
select array_agg(
    id
    order by random()
  ) into v_article_ids
from public.news;
if v_article_ids is null then v_article_ids := array []::bigint [];
end if;
-- Main loop: create 300 users
for v_i in 1..300 loop v_email := format('user%s@test.com', v_i);
v_name := format('User %s', v_i);
v_role := case
  when v_i <= 2 then 'admin'
  else 'user'
end;
-- spread across past ~6 months with bursty daily clusters:
-- some days get several signups, some get none → chart fluctuates
if v_burst_left > 0 then
  v_date := v_burst_day;
  v_burst_left := v_burst_left - 1;
else
  v_burst_day := now() - ((floor(random() * 180)::int) * interval '1 day');
  v_date := v_burst_day;
  -- 0-5 extra signups on the same day
  v_burst_left := floor(random() * 6)::int;
end if;
continue
when exists (
  select 1
  from auth.users
  where email = v_email
);
-- 1) Auth user
insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_confirmed_at,
    phone,
    phone_change,
    phone_change_token,
    is_super_admin,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
  )
values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    v_email,
    v_password,
    v_date,
    v_date,
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', v_name),
    v_date,
    v_date,
    encode(gen_random_bytes(32), 'hex'),
    '',
    '',
    '',
    '',
    v_date,
    null,
    '',
    '',
    '',
    false,
    null,
    encode(gen_random_bytes(32), 'hex'),
    null,
    false,
    null
  )
returning id into v_user_id;
-- 2) Profile
insert into public.profiles (id, email, password, name, role, created_at)
values (
    v_user_id,
    v_email,
    v_password,
    v_name,
    v_role,
    v_date
  );
-- 3) Watchlist: 3-15 random coins
v_num_coins := 3 + floor(random() * 13)::int;
for v_j in 1..v_num_coins loop v_coin_id := v_coin_ids [1 + floor(random() * array_length(v_coin_ids, 1))::int];
insert into public.watchlist (user_id, coin_id)
values (v_user_id, v_coin_id) on conflict (user_id, coin_id) do nothing;
end loop;
-- 4) Comments: 0-5 on random articles
if array_length(v_article_ids, 1) > 0 then v_num_comments := floor(random() * 6)::int;
for v_j in 1..v_num_comments loop v_article_id := v_article_ids [1 + floor(random() * array_length(v_article_ids, 1))::int];
v_comment_text := v_comment_texts [1 + floor(random() * array_length(v_comment_texts, 1))::int];
insert into public.comments (article_id, user_id, user_name, text, created_at)
values (
    v_article_id,
    v_user_id,
    v_name,
    v_comment_text,
    v_date + (random() * interval '7 days')
  );
end loop;
end if;
end loop;
end $$;
-- =============================================================================
-- Summary
-- =============================================================================
do $$
declare v_user_count int;
v_profile_count int;
v_watchlist_count int;
v_comment_count int;
begin
select count(*) into v_user_count
from auth.users
where email like 'user%@test.com';
select count(*) into v_profile_count
from public.profiles
where email like 'user%@test.com';
select count(*) into v_watchlist_count
from public.watchlist w
  join auth.users u on w.user_id = u.id
where u.email like 'user%@test.com';
select count(*) into v_comment_count
from public.comments c
  join auth.users u on c.user_id = u.id
where u.email like 'user%@test.com';
raise notice '=========================================';
raise notice 'Seed complete!';
raise notice '  Auth users:     %',
v_user_count;
raise notice '  Profiles:       %',
v_profile_count;
raise notice '  Watchlist rows: %',
v_watchlist_count;
raise notice '  Comments:       %',
v_comment_count;
raise notice '  Admin accounts: user1@test.com, user2@test.com';
raise notice '  Password:       Test1234!';
raise notice '=========================================';
end $$;