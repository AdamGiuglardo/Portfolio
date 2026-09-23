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

## Publication

La branche `main` est publiée par GitHub Pages. Après modification, envoyer les changements sur `origin/main` et attendre la fin du déploiement Pages.

## Vérifications avant publication

Vérifier les quatre filtres, les cinq dialogues (bouton Fermer et Échap), les accordéons, le menu mobile, les liens vers le CV et les images. Contrôler les petits écrans et la préférence système de réduction des animations. Vérifier la syntaxe avec `node --check script.js`.
