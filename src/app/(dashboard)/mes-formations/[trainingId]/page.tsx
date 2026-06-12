import { redirect } from "next/navigation";

export default function MesFormationDetailRedirect({
  params,
}: {
  params: { trainingId: string };
}) {
  redirect(`/my-trainings/${params.trainingId}`);
}
