/**
 * 슬라이드 순서 계산. DB나 화면에 의존하지 않는 순수 함수만 둔다.
 */

/** `afterId` 바로 다음에 새 항목을 끼워 넣는다. 대상이 없으면 맨 뒤에 붙인다. */
export function insertAfter(ids: string[], newId: string, afterId: string | null): string[] {
  const index = afterId ? ids.indexOf(afterId) : -1;
  if (index === -1) return [...ids, newId];

  const next = [...ids];
  next.splice(index + 1, 0, newId);
  return next;
}

/** 항목 하나를 다른 위치로 옮긴다. 범위를 벗어난 요청은 원본을 그대로 돌려준다. */
export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || fromIndex >= items.length) return items;
  if (toIndex < 0 || toIndex >= items.length) return items;

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/** 두 목록이 같은 구성원을 갖는지 확인한다. 순서 변경 요청이 목록 전체를 담았는지 검증할 때 쓴다. */
export function hasSameMembers(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  const counts = new Map<string, number>();
  for (const value of a) counts.set(value, (counts.get(value) ?? 0) + 1);
  for (const value of b) {
    const remaining = counts.get(value);
    if (!remaining) return false;
    counts.set(value, remaining - 1);
  }

  return true;
}

/** 삭제 후 자동으로 선택할 슬라이드. 뒤 항목을 우선하고 없으면 앞 항목을 고른다. */
export function nextSelectionAfterRemoval(ids: string[], removedId: string): string | null {
  const index = ids.indexOf(removedId);
  if (index === -1) return ids[0] ?? null;

  const remaining = ids.filter((id) => id !== removedId);
  if (remaining.length === 0) return null;

  return remaining[Math.min(index, remaining.length - 1)];
}
