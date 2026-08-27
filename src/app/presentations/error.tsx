"use client";

import { ErrorMessage } from "@/components/ui";

export default function PresentationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-6">
      <ErrorMessage
        title="프레젠테이션을 불러오지 못했습니다."
        message={error.message || "잠시 후 다시 시도해 주세요."}
        onRetry={reset}
      />
    </main>
  );
}
