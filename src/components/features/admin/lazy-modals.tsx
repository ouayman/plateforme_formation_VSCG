"use client";

import dynamic from "next/dynamic";

function modalFallback() {
  return <span className="inline-block h-8 w-8 shrink-0" aria-hidden />;
}

export const LazyTrainerFormModal = dynamic(
  () => import("./trainer-form-modal").then((m) => ({ default: m.TrainerFormModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyTrainerEditButton = dynamic(
  () => import("./trainer-form-modal").then((m) => ({ default: m.TrainerEditButton })),
  { loading: modalFallback, ssr: false }
);

export const LazyTrainerUnavailabilityModal = dynamic(
  () =>
    import("./trainer-unavailability-modal").then((m) => ({
      default: m.TrainerUnavailabilityModal,
    })),
  { loading: modalFallback, ssr: false }
);

export const LazyCreateCompanyModal = dynamic(
  () => import("./company-form-modal").then((m) => ({ default: m.CreateCompanyModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyCompanyEditButton = dynamic(
  () => import("./company-form-modal").then((m) => ({ default: m.CompanyEditButton })),
  { loading: modalFallback, ssr: false }
);

export const LazySkillDomainFormModal = dynamic(
  () => import("./skill-domain-form-modal").then((m) => ({ default: m.SkillDomainFormModal })),
  { loading: modalFallback, ssr: false }
);

export const LazySkillDomainEditButton = dynamic(
  () => import("./skill-domain-form-modal").then((m) => ({ default: m.SkillDomainEditButton })),
  { loading: modalFallback, ssr: false }
);

export const LazySkillDomainTrainersModal = dynamic(
  () =>
    import("./skill-domain-trainers-modal").then((m) => ({
      default: m.SkillDomainTrainersModal,
    })),
  { loading: modalFallback, ssr: false }
);

export const LazyInviteUserModal = dynamic(
  () => import("./invite-user-modal").then((m) => ({ default: m.InviteUserModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyUserEditModal = dynamic(
  () => import("./user-edit-modal").then((m) => ({ default: m.UserEditModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyInviteParticipantModal = dynamic(
  () => import("./invite-participant-modal").then((m) => ({ default: m.InviteParticipantModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyParticipantEditModal = dynamic(
  () => import("./participant-edit-modal").then((m) => ({ default: m.ParticipantEditModal })),
  { loading: modalFallback, ssr: false }
);

export const LazyPlatformSettingsForm = dynamic(
  () => import("./platform-settings-form").then((m) => ({ default: m.PlatformSettingsForm })),
  { loading: () => <div className="h-48 animate-pulse rounded-xl bg-muted/60" aria-busy /> }
);

export const LazyDeleteButton = dynamic(
  () =>
    import("@/components/features/projects/delete-button").then((m) => ({
      default: m.DeleteButton,
    })),
  { loading: modalFallback }
);
