import { monthPacking, MONTHS, rankTreks } from "./adventure.js";
import { readiness } from "./intelligence.js";
export function guideReply(treks, profile, memory, q) {
  const lower = q.toLowerCase();
  const named = treks.find(
    (t) =>
      lower.includes(t.name.toLowerCase()) ||
      lower.includes(t.id.replaceAll("-", " ")),
  );
  const monthIndex = MONTHS.findIndex((m) => lower.includes(m.toLowerCase()));
  const month = monthIndex < 0 ? memory.month : monthIndex + 1;
  let t = named || treks.find((t) => t.id === memory.trek),
    text;
  if (/recommend|beginner|find me|suggest|which trek/.test(lower)) {
    const picks = rankTreks(
      treks,
      {
        ...profile,
        ...(/beginner/.test(lower) ? { experience: 15, fitness: 60 } : {}),
      },
      month,
    );
    t = picks[0]?.trek;
    text = `For ${MONTHS[month - 1]}, your strongest profile matches are ${picks.map((r) => `${r.trek.name} (${r.trek.days} days, ${r.score}% match)`).join("; ")}. Let’s start with ${t?.name}. Ask “what permits do I need?” and I’ll keep this trail in mind.`;
  } else if (/permit|entry|registration|permission/.test(lower)) {
    text = t
      ? `${t.name}: ${t.permit} Permit fees and access may change; check the current local forest authority or your registered operator before departure. ${t.id === "roopkund" ? "High meadow camping and lake access may be restricted; verify the authorized route." : ""}`
      : "Which trail are you considering? Tell me its name and I can explain the relevant permit checks.";
  } else if (/season|month|best time|december|winter|summer/.test(lower)) {
    text = t
      ? `${t.name} is usually planned in ${t.season}. ${t.months?.includes(month) ? MONTHS[month - 1] + " is within its typical season." : MONTHS[month - 1] + " is outside its typical season; consider changing dates."} Recheck local weather and access near departure.`
      : "Tell me a trek name or ask for a recommendation for your travel month.";
  } else if (/pack|gear|carry|equipment/.test(lower)) {
    text = t
      ? `For ${t.name} in ${MONTHS[month - 1]}, prioritize ${Object.values(monthPacking(t, month)).flat().slice(0, 12).join(", ")}. RootPack lets you skip gear you already own and tick packed items.`
      : "Which trek and month should I pack for? I’ll remember them for follow-up questions.";
  } else if (/altitude|sick|acclim|headache/.test(lower)) {
    text = `${t ? `${t.name} reaches ${t.altitude.toLocaleString()} m. ` : ""}Ascend gradually and plan acclimatization. Do not go higher while altitude symptoms persist. Worsening symptoms require prompt qualified help and an appropriate descent plan. Fitness alone does not predict altitude tolerance.`;
  } else if (/safe|risk|danger|prepare/.test(lower)) {
    text = t
      ? `${t.name} requires preparation for ${t.altitude > 3000 ? "altitude and changing weather" : "slippery terrain and weather changes"}. Keep a route plan, offline navigation, layers, safe water and emergency contacts. Confirm conditions with a qualified local guide before setting out.`
      : "Choose a trail and travel month so I can discuss its main preparation points.";
  } else if (t) {
    text = `${t.name} is a ${t.difficulty.toLowerCase()} ${t.days}-day trek in ${t.location}, reaching ${t.altitude.toLocaleString()} m. Your saved profile gives a RootScore of ${readiness(profile, t)}/100. I’ve kept ${t.name} in this conversation — ask about its permits, best season, packing or altitude.`;
  } else {
    text =
      "I can use the WildRoot trail catalog and your profile to help. Try “Recommend a beginner trek in December” or “Tell me about Kudremukh”.";
  }
  return { text, month, trek: t?.id || memory.trek };
}
