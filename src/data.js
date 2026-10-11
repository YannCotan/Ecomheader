// Tout le contenu du site est ici : modifie ce fichier pour mettre à jour le portfolio.

export const profile = {
  email: 'Cotanyann@gmail.com',
  phone: '+225 07 09 16 84 32',
  phoneHref: '+2250709168432',
  github: '', // ← ajoute l'URL de ton GitHub, ex: 'https://github.com/ton-pseudo'
  linkedin: '', // ← optionnel
};

export const skills = [
  { group: 'Front-end', items: ['HTML 5', 'CSS 3', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS', 'three.js', 'GSAP'] },
  { group: 'Back-end', items: ['Node.js', 'PHP', 'REST API'] },
  { group: 'Données', items: ['PostgreSQL', 'SQL', 'Redis'] },
  { group: 'Infra & DevOps', items: ['Docker', 'Nginx', 'Réseaux', 'ITIL 4'] },
];

export const experience = [
  {
    period: '2026 — présent',
    role: 'Développeur web & assistance métier',
    org: 'Abidjan Terminal',
    type: 'CDI',
    text: 'Développement d\'outils métier et assistance aux équipes.',
  },
  {
    period: '2024 — 2025',
    role: 'Développeur & assistance métier',
    org: 'Abidjan Terminal',
    type: 'CDD',
    text: 'Développement d\'applications internes et support aux utilisateurs métier.',
  },
  {
    period: '2023 — 2024',
    role: 'Développeur front-end & support IT',
    org: 'Abidjan Terminal',
    type: 'Stage',
    text: 'Maquettage, développement front-end, support et assistance IT.',
  },
  {
    period: '2021 — 2022',
    role: 'Développeur web fullstack',
    org: 'Wilaks Corporate',
    type: 'Stage',
    text: 'Maquettage, élaboration du cahier des charges, développement front et back-end.',
  },
  {
    period: '2020 — 2021',
    role: 'Formateur en développement web',
    org: 'IAT',
    type: 'Stage de 3 mois',
    text: 'Maintenance de la plateforme de formation en ligne, rédaction des cours et outils pédagogiques, formation en présentiel.',
  },
];

// ⚠️ Projets d'exemple : remplace-les par tes vrais projets (titre, description, stack, lien).
export const projects = [
  {
    title: 'Projet à renseigner #1',
    text: 'Décris ici le problème résolu, ton rôle et le résultat obtenu.',
    stack: ['React', 'Node.js', 'PostgreSQL'],
    link: '',
  },
  {
    title: 'Projet à renseigner #2',
    text: 'Application fullstack conteneurisée avec Docker, derrière Nginx, cache Redis.',
    stack: ['Next.js', 'Redis', 'Docker', 'Nginx'],
    link: '',
  },
  {
    title: 'Projet à renseigner #3',
    text: 'Expérience interactive 3D / animations (three.js, GSAP).',
    stack: ['three.js', 'GSAP'],
    link: '',
  },
];

export const education = [
  { year: '2023', title: 'Licence Pro Génie Logiciel', place: 'Institut Booster' },
  { year: '2022', title: 'BTS Informatique Développeur d\'Application', place: 'Institut Booster' },
  { year: 'Certification', title: 'ITIL 4 Foundation', place: '' },
];
