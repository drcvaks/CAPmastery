begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

select has_table('private', 'question_learning_support', 'private learning support table exists');
select has_table('private', 'visual_assets', 'private visual asset registry exists');
select has_type('private', 'visual_asset_status', 'visual approval status exists');
select has_column('private', 'question_learning_support', 'short_explanation', 'short explanation is stored');
select has_column('private', 'question_learning_support', 'memory_aid', 'memory aid is stored');
select has_column('private', 'question_learning_support', 'visual_brief', 'internal visual brief is stored');
select has_column('private', 'question_learning_support', 'visual_alt_text', 'visual alt text is required by the model');
select has_column('private', 'visual_assets', 'status', 'visual assets have approval status');
select is(
  has_table_privilege('authenticated', 'private.question_learning_support', 'select'),
  false,
  'authenticated clients cannot select learning support directly'
);
select is(
  has_table_privilege('authenticated', 'private.visual_assets', 'select'),
  false,
  'authenticated clients cannot select visual assets directly'
);
select is(
  has_table_privilege('anon', 'private.question_learning_support', 'select'),
  false,
  'anonymous clients cannot select learning support'
);
select has_function(
  'public',
  'get_study_session_questions',
  array['uuid'],
  'owned session delivery function remains available'
);
select has_function(
  'private',
  'can_read_learning_visual',
  array['text'],
  'answer-aware storage policy helper exists'
);
select has_function(
  'public',
  'admin_register_learning_visual',
  array['text', 'text', 'text', 'integer', 'integer', 'text'],
  'audited visual registration function exists'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.admin_register_learning_visual(text, text, text, integer, integer, text)',
    'execute'
  ),
  true,
  'authenticated administrators can call the protected registration function'
);
select is(
  has_function_privilege(
    'anon',
    'public.admin_register_learning_visual(text, text, text, integer, integer, text)',
    'execute'
  ),
  false,
  'anonymous users cannot call visual registration'
);
select is(
  (select count(*)::integer from storage.buckets where id = 'learning-visuals'),
  1,
  'private learning visual bucket exists'
);
select is(
  (select public from storage.buckets where id = 'learning-visuals'),
  false,
  'learning visual bucket is not public'
);
select is(
  (select file_size_limit::bigint from storage.buckets where id = 'learning-visuals'),
  5242880::bigint,
  'learning visual bucket limits files to five megabytes'
);
select is(
  (select allowed_mime_types from storage.buckets where id = 'learning-visuals'),
  array['image/png']::text[],
  'learning visual bucket accepts PNG files only'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'learning_visuals_select_authorized'),
  1,
  'answer-aware visual read policy exists'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'learning_visuals_insert_admin'),
  1,
  'administrator visual upload policy exists'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'learning_visuals_update_admin'),
  1,
  'administrator visual replacement policy exists'
);

set local role authenticated;
select throws_ok(
  $$select public.admin_register_learning_visual(
    'test_visual', 'assets/cap-visuals/test.png', 'image/png', 320, 240, 'Test visual'
  )$$,
  '42501',
  'Administrator role required',
  'ordinary unauthenticated context cannot register an approved visual'
);

select * from finish();
rollback;
