import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExportPdfButton } from "./export-pdf-button";

const PRESENTATION_ID = "33333333-3333-4333-8333-333333333333";

function pdfResponse() {
  return new Response(new Blob(["%PDF-1.4"]), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="p.pdf"; filename*=UTF-8''${encodeURIComponent("서비스 소개.pdf")}`,
    },
  });
}

function errorResponse(status: number, message: string) {
  return Response.json({ message }, { status });
}

beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:test"),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ExportPdfButton", () => {
  it("응답이 오면 받은 이름으로 파일을 내려받는다", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () => pdfResponse());
    vi.stubGlobal("fetch", fetchMock);
    render(<ExportPdfButton presentationId={PRESENTATION_ID} />);

    await user.click(screen.getByRole("button", { name: "PDF 내보내기" }));

    expect(fetchMock).toHaveBeenCalledWith(`/presentations/${PRESENTATION_ID}/pdf/download`);
    expect(await screen.findByRole("button", { name: "PDF 내보내기" })).toBeEnabled();
    expect(document.querySelector("a")).toBeNull();
  });

  it("만드는 동안 진행 상태를 보여준다", async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: Response) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((resolve) => (resolveFetch = resolve))),
    );
    render(<ExportPdfButton presentationId={PRESENTATION_ID} />);

    await user.click(screen.getByRole("button", { name: "PDF 내보내기" }));

    const button = screen.getByRole("button", { name: "PDF 만드는 중" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    resolveFetch(pdfResponse());
    expect(await screen.findByRole("button", { name: "PDF 내보내기" })).toBeEnabled();
  });

  it("실패하면 서버 메시지를 보여주고 다시 시도할 수 있다", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(errorResponse(500, "PDF를 만들지 못했습니다."))
      .mockResolvedValueOnce(pdfResponse());
    vi.stubGlobal("fetch", fetchMock);
    render(<ExportPdfButton presentationId={PRESENTATION_ID} />);

    await user.click(screen.getByRole("button", { name: "PDF 내보내기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("PDF를 만들지 못했습니다.");

    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("슬라이드가 없으면 누를 수 없다", () => {
    render(<ExportPdfButton presentationId={PRESENTATION_ID} disabled />);

    expect(screen.getByRole("button", { name: "PDF 내보내기" })).toBeDisabled();
  });
});
