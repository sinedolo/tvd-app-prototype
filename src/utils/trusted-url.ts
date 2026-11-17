import { WORDPRESS_HOST } from '@/constants/wordpress-api';

const TRUSTED_URL = new RegExp(`^https://${WORDPRESS_HOST.replace(/\./g, '\\.')}(/|$)`);

// Vrai si l'adresse est en HTTPS et du domaine du site (sans sous-domaine). Après le
// nom de domaine, seul `/` ou la fin est accepté : `https://tvdecouverte.ch@evil.example`
// et `https://tvdecouverte.ch.evil.example` sont refusés (`.example` : domaine réservé, RFC 2606).
export function isTrustedUrl(url: string): boolean {
  return TRUSTED_URL.test(url);
}
