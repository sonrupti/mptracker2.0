// lib/auth.ts
// Simple client-side auth helper

export function getCitizen() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('loklens_citizen');
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data.loggedIn ? data : null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return getCitizen() !== null;
}

export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('loklens_citizen');
}
