import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

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
export const changePassword = (data) => api.put('/users/me/password', data);
export const deleteAccount = () => api.delete('/users/me');

// Companies
export const getCompanies = () => api.get('/companies');
export const createCompany = (data) => api.post('/companies', data);
export const updateCompany = (id, data) => api.put(`/companies/${id}`, data);
export const deleteCompany = (id) => api.delete(`/companies/${id}`);
export const getCompanyHistory = (id) => api.get(`/companies/${id}/history`);

// Documents
export const getDocTypes = () => api.get('/documents/types');
export const getCompanyDocs = (companyId) => api.get(`/documents/company/${companyId}`);
export const addCompanyDoc = (companyId, data) => api.post(`/documents/company/${companyId}`, data);
export const updateDoc = (id, data) => api.put(`/documents/${id}`, data);

// Logbook
export const getLogbook = () => api.get('/logbook');
export const getLogbookStats = () => api.get('/logbook/stats');
export const getWeeklyHours = () => api.get('/logbook/weekly');
export const saveLogEntry = (data) => api.post('/logbook', data);
export const updateLogEntry = (id, data) => api.put(`/logbook/${id}`, data);
export const deleteLogEntry = (id) => api.delete(`/logbook/${id}`);

// Interview
export const getQuestions = () => api.get('/interview/questions');
export const updateConfidence = (id, confidence) => api.put(`/interview/questions/${id}/confidence`, { confidence });
export const addQuestion = (data) => api.post('/interview/questions', data);
export const deleteQuestion = (id) => api.delete(`/interview/questions/${id}`);

// Shares
export const getShares = () => api.get('/shares');
export const createShare = (data) => api.post('/shares', data);
export const updateShare = (id, data) => api.put(`/shares/${id}`, data);
export const deleteShare = (id) => api.delete(`/shares/${id}`);

// AI
export const aiInterviewFeedback = (data) => api.post('/ai/interview-feedback', data);
export const aiLogbookHelper = (data) => api.post('/ai/logbook-helper', data);
export const aiCompanyResearch = (data) => api.post('/ai/company-research', data);
export const aiAutofillCompany = (data) => api.post('/ai/autofill-company', data);
export const aiSuggestCompanies = (data) => api.post('/ai/suggest-companies', data);
export const aiResumeSummary = (data) => api.post('/ai/resume-summary', data);
export const aiChat = (data) => api.post('/ai/chat', data);

export default api;
