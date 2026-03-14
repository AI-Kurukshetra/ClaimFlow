-- UP
begin;

create table if not exists public.claim_inspections (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  scheduled_for timestamptz not null,
  provider_type text not null,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  requested_by_role text not null,
  reason text not null,
  status text not null default 'Scheduled',
  notes text,
  requester_timezone text not null default 'UTC',
  created_at timestamptz not null default timezone('utc', now()),
  constraint claim_inspections_provider_type_check check (provider_type in ('adjuster', 'third_party_appraiser')),
  constraint claim_inspections_requested_by_role_check check (requested_by_role in ('claimant', 'adjuster')),
  constraint claim_inspections_reason_check check (reason in ('additional_details', 'higher_amount_review')),
  constraint claim_inspections_status_check check (status in ('Scheduled', 'Completed', 'Cancelled'))
);

create index if not exists claim_inspections_claim_id_scheduled_for_idx
  on public.claim_inspections (claim_id, scheduled_for asc);

alter table public.claim_inspections enable row level security;

drop policy if exists "users_can_select_relevant_claim_inspections" on public.claim_inspections;
create policy "users_can_select_relevant_claim_inspections"
on public.claim_inspections
for select
to authenticated
using (
  exists (
    select 1
    from public.claims c
    where c.id = claim_inspections.claim_id
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

drop policy if exists "claimants_can_schedule_virtual_inspections" on public.claim_inspections;
create policy "claimants_can_schedule_virtual_inspections"
on public.claim_inspections
for insert
to authenticated
with check (
  requested_by = auth.uid()
  and requested_by_role = 'claimant'
  and exists (
    select 1
    from public.claims c
    where c.id = claim_inspections.claim_id
      and c.claimant_id = auth.uid()
      and c.status in ('DetailsRequested', 'Estimated')
  )
);

drop policy if exists "adjusters_can_manage_claim_inspections" on public.claim_inspections;
create policy "adjusters_can_manage_claim_inspections"
on public.claim_inspections
for all
to authenticated
using (
  exists (
    select 1
    from public.claims c
    join public.profiles p on p.id = auth.uid()
    where c.id = claim_inspections.claim_id
      and p.role = 'adjuster'
      and (c.adjuster_id = auth.uid() or c.adjuster_id is null)
  )
)
with check (
  exists (
    select 1
    from public.claims c
    join public.profiles p on p.id = auth.uid()
    where c.id = claim_inspections.claim_id
      and p.role = 'adjuster'
      and (c.adjuster_id = auth.uid() or c.adjuster_id is null)
  )
);

commit;

-- DOWN
begin;

drop policy if exists "adjusters_can_manage_claim_inspections" on public.claim_inspections;
drop policy if exists "claimants_can_schedule_virtual_inspections" on public.claim_inspections;
drop policy if exists "users_can_select_relevant_claim_inspections" on public.claim_inspections;

drop table if exists public.claim_inspections;

commit;