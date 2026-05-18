import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { AuthProvider } from './app/contexts/AuthContext';
import { ErrorBoundary } from './app/components/common/ErrorBoundary';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>,
);
