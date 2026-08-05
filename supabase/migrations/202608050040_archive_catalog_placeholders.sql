update public.topics
set status = 'archived',
    updated_at = now()
where code in ('LEADERSHIP_CATALOG_PENDING', 'AEROSPACE_CATALOG_PENDING')
  and status <> 'archived';

comment on table public.topics is
  'Study topics. Initial catalog placeholder topics are archived once real Leadership and Aerospace content exists.';
