# TODO — fake-chat (version "pro", export vidéo transparent)

App Remotion qui génère un faux chat Twitch **déterministe** et l'exporte en
**ProRes 4444 .mov (alpha)** pour Premiere Pro. Code propre/maintenable car
l'outil pourra être partagé.

## Principes
- Séparation stricte : **logique** (pure, testable) / **données** / **UI React**.
- Rendu 100 % déterministe : tout dérive de (props + numéro de frame). Aucune
  source d'aléa/temps au rendu (pas de Math.random, Date.now, setTimeout).
- Parité visuelle avec l'overlay existant (port de `chat.css`).
- Ne PAS toucher `fake-twitch-chat/` (l'overlay web original).

## Plan — TOUT LIVRÉ ✅ (rendu transparent vérifié : 97,7% transparent)

### Phase 0 — Scaffold & deps
- [x] `package.json` + `npm install` (remotion 4.0.482, react 18.3.1, zod 4.3.6)
- [x] `tsconfig.json`, `remotion.config.ts` (ProRes 4444, yuva444p10le, alpha)

### Phase 1 — Logique pure (port déterministe de generator.js)
- [x] `src/logic/prng.ts` — mulberry32 (instance, pas de singleton global)
- [x] `src/logic/pool.ts` — pool pondéré + parseur du format "GG x5"
- [x] `src/logic/schedule.ts` — (config) -> ScheduledMessage[] avec frame
      d'apparition + vagues de spam. Pur et déterministe.

### Phase 2 — Données
- [x] `src/data/usernames.(ts|json)` — 300 users {name,color}
- [x] `src/data/badges.tsx` — 6 badges SVG en composants React
- [x] `src/data/emotes.ts` — table de tokens (emoji + image)
- [x] `public/emotes/heart.svg`

### Phase 3 — UI / composition Remotion
- [x] `src/styles/chat.css` — port du rendu
- [x] `src/components/Emote.tsx`, `Badge.tsx`, `ChatMessage.tsx`
- [x] `src/ChatOverlay.tsx` — fenêtre de messages + anim entrée/scroll
      (grille 0fr→1fr pour la poussée, interpolate pour le fondu)
- [x] `src/Root.tsx` + `src/index.ts` — Composition (schéma Zod, defaults,
      calculateMetadata), 60 fps, 1920x1080, fontScale 2.2
- [x] Police Inter via `@remotion/google-fonts`

### Phase 4 — Turnkey & vérif
- [x] Lanceurs `.bat` : `Studio.bat` + `Generer-video.bat`
- [x] `README.md`
- [x] Vérif : typecheck tsc OK, rendu 2s OK, contrôle alpha 97,7% transparent,
      preuve visuelle (pseudos colorés, badges, emotes 🏆😂😮) — conforme Twitch.

### Phase 5 — Appli conviviale (UI dédiée) — LIVRÉ ✅
Le user a trouvé Remotion Studio « trop logiciel de montage ». Construit à la place
une vraie appli simple par-dessus le moteur (le moteur `src/` est réutilisé tel quel).
- [x] `app/server.mjs` — Express + Vite (middleware) + API rendu (@remotion/renderer)
- [x] `app/frontend/` — UI React : réglages FR + aperçu live (@remotion/player) +
      bouton « Générer la vidéo » + barre de progression
- [x] Lanceur `Lancer-Fake-Chat.bat` (primaire) ; `Studio.bat` supprimé
- [x] Vérifié : typecheck OK, UI s'affiche, aperçu live rempli (capture),
      bouton → rendu serveur 100% → `output/chat.mov`, alpha 95% transparent.

### Phase 6 — Fenêtre native (Electron) — LIVRÉ ✅
Le user voulait une vraie fenêtre d'appli, pas un onglet de navigateur.
- [x] `app/electron/main.cjs` — ouvre une fenêtre native ; lance `server.mjs` via
      Electron-as-Node (`ELECTRON_RUN_AS_NODE`, pas besoin de `node` sur le PATH) ;
      écran de chargement ; autoplay activé pour l'aperçu ; menu masqué.
- [x] Script `npm run gui` ; `Lancer-Fake-Chat.bat` ouvre désormais la fenêtre.
- [x] HMR Vite désactivé (inutile pour l'utilisateur, supprime un warning de port).
- [x] Vérifié : serveur démarre sous Electron (port 7777, « prêt », stderr vide),
      fenêtre charge l'app. (Choix : run-from-source, Node requis.)

### Phase 7 — Renommage + export Téléchargements — LIVRÉ ✅
- [x] Renommé en « Fake Chat » (dossier `fake-chat/`, lanceur `Lancer-Fake-Chat.bat`),
      toute trace de l'ancien nom supprimée.
- [x] Export → dossier **Téléchargements** : `~/Downloads/fake-chat.mov`, incrément
      `(1)`, `(2)`… (jamais d'écrasement). Logique centralisée dans
      `app/render-core.mjs` (partagée serveur + CLI `app/render.mjs`).
- [x] Vérifié : 2 rendus → `fake-chat.mov` puis `fake-chat (1).mov` dans Downloads.

### Phase 8 — Champ « Nom du fichier » obligatoire — LIVRÉ ✅
- [x] Champ texte en haut de l'UI (état `fileName`, hors schéma — n'affecte pas le rendu).
- [x] Bouton « Générer » désactivé tant que le champ est vide (+ message d'aide).
      Serveur refuse aussi une requête sans nom (`missing-filename`).
- [x] Nom nettoyé (`sanitizeBaseName`) puis `<nom>.mov` dans Téléchargements
      (incrément `(1)`, `(2)`… conservé). CLI garde le défaut `fake-chat`.
- [x] Vérifié : UI (vide→bouton off, rempli→on), API (sans nom refusé,
      nom perso → `test-nom-perso.mov` dans Downloads).

### Phase 9 — Fix aperçu parfois vide — LIVRÉ ✅
- [x] Cause : chat vide à la frame 0 + autoplay `@remotion/player` non fiable.
- [x] Fix : prop `initialFrame` (= `fps*3`, clampé) → aperçu ouvre sur une image
      déjà remplie même si l'autoplay ne part pas. Export inchangé (part de 0).
- [x] Vérifié : aperçu rempli dès l'ouverture, sans clic ni déplacement.

### Phase 10 — Icône + raccourci Bureau — LIVRÉ ✅
- [x] `tools/make_icon.py` → `assets/fake-chat.ico` (bulle de chat, violet Twitch).
- [x] Icône branchée sur la fenêtre Electron.
- [x] Raccourci Bureau `Fake Chat.lnk` → `Lancer-Fake-Chat.bat` (console minimisée).

### Phase 11 — .exe autonome (electron-builder) — LIVRÉ ✅
- [x] Frontend pré-buildé (`vite build` → `app/frontend/dist`) ; serveur sert le
      statique en mode packagé (env `FAKECHAT_PACKAGED`), Vite seulement en dev.
- [x] Pré-bundle Remotion (`npm run prebundle` → `app/remotion-bundle/`) ;
      render-core l'utilise comme serveUrl (pas de webpack au runtime) + `ensureBrowser()`.
- [x] electron-builder NSIS un-clic per-utilisateur, `asar:false`, icône,
      raccourcis Bureau + menu Démarrer auto. `npm run dist:win`.
- [x] Deps runtime minimales (`@remotion/renderer`, `remotion`, `express`) ; reste en devDeps.
- [x] Build OK → `release/Fake Chat Setup 1.0.0.exe` (~112 Mo). Vérifié : rendu
      depuis l'exe packagé OK, fenêtre packagée démarre. Pour GitHub Release.
- [ ] (Optionnel) signer l'exe pour éviter l'avertissement SmartScreen.

## Reste à faire (prochaine session, optionnel)
- [ ] Validation finale par le user : double-clic `Lancer-Fake-Chat.bat` →
      régler → Générer → import de `~/Downloads/fake-chat.mov` dans Premiere.
- [ ] Empaquetage `.exe` autonome (electron-builder) si distribution voulue —
      attention : pré-bundler Remotion au build (pas de webpack au runtime).
- [ ] Polish : icône de fenêtre + raccourci Bureau ; bouton « ouvrir la vidéo » ;
      ajuster les defaults ; gérer le poids des fichiers ProRes.

## Validation
Le user ouvre le Studio (double-clic .bat), règle débit/durée/fontScale en live,
clique Render → obtient `output/chat.mov` transparent qui s'importe net dans
Premiere (texte opaque, fond transparent, sans halo).
