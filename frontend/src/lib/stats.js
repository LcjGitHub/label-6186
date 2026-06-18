import api from './api.js';

export async function fetchStats() {
  const { data } = await api.get('/stats');
  return data;
}
