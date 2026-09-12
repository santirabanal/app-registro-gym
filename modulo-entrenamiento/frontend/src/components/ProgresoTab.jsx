import { useState } from "react";
import { COLORS } from "../theme.js";
import { todayISO } from "../utils/dates.js";
import { PesoChart } from "./PesoChart.jsx";
import { EjercicioChart } from "./EjercicioChart.jsx";

export function ProgresoTab({ ejercicios, registrosPeso, registrosEjercicio }) {
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
