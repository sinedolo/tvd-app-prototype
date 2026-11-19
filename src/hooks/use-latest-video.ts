import { useCallback, useEffect, useState } from 'react';

import { youtubeFeedUrl } from '@/constants/youtube-feed';
import { parseYoutubeFeed, pickLatestVideo, type FeedVideo } from '@/utils/parse-youtube-feed';

// Délai maximal d'une requête : au-delà, elle est abandonnée et l'erreur s'affiche.
const FEED_TIMEOUT_MS = 15_000;

export type LatestVideoState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; video: FeedVideo };

// Charge le flux YouTube de la chaîne `channelId` et en extrait la dernière
// vidéo. Pas de cache ni de rechargement automatique : seul `reload` relance la
// requête (un changement de `channelId` aussi).
export function useLatestVideo(channelId: string): { state: LatestVideoState; reload: () => void } {
  const [state, setState] = useState<LatestVideoState>({ status: 'loading' });
  // Compteur incrémenté par `reload` : il relance l'effet ci-dessous.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Chaque requête a son propre contrôleur. Au démontage ou à un nouvel essai,
    // la fonction de nettoyage l'annule : une réponse tardive est ignorée.
    const controller = new AbortController();
    // Le délai abandonne la requête par ce même contrôleur ; `timedOut` distingue
    // cet abandon (erreur affichée) d'un abandon par nettoyage (silencieux).
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, FEED_TIMEOUT_MS);

    async function load() {
      setState({ status: 'loading' });
      try {
        const response = await fetch(youtubeFeedUrl(channelId), { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const xml = await response.text();
        if (controller.signal.aborted && !timedOut) return;

        const video = pickLatestVideo(parseYoutubeFeed(xml));
        if (!video) {
          console.info(`Flux YouTube (${channelId}) : réponse reçue mais aucune vidéo exploitable`);
        }
        setState(
          video
            ? { status: 'success', video }
            : { status: 'error', message: 'Aucune vidéo disponible pour le moment.' },
        );
      } catch (error) {
        // Abandon par nettoyage (démontage, nouvel essai, autre chaîne) : on ignore.
        if (controller.signal.aborted && !timedOut) return;
        // `console.info` : visible dans le terminal de Metro, sans bandeau LogBox.
        // Cause = « HTTP 404 », « délai dépassé » ou message de l'erreur réseau ;
        // l'identifiant de chaîne est public, aucune donnée personnelle.
        console.info(
          `Flux YouTube (${channelId}) : échec du chargement`,
          timedOut
            ? `délai de ${FEED_TIMEOUT_MS / 1000} s dépassé`
            : error instanceof Error
              ? error.message
              : String(error),
        );
        setState({
          status: 'error',
          message: 'Impossible de charger la dernière vidéo. Vérifiez votre connexion.',
        });
      } finally {
        clearTimeout(timer);
      }
    }

    load();
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [channelId, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, reload };
}
