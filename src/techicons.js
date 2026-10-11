// Logos des technologies (Simple Icons). Import nommé : seuls ces logos sont embarqués dans le build.
import { siReact, siNextdotjs, siNodedotjs, siPostgresql, siRedis, siDocker, siNginx, siPhp, siTailwindcss, siJavascript, siHtml5, siCss, siThreedotjs, siGreensock, siMysql, siGithub } from 'simple-icons';

const ICONS = {
  'react': siReact, 'next.js': siNextdotjs, 'node.js': siNodedotjs, 'postgresql': siPostgresql, 'redis': siRedis,
  'docker': siDocker, 'nginx': siNginx, 'php': siPhp, 'tailwind css': siTailwindcss, 'javascript': siJavascript,
  'html 5': siHtml5, 'css 3': siCss, 'three.js': siThreedotjs, 'gsap': siGreensock, 'mysql': siMysql, 'github': siGithub,
};

// couleur de marque, remplacée par l'encre du thème si elle est trop claire pour un fond papier
const lum = (hex) => { const n = parseInt(hex, 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

export const hasIcon = (name) => !!ICONS[String(name).toLowerCase()];

export function iconSvg(name, size = 16) {
  const i = ICONS[String(name).toLowerCase()];
  if (!i) return '';
  const fill = lum(i.hex) > 0.8 ? '#16150f' : `#${i.hex}`;
  return `<svg class="tech" width="${size}" height="${size}" viewBox="0 0 24 24" role="img" aria-label="${i.title}" fill="${fill}"><path d="${i.path}"/></svg>`;
}
