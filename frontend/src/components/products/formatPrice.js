// Owner: Member 02
// One place to change the currency (the Figma designs show INR).
const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function formatPrice(value) {
  const n = Number(value);
  return Number.isFinite(n) ? formatter.format(n) : "-";
}
