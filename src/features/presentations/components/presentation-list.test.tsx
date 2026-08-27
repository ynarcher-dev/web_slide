import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Presentation } from "@/types/domain";
import { PresentationList } from "./presentation-list";

const actions = vi.hoisted(() => {
  type ActionStatus = "idle" | "success";
  type Action = (state: unknown, formData: FormData) => Promise<{ status: ActionStatus }>;
  const actionMock = (status: ActionStatus) => vi.fn<Action>(async () => ({ status }));

  return {
    createPresentationAction: actionMock("idle"),
    renamePresentationAction: actionMock("success"),
    updatePresentationSettingsAction: actionMock("success"),
    deletePresentationAction: actionMock("success"),
  };
});
const push = vi.hoisted(() => vi.fn());

vi.mock("../actions/presentation-actions", () => actions);
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const PRESENTATION: Presentation = {
  id: "33333333-3333-4333-8333-333333333333",
  ownerId: "11111111-1111-4111-8111-111111111111",
  title: "서비스 소개",
  theme: {
    brandColor: "#E42317",
    coverTint: 12,
    footerText: "Copyright © 2026 Y&ARCHER",
    showPageNumber: true,
  },
  isPublic: false,
  shareId: "44444444-4444-4444-8444-444444444444",
  createdAt: "2026-08-26T00:00:00Z",
  updatedAt: "2026-08-26T01:00:00Z",
};

async function openCardMenuItem(label: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /관리/ }));
  await user.click(screen.getByRole("menuitem", { name: label }));
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PresentationList", () => {
  it("자료가 없으면 빈 상태와 만들기 동작을 보여준다", () => {
    render(<PresentationList presentations={[]} />);

    expect(screen.getByText("아직 프레젠테이션이 없습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "첫 프레젠테이션 만들기" })).toBeInTheDocument();
  });

  it("자료가 있으면 제목, 수정 시각과 공개 상태를 보여준다", () => {
    render(<PresentationList presentations={[PRESENTATION]} />);

    const link = screen.getByRole("link", { name: "서비스 소개" });
    expect(link).toHaveAttribute(
      "href",
      "/presentations/33333333-3333-4333-8333-333333333333/edit",
    );
    expect(screen.getByText("2026. 08. 26. 10:00 수정")).toBeInTheDocument();
    expect(screen.getByText("비공개")).toBeInTheDocument();
  });

  it("메뉴에서 편집 열기를 고르면 편집 화면으로 이동한다", async () => {
    render(<PresentationList presentations={[PRESENTATION]} />);

    await openCardMenuItem("편집 열기");

    expect(push).toHaveBeenCalledWith("/presentations/33333333-3333-4333-8333-333333333333/edit");
  });

  it("제목 수정 모달에서 저장하면 이름 변경 액션을 호출한다", async () => {
    render(<PresentationList presentations={[PRESENTATION]} />);

    const user = await openCardMenuItem("제목 수정");
    const dialog = screen.getByRole("dialog", { name: "제목 수정" });
    const input = within(dialog).getByLabelText(/제목/);
    expect(input).toHaveValue("서비스 소개");

    await user.clear(input);
    await user.type(input, "바뀐 제목");
    await user.click(within(dialog).getByRole("button", { name: "저장" }));

    expect(actions.renamePresentationAction).toHaveBeenCalledTimes(1);
    const submitted = actions.renamePresentationAction.mock.calls[0][1];
    expect(submitted.get("title")).toBe("바뀐 제목");
    expect(submitted.get("presentationId")).toBe(PRESENTATION.id);
  });

  it("공통 설정 모달은 현재 테마 값을 채우고 저장한다", async () => {
    render(<PresentationList presentations={[PRESENTATION]} />);

    const user = await openCardMenuItem("공통 설정");
    const dialog = screen.getByRole("dialog", { name: "공통 설정" });
    expect(within(dialog).getByLabelText(/브랜드 색상/)).toHaveValue("#e42317");
    expect(within(dialog).getByLabelText(/표지 배경 tint/)).toHaveValue(12);
    expect(within(dialog).getByLabelText("페이지 번호 표시")).toBeChecked();
    expect(within(dialog).getByLabelText("공개 공유 허용")).not.toBeChecked();

    await user.click(within(dialog).getByLabelText("공개 공유 허용"));
    await user.click(within(dialog).getByRole("button", { name: "저장" }));

    const submitted = actions.updatePresentationSettingsAction.mock.calls[0][1];
    expect(submitted.get("isPublic")).toBe("on");
    expect(submitted.get("footerText")).toBe("Copyright © 2026 Y&ARCHER");
  });

  it("삭제는 확인 모달을 거친 뒤에만 실행된다", async () => {
    render(<PresentationList presentations={[PRESENTATION]} />);

    const user = await openCardMenuItem("삭제");
    expect(actions.deletePresentationAction).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog", { name: "프레젠테이션 삭제" });
    expect(dialog).toHaveTextContent("되돌릴 수 없습니다.");

    await user.click(within(dialog).getByRole("button", { name: "삭제" }));

    expect(actions.deletePresentationAction).toHaveBeenCalledTimes(1);
    const submitted = actions.deletePresentationAction.mock.calls[0][1];
    expect(submitted.get("presentationId")).toBe(PRESENTATION.id);
  });

  it("저장 뒤 목록이 다시 그려져도 새로 연 모달이 닫히지 않는다", async () => {
    const { rerender } = render(<PresentationList presentations={[PRESENTATION]} />);

    // 제목을 저장하면 모달이 닫힌다.
    const user = await openCardMenuItem("제목 수정");
    await user.click(
      within(screen.getByRole("dialog", { name: "제목 수정" })).getByRole("button", {
        name: "저장",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await openCardMenuItem("공통 설정");
    expect(screen.getByRole("dialog", { name: "공통 설정" })).toBeInTheDocument();

    // 서버 액션의 revalidate 결과가 뒤늦게 도착해 목록이 다시 그려지는 상황.
    rerender(<PresentationList presentations={[{ ...PRESENTATION, title: "바뀐 제목" }]} />);

    expect(screen.getByRole("dialog", { name: "공통 설정" })).toBeInTheDocument();
  });

  it("취소를 누르면 액션을 호출하지 않고 모달을 닫는다", async () => {
    render(<PresentationList presentations={[PRESENTATION]} />);

    const user = await openCardMenuItem("삭제");
    await user.click(
      within(screen.getByRole("dialog", { name: "프레젠테이션 삭제" })).getByRole("button", {
        name: "취소",
      }),
    );

    expect(actions.deletePresentationAction).not.toHaveBeenCalled();
    // 모달은 사라지는 애니메이션이 끝난 뒤 DOM에서 제거된다.
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
