import { describe, expect, it } from "vitest";
import { hasSameMembers, insertAfter, moveItem, nextSelectionAfterRemoval } from "./ordering";

describe("insertAfter", () => {
  it("지정한 항목 바로 다음에 넣는다", () => {
    expect(insertAfter(["a", "b", "c"], "new", "a")).toEqual(["a", "new", "b", "c"]);
  });

  it("기준 항목이 없으면 맨 뒤에 붙인다", () => {
    expect(insertAfter(["a", "b"], "new", null)).toEqual(["a", "b", "new"]);
    expect(insertAfter(["a", "b"], "new", "없는id")).toEqual(["a", "b", "new"]);
  });

  it("마지막 항목 다음이면 맨 뒤가 된다", () => {
    expect(insertAfter(["a", "b"], "new", "b")).toEqual(["a", "b", "new"]);
  });
});

describe("moveItem", () => {
  it("항목을 앞뒤로 옮긴다", () => {
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
  });

  it("범위를 벗어나거나 제자리면 원본을 그대로 돌려준다", () => {
    const items = ["a", "b"];
    expect(moveItem(items, 1, 1)).toBe(items);
    expect(moveItem(items, -1, 0)).toBe(items);
    expect(moveItem(items, 0, 5)).toBe(items);
  });
});

describe("hasSameMembers", () => {
  it("순서가 달라도 구성원이 같으면 true다", () => {
    expect(hasSameMembers(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
  });

  it("빠지거나 더해진 항목이 있으면 false다", () => {
    expect(hasSameMembers(["a", "b"], ["a"])).toBe(false);
    expect(hasSameMembers(["a", "b"], ["a", "z"])).toBe(false);
    expect(hasSameMembers(["a", "a"], ["a", "b"])).toBe(false);
  });
});

describe("nextSelectionAfterRemoval", () => {
  it("삭제한 자리의 뒤 항목을 고른다", () => {
    expect(nextSelectionAfterRemoval(["a", "b", "c"], "b")).toBe("c");
  });

  it("마지막을 삭제하면 앞 항목을 고른다", () => {
    expect(nextSelectionAfterRemoval(["a", "b", "c"], "c")).toBe("b");
  });

  it("하나뿐이면 선택할 슬라이드가 없다", () => {
    expect(nextSelectionAfterRemoval(["a"], "a")).toBeNull();
  });
});
