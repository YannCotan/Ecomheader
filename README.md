# Terminal Cotan — portfolio de Yann Cotan

Portfolio 3D en forme de terminal à conteneurs (clin d'œil à Abidjan Terminal).
**Vite + three.js + GSAP**, JavaScript pur, aucune dépendance runtime en dehors de ces deux libs.

- Une cour 3D à explorer : un portique suit la souris, un clic ouvre un conteneur (la grue le soulève).
- Zones : A Stack · B Parcours · C Projets · D Formation · Contact.
- E · Chez moi : un portail temporel mène à une chambre de gamer (écrans, étagère, platine lo-fi, voitures, cadres photo).
- Vue liste accessible (et repli automatique sans WebGL).

## Lancer
```bash
npm install
npm run dev      # développement
npm run build    # production → dist/
```

## Personnaliser
Tout le contenu est dans `src/data.js` (une entrée = un conteneur) : projets, liens GitHub/LinkedIn, textes.
Les photos sont dans `src/photos/` (remplace-les à l'identique pour les changer).
Les favoris (jeux, manga, musique, voitures) se complètent via `picks` dans `hobbies`.
