// auth.js — liga os formulários de login, cadastro e OTP na API.

import { api, ApiError } from './api/http.js';
import { redirectIfLoggedIn } from './verify-user-logged.js';
import { OTP_RESEND_COOLDOWN } from './config.js';

// ---------- toast (mesma cara do cofre) ----------
function toast(msg, isError = false) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.append(t); }
  t.textContent = msg;
  t.className = `toast show${isError ? ' error' : ''}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.className = 'toast'; }, 2800);
}

// ---------- mostrar/ocultar senha ----------
document.querySelectorAll('.js-toggle-pw').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const i = btn.querySelector('i');
    if (!input) return;
    if (input.type === 'password') { input.type = 'text'; i.className = 'ti ti-eye-off'; }
    else { input.type = 'password'; i.className = 'ti ti-eye'; }
  });
});

// ---------- estado de "carregando" nos botões ----------
function setLoading(btn, on, busyText = 'Aguarde...') {
  if (!btn) return;
  if (on) { btn.dataset.label = btn.textContent; btn.disabled = true; btn.textContent = busyText; }
  else { btn.disabled = false; if (btn.dataset.label) btn.textContent = btn.dataset.label; }
}

// =================== LOGIN ===================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  redirectIfLoggedIn();
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('button[type=submit]');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) { toast('Preenche usuário e senha.', true); return; }
    setLoading(btn, true);
    try {
      const ok = await api('/auth/login', { method: 'POST', body: { username, password }, auth: false });
      if (ok !== true) throw new ApiError('Usuário ou senha inválidos.', 401);
      await api('/auth/generate-otp', { method: 'PUT', body: { username }, auth: false });
      localStorage.setItem('otpUser', username);
      location.href = 'verify-otp.html';
    } catch (err) {
      toast(err.message || 'Não consegui entrar.', true);
      setLoading(btn, false);
    }
  });
}

// =================== CADASTRO ===================
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  redirectIfLoggedIn();
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = signupForm.querySelector('button[type=submit]');
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm_password').value;
    if (!username || !email || !password) { toast('Preenche todos os campos.', true); return; }
    if (password.length < 8) { toast('A senha precisa de no mínimo 8 caracteres.', true); return; }
    if (password !== confirm_password) { toast('As senhas não conferem.', true); return; }
    setLoading(btn, true);
    try {
      await api('/auth/signup', { method: 'POST', body: { username, email, password, confirm_password }, auth: false });
      toast('Conta criada! Indo pro login...');
      setTimeout(() => { location.href = 'login.html'; }, 1200);
    } catch (err) {
      toast(err.message || 'Não consegui cadastrar.', true);
      setLoading(btn, false);
    }
  });
}

// =================== VERIFICAR OTP ===================
const verifyOtpForm = document.getElementById('verifyOtpForm');
if (verifyOtpForm) {
  const otpUser = localStorage.getItem('otpUser');
  if (!otpUser) { location.href = 'login.html'; }

  verifyOtpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = verifyOtpForm.querySelector('button[type=submit]');
    const otp = document.getElementById('otp').value.trim();
    if (!otp) { toast('Digita o código.', true); return; }
    setLoading(btn, true);
    try {
      const data = await api(`/auth/verify-login/${otp}`, { method: 'PUT', body: { username: otpUser }, auth: false });
      if (!data || !data.authToken) throw new ApiError('Código inválido. Tenta de novo.', 400);
      localStorage.setItem('authToken', data.authToken);
      localStorage.removeItem('otpUser');
      location.href = '../index.html';
    } catch (err) {
      toast(err.message || 'Código inválido.', true);
      setLoading(btn, false);
    }
  });

  const resendBtn = document.getElementById('btnResendOtp');
  if (resendBtn) {
    let cooling = false;
    const startCooldown = () => {
      cooling = true;
      let left = OTP_RESEND_COOLDOWN;
      const tick = () => {
        if (left <= 0) { cooling = false; resendBtn.textContent = 'Reenviar código'; resendBtn.classList.remove('disabled'); return; }
        resendBtn.textContent = `Reenviar em ${left}s`;
        resendBtn.classList.add('disabled');
        left--;
        setTimeout(tick, 1000);
      };
      tick();
    };
    resendBtn.addEventListener('click', async () => {
      if (cooling) return;
      try {
        await api('/auth/generate-otp', { method: 'PUT', body: { username: otpUser }, auth: false });
        toast('Novo código enviado pro seu e-mail.');
        startCooldown();
      } catch (err) {
        toast(err.message || 'Não consegui reenviar.', true);
      }
    });
  }
}
