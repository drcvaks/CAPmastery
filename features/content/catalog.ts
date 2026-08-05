import type { ContentExam, ContentTopic } from "../../services/contentService";

type StudyCatalogAccess = {
  exam_id: string;
  topic_id: string;
  available_question_count: number;
};

export type ContentModuleGroup = {
  id: string;
  code: string;
  title: string;
  sortOrder: number;
  topics: ContentTopic[];
};

export function isCatalogPlaceholder(code: string): boolean {
  return code.endsWith("_CATALOG_PENDING");
}

export function filterCatalogForStudyAccess(
  catalog: ContentExam[],
  accessRows: StudyCatalogAccess[],
  requiredQuestionCount = 10,
): ContentExam[] {
  const accessByTopic = new Map(
    accessRows.map((row) => [row.topic_id, row.available_question_count]),
  );
  const totalByExam = accessRows.reduce((totals, row) => {
    totals.set(row.exam_id, (totals.get(row.exam_id) ?? 0) + row.available_question_count);
    return totals;
  }, new Map<string, number>());

  return catalog
    .filter((exam) => (totalByExam.get(exam.id) ?? 0) >= requiredQuestionCount)
    .map((exam) => ({
      ...exam,
      topics: exam.topics.filter(
        (topic) => (accessByTopic.get(topic.id) ?? 0) >= requiredQuestionCount,
      ),
    }));
}

export function groupTopicsByModule(topics: ContentTopic[]): ContentModuleGroup[] {
  const modules = new Map<string, ContentModuleGroup>();

  for (const topic of topics) {
    if (!topic.volume) continue;
    const group = modules.get(topic.volume.id) ?? {
      id: topic.volume.id,
      code: topic.volume.code,
      title: topic.volume.title,
      sortOrder: topic.volume.sort_order,
      topics: [],
    };
    group.topics.push(topic);
    modules.set(group.id, group);
  }

  return [...modules.values()]
    .map((module) => ({
      ...module,
      topics: module.topics.sort(
        (left, right) =>
          (left.chapter?.sort_order ?? left.sort_order) -
            (right.chapter?.sort_order ?? right.sort_order) ||
          left.sort_order - right.sort_order ||
          left.title.localeCompare(right.title),
      ),
    }))
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.title.localeCompare(right.title),
    );
}

export function moduleButtonLabel(module: ContentModuleGroup): string {
  const match = module.code.match(/(?:^|_)M(\d+)(?:_|$)/);
  return match ? `Module ${Number(match[1])}` : module.title;
}

export function chapterButtonLabel(topic: ContentTopic): string {
  const match = (topic.chapter?.code ?? topic.code).match(/(?:^|_)C(\d+)(?:_|$)/);
  const title = topic.chapter?.title ?? topic.title;
  return match ? `Chapter ${Number(match[1])}: ${title}` : title;
}
