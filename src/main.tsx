import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AppProvider } from './contexts/AppContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { DialogProvider } from './contexts/DialogContext.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <DialogProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationProvider>
                <App />
              </NotificationProvider>
            </AuthProvider>
          </ToastProvider>
        </DialogProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);

