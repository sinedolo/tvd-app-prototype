import { useCallback, useEffect, useState } from 'react';

import {
  LATEST_PODCAST_URL,
  podcastAudioUrl,
  WORDPRESS_TIMEOUT_MS,
} from '@/constants/wordpress-api';
import {
  parseAudioUrl,
  parsePodcastEpisode,
  type PodcastEpisode,
} from '@/utils/parse-wordpress-podcast';

export type LatestPodcastState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  // `audioUrl` vaut null si l'épisode n'a pas de MP3 exploitable.
  | { status: 'success'; episode: PodcastEpisode; audioUrl: string | null };

// Charge le dernier épisode, puis cherche son MP3. Le résultat n'est publié qu'une
// fois les deux requêtes terminées. Elles partagent un contrôleur et un délai de
// 15 s. Pas de cache : seul `reload` relance les requêtes.
export function useLatestPodcast(): { state: LatestPodcastState; reload: () => void } {
  const [state, setState] = useState<LatestPodcastState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // Distingue le délai dépassé de l'annulation (démontage ou nouvel essai).
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, WORDPRESS_TIMEOUT_MS);

    async function getJson(url: string): Promise<unknown> {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    }

    function cause(error: unknown): string {
      if (timedOut) return `délai de ${WORDPRESS_TIMEOUT_MS / 1000} s dépassé`;
      return error instanceof Error ? error.message : String(error);
    }

    async function load() {
      setState({ status: 'loading' });

      try {
        const episode = parsePodcastEpisode(await getJson(LATEST_PODCAST_URL));
        if (controller.signal.aborted) return;
        if (!episode) {
          console.info('API WordPress : réponse reçue mais aucun épisode exploitable');
          setState({ status: 'error', message: 'Aucun épisode disponible pour le moment.' });
          return;
        }

        const audioUrl = parseAudioUrl(await getJson(podcastAudioUrl(episode.id)));
        if (controller.signal.aborted) return;
        if (!audioUrl) {
          console.info(`API WordPress : aucun MP3 exploitable pour l’épisode ${episode.id}`);
        }
        setState({ status: 'success', episode, audioUrl });
      } catch (error) {
        // Annulation par le démontage ou un nouvel essai : réponse ignorée.
        if (controller.signal.aborted && !timedOut) return;
        // `console.info` : visible dans le terminal de Metro, sans bandeau LogBox.
        console.info('API WordPress : échec du chargement du podcast', cause(error));
        setState({
          status: 'error',
          message: 'Impossible de charger le dernier podcast. Vérifiez votre connexion.',
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
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, reload };
}
