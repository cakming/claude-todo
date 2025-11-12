import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import MainLayout from './components/Layout/MainLayout';
import AuthPage from './pages/AuthPage';
import Toast from './components/Common/Toast';
import Loading from './components/Common/Loading';
import './index.css';

function AppContent() {
  const { authEnabled, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  // If auth is disabled, always show the main app
  if (!authEnabled) {
    return (
      <AppProvider>
        <MainLayout />
        <Toast />
      </AppProvider>
    );
  }

  // If auth is enabled, show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // User is authenticated, show main app
  return (
    <AppProvider>
      <MainLayout />
      <Toast />
    </AppProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
