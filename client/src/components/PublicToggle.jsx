import { useState } from 'react';
import { togglePublic } from '../lib/api';
import toast from 'react-hot-toast';

export default function PublicToggle({ isPublic, onToggle }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const updated = await togglePublic();
      onToggle(updated.is_public);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Make messages public</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Anyone visiting your profile can see your messages</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer border-none shrink-0 ml-4 ${
          isPublic ? 'bg-[var(--color-brand)]' : 'bg-[var(--border)]'
        }`}
        role="switch"
        aria-checked={isPublic}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-sm ${
            isPublic ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
