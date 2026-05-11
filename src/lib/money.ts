// All money values move around as BIGINT paise. UI strings are rupees.

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INR_DEC = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function paiseToRupees(paise: number | bigint | null | undefined): number {
  if (paise == null) return 0;
  return Number(paise) / 100;
}

export function rupeesToPaise(rupees: number | string): number {
  const n = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function formatINR(paise: number | bigint | null | undefined, withDecimals = false): string {
  const r = paiseToRupees(paise);
  return (withDecimals ? INR_DEC : INR).format(r);
}

// Compact form: 1.2L, 45K, 1.3Cr — for dashboard hero numbers.
export function formatINRCompact(paise: number | bigint | null | undefined): string {
  const r = paiseToRupees(paise);
  const abs = Math.abs(r);
  const sign = r < 0 ? "-" : "";
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
}
