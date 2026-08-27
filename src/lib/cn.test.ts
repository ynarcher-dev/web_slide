import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("문자열 클래스를 공백으로 합친다", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("falsy 값을 제거한다", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("중첩 배열을 평탄하게 만든다", () => {
    expect(cn("a", ["b", ["c", false]], "d")).toBe("a b c d");
  });

  it("값이 없으면 빈 문자열을 반환한다", () => {
    expect(cn(false, undefined)).toBe("");
  });
});
