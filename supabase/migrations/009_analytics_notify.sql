-- Besucherzähler (ohne Cookies, ohne IP) und Push-Meldung bei neuer Registrierung (ntfy.sh via pg_net)

create extension if not exists pg_net with schema extensions;

-- Seitenaufrufe
create table public.page_views (
  id bigserial primary key,
  path text not null,
  session text not null,          -- zufällige ID pro Browser-Sitzung (sessionStorage), keine Person
  referrer text,
  device text,                    -- mobile | desktop
  created_at timestamptz not null default now()
);
create index page_views_created_idx on public.page_views(created_at);
alter table public.page_views enable row level security;
create policy "views: admin read" on public.page_views for select to authenticated using (public.is_admin());

create or replace function public.track_view(p_path text, p_session text, p_referrer text default null, p_device text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_path is null or p_session is null or length(p_session) < 8 or length(p_path) > 200 then return; end if;
  -- gleiche Sitzung, gleiche Seite innerhalb 30 Minuten: nicht doppelt zählen
  if exists (select 1 from public.page_views v where v.session = p_session and v.path = p_path and v.created_at > now() - interval '30 minutes') then return; end if;
  insert into public.page_views (path, session, referrer, device) values (left(p_path, 200), left(p_session, 64), left(p_referrer, 200), left(p_device, 20));
end $$;
revoke execute on function public.track_view(text, text, text, text) from public;
grant execute on function public.track_view(text, text, text, text) to anon, authenticated;

-- Tagesstatistik für den Admin
create view public.page_stats_daily with (security_invoker = true) as
select created_at::date as day, count(*) as views, count(distinct session) as visitors,
  count(*) filter (where device = 'mobile') as mobile
from public.page_views group by 1 order by 1 desc;
grant select on public.page_stats_daily to authenticated;

create view public.page_stats_paths with (security_invoker = true) as
select path, count(*) as views, count(distinct session) as visitors
from public.page_views where created_at > now() - interval '30 days' group by 1 order by 2 desc;
grant select on public.page_stats_paths to authenticated;

-- Push-Meldung bei neuer Registrierung
insert into public.settings values
  ('notify_ntfy_topic', '"fck-schnittersunnti-a6fcc1fabd26"'),
  ('notify_on_register', 'true')
on conflict (key) do nothing;

create or replace function public.ntfy_send(p_title text, p_message text, p_click text default 'https://www.schnittersunnti.ch/admin')
returns void language plpgsql security definer set search_path = public, extensions as $$
declare topic text;
begin
  select value #>> '{}' into topic from public.settings where key = 'notify_ntfy_topic';
  if topic is null or topic = '' then return; end if;
  perform net.http_post(
    url := 'https://ntfy.sh',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('topic', topic, 'title', p_title, 'message', p_message, 'click', p_click, 'tags', jsonb_build_array('soccer'))
  );
end $$;
revoke execute on function public.ntfy_send(text, text, text) from public;

create or replace function public.notify_new_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare on_ boolean;
begin
  select (value)::boolean into on_ from public.settings where key = 'notify_on_register';
  if coalesce(on_, false) then
    perform public.ntfy_send('Neue Registrierung Helferportal', new.full_name || coalesce(' · ' || new.team, '') || ' hat sich registriert.', 'https://www.schnittersunnti.ch/admin?tab=helfende');
  end if;
  return new;
end $$;
revoke execute on function public.notify_new_profile() from anon, authenticated, public;
drop trigger if exists profiles_notify on public.profiles;
create trigger profiles_notify after insert on public.profiles for each row execute function public.notify_new_profile();

-- Test aus dem Admin
create or replace function public.notify_test()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Nur Admin'; end if;
  perform public.ntfy_send('Test Schnittersunnti', 'Die Benachrichtigung funktioniert.', 'https://www.schnittersunnti.ch/admin');
end $$;
revoke execute on function public.notify_test() from public;
grant execute on function public.notify_test() to authenticated;
