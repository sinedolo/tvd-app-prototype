import { stripHtml } from '@/utils/html-text';
import { isTrustedUrl } from '@/utils/trusted-url';

export type PodcastEpisode = {
  id: number;
  title: string;
  publishedAt: string; // date ISO 8601 en UTC (avec « Z »)
};

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

// Lit la réponse de `/emissions?per_page=1…` (tableau d'un élément). Renvoie null si
// l'épisode est absent ou incomplet.
export function parsePodcastEpisode(json: unknown): PodcastEpisode | null {
  const item = Array.isArray(json) ? json[0] : null;
  if (!isObject(item)) return null;

  const id = item.id;
  const rawTitle = isObject(item.title) ? asString(item.title.rendered) : null;
  const dateGmt = asString(item.date_gmt);
  if (typeof id !== 'number' || rawTitle === null || dateGmt === null) return null;

  // Les titres contiennent des entités (`&#8211;`) et parfois des espaces, y compris
  // insécables, en début ou en fin : `stripHtml` décode puis retire ces espaces.
  const title = stripHtml(rawTitle);
  if (title === '') return null;

  // `date_gmt` n'a pas de fuseau (« 2026-11-19T07:28:44 ») : sans « Z », JavaScript
  // la lirait comme une heure locale.
  const publishedAt = /(Z|[+-]\d{2}:\d{2})$/.test(dateGmt) ? dateGmt : `${dateGmt}Z`;
  if (Number.isNaN(new Date(publishedAt).getTime())) return null;

  return { id, title, publishedAt };
}

// Lit la réponse de `/media?parent=…&mime_type=audio/mpeg` : adresse du premier MP3,
// ou null s'il n'y en a pas (ou si l'adresse n'est pas de confiance).
export function parseAudioUrl(json: unknown): string | null {
  const item = Array.isArray(json) ? json[0] : null;
  if (!isObject(item)) return null;
  const url = asString(item.source_url);
  return url && isTrustedUrl(url) ? url : null;
}
