import { useCallback, useEffect, useState } from 'react';

import { articlePdfUrl, LATEST_ARTICLE_URL, WORDPRESS_TIMEOUT_MS } from '@/constants/wordpress-api';
import { parseArticle, parsePdfUrl, type Article } from '@/utils/parse-wordpress-article';

export type LatestArticleState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  // `pdfUrl` reste null tant que la recherche du PDF n'a pas abouti, et pour de bon
  // si elle échoue : pas de bouton, pas d'erreur.
  | { status: 'success'; article: Article; pdfUrl: string | null };

// Charge le dernier article, puis cherche son PDF. L'article s'affiche dès sa
// réponse ; le PDF s'ajoute ensuite. Les deux requêtes partagent un contrôleur et un
// délai de 15 s. Pas de cache : seul `reload` relance les requêtes.
export function useLatestArticle(): { state: LatestArticleState; reload: () => void } {
  const [state, setState] = useState<LatestArticleState>({ status: 'loading' });
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

      let article: Article | null;
      try {
        article = parseArticle(await getJson(LATEST_ARTICLE_URL));
      } catch (error) {
        clearTimeout(timer);
        // Annulation par le démontage ou un nouvel essai : réponse ignorée.
        if (controller.signal.aborted && !timedOut) return;
        // `console.info` : visible dans le terminal de Metro, sans bandeau LogBox.
        console.info('API WordPress : échec du chargement de l’article', cause(error));
        setState({
          status: 'error',
          message: 'Impossible de charger le dernier article. Vérifiez votre connexion.',
        });
        return;
      }

      if (controller.signal.aborted) return;
      if (!article) {
        clearTimeout(timer);
        console.info('API WordPress : réponse reçue mais aucun article exploitable');
        setState({ status: 'error', message: 'Aucun article disponible pour le moment.' });
        return;
      }

      setState({ status: 'success', article, pdfUrl: null });

      try {
        const pdfUrl = parsePdfUrl(await getJson(articlePdfUrl(article.id)));
        if (controller.signal.aborted) return;
        if (!pdfUrl) console.info('API WordPress : aucun PDF pour cet article');
        setState({ status: 'success', article, pdfUrl });
      } catch (error) {
        if (controller.signal.aborted && !timedOut) return;
        console.info('API WordPress : recherche du PDF échouée', cause(error));
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
