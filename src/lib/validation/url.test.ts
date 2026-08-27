import { describe, expect, it } from "vitest";
import { isHttpsUrl, normalizeUrlInput } from "./url";

describe("normalizeUrlInput", () => {
  it("스킴이 없으면 https를 붙인다", () => {
    expect(normalizeUrlInput("example.com/path")).toBe("https://example.com/path");
  });

  it("이미 스킴이 있으면 그대로 둔다", () => {
    expect(normalizeUrlInput("https://example.com")).toBe("https://example.com");
    expect(normalizeUrlInput("http://example.com")).toBe("http://example.com");
  });

  it("앞뒤 공백을 없애고, 빈 값은 빈 문자열로 둔다", () => {
    expect(normalizeUrlInput("  https://example.com  ")).toBe("https://example.com");
    expect(normalizeUrlInput("   ")).toBe("");
  });
});

describe("isHttpsUrl", () => {
  it("https 주소만 허용한다", () => {
    expect(isHttpsUrl("https://example.com")).toBe(true);
    expect(isHttpsUrl("http://example.com")).toBe(false);
  });

  it("주소 형식이 아니면 거부한다", () => {
    expect(isHttpsUrl("example.com")).toBe(false);
    expect(isHttpsUrl("")).toBe(false);
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
  });
});
