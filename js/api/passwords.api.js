// passwords.api.js — CRUD de senhas (endpoints atuais do Vino: /passwd e /password/:id).

import { api } from './http.js';

export const listPasswords  = ()         => api('/passwd');
export const createPassword = (data)     => api('/passwd', { method: 'POST', body: data });
export const updatePassword = (id, data) => api(`/password/${id}`, { method: 'PATCH', body: data });
export const deletePassword = (id)       => api(`/password/${id}`, { method: 'DELETE' });
