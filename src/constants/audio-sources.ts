// TEMPORAIRE : sources de test publiques, sans secret, à remplacer par les vraies
// sources de TV Découverte.

// Flux de radio continu (sans durée) qui simule la future webradio : flux de
// référence MP3 128 kbit/s de Radio Mast, « personal and commercial use, free of
// charge » (https://www.radiomast.io/reference-streams, consulté le 17.11.2026).
// L'adresse redirige (302) vers un serveur edge ; aucune garantie de durée.
export const TEST_RADIO_URL = 'https://streams.radiomast.io/ref-128k-mp3-stereo';

// Long fichier MP3 du site (≈ 78 Mo, `Accept-Ranges: bytes`), trouvé par le JSON
// de la playlist Sonaar de l'émission « Fallone après minuit » (album 36191).
export const SITE_MP3_URL = 'https://tvdecouverte.ch/wp-content/uploads/2026/11/FalloneAM.mp3';
