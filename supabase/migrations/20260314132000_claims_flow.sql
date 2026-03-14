-- UP
begin;

create extension if not exists pgcrypto;

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  ref_number text unique not null default ('CLM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  adjuster_id uuid references public.profiles(id) on delete set null,
  status text not null default 'Intake',
  description text not null,
  vehicle_info jsonb not null default '{}'::jsonb,
  incident_date date not null,
  fraud_score text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint claims_status_check check (status in ('Intake', 'Reviewing', 'Estimated', 'Approved', 'Closed'))
);

create index if not exists claims_claimant_idx on public.claims (claimant_id, created_at desc);
create index if not exists claims_adjuster_idx on public.claims (adjuster_id, created_at desc);
create index if not exists claims_status_idx on public.claims (status);

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  line_items jsonb not null default '[]'::jsonb,
  total_amount numeric,
  adjuster_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (claim_id)
);

create index if not exists estimates_claim_id_idx on public.estimates (claim_id);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  storage_path text not null,
  ai_result jsonb,
  analyzed_at timestamptz,
  constraint photos_storage_path_unique unique (storage_path)
);

create index if not exists photos_claim_id_idx on public.photos (claim_id);

alter table public.claims enable row level security;
alter table public.estimates enable row level security;
alter table public.photos enable row level security;

drop policy if exists "claimant_can_insert_own_claims" on public.claims;
create policy "claimant_can_insert_own_claims"
on public.claims
for insert
to authenticated
with check (
  claimant_id = auth.uid()
);

drop policy if exists "users_can_select_relevant_claims" on public.claims;
create policy "users_can_select_relevant_claims"
on public.claims
for select
to authenticated
using (
  claimant_id = auth.uid()
  or adjuster_id = auth.uid()
  or (
    adjuster_id is null
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'adjuster'
    )
  )
);

drop policy if exists "adjusters_can_update_assigned_or_unassigned_claims" on public.claims;
create policy "adjusters_can_update_assigned_or_unassigned_claims"
on public.claims
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'adjuster'
  )
  and (adjuster_id = auth.uid() or adjuster_id is null)
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'adjuster'
  )
  and (adjuster_id = auth.uid() or adjuster_id is null)
);

drop policy if exists "claimants_and_adjusters_can_select_estimates" on public.estimates;
create policy "claimants_and_adjusters_can_select_estimates"
on public.estimates
for select
to authenticated
using (
  exists (
    select 1
    from public.claims c
    where c.id = estimates.claim_id
      and (
        c.claimant_id = auth.uid()
        or c.adjuster_id = auth.uid()
        or (
          c.adjuster_id is null
          and exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role = 'adjuster'
          )
        )
      )
  )
);

drop policy if exists "adjusters_can_write_estimates" on public.estimates;
create policy "adjusters_can_write_estimates"
on public.estimates
for all
to authenticated
using (
  exists (
    select 1
    from public.claims c
    join public.profiles p on p.id = auth.uid()
    where c.id = estimates.claim_id
      and p.role = 'adjuster'
      and (c.adjuster_id = auth.uid() or c.adjuster_id is null)
  )
)
with check (
  exists (
    select 1
    from public.claims c
    join public.profiles p on p.id = auth.uid()
    where c.id = estimates.claim_id
      and p.role = 'adjuster'
      and (c.adjuster_id = auth.uid() or c.adjuster_id is null)
  )
);

drop policy if exists "claimants_and_adjusters_can_select_photos" on public.photos;
create policy "claimants_and_adjusters_can_select_photos"
on public.photos
for select
to authenticated
using (
  exists (
    select 1
    from public.claims c
    where c.id = photos.claim_id
      and (
        c.claimant_id = auth.uid()
        or c.adjuster_id = auth.uid()
        or (
          c.adjuster_id is null
          and exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role = 'adjuster'
          )
        )
      )
  )
);

drop policy if exists "claimants_can_insert_photos_for_own_claims" on public.photos;
create policy "claimants_can_insert_photos_for_own_claims"
on public.photos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.claims c
    where c.id = photos.claim_id
      and c.claimant_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('claim-photos', 'claim-photos', false)
on conflict (id) do nothing;

drop policy if exists "users_can_read_their_claim_photos" on storage.objects;
create policy "users_can_read_their_claim_photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'claim-photos'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or exists (
      select 1
      from public.claims c
      where c.adjuster_id = auth.uid()
        and name like ('%' || c.id::text || '%')
    )
  )
);

drop policy if exists "claimants_can_upload_their_claim_photos" on storage.objects;
create policy "claimants_can_upload_their_claim_photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'claim-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

commit;

-- DOWN
begin;

drop policy if exists "claimants_can_upload_their_claim_photos" on storage.objects;
drop policy if exists "users_can_read_their_claim_photos" on storage.objects;

drop policy if exists "claimants_can_insert_photos_for_own_claims" on public.photos;
drop policy if exists "claimants_and_adjusters_can_select_photos" on public.photos;
drop policy if exists "adjusters_can_write_estimates" on public.estimates;
drop policy if exists "claimants_and_adjusters_can_select_estimates" on public.estimates;
drop policy if exists "adjusters_can_update_assigned_or_unassigned_claims" on public.claims;
drop policy if exists "users_can_select_relevant_claims" on public.claims;
drop policy if exists "claimant_can_insert_own_claims" on public.claims;

drop table if exists public.photos;
drop table if exists public.estimates;
drop table if exists public.claims;

commit;
