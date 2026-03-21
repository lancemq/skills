import dailyHandler from "./daily-skill-health.js";

// Legacy endpoint kept for backward compatibility.
// It now runs the daily health logic.
export default async function handler(req, res) {
  return dailyHandler(req, res);
}
