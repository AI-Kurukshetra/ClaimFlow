-- UP
begin;

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
      and (
        (claim_inspections.reason = 'additional_details' and c.status = 'DetailsRequested')
        or (claim_inspections.reason = 'higher_amount_review' and c.status in ('Approved', 'Estimated'))
      )
  )
);

commit;

-- DOWN
begin;

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

commit;