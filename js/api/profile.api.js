// profile.api.js — conta do usuário. DEPENDE de endpoints novos no Xano
// (ver spec). Enquanto não existirem, as chamadas vão dar erro tratado.

import { api } from './http.js';

export const updateProfile  = (data)               => api('/auth/me', { method: 'PATCH', body: data });
export const changePassword = (current, novaSenha)  => api('/auth/change-password', { method: 'PUT', body: { current_password: current, new_password: novaSenha } });
export const deleteAccount  = ()                    => api('/auth/me', { method: 'DELETE' });
