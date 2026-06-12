"use client";

import { createContext, useContext, useState } from "react";
import { CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TrainerPlanningContextValue = {
  addMode: boolean;
  setAddMode: (value: boolean) => void;
  toggleAddMode: () => void;
};

const TrainerPlanningContext = createContext<TrainerPlanningContextValue | null>(null);

export function TrainerPlanningProvider({ children }: { children: React.ReactNode }) {
  const [addMode, setAddMode] = useState(false);

  return (
    <TrainerPlanningContext.Provider
      value={{
        addMode,
        setAddMode,
        toggleAddMode: () => setAddMode((v) => !v),
      }}
    >
      {children}
    </TrainerPlanningContext.Provider>
  );
}

export function useTrainerPlanning() {
  const ctx = useContext(TrainerPlanningContext);
  if (!ctx) {
    throw new Error("useTrainerPlanning must be used within TrainerPlanningProvider");
  }
  return ctx;
}

export function useOptionalTrainerPlanning() {
  return useContext(TrainerPlanningContext);
}

export function TrainerPlanningHeaderAction() {
  const { addMode, toggleAddMode } = useTrainerPlanning();

  return (
    <Button
      type="button"
      variant={addMode ? "default" : "outline"}
      size="sm"
      className={cn(
        "gap-2 text-[13px]",
        addMode && "bg-red-600 hover:bg-red-700"
      )}
      onClick={toggleAddMode}
    >
      <CalendarOff className="h-4 w-4" />
      {addMode ? "Mode indisponibilité actif" : "Ajouter mes indisponibilités"}
    </Button>
  );
}
