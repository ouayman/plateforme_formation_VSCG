"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type DropdownPortalProps = {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  align?: "start" | "end";
  matchWidth?: boolean;
  className?: string;
  children: ReactNode;
};

export function DropdownPortal({
  open,
  onClose,
  anchorRef,
  align = "start",
  matchWidth = false,
  className,
  children,
}: DropdownPortalProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const next: CSSProperties = {
      position: "fixed",
      top: rect.bottom + 4,
      zIndex: 9999,
    };

    if (matchWidth) {
      next.width = rect.width;
      next.minWidth = rect.width;
    } else {
      next.minWidth = Math.max(rect.width, 220);
    }

    if (align === "end") {
      next.right = window.innerWidth - rect.right;
    } else {
      next.left = rect.left;
    }

    setStyle(next);
  }, [anchorRef, align, matchWidth]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === "undefined") return null;

  const anchor = anchorRef.current;
  const portalContainer =
    (anchor?.closest("[role='dialog']") as HTMLElement | null) ?? document.body;

  return createPortal(
    <div ref={menuRef} className={cn(className)} style={style} data-dropdown-portal="">
      {children}
    </div>,
    portalContainer
  );
}

export function useDropdownAnchor() {
  const anchorRef = useRef<HTMLElement | null>(null);

  function setAnchor(el: HTMLElement | null) {
    anchorRef.current = el;
  }

  return { anchorRef, setAnchor };
}
