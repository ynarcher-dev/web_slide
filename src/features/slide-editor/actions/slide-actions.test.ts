import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Slide } from "@/types/domain";

/**
 * 권한과 순서 계산에 초점을 둔 테스트다.
 *
 * Server Action은 화면을 거치지 않고 직접 호출될 수 있으므로
 * 로그인 확인과 프레젠테이션 소유권 확인이 항상 앞서는지 확인한다.
 */

const { getCurrentUser, createSupabaseServerClient } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));
const presentationRepository = vi.hoisted(() => ({ getPresentationById: vi.fn() }));
const slideRepository = vi.hoisted(() => ({
  listSlides: vi.fn(),
  insertSlide: vi.fn(),
  updateSlideFields: vi.fn(),
  deleteSlide: vi.fn(),
  reorderSlides: vi.fn(),
}));
const { redirect, revalidatePath } = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    // 실제 redirect()도 예외를 던져 이후 코드를 실행하지 않는다.
    throw new Error(`REDIRECT:${path}`);
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ getCurrentUser, createSupabaseServerClient }));
vi.mock("@/features/presentations/data/presentation-repository", () => presentationRepository);
vi.mock("../data/slide-repository", () => slideRepository);
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath }));

import {
  createSlideAction,
  deleteSlideAction,
  reorderSlidesAction,
  updateSlideAction,
} from "./slide-actions";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PRESENTATION_ID = "33333333-3333-4333-8333-333333333333";
const SLIDE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const SLIDE_B = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";
const SLIDE_NEW = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3";

function slide(id: string, sortOrder: number): Slide {
  return {
    id,
    presentationId: PRESENTATION_ID,
    template: "content",
    sortOrder,
    title: "",
    subtitle: "",
    author: "",
    pageName: "",
    content: null,
    image: null,
    html: null,
  };
}

const FIELDS = {
  title: "제목",
  subtitle: "",
  author: "",
  pageName: "",
  contentUrl: "",
  reloadOnEnter: false,
  imagePath: "",
  htmlSource: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: USER_ID });
  createSupabaseServerClient.mockResolvedValue({ marker: "supabase" });
  presentationRepository.getPresentationById.mockResolvedValue({ id: PRESENTATION_ID });
  slideRepository.listSlides.mockResolvedValue([slide(SLIDE_A, 0), slide(SLIDE_B, 1)]);
  slideRepository.insertSlide.mockResolvedValue(slide(SLIDE_NEW, 2));
  slideRepository.updateSlideFields.mockResolvedValue(slide(SLIDE_A, 0));
  slideRepository.deleteSlide.mockResolvedValue(true);
  slideRepository.reorderSlides.mockResolvedValue(undefined);
});

describe("로그인 검증", () => {
  it("비로그인 사용자의 생성 요청은 로그인 화면으로 보내고 DB에 접근하지 않는다", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(
      createSlideAction({ presentationId: PRESENTATION_ID, template: "cover" }),
    ).rejects.toThrow("REDIRECT:/login");
    expect(slideRepository.insertSlide).not.toHaveBeenCalled();
  });

  it("비로그인 사용자의 삭제 요청도 로그인 화면으로 보낸다", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(
      deleteSlideAction({ presentationId: PRESENTATION_ID, slideId: SLIDE_A }),
    ).rejects.toThrow("REDIRECT:/login");
    expect(slideRepository.deleteSlide).not.toHaveBeenCalled();
  });
});

describe("소유권 검증", () => {
  it("소유자가 아니면 슬라이드를 만들지 않는다", async () => {
    presentationRepository.getPresentationById.mockResolvedValue(null);

    const result = await createSlideAction({
      presentationId: PRESENTATION_ID,
      template: "content",
    });

    expect(result).toEqual({
      status: "error",
      message: "프레젠테이션을 찾을 수 없거나 권한이 없습니다.",
    });
    expect(slideRepository.insertSlide).not.toHaveBeenCalled();
  });

  it("소유자가 아니면 슬라이드를 저장하지 않는다", async () => {
    presentationRepository.getPresentationById.mockResolvedValue(null);

    const result = await updateSlideAction({
      presentationId: PRESENTATION_ID,
      slideId: SLIDE_A,
      fields: FIELDS,
    });

    expect(result.status).toBe("error");
    expect(slideRepository.updateSlideFields).not.toHaveBeenCalled();
  });

  it("소유권 확인은 항상 현재 사용자 id로 한다", async () => {
    await updateSlideAction({
      presentationId: PRESENTATION_ID,
      slideId: SLIDE_A,
      fields: FIELDS,
    });

    expect(presentationRepository.getPresentationById).toHaveBeenCalledWith(
      expect.anything(),
      PRESENTATION_ID,
      USER_ID,
    );
  });
});

describe("createSlideAction", () => {
  it("선택한 슬라이드 다음 위치로 순서를 다시 매긴다", async () => {
    const result = await createSlideAction({
      presentationId: PRESENTATION_ID,
      template: "content",
      afterSlideId: SLIDE_A,
    });

    expect(slideRepository.reorderSlides).toHaveBeenCalledWith(expect.anything(), PRESENTATION_ID, [
      SLIDE_A,
      SLIDE_NEW,
      SLIDE_B,
    ]);
    expect(result.status).toBe("success");
    if (result.status === "success") expect(result.createdSlideId).toBe(SLIDE_NEW);
  });

  it("기준 슬라이드가 없으면 맨 뒤에 붙인다", async () => {
    await createSlideAction({ presentationId: PRESENTATION_ID, template: "cover" });

    expect(slideRepository.reorderSlides).toHaveBeenCalledWith(expect.anything(), PRESENTATION_ID, [
      SLIDE_A,
      SLIDE_B,
      SLIDE_NEW,
    ]);
  });
});

describe("updateSlideAction", () => {
  it("다른 프레젠테이션의 이미지 경로는 저장하지 않는다", async () => {
    const result = await updateSlideAction({
      presentationId: PRESENTATION_ID,
      slideId: SLIDE_A,
      fields: { ...FIELDS, imagePath: "99999999-9999-4999-8999-999999999999/photo.png" },
    });

    expect(result.status).toBe("error");
    expect(slideRepository.updateSlideFields).not.toHaveBeenCalled();
  });

  it("자기 프레젠테이션의 이미지 경로는 저장한다", async () => {
    await updateSlideAction({
      presentationId: PRESENTATION_ID,
      slideId: SLIDE_A,
      fields: { ...FIELDS, imagePath: `${PRESENTATION_ID}/photo.png` },
    });

    expect(slideRepository.updateSlideFields).toHaveBeenCalledWith(
      expect.anything(),
      PRESENTATION_ID,
      SLIDE_A,
      expect.objectContaining({ imagePath: `${PRESENTATION_ID}/photo.png` }),
    );
  });

  it("https가 아닌 주소는 저장하지 않는다", async () => {
    const result = await updateSlideAction({
      presentationId: PRESENTATION_ID,
      slideId: SLIDE_A,
      fields: { ...FIELDS, contentUrl: "http://example.com" },
    });

    expect(result.status).toBe("error");
    expect(slideRepository.updateSlideFields).not.toHaveBeenCalled();
  });

  it("스킴이 없는 주소는 https를 붙여 저장한다", async () => {
    await updateSlideAction({
      presentationId: PRESENTATION_ID,
      slideId: SLIDE_A,
      fields: { ...FIELDS, contentUrl: "example.com" },
    });

    expect(slideRepository.updateSlideFields).toHaveBeenCalledWith(
      expect.anything(),
      PRESENTATION_ID,
      SLIDE_A,
      expect.objectContaining({ contentUrl: "https://example.com" }),
    );
  });
});

describe("reorderSlidesAction", () => {
  it("목록 전체를 담은 요청만 처리한다", async () => {
    const result = await reorderSlidesAction({
      presentationId: PRESENTATION_ID,
      orderedSlideIds: [SLIDE_B, SLIDE_A],
    });

    expect(result.status).toBe("success");
    expect(slideRepository.reorderSlides).toHaveBeenCalledWith(expect.anything(), PRESENTATION_ID, [
      SLIDE_B,
      SLIDE_A,
    ]);
  });

  it("목록 일부만 담긴 요청은 거부한다", async () => {
    const result = await reorderSlidesAction({
      presentationId: PRESENTATION_ID,
      orderedSlideIds: [SLIDE_A],
    });

    expect(result.status).toBe("error");
    expect(slideRepository.reorderSlides).not.toHaveBeenCalled();
  });
});

describe("deleteSlideAction", () => {
  it("삭제 후 남은 슬라이드의 순서를 다시 매긴다", async () => {
    slideRepository.listSlides.mockResolvedValue([slide(SLIDE_B, 1)]);

    const result = await deleteSlideAction({
      presentationId: PRESENTATION_ID,
      slideId: SLIDE_A,
    });

    expect(slideRepository.reorderSlides).toHaveBeenCalledWith(expect.anything(), PRESENTATION_ID, [
      SLIDE_B,
    ]);
    expect(result.status).toBe("success");
    if (result.status === "success") expect(result.slides[0].sortOrder).toBe(0);
  });

  it("마지막 슬라이드를 지우면 순서 재계산을 건너뛴다", async () => {
    slideRepository.listSlides.mockResolvedValue([]);

    const result = await deleteSlideAction({
      presentationId: PRESENTATION_ID,
      slideId: SLIDE_A,
    });

    expect(slideRepository.reorderSlides).not.toHaveBeenCalled();
    expect(result.status).toBe("success");
    if (result.status === "success") expect(result.slides).toEqual([]);
  });
});
