import { API_BASE } from '../../config';
import axios from 'axios';
import { attachRefreshInterceptor } from '../../lib/tokenRefresh';

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem('accessToken') ||
    sessionStorage.getItem('accessToken') ||
    sessionStorage.getItem('ACCESS_TOKEN') ||
    sessionStorage.getItem('ACCESS_TOKEN');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
attachRefreshInterceptor(api);

export const getOwnerMonthlyRevenue = async () => {
  const { data } = await api.get('/fr/owner/revenue/monthly');
  // data: [{year:2025, month:8, revenue:1234567}, ...]
  return data;
};
