# Terminal Cotan — portfolio de Yann Cotan

Portfolio 3D en forme de terminal à conteneurs (clin d'œil à Abidjan Terminal).
**Vite + three.js + GSAP**, JavaScript pur, aucune dépendance runtime en dehors de ces deux libs.

- Une cour 3D à explorer : un portique suit la souris, un clic ouvre un conteneur (la grue le soulève).
- Zones : A Stack · B Parcours · C Projets · D Formation · Contact.
- Vue liste accessible (et repli automatique sans WebGL).

## Lancer
```bash
npm install
npm run dev      # développement
npm run build    # production → dist/
```

## Personnaliser
Tout le contenu est dans `src/data.js` (une entrée = un conteneur) : projets, liens GitHub/LinkedIn, textes.
Les trois conteneurs de la zone C sont des emplacements à remplir avec de vrais projets.
