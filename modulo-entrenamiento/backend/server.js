import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});

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

app.get("/kv/:key", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM kv_store WHERE key = $1", [req.params.key]);
    if (rows.length === 0) return res.status(404).json({ error: "not_found" });
    res.json({ key: req.params.key, value: rows[0].value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error leyendo la base de datos" });
  }
});

app.put("/kv/:key", async (req, res) => {
  const { value } = req.body;
  if (typeof value !== "string") {
    return res.status(400).json({ error: "'value' debe ser un string (ya serializado con JSON.stringify)" });
  }
  try {
    await pool.query(
      `INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
      [req.params.key, value]
    );
    res.json({ key: req.params.key, value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error guardando en la base de datos" });
  }
});

app.delete("/kv/:key", async (req, res) => {
  try {
    await pool.query("DELETE FROM kv_store WHERE key = $1", [req.params.key]);
    res.json({ key: req.params.key, deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error borrando de la base de datos" });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`API del módulo de entrenamiento corriendo en puerto ${PORT}`);
});
