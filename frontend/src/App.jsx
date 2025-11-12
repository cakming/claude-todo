import { AppProvider } from './context/AppContext';
import MainLayout from './components/Layout/MainLayout';
import Toast from './components/Common/Toast';
import './index.css';

function App() {
  return (
    <AppProvider>
      <MainLayout />
      <Toast />
    </AppProvider>
  );
}

export default App;
