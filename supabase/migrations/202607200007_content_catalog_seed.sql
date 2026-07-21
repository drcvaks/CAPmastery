-- Catalog-only seed. It intentionally contains no source documents, passages,
-- questions, answer keys, passing scores, or time limits.
insert into public.programs (
  id, code, title, description, sort_order, status
) values (
  '10000000-0000-4000-8000-000000000001',
  'CAP_CADET',
  'Civil Air Patrol Cadet Program',
  'Initial CAP Mastery study catalog. Detailed source metadata requires owner approval.',
  10,
  'active'
);

insert into public.exams (
  id, program_id, code, title, description, sort_order, status
) values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'MITCHELL_LEADERSHIP',
    'Billy Mitchell Leadership',
    'Leadership study track. Exam settings remain unset until verified against an authorized current source.',
    10,
    'active'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'MITCHELL_AEROSPACE',
    'Billy Mitchell Aerospace',
    'Aerospace study track. Exam settings remain unset until verified against an authorized current source.',
    20,
    'active'
  );

insert into public.courses (
  id, exam_id, code, title, description, sort_order, status
) values
  (
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'LEARN_TO_LEAD',
    'Learn to Lead',
    'Edition, volume, chapter, and objective metadata are pending authorized source review.',
    10,
    'active'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'AEROSPACE_DIMENSIONS',
    'Aerospace Dimensions',
    'Edition, volume, chapter, and objective metadata are pending authorized source review.',
    10,
    'active'
  );

insert into public.topics (
  id, exam_id, course_id, code, title, description, sort_order, status
) values
  (
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'LEADERSHIP_CATALOG_PENDING',
    'Leadership content coming soon',
    'Topic hierarchy will be added only after the owner verifies the source edition and content authorization.',
    10,
    'active'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    'AEROSPACE_CATALOG_PENDING',
    'Aerospace content coming soon',
    'Topic hierarchy will be added only after the owner verifies the source edition and content authorization.',
    10,
    'active'
  );
