import { Router } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../lib/supabase.js';
import { sendOtp } from '../lib/twilio.js';

const router = Router();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Mark any existing unused OTPs for this phone as used
    await supabase
      .from('otps')
      .update({ used: true })
      .eq('phone', phone)
      .eq('used', false);

    // Insert new OTP
    const { error: insertError } = await supabase.from('otps').insert({
      phone,
      code,
      expires_at: expiresAt,
    });

    if (insertError) {
      return res.status(500).json({ error: 'Failed to generate OTP' });
    }

    // Send via Twilio
    await sendOtp(phone, code);

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('send-otp error:', err.message || err);
    res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code, name } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and code are required' });
    }

    // Find valid OTP
    const { data: otpRows, error: otpError } = await supabase
      .from('otps')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (otpError || !otpRows || otpRows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await supabase.from('otps').update({ used: true }).eq('id', otpRows[0].id);

    // Check if user exists
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (!user) {
      // Create new user (signup)
      const displayName = name || 'Anonymous User';
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ name: displayName, phone })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: 'Failed to create account' });
      }
      user = newUser;
    }

    // Issue JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, username: user.username, is_public: user.is_public } });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

export default router;
