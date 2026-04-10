import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HiShieldCheck, HiChatBubbleLeftRight, HiLink } from 'react-icons/hi2';

const features = [
  {
    icon: HiShieldCheck,
    title: 'Truly Anonymous',
    desc: 'No sender info is ever stored. Anonymity is structural, not just hidden.',
  },
  {
    icon: HiLink,
    title: 'Shareable Link',
    desc: 'Get your unique link. Share it anywhere and receive honest messages.',
  },
  {
    icon: HiChatBubbleLeftRight,
    title: 'Your Choice',
    desc: 'Keep messages private or make them public. You\'re always in control.',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] animate-pulse" />
          Anonymous messaging
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--text-primary)] max-w-2xl leading-[1.1]">
          Get honest opinions,{' '}
          <span className="text-[var(--color-brand)]">anonymously</span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)] max-w-md leading-relaxed">
          Share your link, receive anonymous messages. No sign-ups needed to send. Your identity is never stored.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to={user ? '/dashboard' : '/login'}
            className="px-6 py-3 rounded-xl bg-[var(--color-brand)] text-white font-medium text-sm hover:bg-[var(--color-brand-dark)] transition-colors no-underline"
          >
            {user ? 'Go to Dashboard' : 'Get Started'}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-16">
        <div className="max-w-2xl mx-auto grid sm:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
            >
              <f.icon className="w-8 h-8 text-[var(--color-brand)] mb-3" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{f.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-6 border-t border-[var(--border)] text-center">
        <p className="text-xs text-[var(--text-muted)]">
          Built with care. Your anonymity is our priority.
        </p>
      </footer>
    </div>
  );
}
