const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;

export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match?.[0]?.replace(/[.,;:!?)]+$/, "") ?? null;
}

export function stripUrlsFromText(text: string): string {
  return text.replace(URL_REGEX, "").replace(/\s{2,}/g, " ").trim();
}

export function linkifyPlainText(text: string): string {
  return text.replace(URL_REGEX, (url) => {
    const clean = url.replace(/[.,;:!?)]+$/, "");
    return `<a href="${clean}" target="_blank" rel="noopener noreferrer" class="text-[#CD3465] hover:underline">${clean}</a>`;
  });
}

export function isRichHtml(text: string) {
  return /<[a-z][\s\S]*>/i.test(text);
}

export function sanitizePostHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export function plainTextFromHtml(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, "");
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.textContent ?? "";
}
