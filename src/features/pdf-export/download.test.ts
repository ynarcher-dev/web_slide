import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadBlob, fileNameFromDisposition } from "./download";

describe("fileNameFromDisposition", () => {
  it("UTF-8 이름을 우선 읽는다", () => {
    const header = `attachment; filename="_____.pdf"; filename*=UTF-8''${encodeURIComponent("서비스 소개.pdf")}`;

    expect(fileNameFromDisposition(header)).toBe("서비스 소개.pdf");
  });

  it("UTF-8 이름이 없으면 단순 이름을 읽는다", () => {
    expect(fileNameFromDisposition('attachment; filename="report.pdf"')).toBe("report.pdf");
  });

  it("헤더가 없으면 null이다", () => {
    expect(fileNameFromDisposition(null)).toBeNull();
    expect(fileNameFromDisposition("attachment")).toBeNull();
  });
});

describe("downloadBlob", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("임시 URL로 내려받고 나면 URL을 해제한다", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => "blob:test");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadBlob(new Blob(["pdf"]), "서비스 소개.pdf");

    expect(click).toHaveBeenCalledTimes(1);
    // 클릭 직후에 해제하면 다운로드가 시작되기 전에 데이터가 사라질 수 있다.
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
    // 임시로 만든 링크는 문서에 남지 않는다.
    expect(document.querySelector("a")).toBeNull();

    vi.unstubAllGlobals();
  });
});
