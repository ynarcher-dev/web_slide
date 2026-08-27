"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveStatus, SlideSaveResult } from "../types";

export type UseAutoSaveOptions = {
  /** 입력이 멈춘 뒤 저장까지 기다리는 시간(ms). */
  delay: number;
};

export type AutoSaveController<T> = {
  status: SaveStatus;
  /** 저장에 실패했을 때의 안내 문구. */
  message?: string;
  /** 값을 예약한다. 예약 중 새 값이 들어오면 마지막 값만 저장한다. */
  schedule: (value: T) => void;
  /** 예약된 값을 즉시 저장한다. 슬라이드를 바꾸기 전에 호출한다. */
  flush: () => void;
  /** 실패한 저장을 다시 시도한다. */
  retry: () => void;
};

/**
 * 입력 변경을 debounce로 모아 저장한다.
 *
 * - 저장 중, 저장 완료, 저장 실패 상태를 그대로 화면에 보여줄 수 있게 돌려준다.
 * - 응답이 순서를 바꿔 도착해도 마지막 요청의 결과만 반영한다.
 * - 컴포넌트가 사라질 때 예약된 값을 잃지 않도록 즉시 저장한다.
 */
export function useAutoSave<T>(
  save: (value: T) => Promise<SlideSaveResult>,
  { delay }: UseAutoSaveOptions,
): AutoSaveController<T> {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState<string | undefined>(undefined);

  const saveRef = useRef(save);
  const pendingRef = useRef<{ value: T } | null>(null);
  const failedRef = useRef<{ value: T } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  // 최신 저장 함수를 참조로만 들고 있어야 schedule의 정체성이 매 렌더 바뀌지 않는다.
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const run = useCallback((value: T) => {
    const runId = ++runIdRef.current;
    setStatus("saving");

    void saveRef.current(value).then((result) => {
      // 더 나중에 시작한 저장이 있으면 이 결과는 버린다.
      if (runId !== runIdRef.current) return;

      if (result.status === "error") {
        failedRef.current = { value };
        setStatus("error");
        setMessage(result.message);
        return;
      }

      failedRef.current = null;
      setStatus("saved");
      setMessage(undefined);
    });
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) run(pending.value);
  }, [run]);

  const schedule = useCallback(
    (value: T) => {
      pendingRef.current = { value };
      setStatus("saving");
      setMessage(undefined);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, delay);
    },
    [delay, flush],
  );

  const retry = useCallback(() => {
    const failed = failedRef.current;
    if (failed) run(failed.value);
  }, [run]);

  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  // 화면을 벗어나도 마지막 입력이 사라지지 않게 한다.
  useEffect(() => () => flushRef.current(), []);

  return { status, message, schedule, flush, retry };
}
