import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require";
import { getCoordinatorAssignmentGroups } from "@/lib/coordinator-company";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const groups = await getCoordinatorAssignmentGroups(params.id);
  return NextResponse.json({ groups });
}
