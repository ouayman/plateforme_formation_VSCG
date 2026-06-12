import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { sendFeedbackConfirmationEmail } from "@/lib/mail/send-feedback-confirmation";
import { prisma } from "@/lib/prisma";
import { canSubmitTrainingFeedback } from "@/lib/permissions";
import { feedbackSchema } from "@/lib/validations/feedback";

export async function GET(
  req: Request,
  { params }: { params: { programId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const trainingId = new URL(req.url).searchParams.get("trainingId");
  if (!trainingId) {
    return NextResponse.json({ error: "training_id_required" }, { status: 400 });
  }

  const training = await prisma.training.findFirst({
    where: { id: trainingId, programId: params.programId },
    select: { id: true },
  });
  if (!training) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!(await canSubmitTrainingFeedback(user.id, trainingId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: {
      trainingId_userId: { trainingId, userId: user.id },
    },
  });

  return NextResponse.json(feedback);
}

export async function PUT(
  req: Request,
  { params }: { params: { programId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const trainingId = typeof body.trainingId === "string" ? body.trainingId : null;
  if (!trainingId) {
    return NextResponse.json({ error: "training_id_required" }, { status: 400 });
  }

  const training = await prisma.training.findFirst({
    where: { id: trainingId, programId: params.programId },
    select: { id: true, title: true },
  });
  if (!training) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (!(await canSubmitTrainingFeedback(user.id, trainingId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const feedback = await prisma.feedback.upsert({
    where: {
      trainingId_userId: { trainingId, userId: user.id },
    },
    create: {
      trainingId,
      userId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    },
  });

  sendFeedbackConfirmationEmail(
    user.email,
    user.firstName,
    training.title,
    parsed.data.rating
  ).catch((error) => console.error("[feedback] email confirmation:", error));

  return NextResponse.json(feedback);
}
