"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, ImagePlus, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

type SignatureInputProps = {
  projectId: string;
  value: string;
  onChange: (path: string) => void;
};

type Tab = "upload" | "draw";

export function SignatureInput({ projectId, value, onChange }: SignatureInputProps) {
  const [tab, setTab] = useState<Tab>("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const uploadSignature = useCallback(
    async (payload: FormData | { dataUrl: string }) => {
      setUploading(true);
      setError("");

      const res = await fetch(`/api/projects/${projectId}/signatories/signature`, {
        method: "POST",
        headers: payload instanceof FormData ? undefined : { "Content-Type": "application/json" },
        body: payload instanceof FormData ? payload : JSON.stringify(payload),
      });

      setUploading(false);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Erreur lors du chargement.");
        return;
      }

      const data = await res.json();
      onChange(data.path);
    },
    [onChange, projectId]
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await uploadSignature(formData);
    if (fileRef.current) fileRef.current.value = "";
  }

  function getCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    drawing.current = true;
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = getCanvasPoint(e);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function endDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    drawing.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function saveDrawing() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasInk = pixels.some((_, i) => i % 4 === 3 && pixels[i] > 0);
    if (!hasInk) {
      setError("Dessinez une signature avant d'enregistrer.");
      return;
    }

    await uploadSignature({ dataUrl: canvas.toDataURL("image/png") });
  }

  useEffect(() => {
    if (tab !== "draw") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [tab]);

  return (
    <div className="space-y-3">
      <Label>Signature</Label>

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/20 p-3">
          <div className="flex min-h-[56px] flex-1 items-center justify-center rounded-lg border border-dashed bg-white px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveMediaUrl(value)}
              alt="Signature"
              className="max-h-12 max-w-full object-contain"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onChange("")}>
            Retirer
          </Button>
        </div>
      ) : (
        <>
          <div className="flex gap-1 rounded-lg border bg-muted/20 p-1">
            <button
              type="button"
              onClick={() => setTab("upload")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition",
                tab === "upload" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Charger une image
            </button>
            <button
              type="button"
              onClick={() => setTab("draw")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition",
                tab === "draw" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <PenLine className="h-3.5 w-3.5" />
              Dessiner
            </button>
          </div>

          {tab === "upload" ? (
            <div className="rounded-xl border border-dashed p-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {uploading ? "Chargement..." : "Choisir un fichier"}
              </Button>
              <p className="mt-2 text-[12px] text-muted-foreground">PNG, JPG ou WebP · max 5 Mo</p>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border p-3">
              <canvas
                ref={canvasRef}
                width={480}
                height={160}
                className="h-32 w-full touch-none rounded-lg border bg-white"
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={endDraw}
                onPointerLeave={endDraw}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
                  <Eraser className="h-4 w-4" />
                  Effacer
                </Button>
                <Button type="button" size="sm" disabled={uploading} onClick={saveDrawing}>
                  {uploading ? "Enregistrement..." : "Utiliser ce dessin"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  );
}

export function SignaturePreview({ url, alt = "Signature" }: { url: string; alt?: string }) {
  if (!url) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="inline-flex max-h-11 items-center rounded-md border bg-white px-2 py-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolveMediaUrl(url)}
        alt={alt}
        className="max-h-9 max-w-[140px] object-contain"
      />
    </div>
  );
}
