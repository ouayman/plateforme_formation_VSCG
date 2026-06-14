import { redirect } from "next/navigation";
import { resolveLandingPathFromUser } from "@/lib/auth/landing";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(await resolveLandingPathFromUser(user));
}
