import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicUser, getPublicMessages } from '../lib/api';
import { useRealtime, useRealtimeReplies } from '../hooks/useRealtime';
import SendMessageForm from '../components/SendMessageForm';
import MessageFeed from '../components/MessageFeed';
import Avatar from '../components/Avatar';
import { HiLockClosed } from 'react-icons/hi2';

export default function Profile() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchData = async () => {
    try {
      const userData = await getPublicUser(username);
      setUser(userData);
      if (userData.is_public) {
        const msgs = await getPublicMessages(username);
        setMessages(msgs);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [username]);

  // Realtime: new messages on this profile
  const handleNewMessage = useCallback((newMsg) => {
    if (!user?.is_public) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [{ ...newMsg, replies: [] }, ...prev];
    });
  }, [user?.is_public]);

  useRealtime('messages', 'receiver_id', user?.id, handleNewMessage);

  // Realtime: new replies
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

  const handleReplyAdded = (messageId, reply) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, replies: [...(msg.replies || []), reply] }
          : msg
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--border)] border-t-[var(--color-brand)] rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
        <p className="text-4xl mb-2">404</p>
        <p className="text-[var(--text-secondary)]">This profile doesn't exist</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {/* Profile header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Avatar name={user.name} size="lg" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{user.name}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">@{user.username}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-3">
          Send me an anonymous message
        </p>
      </div>

      {/* Send form */}
      <div className="mb-10">
        <SendMessageForm
          username={user.username}
          onSent={() => {
            if (user.is_public) {
              getPublicMessages(username).then(setMessages);
            }
          }}
        />
      </div>

      {/* Public messages with reply support */}
      {user.is_public ? (
        messages.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
              Messages
            </h2>
            <MessageFeed
              messages={messages}
              isOwner={false}
              canReply={true}
              onReplyAdded={handleReplyAdded}
            />
          </div>
        )
      ) : (
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <HiLockClosed className="w-4 h-4" />
            Messages are private
          </div>
        </div>
      )}
    </div>
  );
}
