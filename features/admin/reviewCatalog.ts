import type { ReviewQueueItem } from "./schemas";

export type ReviewGroup = {
  key: string;
  title: string;
  children: ReviewGroup[];
  questions: ReviewQueueItem[];
  count: number;
};
function rank(title: string) {
  const text = title.toLowerCase();
  if (text.includes("wright")) return 0;
  if (text.includes("mitchell") && text.includes("leadership")) return 1;
  if (text.includes("mitchell") && text.includes("aerospace")) return 2;
  if (text.includes("earhart")) return 3;
  return 4;
}
export function groupReviewQuestions(items: ReviewQueueItem[]): ReviewGroup[] {
  const exams = new Map<string, ReviewGroup>();
  for (const item of items) {
    const examKey = item.exam_id ?? item.exam_title;
    const exam = exams.get(examKey) ?? {
      key: examKey,
      title: item.exam_title,
      children: [],
      questions: [],
      count: 0,
    };
    exam.count++;
    let parent = exam;
    if (item.module_number) {
      const key = `${examKey}:module:${item.module_number}`;
      let module = exam.children.find((child) => child.key === key);
      if (!module) {
        module = {
          key,
          title: `Module ${item.module_number}${item.module_title ? ` · ${item.module_title}` : ""}`,
          children: [],
          questions: [],
          count: 0,
        };
        exam.children.push(module);
      }
      module.count++;
      parent = module;
    }
    const chapterTitle = item.chapter_title ?? item.topic_title;
    const chapter = item.chapter_number
      ? `Chapter ${item.chapter_number} · ${chapterTitle}`
      : chapterTitle;
    const key = `${parent.key}:chapter:${chapter}`;
    let section = parent.children.find((child) => child.key === key);
    if (!section) {
      section = { key, title: chapter, children: [], questions: [], count: 0 };
      parent.children.push(section);
    }
    section.questions.push(item);
    section.count++;
    exams.set(examKey, exam);
  }
  function sortChildren(group: ReviewGroup) {
    group.children.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
    group.questions.sort((a, b) =>
      (a.external_id ?? a.question_id).localeCompare(b.external_id ?? b.question_id, undefined, {
        numeric: true,
      }),
    );
    group.children.forEach(sortChildren);
  }
  const result = [...exams.values()].sort(
    (a, b) => rank(a.title) - rank(b.title) || a.title.localeCompare(b.title),
  );
  result.forEach(sortChildren);
  return result;
}
