import { API_BASE } from '../../config';
import axios from 'axios';

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

export const getMyInquiries = async (limit = 10) => {
  const { data } = await api.get('/fr/qna/my', { params: { limit } });
  // [{ postId, title, createdAt, answered }]
  return Array.isArray(data) ? data : [];
};
