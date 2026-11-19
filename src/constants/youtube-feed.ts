// Chaînes YouTube de TV Découverte (identifiants publics, pas des secrets) et
// adresse de leur flux Atom public (sans clé). Le flux renvoie les 15 dernières
// entrées au plus.
export const YOUTUBE_CHANNEL_ID = 'UCKtR5oCAkY6qDzkU2uY7GXw';
// Chaîne radio @RadioTvDécouverte (relevé le 19.11.2026 : balise canonique de la
// page de la chaîne et réponse du flux).
export const YOUTUBE_RADIO_CHANNEL_ID = 'UCE2VphR3yohT9YWIxIHH_Ww';

export function youtubeFeedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}
