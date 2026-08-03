do $$
begin
  update public.practice_test_blueprints
  set time_limit_seconds = 3600
  where code = 'MITCHELL_LEADERSHIP_FULL_50'
    and selection_strategy = 'mitchell_full_exam';

  if not found then
    raise exception 'Mitchell full-exam blueprint not found' using errcode = 'P0002';
  end if;
end;
$$;

comment on column public.practice_test_blueprints.time_limit_seconds is
  'Default timer copied into each new practice session; the Mitchell 50-question blueprint uses 3600 seconds.';
