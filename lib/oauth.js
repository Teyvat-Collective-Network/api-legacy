const base = 'https://discord.com/api';

export default {
  async user(options) {
    const res = await fetch(base + '/users/@me', { headers: { Authorization: `Bearer ${options.access_token}` } });
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(res.statusText), { data });
    return data;
  },

  async token(options) {
    const res = await fetch(base + '/oauth2/token', { method: 'POST', body: new URLSearchParams({
      ...options,
      grant_type: 'authorization_code',
    }) });
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(res.statusText), { data });
    return data;
  },
}