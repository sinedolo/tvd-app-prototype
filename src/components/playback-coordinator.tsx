import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

// Fonctions qu'un lecteur confie au coordinateur. L'objet pourra recevoir plus
// tard d'autres commandes (par exemple `play`, pour un démarrage commandé de
// l'extérieur) sans changer le registre ni les lecteurs existants.
export type PlayerHandlers = {
  // Met le lecteur en pause (peut être asynchrone, comme celui de YouTube).
  pause: () => void | Promise<unknown>;
};

type Coordinator = {
  register: (id: string, handlers: PlayerHandlers) => () => void;
  notifyStarted: (id: string) => void;
};

const PlaybackCoordinatorContext = createContext<Coordinator | null>(null);

// Coordinateur central : monté à la racine, il ne dépend d'aucun écran. Chaque
// lecteur s'inscrit, signale son démarrage, et les autres sont mis en pause.
// Le registre est dans un `useRef` : une inscription ne provoque aucun rendu.
export function PlaybackCoordinatorProvider({ children }: { children: ReactNode }) {
  const players = useRef(new Map<string, PlayerHandlers>());

  const register = useCallback((id: string, handlers: PlayerHandlers) => {
    players.current.set(id, handlers);
    return () => {
      players.current.delete(id);
    };
  }, []);

  const notifyStarted = useCallback((id: string) => {
    for (const [otherId, handlers] of players.current) {
      if (otherId === id) continue;
      console.info('Coordination : lecteur mis en pause', otherId);
      try {
        // Une pause refusée par un lecteur ne doit pas bloquer les autres.
        Promise.resolve(handlers.pause()).catch((error) =>
          console.info('Coordination : échec de la pause', otherId, error),
        );
      } catch (error) {
        console.info('Coordination : échec de la pause', otherId, error);
      }
    }
  }, []);

  const value = useMemo(() => ({ register, notifyStarted }), [register, notifyStarted]);

  return (
    <PlaybackCoordinatorContext.Provider value={value}>
      {children}
    </PlaybackCoordinatorContext.Provider>
  );
}

// Inscrit le lecteur à l'affichage, le désinscrit au démontage, et renvoie la
// fonction à appeler quand il démarre (son identifiant y est déjà lié).
// `handlers` est relu à chaque appel : une pause qui change entre deux rendus
// reste à jour sans réinscription.
export function usePlaybackCoordinator(handlers: PlayerHandlers): () => void {
  const coordinator = useContext(PlaybackCoordinatorContext);
  if (!coordinator) {
    throw new Error('usePlaybackCoordinator doit être utilisé sous PlaybackCoordinatorProvider');
  }
  const { register, notifyStarted } = coordinator;
  const id = useId();

  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => register(id, { pause: () => latest.current.pause() }), [register, id]);

  return useCallback(() => notifyStarted(id), [notifyStarted, id]);
}
