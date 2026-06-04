const BASE = '/api';

function getToken() {
  return localStorage.getItem('worship_token');
}

async function req(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export const api = {
  login: (password) => req('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),

  getSongs: () => req('/songs'),
  getSong: (id) => req(`/songs/${id}`),
  createSong: (data) => req('/songs', { method: 'POST', body: JSON.stringify(data) }),
  updateSong: (id, data) => req(`/songs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSong: (id) => req(`/songs/${id}`, { method: 'DELETE' }),
  reorderSongs: (order) => req('/songs/reorder/bulk', { method: 'PUT', body: JSON.stringify({ order }) }),
  updateSundayDate: (date) => req('/songs/settings/sunday-date', { method: 'PUT', body: JSON.stringify({ date }) }),

  isLoggedIn: () => !!getToken(),
  setToken: (token) => localStorage.setItem('worship_token', token),
  logout: () => localStorage.removeItem('worship_token'),
};
