import { useState } from 'react';
import { sendOtp, verifyOtp } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function OtpFlow({ mode }) {
  const [step, setStep] = useState('phone'); // phone | otp
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    if (mode === 'signup' && !name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phone.trim(), mode === 'signup' ? name.trim() : undefined);
      toast.success('OTP sent!');
      setStep('otp');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      const data = await verifyOtp(phone.trim(), code.trim(), mode === 'signup' ? name.trim() : undefined);
      login(data.token, data.user);
      toast.success('Welcome!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] text-sm transition-colors"
            />
          )}
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (e.g. +1234567890)"
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] text-sm transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full py-2.5 rounded-xl bg-[var(--color-brand)] text-white font-medium text-sm hover:bg-[var(--color-brand-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer border-none"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Send OTP'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Enter the 6-digit code sent to <span className="font-medium text-[var(--text-primary)]">{phone}</span>
          </p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] text-sm text-center tracking-[0.3em] font-mono text-lg transition-colors"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-2.5 rounded-xl bg-[var(--color-brand)] text-white font-medium text-sm hover:bg-[var(--color-brand-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer border-none"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Verify'
            )}
          </button>
          <button
            type="button"
            onClick={() => { setStep('phone'); setCode(''); }}
            className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none"
          >
            Change number
          </button>
        </form>
      )}
    </div>
  );
}
