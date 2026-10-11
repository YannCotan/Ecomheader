// Contenu du portfolio : modifie ce fichier pour mettre à jour le site.
// Chaque entrée de `items` devient un conteneur dans le terminal 3D.

export const profile = {
  name: 'Yann Cotan',
  email: 'Cotanyann@gmail.com',
  phone: '+225 07 09 16 84 32',
  github: '', // ex: 'https://github.com/ton-pseudo'
  linkedin: '', // ex: 'https://www.linkedin.com/in/ton-profil'
};

export const zoneMeta = {
  stack: { tag: 'A', name: 'Stack', blurb: 'Les outils que j\'utilise, du navigateur au serveur.' },
  parcours: { tag: 'B', name: 'Parcours', blurb: 'De 2020 à aujourd\'hui, un étage à la fois.' },
  projets: { tag: 'C', name: 'Projets', blurb: 'Réalisations.' },
  formation: { tag: 'D', name: 'Formation', blurb: 'Diplômes et certification.' },
  gate: { tag: '↗', name: 'Contact', blurb: 'Pour une mission ou une question.' },
  bureau: { tag: 'E', name: 'Mon bureau', blurb: 'Ce que j\'aime en dehors du code.' },
};

// Hobbies affichés sur l'ordinateur du bureau. `picks` : tes favoris (titres, artistes, jeux), à compléter.
export const hobbies = [
  { id: 'manga', label: 'Manga & anime', text: 'J\'aime regarder des mangas. C\'est ma façon de décrocher après une journée de code.', picks: [] },
  { id: 'jeux', label: 'Jeux vidéo', text: 'Je joue pendant mon temps libre : un bon moyen de réfléchir autrement aux systèmes et à leurs règles.', picks: [] },
  { id: 'musique', label: 'Musique', text: 'J\'écoute de la musique en continu, surtout quand je code.', picks: [] },
];

export const kindLabel = {
  outil: 'Outil',
  experience: 'Expérience',
  projet: 'Projet',
  formation: 'Formation',
  contact: 'Contact',
};

const C = {
  rust: '#b4452c', blue: '#2e5b86', green: '#3a7a58', ochre: '#c98a1c', steel: '#6f7c84',
  maroon: '#7d2c3b', orange: '#e5561b', white: '#dcd8cc', navy: '#263f63', teal: '#2f7a7e',
  moss: '#59803f', yellow: '#f0b400', sand: '#b7a17a',
};

export const items = [
  // ---- Zone A : stack (rangée du fond = infrastructure et back-end)
  { id: 'docker', zone: 'stack', kind: 'outil', title: 'Docker', sub: 'Infrastructure', color: C.blue, body: ['Conteneurisation des applications, du poste de développement au serveur.'], tags: ['Conteneurs', 'Déploiement'] },
  { id: 'nginx', zone: 'stack', kind: 'outil', title: 'Nginx', sub: 'Infrastructure', color: C.green, body: ['Serveur web et reverse proxy : routage, TLS, fichiers statiques.'], tags: ['Reverse proxy', 'Web'] },
  { id: 'redis', zone: 'stack', kind: 'outil', title: 'Redis', sub: 'Données', color: C.rust, body: ['Stockage clé-valeur en mémoire, utilisé pour le cache et les files.'], tags: ['Cache', 'Mémoire'] },
  { id: 'postgres', zone: 'stack', kind: 'outil', title: 'PostgreSQL', sub: 'Données', color: C.navy, body: ['Base de données relationnelle : modélisation, requêtes, intégrité.'], tags: ['SQL', 'Relationnel'] },
  { id: 'node', zone: 'stack', kind: 'outil', title: 'Node.js', sub: 'Back-end', color: C.moss, body: ['JavaScript côté serveur : API et services.'], tags: ['API', 'JavaScript'] },
  // rangée du milieu
  { id: 'react', zone: 'stack', kind: 'outil', title: 'React', sub: 'Front-end', color: C.teal, body: ['Interfaces web construites par composants.'], tags: ['UI', 'Composants'] },
  { id: 'next', zone: 'stack', kind: 'outil', title: 'Next.js', sub: 'Front-end', color: C.steel, body: ['Framework React : rendu serveur, routage et API.'], tags: ['SSR', 'React'] },
  { id: 'tailwind', zone: 'stack', kind: 'outil', title: 'Tailwind CSS', sub: 'Front-end', color: C.blue, body: ['Mise en forme rapide par classes utilitaires.'], tags: ['CSS'] },
  { id: 'js', zone: 'stack', kind: 'outil', title: 'JavaScript', sub: 'Langage', color: C.ochre, body: ['Le langage commun au front et au back.'], tags: ['ES2024'] },
  { id: 'php', zone: 'stack', kind: 'outil', title: 'PHP', sub: 'Back-end', color: C.maroon, body: ['Développement back-end web.'], tags: ['Back-end'] },
  // rangée du devant
  { id: 'html', zone: 'stack', kind: 'outil', title: 'HTML 5', sub: 'Langage', color: C.orange, body: ['Structure sémantique et accessible des pages.'], tags: ['Sémantique'] },
  { id: 'css', zone: 'stack', kind: 'outil', title: 'CSS 3', sub: 'Langage', color: C.blue, body: ['Mise en page, responsive, animations.'], tags: ['Responsive'] },
  { id: 'sql', zone: 'stack', kind: 'outil', title: 'SQL', sub: 'Données', color: C.sand, ink: '#16150f', body: ['Modélisation de données et requêtes.'], tags: ['Requêtes'] },
  { id: 'three', zone: 'stack', kind: 'outil', title: 'three.js', sub: '3D', color: C.white, ink: '#16150f', body: ['3D dans le navigateur. La cour que tu regardes en est faite.'], tags: ['WebGL'] },
  { id: 'gsap', zone: 'stack', kind: 'outil', title: 'GSAP', sub: 'Animation', color: C.green, body: ['Animation : la grue, la caméra et les panneaux de ce site.'], tags: ['Animation'] },

  // ---- Zone B : parcours (un étage de plus à chaque étape)
  { id: 'iat', zone: 'parcours', kind: 'experience', title: 'Formateur en développement web', sub: 'IAT', period: '2020 – 2021 · Stage de 3 mois', color: C.white, ink: '#16150f', body: ['Maintenance de la plateforme de formation en ligne.', 'Formation en développement web en présentiel, rédaction des cours et mise en place d\'outils pédagogiques.'], tags: ['Formation', 'Web'] },
  { id: 'wilaks', zone: 'parcours', kind: 'experience', title: 'Développeur web fullstack', sub: 'Wilaks Corporate', period: '2021 – 2022 · Stage', color: C.teal, body: ['Maquettage, élaboration du cahier des charges, développement front-end et back-end.'], tags: ['Fullstack', 'Maquettage'] },
  { id: 'at-stage', zone: 'parcours', kind: 'experience', title: 'Développeur front-end et support IT', sub: 'Abidjan Terminal', period: '2023 – 2024 · Stage', color: C.rust, body: ['Maquettage et développement front-end.', 'Support et assistance IT.'], tags: ['Front-end', 'Support IT'] },
  { id: 'at-cdd', zone: 'parcours', kind: 'experience', title: 'Développeur et assistance métier', sub: 'Abidjan Terminal', period: '2024 – 2025 · CDD', color: C.rust, body: ['Développement et assistance auprès des équipes métier.'], tags: ['Développement', 'Métier'] },
  { id: 'at-cdi', zone: 'parcours', kind: 'experience', title: 'Développeur et assistance métier', sub: 'Abidjan Terminal', period: '2026 · CDI · poste actuel', color: C.orange, body: ['Développement et assistance auprès des équipes métier.'], tags: ['Poste actuel'] },

  // ---- Zone C : projets (emplacements à remplir avec tes vrais projets)
  { id: 'p1', zone: 'projets', kind: 'projet', title: 'Gestion Achat', sub: 'Abidjan Terminal', period: 'Application interne', color: C.orange, size: 40, body: ['Application de gestion des demandes d\'achat, conçue et développée pour Abidjan Terminal.', 'Elle suit les demandes de bout en bout, des proformas jusqu\'aux commandes.'], tags: ['PHP', 'Gestion', 'Application interne'] },
  { id: 'p2', zone: 'projets', kind: 'projet', title: 'Safe Deal', sub: 'Startup · en cours de création', period: 'En cours', color: C.blue, size: 40, body: ['Startup que je suis en train de monter.', 'Plus de détails bientôt.'], tags: ['Startup', 'En cours'] },
  { id: 'p3', zone: 'projets', kind: 'projet', title: 'Projet à venir', sub: 'Emplacement réservé', color: C.green, size: 40, body: ['Cet emplacement accueillera un prochain projet.'], tags: ['À venir'] },

  // ---- Zone D : formation
  { id: 'licence', zone: 'formation', kind: 'formation', title: 'Licence Pro Génie Logiciel', sub: 'Institut Booster', period: '2023', color: C.navy, body: ['Licence professionnelle en génie logiciel.'], tags: ['Licence'] },
  { id: 'bts', zone: 'formation', kind: 'formation', title: 'BTS Informatique Développeur d\'Application', sub: 'Institut Booster', period: '2022', color: C.maroon, body: ['Brevet de technicien supérieur, option développeur d\'application.'], tags: ['BTS IDA'] },
  { id: 'itil', zone: 'formation', kind: 'formation', title: 'ITIL 4 Foundation', sub: 'Certification', color: C.ochre, body: ['Certification sur la gestion des services informatiques.'], tags: ['Certification'] },

  // ---- Contact
  { id: 'contact', zone: 'gate', kind: 'contact', title: 'Contact', sub: 'Missions freelance et questions', color: C.yellow, ink: '#16150f', office: true, body: ['Je réponds aux demandes de mission, de collaboration et de renseignements. Abidjan, Côte d\'Ivoire. Français et anglais.'], tags: ['Freelance', 'Abidjan'] },
];
