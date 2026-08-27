import { describe, expect, it, vi } from "vitest";
import type { SupabaseServerClient } from "@/lib/supabase/types";
import { removePresentationImages, removeSlideImageByPath } from "./slide-image-cleanup";

const PRESENTATION_ID = "11111111-1111-4111-8111-111111111111";

function createFakeStorage(
  listResult: { data: { name: string }[] | null; error: unknown },
  removeResult: { error: unknown } = { error: null },
) {
  const list = vi.fn(async () => listResult);
  const remove = vi.fn(async () => removeResult);
  const from = vi.fn(() => ({ list, remove }));

  return {
    supabase: { storage: { from } } as unknown as SupabaseServerClient,
    from,
    list,
    remove,
  };
}

describe("removePresentationImages", () => {
  it("프레젠테이션 폴더의 파일을 모두 지운다", async () => {
    const fake = createFakeStorage({ data: [{ name: "a.png" }, { name: "b.png" }], error: null });

    await removePresentationImages(fake.supabase, PRESENTATION_ID);

    expect(fake.from).toHaveBeenCalledWith("slide-images");
    expect(fake.list).toHaveBeenCalledWith(PRESENTATION_ID);
    expect(fake.remove).toHaveBeenCalledWith([
      `${PRESENTATION_ID}/a.png`,
      `${PRESENTATION_ID}/b.png`,
    ]);
  });

  it("지울 파일이 없으면 삭제를 요청하지 않는다", async () => {
    const fake = createFakeStorage({ data: [], error: null });

    await removePresentationImages(fake.supabase, PRESENTATION_ID);

    expect(fake.remove).not.toHaveBeenCalled();
  });

  it("목록 조회에 실패해도 예외를 던지지 않는다", async () => {
    const fake = createFakeStorage({ data: null, error: new Error("실패") });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(removePresentationImages(fake.supabase, PRESENTATION_ID)).resolves.toBeUndefined();
    expect(fake.remove).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});

describe("removeSlideImageByPath", () => {
  it("경로가 있으면 그 파일만 지운다", async () => {
    const fake = createFakeStorage({ data: [], error: null });

    await removeSlideImageByPath(fake.supabase, `${PRESENTATION_ID}/a.png`);

    expect(fake.remove).toHaveBeenCalledWith([`${PRESENTATION_ID}/a.png`]);
  });

  it("경로가 없으면 아무것도 하지 않는다", async () => {
    const fake = createFakeStorage({ data: [], error: null });

    await removeSlideImageByPath(fake.supabase, null);

    expect(fake.from).not.toHaveBeenCalled();
  });
});
