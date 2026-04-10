import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import OtpFlow from '../components/OtpFlow';

export default function Login() {
  const [tab, setTab] = useState('login');
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {tab === 'login' ? 'Log in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-[var(--bg-secondary)] p-1 mb-6">
          {['login', 'signup'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer border-none ${
                tab === t
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-transparent'
              }`}
            >
              {t === 'login' ? 'Login' : 'Sign Up'}
            </button>
          ))}
        </div>

        <OtpFlow key={tab} mode={tab} />
      </div>
    </div>
  );
}
