const STORAGE_KEY = 'taskflow_session';
let cachedSession = null;
const listeners = new Set();

const hasWindow = typeof window !== 'undefined';

const encode = (value) => {
  const json = JSON.stringify(value ?? {});
  if (!hasWindow || typeof window.btoa !== 'function' || typeof TextEncoder === 'undefined') {
    return json;
  }
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

const decode = (value) => {
  if (!value) return null;
  try {
    if (!hasWindow || typeof window.atob !== 'function' || typeof TextDecoder === 'undefined') {
      return JSON.parse(value);
    }
    const binary = window.atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch (error) {
    console.warn('Failed to decode session payload', error);
    return null;
  }
};

const readFromStorage = () => {
  if (!hasWindow || typeof window.sessionStorage === 'undefined') return null;
  const data = window.sessionStorage.getItem(STORAGE_KEY);
  const session = decode(data);
  cachedSession = session;
  return session;
};

const persist = (session) => {
  if (!hasWindow || typeof window.sessionStorage === 'undefined') {
    cachedSession = session;
    return;
  }
  if (!session) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    cachedSession = null;
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, encode(session));
  cachedSession = session;
};

export const getSession = () => {
  if (cachedSession) return cachedSession;
  return readFromStorage();
};

export const setSession = (session) => {
  const normalized = session ? { ...session } : null;
  persist(normalized);
  listeners.forEach((listener) => listener(normalized));
  return normalized;
};

export const updateSessionUser = (user) => {
  const session = getSession();
  if (!session) return null;
  const updated = { ...session, user };
  return setSession(updated);
};

export const clearSession = () => setSession(null);

export const subscribe = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

export const getAccessToken = () => getSession()?.accessToken || null;
export const getRefreshToken = () => getSession()?.refreshToken || null;

export const isSessionExpired = (session, skewMs = 0) => {
  if (!session?.expiresAt) return true;
  return Date.now() + skewMs >= session.expiresAt;
};

export const ensureSessionHydrated = () => getSession();

ensureSessionHydrated();
