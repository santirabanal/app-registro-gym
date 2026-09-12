import { useEffect, useState } from "react";
import { COLORS } from "../theme.js";
import { uid } from "../utils/numbers.js";
import { Card, SectionTitle } from "./Card.jsx";

export function EjerciciosCard({ fecha, ejercicios, setEjercicios, registrosEjercicio, setRegistrosEjercicio }) {
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
