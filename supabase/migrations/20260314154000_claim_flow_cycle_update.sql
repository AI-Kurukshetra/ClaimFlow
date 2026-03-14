-- UP
begin;

alter table public.claims
  drop constraint if exists claims_status_check;

update public.claims
set status = case lower(trim(status))
  when 'intake' then 'Reviewing'
  when 'reviewing' then 'Reviewing'
  when 'detailsrequested' then 'DetailsRequested'
  when 'details_requested' then 'DetailsRequested'
  when 'details requested' then 'DetailsRequested'
  when 'estimated' then 'Estimated'
  when 'approved' then 'Approved'
  when 'closed' then 'Closed'
  else 'Reviewing'
end;

alter table public.claims
  add constraint claims_status_check
  check (status in ('Intake', 'Reviewing', 'DetailsRequested', 'Estimated', 'Approved', 'Closed'));

drop policy if exists "claimants_can_respond_to_details_requests" on public.claims;
create policy "claimants_can_respond_to_details_requests"
on public.claims
for update
to authenticated
using (
  claimant_id = auth.uid()
  and status = 'DetailsRequested'
)
with check (
  claimant_id = auth.uid()
  and status = 'Reviewing'
);

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

-- DOWN
begin;

drop policy if exists "claimants_can_request_higher_amount_review" on public.claims;
drop policy if exists "claimants_can_respond_to_details_requests" on public.claims;

alter table public.claims
  drop constraint if exists claims_status_check;

update public.claims
set status = case lower(trim(status))
  when 'intake' then 'Intake'
  when 'reviewing' then 'Reviewing'
  when 'detailsrequested' then 'Reviewing'
  when 'details_requested' then 'Reviewing'
  when 'details requested' then 'Reviewing'
  when 'estimated' then 'Estimated'
  when 'approved' then 'Approved'
  when 'closed' then 'Closed'
  else 'Reviewing'
end;

alter table public.claims
  add constraint claims_status_check
  check (status in ('Intake', 'Reviewing', 'Estimated', 'Approved', 'Closed'));

commit;
