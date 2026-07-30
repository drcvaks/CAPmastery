const fs = require("node:fs/promises");
const path = require("node:path");

const { Client } = require("pg");
const {
  canonicalQuestionFamilyCode,
  decodeImportBuffer,
  formatSourceReference,
  normalizeCognitiveLevel,
  normalizeMetadataCode,
  parseImport,
  parseSourcePages,
  questionPurpose,
  splitReinforcementIds,
  validateImport,
} = require("./lib/pilot-import.cjs");

const root = path.resolve(__dirname, "..");
const defaultInput = path.join(
  root,
  "Content",
  "LTL_V1_Chapter_1_Pilot_10_Questions_Complete_Learning_Support.csv",
);
const poolerUrlPath = path.join(root, "supabase", ".temp", "pooler-url");
const CHAPTER_1_CONFIG = {
  expectedCount: 10,
  importPackage: "LTL1_C1_PILOT_10",
  examId: "20000000-0000-4000-8000-000000000001",
  courseId: "30000000-0000-4000-8000-000000000001",
  volumeCode: "LTL_V1",
  volumeTitle: "Learn to Lead, Volume 1",
  volumeSortOrder: 10,
  chapterCode: "LTL_V1_C1",
  chapterTitle: "Character and the Air Force Tradition",
  chapterSortOrder: 10,
  topicCode: "LTL1_C1",
  topicTitle: "Learn to Lead, Volume 1, Chapter 1",
  topicDescription: "Private Chapter 1 pilot content.",
  topicSortOrder: 10,
  sourceExternalReference: "CAP:LTL:V1:C1:PILOT",
  sourceTitle: "Learn to Lead, Volume 1",
};
const CHAPTER_4_CONFIG = {
  expectedCount: 75,
  importPackage: "LTL2_C4_75",
  examId: "20000000-0000-4000-8000-000000000001",
  courseId: "30000000-0000-4000-8000-000000000001",
  volumeCode: "LTL_V2",
  volumeTitle: "Learn to Lead, Volume 2",
  volumeSortOrder: 20,
  chapterCode: "LTL_V2_C4",
  chapterTitle: "The Cadet NCO & The Team",
  chapterSortOrder: 40,
  topicCode: "LTL2_C4",
  topicTitle: "Learn to Lead, Volume 2, Chapter 4",
  topicDescription: "Private Chapter 4 Billy Mitchell Leadership pilot content.",
  topicSortOrder: 40,
  sourceExternalReference: "CAP:LTL:V2:C4:PILOT",
  sourceTitle: "Learn to Lead, Volume 2",
};
const CHAPTER_5_CONFIG = {
  expectedCount: 75,
  importPackage: "LTL2_C5_75",
  examId: "20000000-0000-4000-8000-000000000001",
  courseId: "30000000-0000-4000-8000-000000000001",
  volumeCode: "LTL_V2",
  volumeTitle: "Learn to Lead, Volume 2",
  volumeSortOrder: 20,
  chapterCode: "LTL_V2_C5",
  chapterTitle: "Brainpower for Leadership",
  chapterSortOrder: 50,
  topicCode: "LTL2_C5",
  topicTitle: "Learn to Lead, Volume 2, Chapter 5",
  topicDescription: "Private Chapter 5 Billy Mitchell Leadership pilot content.",
  topicSortOrder: 50,
  sourceExternalReference: "CAP:LTL:V2:C5:PILOT",
  sourceTitle: "Learn to Lead, Volume 2",
};
const CHAPTER_6_CONFIG = {
  expectedCount: 75,
  importPackage: "LTL2_C6_75",
  examId: "20000000-0000-4000-8000-000000000001",
  courseId: "30000000-0000-4000-8000-000000000001",
  volumeCode: "LTL_V2",
  volumeTitle: "Learn to Lead, Volume 2",
  volumeSortOrder: 20,
  chapterCode: "LTL_V2_C6",
  chapterTitle: "The Human Element",
  chapterSortOrder: 60,
  topicCode: "LTL2_C6",
  topicTitle: "Learn to Lead, Volume 2, Chapter 6",
  topicDescription: "Private Chapter 6 Billy Mitchell Leadership pilot content.",
  topicSortOrder: 60,
  sourceExternalReference: "CAP:LTL:V2:C6:PILOT",
  sourceTitle: "Learn to Lead, Volume 2",
};
const CHAPTER_7_CONFIG = {
  expectedCount: 75,
  importPackage: "LTL2_C7_75",
  examId: "20000000-0000-4000-8000-000000000001",
  courseId: "30000000-0000-4000-8000-000000000001",
  volumeCode: "LTL_V2",
  volumeTitle: "Learn to Lead, Volume 2",
  volumeSortOrder: 20,
  chapterCode: "LTL_V2_C7",
  chapterTitle: "Leadership Schools of Thought",
  chapterSortOrder: 70,
  topicCode: "LTL2_C7",
  topicTitle: "Learn to Lead, Volume 2, Chapter 7",
  topicDescription: "Private Chapter 7 Billy Mitchell Leadership pilot content.",
  topicSortOrder: 70,
  sourceExternalReference: "CAP:LTL:V2:C7:PILOT",
  sourceTitle: "Learn to Lead, Volume 2",
};
const CHAPTER_8_CONFIG = {
  expectedCount: 75,
  importPackage: "LTL2_C8_75",
  examId: "20000000-0000-4000-8000-000000000001",
  courseId: "30000000-0000-4000-8000-000000000001",
  volumeCode: "LTL_V2",
  volumeTitle: "Learn to Lead, Volume 2",
  volumeSortOrder: 20,
  chapterCode: "LTL_V2_C8",
  chapterTitle: "Effective Communication",
  chapterSortOrder: 80,
  topicCode: "LTL2_C8",
  topicTitle: "Learn to Lead, Volume 2, Chapter 8",
  topicDescription: "Private Chapter 8 Billy Mitchell Leadership pilot content.",
  topicSortOrder: 80,
  sourceExternalReference: "CAP:LTL:V2:C8:PILOT",
  sourceTitle: "Learn to Lead, Volume 2",
};

function importConfigForPath(inputPath) {
  const filename = path.basename(inputPath);
  if (filename === "LTL_V2_Chapter_8_75_Questions_Complete_Support.csv") {
    return CHAPTER_8_CONFIG;
  }
  if (filename === "LTL_V2_Chapter_7_75_Questions_Complete_Support.csv") {
    return CHAPTER_7_CONFIG;
  }
  if (filename === "LTL_V2_Chapter_6_75_Questions_Complete_Support.csv") {
    return CHAPTER_6_CONFIG;
  }
  if (filename === "LTL_V2_Chapter_5_75_Questions_Complete_Support.csv") {
    return CHAPTER_5_CONFIG;
  }
  if (filename === "LTL_V2_Chapter_4_75_Questions_Complete_Support.csv") {
    return CHAPTER_4_CONFIG;
  }
  return CHAPTER_1_CONFIG;
}

async function one(client, sql, values = []) {
  const result = await client.query(sql, values);
  return result.rows[0];
}

async function ensureHierarchy(client, config) {
  const volume = await one(
    client,
    `insert into public.volumes (course_id, code, title, description, sort_order, status)
     values ($1, $2, $3, $4, $5, 'active')
     on conflict (course_id, code) do update set title = excluded.title
     returning id`,
    [
      config.courseId,
      config.volumeCode,
      config.volumeTitle,
      `Hierarchy created for the authorized ${config.topicTitle} import.`,
      config.volumeSortOrder,
    ],
  );
  const chapter = await one(
    client,
    `insert into public.chapters (course_id, volume_id, code, title, sort_order, status)
     values ($1, $2, $3, $4, $5, 'active')
     on conflict (course_id, volume_id, code) do update set title = excluded.title
     returning id`,
    [config.courseId, volume.id, config.chapterCode, config.chapterTitle, config.chapterSortOrder],
  );
  const topic = await one(
    client,
    `insert into public.topics (
       exam_id, course_id, volume_id, chapter_id, code, title, description, sort_order, status
     ) values (
       $1, $2, $3, $4, $5, $6, $7, $8, 'active'
     )
     on conflict (exam_id, code) do update set
       course_id = excluded.course_id, volume_id = excluded.volume_id,
       chapter_id = excluded.chapter_id, title = excluded.title
     returning id`,
    [
      config.examId,
      config.courseId,
      volume.id,
      chapter.id,
      config.topicCode,
      config.topicTitle,
      config.topicDescription,
      config.topicSortOrder,
    ],
  );
  return topic.id;
}

async function ensureSource(client, actorId, config) {
  const existing = await one(
    client,
    `select id from public.source_documents where external_reference = $1 limit 1`,
    [config.sourceExternalReference],
  );
  if (existing) return existing.id;
  const source = await one(
    client,
    `insert into public.source_documents (
       title, document_type, external_reference, authorization_status, status, created_by
     ) values (
       $1, 'training_manual', $2, 'approved', 'active', $3
     ) returning id`,
    [config.sourceTitle, config.sourceExternalReference, actorId],
  );
  return source.id;
}

async function ensureLearningMetadata(client, row, topicId, sourceId, config) {
  const sourceReference = formatSourceReference(row.source_reference_text, row.source_pages);
  const objectiveCode = normalizeMetadataCode(row.objective_code, 80);
  const conceptCode = normalizeMetadataCode(row.concept_code);
  const familySourceCode = normalizeMetadataCode(row.question_family_code);
  const objective = await one(
    client,
    `insert into public.learning_objectives (topic_id, code, title, status)
     values ($1, $2, $3, 'draft')
     on conflict (topic_id, code) do update set title = excluded.title
     returning id`,
    [topicId, objectiveCode, row.objective_code],
  );
  const concept = await one(
    client,
    `insert into public.concepts (
       topic_id, source_document_id, code, title, source_reference, status
     ) values ($1, $2, $3, $4, $5, 'draft')
     on conflict (topic_id, code) do update set
       source_document_id = excluded.source_document_id,
       title = excluded.title, source_reference = excluded.source_reference
     returning id`,
    [topicId, sourceId, conceptCode, row.concept_code, sourceReference],
  );
  await client.query(
    `insert into public.concept_objectives (concept_id, learning_objective_id)
     values ($1, $2) on conflict do nothing`,
    [concept.id, objective.id],
  );
  const canonicalFamilyCode = canonicalQuestionFamilyCode(row);
  const family = await one(
    client,
    `insert into public.question_families (exam_id, code, source_code, title, status)
     values ($1, $2, $3, $4, 'draft')
     on conflict (exam_id, code) do update set
       source_code = excluded.source_code, title = excluded.title
     returning id`,
    [config.examId, canonicalFamilyCode, familySourceCode, row.question_family_code],
  );
  return { objectiveId: objective.id, conceptId: concept.id, familyId: family.id };
}

async function importQuestion(client, row, actorId, topicId, sourceId, config, summary) {
  const existing = await one(
    client,
    `select id, review_status from public.questions where external_id = $1`,
    [row.external_id],
  );
  if (existing?.review_status === "approved") {
    summary.skipped += 1;
    summary.warnings.push(`${row.external_id}: approved question was not overwritten.`);
    return existing.id;
  }

  const metadata = await ensureLearningMetadata(client, row, topicId, sourceId, config);
  const pages = parseSourcePages(row.source_pages);
  const cognitiveLevel = normalizeCognitiveLevel(row.cognitive_level);
  const purpose = questionPurpose(row.cognitive_level);
  const values = [
    config.examId,
    topicId,
    metadata.objectiveId,
    sourceId,
    pages.start,
    pages.end,
    formatSourceReference(row.source_reference_text, row.source_pages),
    row.question_text,
    row.question_type,
    row.difficulty,
    cognitiveLevel,
    purpose,
    metadata.familyId,
    Number(row.estimated_time_seconds),
    actorId,
    row.external_id,
    row.pilot_batch,
    config.importPackage,
    row.source_status,
    row.question_mode || null,
    row.question_style || null,
  ];
  let question;
  if (existing) {
    question = await one(
      client,
      `update public.questions set
         exam_id=$1, topic_id=$2, learning_objective_id=$3, source_document_id=$4,
         source_page_start=$5, source_page_end=$6, source_reference=$7, question_text=$8,
         question_type=$9, difficulty=$10, cognitive_level=$11, purpose=$12,
         question_family_id=$13, estimated_time_seconds=$14, created_by=$15,
         pilot_batch=$17, import_package=$18, source_status=$19,
         question_mode=$20, question_style=$21,
         review_status='draft', status='draft', approved_by=null, approved_at=null,
         version=version + 1
       where external_id=$16 returning id`,
      values,
    );
    summary.updated += 1;
  } else {
    question = await one(
      client,
      `insert into public.questions (
         exam_id, topic_id, learning_objective_id, source_document_id,
         source_page_start, source_page_end, source_reference, question_text,
         question_type, difficulty, cognitive_level, purpose, question_family_id,
         estimated_time_seconds, created_by, external_id, pilot_batch, import_package,
         source_status, question_mode, question_style, review_status, status
       ) values (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
         'draft','draft'
       ) returning id`,
      values,
    );
    summary.inserted += 1;
  }

  const choiceIds = {};
  for (const [index, key] of ["A", "B", "C", "D"].entries()) {
    const choice = await one(
      client,
      `insert into public.question_choices (question_id, choice_key, choice_text, sort_order)
       values ($1, $2, $3, $4)
       on conflict (question_id, choice_key) do update set
         choice_text = excluded.choice_text, sort_order = excluded.sort_order
       returning id`,
      [question.id, key, row[`choice_${key.toLowerCase()}`], index],
    );
    choiceIds[key] = choice.id;
    await client.query(
      `insert into private.question_choice_feedback (choice_id, feedback_text)
       values ($1, $2)
       on conflict (choice_id) do update set feedback_text = excluded.feedback_text`,
      [choice.id, row[`choice_${key.toLowerCase()}_explanation`]],
    );
  }

  await client.query(
    `insert into private.question_answer_keys (
       question_id, correct_choice_id, explanation, remediation, common_mistake, created_by
     ) values ($1, $2, $3, $4, $5, $6)
     on conflict (question_id) do update set
       correct_choice_id=excluded.correct_choice_id, explanation=excluded.explanation,
       remediation=excluded.remediation, common_mistake=excluded.common_mistake,
       created_by=excluded.created_by`,
    [
      question.id,
      choiceIds[row.correct_letter],
      row.explanation,
      row.remediation_text,
      row.common_mistake,
      actorId,
    ],
  );
  const optional = (value) => value || null;
  if (row.short_explanation) {
    await client.query(
      `insert into private.question_learning_support (
         question_id, short_explanation, feedback_display_version, memory_aid,
         visual_priority, visual_type, visual_display_mode, visual_asset_key,
         visual_brief, visual_caption, visual_alt_text
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       on conflict (question_id) do update set
         short_explanation=excluded.short_explanation,
         feedback_display_version=excluded.feedback_display_version,
         memory_aid=excluded.memory_aid,
         visual_priority=excluded.visual_priority,
         visual_type=excluded.visual_type,
         visual_display_mode=excluded.visual_display_mode,
         visual_asset_key=excluded.visual_asset_key,
         visual_brief=excluded.visual_brief,
         visual_caption=excluded.visual_caption,
         visual_alt_text=excluded.visual_alt_text`,
      [
        question.id,
        row.short_explanation,
        Number(row.feedback_display_version),
        optional(row.memory_aid),
        optional(row.visual_priority),
        optional(row.visual_type),
        optional(row.visual_display_mode),
        optional(row.visual_asset_key),
        optional(row.visual_brief),
        optional(row.visual_caption),
        optional(row.visual_alt_text),
      ],
    );
  }
  await client.query(
    `insert into public.question_concepts (question_id, concept_id, is_primary)
     values ($1, $2, true)
     on conflict (question_id, concept_id) do update set is_primary = true`,
    [question.id, metadata.conceptId],
  );
  return question.id;
}

async function warnForMissingVisualAssets(client, rows, summary) {
  const assetKeys = [...new Set(rows.map((row) => row.visual_asset_key).filter(Boolean))];
  for (const assetKey of assetKeys) {
    const asset = await one(
      client,
      `select asset_key, status::text from private.visual_assets where asset_key=$1`,
      [assetKey],
    );
    if (!asset) {
      summary.warnings.push(
        `${assetKey}: visual metadata imported, but no visual asset is registered; student control hidden.`,
      );
    } else if (asset.status !== "approved") {
      summary.warnings.push(
        `${assetKey}: visual asset is ${asset.status}; student control hidden until approval.`,
      );
    }
  }
}

async function importReinforcements(client, rows, summary) {
  for (const row of rows) {
    const source = await one(client, `select id from public.questions where external_id=$1`, [
      row.external_id,
    ]);
    if (!source) continue;
    for (const targetExternalId of splitReinforcementIds(row.reinforcement_question_ids)) {
      const target = await one(client, `select id from public.questions where external_id=$1`, [
        targetExternalId,
      ]);
      if (!target) {
        summary.warnings.push(
          `${row.external_id}: reinforcement target ${targetExternalId} was not found; link skipped.`,
        );
        continue;
      }
      await client.query(
        `insert into public.question_reinforcements (question_id, reinforcement_question_id)
         values ($1, $2) on conflict do nothing`,
        [source.id, target.id],
      );
    }
  }
}

async function main() {
  const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultInput;
  const config = importConfigForPath(inputPath);
  const expectedCount = process.argv[3] ? Number(process.argv[3]) : config.expectedCount;
  if (!Number.isInteger(expectedCount) || expectedCount < 1) {
    throw new Error("Expected row count must be a positive integer.");
  }
  const rows = parseImport(decodeImportBuffer(await fs.readFile(inputPath)));
  const validation = validateImport(rows, expectedCount);
  if (validation.errors.length > 0) {
    throw new Error(`Import validation failed:\n${validation.errors.join("\n")}`);
  }

  let connectionString;
  try {
    connectionString = (await fs.readFile(poolerUrlPath, "utf8")).trim();
  } catch {
    throw new Error("Link the CAP Mastery Supabase project before importing pilot questions.");
  }
  const connectionUrl = new URL(connectionString);
  if (!connectionUrl.password) {
    if (!process.env.CAP_MASTERY_DB_PASSWORD) {
      throw new Error("Set CAP_MASTERY_DB_PASSWORD only for this process before importing.");
    }
    connectionUrl.password = process.env.CAP_MASTERY_DB_PASSWORD;
  }

  const client = new Client({
    connectionString: connectionUrl.toString(),
    ssl: { rejectUnauthorized: false },
  });
  const summary = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    warnings: validation.warnings.filter((warning) => warning.startsWith("Answer-key ")),
  };
  await client.connect();
  try {
    await client.query("begin");
    const actor = await one(
      client,
      `select p.id
       from public.profiles p
       join public.user_roles r on r.user_id = p.id
       where p.status='active' and r.role in ('admin', 'content_reviewer')
       order by case r.role when 'admin' then 0 else 1 end, p.created_at
       limit 1`,
    );
    if (!actor) throw new Error("Create an active admin or content reviewer before importing.");
    const topicId = await ensureHierarchy(client, config);
    const sourceId = await ensureSource(client, actor.id, config);
    for (const row of rows) {
      await importQuestion(client, row, actor.id, topicId, sourceId, config, summary);
    }
    await importReinforcements(client, rows, summary);
    await warnForMissingVisualAssets(client, rows, summary);
    await client.query("commit");
  } catch (error) {
    summary.failed = rows.length;
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }

  process.stdout.write(
    `${JSON.stringify({ ...summary, warnings: summary.warnings.length }, null, 2)}\n`,
  );
  for (const warning of summary.warnings) process.stdout.write(`WARNING: ${warning}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Pilot import failed."}\n`);
  process.exitCode = 1;
});
