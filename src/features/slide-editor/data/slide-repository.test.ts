import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseServerClient } from "@/lib/supabase/types";
import type { Tables } from "@/types/database.types";
import {
  deleteSlide,
  insertSlide,
  listSlides,
  reorderSlides,
  updateSlideFields,
} from "./slide-repository";

const PRESENTATION_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_PRESENTATION_ID = "44444444-4444-4444-8444-444444444444";
const SLIDE_ID = "55555555-5555-4555-8555-555555555555";

type FakeResult = { data: unknown; error: unknown };

type FakeCall = {
  table: string;
  operation: string;
  payload?: unknown;
  filters: Record<string, unknown>;
  rpc?: { name: string; args: unknown };
};

type FakeBuilder = {
  select: () => FakeBuilder;
  insert: (payload: unknown) => FakeBuilder;
  update: (payload: unknown) => FakeBuilder;
  delete: () => FakeBuilder;
  eq: (column: string, value: unknown) => FakeBuilder;
  order: () => FakeBuilder;
  single: () => Promise<FakeResult>;
  maybeSingle: () => Promise<FakeResult>;
  then: (onFulfilled: (value: FakeResult) => unknown) => Promise<unknown>;
};

/** Supabase 쿼리 빌더를 흉내 내어 어떤 테이블에 어떤 조건으로 요청했는지 기록한다. */
function createFakeSupabase(result: FakeResult) {
  const call: FakeCall = { table: "", operation: "select", filters: {} };

  const builder: FakeBuilder = {
    select: () => builder,
    insert: (payload) => {
      call.operation = "insert";
      call.payload = payload;
      return builder;
    },
    update: (payload) => {
      call.operation = "update";
      call.payload = payload;
      return builder;
    },
    delete: () => {
      call.operation = "delete";
      return builder;
    },
    eq: (column, value) => {
      call.filters[column] = value;
      return builder;
    },
    order: () => builder,
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then: (onFulfilled) => Promise.resolve(result).then(onFulfilled),
  };

  const supabase = {
    from: (table: string) => {
      call.table = table;
      return builder;
    },
    rpc: (name: string, args: unknown) => {
      call.rpc = { name, args };
      return Promise.resolve(result);
    },
  };

  return { supabase: supabase as unknown as SupabaseServerClient, call };
}

function slideRow(overrides: Partial<Tables<"slides">> = {}): Tables<"slides"> {
  return {
    id: SLIDE_ID,
    presentation_id: PRESENTATION_ID,
    template: "content",
    sort_order: 1,
    title: "서비스 소개",
    subtitle: "설명",
    author: "",
    page_name: "PRODUCT",
    content_url: "https://example.com",
    image_path: null,
    html_content: null,
    reload_on_enter: false,
    viewport_width: 1920,
    viewport_height: 1080,
    created_at: "2026-08-26T00:00:00Z",
    updated_at: "2026-08-26T01:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  // 실패 경로에서 남기는 서버 로그가 테스트 출력을 덮지 않게 한다.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("listSlides", () => {
  it("프레젠테이션 조건으로 조회하고 도메인 타입으로 바꾼다", async () => {
    const { supabase, call } = createFakeSupabase({ data: [slideRow()], error: null });

    const slides = await listSlides(supabase, PRESENTATION_ID);

    expect(call.table).toBe("slides");
    expect(call.filters).toEqual({ presentation_id: PRESENTATION_ID });
    expect(slides[0].content).toEqual({
      type: "website",
      url: "https://example.com",
      reloadOnEnter: false,
      viewport: { width: 1920, height: 1080 },
    });
  });

  it("URL이 없으면 콘텐츠는 null이다", async () => {
    const { supabase } = createFakeSupabase({
      data: [slideRow({ template: "cover", content_url: null })],
      error: null,
    });

    const slides = await listSlides(supabase, PRESENTATION_ID);

    expect(slides[0].content).toBeNull();
  });

  it("조회에 실패하면 사용자에게 보여줄 메시지로 예외를 던진다", async () => {
    const { supabase } = createFakeSupabase({ data: null, error: { message: "boom" } });

    await expect(listSlides(supabase, PRESENTATION_ID)).rejects.toThrow(
      "슬라이드를 불러오지 못했습니다.",
    );
  });
});

describe("insertSlide", () => {
  it("프레젠테이션, 템플릿, 순서를 함께 저장한다", async () => {
    const { supabase, call } = createFakeSupabase({ data: slideRow(), error: null });

    await insertSlide(supabase, PRESENTATION_ID, "cover", 2);

    expect(call.operation).toBe("insert");
    expect(call.payload).toEqual({
      presentation_id: PRESENTATION_ID,
      template: "cover",
      sort_order: 2,
    });
  });
});

describe("updateSlideFields", () => {
  it("슬라이드 id와 프레젠테이션 id를 함께 조건으로 건다", async () => {
    const { supabase, call } = createFakeSupabase({ data: slideRow(), error: null });

    await updateSlideFields(supabase, PRESENTATION_ID, SLIDE_ID, {
      title: "새 제목",
      subtitle: "새 소제목",
      author: "",
      pageName: "DEMO",
      contentUrl: "https://example.com/next",
      reloadOnEnter: true,
      imagePath: "",
      htmlSource: "",
    });

    expect(call.operation).toBe("update");
    expect(call.payload).toEqual({
      title: "새 제목",
      subtitle: "새 소제목",
      author: "",
      page_name: "DEMO",
      content_url: "https://example.com/next",
      reload_on_enter: true,
      image_path: null,
      html_content: null,
    });
    expect(call.filters).toEqual({ id: SLIDE_ID, presentation_id: PRESENTATION_ID });
  });

  it("빈 URL은 null로 저장한다", async () => {
    const { supabase, call } = createFakeSupabase({ data: slideRow(), error: null });

    await updateSlideFields(supabase, PRESENTATION_ID, SLIDE_ID, {
      title: "",
      subtitle: "",
      author: "",
      pageName: "",
      contentUrl: "",
      reloadOnEnter: false,
      imagePath: "",
      htmlSource: "",
    });

    expect((call.payload as Record<string, unknown>).content_url).toBeNull();
  });

  it("다른 프레젠테이션의 슬라이드는 바뀌지 않아 null이다", async () => {
    const { supabase, call } = createFakeSupabase({ data: null, error: null });

    const updated = await updateSlideFields(supabase, OTHER_PRESENTATION_ID, SLIDE_ID, {
      title: "탈취",
      subtitle: "",
      author: "",
      pageName: "",
      contentUrl: "",
      reloadOnEnter: false,
      imagePath: "",
      htmlSource: "",
    });

    expect(updated).toBeNull();
    expect(call.filters.presentation_id).toBe(OTHER_PRESENTATION_ID);
  });
});

describe("deleteSlide", () => {
  it("삭제된 행이 있으면 true다", async () => {
    const { supabase, call } = createFakeSupabase({ data: [{ id: SLIDE_ID }], error: null });

    expect(await deleteSlide(supabase, PRESENTATION_ID, SLIDE_ID)).toBe(true);
    expect(call.filters).toEqual({ id: SLIDE_ID, presentation_id: PRESENTATION_ID });
  });

  it("대상이 없으면 false다", async () => {
    const { supabase } = createFakeSupabase({ data: [], error: null });

    expect(await deleteSlide(supabase, OTHER_PRESENTATION_ID, SLIDE_ID)).toBe(false);
  });
});

describe("reorderSlides", () => {
  it("DB 함수 한 번으로 순서를 다시 매긴다", async () => {
    const { supabase, call } = createFakeSupabase({ data: null, error: null });

    await reorderSlides(supabase, PRESENTATION_ID, ["a", "b"]);

    expect(call.rpc).toEqual({
      name: "reorder_slides",
      args: { p_presentation_id: PRESENTATION_ID, p_slide_ids: ["a", "b"] },
    });
  });

  it("실패하면 사용자에게 보여줄 메시지로 예외를 던진다", async () => {
    const { supabase } = createFakeSupabase({ data: null, error: { message: "boom" } });

    await expect(reorderSlides(supabase, PRESENTATION_ID, ["a"])).rejects.toThrow(
      "슬라이드 순서를 저장하지 못했습니다.",
    );
  });
});
