import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

const THEMES = {
  emerald: { accent: '#059669', hover: '#047857', light: '#ecfdf5' },
  blue:    { accent: '#3b82f6', hover: '#2563eb', light: '#eff6ff' },
  purple:  { accent: '#8b5cf6', hover: '#7c3aed', light: '#f5f3ff' },
  rose:    { accent: '#f43f5e', hover: '#e11d48', light: '#fff1f2' },
  orange:  { accent: '#f97316', hover: '#ea580c', light: '#fff7ed' },
  cyan:    { accent: '#06b6d4', hover: '#0891b2', light: '#ecfeff' },
};

const saved = localStorage.getItem('ojt-theme');
if (saved && THEMES[saved]) {
  const t = THEMES[saved];
  document.documentElement.style.setProperty('--accent', t.accent);
  document.documentElement.style.setProperty('--accent-hover', t.hover);
  document.documentElement.style.setProperty('--accent-light', t.light);
  document.documentElement.style.setProperty('--sidebar-active', t.accent);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
