import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { guideReply } from "../src/services/guide.js";
import { defaultProfile } from "../src/services/intelligence.js";
const treks = JSON.parse(
  fs.readFileSync(new URL("../src/data/treks.json", import.meta.url)),
);
test("guide remembers named trail and month across permit and packing followups", () => {
  const first = guideReply(
    treks,
    defaultProfile,
    { trek: null, month: 12 },
    "Tell me about Kudremukh in October",
  );
  assert.equal(first.trek, "kudremukh");
  assert.equal(first.month, 10);
  const next = guideReply(
    treks,
    defaultProfile,
    first,
    "What permits do I need?",
  );
  assert.ok(next.text.includes("Kudremukh") && next.text.includes("permit"));
  const pack = guideReply(treks, defaultProfile, next, "What should I pack?");
  assert.ok(pack.text.includes("Kudremukh") && pack.text.includes("October"));
});
test("guide recommendation establishes a trail context", () => {
  const first = guideReply(
    treks,
    defaultProfile,
    { trek: null, month: 12 },
    "Recommend a beginner trek in December",
  );
  assert.ok(first.trek);
  const next = guideReply(treks, defaultProfile, first, "What about altitude?");
  assert.ok(next.text.includes(treks.find((t) => t.id === first.trek).name));
});
