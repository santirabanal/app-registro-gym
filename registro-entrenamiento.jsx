import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');";

const LIGHT_THEME = {
  bg: "#F4F3F1",
  ink: "#16161A",
  inkSoft: "#87868C",
  line: "#E4E2DE",
  lineStrong: "#D2CFC9",
  accent: "#DD6B27",
  accentSoft: "#FBE9DC",
  up: "#1E9E4A",
  down: "#D6362B",
  card: "#FFFFFF",
  segment: "#EDEBE7",
};

const DARK_THEME = {
  bg: "#0B0B0D",
  ink: "#F2F2F0",
  inkSoft: "#8E8E93",
  line: "#242427",
  lineStrong: "#38383B",
  accent: "#FF8A4C",
  accentSoft: "#3A2A1E",
  up: "#34C759",
  down: "#FF453A",
  card: "#19191C",
  segment: "#221F1E",
};

const COLORS = { ...LIGHT_THEME };

function applyTheme(isDark) {
  Object.assign(COLORS, isDark ? DARK_THEME : LIGHT_THEME);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getMonday(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function mesAnterior(mesStr, n) {
  const [y, m] = mesStr.split("-").map(Number);
  const d = new Date(y, m - 1 - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nombreMes(mesStr) {
  const [y, m] = mesStr.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function epley(peso, reps) {
  return peso * (1 + reps / 30);
}

const HISTORICO_PESO_HEVY = [
  ["2026-07-01", 73.5], ["2026-07-02", 73.4], ["2026-07-03", 73.4], ["2026-07-04", 73.5],
  ["2026-07-05", 73.9], ["2026-07-06", 74], ["2026-07-07", 74], ["2026-07-09", 74.6],
  ["2026-07-10", 75], ["2026-07-11", 74.2], ["2026-07-12", 74.6], ["2026-07-13", 74.4],
  ["2026-07-15", 74.1], ["2026-07-16", 73.9], ["2026-07-17", 74.9], ["2026-07-21", 75.6],
  ["2026-07-22", 75.1], ["2026-07-24", 75.5], ["2026-07-25", 75.1], ["2026-07-26", 76.1],
  ["2026-07-27", 75.2], ["2026-07-28", 75.3], ["2026-07-29", 75], ["2026-07-30", 75.7],
  ["2026-08-01", 75.4], ["2026-08-02", 75.6], ["2026-08-03", 75.5], ["2026-08-04", 75.8],
  ["2026-08-05", 75.5], ["2026-08-06", 75.1], ["2026-08-07", 75.5], ["2026-08-08", 76.6],
  ["2026-08-09", 75.2], ["2026-08-10", 75.8], ["2026-08-11", 75.5], ["2026-08-12", 75.7],
  ["2026-08-13", 76.2], ["2026-08-14", 76.2], ["2026-08-15", 76.5], ["2026-08-16", 76.2],
  ["2026-08-17", 77], ["2026-08-18", 76.2], ["2026-08-19", 76.7], ["2026-08-20", 76.3],
  ["2026-08-21", 75.7], ["2026-08-22", 75.3], ["2026-08-23", 76.4], ["2026-08-24", 76.7],
  ["2026-08-25", 76.4], ["2026-08-26", 75.7], ["2026-08-27", 76.2], ["2026-08-28", 76.1],
  ["2026-08-29", 75.9], ["2026-08-30", 76.1], ["2026-08-31", 77.1],
].map(([fecha, peso_kg]) => ({ fecha, peso_kg }));

export default function App() {
  const [tab, setTab] = useState("hoy");
  const [loaded, setLoaded] = useState(false);
  const [ejercicios, setEjercicios] = useState([]);
  const [registrosPeso, setRegistrosPeso] = useState([]);
  const [registrosEjercicio, setRegistrosEjercicio] = useState([]);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [e, p, r, importado, temaOscuro] = await Promise.all([
          safeGet("ejercicios"),
          safeGet("registros-peso"),
          safeGet("registros-ejercicio"),
          safeGet("historico-hevy-importado"),
          safeGet("tema-oscuro"),
        ]);
        setEjercicios(e || []);
        setRegistrosEjercicio(r || []);
        applyTheme(!!temaOscuro);
        setDark(!!temaOscuro);

        let pesoFinal = p || [];
        if (!importado) {
          const fechasExistentes = new Set(pesoFinal.map((x) => x.fecha));
          const aAgregar = HISTORICO_PESO_HEVY.filter((x) => !fechasExistentes.has(x.fecha));
          pesoFinal = [...pesoFinal, ...aAgregar].sort((a, b) => a.fecha.localeCompare(b.fecha));
          try {
            await window.storage.set("registros-peso", JSON.stringify(pesoFinal), false);
            await window.storage.set("historico-hevy-importado", JSON.stringify(true), false);
          } catch {
            setError("No se pudo guardar la importación del histórico.");
          }
        }
        setRegistrosPeso(pesoFinal);
      } catch (err) {
        setError("No se pudieron cargar los datos guardados.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function toggleDark() {
    const next = !dark;
    applyTheme(next);
    setDark(next);
    try {
      await window.storage.set("tema-oscuro", JSON.stringify(next), false);
    } catch {
      setError("No se pudo guardar la preferencia de tema.");
    }
  }

  async function safeGet(key) {
    try {
      const res = await window.storage.get(key, false);
      return res ? JSON.parse(res.value) : null;
    } catch {
      return null;
    }
  }

  async function persist(key, value, setter) {
    setter(value);
    try {
      await window.storage.set(key, JSON.stringify(value), false);
    } catch {
      setError("No se pudo guardar el cambio. Probá de nuevo.");
    }
  }

  if (!loaded) {
    return (
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", padding: "3rem 1rem", textAlign: "center", color: COLORS.inkSoft }}>
        <style>{`${FONT_IMPORT}`}</style>
        Cargando registro...
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'Inter', -apple-system, system-ui, sans-serif", color: COLORS.ink }}>
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; font-variant-numeric: tabular-nums; }
        input, select {
          font-family: inherit;
          font-size: 15px;
          font-weight: 500;
          background: ${COLORS.card};
          border: 1px solid ${COLORS.line};
          border-radius: 10px;
          padding: 10px 12px;
          color: ${COLORS.ink};
          outline: none;
          width: 100%;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        input:focus, select:focus {
          border-color: ${COLORS.accent};
          box-shadow: 0 0 0 3px ${COLORS.accentSoft};
        }
        input::placeholder { color: ${COLORS.inkSoft}; }
        button {
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
        }
        .btn-primary {
          background: ${COLORS.accent};
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 10px 20px;
          font-size: 15px;
          font-weight: 600;
        }
        .btn-primary:hover { opacity: 0.85; }
        .btn-primary:active { opacity: 0.7; }
        .btn-ghost {
          background: ${COLORS.card};
          border: 1px solid ${COLORS.line};
          color: ${COLORS.ink};
          border-radius: 12px;
          padding: 9px 18px;
          font-size: 14px;
          font-weight: 500;
        }
        .btn-ghost:hover { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
        .btn-text {
          background: transparent;
          border: none;
          color: ${COLORS.inkSoft};
          font-size: 13px;
          padding: 4px 6px;
          font-weight: 500;
        }
        .btn-text:hover { color: ${COLORS.down}; }
        h1, h2, h3 { font-weight: 700; margin: 0; letter-spacing: -0.02em; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Registro de entrenamiento</h1>
            <p style={{ color: COLORS.inkSoft, fontSize: 14, marginTop: 6, fontWeight: 500 }}>
              Peso corporal y ejercicios clave, día a día.
            </p>
          </div>
          <button
            onClick={toggleDark}
            aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            style={{
              width: 48,
              height: 28,
              borderRadius: 999,
              background: dark ? COLORS.accent : COLORS.lineStrong,
              border: "none",
              position: "relative",
              padding: 0,
              flexShrink: 0,
              marginTop: 4,
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 2,
                left: dark ? 22 : 2,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.15s ease",
              }}
            />
          </button>
        </div>

        <div
          style={{
            display: "inline-flex",
            marginTop: 24,
            background: COLORS.segment,
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}
        >
          {[
            ["hoy", "Hoy"],
            ["progreso", "Progreso"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                background: tab === key ? COLORS.card : "transparent",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                padding: "7px 18px",
                color: tab === key ? COLORS.ink : COLORS.inkSoft,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p style={{ color: COLORS.down, fontSize: 13, marginTop: 16 }}>{error}</p>
        )}

        <div style={{ marginTop: 28 }}>
          {tab === "hoy" ? (
            <HoyTab
              ejercicios={ejercicios}
              setEjercicios={(v) => persist("ejercicios", v, setEjercicios)}
              registrosPeso={registrosPeso}
              setRegistrosPeso={(v) => persist("registros-peso", v, setRegistrosPeso)}
              registrosEjercicio={registrosEjercicio}
              setRegistrosEjercicio={(v) => persist("registros-ejercicio", v, setRegistrosEjercicio)}
            />
          ) : (
            <ProgresoTab
              ejercicios={ejercicios}
              registrosPeso={registrosPeso}
              registrosEjercicio={registrosEjercicio}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.card,
        borderRadius: 20,
        border: `1px solid ${COLORS.line}`,
        padding: "1.5rem",
        marginBottom: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 17, marginBottom: 14, color: COLORS.ink, fontWeight: 700, letterSpacing: "-0.01em" }}>
      {children}
    </h2>
  );
}

function HoyTab({
  ejercicios,
  setEjercicios,
  registrosPeso,
  setRegistrosPeso,
  registrosEjercicio,
  setRegistrosEjercicio,
}) {
  const [fecha, setFecha] = useState(todayISO());

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
          Fecha
        </label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ maxWidth: 200 }} />
      </div>

      <PesoCard fecha={fecha} registrosPeso={registrosPeso} setRegistrosPeso={setRegistrosPeso} />

      <EjerciciosCard
        fecha={fecha}
        ejercicios={ejercicios}
        setEjercicios={setEjercicios}
        registrosEjercicio={registrosEjercicio}
        setRegistrosEjercicio={setRegistrosEjercicio}
      />
    </div>
  );
}

function PesoCard({ fecha, registrosPeso, setRegistrosPeso }) {
  const existente = registrosPeso.find((r) => r.fecha === fecha);
  const [peso, setPeso] = useState(existente ? String(existente.peso_kg) : "");
  const [err, setErr] = useState("");

  useEffect(() => {
    const r = registrosPeso.find((x) => x.fecha === fecha);
    setPeso(r ? String(r.peso_kg) : "");
    setErr("");
  }, [fecha]);

  function guardar() {
    const val = parseFloat(peso.replace(",", "."));
    if (!peso || isNaN(val) || val <= 0) {
      setErr("Ingresá un peso válido.");
      return;
    }
    setErr("");
    const otros = registrosPeso.filter((r) => r.fecha !== fecha);
    setRegistrosPeso([...otros, { fecha, peso_kg: val }].sort((a, b) => a.fecha.localeCompare(b.fecha)));
  }

  return (
    <Card>
      <SectionTitle>Peso corporal</SectionTitle>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
            Peso (kg)
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="76.2"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={guardar}>
          {existente ? "Actualizar" : "Guardar"}
        </button>
      </div>
      {err && <p style={{ color: COLORS.down, fontSize: 13, marginTop: 8 }}>{err}</p>}
      {existente && !err && (
        <p style={{ color: COLORS.inkSoft, fontSize: 13, marginTop: 8 }}>
          Registrado para el {fmtDate(fecha)}.
        </p>
      )}
    </Card>
  );
}

function EjerciciosCard({ fecha, ejercicios, setEjercicios, registrosEjercicio, setRegistrosEjercicio }) {
  const activos = ejercicios.filter((e) => e.activo);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [ejercicioId, setEjercicioId] = useState(activos[0]?.id || "");
  const [sets, setSets] = useState([{ peso_kg: "", reps: "", rir: "" }]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!ejercicioId && activos[0]) setEjercicioId(activos[0].id);
  }, [activos.length]);

  const delDia = registrosEjercicio.filter((r) => r.fecha === fecha);

  function crearEjercicio() {
    const nombre = nombreNuevo.trim();
    if (!nombre) {
      setErr("Ingresá un nombre para el ejercicio.");
      return;
    }
    const nuevo = { id: uid(), nombre, grupo_muscular: "", activo: true };
    setEjercicios([...ejercicios, nuevo]);
    setEjercicioId(nuevo.id);
    setNombreNuevo("");
    setMostrarNuevo(false);
    setErr("");
  }

  function desactivar(id) {
    setEjercicios(ejercicios.map((e) => (e.id === id ? { ...e, activo: false } : e)));
    if (ejercicioId === id) setEjercicioId("");
  }

  function agregarSet() {
    setSets([...sets, { peso_kg: "", reps: "", rir: "" }]);
  }

  function quitarSet(i) {
    setSets(sets.filter((_, idx) => idx !== i));
  }

  function actualizarSet(i, campo, valor) {
    setSets(sets.map((s, idx) => (idx === i ? { ...s, [campo]: valor } : s)));
  }

  function guardarRegistro() {
    if (!ejercicioId) {
      setErr("Elegí o creá un ejercicio.");
      return;
    }
    const setsLimpios = sets
      .filter((s) => s.peso_kg !== "" && s.reps !== "")
      .map((s) => ({
        peso_kg: parseFloat(String(s.peso_kg).replace(",", ".")),
        reps: parseInt(s.reps, 10),
        rir: s.rir === "" ? null : parseFloat(String(s.rir).replace(",", ".")),
      }));
    if (setsLimpios.length === 0) {
      setErr("Cargá al menos una serie con peso y repeticiones.");
      return;
    }
    if (setsLimpios.some((s) => isNaN(s.peso_kg) || isNaN(s.reps) || s.peso_kg <= 0 || s.reps <= 0)) {
      setErr("Revisá los valores de las series: peso y reps deben ser números válidos.");
      return;
    }
    setErr("");
    const otros = registrosEjercicio.filter((r) => !(r.fecha === fecha && r.ejercicio_id === ejercicioId));
    setRegistrosEjercicio([
      ...otros,
      { id: uid(), ejercicio_id: ejercicioId, fecha, sets: setsLimpios },
    ]);
    setSets([{ peso_kg: "", reps: "", rir: "" }]);
  }

  function borrarRegistro(id) {
    setRegistrosEjercicio(registrosEjercicio.filter((r) => r.id !== id));
  }

  return (
    <Card>
      <SectionTitle>Ejercicios clave</SectionTitle>

      <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
            Ejercicio
          </label>
          {activos.length > 0 ? (
            <select value={ejercicioId} onChange={(e) => setEjercicioId(e.target.value)}>
              {activos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          ) : (
            <p style={{ fontSize: 13, color: COLORS.inkSoft, margin: "6px 0" }}>Todavía no cargaste ejercicios.</p>
          )}
        </div>
        <button className="btn-ghost" onClick={() => setMostrarNuevo(!mostrarNuevo)}>
          {mostrarNuevo ? "Cancelar" : "+ Nuevo"}
        </button>
      </div>

      {mostrarNuevo && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Nombre del ejercicio"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
          />
          <button className="btn-ghost" onClick={crearEjercicio}>
            Crear
          </button>
        </div>
      )}

      {activos.length > 0 && (
        <details style={{ marginBottom: 16 }}>
          <summary style={{ fontSize: 13, color: COLORS.inkSoft, cursor: "pointer" }}>
            Administrar ejercicios ({activos.length})
          </summary>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {activos.map((e) => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                <span>{e.nombre}</span>
                <button className="btn-text" onClick={() => desactivar(e.id)}>
                  Desactivar
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {activos.length > 0 && (
        <>
          <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 14 }}>
            <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>Series de hoy</p>
            {sets.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: COLORS.inkSoft, width: 16 }}>{i + 1}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="Peso kg"
                  value={s.peso_kg}
                  onChange={(e) => actualizarSet(i, "peso_kg", e.target.value)}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Reps"
                  value={s.reps}
                  onChange={(e) => actualizarSet(i, "reps", e.target.value)}
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="RIR"
                  value={s.rir}
                  onChange={(e) => actualizarSet(i, "rir", e.target.value)}
                />
                {sets.length > 1 && (
                  <button className="btn-text" onClick={() => quitarSet(i)} aria-label="Quitar serie">
                    ×
                  </button>
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button className="btn-ghost" onClick={agregarSet}>
                + Serie
              </button>
              <button className="btn-primary" onClick={guardarRegistro}>
                Guardar registro
              </button>
            </div>
            {err && <p style={{ color: COLORS.down, fontSize: 13, marginTop: 8 }}>{err}</p>}
          </div>
        </>
      )}

      {delDia.length > 0 && (
        <div style={{ marginTop: 20, borderTop: `1px solid ${COLORS.line}`, paddingTop: 14 }}>
          <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>Ya cargado hoy</p>
          {delDia.map((r) => {
            const ej = ejercicios.find((e) => e.id === r.ejercicio_id);
            return (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", fontSize: 14 }}>
                <span>
                  {ej?.nombre || "Ejercicio eliminado"} — {r.sets.map((s) => `${s.peso_kg}x${s.reps}`).join(", ")}
                </span>
                <button className="btn-text" onClick={() => borrarRegistro(r.id)}>
                  Borrar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function ProgresoTab({ ejercicios, registrosPeso, registrosEjercicio }) {
  const [mes, setMes] = useState(todayISO().slice(0, 7));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
          Mes
        </label>
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={{ maxWidth: 200 }} />
      </div>

      <PesoChart registrosPeso={registrosPeso} mes={mes} />
      <EjercicioChart ejercicios={ejercicios} registrosEjercicio={registrosEjercicio} mes={mes} />
    </div>
  );
}

function PesoChart({ registrosPeso, mes }) {
  const [rango, setRango] = useState("1");

  const ordenados = useMemo(
    () => [...registrosPeso].sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [registrosPeso]
  );

  const mesDesde = rango === "3" ? mesAnterior(mes, 2) : mes;
  const desdeStr = `${mesDesde}-01`;
  const hastaStr = addDays(mesAnterior(mes, -1) + "-01", -1);

  const delRango = ordenados.filter((r) => r.fecha >= desdeStr && r.fecha <= hastaStr);

  const dataChart = useMemo(() => {
    return delRango.map((r) => {
      const desde = addDays(r.fecha, -27);
      const ventana = ordenados.filter((x) => x.fecha >= desde && x.fecha <= r.fecha);
      const prom = ventana.reduce((s, x) => s + x.peso_kg, 0) / ventana.length;
      return { fecha: fmtDate(r.fecha), peso: round1(r.peso_kg), promedio: round1(prom) };
    });
  }, [delRango, ordenados]);

  const tendencia = useMemo(() => {
    if (ordenados.length < 2) return null;
    const semanas = {};
    ordenados.forEach((r) => {
      const lunes = getMonday(r.fecha);
      if (!semanas[lunes]) semanas[lunes] = [];
      semanas[lunes].push(r.peso_kg);
    });
    const claves = Object.keys(semanas).sort();
    if (claves.length < 2) return null;
    const promSemana = claves.map((k) => semanas[k].reduce((s, v) => s + v, 0) / semanas[k].length);
    const ultimas = promSemana.slice(-4);
    const previas = promSemana.slice(-8, -4);
    if (previas.length === 0) return null;
    const avgUlt = ultimas.reduce((s, v) => s + v, 0) / ultimas.length;
    const avgPrev = previas.reduce((s, v) => s + v, 0) / previas.length;
    return { delta: round1(avgUlt - avgPrev), semanas: ultimas.length };
  }, [ordenados]);

  const variacionMensual = useMemo(() => {
    const porMes = {};
    ordenados.forEach((r) => {
      const m = r.fecha.slice(0, 7);
      if (!porMes[m] || r.fecha > porMes[m].fecha) porMes[m] = r;
    });
    const mesesOrdenados = Object.keys(porMes).sort();
    const mesesRango = rango === "3" ? [mesAnterior(mes, 2), mesAnterior(mes, 1), mes] : [mes];
    return mesesRango
      .filter((m) => porMes[m])
      .map((m) => {
        const idx = mesesOrdenados.indexOf(m);
        const anterior = idx > 0 ? porMes[mesesOrdenados[idx - 1]] : null;
        const delta = anterior ? round1(porMes[m].peso_kg - anterior.peso_kg) : null;
        return { mes: m, peso: round1(porMes[m].peso_kg), delta };
      });
  }, [ordenados, mes, rango]);

  const tickInterval = Math.max(0, Math.ceil(dataChart.length / 8) - 1);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <SectionTitle>Peso corporal</SectionTitle>
        <div style={{ display: "inline-flex", background: COLORS.segment, borderRadius: 8, padding: 2, gap: 2 }}>
          {[
            ["1", "1 mes"],
            ["3", "3 meses"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRango(key)}
              style={{
                background: rango === key ? COLORS.card : "transparent",
                color: rango === key ? COLORS.ink : COLORS.inkSoft,
                border: "none",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tendencia && (
        <p style={{ fontSize: 14, marginBottom: 14, color: tendencia.delta > 0 ? COLORS.up : tendencia.delta < 0 ? COLORS.down : COLORS.inkSoft }}>
          {tendencia.delta > 0 ? "+" : ""}
          {tendencia.delta}kg de {tendencia.delta >= 0 ? "ganancia" : "pérdida"} promedio en las últimas {tendencia.semanas} semanas
        </p>
      )}

      {dataChart.length === 0 ? (
        <p style={{ fontSize: 14, color: COLORS.inkSoft }}>No hay registros de peso en este período.</p>
      ) : (
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataChart} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.line} vertical={false} />
              <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: COLORS.inkSoft, fontFamily: 'inherit' }} interval={tickInterval} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.inkSoft, fontFamily: 'inherit' }} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip contentStyle={{ fontSize: 12, fontFamily: "inherit", background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 10, color: COLORS.ink }} labelStyle={{ color: COLORS.ink }} itemStyle={{ color: COLORS.ink }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="peso" name="Peso" stroke={COLORS.accent} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="promedio" name="Promedio 4 sem." stroke={COLORS.lineStrong} strokeWidth={2} strokeDasharray="4 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {variacionMensual.length > 0 && (
        <div style={{ marginTop: 18, borderTop: `1px solid ${COLORS.line}`, paddingTop: 14 }}>
          <p style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>Variación por mes (último registro de cada mes)</p>
          {variacionMensual.map((v) => (
            <div key={v.mes} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}>
              <span style={{ textTransform: "capitalize" }}>{nombreMes(v.mes)}</span>
              <span>
                {v.peso}kg
                {v.delta !== null && (
                  <span style={{ color: v.delta > 0 ? COLORS.up : v.delta < 0 ? COLORS.down : COLORS.inkSoft, marginLeft: 8 }}>
                    ({v.delta > 0 ? "+" : ""}
                    {v.delta})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function EjercicioChart({ ejercicios, registrosEjercicio, mes }) {
  const activos = ejercicios.filter((e) => e.activo);
  const [ejercicioId, setEjercicioId] = useState(activos[0]?.id || "");
  const [metrica, setMetrica] = useState("topset");

  useEffect(() => {
    if (!ejercicioId && activos[0]) setEjercicioId(activos[0].id);
  }, [activos.length]);

  const registros = registrosEjercicio
    .filter((r) => r.ejercicio_id === ejercicioId && r.fecha.startsWith(mes))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const dataChart = registros.map((r) => {
    const topSet = r.sets.reduce((best, s) => (s.peso_kg > (best?.peso_kg ?? -1) || (s.peso_kg === best?.peso_kg && s.reps > best.reps) ? s : best), null);
    const volumen = r.sets.reduce((sum, s) => sum + s.peso_kg * s.reps, 0);
    const oneRM = topSet ? epley(topSet.peso_kg, topSet.reps) : 0;
    return {
      fecha: fmtDate(r.fecha),
      topset: topSet ? round1(topSet.peso_kg) : 0,
      volumen: round1(volumen),
      rm1: round1(oneRM),
    };
  });

  const metricaLabel = { topset: "Top set (kg)", volumen: "Volumen total (kg)", rm1: "1RM estimado (kg)" };

  return (
    <Card>
      <SectionTitle>Ejercicios clave — {mes}</SectionTitle>
      {activos.length === 0 ? (
        <p style={{ fontSize: 14, color: COLORS.inkSoft }}>Todavía no cargaste ejercicios.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
                Ejercicio
              </label>
              <select value={ejercicioId} onChange={(e) => setEjercicioId(e.target.value)}>
                {activos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
                Métrica
              </label>
              <select value={metrica} onChange={(e) => setMetrica(e.target.value)}>
                <option value="topset">Top set</option>
                <option value="volumen">Volumen total</option>
                <option value="rm1">1RM estimado</option>
              </select>
            </div>
          </div>

          {dataChart.length === 0 ? (
            <p style={{ fontSize: 14, color: COLORS.inkSoft }}>No hay registros de este ejercicio en el mes elegido.</p>
          ) : (
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataChart} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke={COLORS.line} vertical={false} />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: COLORS.inkSoft, fontFamily: 'inherit' }} />
                  <YAxis tick={{ fontSize: 11, fill: COLORS.inkSoft, fontFamily: 'inherit' }} domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip contentStyle={{ fontSize: 12, fontFamily: "inherit", background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 10, color: COLORS.ink }} labelStyle={{ color: COLORS.ink }} itemStyle={{ color: COLORS.ink }} />
                  <Line type="monotone" dataKey={metrica} name={metricaLabel[metrica]} stroke={COLORS.accent} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
