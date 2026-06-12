"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeleteButtonProps = {
  url: string;
  confirmMessage?: string;
  onDeleted?: () => void;
  className?: string;
};

export function DeleteButton({
  url,
  confirmMessage = "Confirmer la suppression ?",
  onDeleted,
  className,
}: DeleteButtonProps) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(confirmMessage)) return;
    await fetch(url, { method: "DELETE" });
    onDeleted?.();
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} className={cn("h-8 w-8 p-0", className)}>
      <Trash2 className="h-3.5 w-3.5 text-destructive" />
    </Button>
  );
}
