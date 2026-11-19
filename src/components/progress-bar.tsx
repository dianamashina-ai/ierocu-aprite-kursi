export function ProgressBar({ percent, label, tone = "accent" }: { percent: number; label: string; tone?: "accent" | "ok" }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={p}
      className="h-2.5 overflow-hidden rounded-full bg-accent-soft"
    >
      <div className={`h-full ${tone === "ok" ? "bg-ok" : "bg-accent"}`} style={{ width: `${p}%` }} />
    </div>
  );
}
