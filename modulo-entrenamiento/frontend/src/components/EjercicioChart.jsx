import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS } from "../theme.js";
import { fmtDate } from "../utils/dates.js";
import { epley, round1 } from "../utils/numbers.js";
import { Card, SectionTitle } from "./Card.jsx";

export function EjercicioChart({ ejercicios, registrosEjercicio, mes }) {
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
