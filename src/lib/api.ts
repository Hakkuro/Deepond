import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kanban_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
  return config;
});

export default api;
