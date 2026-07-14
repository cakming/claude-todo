import { useState } from 'react';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import ForgotPasswordForm from '../components/Auth/ForgotPasswordForm';
import ResetPasswordForm from '../components/Auth/ResetPasswordForm';

export default function AuthPage({ onSuccess }) {
  // A reset link (?reset_token=&email=) opens the reset form directly.
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get('reset_token');
  const resetEmail = params.get('email');

  const [mode, setMode] = useState(resetToken ? 'reset' : 'login');

  const clearResetUrl = () => {
    window.history.replaceState({}, '', window.location.pathname);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full">
        {mode === 'login' && (
          <LoginForm
            onSwitchToRegister={() => setMode('register')}
            onForgot={() => setMode('forgot')}
            onSuccess={onSuccess}
          />
        )}
        {mode === 'register' && (
          <RegisterForm onSwitchToLogin={() => setMode('login')} onSuccess={onSuccess} />
        )}
        {mode === 'forgot' && <ForgotPasswordForm onBackToLogin={() => setMode('login')} />}
        {mode === 'reset' && (
          <ResetPasswordForm
            initialEmail={resetEmail || ''}
            initialToken={resetToken || ''}
            onSuccess={() => {
              clearResetUrl();
              setMode('login');
            }}
            onBackToLogin={() => {
              clearResetUrl();
              setMode('login');
            }}
          />
        )}
      </div>
    </div>
  );
}
