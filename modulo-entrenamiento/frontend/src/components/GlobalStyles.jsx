import { COLORS, FONT_IMPORT } from "../theme.js";

export function GlobalStyles() {
  return (
    <style>{`
      ${FONT_IMPORT}
      * { box-sizing: border-box; font-variant-numeric: tabular-nums; }
      input, select {
        font-family: inherit;
        font-size: 15px;
        font-weight: 500;
        background: ${COLORS.card};
        border: 1px solid ${COLORS.line};
        border-radius: 10px;
        padding: 10px 12px;
        color: ${COLORS.ink};
        outline: none;
        width: 100%;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      input:focus, select:focus {
        border-color: ${COLORS.accent};
        box-shadow: 0 0 0 3px ${COLORS.accentSoft};
      }
      input::placeholder { color: ${COLORS.inkSoft}; }
      button {
        font-family: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      }
      .btn-primary {
        background: ${COLORS.accent};
        color: #fff;
        border: none;
        border-radius: 12px;
        padding: 10px 20px;
        font-size: 15px;
        font-weight: 600;
      }
      .btn-primary:hover { opacity: 0.85; }
      .btn-primary:active { opacity: 0.7; }
      .btn-ghost {
        background: ${COLORS.card};
        border: 1px solid ${COLORS.line};
        color: ${COLORS.ink};
        border-radius: 12px;
        padding: 9px 18px;
        font-size: 14px;
        font-weight: 500;
      }
      .btn-ghost:hover { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
      .btn-text {
        background: transparent;
        border: none;
        color: ${COLORS.inkSoft};
        font-size: 13px;
        padding: 4px 6px;
        font-weight: 500;
      }
      .btn-text:hover { color: ${COLORS.down}; }
      h1, h2, h3 { font-weight: 700; margin: 0; letter-spacing: -0.02em; }
    `}</style>
  );
}
