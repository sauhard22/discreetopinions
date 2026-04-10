import MessageCard from './MessageCard';

export default function MessageFeed({ messages, isOwner, canReply, onReplyAdded }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <MessageCard
          key={msg.id}
          message={msg}
          isOwner={isOwner}
          canReply={canReply}
          onReplyAdded={onReplyAdded}
        />
      ))}
    </div>
  );
}
