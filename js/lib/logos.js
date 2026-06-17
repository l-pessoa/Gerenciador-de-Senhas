// logos.js — categoria e ícone do serviço.
// Dados: data/services.js (categorias) + data/logos-data.js (bundle do simple-icons)
// + data/logos-extra.js (logos adicionados à mão). Tem logo? mostra o SVG; senão, inicial colorida.

import { FILTROS, ALIASES } from '../data/services.js';
import { LOGOS } from '../data/logos-data.js';
import { LOGOS_EXTRA, ALIASES_EXTRA } from '../data/logos-extra.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// junta o bundle principal com os extras (extras têm prioridade)
const ALL_LOGOS = { ...LOGOS, ...LOGOS_EXTRA };
const ALL_ALIASES = { ...ALIASES, ...ALIASES_EXTRA };

// ---- categoria ----
const CAT_LOOKUP = {};
for (const [cat, arr] of Object.entries(FILTROS)) for (const s of arr) CAT_LOOKUP[norm(s)] = cat;
export const guessCategory = (s = '') => CAT_LOOKUP[norm(s)] || 'Outros';

// ---- inicial colorida (fallback) ----
const PALETTE = [
  ['#2a1416', '#ff5b66'], ['#1c2128', '#e7eaef'], ['#241334', '#c66bff'],
  ['#16212e', '#6cb4e8'], ['#13241a', '#3ed682'], ['#2a1a16', '#ea6852'],
  ['#2a1622', '#e06ba0'], ['#1b212a', '#9aa3af'],
];
function initialsFor(service = '') {
  const name = service.trim() || '?';
  const initials = name.slice(0, 2).toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const [bg, fg] = PALETTE[h % PALETTE.length];
  return { initials, bg, fg };
}

// ---- resolve nome do serviço -> slug do logo ----
function slugFor(service) {
  const n = norm(service);
  if (ALL_LOGOS[n]) return n;
  const a = ALL_ALIASES[n];
  if (a && ALL_LOGOS[a]) return a;
  return null;
}

function logoSvg(pathData) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '22');
  svg.setAttribute('height', '22');
  svg.setAttribute('fill', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', pathData);
  svg.appendChild(path);
  return svg;
}

// monta o chip .svc-ic pronto (logo OU inicial)
export function buildServiceIcon(service = '') {
  const div = document.createElement('div');
  div.className = 'svc-ic';
  const slug = slugFor(service);
  if (slug) {
    const { p, h } = ALL_LOGOS[slug];
    div.style.background = `#${h}22`; // cor da marca bem suave
    div.style.color = '#ffffff';      // logo branco, sempre legível no escuro
    div.appendChild(logoSvg(p));
  } else {
    const { initials, bg, fg } = initialsFor(service);
    div.style.background = bg;
    div.style.color = fg;
    div.textContent = initials;
  }
  return div;
}
