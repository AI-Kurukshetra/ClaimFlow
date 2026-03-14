-- UP
begin;

drop policy if exists "claimants_can_close_approved_claims" on public.claims;
create policy "claimants_can_close_approved_claims"
on public.claims
for update
to authenticated
using (
  claimant_id = auth.uid()
  and status = 'Approved'
)
with check (
  claimant_id = auth.uid()
  and status = 'Closed'
);

commit;

-- DOWN
begin;

drop policy if exists "claimants_can_close_approved_claims" on public.claims;

commit;
