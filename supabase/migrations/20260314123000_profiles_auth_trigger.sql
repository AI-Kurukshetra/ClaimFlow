-- UP
begin;

alter table if exists public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

update public.profiles
set
  first_name = coalesce(
    nullif(first_name, ''),
    nullif(split_part(trim(coalesce(full_name, '')), ' ', 1), '')
  ),
  last_name = coalesce(
    nullif(last_name, ''),
    nullif(
      trim(
        substr(
          trim(coalesce(full_name, '')),
          length(split_part(trim(coalesce(full_name, '')), ' ', 1)) + 1
        )
      ),
      ''
    )
  )
where coalesce(full_name, '') <> '';

update public.profiles
set role = 'claimant'
where role is null or btrim(role) = '';

alter table if exists public.profiles
  alter column role set default 'claimant';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('admin', 'adjuster', 'claimant'));
  end if;
end
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata_full_name text;
  metadata_first_name text;
  metadata_last_name text;
  profile_role text;
begin
  metadata_full_name := nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');
  metadata_first_name := nullif(trim(new.raw_user_meta_data ->> 'first_name'), '');
  metadata_last_name := nullif(trim(new.raw_user_meta_data ->> 'last_name'), '');
  profile_role := coalesce(nullif(trim(new.raw_user_meta_data ->> 'role'), ''), 'claimant');

  if metadata_first_name is null and metadata_full_name is not null then
    metadata_first_name := nullif(split_part(metadata_full_name, ' ', 1), '');
  end if;

  if metadata_last_name is null and metadata_full_name is not null then
    metadata_last_name := nullif(
      trim(substr(metadata_full_name, length(split_part(metadata_full_name, ' ', 1)) + 1)),
      ''
    );
  end if;

  insert into public.profiles (
    id,
    first_name,
    last_name,
    full_name,
    role,
    created_at
  )
  values (
    new.id,
    metadata_first_name,
    metadata_last_name,
    coalesce(
      metadata_full_name,
      nullif(concat_ws(' ', metadata_first_name, metadata_last_name), ''),
      new.email
    ),
    case
      when profile_role in ('admin', 'adjuster', 'claimant') then profile_role
      else 'claimant'
    end,
    timezone('utc', now())
  )
  on conflict (id) do update
  set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    full_name = excluded.full_name,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

commit;

-- DOWN
begin;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

alter table if exists public.profiles
  alter column role drop default;

alter table if exists public.profiles
  drop constraint if exists profiles_role_check;

alter table if exists public.profiles
  drop column if exists created_at,
  drop column if exists last_name,
  drop column if exists first_name;

commit;
