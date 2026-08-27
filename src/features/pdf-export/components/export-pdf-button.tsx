"use client";

import { useState } from "react";
import { Button, ErrorMessage } from "@/components/ui";
import { ROUTES } from "@/lib/routes";
import { downloadBlob, fileNameFromDisposition } from "../download";

export type ExportPdfButtonProps = {
  presentationId: string;
  /** 내보낼 슬라이드가 없으면 비활성화한다. */
  disabled?: boolean;
};

type ExportStatus = "idle" | "working" | "error";

const DEFAULT_ERROR = "PDF를 만들지 못했습니다.";

/** 서버가 보낸 오류 메시지를 꺼낸다. 형식이 다르면 기본 문구를 쓴다. */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "message" in body) {
      const { message } = body as { message?: unknown };
      if (typeof message === "string" && message !== "") return message;
    }
  } catch {
    // 본문이 JSON이 아니면 기본 문구를 쓴다.
  }

  return DEFAULT_ERROR;
}

/**
 * PDF 내보내기 버튼.
 *
 * 서버가 브라우저를 띄워 인쇄하므로 몇 초가 걸린다. 그동안 진행 상태를 보여주고,
 * 실패하면 원인을 알린 뒤 같은 자리에서 다시 시도할 수 있게 한다.
 */
export function ExportPdfButton({ presentationId, disabled }: ExportPdfButtonProps) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [message, setMessage] = useState(DEFAULT_ERROR);

  async function exportPdf() {
    setStatus("working");

    try {
      const response = await fetch(ROUTES.presentationPdfDownload(presentationId));
      const contentType = response.headers.get("content-type") ?? "";

      // 로그인이 풀리면 PDF 대신 로그인 화면이 돌아올 수 있다.
      if (!response.ok || !contentType.includes("application/pdf")) {
        setMessage(response.ok ? DEFAULT_ERROR : await readErrorMessage(response));
        setStatus("error");
        return;
      }

      const fileName = fileNameFromDisposition(response.headers.get("content-disposition"));
      downloadBlob(await response.blob(), fileName ?? "presentation.pdf");
      setStatus("idle");
    } catch {
      setMessage("네트워크 문제로 PDF를 내려받지 못했습니다.");
      setStatus("error");
    }
  }

  const working = status === "working";

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="secondary"
        loading={working}
        disabled={disabled}
        onClick={exportPdf}
        // 좁은 화면에서는 글자를 줄인다. 이름은 낭독기와 테스트를 위해 그대로 둔다.
        aria-label={working ? "PDF 만드는 중" : "PDF 내보내기"}
      >
        <span className="hidden sm:inline">{working ? "PDF 만드는 중" : "PDF 내보내기"}</span>
        <span className="sm:hidden">PDF</span>
      </Button>

      {working ? (
        <p role="status" className="sr-only">
          PDF를 만드는 중입니다. 슬라이드 수에 따라 시간이 걸립니다.
        </p>
      ) : null}

      {status === "error" ? (
        <div className="absolute top-full right-0 z-40 mt-2 w-72">
          <ErrorMessage
            title="PDF 내보내기 실패"
            message={message}
            onRetry={exportPdf}
            className="shadow-lg"
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => setStatus("idle")}>
              닫기
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
