// TEMPORAIRE : sources de test publiques, sans secret, à remplacer par les vraies
// sources de TV Découverte.

// Flux de radio continu (sans durée) qui simule la future webradio : flux de
// référence MP3 128 kbit/s de Radio Mast, « personal and commercial use, free of
// charge » (https://www.radiomast.io/reference-streams, consulté le 17.11.2026).
// L'adresse redirige (302) vers un serveur edge ; aucune garantie de durée.
export const TEST_RADIO_URL = 'https://streams.radiomast.io/ref-128k-mp3-stereo';
