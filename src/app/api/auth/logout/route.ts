import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  deleteSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
