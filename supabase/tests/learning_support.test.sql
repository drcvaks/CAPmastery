begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

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

select * from finish();
rollback;
