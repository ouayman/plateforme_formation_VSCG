"use client";

import dynamic from "next/dynamic";

function modalFallback() {
  return <span className="inline-block h-8 w-8 shrink-0" aria-hidden />;
}

export const LazyProgramFormModal = dynamic(
  () => import("./program-form-modal").then((m) => ({ default: m.ProgramFormModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyProgramEditButton = dynamic(
  () => import("./program-form-modal").then((m) => ({ default: m.ProgramEditButton })),
  { loading: modalFallback, ssr: false }
);

export const LazyTrainingFormModal = dynamic(
  () => import("./training-form-modal").then((m) => ({ default: m.TrainingFormModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyTrainingEditButton = dynamic(
  () => import("./training-form-modal").then((m) => ({ default: m.TrainingEditButton })),
  { loading: modalFallback, ssr: false }
);
