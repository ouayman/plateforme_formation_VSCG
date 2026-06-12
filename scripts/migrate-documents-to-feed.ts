import { PrismaClient, TrainingPostType } from "@prisma/client";
import { displayFileName } from "../src/lib/upload-utils";

const prisma = new PrismaClient();

async function main() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (documents.length === 0) {
    console.log("Aucun document à migrer.");
    return;
  }

  let migrated = 0;

  for (const doc of documents) {
    const existing = await prisma.trainingPostAttachment.findFirst({
      where: { fileUrl: doc.fileUrl },
      select: { id: true },
    });
    if (existing) {
      console.log(`Skip (déjà migré): ${doc.fileUrl}`);
      continue;
    }

    const post = await prisma.trainingPost.create({
      data: {
        trainingId: doc.trainingId,
        authorId: doc.uploadedBy,
        type: TrainingPostType.manual,
        text: null,
        createdAt: doc.createdAt,
      },
    });

    await prisma.trainingPostAttachment.create({
      data: {
        postId: post.id,
        fileUrl: doc.fileUrl,
        fileName: displayFileName(doc.fileUrl),
        createdAt: doc.createdAt,
      },
    });

    migrated++;
    console.log(`Migré: ${doc.fileUrl}`);
  }

  if (migrated > 0) {
    const result = await prisma.document.deleteMany({});
    console.log(`Supprimé ${result.count} entrée(s) Document legacy.`);
  }

  console.log(`Migration terminée: ${migrated} document(s) converti(s) en posts feed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
