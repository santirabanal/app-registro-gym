import { useEffect, useState } from "react";
import { storage } from "../storageApi.js";
import { applyTheme } from "../theme.js";
import { HISTORICO_PESO_HEVY } from "../data/historicoPesoHevy.js";

async function safeGet(key) {
  try {
    const res = await storage.get(key);
    return res ? JSON.parse(res.value) : null;
  } catch {
    return null;
  }
}

export function useEntrenamientoData() {
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
            await storage.set("registros-peso", JSON.stringify(pesoFinal));
            await storage.set("historico-hevy-importado", JSON.stringify(true));
          } catch {
            setError("No se pudo guardar la importación del histórico.");
          }
        }
        setRegistrosPeso(pesoFinal);
      } catch {
        setError("No se pudieron cargar los datos guardados.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function persist(key, value, setter) {
    setter(value);
    try {
      await storage.set(key, JSON.stringify(value));
    } catch {
      setError("No se pudo guardar el cambio. Probá de nuevo.");
    }
  }

  async function toggleDark() {
    const next = !dark;
    applyTheme(next);
    setDark(next);
    try {
      await storage.set("tema-oscuro", JSON.stringify(next));
    } catch {
      setError("No se pudo guardar la preferencia de tema.");
    }
  }

  return {
    loaded,
    error,
    dark,
    toggleDark,
    ejercicios,
    setEjercicios: (v) => persist("ejercicios", v, setEjercicios),
    registrosPeso,
    setRegistrosPeso: (v) => persist("registros-peso", v, setRegistrosPeso),
    registrosEjercicio,
    setRegistrosEjercicio: (v) => persist("registros-ejercicio", v, setRegistrosEjercicio),
  };
}
