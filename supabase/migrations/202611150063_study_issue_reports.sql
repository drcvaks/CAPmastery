alter table public.question_reports
  add column categories text[] not null default '{}',
  add column question_version integer,
  add column session_question_id uuid references public.study_session_questions(id) on delete set null;

create unique index question_reports_one_per_encounter
  on public.question_reports(reporter_id, session_question_id)
  where session_question_id is not null;

drop policy reports_select_owner_or_reviewer on public.question_reports;
drop policy reports_insert_owner on public.question_reports;
drop policy reports_update_reviewer on public.question_reports;
create policy reports_select_owner on public.question_reports for select to authenticated
  using (reporter_id = (select auth.uid()));
revoke insert, update on public.question_reports from authenticated;

create function public.submit_study_issue(p_session_question_id uuid, p_categories text[], p_details text)
returns void language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid := (select auth.uid());
  v_question uuid;
  v_version integer;
  v_details text := regexp_replace(coalesce(p_details,''), '^\s+|\s+$', '', 'g');
  v_category public.question_report_type;
begin
  if not private.has_role('student') or not exists (
    select 1 from public.profiles where id=v_actor and status='active'
  ) then raise exception 'Not authorized' using errcode='42501'; end if;

  select sq.question_id, sq.question_version into v_question, v_version
  from public.study_session_questions sq
  join public.study_sessions s on s.id=sq.session_id
  where sq.id=p_session_question_id and s.student_id=v_actor and s.mode='study'
    and exists (select 1 from public.question_attempts a
      where a.session_question_id=sq.id and a.student_id=v_actor);
  if not found then raise exception 'Not authorized' using errcode='42501'; end if;

  if coalesce(cardinality(p_categories),0) not between 1 and 7
    or exists(select 1 from unnest(p_categories) c where c is null or c not in
      ('answer','explanation','source','image','mnemonic','wording','other'))
    or char_length(v_details)>500 or ('other'=any(p_categories) and v_details='') then
    raise exception 'Invalid report categories or details' using errcode='22023';
  end if;
  v_category := (case p_categories[1] when 'answer' then 'incorrect_answer'
    when 'explanation' then 'poor_explanation' when 'source' then 'source_mismatch'
    when 'wording' then 'unclear_wording' when 'image' then 'formatting_problem'
    else 'other' end)::public.question_report_type;
  insert into public.question_reports(question_id,reporter_id,report_type,details,categories,question_version,session_question_id)
    values(v_question,v_actor,v_category,coalesce(nullif(v_details,''),'No additional details.'),
      array(select distinct c from unnest(p_categories) c order by c),v_version,p_session_question_id)
    on conflict (reporter_id,session_question_id) where session_question_id is not null do nothing;
end;
$$;

create function public.admin_study_issues(p_status public.question_report_status, p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.has_role('admin') then raise exception 'Not authorized' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id)
    from (
      select r.id,r.question_id,r.question_version,r.categories,r.report_type,r.details,r.status,r.created_at,
        p.display_name as reporter_name,u.email as reporter_email,q.question_text,q.version as current_version,
        e.title as exam_title,t.title as topic_title
      from public.question_reports r join public.profiles p on p.id=r.reporter_id
      join auth.users u on u.id=p.id join public.questions q on q.id=r.question_id
      join public.exams e on e.id=q.exam_id join public.topics t on t.id=q.topic_id
      where r.status=p_status
      order by r.created_at desc,r.id limit 25 offset greatest(p_offset,0)
    ) x), '[]'::jsonb);
end;
$$;

create function public.admin_study_issue_snapshot(p_report_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.has_role('admin') then raise exception 'Not authorized' using errcode='42501'; end if;
  return (select case when q.version=r.question_version then private.question_content_snapshot(q.id)
    else v.snapshot end
    from public.question_reports r join public.questions q on q.id=r.question_id
    left join public.question_versions v on v.question_id=q.id and v.version=r.question_version
    where r.id=p_report_id);
end;
$$;

create function public.admin_set_study_issue_status(p_report_id uuid,p_status public.question_report_status)
returns void language plpgsql security definer set search_path='' as $$
declare v_previous public.question_report_status;
begin
  if not private.has_role('admin') then raise exception 'Not authorized' using errcode='42501'; end if;
  select status into v_previous from public.question_reports where id=p_report_id for update;
  if not found then raise exception 'Report not found' using errcode='P0002'; end if;
  if v_previous=p_status then return; end if;
  update public.question_reports set status=p_status,
    resolved_by=case when p_status in ('resolved','dismissed') then (select auth.uid()) end,
    resolved_at=case when p_status in ('resolved','dismissed') then now() end
    where id=p_report_id;
  insert into public.audit_log(actor_id,action,entity_type,entity_id,before_summary,after_summary)
    values((select auth.uid()),'question_report.status_updated','question_report',p_report_id,
      jsonb_build_object('status',v_previous),jsonb_build_object('status',p_status));
end;
$$;

revoke all on function public.submit_study_issue(uuid,text[],text),
  public.admin_study_issues(public.question_report_status,integer),
  public.admin_study_issue_snapshot(uuid),
  public.admin_set_study_issue_status(uuid,public.question_report_status) from public,anon,authenticated;
grant execute on function public.submit_study_issue(uuid,text[],text),
  public.admin_study_issues(public.question_report_status,integer),
  public.admin_study_issue_snapshot(uuid),
  public.admin_set_study_issue_status(uuid,public.question_report_status) to authenticated;
