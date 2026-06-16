// manager.js — cérebro do cofre: views (cofre, favoritos, categorias,
// segurança, ajustes), busca, filtros e modal de senha.

import { ensureAuth } from './verify-user-logged.js';
import { listPasswords, createPassword, updatePassword, deletePassword } from './api/passwords.api.js';
import { updateProfile, changePassword, deleteAccount } from './api/profile.api.js';
import { el, clear } from './lib/dom.js';
import { scoreStrength } from './lib/strength.js';
import { iconFor } from './lib/logos.js';
import { AUTO_LOCK_MINUTES, CLIPBOARD_CLEAR_SEC } from './config.js';

// Fonte de verdade: edite só aqui.
const FILTROS = {
  'Streamings':['netflix', 'spotify', 'disney', 'prime', 'max', 'paramount', 'hbo', 'globoplay', 'deezer',
                'twitch', 'crunchyroll', 'apple', 'soundcloud', 'kick', 'zoom', 'tomato'
                ],
  'Dev':       ['github', 'gitlab', 'vercel', 'xano', 'heroku', 'digitalocean',
                'aws', 'azure', 'cloud', 'firebase', 'hackerone', 'microsoft', 
                'oracle', 'render', 'supabase', 'wordpress', 'redhat'
                ],
  'Bancos':    ['nubank', 'inter', 'itau', 'bradesco', 'c6', 'santander', 'next', 'neon', 'pagbank', 'picpay', 
                'mercadopago', 'banco', 'xp', 'mercado pago'
                ],
  'Jogos':     ['steam', 'epic', 'riot', 'xbox', 'psn', 'playstation', 'roblox', 'hytale',
                'rainboow', 'supercell', 'blizzard', 'origin', 'gog', 'ubisoft', 'nintendo'
                ],
  'Social':    ['instagram', 'facebook', 'twitter', 'x', 'tiktok', 'discord', 'linkedin', 'pinterest',
                'twitter', 'reddit', 'snapchat', 'telegram', 'whatsapp', 'messenger'
                ],
  'Email':     ['outlook', 'yahoo', 'proton', 'zoho', 'gmail', 'hotmail', 'icloud'

                ],
  'Pessoal':   ['gov', 'vertibular', 'inss', 'cnh', 'fgts', 'trabalho', 'correios', 'notebook', 'pc',
                'sed', 'sala do futuro'
                ],
  'Lojas':     ['magalu', 'magazine', 'americanas', 'mercadolivre', 'shopee',
                'submarino', 'amazon', 'carrefour', 'casasbahia', 'centauro', 
                'netshoes', 'ponto frio', 'extra', 'fast shop', 'kalunga', 
                'mercado livre', 'kabum', 'terabyte', 'pichau', 'ifood', 'keeta', 'uber', '99', 'rappi',
                'loggi', 'droga', 'nike', 'shein', 'adidas', 'reebok', 'fila', 'new balance', 'puma',
                'asics', 'vans', 'converse', 'aliexpress', 'wish', 'ebay', 'renner', 'mequi', 'burger', 'bk'
                ]
};

// Gerado a partir do FILTROS — não precisa mexer.
const CAT_LOOKUP = Object.entries(FILTROS).reduce((acc, [categoria, servicos]) => {
  servicos.forEach((s) => { acc[s] = categoria; });
  return acc;
}, {});

const guessCategory = (s = '') => CAT_LOOKUP[s.trim().toLowerCase()] || 'Outros';

const TITLES = { cofre:'Cofre', favorites:'Favoritos', categories:'Categorias', security:'Segurança', settings:'Ajustes' };

let passwords = [];
let currentUser = null;
let view = 'cofre';
let activeCat = 'all';
let searchTerm = '';
let editingId = null;

const $ = (id) => document.getElementById(id);
const icon = (name) => el('i', { class: `ti ${name}`, 'aria-hidden': 'true' });

// ---------- favoritos (local) ----------
const FAV_KEY = 'ppm:favs';
const getFavs = () => { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch { return new Set(); } };
const isFav = (id) => getFavs().has(id);
const toggleFav = (id) => { const f = getFavs(); f.has(id) ? f.delete(id) : f.add(id); localStorage.setItem(FAV_KEY, JSON.stringify([...f])); };

const countLevel = (lvl) => passwords.filter((p) => scoreStrength(p.password).level === lvl).length;

function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(Number(ts));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function toast(msg, isError = false) {
  let t = $('toast');
  if (!t) { t = el('div', { id: 'toast' }); document.body.append(t); }
  t.textContent = msg;
  t.className = `toast show${isError ? ' error' : ''}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = 'toast'; }, 2800);
}

// ===================== dados =====================
async function load() {
  try {
    const data = await listPasswords();
    passwords = (Array.isArray(data) ? data : []).map((it) => ({
      id: it.id,
      service: it.service || 'Sem nome',
      email: it.email || '—',
      password: it.password || '',
      username: it.username || '—',
      description: it.description || '—',
      last_modified: it.last_modified,
      category: guessCategory(it.service || ''),
    }));
    updateHealth();
    render();
  } catch (e) {
    toast(e.message || 'Erro ao carregar as senhas.', true);
  }
}

function updateHealth() {
  const total = passwords.length;
  const health = total ? Math.round((countLevel('strong') / total) * 100) : 0;
  $('vaultHealth').textContent = total ? `${health}%` : '—';
  $('vaultHealthBar').style.width = `${health}%`;
}

// ===================== peças reutilizáveis =====================
function statTile(bg, color, iconName, n, t) {
  return el('div', { class: 'stat' }, [
    el('div', { class: 'ico', style: `background:${bg};color:${color}` }, icon(iconName)),
    el('div', { class: 'n', text: String(n) }),
    el('div', { class: 't', text: t }),
  ]);
}

function buildCard(p) {
  const s = scoreStrength(p.password);
  const logo = iconFor(p.service);
  const dots = el('span', { class: 'dots', text: '••••••••••', dataset: { pw: p.password, shown: '0' } });

  const revealI = icon('ti-eye');
  const revealBtn = el('button', { class: 'pw-ico', 'aria-label': 'Revelar senha', onClick: () => {
    if (dots.dataset.shown === '1') { dots.textContent = '••••••••••'; dots.dataset.shown = '0'; revealI.className = 'ti ti-eye'; }
    else { dots.textContent = dots.dataset.pw; dots.dataset.shown = '1'; revealI.className = 'ti ti-eye-off'; }
  } }, revealI);

  const copyI = icon('ti-copy');
  const copyBtn = el('button', { class: 'pw-ico', 'aria-label': 'Copiar senha', onClick: () => copyPassword(p.password, copyI) }, copyI);

  const favBtn = el('button', { class: `fav${isFav(p.id) ? ' on' : ''}`, 'aria-label': 'Favoritar', onClick: () => {
    toggleFav(p.id); favBtn.classList.toggle('on');
    if (view === 'favorites') render();
  } }, icon('ti-star'));

  const rows = [
    el('div', { class: 'card-top' }, [
      el('div', { class: 'svc-ic', style: `background:${logo.bg};color:${logo.fg}`, text: logo.initials }),
      el('div', { class: 'svc-meta' }, [
        el('div', { class: 'name', text: p.service }),
        el('div', { class: 'cat', text: p.category }),
      ]),
      favBtn,
    ]),
    el('div', { class: 'row-mail' }, [icon('ti-mail'), ' ' + p.email]),
  ];

  // usuário: só aparece quando existe
  if (p.username && p.username !== '—') {
    rows.push(el('div', { class: 'row-user' }, [icon('ti-user'), ' ' + p.username]));
  }

  rows.push(el('div', { class: 'row-pw' }, [dots, revealBtn, copyBtn]));

  // descrição: só aparece quando existe
  if (p.description && p.description !== '—') {
    rows.push(el('div', { class: 'row-desc' }, [icon('ti-note'), ' ' + p.description]));
  }

  rows.push(
    el('div', { class: 'card-foot' }, [
      el('div', { class: 'strength' }, [
        el('span', { class: 'bars' }, [el('span'), el('span'), el('span')]),
        el('span', { class: 'txt', text: s.label }),
      ]),
      el('div', { class: 'card-acts' }, [
        el('button', { class: 'pw-ico', 'aria-label': 'Editar', onClick: () => openModal(p), title: `Modificada em ${formatTimestamp(p.last_modified)}` }, icon('ti-edit')),
        el('button', { class: 'pw-ico', 'aria-label': 'Excluir', onClick: () => removePassword(p) }, icon('ti-trash')),
      ]),
    ])
  );

  return el('div', { class: `card s-${s.level}` }, rows);
}

function buildGrid(list, emptyMsg = 'Nenhuma senha encontrada.') {
  if (list.length === 0) return el('div', { class: 'grid' }, [el('div', { class: 'empty', text: emptyMsg })]);
  return el('div', { class: 'grid' }, list.map(buildCard));
}

const matchesSearch = (p) => !searchTerm || p.service.toLowerCase().includes(searchTerm);

async function copyPassword(pw, iconEl) {
  try { await navigator.clipboard.writeText(pw); } catch { /* sem permissão */ }
  iconEl.className = 'ti ti-check';
  toast(`Senha copiada — vai sair do clipboard em ${CLIPBOARD_CLEAR_SEC}s.`);
  setTimeout(() => { iconEl.className = 'ti ti-copy'; }, 1200);
  setTimeout(() => { navigator.clipboard?.writeText('').catch(() => {}); }, CLIPBOARD_CLEAR_SEC * 1000);
}

// ===================== views =====================
function buildChips() {
  const wrap = el('div', { class: 'chips' });
  const cats = [...new Set(passwords.map((p) => p.category))].sort();
  const make = (cat, label) => el('button', { class: `chip${activeCat === cat ? ' on' : ''}`, text: label, dataset: { cat }, onClick: () => {
    activeCat = cat;
    [...wrap.children].forEach((c) => c.classList.toggle('on', c.dataset.cat === cat));
    $('grid-host').replaceChildren(buildGrid(passwords.filter((p) => (activeCat === 'all' || p.category === activeCat) && matchesSearch(p))));
  } });
  wrap.append(make('all', 'Todas'));
  cats.forEach((c) => wrap.append(make(c, c)));
  return wrap;
}

function renderCofre(area) {
  area.append(el('p', { class: 'welcome', text: `Bem-vindo de volta, ${currentUser?.username || ''} ` }));
  area.append(el('div', { class: 'stats' }, [
    statTile('var(--acc-bg)', 'var(--acc-h)', 'ti-key', passwords.length, 'Senhas guardadas'),
    statTile('rgba(45,212,167,.13)', 'var(--strong)', 'ti-shield-check', countLevel('strong'), 'Senhas fortes'),
    statTile('rgba(240,97,109,.13)', 'var(--weak)', 'ti-alert-triangle', countLevel('weak'), 'Precisam atenção'),
  ]));
  area.append(buildChips());
  const host = el('div', { id: 'grid-host' }, buildGrid(passwords.filter((p) => (activeCat === 'all' || p.category === activeCat) && matchesSearch(p))));
  area.append(host);
}

function renderFavorites(area) {
  const list = passwords.filter((p) => isFav(p.id) && matchesSearch(p));
  area.append(buildGrid(list, 'Você ainda não favoritou nenhuma senha. Clica na estrelinha de um card.'));
}

function renderCategories(area) {
  const cats = [...new Set(passwords.map((p) => p.category))].sort();
  let any = false;
  cats.forEach((cat) => {
    const items = passwords.filter((p) => p.category === cat && matchesSearch(p));
    if (items.length === 0) return;
    any = true;
    area.append(el('h3', { class: 'section-title', text: `${cat} · ${items.length}` }));
    area.append(buildGrid(items));
  });
  if (!any) area.append(el('div', { class: 'empty-view', text: 'Nada encontrado.' }));
}

function renderSecurity(area) {
  const total = passwords.length;
  const strong = countLevel('strong'), mid = countLevel('mid'), weak = countLevel('weak');
  area.append(el('div', { class: 'stats' }, [
    statTile('var(--acc-bg)', 'var(--acc-h)', 'ti-shield-check', total ? Math.round(strong / total * 100) + '%' : '—', 'Saúde do cofre'),
    statTile('rgba(45,212,167,.13)', 'var(--strong)', 'ti-lock', strong, 'Fortes'),
    statTile('rgba(227,179,65,.13)', 'var(--mid)', 'ti-alert-circle', mid, 'Médias'),
    statTile('rgba(240,97,109,.13)', 'var(--weak)', 'ti-alert-triangle', weak, 'Fracas'),
  ]));

  const weakList = passwords.filter((p) => scoreStrength(p.password).level === 'weak');
  area.append(el('h3', { class: 'section-title', text: `Senhas fracas · ${weakList.length}` }));
  if (weakList.length === 0) {
    area.append(el('div', { class: 'sec-item' }, [el('span', { class: 'muted', text: 'Nenhuma senha fraca.' })]));
  } else {
    const list = el('div', { class: 'sec-list' });
    weakList.forEach((p) => {
      const logo = iconFor(p.service);
      list.append(el('div', { class: 'sec-item' }, [
        el('div', { class: 'svc-ic', style: `background:${logo.bg};color:${logo.fg}`, text: logo.initials }),
        el('div', { class: 'grow' }, [el('div', { text: p.service }), el('div', { class: 'muted', text: p.category })]),
        el('span', { class: 'sec-badge weak', text: 'Fraca' }),
        el('button', { class: 'btn btn-sm', text: 'Melhorar', onClick: () => openModal(p) }),
      ]));
    });
    area.append(list);
  }

  const byPw = {};
  passwords.forEach((p) => { if (p.password) (byPw[p.password] = byPw[p.password] || []).push(p); });
  const reused = Object.values(byPw).filter((g) => g.length > 1);
  area.append(el('h3', { class: 'section-title', text: `Senhas reutilizadas · ${reused.length}` }));
  if (reused.length === 0) {
    area.append(el('div', { class: 'sec-item' }, [el('span', { class: 'muted', text: 'Nenhuma senha repetida.' })]));
  } else {
    const list = el('div', { class: 'sec-list' });
    reused.forEach((g) => {
      list.append(el('div', { class: 'sec-item' }, [
        el('div', { class: 'svc-ic', style: 'background:rgba(227,179,65,.13);color:var(--mid)' }, icon('ti-copy')),
        el('div', { class: 'grow' }, [el('div', { text: `Usada em ${g.length} serviços` }), el('div', { class: 'muted', text: g.map((p) => p.service).join(', ') })]),
        el('span', { class: 'sec-badge warn', text: 'Repetida' }),
      ]));
    });
    area.append(list);
  }
}

function field(label, id, value = '', type = 'text') {
  return el('div', { class: 'field' }, [
    el('label', { for: id, text: label }),
    el('input', { class: 'input', id, type, value }),
  ]);
}

function renderSettings(area) {
  const u = currentUser || {};
  area.append(el('div', { class: 'settings' }, [
    el('div', { class: 'card-block' }, [
      el('h4', { text: 'Perfil' }),
      el('p', { class: 'hint', text: 'Editar e excluir conta dependem de endpoints que o Vini ainda vai criar.' }),
      field('Usuário', 'set_username', u.username || ''),
      field('E-mail', 'set_email', u.email || '', 'email'),
      el('button', { class: 'btn btn-primary', text: 'Salvar alterações', onClick: saveProfile }),
    ]),
    el('div', { class: 'card-block' }, [
      el('h4', { text: 'Trocar senha' }),
      field('Senha atual', 'set_curpw', '', 'password'),
      field('Nova senha', 'set_newpw', '', 'password'),
      field('Confirmar nova senha', 'set_newpw2', '', 'password'),
      el('button', { class: 'btn btn-primary', text: 'Trocar senha', onClick: savePassword }),
    ]),
    el('div', { class: 'card-block danger' }, [
      el('h4', { text: 'Zona de perigo' }),
      el('p', { class: 'hint', text: 'Excluir a conta apaga você e todas as suas senhas. Não dá pra desfazer.' }),
      el('button', { class: 'btn btn-danger', text: 'Excluir minha conta', onClick: removeAccount }),
    ]),
  ]));
}

async function saveProfile() {
  const username = $('set_username').value.trim();
  const email = $('set_email').value.trim();
  if (!username || !email) { toast('Preenche usuário e e-mail.', true); return; }
  try {
    const me = await updateProfile({ username, email });
    currentUser = { ...currentUser, ...(me || { username, email }) };
    $('userAvatar').textContent = username.slice(0, 1).toUpperCase();
    toast('Perfil atualizado!');
  } catch (e) { toast(e.message || 'Não consegui salvar (endpoint ainda não existe?).', true); }
}

async function savePassword() {
  const cur = $('set_curpw').value, nw = $('set_newpw').value, nw2 = $('set_newpw2').value;
  if (!cur || !nw) { toast('Preenche as senhas.', true); return; }
  if (nw.length < 8) { toast('A nova senha precisa de no mínimo 8 caracteres.', true); return; }
  if (nw !== nw2) { toast('As novas senhas não conferem.', true); return; }
  try {
    await changePassword(cur, nw);
    toast('Senha trocada!');
    $('set_curpw').value = $('set_newpw').value = $('set_newpw2').value = '';
  } catch (e) { toast(e.message || 'Não consegui trocar (endpoint ainda não existe?).', true); }
}

async function removeAccount() {
  if (!confirm('Tem certeza? Isso apaga sua conta e TODAS as suas senhas. Não dá pra desfazer.')) return;
  try {
    await deleteAccount();
    localStorage.clear();
    location.href = 'pages/login.html';
  } catch (e) { toast(e.message || 'Não consegui excluir (endpoint ainda não existe?).', true); }
}

// ===================== render + navegação =====================
function render() {
  const area = $('viewArea');
  clear(area);
  $('viewTitle').textContent = TITLES[view];
  if (view === 'cofre') renderCofre(area);
  else if (view === 'favorites') renderFavorites(area);
  else if (view === 'categories') renderCategories(area);
  else if (view === 'security') renderSecurity(area);
  else if (view === 'settings') renderSettings(area);
}

function setView(v) {
  view = v;
  document.querySelectorAll('.nav-item').forEach((a) => a.classList.toggle('on', a.dataset.view === v));
  const listView = (v === 'cofre' || v === 'favorites' || v === 'categories');
  document.querySelector('.search').style.display = listView ? '' : 'none';
  $('openCreateModalBtn').style.display = listView ? '' : 'none';
  render();
}

// ===================== modal =====================
function openModal(p = null) {
  editingId = p ? p.id : null;
  $('modalTitle').textContent = p ? 'Editar senha' : 'Nova senha';
  $('formService').value     = p ? (p.service === 'Sem nome' ? '' : p.service) : '';
  $('formEmail').value       = p ? (p.email === '—' ? '' : p.email) : '';
  $('formPassword').value    = p ? p.password : '';
  $('formUsername').value    = p ? (p.username === '—' ? '' : p.username) : '';
  $('formDescription').value = p ? (p.description === '—' ? '' : p.description) : '';
  $('passwordModal').classList.add('open');
}
function closeModal() { $('passwordModal').classList.remove('open'); }

async function save() {
  const service = $('formService').value.trim();
  const email = $('formEmail').value.trim();
  const password = $('formPassword').value;
  const username = $('formUsername').value.trim();
  const description = $('formDescription').value.trim();
  if (!service || !email || !password) { toast('Preenche serviço, e-mail e senha.', true); return; }
  const body = { service, email, password, username, description };
  try {
    if (editingId != null) await updatePassword(editingId, body);
    else await createPassword(body);
    closeModal();
    toast(editingId != null ? 'Senha atualizada!' : 'Senha salva!');
    await load();
  } catch (e) { toast(e.message || 'Não consegui salvar.', true); }
}

async function removePassword(p) {
  if (!confirm(`Excluir a senha de "${p.service}"?`)) return;
  try { await deletePassword(p.id); toast('Senha removida.'); await load(); }
  catch (e) { toast(e.message || 'Não consegui excluir.', true); }
}

// ===================== auto-lock =====================
function setupAutoLock() {
  let timer;
  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { localStorage.removeItem('authToken'); location.href = 'pages/login.html'; }, AUTO_LOCK_MINUTES * 60 * 1000);
  };
  ['click', 'keydown', 'mousemove', 'touchstart'].forEach((ev) => document.addEventListener(ev, reset, { passive: true }));
  reset();
}

// ===================== listeners fixos =====================
document.querySelectorAll('.nav-item').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); setView(a.dataset.view); }));
$('openCreateModalBtn').addEventListener('click', () => openModal());
$('closeModalBtn').addEventListener('click', closeModal);
$('savePasswordBtn').addEventListener('click', save);
$('passwordModal').addEventListener('click', (e) => { if (e.target.id === 'passwordModal') closeModal(); });
$('searchInput').addEventListener('input', (e) => { searchTerm = e.target.value.trim().toLowerCase(); render(); });
$('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('authToken'); localStorage.removeItem('userID'); localStorage.removeItem('username');
  location.href = 'pages/login.html';
});

// ===================== fluxo principal =====================
async function init() {
  currentUser = await ensureAuth();
  if (!currentUser) return;
  $('userAvatar').textContent = (currentUser.username || '?').slice(0, 1).toUpperCase();
  $('userAvatar').title = currentUser.username || '';
  await load();
  setupAutoLock();
}

init();
