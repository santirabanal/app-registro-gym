import { useState } from "react";
import { COLORS } from "../theme.js";
import { todayISO } from "../utils/dates.js";
import { PesoCard } from "./PesoCard.jsx";
import { EjerciciosCard } from "./EjerciciosCard.jsx";

export function HoyTab({
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
