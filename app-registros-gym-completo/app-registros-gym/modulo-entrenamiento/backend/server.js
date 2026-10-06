import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {authenticate} from './auth.js';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 4,
  keepAlive: true,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});
// Una conexión inactiva interrumpida no debe detener la API.
pool.on('error', (err) => console.error('Conexión PostgreSQL interrumpida:', err.code || 'connection_error'));

const app = express();
app.use(cors());
app.use(express.json());

// Protección simple: si configurás API_KEY en las variables de entorno,
// todas las requests tienen que mandarla en el header x-api-key. Sin esto,
// cualquiera que tenga la URL del backend podría leer/escribir tus datos.
const API_KEY = process.env.API_KEY;
app.use((req, res, next) => {
  if (!API_KEY) return next(); // sin key configurada (ej. desarrollo local), no se exige
  if (req.header("x-api-key") !== API_KEY) {
    return res.status(401).json({ error: "No autorizado" });
  }
  next();
});

app.get("/", (_req, res) => res.json({ ok: true }));

app.get("/health", async (_req, res) => {
  if (!process.env.DATABASE_URL) return res.status(503).json({ok:false,error:"Falta configurar DATABASE_URL en backend/.env"});
  try {
    await pool.query("SELECT key FROM kv_store LIMIT 1");
    res.json({ok:true,database:true});
  } catch {
    res.status(503).json({ok:false,error:"No se pudo conectar a la base de datos o falta crear kv_store"});
  }
});

app.use("/kv", (_req, res, next) => {
  if (!process.env.DATABASE_URL) return res.status(503).json({error:"Falta configurar DATABASE_URL en backend/.env"});
  next();
});
app.use('/kv', authenticate);

app.get("/kv/:key", async (req, res) => {
  try {
    const { rows } = req.userId
      ? await pool.query('SELECT value FROM user_kv_store WHERE user_id=$1 AND key=$2',[req.userId,req.params.key])
      : await pool.query("SELECT value FROM kv_store WHERE key = $1", [req.params.key]);
    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json({ key: req.params.key, value: rows[0].value });
  } catch (err) {
    console.error('Lectura PostgreSQL:', err.code || 'connection_error');
    res.status(500).json({ error: "Error leyendo la base de datos" });
  }
});

app.put("/kv/:key", async (req, res) => {
  const { value } = req.body;
  if (typeof value !== "string") {
    return res.status(400).json({ error: "'value' debe ser un string (ya serializado con JSON.stringify)" });
  }
  try {
    if(req.userId) await pool.query(
      'INSERT INTO user_kv_store (user_id,key,value,updated_at) VALUES ($1,$2,$3,now()) ON CONFLICT (user_id,key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()',
      [req.userId,req.params.key,value]);
    else await pool.query(
      `INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
      [req.params.key, value]
    );
    res.json({ key: req.params.key, value });
  } catch (err) {
    console.error('Escritura PostgreSQL:', err.code || 'connection_error');
    res.status(500).json({ error: "Error guardando en la base de datos" });
  }
});

app.delete("/kv/:key", async (req, res) => {
  try {
    if(req.userId) await pool.query('DELETE FROM user_kv_store WHERE user_id=$1 AND key=$2',[req.userId,req.params.key]);
    else await pool.query("DELETE FROM kv_store WHERE key = $1", [req.params.key]);
    res.json({ key: req.params.key, deleted: true });
  } catch (err) {
    console.error('Borrado PostgreSQL:', err.code || 'connection_error');
    res.status(500).json({ error: "Error borrando de la base de datos" });
  }
});

const PORT = process.env.PORT || 3002;
export default app;
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) app.listen(PORT, () => {
  console.log(`API del módulo de entrenamiento corriendo en puerto ${PORT}`);
});
