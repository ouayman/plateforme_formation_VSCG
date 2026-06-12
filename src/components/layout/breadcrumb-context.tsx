"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbContextValue = {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BreadcrumbItem[]>([]);
  const value = useMemo(() => ({ items, setItems }), [items]);
  return (
    <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error("useBreadcrumb must be used within BreadcrumbProvider");
  return ctx;
}

export function SetBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { setItems } = useBreadcrumb();
  const key = items.map((i) => `${i.href ?? ""}:${i.label}`).join("|");

  useEffect(() => {
    setItems(items);
    return () => setItems([]);
  }, [key, items, setItems]);

  return null;
}
