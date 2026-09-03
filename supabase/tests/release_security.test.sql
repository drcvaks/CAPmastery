begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

select is(
  (
    select count(*)::integer
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  ),
  0,
  'every API-exposed public table has row level security enabled'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges
    where table_schema = 'public' and grantee = 'anon'
  ),
  0,
  'anonymous clients have no direct public-table privileges'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_privileges
    where table_schema = 'private' and grantee in ('PUBLIC', 'anon', 'authenticated')
  ),
  0,
  'API roles have no direct private-table privileges'
);

select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  ),
  0,
  'anonymous clients cannot execute public application functions'
);

select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosecdef
      and has_function_privilege('public', p.oid, 'EXECUTE')
  ),
  0,
  'security-definer functions are not executable through inherited PUBLIC grants'
);

select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  ),
  0,
  'anonymous clients cannot execute private helpers'
);

select diag(
  format(
    'public security-definer missing a fixed safe search_path: %s (config: %s)',
    p.oid::regprocedure::text,
    coalesce(array_to_string(p.proconfig, ', '), '<none>')
  )
)
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and not (
    'search_path=""' = any(coalesce(p.proconfig, '{}'::text[]))
    or (
      p.proname = 'rls_auto_enable'
      and p.oid::regprocedure::text = 'rls_auto_enable()'
      and 'search_path=pg_catalog' = any(coalesce(p.proconfig, '{}'::text[]))
    )
  );

with offenders as (
  select
    count(*)::integer as offender_count,
    string_agg(
      format(
        '%s (config: %s)',
        p.oid::regprocedure::text,
        coalesce(array_to_string(p.proconfig, ', '), '<none>')
      ),
      '; ' order by p.oid::regprocedure::text
    ) as offender_list
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prosecdef
    and not (
      'search_path=""' = any(coalesce(p.proconfig, '{}'::text[]))
      or (
        p.proname = 'rls_auto_enable'
        and p.oid::regprocedure::text = 'rls_auto_enable()'
        and 'search_path=pg_catalog' = any(coalesce(p.proconfig, '{}'::text[]))
      )
    )
)
select is(
  offender_count,
  0,
  format(
    'every public security-definer function fixes a safe search path; offenders: %s',
    coalesce(offender_list, 'none')
  )
)
from offenders;

select is(
  (
    select count(*)::integer
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.prosecdef
      and not ('search_path=""' = any(coalesce(p.proconfig, '{}'::text[])))
  ),
  0,
  'every private security-definer function fixes an empty search path'
);

select is(
  has_table_privilege('authenticated', 'private.question_answer_keys', 'SELECT'),
  false,
  'authenticated clients cannot select answer keys'
);

select is(
  has_table_privilege('authenticated', 'private.question_choice_feedback', 'SELECT'),
  false,
  'authenticated clients cannot select choice feedback'
);

select is(
  has_table_privilege('authenticated', 'public.user_roles', 'INSERT,UPDATE,DELETE'),
  false,
  'authenticated clients cannot directly escalate roles'
);

select is(
  has_table_privilege('authenticated', 'public.question_attempts', 'INSERT,UPDATE,DELETE'),
  false,
  'authenticated clients cannot forge attempts or correctness'
);

select is(
  has_table_privilege('authenticated', 'public.student_topic_mastery', 'INSERT,UPDATE,DELETE'),
  false,
  'authenticated clients cannot forge mastery records'
);

select * from finish();
rollback;
