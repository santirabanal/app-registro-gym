import { COLORS } from "../theme.js";

export function Card({ children, style }) {
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

export function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: 17, marginBottom: 14, color: COLORS.ink, fontWeight: 700, letterSpacing: "-0.01em" }}>
      {children}
    </h2>
  );
}
