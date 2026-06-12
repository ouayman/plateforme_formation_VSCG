import { NextResponse } from "next/server";
import { requireProjectAccessApi } from "@/lib/auth/require";
import { validateImageUpload } from "@/lib/image-upload-utils";
import { saveSignatorySignatureFromBuffer, saveSignatorySignatureFromFile } from "@/lib/uploads";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const access = await requireProjectAccessApi(params.id);
  if (access.error) return access.error;
  if (!access.canEdit) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "invalid_input", message: "Fichier manquant." }, { status: 400 });
      }

      const validationError = validateImageUpload(file.name, file.size);
      if (validationError) {
        return NextResponse.json({ error: "invalid_input", message: validationError }, { status: 400 });
      }

      const path = await saveSignatorySignatureFromFile(params.id, file);
      return NextResponse.json({ path });
    }

    const body = await req.json();
    const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";
    const match = /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/.exec(dataUrl);
    if (!match) {
      return NextResponse.json(
        { error: "invalid_input", message: "Image de signature invalide." },
        { status: 400 }
      );
    }

    const ext = match[1] === "jpeg" || match[1] === "jpg" ? ".jpg" : match[1] === "webp" ? ".webp" : ".png";
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "invalid_input", message: "Image trop volumineuse (max 5 Mo)." },
        { status: 400 }
      );
    }

    const path = await saveSignatorySignatureFromBuffer(params.id, buffer, ext);
    return NextResponse.json({ path });
  } catch {
    return NextResponse.json({ error: "upload_failed", message: "Erreur lors du chargement." }, { status: 500 });
  }
}
