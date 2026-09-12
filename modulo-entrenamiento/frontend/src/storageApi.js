// Reemplaza a window.storage (que solo existe dentro de artefactos de
// Claude) por llamadas al backend propio. Misma forma de uso: get/set/delete.

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";
const API_KEY = import.meta.env.VITE_API_KEY || "";

async function request(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "x-api-key": API_KEY } : {}),
      ...(options.headers || {}),
    },
  });
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
