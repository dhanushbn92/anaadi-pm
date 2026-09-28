import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
export const WHO_KEY = 'anaadi_pm_who';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const who = localStorage.getItem(WHO_KEY);
  if (who) {
    config.headers['X-User-Name'] = who;
  }
  return config;
});

export function apiErrorMessage(err, fallback = 'Something went wrong') {
  return err?.response?.data?.error || fallback;
}

export default api;
