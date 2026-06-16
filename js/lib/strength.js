// strength.js — calcula a força de uma senha (fraca / média / forte).

export function scoreStrength(pw = '') {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { level: 'weak',   label: 'Fraca' };
  if (score <= 3) return { level: 'mid',    label: 'Média' };
  return { level: 'strong', label: 'Forte' };
}
