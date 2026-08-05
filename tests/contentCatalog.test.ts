import {
  chapterButtonLabel,
  groupTopicsByModule,
  isCatalogPlaceholder,
  moduleButtonLabel,
} from "../features/content/catalog";
import type { ContentTopic } from "../services/contentService";

function topic({
  id,
  moduleNumber,
  chapterNumber,
  moduleSort,
  chapterSort,
}: {
  id: string;
  moduleNumber: number;
  chapterNumber: number;
  moduleSort: number;
  chapterSort: number;
}): ContentTopic {
  return {
    id,
    exam_id: "20000000-0000-4000-8000-000000000002",
    volume_id: `volume-${moduleNumber}`,
    chapter_id: `chapter-${moduleNumber}-${chapterNumber}`,
    code: `AD_M${moduleNumber}_C${chapterNumber}`,
    title: `Module ${moduleNumber}, Chapter ${chapterNumber}`,
    description: null,
    sort_order: chapterSort,
    volume: {
      id: `volume-${moduleNumber}`,
      code: `AD_M${moduleNumber}`,
      title: `Aerospace Dimensions Module ${moduleNumber}`,
      sort_order: moduleSort,
    },
    chapter: {
      id: `chapter-${moduleNumber}-${chapterNumber}`,
      code: `AD_M${moduleNumber}_C${chapterNumber}`,
      title: `Chapter title ${chapterNumber}`,
      sort_order: chapterSort,
    },
  };
}

describe("Aerospace catalog grouping", () => {
  it("orders modules and their chapters using normalized hierarchy sort values", () => {
    const groups = groupTopicsByModule([
      topic({ id: "m2c1", moduleNumber: 2, chapterNumber: 1, moduleSort: 20, chapterSort: 10 }),
      topic({ id: "m1c3", moduleNumber: 1, chapterNumber: 3, moduleSort: 10, chapterSort: 30 }),
      topic({ id: "m1c1", moduleNumber: 1, chapterNumber: 1, moduleSort: 10, chapterSort: 10 }),
      topic({ id: "m1c2", moduleNumber: 1, chapterNumber: 2, moduleSort: 10, chapterSort: 20 }),
    ]);

    expect(groups.map((group) => moduleButtonLabel(group))).toEqual(["Module 1", "Module 2"]);
    const firstModule = groups[0];
    if (!firstModule) throw new Error("Expected Module 1 group.");
    expect(firstModule.topics.map((item) => item.id)).toEqual(["m1c1", "m1c2", "m1c3"]);
    const firstChapter = firstModule.topics[0];
    if (!firstChapter) throw new Error("Expected Module 1 Chapter 1 topic.");
    expect(chapterButtonLabel(firstChapter)).toBe("Chapter 1: Chapter title 1");
  });

  it("recognizes both original coming-soon topic codes", () => {
    expect(isCatalogPlaceholder("LEADERSHIP_CATALOG_PENDING")).toBe(true);
    expect(isCatalogPlaceholder("AEROSPACE_CATALOG_PENDING")).toBe(true);
    expect(isCatalogPlaceholder("AD_M1_C1")).toBe(false);
  });
});
