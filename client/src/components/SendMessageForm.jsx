import { useState } from 'react';
import { sendMessage } from '../lib/api';
import toast from 'react-hot-toast';
import { HiPaperAirplane, HiCheck } from 'react-icons/hi2';

export default function SendMessageForm({ username, onSent }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(username, content.trim());
      setSent(true);
      setContent('');
      onSent?.();
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <HiCheck className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="text-[var(--text-primary)] font-medium">Message delivered!</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">Your identity stays completely anonymous</p>
        <button
          onClick={() => setSent(false)}
          className="mt-4 text-sm text-[var(--color-brand)] hover:text-[var(--color-brand-light)] font-medium cursor-pointer bg-transparent border-none"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Type your anonymous message..."
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] text-[15px] transition-colors"
        />
        <span className="absolute bottom-3 right-3 text-xs text-[var(--text-muted)]">
          {content.length}/500
        </span>
      </div>
      <button
        type="submit"
        disabled={!content.trim() || sending}
        className="w-full py-2.5 px-4 rounded-xl bg-[var(--color-brand)] text-white font-medium text-sm hover:bg-[var(--color-brand-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer border-none"
      >
        {sending ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <HiPaperAirplane className="w-4 h-4" />
            Send Anonymously
          </>
        )}
      </button>
    </form>
  );
}
