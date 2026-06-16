// config.js — ponto único de configuração do front.
// Trocar de Xano pra FastAPI depois? Muda só a BASE_URL aqui.

export const BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:Whyi2nVf/gs';

export const OTP_RESEND_COOLDOWN = 30; // segundos antes de poder reenviar OTP
export const AUTO_LOCK_MINUTES   = 10; // trava o cofre por inatividade
export const CLIPBOARD_CLEAR_SEC = 15; // limpa a senha copiada do clipboard
