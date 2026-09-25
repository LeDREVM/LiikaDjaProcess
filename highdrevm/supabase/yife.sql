-- ═══════════════════════════════════════════════════════════════════════════
-- Yife — schéma Supabase (projet DÉDIÉ, jamais celui de l'app du couple)
-- À exécuter une fois dans SQL Editor. Ré-exécutable sans casse (idempotent).
--
-- Modèle :
--   yife_spaces  : un espace de vie (solo ou couple). Toutes les données de l'app
--                  sont dans `data` (jsonb), fusionné section par section côté client.
--   yife_members : qui appartient à quel espace, et à quelle place
--                  ('dja' = profil A / créateur, 'liika' = profil B / invité·e).
-- Sécurité : RLS partout. Un utilisateur ne voit et ne modifie QUE les espaces
-- dont il est membre. Création, invitation et suppression passent par des
-- fonctions SECURITY DEFINER qui vérifient auth.uid().
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- Code d'invitation lisible : 8 caractères sans 0/O/1/I pour éviter les confusions.
create or replace function public.yife_new_code() returns text
language sql volatile set search_path = public as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, 8);
$$;

create table if not exists public.yife_spaces (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null references auth.users(id) on delete cascade,
  name        text not null default '',
  invite_code text not null unique default public.yife_new_code(),
  data        jsonb not null default '{}'::jsonb,
  device_id   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.yife_members (
  space_id  uuid not null references public.yife_spaces(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  slot      text not null check (slot in ('dja', 'liika')),
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id),
  unique (space_id, slot),
  unique (user_id)            -- un compte = un espace (v1)
);

alter table public.yife_spaces  enable row level security;
alter table public.yife_members enable row level security;

-- Appartenance (SECURITY DEFINER : évite la récursion RLS entre les deux tables).
create or replace function public.yife_is_member(p_space uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.yife_members where space_id = p_space and user_id = auth.uid());
$$;

drop policy if exists yife_spaces_select on public.yife_spaces;
create policy yife_spaces_select on public.yife_spaces
  for select to authenticated using (public.yife_is_member(id));
drop policy if exists yife_spaces_update on public.yife_spaces;
create policy yife_spaces_update on public.yife_spaces
  for update to authenticated using (public.yife_is_member(id)) with check (public.yife_is_member(id));
-- Pas de policy insert/delete : création et suppression via les fonctions ci-dessous.

-- Les membres ne peuvent modifier que le contenu, jamais le propriétaire ni le code.
revoke update on public.yife_spaces from anon, authenticated;
grant  select on public.yife_spaces to authenticated;
grant  update (name, data, device_id, updated_at) on public.yife_spaces to authenticated;

drop policy if exists yife_members_select on public.yife_members;
create policy yife_members_select on public.yife_members
  for select to authenticated using (user_id = auth.uid() or public.yife_is_member(space_id));
revoke insert, update, delete on public.yife_members from anon, authenticated;
grant  select on public.yife_members to authenticated;

-- Créer son espace (le créateur prend la place 'dja'). Renvoie { space_id, slot }.
create or replace function public.yife_create_space(p_name text, p_data jsonb)
returns table (space_id uuid, slot text)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_space uuid;
begin
  if v_uid is null then raise exception 'non_connecte'; end if;
  -- Déjà membre d'un espace ? On le renvoie plutôt que d'en créer un second.
  return query select m.space_id, m.slot from public.yife_members m where m.user_id = v_uid;
  if found then return; end if;
  insert into public.yife_spaces (owner, name, data)
    values (v_uid, coalesce(left(p_name, 80), ''), coalesce(p_data, '{}'::jsonb))
    returning id into v_space;
  insert into public.yife_members (space_id, user_id, slot) values (v_space, v_uid, 'dja');
  return query select v_space, 'dja'::text;
end $$;

-- Rejoindre l'espace de son/sa partenaire avec le code d'invitation (place 'liika').
create or replace function public.yife_join_space(p_code text)
returns table (space_id uuid, slot text)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_space uuid;
begin
  if v_uid is null then raise exception 'non_connecte'; end if;
  return query select m.space_id, m.slot from public.yife_members m where m.user_id = v_uid;
  if found then return; end if;
  select s.id into v_space from public.yife_spaces s where s.invite_code = upper(trim(p_code));
  if v_space is null then raise exception 'code_invalide'; end if;
  if exists (select 1 from public.yife_members m where m.space_id = v_space and m.slot = 'liika') then
    raise exception 'espace_complet';
  end if;
  insert into public.yife_members (space_id, user_id, slot) values (v_space, v_uid, 'liika');
  return query select v_space, 'liika'::text;
end $$;

-- Droit à l'effacement (RGPD) : supprime les espaces créés par l'utilisateur
-- (cascade sur les membres) puis le compte lui-même.
create or replace function public.yife_delete_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'non_connecte'; end if;
  delete from public.yife_spaces where owner = v_uid;
  delete from auth.users where id = v_uid;
end $$;

revoke execute on function public.yife_create_space(text, jsonb) from public, anon;
revoke execute on function public.yife_join_space(text)          from public, anon;
revoke execute on function public.yife_delete_account()          from public, anon;
revoke execute on function public.yife_is_member(uuid)           from public, anon;
grant  execute on function public.yife_create_space(text, jsonb) to authenticated;
grant  execute on function public.yife_join_space(text)          to authenticated;
grant  execute on function public.yife_delete_account()          to authenticated;
grant  execute on function public.yife_is_member(uuid)           to authenticated;

-- Temps réel : les modifications d'un partenaire arrivent sans recharger.
do $$ begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'yife_spaces') then
    alter publication supabase_realtime add table public.yife_spaces;
  end if;
end $$;
