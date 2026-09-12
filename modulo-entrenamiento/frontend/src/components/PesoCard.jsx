import { useEffect, useState } from "react";
import { COLORS } from "../theme.js";
import { fmtDate } from "../utils/dates.js";
import { Card, SectionTitle } from "./Card.jsx";

export function PesoCard({ fecha, registrosPeso, setRegistrosPeso }) {
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
