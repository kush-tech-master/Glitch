export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  token: string;
}

const TOKEN_KEY = 'glitch_auth_token';
const USER_KEY = 'glitch_auth_user';

export function setAuthSession(user: AuthUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, user.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  // Set cookie with 30 days expiry for server/middleware checks
  const maxAge = 30 * 24 * 60 * 60;
  document.cookie = `glitch_auth_token=${encodeURIComponent(user.token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `glitch_user_name=${encodeURIComponent(user.name)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = 'glitch_auth_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'glitch_user_name=; path=/; max-age=0; SameSite=Lax';
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
