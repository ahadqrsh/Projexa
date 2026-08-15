import { api, getAccessToken, setAccessToken, clearAccessToken } from './axiosInstance.js';
import { endpoints } from './endpoints.js';

let refreshPromise = null;
let onSessionExpired = () => {};

export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler;
};

const normaliseError = (error) => {
  const payload = error.response?.data;
  return {
    status: error.response?.status ?? 0,
    message:
      payload?.message ??
      (error.code === 'ECONNABORTED'
        ? 'The request timed out. Please try again.'
        : error.message === 'Network Error'
          ? 'Cannot reach the server. Is the backend running?'
          : 'Something went wrong.'),
    errors: payload?.errors ?? [],
    requestId: payload?.requestId,
    raw: payload,
  };
};

/**
 * Single-flight session refresh.
 *
 * Every caller that needs a fresh access token — the bootstrap-on-load flow in
 * authSlice AND the 401-retry flow below — goes through this ONE function,
 * sharing the same in-flight promise.
 *
 * Why this matters: the refresh token rotates on every use (auth.service.js
 * revokes the old one and issues a new one), and presenting an already-rotated
 * token trips reuse-detection, which revokes the entire session and forces a
 * re-login. React 18 StrictMode double-invokes effects in dev, so RootLayout's
 * `dispatch(bootstrapSession())` on mount actually fires twice back-to-back.
 * Without dedup, that sends two concurrent /refresh-token requests carrying the
 * SAME cookie; the first rotates it, the second then presents a token the
 * server just revoked and reuse-detection nukes the whole session — so logging
 * in, refreshing the page, and getting bounced straight back to /login on
 * every single reload. Sharing one promise means only one request ever goes
 * out no matter how many things ask for a refresh at once.
 */
export const refreshSession = () => {
  refreshPromise =
    refreshPromise ??
    api
      .post(endpoints.auth.refresh)
      .then((res) => res.data?.data ?? {})
      .finally(() => {
        refreshPromise = null;
      });
  return refreshPromise;
};

export const attachInterceptors = () => {
  api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      const status = error.response?.status;

      if (status !== 401 || !original) return Promise.reject(normaliseError(error));

      const isAuthRoute =
        original.url?.includes(endpoints.auth.refresh) ||
        original.url?.includes(endpoints.auth.login) ||
        original.url?.includes(endpoints.auth.register);

      if (isAuthRoute || original._retried) {
        clearAccessToken();
        onSessionExpired();
        return Promise.reject(normaliseError(error));
      }

      original._retried = true;

      try {
        const { accessToken } = await refreshSession();
        if (!accessToken) throw new Error('No token returned');

        setAccessToken(accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        clearAccessToken();
        onSessionExpired();
        return Promise.reject(normaliseError(error));
      }
    }
  );
};

export const unwrap = (response) => response.data?.data ?? response.data;
export const unwrapMeta = (response) => response.data?.meta ?? null;

export default attachInterceptors;
