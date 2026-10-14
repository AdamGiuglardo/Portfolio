# Portfolio — Adam Giuglardo

Portfolio personnel en HTML, CSS et JavaScript, publié sur [GitHub Pages](https://adamgiuglardo.github.io/Portfolio/).

## Développement local

```sh
python3 -m http.server 5173
```

Ouvrir http://localhost:5173. Aucune installation ni compilation nécessaire.

- `index.html` : présentation, projets, compétences, parcours et contact.
- `style.css` : thème responsive ivoire / vert, animations et réduction des mouvements.
- `script.js` : filtres, dialogues accessibles, menu mobile et animations au défilement.
- `assets/` : photo, CV et documents des projets.
- `secret.js` : ouverture du mode Code et déchiffrement local de l’arcade.
- `assets/mission-reseau.enc.json` : arcade chiffrée AES-GCM ; ses sources lisibles ne sont jamais versionnées.

## Publication

La branche `main` est publiée par GitHub Pages. Après modification, envoyer les changements sur `origin/main` et attendre la fin du déploiement Pages.

## Vérifications avant publication

Vérifier les quatre filtres, les cinq dialogues (bouton Fermer et Échap), les accordéons, le menu mobile, les liens vers le CV et les images. Contrôler les petits écrans et la préférence système de réduction des animations. Vérifier la syntaxe avec `node --check script.js`.

## Mode Code

L’arcade est préparée dans `.private/game.html`, `.private/arcade-hub.js`, `.private/fight-game.js`, `.private/quest-game.js` et `.private/action-games.js`. Ce dossier reste ignoré par Git. Le script valide la syntaxe du bundle avant de le chiffrer. Pour régénérer le fichier public, exécuter `node tools/encrypt-game.mjs` puis saisir le code au clavier. Le code n’est pas stocké dans le dépôt.

L’arcade contient Mission Réseau (cinq défis), Pixel Fight (duel en manches), Packet Quest (aventure), Neon Runner (course) et Orbit Defender (tir spatial). Vérifier le départ, les commandes clavier/tactiles, Pause/Reprendre, le retour à l’arcade et le retour au portfolio. Les scores restent en mémoire pendant la visite ; ils ne sont pas enregistrés sur un serveur.

Le chiffrement masque le contenu sans fournir une authentification côté serveur : GitHub Pages sert des fichiers statiques. Un fichier chiffré téléchargé peut faire l’objet de tentatives hors ligne, indépendamment du blocage local du formulaire.
