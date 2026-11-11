-- Testers never receive can_review_content(): legacy publication/import RPCs stay denied.
create table private.content_tester_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('question','image')),
  exam_id uuid references public.exams(id) on delete cascade,
  chapter_id uuid,
  created_by uuid not null references public.profiles(id),
  check (chapter_id is null or exam_id is not null),
  unique nulls not distinct(user_id,kind,exam_id,chapter_id)
);
alter table private.content_tester_access enable row level security;
revoke all on private.content_tester_access from public,anon,authenticated;

create table private.content_change_proposals (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id),
  kind text not null check(kind in ('question','image')),
  target text not null,
  before_content jsonb not null,
  proposed_content jsonb not null,
  base_updated_at timestamptz not null,
  upload_path text unique,
  status text not null check(status in ('uploading','pending','approved','rejected','changes_requested')),
  reason text not null check(char_length(reason) between 10 and 1000),
  decision_notes text,
  decided_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
alter table private.content_change_proposals enable row level security;
revoke all on private.content_change_proposals from public,anon,authenticated;
create index content_proposals_author_idx on private.content_change_proposals(author_id,status);

create function private.is_active_content_tester()
returns boolean language sql stable security definer set search_path='' as $$
  select private.has_role('content_tester') and exists(
    select 1 from public.profiles where id=(select auth.uid()) and status='active'
  );
$$;
create function private.tester_can_access_question(p_question_id uuid,p_kind text)
returns boolean language sql stable security definer set search_path='' as $$
  select private.is_active_content_tester() and exists(
    select 1 from public.questions q join public.topics t on t.id=q.topic_id
    join private.content_tester_access a on a.user_id=(select auth.uid()) and a.kind=p_kind
      and (a.exam_id is null or a.exam_id=q.exam_id)
      and (a.chapter_id is null or a.chapter_id=coalesce(t.chapter_id,t.id))
    where q.id=p_question_id
  );
$$;
create function private.tester_can_access_visual(p_key text)
returns boolean language sql stable security definer set search_path='' as $$
  select private.is_active_content_tester() and (
    exists(select 1 from private.content_tester_access a where a.user_id=(select auth.uid())
      and a.kind='image' and a.exam_id is null and a.chapter_id is null)
    or exists(select 1 from private.question_learning_support ls
      where ls.visual_asset_key=p_key and private.tester_can_access_question(ls.question_id,'image'))
  );
$$;
create function private.tester_storage_access(p_path text,p_insert boolean)
returns boolean language sql stable security definer set search_path='' as $$
  select private.is_active_content_tester() and (
    exists(select 1 from private.content_change_proposals p where p.upload_path=p_path
      and p.author_id=(select auth.uid()) and p.kind='image'
      and (not p_insert or p.status='uploading') and private.tester_can_access_visual(p.target))
    or (not p_insert and exists(select 1 from private.visual_assets va
      where va.storage_path=p_path and private.tester_can_access_visual(va.asset_key)))
  );
$$;
revoke all on function private.is_active_content_tester(), private.tester_can_access_question(uuid,text), private.tester_can_access_visual(text), private.tester_storage_access(text,boolean) from public,anon,authenticated;
grant execute on function private.tester_storage_access(text,boolean) to authenticated;

create policy learning_visuals_tester_read on storage.objects for select to authenticated
using(bucket_id='learning-visuals' and private.tester_storage_access(name,false));
create policy learning_visuals_tester_insert on storage.objects for insert to authenticated
with check(bucket_id='learning-visuals' and private.tester_storage_access(name,true));

create function public.admin_content_tester_access(p_user_id uuid,p_grants jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_grant jsonb; v_before jsonb;
begin
  if not private.has_role('admin') then raise exception 'Administrator role required' using errcode='42501'; end if;
  perform 1 from public.profiles where id=p_user_id for update;
  if not found then raise exception 'User not found'; end if;
  if p_grants is not null then
    if jsonb_typeof(p_grants)<>'array' or jsonb_array_length(p_grants)>1000 then raise exception 'Invalid review grants'; end if;
    select coalesce(jsonb_agg(to_jsonb(a)),'[]') into v_before from private.content_tester_access a where user_id=p_user_id;
    delete from private.content_tester_access where user_id=p_user_id;
    for v_grant in select value from jsonb_array_elements(p_grants) loop
      if v_grant->>'kind' not in ('question','image') or v_grant->>'kind' is null then raise exception 'Invalid review type'; end if;
      if nullif(v_grant->>'chapter_id','') is not null and not exists(
        select 1 from public.topics t where t.exam_id=(v_grant->>'exam_id')::uuid
          and coalesce(t.chapter_id,t.id)=(v_grant->>'chapter_id')::uuid
      ) then raise exception 'Chapter does not belong to test'; end if;
      insert into private.content_tester_access(user_id,kind,exam_id,chapter_id,created_by)
      values(p_user_id,v_grant->>'kind',nullif(v_grant->>'exam_id','')::uuid,nullif(v_grant->>'chapter_id','')::uuid,(select auth.uid()))
      on conflict do nothing;
    end loop;
    delete from public.user_roles where user_id=p_user_id and role='content_tester' and scope_type='global';
    if jsonb_array_length(p_grants)>0 then
      insert into public.user_roles(user_id,role,created_by) values(p_user_id,'content_tester',(select auth.uid()));
    end if;
    insert into public.audit_log(actor_id,action,entity_type,entity_id,before_summary,after_summary)
    values((select auth.uid()),'content_tester.access_updated','profile',p_user_id,v_before,p_grants);
  end if;
  return jsonb_build_object(
    'grants',coalesce((select jsonb_agg(jsonb_build_object('kind',a.kind,'exam_id',a.exam_id,'chapter_id',a.chapter_id)) from private.content_tester_access a where user_id=p_user_id),'[]'),
    'chapters',coalesce((select jsonb_agg(to_jsonb(x) order by x.exam_title,x.module_number,x.title) from(
      select distinct e.id exam_id,e.title exam_title,coalesce(t.chapter_id,t.id) chapter_id,
        coalesce(c.title,t.title) title,q.module_number
      from public.questions q join public.exams e on e.id=q.exam_id
      join public.topics t on t.id=q.topic_id left join public.chapters c on c.id=t.chapter_id
    )x),'[]')
  );
end;
$$;

create function public.get_tester_question_catalog()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.is_active_content_tester() then raise exception 'Tester role required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'question_id',q.id,'external_id',q.external_id,'question_text',q.question_text,'exam_title',e.title,'exam_id',e.id,'exam_code',e.code,
    'topic_title',t.title,'chapter_title',coalesce(c.title,t.title),'chapter_number',q.chapter_number,
    'module_number',q.module_number,'module_title',v.title,'review_status',q.review_status,
    'version',q.version,'updated_at',q.updated_at
  ) order by e.title,q.module_number,c.sort_order,q.external_id)
  from public.questions q join public.exams e on e.id=q.exam_id join public.topics t on t.id=q.topic_id
  left join public.chapters c on c.id=t.chapter_id left join public.volumes v on v.id=t.volume_id
  where private.tester_can_access_question(q.id,'question')),'[]');
end;
$$;
create function public.get_tester_question(p_question_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.tester_can_access_question(p_question_id,'question') then raise exception 'Not authorized' using errcode='42501'; end if;
  return private.question_content_snapshot(p_question_id);
end;
$$;
create function public.get_tester_visuals()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.is_active_content_tester() then raise exception 'Tester role required' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
    'asset_key',va.asset_key,'storage_path',va.storage_path,'width',va.width,'height',va.height,
    'alt_text',va.alt_text,'status',va.status,'updated_at',va.updated_at,
    'locations',coalesce((select jsonb_agg(to_jsonb(x)) from (
      select e.id exam_id,e.code exam_code,e.title exam_title,coalesce(c.title,t.title) chapter_title,
        q.module_number,q.chapter_number,count(*)::integer question_count
      from private.question_learning_support ls join public.questions q on q.id=ls.question_id
      join public.exams e on e.id=q.exam_id join public.topics t on t.id=q.topic_id
      left join public.chapters c on c.id=t.chapter_id
      where ls.visual_asset_key=va.asset_key and private.tester_can_access_question(q.id,'image')
      group by e.id,e.code,e.title,c.title,t.title,q.module_number,q.chapter_number
    )x),'[]'::jsonb)
  )) from private.visual_assets va where private.tester_can_access_visual(va.asset_key)),'[]');
end;
$$;

create function public.submit_content_proposal(p_kind text,p_target text,p_payload jsonb,p_reason text,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id uuid:=gen_random_uuid(); v_before jsonb; v_updated timestamptz; v_path text;
begin
  if p_kind='question' then
    if not private.tester_can_access_question(p_target::uuid,'question') then raise exception 'Not authorized' using errcode='42501'; end if;
    select private.question_content_snapshot(q.id),q.updated_at into v_before,v_updated from public.questions q
      where q.id=p_target::uuid and q.review_status in ('draft','in_review','approved');
    if jsonb_typeof(p_payload) is distinct from 'object'
      or nullif(trim(p_payload->>'question_text'),'') is null or nullif(trim(p_payload->>'explanation'),'') is null
      or nullif(trim(p_payload->>'source_reference'),'') is null
      or jsonb_typeof(p_payload->'choices') is distinct from 'array' then raise exception 'Incomplete question proposal'; end if;
    if jsonb_array_length(p_payload->'choices')<>4
      or (select count(distinct c->>'key') from jsonb_array_elements(p_payload->'choices') c
          where c->>'key' in ('A','B','C','D') and jsonb_typeof(c->'text')='string'
            and nullif(trim(c->>'text'),'') is not null and coalesce(jsonb_typeof(c->'feedback'),'string')='string')<>4
      or not exists(
      select 1 from jsonb_array_elements(p_payload->'choices') c where c->>'key'=p_payload->>'correct_letter'
    ) then raise exception 'Invalid choices'; end if;
    if exists(select 1 from jsonb_each(p_payload) entry
      where entry.key<>'choices' and jsonb_typeof(entry.value) <>
        case when entry.key='eligible_for_final_exam' then 'boolean' else 'string' end
    ) then raise exception 'Invalid question field types'; end if;
  elsif p_kind='image' then
    if not private.tester_can_access_visual(p_target) then raise exception 'Not authorized' using errcode='42501'; end if;
    select to_jsonb(va),va.updated_at into v_before,v_updated from private.visual_assets va where asset_key=p_target;
    if nullif(trim(p_payload->>'alt_text'),'') is null or char_length(p_payload->>'alt_text')>1000
      or (p_payload->>'width')::integer not between 1 and 20000
      or (p_payload->>'height')::integer not between 1 and 20000
      or p_payload->>'width' is null or p_payload->>'height' is null then raise exception 'Invalid image metadata'; end if;
    v_path:='assets/cap-visuals/revision-'||v_id||'.png';
  else raise exception 'Invalid proposal kind';
  end if;
  if v_updated is distinct from p_expected_updated_at then raise exception 'Content changed. Reload before proposing corrections.' using errcode='40001'; end if;
  if v_before is null or p_reason is null or char_length(trim(p_reason)) not between 10 and 1000
    or octet_length(p_payload::text)>100000 then raise exception 'Invalid proposal'; end if;
  insert into private.content_change_proposals(id,author_id,kind,target,before_content,proposed_content,base_updated_at,upload_path,status,reason)
  values(v_id,(select auth.uid()),p_kind,p_target,v_before,p_payload,v_updated,v_path,case when p_kind='image' then 'uploading' else 'pending' end,trim(p_reason));
  insert into public.audit_log(actor_id,action,entity_type,entity_id,after_summary)
  values((select auth.uid()),'content_proposal.created','content_proposal',v_id,jsonb_build_object('kind',p_kind,'target',p_target));
  return jsonb_build_object('id',v_id,'upload_path',v_path);
end;
$$;
create function public.finish_content_image_proposal(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_p private.content_change_proposals%rowtype;
begin
  select * into v_p from private.content_change_proposals where id=p_id for update;
  if not found or v_p.author_id is distinct from (select auth.uid()) or not private.tester_can_access_visual(v_p.target)
    or v_p.kind<>'image' or v_p.status<>'uploading' then raise exception 'Not authorized' using errcode='42501'; end if;
  if not exists(select 1 from storage.objects o where bucket_id='learning-visuals' and name=v_p.upload_path
    and o.metadata->>'mimetype'='image/png' and (o.metadata->>'size')::bigint between 1 and 5242880) then raise exception 'Uploaded PNG not found'; end if;
  update private.content_change_proposals set status='pending' where id=p_id;
end;
$$;
create function public.get_content_proposals()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not private.has_role('admin') and not private.is_active_content_tester() then raise exception 'Not authorized' using errcode='42501'; end if;
  return coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('author_name',f.display_name) order by p.created_at desc)
    from private.content_change_proposals p join public.profiles f on f.id=p.author_id
    where private.has_role('admin') or (p.author_id=(select auth.uid()) and
      case when p.kind='question' then private.tester_can_access_question(p.target::uuid,'question') else private.tester_can_access_visual(p.target) end)),'[]');
end;
$$;
create function public.admin_decide_content_proposal(p_id uuid,p_decision text,p_notes text default '',p_ratings jsonb default null)
returns void language plpgsql security definer set search_path='' as $$
declare v_p private.content_change_proposals%rowtype; v_updated timestamptz; v_status public.question_review_status; v_visual jsonb;
begin
  if not private.has_role('admin') then raise exception 'Administrator role required' using errcode='42501'; end if;
  if p_decision not in ('approved','rejected','changes_requested') or p_decision is null
    or p_notes is null or char_length(p_notes)>2000 then raise exception 'Invalid decision'; end if;
  if p_decision='changes_requested' and nullif(trim(p_notes),'') is null then raise exception 'Explain what needs changing'; end if;
  select * into v_p from private.content_change_proposals where id=p_id for update;
  if not found or v_p.status<>'pending' then raise exception 'Pending proposal not found'; end if;
  if p_decision='approved' then
    if v_p.kind='question' then
      select updated_at,review_status into v_updated,v_status from public.questions where id=v_p.target::uuid for update;
      if v_updated is distinct from v_p.base_updated_at or private.question_content_snapshot(v_p.target::uuid) is distinct from v_p.before_content then raise exception 'Content changed since proposal; request a new proposal' using errcode='40001'; end if;
      perform public.reviewer_save_question_with_classification(v_p.target::uuid,v_p.proposed_content,'Approved tester proposal: '||left(v_p.reason,180));
      if v_status='approved' then
        if not coalesce((p_ratings->>'accuracy') ~ '^[1-5]$' and (p_ratings->>'clarity') ~ '^[1-5]$' and (p_ratings->>'source') ~ '^[1-5]$',false) then
          raise exception 'Enter accuracy, clarity, and source ratings from 1 to 5';
        end if;
        perform public.reviewer_submit_question_review(v_p.target::uuid,(p_ratings->>'accuracy')::smallint,(p_ratings->>'clarity')::smallint,(p_ratings->>'source')::smallint,'Administrator approved tester proposal '||v_p.id,'approve'::public.review_decision);
      end if;
    else
      select va.updated_at,to_jsonb(va) into v_updated,v_visual from private.visual_assets va where va.asset_key=v_p.target for update;
      if v_updated is distinct from v_p.base_updated_at or v_visual is distinct from v_p.before_content then raise exception 'Content changed since proposal; request a new proposal' using errcode='40001'; end if;
      perform public.admin_replace_learning_visual(v_p.target,v_p.before_content->>'storage_path',v_p.upload_path,
        (v_p.proposed_content->>'width')::integer,(v_p.proposed_content->>'height')::integer,
        v_p.proposed_content->>'alt_text',left(v_p.reason,500));
    end if;
  end if;
  update private.content_change_proposals set status=p_decision,decided_by=(select auth.uid()),decided_at=now(),decision_notes=p_notes where id=p_id;
  insert into public.audit_log(actor_id,action,entity_type,entity_id,after_summary)
  values((select auth.uid()),'content_proposal.'||p_decision,'content_proposal',p_id,jsonb_build_object('notes',p_notes));
end;
$$;

revoke all on function public.admin_content_tester_access(uuid,jsonb), public.get_tester_question_catalog(),
  public.get_tester_question(uuid), public.get_tester_visuals(), public.submit_content_proposal(text,text,jsonb,text,timestamptz),
  public.finish_content_image_proposal(uuid), public.get_content_proposals(), public.admin_decide_content_proposal(uuid,text,text,jsonb) from public,anon;
grant execute on function public.admin_content_tester_access(uuid,jsonb), public.get_tester_question_catalog(),
  public.get_tester_question(uuid), public.get_tester_visuals(), public.submit_content_proposal(text,text,jsonb,text,timestamptz),
  public.finish_content_image_proposal(uuid), public.get_content_proposals(), public.admin_decide_content_proposal(uuid,text,text,jsonb) to authenticated;
