-- Add anonymous_id to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS anonymous_id TEXT;

-- Create replies table
CREATE TABLE IF NOT EXISTS replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('owner', 'anonymous')),
  anonymous_id TEXT,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES replies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_replies_message ON replies(message_id);
CREATE INDEX IF NOT EXISTS idx_replies_reply_to ON replies(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_anonymous ON messages(anonymous_id);
