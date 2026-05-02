import api from './api';

export const getSetting = async (key) => {
  const res = await api.get('/settings');
  return res.data[key] || null;
};