import { COLORS } from "../theme.js";

export function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      onClick={onToggle}
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
  );
}
