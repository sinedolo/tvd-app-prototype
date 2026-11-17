const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  ndash: '–',
  mdash: '—',
};

// Décode les entités HTML numériques (`&#8217;`, `&#x27;`) et les entités nommées
// de la table ci-dessus. Une entité inconnue ou un code invalide est laissé tel quel.
export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith('#')) {
      const code = body[1] === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      try {
        // Lève une `RangeError` si le code est hors plage.
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}

// Réduit un extrait HTML simple (`<p>`, `<br />`) à du texte : les sauts deviennent
// des espaces, les autres balises sont retirées, puis les entités décodées.
// Les entités sont décodées en dernier, pour qu'un `&lt;` ne recrée pas une balise.
export function stripHtml(html: string): string {
  const text = html
    .replace(/<br\s*\/?>|<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return decodeHtmlEntities(text).replace(/\s+/g, ' ').trim();
}
