import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import { HiOutlineInbox, HiArrowRightOnRectangle } from 'react-icons/hi2';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--bg-primary)]/80 border-b border-[var(--border)]">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight text-[var(--text-primary)] no-underline">
          discreet<span className="text-[var(--color-brand)]">opinions</span>
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                aria-label="Dashboard"
              >
                <HiOutlineInbox className="w-5 h-5 text-[var(--text-secondary)]" />
              </Link>
              <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                aria-label="Log out"
              >
                <HiArrowRightOnRectangle className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="ml-2 px-4 py-1.5 text-sm font-medium rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] transition-colors no-underline"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
