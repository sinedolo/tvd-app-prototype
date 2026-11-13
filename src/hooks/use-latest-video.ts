import { useCallback, useEffect, useState } from 'react';

import { YOUTUBE_FEED_URL } from '@/constants/youtube-feed';
import { parseYoutubeFeed, pickLatestVideo, type FeedVideo } from '@/utils/parse-youtube-feed';

export type LatestVideoState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; video: FeedVideo };

// Charge le flux YouTube et en extrait la dernière vidéo. Pas de cache ni de
// rechargement automatique : seul `reload` relance la requête.
export function useLatestVideo(): { state: LatestVideoState; reload: () => void } {
  const [state, setState] = useState<LatestVideoState>({ status: 'loading' });
  // Compteur incrémenté par `reload` : il relance l'effet ci-dessous.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Chaque requête a son propre contrôleur. Au démontage ou à un nouvel essai,
    // la fonction de nettoyage l'annule : une réponse tardive est ignorée.
    const controller = new AbortController();

    async function load() {
      setState({ status: 'loading' });
      try {
        const response = await fetch(YOUTUBE_FEED_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const xml = await response.text();
        if (controller.signal.aborted) return;

        const video = pickLatestVideo(parseYoutubeFeed(xml));
        setState(
          video
            ? { status: 'success', video }
            : { status: 'error', message: 'Aucune vidéo disponible pour le moment.' },
        );
      } catch {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          message: 'Impossible de charger la dernière vidéo. Vérifiez votre connexion.',
        });
      }
    }

    load();
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, reload };
}
