alter table private.question_learning_support
  drop constraint question_learning_support_visual_type_check;

alter table private.question_learning_support
  add constraint question_learning_support_visual_type_check
  check (visual_type is null or visual_type ~ '^[a-z][a-z0-9_-]{1,79}$');

comment on constraint question_learning_support_visual_type_check
on private.question_learning_support is 'Allows controlled lowercase visual type keys containing underscores or hyphens.';
