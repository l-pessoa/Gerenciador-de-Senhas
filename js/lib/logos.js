// logos.js — por enquanto gera um ícone com as iniciais do serviço e uma cor
// estável. Depois a gente pluga os logos locais (simple-icons) aqui mesmo.

const PALETTE = [
  ['#2a1416', '#ff5b66'], ['#1c2128', '#e7eaef'], ['#241334', '#c66bff'],
  ['#16212e', '#6cb4e8'], ['#13241a', '#3ed682'], ['#2a1a16', '#ea6852'],
  ['#2a1622', '#e06ba0'], ['#1b212a', '#9aa3af'],
];

export function iconFor(service = '') {
  const name = service.trim() || '?';
  const initials = name.slice(0, 2).toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const [bg, fg] = PALETTE[h % PALETTE.length];
  return { initials, bg, fg };
}
