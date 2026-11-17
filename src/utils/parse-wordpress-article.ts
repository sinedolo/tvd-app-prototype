import { isTrustedUrl } from '@/utils/trusted-url';
import { stripHtml } from '@/utils/html-text';

export type ArticleImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export type Article = {
  id: number;
  title: string;
  publishedAt: string; // date ISO 8601 en UTC (avec « Z »)
  excerpt: string;
  link: string;
  image: ArticleImage | null;
};

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

// Les champs `rendered` de WordPress : `{ rendered: "…" }`.
function rendered(value: unknown): string | null {
  return isObject(value) ? asString(value.rendered) : null;
}

// Tailles essayées dans l'ordre : assez grande pour un écran de téléphone, sans
// prendre l'image d'origine (plus de 1 Mo).
const IMAGE_SIZES = ['medium_large', 'large'];

function pickImage(embedded: unknown): ArticleImage | null {
  if (!isObject(embedded)) return null;
  const list = embedded['wp:featuredmedia'];
  const media = Array.isArray(list) ? list[0] : null;
  if (!isObject(media)) return null;

  const details = isObject(media.media_details) ? media.media_details : {};
  const sizes = isObject(details.sizes) ? details.sizes : {};
  const alt = asString(media.alt_text) ?? '';

  const candidates: unknown[] = [...IMAGE_SIZES.map((name) => sizes[name]), media];
  for (const candidate of candidates) {
    if (!isObject(candidate)) continue;
    const url = asString(candidate.source_url);
    const width = candidate === media ? details.width : candidate.width;
    const height = candidate === media ? details.height : candidate.height;
    if (
      url &&
      isTrustedUrl(url) &&
      typeof width === 'number' &&
      typeof height === 'number' &&
      width > 0 &&
      height > 0
    ) {
      return { url, width, height, alt };
    }
  }
  return null;
}

// Lit la réponse de `/magazine?per_page=1…` (tableau d'un élément). Renvoie null si
// l'article est absent ou incomplet ; une image absente ou invalide donne `image: null`.
export function parseArticle(json: unknown): Article | null {
  const item = Array.isArray(json) ? json[0] : null;
  if (!isObject(item)) return null;

  const id = item.id;
  const title = rendered(item.title);
  const excerpt = rendered(item.excerpt);
  const link = asString(item.link);
  const dateGmt = asString(item.date_gmt);
  if (typeof id !== 'number' || title === null || link === null || dateGmt === null) {
    return null;
  }
  // `date_gmt` n'a pas de fuseau (« 2026-06-29T13:40:38 ») : sans « Z », JavaScript
  // la lirait comme une heure locale.
  const publishedAt = /(Z|[+-]\d{2}:\d{2})$/.test(dateGmt) ? dateGmt : `${dateGmt}Z`;
  if (Number.isNaN(new Date(publishedAt).getTime())) return null;

  return {
    id,
    title: stripHtml(title),
    publishedAt,
    excerpt: excerpt === null ? '' : stripHtml(excerpt),
    link,
    image: pickImage(item._embedded),
  };
}

// Lit la réponse de `/media?parent=…&mime_type=application/pdf` : adresse du premier
// PDF, ou null s'il n'y en a pas (ou si l'adresse n'est pas de confiance).
export function parsePdfUrl(json: unknown): string | null {
  const item = Array.isArray(json) ? json[0] : null;
  if (!isObject(item)) return null;
  const url = asString(item.source_url);
  return url && isTrustedUrl(url) ? url : null;
}
