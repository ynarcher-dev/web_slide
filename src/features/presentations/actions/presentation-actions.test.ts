import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 권한 검증에 초점을 둔 테스트다.
 *
 * Server Action은 화면을 거치지 않고 직접 호출될 수 있으므로
 * 로그인 여부 확인과 소유자 조건이 항상 적용되는지 확인한다.
 */

const { getCurrentUser, createSupabaseServerClient } = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));
const repository = vi.hoisted(() => ({
  insertPresentation: vi.fn(),
  updatePresentationTitle: vi.fn(),
  updatePresentationSettings: vi.fn(),
  deletePresentation: vi.fn(),
}));
const imageCleanup = vi.hoisted(() => ({ removePresentationImages: vi.fn() }));
const { redirect, revalidatePath } = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    // 실제 redirect()도 예외를 던져 이후 코드를 실행하지 않는다.
    throw new Error(`REDIRECT:${path}`);
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ getCurrentUser, createSupabaseServerClient }));
vi.mock("../data/presentation-repository", () => repository);
// Storage 정리는 별도 테스트가 있다. 여기서는 권한 흐름만 본다.
vi.mock("@/features/slide-editor/data/slide-image-cleanup", () => imageCleanup);
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath }));

import {
  createPresentationAction,
  deletePresentationAction,
  renamePresentationAction,
  updatePresentationSettingsAction,
} from "./presentation-actions";

const IDLE = { status: "idle" } as const;
const USER_ID = "11111111-1111-4111-8111-111111111111";
const PRESENTATION_ID = "33333333-3333-4333-8333-333333333333";
const SUPABASE = { marker: "supabase" };

function formData(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ id: USER_ID });
  createSupabaseServerClient.mockResolvedValue(SUPABASE);
});

describe("로그인 검증", () => {
  it("비로그인 사용자의 생성 요청은 로그인 화면으로 보내고 DB에 접근하지 않는다", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(createPresentationAction(IDLE, formData({ title: "새 자료" }))).rejects.toThrow(
      "REDIRECT:/login",
    );
    expect(repository.insertPresentation).not.toHaveBeenCalled();
  });

  it("비로그인 사용자의 삭제 요청도 로그인 화면으로 보낸다", async () => {
    getCurrentUser.mockResolvedValue(null);

    await expect(
      deletePresentationAction(IDLE, formData({ presentationId: PRESENTATION_ID })),
    ).rejects.toThrow("REDIRECT:/login");
    expect(repository.deletePresentation).not.toHaveBeenCalled();
  });
});

describe("createPresentationAction", () => {
  it("제목이 비어 있으면 필드 오류를 돌려주고 저장하지 않는다", async () => {
    const state = await createPresentationAction(IDLE, formData({ title: "   " }));

    expect(state).toEqual({ status: "error", fieldErrors: { title: "제목을 입력하세요." } });
    expect(repository.insertPresentation).not.toHaveBeenCalled();
  });

  it("현재 로그인한 사용자를 소유자로 저장하고 편집 화면으로 보낸다", async () => {
    repository.insertPresentation.mockResolvedValue({ id: PRESENTATION_ID });

    await expect(createPresentationAction(IDLE, formData({ title: " 새 자료 " }))).rejects.toThrow(
      `REDIRECT:/presentations/${PRESENTATION_ID}/edit`,
    );
    expect(repository.insertPresentation).toHaveBeenCalledWith(SUPABASE, USER_ID, "새 자료");
    expect(revalidatePath).toHaveBeenCalledWith("/presentations");
  });
});

describe("renamePresentationAction", () => {
  it("남의 자료라 바뀐 행이 없으면 권한 오류를 돌려준다", async () => {
    repository.updatePresentationTitle.mockResolvedValue(null);

    const state = await renamePresentationAction(
      IDLE,
      formData({ presentationId: PRESENTATION_ID, title: "탈취" }),
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe("프레젠테이션을 찾을 수 없거나 권한이 없습니다.");
    expect(repository.updatePresentationTitle).toHaveBeenCalledWith(
      SUPABASE,
      PRESENTATION_ID,
      USER_ID,
      "탈취",
    );
  });

  it("id 형식이 잘못되면 DB를 조회하지 않는다", async () => {
    const state = await renamePresentationAction(
      IDLE,
      formData({ presentationId: "not-a-uuid", title: "제목" }),
    );

    expect(state.status).toBe("error");
    expect(repository.updatePresentationTitle).not.toHaveBeenCalled();
  });

  it("성공하면 목록과 편집 화면을 다시 그리게 한다", async () => {
    repository.updatePresentationTitle.mockResolvedValue({ id: PRESENTATION_ID });

    const state = await renamePresentationAction(
      IDLE,
      formData({ presentationId: PRESENTATION_ID, title: "바뀐 제목" }),
    );

    expect(state).toEqual({ status: "success", message: "제목을 저장했습니다." });
    expect(revalidatePath).toHaveBeenCalledWith("/presentations");
    expect(revalidatePath).toHaveBeenCalledWith(`/presentations/${PRESENTATION_ID}/edit`);
  });
});

describe("updatePresentationSettingsAction", () => {
  it("체크되지 않은 체크박스를 false로 저장한다", async () => {
    repository.updatePresentationSettings.mockResolvedValue({ id: PRESENTATION_ID });

    const state = await updatePresentationSettingsAction(
      IDLE,
      formData({
        presentationId: PRESENTATION_ID,
        brandColor: "#123456",
        coverTint: "40",
        footerText: " 푸터 ",
      }),
    );

    expect(state.status).toBe("success");
    expect(repository.updatePresentationSettings).toHaveBeenCalledWith(
      SUPABASE,
      PRESENTATION_ID,
      USER_ID,
      {
        brandColor: "#123456",
        coverTint: 40,
        footerText: "푸터",
        showPageNumber: false,
        isPublic: false,
      },
    );
  });

  it("체크된 값은 true로 저장한다", async () => {
    repository.updatePresentationSettings.mockResolvedValue({ id: PRESENTATION_ID });

    await updatePresentationSettingsAction(
      IDLE,
      formData({
        presentationId: PRESENTATION_ID,
        brandColor: "#123456",
        coverTint: "0",
        footerText: "",
        showPageNumber: "on",
        isPublic: "on",
      }),
    );

    expect(repository.updatePresentationSettings).toHaveBeenCalledWith(
      SUPABASE,
      PRESENTATION_ID,
      USER_ID,
      expect.objectContaining({ showPageNumber: true, isPublic: true }),
    );
  });

  it("잘못된 값은 필드 오류로 돌려주고 저장하지 않는다", async () => {
    const state = await updatePresentationSettingsAction(
      IDLE,
      formData({
        presentationId: PRESENTATION_ID,
        brandColor: "red",
        coverTint: "200",
        footerText: "",
      }),
    );

    expect(state.status).toBe("error");
    expect(state.fieldErrors?.brandColor).toBe("브랜드 색상은 #RRGGBB 형식이어야 합니다.");
    expect(state.fieldErrors?.coverTint).toBe("표지 tint는 100 이하여야 합니다.");
    expect(repository.updatePresentationSettings).not.toHaveBeenCalled();
  });
});

describe("deletePresentationAction", () => {
  it("지운 행이 없으면 권한 오류를 돌려준다", async () => {
    repository.deletePresentation.mockResolvedValue(false);

    const state = await deletePresentationAction(
      IDLE,
      formData({ presentationId: PRESENTATION_ID }),
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe("프레젠테이션을 찾을 수 없거나 권한이 없습니다.");
  });

  it("성공하면 목록을 다시 그리게 한다", async () => {
    repository.deletePresentation.mockResolvedValue(true);

    const state = await deletePresentationAction(
      IDLE,
      formData({ presentationId: PRESENTATION_ID }),
    );

    expect(state).toEqual({ status: "success", message: "프레젠테이션을 삭제했습니다." });
    expect(repository.deletePresentation).toHaveBeenCalledWith(SUPABASE, PRESENTATION_ID, USER_ID);
    expect(revalidatePath).toHaveBeenCalledWith("/presentations");
  });
});
