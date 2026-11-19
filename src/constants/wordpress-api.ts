// API REST publique de WordPress (tvdecouverte.ch), sans authentification.
export const WORDPRESS_HOST = 'tvdecouverte.ch';
export const WORDPRESS_SITE_URL = `https://${WORDPRESS_HOST}`;
const WORDPRESS_API_URL = `${WORDPRESS_SITE_URL}/wp-json/wp/v2`;

// Dernier article du magazine, avec son image mise en avant (`_embed` limité à cette
// relation). `_links` et `_embedded` doivent figurer dans `_fields`, sinon l'embed
// est supprimé de la réponse.
export const LATEST_ARTICLE_URL =
  `${WORDPRESS_API_URL}/magazine?per_page=1&orderby=date&order=desc` +
  '&_embed=wp:featuredmedia' +
  '&_fields=id,date_gmt,link,title,excerpt,featured_media,_links,_embedded';

// PDF rattaché à un article (média dont le parent est l'article).
export function articlePdfUrl(articleId: number): string {
  return `${WORDPRESS_API_URL}/media?parent=${articleId}&mime_type=application/pdf&_fields=id,source_url`;
}

// Dernier épisode d'émission (podcast). La réponse ne contient ni image ni adresse
// de MP3 : le fichier se cherche ensuite dans la médiathèque.
export const LATEST_PODCAST_URL =
  `${WORDPRESS_API_URL}/emissions?per_page=1&orderby=date&order=desc` +
  '&_fields=id,date_gmt,link,title';

// MP3 rattaché à un épisode (média dont le parent est l'émission).
export function podcastAudioUrl(episodeId: number): string {
  return `${WORDPRESS_API_URL}/media?parent=${episodeId}&mime_type=audio/mpeg&_fields=id,source_url`;
}

// Délai maximal d'une requête vers l'API.
export const WORDPRESS_TIMEOUT_MS = 15_000;
