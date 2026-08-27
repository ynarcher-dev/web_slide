import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseServerClient } from "@/lib/supabase/types";
import type { Tables } from "@/types/database.types";
import {
  deletePresentation,
  getPresentationById,
  getPublicPresentationByShareId,
  insertPresentation,
  listPresentations,
  updatePresentationSettings,
  updatePresentationTitle,
} from "./presentation-repository";

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";
const PRESENTATION_ID = "33333333-3333-4333-8333-333333333333";
const SHARE_ID = "44444444-4444-4444-8444-444444444444";

type FakeResult = { data: unknown; error: unknown };

type FakeCall = {
  table: string;
  operation: string;
  payload?: unknown;
  filters: Record<string, unknown>;
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
  };

  return { supabase: supabase as unknown as SupabaseServerClient, call };
}

function presentationRow(
  overrides: Partial<Tables<"presentations">> = {},
): Tables<"presentations"> {
  return {
    id: PRESENTATION_ID,
    owner_id: OWNER_ID,
    title: "서비스 소개",
    brand_color: "#E42317",
    cover_tint: 12,
    footer_text: "Copyright © 2026 Y&ARCHER",
    show_page_number: true,
    is_public: false,
    share_id: SHARE_ID,
    created_at: "2026-08-26T00:00:00Z",
    updated_at: "2026-08-26T01:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  // 실패 경로에서 남기는 서버 로그가 테스트 출력을 덮지 않게 한다.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("listPresentations", () => {
  it("소유자 조건으로 조회하고 도메인 타입으로 바꾼다", async () => {
    const { supabase, call } = createFakeSupabase({ data: [presentationRow()], error: null });

    const presentations = await listPresentations(supabase, OWNER_ID);

    expect(call.table).toBe("presentations");
    expect(call.filters).toEqual({ owner_id: OWNER_ID });
    expect(presentations).toHaveLength(1);
    expect(presentations[0].theme).toEqual({
      brandColor: "#E42317",
      coverTint: 12,
      footerText: "Copyright © 2026 Y&ARCHER",
      showPageNumber: true,
    });
  });

  it("조회에 실패하면 사용자에게 보여줄 메시지로 예외를 던진다", async () => {
    const { supabase } = createFakeSupabase({ data: null, error: { message: "boom" } });

    await expect(listPresentations(supabase, OWNER_ID)).rejects.toThrow(
      "프레젠테이션 목록을 불러오지 못했습니다.",
    );
  });
});

describe("getPresentationById", () => {
  it("id와 소유자를 함께 조건으로 건다", async () => {
    const { supabase, call } = createFakeSupabase({ data: presentationRow(), error: null });

    const presentation = await getPresentationById(supabase, PRESENTATION_ID, OWNER_ID);

    expect(call.filters).toEqual({ id: PRESENTATION_ID, owner_id: OWNER_ID });
    expect(presentation?.id).toBe(PRESENTATION_ID);
  });

  it("다른 사용자의 자료는 null로 돌려준다", async () => {
    const { supabase, call } = createFakeSupabase({ data: null, error: null });

    expect(await getPresentationById(supabase, PRESENTATION_ID, OTHER_ID)).toBeNull();
    expect(call.filters.owner_id).toBe(OTHER_ID);
  });
});

describe("getPublicPresentationByShareId", () => {
  it("공유 식별자와 공개 여부를 함께 조건으로 건다", async () => {
    const { supabase, call } = createFakeSupabase({
      data: presentationRow({ is_public: true }),
      error: null,
    });

    const presentation = await getPublicPresentationByShareId(supabase, SHARE_ID);

    expect(call.table).toBe("presentations");
    expect(call.filters).toEqual({ share_id: SHARE_ID, is_public: true });
    expect(presentation?.isPublic).toBe(true);
  });

  it("비공개 자료는 조건에 걸리지 않아 null이다", async () => {
    const { supabase } = createFakeSupabase({ data: null, error: null });

    expect(await getPublicPresentationByShareId(supabase, SHARE_ID)).toBeNull();
  });
});

describe("insertPresentation", () => {
  it("소유자를 함께 저장한다", async () => {
    const { supabase, call } = createFakeSupabase({ data: presentationRow(), error: null });

    await insertPresentation(supabase, OWNER_ID, "새 자료");

    expect(call.operation).toBe("insert");
    expect(call.payload).toEqual({ owner_id: OWNER_ID, title: "새 자료" });
  });
});

describe("updatePresentationTitle", () => {
  it("소유자 조건을 붙여 수정한다", async () => {
    const { supabase, call } = createFakeSupabase({
      data: presentationRow({ title: "바뀐 제목" }),
      error: null,
    });

    const updated = await updatePresentationTitle(supabase, PRESENTATION_ID, OWNER_ID, "바뀐 제목");

    expect(call.operation).toBe("update");
    expect(call.payload).toEqual({ title: "바뀐 제목" });
    expect(call.filters).toEqual({ id: PRESENTATION_ID, owner_id: OWNER_ID });
    expect(updated?.title).toBe("바뀐 제목");
  });

  it("바뀐 행이 없으면 null이다", async () => {
    const { supabase } = createFakeSupabase({ data: null, error: null });

    expect(await updatePresentationTitle(supabase, PRESENTATION_ID, OTHER_ID, "탈취")).toBeNull();
  });
});

describe("updatePresentationSettings", () => {
  it("도메인 설정을 DB 컬럼 이름으로 바꿔 저장한다", async () => {
    const { supabase, call } = createFakeSupabase({ data: presentationRow(), error: null });

    await updatePresentationSettings(supabase, PRESENTATION_ID, OWNER_ID, {
      brandColor: "#123456",
      coverTint: 40,
      footerText: "푸터",
      showPageNumber: false,
      isPublic: true,
    });

    expect(call.payload).toEqual({
      brand_color: "#123456",
      cover_tint: 40,
      footer_text: "푸터",
      show_page_number: false,
      is_public: true,
    });
    expect(call.filters).toEqual({ id: PRESENTATION_ID, owner_id: OWNER_ID });
  });
});

describe("deletePresentation", () => {
  it("지운 행이 있으면 true다", async () => {
    const { supabase, call } = createFakeSupabase({ data: [{ id: PRESENTATION_ID }], error: null });

    expect(await deletePresentation(supabase, PRESENTATION_ID, OWNER_ID)).toBe(true);
    expect(call.operation).toBe("delete");
    expect(call.filters).toEqual({ id: PRESENTATION_ID, owner_id: OWNER_ID });
  });

  it("다른 사용자의 자료는 지워지지 않아 false다", async () => {
    const { supabase } = createFakeSupabase({ data: [], error: null });

    expect(await deletePresentation(supabase, PRESENTATION_ID, OTHER_ID)).toBe(false);
  });
});
