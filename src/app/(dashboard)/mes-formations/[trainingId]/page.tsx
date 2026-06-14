import { redirect } from "next/navigation";

export default function MesFormationDetailRedirect({
  params,
}: {
  params: { trainingId: string };
}) {
  redirect(`/trainings/${params.trainingId}`);
}
