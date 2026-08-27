import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const VALID = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("parseEnv", () => {
  it("NEXT_PUBLIC_SITE_URL이 없으면 로컬 주소를 기본값으로 쓴다", () => {
    const env = parseEnv({ ...VALID, NEXT_PUBLIC_SITE_URL: undefined });
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("Supabase 값을 그대로 통과시킨다", () => {
    const env = parseEnv({ ...VALID, NEXT_PUBLIC_SITE_URL: "https://slide.example.com" });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe("sb_publishable_test");
  });

  it("Supabase 값이 없으면 어떤 변수가 문제인지 알려준다", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("URL 형식이 아니면 거부한다", () => {
    expect(() => parseEnv({ ...VALID, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });
});
