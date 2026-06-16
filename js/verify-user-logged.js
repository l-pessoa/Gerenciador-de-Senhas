// verify-user-logged.js — o "porteiro": confere a sessão e redireciona.
// ensureAuth() roda nas páginas protegidas; redirectIfLoggedIn() nas de auth.

import { api } from './api/http.js';

const inPages = () => location.pathname.includes('/pages/');
const loginUrl = () => (inPages() ? 'login.html' : 'pages/login.html');
const homeUrl  = () => (inPages() ? '../index.html' : 'index.html');

export async function ensureAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) { location.href = loginUrl(); return null; }
  try {
    const me = await api('/auth/me');
    localStorage.setItem('userID', me.id);
    localStorage.setItem('username', me.username);
    return me;
  } catch {
    // api() já trata o 401; aqui cobre o resto
    location.href = loginUrl();
    return null;
  }
}

export async function redirectIfLoggedIn() {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  try { await api('/auth/me'); location.href = homeUrl(); }
  catch { localStorage.removeItem('authToken'); }
}
