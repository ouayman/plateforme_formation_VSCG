import { redirect } from "next/navigation";

export default function MyTrainingRedirectPage({
  params,
}: {
  params: { trainingId: string };
}) {
  redirect(`/trainings/${params.trainingId}`);
}
