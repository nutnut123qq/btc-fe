"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { getGlossaryDefinition } from "@/lib/glossary";

interface GlossaryTermProps {
  /** Key into src/lib/glossary.ts (case-insensitive). Unknown keys render children as plain text. */
  term: string;
  /** Text shown inline; defaults to the term itself. */
  children?: ReactNode;
  className?: string;
}

const TOOLTIP_MAX_WIDTH_PX = 256;
const VIEWPORT_MARGIN_PX = 8;
// Window during which a click is considered the same gesture that just focused
// the trigger (touch tap fires focus+click back-to-back); without this the tap
// that opens the tooltip would immediately toggle it closed.
const FOCUS_CLICK_GRACE_MS = 350;

/**
 * Inline glossary term: dotted underline, tooltip on hover / keyboard focus,
 * tap-to-toggle on touch screens, Escape to dismiss. The trigger is a real
 * <button> so it is keyboard-reachable; the tooltip is portaled to document.body
 * so overflow-hidden / backdrop-blur ancestors cannot clip it.
 */
export function GlossaryTerm({ term, children, className }: GlossaryTermProps) {
  const definition = getGlossaryDefinition(term);
  const [open, setOpen] = useState(false);
  // True only on the client after hydration (server snapshot = false), so the
  // tooltip portal never renders during SSR and hydration stays consistent.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [pos, setPos] = useState<{ top: number; left: number; place: "top" | "bottom" } | null>(null);
  const rootRef = useRef<HTMLButtonElement>(null);
  const focusedAtRef = useRef(0);
  const tooltipId = useId();

  const show = useCallback(() => {
    const el = rootRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const half = Math.min(TOOLTIP_MAX_WIDTH_PX, window.innerWidth - VIEWPORT_MARGIN_PX * 2) / 2;
      const left = Math.min(
        Math.max(rect.left + rect.width / 2, half + VIEWPORT_MARGIN_PX),
        window.innerWidth - half - VIEWPORT_MARGIN_PX,
      );
      const place = rect.top > 160 ? "top" : "bottom";
      setPos({ top: place === "top" ? rect.top : rect.bottom, left, place });
    }
    setOpen(true);
  }, []);

  const hide = useCallback(() => setOpen(false), []);

  const handleFocus = useCallback(() => {
    focusedAtRef.current = Date.now();
    show();
  }, [show]);

  const handleClick = useCallback(() => {
    if (open && Date.now() - focusedAtRef.current < FOCUS_CLICK_GRACE_MS) return;
    if (open) hide();
    else {
      focusedAtRef.current = Date.now();
      show();
    }
  }, [open, show, hide]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    },
    [],
  );

  // While open: dismiss on scroll (fixed tooltip would detach from anchor),
  // on resize, and on a pointer landing anywhere else.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) hide();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [open, hide]);

  if (!definition) return <>{children ?? term}</>;

  return (
    <>
      <button
        ref={rootRef}
        type="button"
        aria-describedby={mounted ? tooltipId : undefined}
        onFocus={handleFocus}
        onBlur={hide}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`cursor-help underline decoration-dotted decoration-slate-500 underline-offset-2 hover:decoration-slate-300 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400${className ? ` ${className}` : ""}`}
      >
        {children ?? term}
      </button>
      {mounted &&
        createPortal(
          <span
            role="tooltip"
            id={tooltipId}
            // display:none via the `hidden` utility (the `hidden` attribute loses
            // to Tailwind's `block` at equal specificity). aria-describedby still
            // exposes the definition to screen readers while closed.
            className={open
              ? `fixed z-[100] inline-block w-max max-w-[16rem] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-left text-[11px] font-normal leading-4 normal-case tracking-normal text-slate-200 shadow-xl shadow-black/50 ${
                pos?.place === "top"
                  ? "-translate-x-1/2 translate-y-[calc(-100%_-_0.5rem)]"
                  : "-translate-x-1/2 translate-y-2"
              }`
              : "hidden"}
            style={{ top: pos?.top ?? 0, left: pos?.left ?? 0 }}
          >
            {definition}
          </span>,
          document.body,
        )}
    </>
  );
}
