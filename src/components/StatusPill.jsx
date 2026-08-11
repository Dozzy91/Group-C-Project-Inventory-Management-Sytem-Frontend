const LOW_THRESHOLD = 10;

export function stockStatus(quantity) {
  if (quantity <= 0) return "out";
  if (quantity < LOW_THRESHOLD) return "low";
  return "ok";
}

const LABELS = {
  ok: "In stock",
  low: "Low stock",
  out: "Out of stock",
};

export default function StatusPill({ quantity }) {
  const status = stockStatus(quantity);
  return <span className={`status-pill status-${status}`}>{LABELS[status]}</span>;
}
