import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { COLORS } from "../theme.js";
import { addDays, fmtDate, getMonday, mesAnterior, nombreMes } from "../utils/dates.js";
import { round1 } from "../utils/numbers.js";
import { Card, SectionTitle } from "./Card.jsx";

export function PesoChart({ registrosPeso, mes }) {
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
