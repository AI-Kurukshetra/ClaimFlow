-- UP
begin;

drop policy if exists "claimants_can_request_higher_amount_review" on public.claims;
create policy "claimants_can_request_higher_amount_review"
on public.claims
for update
to authenticated
using (
  claimant_id = auth.uid()
  and status = 'Approved'
)
with check (
  claimant_id = auth.uid()
  and status = 'Estimated'
);

commit;

-- DOWN
begin;

drop policy if exists "claimants_can_request_higher_amount_review" on public.claims;
create policy "claimants_can_request_higher_amount_review"
on public.claims
for update
to authenticated
using (
  claimant_id = auth.uid()
  and status = 'Approved'
)
with check (
  claimant_id = auth.uid()
  and status = 'Reviewing'
);

commit;
