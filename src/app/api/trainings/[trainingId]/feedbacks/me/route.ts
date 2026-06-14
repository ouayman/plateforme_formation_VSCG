import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { sendFeedbackConfirmationEmail } from "@/lib/mail/send-feedback-confirmation";
import { prisma } from "@/lib/prisma";
import { canSubmitTrainingFeedback } from "@/lib/permissions";
import { feedbackSchema } from "@/lib/validations/feedback";

export async function GET(
  _req: Request,
  { params }: { params: { trainingId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await canSubmitTrainingFeedback(user.id, params.trainingId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const feedback = await prisma.feedback.findUnique({
    where: {
      trainingId_userId: { trainingId: params.trainingId, userId: user.id },
    },
  });

  return NextResponse.json(feedback);
}

export async function PUT(
  req: Request,
  { params }: { params: { trainingId: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await canSubmitTrainingFeedback(user.id, params.trainingId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const feedback = await prisma.feedback.upsert({
    where: {
      trainingId_userId: { trainingId: params.trainingId, userId: user.id },
    },
    create: {
      trainingId: params.trainingId,
      userId: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    },
  });

  const training = await prisma.training.findUnique({
    where: { id: params.trainingId },
    select: { title: true },
  });

  sendFeedbackConfirmationEmail(
    user.email,
    user.firstName,
    training?.title ?? "Formation",
    parsed.data.rating,
    req
  ).catch((error) => console.error("[feedback] email confirmation:", error));

  return NextResponse.json(feedback);
}
