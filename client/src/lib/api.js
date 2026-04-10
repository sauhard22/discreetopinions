const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

// Anonymous ID — persisted in localStorage
export function getAnonId() {
  let id = localStorage.getItem('anon_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('anon_id', id);
  }
  return id;
}

// Auth
export const sendOtp = (phone, name) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone, name }) });
export const verifyOtp = (phone, code, name) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code, name }) });

// User
export const getMe = () => request('/user/me');
export const updateMe = (data) => request('/user/me', { method: 'PATCH', body: JSON.stringify(data) });
export const togglePublic = () => request('/user/toggle-public', { method: 'PATCH' });
export const getPublicUser = (username) => request(`/user/${username}`);

// Messages
export const sendMessage = (username, content) =>
  request(`/messages/${username}`, { method: 'POST', body: JSON.stringify({ content, anonymous_id: getAnonId() }) });
export const getInbox = () => request('/messages/inbox');
export const getPublicMessages = (username) => request(`/messages/public/${username}`);

// Replies
export const sendReply = (messageId, { content, author_type, reply_to_id }) =>
  request(`/messages/${messageId}/replies`, {
    method: 'POST',
    body: JSON.stringify({
      content,
      author_type,
      anonymous_id: author_type === 'anonymous' ? getAnonId() : undefined,
      reply_to_id,
    }),
  });
