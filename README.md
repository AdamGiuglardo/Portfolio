# Portfolio — Adam Giuglardo

Portfolio personnel en React, Motion, HTML, CSS et JavaScript, publié sur [GitHub Pages](https://adamgiuglardo.github.io/Portfolio/).

## Développement local

```sh
npm install
npm run dev
```

Ouvrir l’adresse locale affichée par Vite. Le HTML source est dans `src/index.html`; `index.html` à la racine est généré pour GitHub Pages.

- `src/main.jsx` : filtres et liste de projets React, transitions Motion, progression de lecture et révélations au défilement.
- `src/motion.css` : animations React avec prise en charge de la préférence de réduction des mouvements.
- `src/index.html` : contenu du site et onglets de navigation.
- `style.css` : mise en page responsive et styles généraux.
- `script.js` : dialogues accessibles, menu mobile et suivi de la section active.
- `assets/` : portrait tramé, photo originale, CV et documents des projets.
- `secret.js` : ouverture du mode Code et déchiffrement local de l’arcade.
- `assets/mission-reseau.enc.json` : arcade chiffrée AES-GCM ; ses sources lisibles ne sont jamais versionnées.

## Publication

La branche `main` est publiée par GitHub Pages. Après modification, exécuter `npm run build`, vérifier la version locale, puis envoyer les sources et le bundle généré sur `origin/main`.

## Vérifications avant publication

Exécuter `npm run build`, puis vérifier les quatre filtres, les cinq dialogues (bouton Fermer et Échap), les accordéons, le menu mobile, les liens vers le CV et les images. Contrôler les petits écrans et la préférence système de réduction des animations. Vérifier la syntaxe avec `node --check script.js`.

## Mode Code

L’arcade est préparée dans `.private/game.html`, `.private/arcade-hub.js`, `.private/fight-game.js`, `.private/quest-game.js` et `.private/action-games.js`. Ce dossier reste ignoré par Git. Le script valide la syntaxe du bundle avant de le chiffrer. Pour régénérer le fichier public, exécuter `node tools/encrypt-game.mjs` puis saisir le code au clavier. Le code n’est pas stocké dans le dépôt.

L’arcade contient Mission Réseau (cinq défis), Pixel Fight (duel en manches), Packet Quest (aventure), Neon Runner (course) et Orbit Defender (tir spatial). Vérifier le départ, les commandes clavier/tactiles, Pause/Reprendre, le retour à l’arcade et le retour au portfolio. Les scores restent en mémoire pendant la visite ; ils ne sont pas enregistrés sur un serveur.

Le chiffrement masque le contenu sans fournir une authentification côté serveur : GitHub Pages sert des fichiers statiques. Un fichier chiffré téléchargé peut faire l’objet de tentatives hors ligne, indépendamment du blocage local du formulaire.

## Visite animée

Le bouton « Visite animée » de l’accueil ouvre une vidéo MP4 avec lecteur natif, lecture en ligne sur téléphone et descriptions françaises facultatives. La vidéo reste en pause tant que le visiteur ne la lance pas; elle se met en pause à la fermeture du lecteur.

La composition et le petit robot vectoriel sont définis dans `tools/tour-stage.html`. `tools/render-portfolio-tour.mjs` enregistre le vrai site avec Playwright : les cinq projets, les dix compétences techniques et les six qualités personnelles sont ouverts successivement. Le parcours, les langues, les centres d’intérêt, le CV, le formulaire Code vide et le contact complètent la visite.

Pour la régénérer sur macOS avec Google Chrome et FFmpeg installés :

```sh
npx playwright install ffmpeg
npm run tour:render
```

Le rendu écrit `assets/portfolio-tour-v7.mp4`, sa couverture JPEG, les descriptions `.vtt` et le découpage `portfolio-tour-scenes.json`. Les prises brutes et le CV rasterisé restent dans `.tour-render/`, ignoré par Git. Un extrait de contrôle peut être produit avec `node tools/render-portfolio-tour.mjs --sample`.

Les bruitages sont mixés par `tools/add-tour-sfx.mjs` à partir des enregistrements Kenney (CC0) conservés dans `tools/tour-sounds/`, avec leurs licences et leurs sources. Les clics tactiles, mécanismes, pas, ouvertures et accents de chapitre utilisent des fichiers distincts. L’arrivée et les déplacements du robot sont silencieux. Les moteurs, pas, sons informatiques et lasers sont exclus du mix. Le rendu enregistre les instants des actions et ajoute automatiquement une piste AAC stéréo. `npm run tour:sfx` permet de recréer uniquement le son du film existant, en conservant le montage et en ajoutant le crédit musical en fin de vidéo.

La bande-son de présentation utilise aussi « Reverie » de Scott Buckley (CC BY 4.0), en fond continu. Les crédits et les adaptations sont détaillés dans `tools/tour-sounds/music/ATTRIBUTION.md`, affichés dans le lecteur et intégrés en fin de vidéo. Les effets suivent les actions (clic, panneau, papier, changement de rubrique), sans accents de jeu à chaque compétence.

Les effets d’ouverture et de fermeture à hauteur variable ont été supprimés. Les compétences et la formation conservent la musique sans bruit de clic ; ailleurs, seul un très court tapotement de bois à faible niveau accompagne les actions.
