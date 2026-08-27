"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Button, type ButtonSize, type ButtonVariant } from "./button";

export type MenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** 삭제처럼 되돌리기 어려운 동작을 강조한다. */
  destructive?: boolean;
};

export type MenuProps = {
  /** 트리거 버튼의 접근성 이름. 목록 안에서는 항목마다 다르게 지어 준다. */
  label: string;
  /** 버튼에 보일 내용. 주면 label은 화면에 보이지 않고 접근성 이름으로만 쓰인다. */
  triggerContent?: ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  className?: string;
};

export function Menu({
  label,
  triggerContent,
  items,
  align = "end",
  triggerVariant = "secondary",
  triggerSize = "md",
  className,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  /**
   * `start`에서 `step` 방향으로 처음 만나는 사용할 수 있는 항목을 찾는다.
   *
   * 비활성 버튼은 포커스를 받지 못한다. 건너뛰지 않으면 첫 항목이 비활성일 때
   * 포커스가 트리거에 남아 키보드로 메뉴를 쓸 수 없다.
   */
  const enabledIndex = useCallback(
    (start: number, step: number) => {
      const count = items.length;
      if (count === 0) return 0;

      for (let offset = 0; offset < count; offset += 1) {
        const index = (((start + step * offset) % count) + count) % count;
        if (!items[index]?.disabled) return index;
      }

      return ((start % count) + count) % count;
    },
    [items],
  );

  const close = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  }, []);

  // 바깥 클릭으로 닫는다. 포커스는 클릭한 위치에 그대로 둔다.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const item = itemRefs.current[activeIndex];
    // 모든 항목이 비활성이면 포커스를 받을 버튼이 없다. 그때는 메뉴가 받아 Esc라도 통하게 한다.
    if (item && !item.disabled) item.focus();
    else menuRef.current?.focus();
  }, [open, activeIndex]);

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAt(enabledIndex(0, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openAt(enabledIndex(items.length - 1, -1));
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => enabledIndex(index + 1, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => enabledIndex(index - 1, -1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(enabledIndex(0, 1));
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(enabledIndex(items.length - 1, -1));
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  const handleSelect = (item: MenuItem) => {
    if (item.disabled) return;
    close();
    item.onSelect();
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <Button
        ref={triggerRef}
        variant={triggerVariant}
        size={triggerSize}
        aria-label={triggerContent ? label : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close() : openAt(enabledIndex(0, 1)))}
        onKeyDown={handleTriggerKeyDown}
      >
        {triggerContent ?? (
          <>
            {label}
            <span aria-hidden="true" className="text-xs">
              ▾
            </span>
          </>
        )}
      </Button>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={handleMenuKeyDown}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute z-40 mt-1 min-w-44 rounded-panel border border-border-subtle bg-surface p-1 shadow-lg",
              align === "end" ? "right-0" : "left-0",
            )}
          >
            {items.map((item, index) => (
              <button
                key={item.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => handleSelect(item)}
                className={cn(
                  "flex w-full items-center rounded-control px-3 py-2 text-left text-sm",
                  "transition-colors duration-150 ease-standard",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  item.destructive
                    ? "text-danger-600 hover:bg-danger-50"
                    : "text-foreground hover:bg-ink-100",
                )}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
