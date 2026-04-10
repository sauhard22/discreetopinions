import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getInbox, updateMe } from '../lib/api';
import { useRealtime, useRealtimeReplies } from '../hooks/useRealtime';
import MessageFeed from '../components/MessageFeed';
import PublicToggle from '../components/PublicToggle';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';
import { HiClipboard, HiPencil, HiCheck, HiXMark, HiEnvelope } from 'react-icons/hi2';

export default function Dashboard() {
  const { user, loading: authLoading, setUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  useEffect(() => {
    if (!user) return;
    getInbox()
      .then(setMessages)
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  }, [user]);

  // Realtime: new messages arriving
  const handleNewMessage = useCallback((newMsg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [{ ...newMsg, replies: [] }, ...prev];
    });
    toast('New message received!', { icon: '💬' });
  }, []);

  useRealtime('messages', 'receiver_id', user?.id, handleNewMessage);

  // Realtime: new replies arriving
  const messageIds = useMemo(() => messages.map((m) => m.id), [messages]);

  const handleNewReply = useCallback((newReply) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== newReply.message_id) return msg;
        if ((msg.replies || []).some((r) => r.id === newReply.id)) return msg;
        return { ...msg, replies: [...(msg.replies || []), newReply] };
      })
    );
  }, []);

  useRealtimeReplies(messageIds, handleNewReply);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const profileUrl = user.username
    ? `${window.location.origin}/${user.username}`
    : null;

  const copyLink = () => {
    if (!profileUrl) {
      toast.error('Set a username first to get your link');
      return;
    }
    navigator.clipboard.writeText(profileUrl);
    toast.success('Link copied!');
  };

  const startEditUsername = () => {
    setUsernameInput(user.username || '');
    setEditingUsername(true);
  };

  const saveUsername = async () => {
    if (!usernameInput.trim()) return;
    setSavingUsername(true);
    try {
      const updated = await updateMe({ username: usernameInput.trim().toLowerCase() });
      setUser(updated);
      setEditingUsername(false);
      toast.success('Username updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingUsername(false);
    }
  };

  const handleReplyAdded = (messageId, reply) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, replies: [...(msg.replies || []), reply] }
          : msg
      )
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={user.name} size="lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">{user.name}</h1>
          {editingUsername ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-[var(--text-muted)]">/</span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={20}
                className="flex-1 px-2 py-1 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-brand)]"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveUsername()}
              />
              <button onClick={saveUsername} disabled={savingUsername} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer bg-transparent border-none">
                <HiCheck className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingUsername(false)} className="p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] rounded cursor-pointer bg-transparent border-none">
                <HiXMark className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-[var(--text-secondary)]">
                {user.username ? `/${user.username}` : 'No username set'}
              </p>
              <button onClick={startEditUsername} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded cursor-pointer bg-transparent border-none">
                <HiPencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Share link */}
      <div className="mb-4 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Your shareable link</p>
        {profileUrl ? (
          <button
            onClick={copyLink}
            className="w-full p-3 rounded-lg bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 flex items-center justify-between hover:bg-[var(--color-brand)]/15 transition-colors cursor-pointer"
          >
            <span className="text-sm text-[var(--color-brand)] font-medium truncate">{profileUrl}</span>
            <HiClipboard className="w-4 h-4 text-[var(--color-brand)] shrink-0 ml-2" />
          </button>
        ) : (
          <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">Set a username to get your link</span>
            <button
              onClick={startEditUsername}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] transition-colors cursor-pointer border-none"
            >
              Set username
            </button>
          </div>
        )}
      </div>

      {/* Public toggle */}
      <div className="mb-6">
        <PublicToggle
          isPublic={user.is_public}
          onToggle={(val) => setUser({ ...user, is_public: val })}
        />
      </div>

      {/* Messages */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Inbox</h2>
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]">
          {messages.length}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--color-brand)] rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center">
            <HiEnvelope className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-primary)] font-medium mb-1">No messages yet</p>
          <p className="text-sm text-[var(--text-muted)] mb-4">Share your link to start receiving anonymous messages</p>
          {profileUrl && (
            <button
              onClick={copyLink}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] transition-colors cursor-pointer border-none"
            >
              Copy your link
            </button>
          )}
        </div>
      ) : (
        <MessageFeed
          messages={messages}
          isOwner={true}
          canReply={true}
          onReplyAdded={handleReplyAdded}
        />
      )}
    </div>
  );
}
