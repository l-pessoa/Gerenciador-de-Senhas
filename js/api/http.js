// http.js — wrapper do fetch: injeta o token, trata erros e o 429 (rate limit).

import { BASE_URL } from '../config.js';

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

function loginUrl() {
  return location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = localStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Sem conexão com o servidor. Tenta de novo.', 0);
  }

  // Sessão inválida/expirada -> volta pro login
  if (res.status === 401 && auth) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userID');
    localStorage.removeItem('username');
    location.href = loginUrl();
    throw new ApiError('Sessão expirada.', 401);
  }

  // Rate limit (quando o Vini ligar) -> mensagem amigável
  if (res.status === 429) {
    throw new ApiError('Muitas tentativas seguidas. Espera um pouco e tenta de novo.', 429);
  }

  let data = null;
  try { data = await res.json(); } catch { /* corpo vazio é ok */ }

  if (!res.ok) {
    throw new ApiError((data && data.message) || 'Erro no servidor.', res.status);
  }
  return data;
}
