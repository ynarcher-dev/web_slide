import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Presentation } from "@/types/domain";
import { ShareLinkDialog } from "./share-link-dialog";

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
  isPublic: true,
  shareId: "44444444-4444-4444-8444-444444444444",
  createdAt: "2026-08-26T00:00:00Z",
  updatedAt: "2026-08-26T01:00:00Z",
};

/**
 * jsdom에는 클립보드 구현이 없다.
 * `userEvent.setup()`도 자기 대역을 설치하므로 반드시 setup 뒤에 갈아 끼운다.
 */
function stubClipboard(writeText: () => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

function renderDialog(presentation: Presentation = PRESENTATION) {
  render(<ShareLinkDialog presentation={presentation} open onClose={vi.fn()} />);
}

/**
 * 공유 주소는 브라우저의 실제 origin을 따른다.
 * jsdom 기본값이 개발 주소와 같아서, 다른 값으로 바꿔야 실제로 따라가는지 확인할 수 있다.
 */
function stubOrigin(origin: string) {
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...original, origin },
  });
  return () => Object.defineProperty(window, "location", { configurable: true, value: original });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("ShareLinkDialog", () => {
  it("공유 식별자로 만든 주소를 보여준다", () => {
    renderDialog();

    expect(screen.getByLabelText("공유 주소")).toHaveValue(
      `http://localhost:3000/share/${PRESENTATION.shareId}`,
    );
  });

  it("배포 도메인이 아니라 지금 보고 있는 주소로 링크를 만든다", () => {
    // 빌드 시점에 배포 도메인을 몰라도 사용자가 받는 링크는 항상 맞아야 한다.
    const restore = stubOrigin("https://web-slide.example.workers.dev");
    try {
      renderDialog();

      expect(screen.getByLabelText("공유 주소")).toHaveValue(
        `https://web-slide.example.workers.dev/share/${PRESENTATION.shareId}`,
      );
    } finally {
      restore();
    }
  });

  it("복사에 성공하면 안내를 보여준다", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => {});
    stubClipboard(writeText);
    renderDialog();

    await user.click(screen.getByRole("button", { name: "링크 복사" }));

    expect(writeText).toHaveBeenCalledWith(`http://localhost:3000/share/${PRESENTATION.shareId}`);
    expect(await screen.findByText("링크를 복사했습니다.")).toBeInTheDocument();
  });

  it("복사에 실패하면 직접 복사하도록 안내한다", async () => {
    const user = userEvent.setup();
    stubClipboard(async () => {
      throw new Error("보안 컨텍스트가 아닙니다.");
    });
    renderDialog();

    await user.click(screen.getByRole("button", { name: "링크 복사" }));

    expect(await screen.findByText(/직접 복사하세요/)).toBeInTheDocument();
  });

  it("비공개면 링크가 열리지 않는다고 알리고 공유 화면 열기를 감춘다", () => {
    renderDialog({ ...PRESENTATION, isPublic: false });

    expect(screen.getByText(/공개 공유 허용/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "공유 화면 열기" })).not.toBeInTheDocument();
  });
});
