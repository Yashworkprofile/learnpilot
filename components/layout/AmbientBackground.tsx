// Three blurred gradient orbs that drift slowly behind the glass UI.
// Pure CSS animation (see .orb / .mesh in app/globals.css) — no JS needed,
// and respects prefers-reduced-motion globally.
export function AmbientBackground() {
  return (
    <div className="mesh" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}
