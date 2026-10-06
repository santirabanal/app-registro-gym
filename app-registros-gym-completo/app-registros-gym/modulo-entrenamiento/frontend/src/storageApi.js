// Reemplaza a window.storage (que solo existe dentro de artefactos de
// Claude) por llamadas al backend propio. Misma forma de uso: get/set/delete.
import {supabase} from './supabase.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const API_KEY = import.meta.env.VITE_API_KEY || "";

async function request(path, options = {}) {
  const session=supabase ? (await supabase.auth.getSession()).data.session : null;
  const attempts = !options.method || options.method === 'GET' ? 3 : 1;
  for (let attempt=0;attempt<attempts;attempt++) {
   try {
    const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    signal: AbortSignal.timeout(12000),
    headers: {
      "Content-Type": "application/json",
      ...(session ? {Authorization:`Bearer ${session.access_token}`} : {}),
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
      ...(options.headers || {}),
    },
  });
    if(res.status>=500 && attempt<attempts-1) continue;
    return res;
   } catch(error) {if(attempt===attempts-1) throw error;}
  }
}

export const storage = {
  async get(key) {
    const res = await request(`/kv/${encodeURIComponent(key)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`storage.get(${key}) falló: ${res.status}`);
    return res.json(); // { key, value }
  },
  async set(key, value) {
    const res = await request(`/kv/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error(`storage.set(${key}) falló: ${res.status}`);
    return res.json();
  },
  async delete(key) {
    const res = await request(`/kv/${encodeURIComponent(key)}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`storage.delete(${key}) falló: ${res.status}`);
    return res.json();
  },
};
