export type FeedVideo = {
  id: string;
  title: string;
  publishedAt: string; // date ISO 8601 en UTC, telle que fournie par le flux
  url: string;
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

// Décode les entités XML nommées et numériques (`&amp;`, `&#39;`, `&#x27;`).
// Une entité inconnue est laissée telle quelle.
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith('#x')) {
      return String.fromCodePoint(parseInt(body.slice(2), 16));
    }
    if (body.startsWith('#')) {
      return String.fromCodePoint(parseInt(body.slice(1), 10));
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}

// Texte d'une balise simple (`<tag>texte</tag>`) dans un fragment, ou null.
function readTag(fragment: string, tag: string): string | null {
  const match = fragment.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}

// Analyse le flux Atom : ne lit que les blocs `<entry>`. Le `<title>` et le
// `<published>` de la chaîne, situés avant les entrées, sont ignorés. Le bloc
// `<media:group>` (qui contient un `<media:title>` et une description) est
// retiré avant la lecture, pour ne jamais confondre ses balises avec celles
// de l'entrée. Une entrée incomplète est écartée.
export function parseYoutubeFeed(xml: string): FeedVideo[] {
  const videos: FeedVideo[] = [];

  for (const block of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const entry = block[1].replace(/<media:group>[\s\S]*?<\/media:group>/g, '');

    const id = readTag(entry, 'yt:videoId');
    const title = readTag(entry, 'title');
    const publishedAt = readTag(entry, 'published');
    const url = entry.match(/<link rel="alternate" href="([^"]+)"/)?.[1];

    if (id && title !== null && publishedAt && url) {
      videos.push({
        id,
        title: decodeEntities(title),
        publishedAt,
        url: decodeEntities(url),
      });
    }
  }

  return videos;
}

// Un Short a une adresse de la forme `https://www.youtube.com/shorts/<id>`.
export function isShort(video: FeedVideo): boolean {
  return video.url.includes('/shorts/');
}

// Décision du développeur : « la dernière vidéo » est la première entrée du
// flux qui n'est pas un Short. Renvoie null si aucune entrée ne convient.
export function pickLatestVideo(videos: FeedVideo[]): FeedVideo | null {
  return videos.find((video) => !isShort(video)) ?? null;
}
