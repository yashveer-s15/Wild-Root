import { match, readiness, packing, pulse } from "./intelligence.js";
export function compareSelection(ids, id) {
  if (ids.includes(id)) return ids.filter((x) => x !== id);
  return ids.length < 3 ? [...ids, id] : ids;
}
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export function inSeason(t, month) {
  return !month || !t.months || t.months.includes(Number(month));
}
export function parseSearch(query) {
  const q = query.toLowerCase().replace(/,/g, "");
  const duration = q.match(/(\d+)\s*[- ]?days?/);
  const budget = q.match(
    /(?:under|below|less than|budget(?: of)?)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)(k)?/,
  );
  const month = MONTHS.findIndex(
    (m) =>
      q.includes(m.toLowerCase()) ||
      new RegExp(`\\b${m.slice(0, 3).toLowerCase()}\\b`).test(q),
  );
  return {
    difficulty: /easy|beginner|gentle/.test(q)
      ? "Easy"
      : /challenging|difficult|hard/.test(q)
        ? "Challenging"
        : /moderate/.test(q)
          ? "Moderate"
          : null,
    days: duration ? +duration[1] : null,
    budget: budget ? +budget[1] * (budget[2] ? 1000 : 1) : null,
    month: month < 0 ? null : month + 1,
    terrain: /forest|wood/.test(q)
      ? "Forest"
      : /snow|winter/.test(q)
        ? "Snow"
        : /valley|flowers/.test(q)
          ? "Valley"
          : null,
    location: [
      "Uttarakhand",
      "Karnataka",
      "Himachal Pradesh",
      "West Bengal",
    ].find((l) => q.includes(l.toLowerCase())),
  };
}
export function smartSearch(treks, query) {
  const c = parseSearch(query);
  const recognized = Object.values(c).some(Boolean);
  return treks
    .filter(
      (t) =>
        (!c.difficulty || t.difficulty === c.difficulty) &&
        (!c.days || t.days <= c.days) &&
        (!c.budget || t.price <= c.budget) &&
        inSeason(t, c.month) &&
        (!c.terrain || t.terrain === c.terrain) &&
        (!c.location || t.location === c.location) &&
        (recognized ||
          !query.trim() ||
          `${t.name} ${t.location} ${t.terrain}`
            .toLowerCase()
            .includes(query.toLowerCase())),
    )
    .map((t) => ({
      trek: t,
      reason: [
        `${t.difficulty} route`,
        `${t.days} days`,
        `₹${t.price.toLocaleString("en-IN")}`,
        c.month ? `recommended in ${MONTHS[c.month - 1]}` : t.season,
      ].join(" · "),
    }));
}
export function rankTreks(treks, p, month) {
  return treks
    .map((t) => {
      const score = Math.max(
        1,
        Math.min(99, match(p, t) + (inSeason(t, month) ? 3 : -15)),
      );
      const warnings = [
        ...(t.days > p.days
          ? [`Needs ${t.days} days; you selected ${p.days}.`]
          : []),
        ...(t.price > p.budget
          ? [
              `₹${(t.price - p.budget).toLocaleString("en-IN")} above your budget.`,
            ]
          : []),
        ...(!inSeason(t, month) ? ["Outside the usual trekking season."] : []),
        ...(t.altitude > 3000 ? ["Plan for altitude acclimatization."] : []),
        ...(readiness(p, t) < 60
          ? ["Build endurance and experience before departure."]
          : []),
      ];
      return {
        trek: t,
        score,
        warnings: warnings.length
          ? warnings
          : ["Confirm permits and weather before departure."],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
export function trekBrief(t, p, month) {
  return {
    suits:
      t.difficulty === "Easy"
        ? "First-time trekkers with a regular walking habit."
        : t.difficulty === "Moderate"
          ? "Active walkers ready for consecutive trail days."
          : "Experienced trekkers with strong endurance and altitude preparation.",
    best: t.season,
    things: [
      `${t.days} days over approximately ${t.distance} km.`,
      `Maximum altitude ${t.altitude.toLocaleString()} m.`,
      t.permit || "Confirm current local entry rules.",
    ],
    safety: pulse(p, t).tips[0],
    season: inSeason(t, month),
  };
}
export function monthPacking(t, month, owned = []) {
  const cold = [11, 12, 1, 2, 3].includes(+month) && t.altitude > 2500;
  const wet = [6, 7, 8, 9].includes(+month);
  const groups = packing(t, cold ? "Cold" : "Normal");
  groups.Clothing = [
    ...new Set([
      ...groups.Clothing,
      "Sun hat",
      ...(wet ? ["Waterproof bag liners"] : []),
    ]),
  ];
  groups.Safety = [...groups.Safety, "Water treatment supplies", "Sunscreen"];
  return Object.fromEntries(
    Object.entries(groups).map(([key, items]) => [
      key,
      items.filter((item) => !owned.includes(item)),
    ]),
  );
}
export function fitnessPlan({ time, age, exercise, weeks }) {
  const score = Math.round(
    Math.max(
      10,
      Math.min(
        96,
        65 +
          (40 - time) * 1.15 +
          exercise * 4 +
          Math.min(weeks, 12) * 1.4 -
          (age > 55 ? 5 : age < 18 ? 3 : 0),
      ),
    ),
  );
  const gaps = [
    ...(time > 40 ? ["Build your comfortable 5 km walking pace."] : []),
    ...(exercise < 3
      ? ["Establish at least three active days each week."]
      : []),
    ...(weeks < 4
      ? ["Allow more preparation time before a demanding trek."]
      : []),
    "Practice with your daypack and include gradual uphill walking.",
  ];
  return {
    score,
    gaps,
    plan: Array.from({ length: Math.min(16, weeks) }, (_, i) => ({
      week: i + 1,
      walk: `${Math.min(60, 20 + i * 5)}–${Math.min(90, 35 + i * 5)} minute comfortable walks, 3 days`,
      strength:
        "Two light strength sessions: step-ups, calf raises and balance practice",
      long:
        i === weeks - 1
          ? "Taper: short easy walks, rest, gear check and sleep"
          : `One ${Math.min(150, 45 + i * 10)} minute easy walk; add gentle hills only if comfortable`,
      recovery:
        "At least one full rest day; reduce activity if pain or unusual symptoms appear.",
    })),
  };
}
export function planBudget(t, days = t.days) {
  const meals = days * 500,
    stay = Math.max(0, days - 1) * 800,
    guide = days * 600,
    permits = t.protected ? 600 : 300,
    transport = 1800,
    equipment = 1200;
  const subtotal = meals + stay + guide + permits + transport + equipment;
  return {
    Meals: meals,
    "Stay / camps": stay,
    "Guide support": guide,
    "Permits estimate": permits,
    "Local transfers": transport,
    "Gear rental": equipment,
    Contingency: Math.round(subtotal * 0.1),
    total: Math.round(subtotal * 1.1),
  };
}
