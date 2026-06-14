type RequestLike = Pick<Request, "headers">;

function getAppUrlFromRequest(req: RequestLike): string | null {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost?.split(",")[0]?.trim() || req.headers.get("host");
  if (!host) return null;

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const proto =
    forwardedProto?.split(",")[0]?.trim() ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${proto}://${host}`;
}

/** URL publique de l'app (liens dans les emails). */
export function getAppUrl(req?: RequestLike): string {
  const fromEnv = process.env.APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (req) {
    const fromRequest = getAppUrlFromRequest(req);
    if (fromRequest) return fromRequest;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}
