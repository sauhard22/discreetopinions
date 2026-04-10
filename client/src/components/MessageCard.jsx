import { useState } from 'react';
import { sendReply, getAnonId } from '../lib/api';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { HiChatBubbleLeft, HiPaperAirplane, HiXMark } from 'react-icons/hi2';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function shortId(id) {
  if (!id) return null;
  return id.slice(0, 8);
}

function snippet(text, max = 40) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

export default function MessageCard({ message, isOwner, canReply, onReplyAdded }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // { id, content } of reply being responded to
  const [sending, setSending] = useState(false);

  const myAnonId = getAnonId();
  const isMyMessage = message.anonymous_id === myAnonId;

  const handleReply = (targetReply = null) => {
    setReplyingTo(targetReply);
    setReplyOpen(true);
    setReplyText('');
  };

  const submitReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const authorType = isOwner ? 'owner' : 'anonymous';
      const reply = await sendReply(message.id, {
        content: replyText.trim(),
        author_type: authorType,
        reply_to_id: replyingTo?.id || undefined,
      });
      // Only add manually if realtime is not configured (avoids duplicates)
      if (!supabase) {
        onReplyAdded?.(message.id, reply);
      }
      setReplyText('');
      setReplyOpen(false);
      setReplyingTo(null);
      toast.success('Reply sent!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const replies = message.replies || [];

  return (
    <div className={`rounded-2xl bg-[var(--bg-card)] border overflow-hidden transition-all duration-200 ${isMyMessage ? 'border-[var(--color-brand)]/30 shadow-[0_0_0_1px_rgba(99,102,241,0.1)]' : 'border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
      {/* Main message */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[10px] font-mono font-medium text-[var(--text-muted)]">
              #{shortId(message.anonymous_id) || 'unknown'}
            </span>
            {isMyMessage && (
              <span className="px-1.5 py-0.5 rounded-md bg-[var(--color-brand)]/10 text-[10px] font-medium text-[var(--color-brand)]">
                You
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--text-muted)] shrink-0">{timeAgo(message.created_at)}</span>
        </div>
        <p className="text-[15px] leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words">
          {message.content}
        </p>
        {canReply && (
          <button
            onClick={() => handleReply()}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--color-brand)] transition-colors cursor-pointer bg-transparent border-none"
          >
            <HiChatBubbleLeft className="w-3.5 h-3.5" />
            Reply
          </button>
        )}
      </div>

      {/* Replies thread */}
      {replies.length > 0 && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
          {replies.map((reply) => {
            const isReplyMine = reply.author_type === 'anonymous' && reply.anonymous_id === myAnonId;
            const replyToContent = reply.reply_to_id
              ? replies.find((r) => r.id === reply.reply_to_id)?.content
              : null;

            return (
              <div key={reply.id} className="px-4 py-3 border-b border-[var(--border)]/50 last:border-b-0">
                {/* Reply-to reference */}
                {replyToContent && (
                  <div className="mb-1.5 pl-3 border-l-2 border-[var(--text-muted)]/30">
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      replied to "{snippet(replyToContent)}"
                    </p>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {reply.author_type === 'owner' ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          Owner
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[10px] font-mono font-medium text-[var(--text-muted)]">
                          #{shortId(reply.anonymous_id) || 'unknown'}
                        </span>
                      )}
                      {isReplyMine && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[var(--color-brand)]/10 text-[10px] font-medium text-[var(--color-brand)]">
                          You
                        </span>
                      )}
                      <span className="text-[10px] text-[var(--text-muted)]">{timeAgo(reply.created_at)}</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words">
                      {reply.content}
                    </p>
                  </div>
                  {canReply && (
                    <button
                      onClick={() => handleReply({ id: reply.id, content: reply.content })}
                      className="mt-1 p-1 text-[var(--text-muted)] hover:text-[var(--color-brand)] transition-colors cursor-pointer bg-transparent border-none shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                      style={{ opacity: 1 }}
                      title="Reply"
                    >
                      <HiChatBubbleLeft className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply input */}
      {replyOpen && (
        <div className="border-t border-[var(--border)] p-3 bg-[var(--bg-secondary)]/30">
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 px-2">
              <div className="flex-1 pl-2 border-l-2 border-[var(--color-brand)]/40">
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  Replying to "{snippet(replyingTo.content)}"
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer bg-transparent border-none"
              >
                <HiXMark className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitReply()}
              placeholder={isOwner ? 'Reply as owner...' : 'Reply anonymously...'}
              maxLength={500}
              className="flex-1 px-3 py-2 text-[13px] rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)] transition-colors"
              autoFocus
            />
            <button
              onClick={submitReply}
              disabled={!replyText.trim() || sending}
              className="px-3 py-2 rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer border-none flex items-center"
            >
              {sending ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <HiPaperAirplane className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => { setReplyOpen(false); setReplyingTo(null); }}
              className="px-2 py-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer bg-transparent border-none"
            >
              <HiXMark className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
