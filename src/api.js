import axios from "axios";
import { store } from "./store";
import { setToken, clearAuth, setUser } from "./store/authSlice";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth?.token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingRequests = [];

function onRefreshed(newToken) {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshRes = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken, user } = refreshRes.data || {};
        if (!accessToken) throw new Error("No token");
        store.dispatch(setToken(accessToken));
        if (user) store.dispatch(setUser({ user, token: accessToken }));
        onRefreshed(accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (e) {
        store.dispatch(clearAuth());
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;


