"use client";

import dynamic from "next/dynamic";

function modalFallback() {
  return <span className="inline-block h-8 w-8 shrink-0" aria-hidden />;
}

export const LazyProjectFormModal = dynamic(
  () => import("./project-form-modal").then((m) => ({ default: m.ProjectFormModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyLocationFormModal = dynamic(
  () => import("./location-form-modal").then((m) => ({ default: m.LocationFormModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyLocationEditButton = dynamic(
  () => import("./location-form-modal").then((m) => ({ default: m.LocationEditButton })),
  { loading: modalFallback, ssr: false }
);

export const LazySignatoryFormModal = dynamic(
  () => import("./signatory-form-modal").then((m) => ({ default: m.SignatoryFormModal })),
  { loading: modalFallback, ssr: false }
);

export const LazySignatoryEditButton = dynamic(
  () => import("./signatory-form-modal").then((m) => ({ default: m.SignatoryEditButton })),
  { loading: modalFallback, ssr: false }
);

export const LazyProjectRoleModal = dynamic(
  () => import("./project-role-modal").then((m) => ({ default: m.ProjectRoleModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyCoordinatorRoleModal = dynamic(
  () => import("./coordinator-role-modal").then((m) => ({ default: m.CoordinatorRoleModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyDeleteButton = dynamic(
  () =>
    import("./delete-button").then((m) => ({
      default: m.DeleteButton,
    })),
  { loading: modalFallback }
);
