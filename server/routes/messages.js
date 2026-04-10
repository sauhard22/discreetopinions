import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/messages/:username — send anonymous message
router.post('/:username', async (req, res) => {
  try {
    const { content, anonymous_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (content.length > 500) {
      return res.status(400).json({ error: 'Message must be 500 characters or less' });
    }

    // Find receiver by username
    const { data: receiver, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', req.params.username)
      .single();

    if (userError || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        receiver_id: receiver.id,
        content: content.trim(),
        anonymous_id: anonymous_id || null,
      })
      .select('id, content, anonymous_id, created_at')
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to send message' });
    }

    res.json(message);
  } catch (err) {
    console.error('send-message error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/messages/inbox — get logged-in user's messages with replies
router.get('/inbox', authenticate, async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, content, anonymous_id, created_at')
      .eq('receiver_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    // Fetch replies for all messages
    const messageIds = (messages || []).map((m) => m.id);
    let replies = [];
    if (messageIds.length > 0) {
      const { data: replyData } = await supabase
        .from('replies')
        .select('id, message_id, author_type, anonymous_id, content, reply_to_id, created_at')
        .in('message_id', messageIds)
        .order('created_at', { ascending: true });
      replies = replyData || [];
    }

    // Attach replies to messages
    const result = (messages || []).map((msg) => ({
      ...msg,
      replies: replies.filter((r) => r.message_id === msg.id),
    }));

    res.json(result);
  } catch (err) {
    console.error('inbox error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/messages/public/:username — get public messages with replies
router.get('/public/:username', async (req, res) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_public')
      .eq('username', req.params.username)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.is_public) {
      return res.json([]);
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, content, anonymous_id, created_at')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    // Fetch replies
    const messageIds = (messages || []).map((m) => m.id);
    let replies = [];
    if (messageIds.length > 0) {
      const { data: replyData } = await supabase
        .from('replies')
        .select('id, message_id, author_type, anonymous_id, content, reply_to_id, created_at')
        .in('message_id', messageIds)
        .order('created_at', { ascending: true });
      replies = replyData || [];
    }

    const result = (messages || []).map((msg) => ({
      ...msg,
      replies: replies.filter((r) => r.message_id === msg.id),
    }));

    res.json(result);
  } catch (err) {
    console.error('public-messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/messages/:messageId/replies — add a reply (owner or anonymous)
router.post('/:messageId/replies', async (req, res) => {
  try {
    const { content, author_type, anonymous_id, reply_to_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Reply cannot be empty' });
    }

    if (content.length > 500) {
      return res.status(400).json({ error: 'Reply must be 500 characters or less' });
    }

    if (!author_type || !['owner', 'anonymous'].includes(author_type)) {
      return res.status(400).json({ error: 'Invalid author type' });
    }

    // Verify message exists
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('id, receiver_id')
      .eq('id', req.params.messageId)
      .single();

    if (msgError || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // If owner reply, verify JWT
    if (author_type === 'owner') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required for owner replies' });
      }

      const jwt = await import('jsonwebtoken');
      try {
        const payload = jwt.default.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        if (payload.userId !== message.receiver_id) {
          return res.status(403).json({ error: 'You can only reply to your own messages' });
        }
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // If replying to a specific reply, verify it belongs to same message
    if (reply_to_id) {
      const { data: parentReply } = await supabase
        .from('replies')
        .select('id')
        .eq('id', reply_to_id)
        .eq('message_id', req.params.messageId)
        .single();

      if (!parentReply) {
        return res.status(400).json({ error: 'Invalid reply reference' });
      }
    }

    const { data: reply, error: insertError } = await supabase
      .from('replies')
      .insert({
        message_id: req.params.messageId,
        author_type,
        anonymous_id: author_type === 'anonymous' ? (anonymous_id || null) : null,
        content: content.trim(),
        reply_to_id: reply_to_id || null,
      })
      .select('id, message_id, author_type, anonymous_id, content, reply_to_id, created_at')
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to send reply' });
    }

    res.json(reply);
  } catch (err) {
    console.error('reply error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
