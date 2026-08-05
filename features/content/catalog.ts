import type { ContentTopic } from "../../services/contentService";

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
