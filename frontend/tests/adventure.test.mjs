import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  compareSelection,
  parseSearch,
  smartSearch,
  rankTreks,
  monthPacking,
  fitnessPlan,
  planBudget,
} from "../src/services/adventure.js";
import { defaultProfile } from "../src/services/intelligence.js";
const treks = JSON.parse(
  fs.readFileSync(new URL("../src/data/treks.json", import.meta.url)),
);
test("comparison toggles trails and never exceeds three", () => {
  let ids = [];
  for (const id of ["a", "b", "c", "d"]) ids = compareSelection(ids, id);
  assert.deepEqual(ids, ["a", "b", "c"]);
  assert.deepEqual(compareSelection(ids, "b"), ["a", "c"]);
});
test("catalog has 30 unique Indian treks with complete day plans", () => {
  assert.equal(treks.length, 30);
  assert.equal(new Set(treks.map((t) => t.id)).size, 30);
  assert.ok(
    treks.every(
      (t) =>
        t.location !== "Nepal" &&
        t.itinerary.length === t.days &&
        t.months.length,
    ),
  );
  assert.ok(
    treks.every((t) =>
      t.itinerary.every(
        (d) => d.route && d.altitude && d.stay && d.meals && d.risk,
      ),
    ),
  );
});
test("plain words search extracts budget, duration and month", () => {
  const c = parseSearch("easy 3-day trek in December under ₹8000");
  assert.deepEqual(
    [c.difficulty, c.days, c.month, c.budget],
    ["Easy", 3, 12, 8000],
  );
  const results = smartSearch(treks, "easy 3-day trek in December under ₹8000");
  assert.ok(results.length >= 3);
  assert.ok(
    results.every(
      ({ trek: t, reason }) =>
        t.difficulty === "Easy" &&
        t.days <= 3 &&
        t.price <= 8000 &&
        t.months.includes(12) &&
        reason.includes("December"),
    ),
  );
});
test("search supports thousand shorthand and terrain/state constraints", () => {
  assert.equal(parseSearch("under 8k").budget, 8000);
  assert.ok(
    smartSearch(treks, "forest trek in Karnataka").every(
      ({ trek: t }) => t.location === "Karnataka" && t.terrain === "Forest",
    ),
  );
  assert.equal(smartSearch(treks, "easy 1-day trek under ₹1000").length, 0);
});
test("matcher returns 3 ranked matches with watch-outs", () => {
  const results = rankTreks(treks, defaultProfile, 12);
  assert.equal(results.length, 3);
  assert.ok(
    results.every((r) => r.warnings.length && r.score >= 1 && r.score <= 99),
  );
  assert.ok(
    results[0].score >= results[1].score &&
      results[1].score >= results[2].score,
  );
});
test("seasonal gear omits owned items and adapts to rainfall", () => {
  const t = treks.find((t) => t.id === "kedarkantha");
  assert.ok(monthPacking(t, 12).Clothing.includes("Thermal base layers"));
  assert.ok(monthPacking(t, 8).Clothing.includes("Waterproof bag liners"));
  assert.ok(
    !Object.values(monthPacking(t, 12, ["Headlamp", "Trekking shoes"]))
      .flat()
      .includes("Headlamp"),
  );
});
test("fitness plan responds to pace, habits and preparation weeks", () => {
  const low = fitnessPlan({ time: 65, age: 28, exercise: 1, weeks: 2 });
  const high = fitnessPlan({ time: 30, age: 28, exercise: 5, weeks: 8 });
  assert.ok(high.score > low.score);
  assert.equal(high.plan.length, 8);
  assert.ok(low.gaps.some((g) => g.includes("preparation")));
  assert.ok(high.plan[7].long.startsWith("Taper"));
});
test("budget total includes each component and contingency once", () => {
  const b = planBudget(treks[0]);
  assert.equal(
    b.total,
    Object.entries(b)
      .filter(([k]) => k !== "total")
      .reduce((sum, [, v]) => sum + v, 0),
  );
});
