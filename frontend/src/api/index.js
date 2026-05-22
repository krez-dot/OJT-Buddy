import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// User
export const getMe = () => api.get('/users/me');
export const updateMe = (data) => api.put('/users/me', data);

// Companies
export const getCompanies = () => api.get('/companies');
export const createCompany = (data) => api.post('/companies', data);
export const updateCompany = (id, data) => api.put(`/companies/${id}`, data);
export const deleteCompany = (id) => api.delete(`/companies/${id}`);

// Documents
export const getDocTypes = () => api.get('/documents/types');
export const getCompanyDocs = (companyId) => api.get(`/documents/company/${companyId}`);
export const addCompanyDoc = (companyId, data) => api.post(`/documents/company/${companyId}`, data);
export const updateDoc = (id, data) => api.put(`/documents/${id}`, data);

// Logbook
export const getLogbook = () => api.get('/logbook');
export const getLogbookStats = () => api.get('/logbook/stats');
export const saveLogEntry = (data) => api.post('/logbook', data);
export const deleteLogEntry = (id) => api.delete(`/logbook/${id}`);

// Interview
export const getQuestions = () => api.get('/interview/questions');
export const updateConfidence = (id, confidence) => api.put(`/interview/questions/${id}/confidence`, { confidence });
export const addQuestion = (data) => api.post('/interview/questions', data);

// Shares
export const getShares = () => api.get('/shares');
export const createShare = (data) => api.post('/shares', data);

export default api;
