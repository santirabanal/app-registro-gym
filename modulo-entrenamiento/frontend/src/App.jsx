import { useState } from "react";
import { COLORS, FONT_IMPORT } from "./theme.js";
import { useEntrenamientoData } from "./hooks/useEntrenamientoData.js";
import { GlobalStyles } from "./components/GlobalStyles.jsx";
import { ThemeToggle } from "./components/ThemeToggle.jsx";
import { HoyTab } from "./components/HoyTab.jsx";
import { ProgresoTab } from "./components/ProgresoTab.jsx";

export default function App() {
  const [tab, setTab] = useState("hoy");
  const {
    loaded,
    error,
    dark,
    toggleDark,
    ejercicios,
    setEjercicios,
    registrosPeso,
    setRegistrosPeso,
    registrosEjercicio,
    setRegistrosEjercicio,
  } = useEntrenamientoData();

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
      <GlobalStyles />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Registro de entrenamiento</h1>
            <p style={{ color: COLORS.inkSoft, fontSize: 14, marginTop: 6, fontWeight: 500 }}>
              Peso corporal y ejercicios clave, día a día.
            </p>
          </div>
          <ThemeToggle dark={dark} onToggle={toggleDark} />
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
              setEjercicios={setEjercicios}
              registrosPeso={registrosPeso}
              setRegistrosPeso={setRegistrosPeso}
              registrosEjercicio={registrosEjercicio}
              setRegistrosEjercicio={setRegistrosEjercicio}
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
