import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      localStorage.removeItem('fullName');
      window.dispatchEvent(new Event('auth-changed'));
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const login    = (email, password)           => api.post('/auth/login',    { email, password }).then(r => r.data);
export const register = (email, password, fullName) => api.post('/auth/register', { email, password, fullName }).then(r => r.data);

// ---- Food analysis ----
// Accepts either a File (upload flow) or a Blob (camera-capture flow).
// The backend only cares about the multipart \"file\" part + content-type prefix.
export const analyzeFood = (fileOrBlob, filename = 'capture.jpg') => {
  const fd = new FormData();
  if (fileOrBlob instanceof File) {
    fd.append('file', fileOrBlob);
  } else {
    // Blob from camera → wrap with an explicit filename so the server sees \"image/*\"
    fd.append('file', fileOrBlob, filename);
  }
  return api.post('/food/analyze', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};

export const getHistory        = ()   => api.get('/food/history').then(r => r.data);
export const getHistoryDetail  = (id) => api.get(`/food/history/${id}`).then(r => r.data);
export const getDashboard      = ()   => api.get('/food/dashboard').then(r => r.data);

// DELETE /api/food/history/{id} — removes a single scan owned by the caller.
export const deleteHistoryItem = (id) => api.delete(`/food/history/${id}`).then(r => r.data);