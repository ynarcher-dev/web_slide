"use client";

import { useEffect } from "react";

export type PlayerKeyboardHandlers = {
  onNext: () => void;
  onPrevious: () => void;
  onFirst: () => void;
  onLast: () => void;
  /** ESC. 웹페이지 조작 모드를 끄거나 발표를 끝낼 때 사용한다. */
  onEscape: () => void;
  onToggleFullscreen: () => void;
};

/** 입력 중인 요소에서는 방향키를 가로채지 않는다. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * 발표 화면의 키보드 조작.
 *
 * iframe 안을 클릭하면 키 입력을 웹페이지가 가져가므로 이 리스너에는 도달하지 않는다.
 * 그래서 화면의 이전/다음 버튼을 항상 함께 제공한다.
 */
export function usePlayerKeyboard(handlers: PlayerKeyboardHandlers) {
  const { onNext, onPrevious, onFirst, onLast, onEscape, onToggleFullscreen } = handlers;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;

      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
          event.preventDefault();
          onNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          event.preventDefault();
          onPrevious();
          break;
        case "Home":
          event.preventDefault();
          onFirst();
          break;
        case "End":
          event.preventDefault();
          onLast();
          break;
        case "Escape":
          onEscape();
          break;
        case "f":
        case "F":
          event.preventDefault();
          onToggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNext, onPrevious, onFirst, onLast, onEscape, onToggleFullscreen]);
}
