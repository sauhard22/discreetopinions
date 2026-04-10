import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

// GET /api/user/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, phone, username, is_public, created_at')
      .eq('id', req.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('get-me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/user/me
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { name, username } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      updates.name = name.trim();
    }

    if (username !== undefined) {
      if (!USERNAME_REGEX.test(username)) {
        return res.status(400).json({ error: 'Username must be 3-20 chars, lowercase alphanumeric and underscores only' });
      }

      // Check uniqueness
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', req.userId)
        .single();

      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      updates.username = username;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.userId)
      .select('id, name, phone, username, is_public, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json(user);
  } catch (err) {
    console.error('update-me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/user/toggle-public
router.patch('/toggle-public', authenticate, async (req, res) => {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('is_public')
      .eq('id', req.userId)
      .single();

    const { data: updated, error } = await supabase
      .from('users')
      .update({ is_public: !user.is_public })
      .eq('id', req.userId)
      .select('id, name, phone, username, is_public, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to toggle visibility' });
    }

    res.json(updated);
  } catch (err) {
    console.error('toggle-public error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/user/:username
router.get('/:username', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, username, is_public, created_at')
      .eq('username', req.params.username)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('get-user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
