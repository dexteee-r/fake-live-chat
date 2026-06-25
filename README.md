# Fake Chat — faux chat Twitch, export vidéo transparent

Génère un **faux chat Twitch déterministe** et l'exporte en **vidéo à fond
transparent** (ProRes 4444 `.mov`, canal alpha) prête à poser au-dessus de
n'importe quelle séquence dans Adobe Premiere Pro.

Contrairement à l'overlay OBS (live, aléatoire), ici le chat est **reproductible
et scrubable sur la timeline** : même graine = même chat, à l'image près.

Construit avec [Remotion](https://www.remotion.dev/) (rendu vidéo en React).

---

## Prérequis

- **Node.js 18+** (testé avec Node 24).
- Windows : double-cliquez simplement les `.bat` ci-dessous (la première fois,
  ils installent les dépendances automatiquement).

## Utilisation

### L'appli — `Lancer-Fake-Chat.bat`  ← le plus simple
Double-clic → une **fenêtre d'application** s'ouvre (appli de bureau Electron,
pas le navigateur) :
- à gauche, tes réglages — dont le champ **« Nom du fichier » (obligatoire)** ;
  débit, durée, taille du texte, tes messages…,
- à droite, l'**aperçu en direct** du chat,
- en bas, le bouton **« Générer la vidéo »** (inactif tant que le nom est vide)
  → enregistre la vidéo dans ton dossier **Téléchargements** sous le nom saisi
  (`<nom>.mov`). S'il existe déjà : `<nom> (1).mov`, `<nom> (2).mov`… jamais
  d'écrasement.

Une petite fenêtre noire reste en arrière-plan ; tu peux la réduire, mais ne la
ferme pas tant que l'appli est ouverte.

### Générer sans rien régler — `Generer-video.bat`
Lance un rendu avec les réglages par défaut et l'enregistre dans **Téléchargements**
(`fake-chat.mov`).

> En ligne de commande : `npm run gui` (fenêtre), `npm run app` (même UI dans le
> navigateur), `npm run render` (rendu direct).
> Pour développer, le studio Remotion brut reste dispo : `npm run studio`.

## Importer dans Premiere Pro
1. **Importer** `fake-chat.mov` depuis ton dossier Téléchargements.
2. Le poser **au-dessus** de votre vidéo dans la timeline.
3. Le chat s'affiche, fond transparent, sans halo sombre.
   - Si un léger liseré apparaît : clic droit sur le clip → *Interpréter le
     métrage* → alpha *Straight (non-multiplié)*.

## Réglages (dans l'appli)

| Réglage | Rôle |
| --- | --- |
| `durationInSeconds` | Durée de la vidéo |
| `fps` | Images/seconde (60 par défaut) |
| `width` / `height` | Résolution (1920×1080 par défaut) |
| `seed` | Graine : même valeur = même chat (reproductible) |
| `rate` | Messages par seconde (moyenne) |
| `rateJitter` | Irrégularité du débit (0 = régulier, 1 = très irrégulier) |
| `badgeChance` | Probabilité qu'un message porte un badge |
| `spamWaveChance` | Probabilité d'une vague de copypasta |
| `spamWaveDelaySec` | Délai entre répétitions d'une vague |
| `messagePool` | Liste des messages, un par ligne ; suffixe ` xN` = poids (`GG x5`) |
| `fontScale` | Taille du texte (2.2 par défaut, lisible plein cadre 1080p) |
| `showTimestamps` | Affiche l'heure devant chaque message |
| `textOutline` | Contour sombre pour la lisibilité sur n'importe quel fond |
| `entranceAnimation` | Apparition en fondu/glissement |
| `scrollSpeedMs` | Durée de la poussée vers le haut (0 = instantané) |
| `maxVisibleMessages` | Nombre max de lignes à l'écran |

## Format de sortie
ProRes 4444, pixel format `yuva444p10le` (alpha straight). La vidéo est
enregistrée dans ton dossier **Téléchargements** sous le nom `fake-chat.mov`.
Format et chemin de sortie réglés dans [`app/render-core.mjs`](app/render-core.mjs).

---

## Architecture (pour faire évoluer le projet)

Séparation stricte logique / données / UI :

```
src/
├── index.ts            Point d'entrée Remotion
├── Root.tsx            Déclaration de la composition (+ taille/fps/durée)
├── config.ts           Schéma Zod (panneau de réglages) + valeurs par défaut
├── ChatOverlay.tsx     Composition : à la frame N, fenêtre de messages + anim
├── logic/              Logique PURE (testable, sans React)
│   ├── prng.ts         Générateur pseudo-aléatoire à graine (mulberry32)
│   ├── pool.ts         Pool pondéré + parseur "GG x5"
│   └── schedule.ts     Construit toute la timeline (déterministe)
├── data/               Données
│   ├── usernames.(ts|json)  300 pseudos + couleurs
│   ├── badges.tsx      6 badges SVG (originaux, pas les assets Twitch)
│   └── emotes.ts       Table de tokens d'emotes
├── components/         Composants de rendu (Badge, Emote, ChatMessage)
└── styles/chat.css     Style du chat (porté de l'overlay)

app/                    L'appli conviviale (UI + serveur), par-dessus le moteur
├── electron/main.cjs   Fenêtre de bureau : lance le serveur + ouvre la fenêtre
├── server.mjs          Express + Vite : sert l'UI et l'API de rendu
├── render-core.mjs     Rendu partagé + chemin de sortie (→ Téléchargements)
├── render.mjs          Rendu direct en ligne de commande (npm run render)
└── frontend/           UI React : réglages + aperçu (@remotion/player) + bouton
```

Le **moteur** (`src/`) est partagé : l'aperçu dans le navigateur (`@remotion/player`)
et le rendu serveur (`@remotion/renderer`) utilisent exactement le même code, donc
l'aperçu correspond à la vidéo exportée.

**Principe clé : le rendu est 100 % déterministe.** Tout dérive de
`(props + numéro de frame)` ; aucune source d'aléa ou de temps réel au rendu.
`schedule.ts` calcule à l'avance la liste complète des messages (avec leur frame
d'apparition), et `ChatOverlay` affiche simplement, pour chaque frame, les
messages déjà apparus.

## Contraintes
- Aucun asset officiel Twitch/BTTV/FFZ (droits d'auteur) — badges/emotes maison.
- L'art custom (emotes image) va dans `public/emotes/`.

## Distribuer — créer le `.exe` autonome
```bash
npm run dist:win
```
Produit l'installateur **`release/Fake Chat Setup <version>.exe`** (~110 Mo).
La commande enchaîne : build de l'UI (`vite build` → `app/frontend/dist`),
pré-bundle Remotion (`app/remotion-bundle`, pour rendre sans webpack chez
l'utilisateur), puis empaquetage electron-builder (NSIS).

Pour le partager (ex. **GitHub Release**) : joins ce seul `.exe`. La personne le
double-clique → installation **sans droits admin**, **icône créée sur son
Bureau** + menu Démarrer, désinstallation propre.

Notes :
- L'appli n'embarque que le strict nécessaire au rendu (`@remotion/renderer`,
  `remotion`, `express`) ; tout le reste est *build-only* (`devDependencies`).
- **Au tout premier rendu** sur une machine, l'appli télécharge une fois le
  navigateur de rendu (~110 Mo) → connexion internet requise cette fois-là.
- L'installateur n'est **pas signé** (pas de certificat) : Windows peut afficher
  « Windows a protégé votre PC » → *Informations complémentaires* → *Exécuter
  quand même*. Normal pour une appli non signée.
