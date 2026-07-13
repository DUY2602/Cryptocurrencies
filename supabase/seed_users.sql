-- =============================================================================
-- Seed 300 demo user accounts + profiles + watchlist + comments
-- Run in Supabase Studio > SQL Editor
-- Password: Test1234!
-- Daily registration counts fluctuate visibly: 0-20 users/day
-- =============================================================================

create extension if not exists pgcrypto;

-- Clear old seed data
delete from public.comments where user_id in (select id from auth.users where email like 'user%@test.com');
delete from public.watchlist where user_id in (select id from auth.users where email like 'user%@test.com');
delete from public.profiles where email like 'user%@test.com';
delete from auth.users where email like 'user%@test.com';

do $$
declare
  v_pw text := crypt('Test1234!', gen_salt('bf', 10));
  v_uid uuid;
  v_email text;
  v_name text;
  v_role text;
  v_date date;
  v_coin_ids text[] := array[
    'bitcoin','ethereum','solana','ripple','cardano','dogecoin','polkadot',
    'chainlink','polygon','litecoin','tron','shiba-inu','avalanche-2',
    'uniswap','stellar','monero','cosmos','filecoin','aptos','sui',
    'arbitrum','optimism','near','internet-computer','vechain','algorand',
    'theta-token','fantom','hedera-hashgraph','gala','flow','aave',
    'quant','eos','neo','tezos','decentraland','the-sandbox','axie-infinity',
    'stacks','conflux','kava','mina-protocol','iota','enjincoin',
    'basic-attention-token','zilliqa','waves','icon','ontology','nano'
  ];
  v_comments text[] := array[
    'Great article! Very informative.',
    'Interesting perspective.', 'This aged well 🚀',
    'Bullish on this take.', 'Bearish honestly.',
    'Solid technical analysis.', 'Bookmarked!',
    'DCA is the way.', 'Zoom out — this is nothing.',
    'Always DYOR before investing.'
  ];
  v_aid bigint;
  v_article_ids bigint[];
  v_n int;
  v_i int;
  v_j int;
  v_k int;
  -- Daily registration counts (Jun 1 → Aug 31, 92 days)
  -- Total = 300. Fluctuates: 0, 1-3, 5-8, 10-12, 15-30 per day
  v_daily int[] := array[
    0,0,0,0,20,  -- Jun 1-5:   spike 20
    2,0,3,1,0,   -- Jun 6-10
    0,0,25,0,0,  -- Jun 11-15: spike 25
    1,1,0,3,2,   -- Jun 16-20
    0,0,0,15,5,  -- Jun 21-25: spike 15
    3,0,1,0,0,   -- Jun 26-30
    0,25,2,0,1,  -- Jul 1-5:   spike 25
    0,0,5,0,8,   -- Jul 6-10
    10,0,2,0,0,  -- Jul 11-15
    0,0,0,30,0,  -- Jul 16-20: spike 30
    4,5,0,0,7,   -- Jul 21-25
    0,3,0,0,0,   -- Jul 26-30
    0,                         -- Jul 31
    0,0,20,5,0,  -- Aug 1-5:   spike 20
    1,5,0,0,25,  -- Aug 6-10:  spike 25
    0,0,0,20,2,  -- Aug 11-15: spike 20
    1,0,0,0,15,  -- Aug 16-20: spike 15
    0,7,0,12,0,  -- Aug 21-25
    3,0,0,0,0,   -- Aug 26-30
    0           -- Aug 31
  ];
begin
  select array_agg(id) into v_article_ids from public.news;
  if v_article_ids is null then v_article_ids := array[]::bigint[]; end if;

  v_i := 0;
  for v_j in 1..92 loop
    v_n := v_daily[v_j];
    if v_n = 0 then continue; end if;
    v_date := date '2026-06-01' + (v_j - 1);

    for v_k in 1..v_n loop
      v_i := v_i + 1;
      v_email := format('user%s@test.com', v_i);
      v_name := format('User %s', v_i);
      v_role := case when v_i <= 2 then 'admin' else 'user' end;

      insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,confirmation_sent_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,email_change_token_current,phone_confirmed_at,phone,phone_change,phone_change_token,is_super_admin,banned_until,reauthentication_token,reauthentication_sent_at,is_sso_user,deleted_at)
      values ('00000000-0000-0000-0000-000000000000',gen_random_uuid(),'authenticated','authenticated',v_email,v_pw,v_date,v_date,'{"provider":"email","providers":["email"]}',jsonb_build_object('name',v_name),v_date,v_date,encode(gen_random_bytes(32),'hex'),'','','',v_date,null,'','',false,null,encode(gen_random_bytes(32),'hex'),null,false,null)
      returning id into v_uid;

      insert into public.profiles (id,email,password,name,role,created_at)
      values (v_uid,v_email,v_pw,v_name,v_role,v_date);

      -- watchlist 3-15 coins
      for v_n in 1..(3+floor(random()*13)::int) loop
        insert into public.watchlist (user_id,coin_id)
        values (v_uid, v_coin_ids[1+floor(random()*array_length(v_coin_ids,1))::int])
        on conflict (user_id,coin_id) do nothing;
      end loop;

      -- comments 0-5
      if array_length(v_article_ids,1) > 0 then
        for v_n in 1..floor(random()*6)::int loop
          insert into public.comments (article_id,user_id,user_name,text,created_at)
          values (v_article_ids[1+floor(random()*array_length(v_article_ids,1))::int], v_uid, v_name, v_comments[1+floor(random()*array_length(v_comments,1))::int], v_date + (random()*interval '7 days'));
        end loop;
      end if;
    end loop;
  end loop;
end $$;

do $$
declare n1 int; n2 int; n3 int; n4 int;
begin
  select count(*) into n1 from auth.users where email like 'user%@test.com';
  select count(*) into n2 from public.profiles where email like 'user%@test.com';
  select count(*) into n3 from public.watchlist w join auth.users u on w.user_id=u.id where u.email like 'user%@test.com';
  select count(*) into n4 from public.comments c join auth.users u on c.user_id=u.id where u.email like 'user%@test.com';
  raise notice 'Seed: % users, % profiles, % watchlist, % comments', n1, n2, n3, n4;
end $$;
