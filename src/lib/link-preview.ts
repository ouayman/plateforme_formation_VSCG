import "server-only";

export type LinkPreviewData = {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
};

function readMeta(html: string, property: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function readTitle(html: string) {
  const og = readMeta(html, "og:title");
  if (og) return og;
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1]?.trim() ?? null;
}

function resolveImageUrl(imageUrl: string | null, baseUrl: URL): string | null {
  if (!imageUrl) return null;
  const trimmed = imageUrl.trim();
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) {
    try {
      return new URL(trimmed, baseUrl.origin).toString();
    } catch {
      return trimmed;
    }
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed, baseUrl.origin).toString();
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export async function fetchLinkPreview(rawUrl: string): Promise<LinkPreviewData | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "VSCG-LinkPreview/1.0" },
      redirect: "follow",
    });
    if (!res.ok) return { url: url.toString(), title: null, description: null, imageUrl: null };

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return { url: url.toString(), title: url.hostname, description: null, imageUrl: null };
    }

    const html = (await res.text()).slice(0, 200_000);
    const title = readTitle(html);
    const description = readMeta(html, "og:description") ?? readMeta(html, "description");
    const rawImage =
      readMeta(html, "og:image:secure_url") ??
      readMeta(html, "og:image:url") ??
      readMeta(html, "og:image") ??
      readMeta(html, "twitter:image") ??
      readMeta(html, "twitter:image:src");
    const imageUrl = resolveImageUrl(rawImage, url);

    return {
      url: url.toString(),
      title,
      description,
      imageUrl,
    };
  } catch {
    return { url: url.toString(), title: url.hostname, description: null, imageUrl: null };
  } finally {
    clearTimeout(timeout);
  }
}
