export function packetGroupIdentity(examTitle: string) {
  const normalized = examTitle.toLowerCase();
  if (normalized.includes("wright brothers")) {
    return { key: "wright-brothers", title: "Wright Brothers", order: 0 };
  }
  if (normalized.includes("billy mitchell") && normalized.includes("leadership")) {
    return { key: "mitchell-leadership", title: "Billy Mitchell Leadership", order: 1 };
  }
  if (normalized.includes("billy mitchell") && normalized.includes("aerospace")) {
    return { key: "mitchell-aerospace", title: "Billy Mitchell Aerospace", order: 2 };
  }
  if (normalized.includes("earhart")) {
    return { key: "earhart", title: "Earhart", order: 3 };
  }
  return { key: `other-${examTitle}`, title: examTitle, order: 100 };
}
