export const defaultProfile = {
  fitness: 75,
  experience: 35,
  age: 1,
  adventure: 70,
  altitude: 60,
  terrain: "Forest",
  budget: 15000,
  days: 6,
  group: "Friends",
  risk: 50,
};
export function readiness(p, t) {
  return Math.round(
    Math.max(
      8,
      Math.min(
        98,
        p.fitness * 0.46 +
          p.experience * 0.22 +
          p.altitude * 0.22 +
          25 -
          (t.difficulty === "Challenging"
            ? 20
            : t.difficulty === "Moderate"
              ? 8
              : 0) -
          Math.max(0, t.altitude - 3000) / 250 -
          Math.max(0, t.days - 3) * 0.65 -
          (t.weather_risk || 0) * 8 -
          (t.elevation_gain || 0) / 700,
      ),
    ),
  );
}
export function match(p, t) {
  return Math.round(
    Math.max(
      5,
      Math.min(
        99,
        readiness(p, t) * 0.7 +
          (t.terrain === p.terrain ? 18 : 8) +
          (t.price <= p.budget ? 9 : 0) +
          (t.days <= p.days ? 8 : 0),
      ),
    ),
  );
}
export function dna(p) {
  return [
    { metric: "Endurance", value: p.fitness },
    { metric: "Adventure", value: p.adventure },
    { metric: "Altitude", value: p.altitude },
    { metric: "Nature", value: p.terrain === "Forest" ? 94 : 80 },
    { metric: "Risk", value: p.risk },
  ];
}
export function explorer(p) {
  return p.altitude > 80 && p.experience > 65
    ? "High Altitude Challenger"
    : p.adventure > 85
      ? "Summit Seeker"
      : p.days <= 3
        ? "Weekend Adventurer"
        : p.terrain === "Forest"
          ? "Forest Wanderer"
          : p.terrain === "Valley"
            ? "Nature Nomad"
            : "Alpine Explorer";
}
export function pulse(p, t, weather = "Normal") {
  const score =
    100 -
    readiness(p, t) +
    (weather === "Storm" ? 30 : weather === "Cold" ? 12 : 0);
  return {
    level: score > 65 ? "High" : score > 35 ? "Moderate" : "Low",
    tips: [
      t.altitude > 3000
        ? "Plan gradual acclimatization and watch for altitude symptoms."
        : "Pace yourself and take regular water breaks.",
      weather === "Storm"
        ? "Delay departure until a qualified local guide confirms safe conditions."
        : "Recheck the local forecast before departure.",
      p.experience < 40
        ? "Travel with an experienced guide."
        : "Review the route and evacuation options with your group.",
    ],
  };
}
export function packing(t, weather = "Normal") {
  return {
    Clothing: [
      "Layered base clothing",
      "Rain shell",
      "Spare socks",
      ...(t.altitude > 3000 || weather === "Cold"
        ? ["Insulated jacket", "Thermal base layers", "Warm gloves"]
        : []),
      ...(t.days > 5 ? ["Extra base layer"] : []),
    ],
    Equipment: [
      "Trekking shoes",
      "Backpack",
      "Headlamp",
      "Trekking poles",
      ...(t.days > 3 ? ["Sleeping bag (confirm operator provision)"] : []),
    ],
    Food: [
      "Reusable water bottles",
      "Trail snacks",
      ...(t.days > 5 ? ["Extra high-energy snacks"] : []),
    ],
    Safety: ["Offline map", "Whistle", "Emergency blanket"],
    Medical: ["Personal medications", "First aid kit", "Blister care"],
    Electronics: ["Power bank", "Charging cable"],
    Documents: ["Photo ID", "Permits", "Emergency contacts"],
  };
}
export function eco(t, group = 2, transport = 200) {
  let score = Math.max(
    12,
    Math.round(
      95 -
        group * 2 -
        transport / 40 -
        (t.protected ? 12 : 0) -
        (t.rating > 4.8 ? 5 : 0),
    ),
  );
  return {
    score,
    label:
      score > 75
        ? "Eco Friendly"
        : score > 50
          ? "Moderate Impact"
          : "High Impact",
  };
}
