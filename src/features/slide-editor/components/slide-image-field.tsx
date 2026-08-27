"use client";

import { useRef, useState } from "react";
import { Button, ErrorMessage } from "@/components/ui";
import type { SlideImage } from "@/types/domain";
import {
  removeSlideImage,
  uploadSlideImage,
  validateSlideImageFile,
} from "../data/slide-image-storage";

export type SlideImageFieldProps = {
  presentationId: string;
  /** 저장된 이미지. 아직 없으면 null이다. */
  image: SlideImage | null;
  onCommit: (path: string) => void;
};

/**
 * 이미지 슬라이드의 그림 선택.
 *
 * 파일을 고르면 곧바로 Storage에 올리고, 성공한 경로만 슬라이드에 저장한다.
 * 올리는 중에 실패하면 기존 이미지를 그대로 두고 오류만 알린다.
 * 교체나 제거로 쓰지 않게 된 파일은 저장이 끝난 뒤 지운다.
 */
export function SlideImageField({ presentationId, image, onCommit }: SlideImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    const invalid = validateSlideImageFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const previous = image?.path ?? "";
      const path = await uploadSlideImage(presentationId, file);
      onCommit(path);
      if (previous !== "") await removeSlideImage(previous);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "이미지를 올리지 못했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    const previous = image?.path ?? "";
    setError(null);
    onCommit("");
    await removeSlideImage(previous);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">이미지</p>

      {image ? (
        // 미리보기는 작게만 보여 준다. 실제 배치는 가운데 슬라이드 미리보기에서 확인한다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt="선택한 슬라이드 이미지 미리보기"
          className="aspect-video w-full rounded-control border border-border-subtle bg-surface object-contain"
        />
      ) : (
        <p className="rounded-control border border-dashed border-border-subtle p-4 text-center text-xs text-foreground-muted">
          아직 올린 이미지가 없습니다.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        aria-label="슬라이드 이미지 파일"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // 같은 파일을 다시 골라도 change가 오도록 값을 비운다.
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "올리는 중..." : image ? "이미지 교체" : "이미지 올리기"}
        </Button>
        {image ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={uploading}
            onClick={() => void handleRemove()}
          >
            이미지 제거
          </Button>
        ) : null}
      </div>

      {error ? (
        <ErrorMessage message={error} onRetry={() => setError(null)} retryLabel="닫기" />
      ) : null}

      <p className="text-xs text-foreground-muted">
        PNG, JPG, WEBP, GIF 10MB 이하. 슬라이드에는 16:9 영역 안에 잘리지 않게 들어갑니다.
      </p>
    </div>
  );
}
