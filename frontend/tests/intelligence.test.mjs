import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultProfile,
  match,
  readiness,
  packing,
  pulse,
  eco,
  explorer,
} from "../src/services/intelligence.js";
const easy = {
  difficulty: "Easy",
  altitude: 1748,
  terrain: "Forest",
  price: 3900,
  days: 2,
  rating: 4.7,
  protected: true,
};
const high = {
  difficulty: "Challenging",
  altitude: 5364,
  terrain: "High altitude",
  price: 85000,
  days: 14,
  rating: 4.9,
  protected: false,
};
test("readiness responds to user preparation and route demands", () => {
  assert.ok(readiness(defaultProfile, easy) > readiness(defaultProfile, high));
  assert.ok(
    readiness(
      { ...defaultProfile, fitness: 100, experience: 100, altitude: 100 },
      high,
    ) > readiness(defaultProfile, high),
  );
});
test("matching rewards affordable short forest trails for default profile", () => {
  assert.ok(match(defaultProfile, easy) > match(defaultProfile, high));
  assert.ok(
    match({ ...defaultProfile, terrain: "Forest" }, easy) >
      match({ ...defaultProfile, terrain: "Snow" }, easy),
  );
});
test("packing and risk respond to conditions", () => {
  assert.ok(packing(high).Clothing.includes("Thermal base layers"));
  assert.ok(!packing(easy).Clothing.includes("Thermal base layers"));
  assert.ok(packing(easy, "Cold").Clothing.includes("Thermal base layers"));
  assert.equal(
    pulse(
      { ...defaultProfile, fitness: 20, experience: 0, altitude: 10 },
      high,
      "Storm",
    ).level,
    "High",
  );
});
test("EcoScore accounts for group and transport distance", () => {
  assert.ok(eco(easy, 2, 50).score > eco(easy, 12, 1500).score);
});
test("explorer identity responds to stated preferences", () => {
  assert.equal(explorer(defaultProfile), "Forest Wanderer");
  assert.equal(explorer({ ...defaultProfile, days: 2 }), "Weekend Adventurer");
});
