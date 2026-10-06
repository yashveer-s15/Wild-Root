import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Compass,
  Sparkles,
  MapPin,
  Mountain,
  Utensils,
  House,
  ShieldCheck,
} from "lucide-react";
import { useWild } from "../components/Context";
import { Page, Field, ErrorBox } from "../components/UI";
import {
  MonthField,
  TrekVisual,
  neuralScore,
} from "../components/AdventureTools";
import {
  rankTreks,
  planBudget,
  monthPacking,
  MONTHS,
} from "../services/adventure";
export default function Planner() {
  const { treks, profile } = useWild();
  const [params] = useSearchParams();
  const initial = treks.find((t) => t.id === params.get("trek"));
  const [p, setP] = useState({
      ...profile,
      days: initial?.days || profile.days,
      budget: Math.max(profile.budget, initial?.price || 0),
    }),
    [id, setId] = useState(initial?.id || "auto"),
    [month, setMonth] = useState(12),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (k, v) => setP({ ...p, [k]: v });
  async function generate(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const ranked = rankTreks(treks, p, month);
    const t = id === "auto" ? ranked[0]?.trek : treks.find((t) => t.id === id);
    if (!t) {
      setError("Choose a trail from the catalog.");
      setBusy(false);
      return;
    }
    const r = ranked.find((r) => r.trek.id === t.id);
    let neural;
    try {
      neural = await neuralScore(p, t);
    } catch {
      setError(
        "Neural suitability is currently unavailable. Your itinerary is ready.",
      );
    }
    setResult({
      trek: t,
      budget: planBudget(t),
      neural,
      warnings: r?.warnings || [
        "Confirm access and current conditions before travel.",
      ],
      month,
      group: p.group,
    });
    setBusy(false);
  }
  return (
    <Page
      eyebrow="AI ITINERARY PLANNER"
      title="The details handled. The wild ahead."
      description="A complete trail plan, from your first breakfast to your last mountain sunset."
    >
      <div className="planner-v2">
        <form className="panel planner-controls" onSubmit={generate}>
          <div className="panel-title">
            <Compass />
            <h3>Design your escape</h3>
          </div>
          <Field label="Destination">
            <select value={id} onChange={(e) => setId(e.target.value)}>
              <option value="auto">Find a trail for me</option>
              {treks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <MonthField value={month} onChange={setMonth} />
          <div className="form-grid">
            <Field label="Available days">
              <input
                required
                type="number"
                min="1"
                max="20"
                value={p.days}
                onChange={(e) => set("days", +e.target.value)}
              />
            </Field>
            <Field label="Budget per person (₹)">
              <input
                required
                type="number"
                min="1000"
                max="1000000"
                value={p.budget}
                onChange={(e) => set("budget", +e.target.value)}
              />
            </Field>
          </div>
          <Field label="Travel type">
            <select
              value={p.group}
              onChange={(e) => set("group", e.target.value)}
            >
              {["Solo", "Friends", "Family", "Group"].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Terrain preference">
            <select
              value={p.terrain}
              onChange={(e) => set("terrain", e.target.value)}
            >
              {[
                "Forest",
                "Snow",
                "Mountain",
                "Valley",
                "Waterfalls",
                "High altitude",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label={`Fitness · ${p.fitness}%`}>
            <input
              type="range"
              min="0"
              max="100"
              value={p.fitness}
              onChange={(e) => set("fitness", +e.target.value)}
            />
          </Field>
          <button className="button lime" disabled={busy}>
            {busy ? "Building your trail plan…" : "Generate my itinerary"}
            <Sparkles size={17} />
          </button>
          <div className="planner-included">
            <span>
              <MapPin size={14} />
              Day-wise route
            </span>
            <span>
              <House size={14} />
              Stay & meals
            </span>
            <span>
              <ShieldCheck size={14} />
              Trail risks
            </span>
          </div>
        </form>
        <div className="planner-workspace">
          <ErrorBox error={error} />
          {result ? (
            <>
              <div className="plan-cover">
                <TrekVisual trek={result.trek} />
                <div>
                  <div className="eyebrow">
                    {MONTHS[result.month - 1]} / {result.group} ADVENTURE
                  </div>
                  <h2>{result.trek.name}</h2>
                  <p>
                    {result.trek.days} days ·{" "}
                    {result.trek.altitude.toLocaleString()} m ·{" "}
                    {result.trek.difficulty}
                  </p>
                  {result.neural && (
                    <span className="neural-pill">
                      <Sparkles size={14} />
                      {result.neural.score}% neural suitability
                    </span>
                  )}
                </div>
              </div>
              <div className="plan-warnings">
                {result.warnings.map((w) => (
                  <p key={w}>
                    <ShieldCheck size={14} />
                    {w}
                  </p>
                ))}
                {result.trek.days > p.days && (
                  <p>Allow {result.trek.days} days for the full route.</p>
                )}
              </div>
              <div className="itinerary-head">
                <h3>Your days on the trail</h3>
                <span>{result.trek.location}</span>
              </div>
              <div className="day-plans">
                {result.trek.itinerary.map((d) => (
                  <article className="day-plan" key={d.day}>
                    <div className="day-number">
                      <small>DAY</small>
                      <b>{String(d.day).padStart(2, "0")}</b>
                    </div>
                    <div>
                      <h3>{d.route || d.title}</h3>
                      <div className="day-meta">
                        <span>
                          <Mountain size={13} />
                          {d.altitude?.toLocaleString()} m
                        </span>
                        <span>
                          <House size={13} />
                          {d.stay}
                        </span>
                      </div>
                      <p>{d.description}</p>
                      <p>
                        <Utensils size={13} />
                        {d.meals}
                      </p>
                      <small>
                        <ShieldCheck size={12} />
                        Watch for: {d.risk}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
              <div className="split spaced">
                <div className="panel">
                  <h3>Budget, broken down</h3>
                  <div className="budget-table">
                    {Object.entries(result.budget).map(([key, value]) => (
                      <span key={key}>
                        {key === "total" ? "Total per person" : key}
                        <b>₹{value.toLocaleString("en-IN")}</b>
                      </span>
                    ))}
                  </div>
                  {result.budget.total > p.budget && (
                    <p className="budget-warning">
                      This estimate is ₹
                      {(result.budget.total - p.budget).toLocaleString()} above
                      your budget.
                    </p>
                  )}
                  <p>
                    Sample component estimates, not an operator quote. Travel to
                    the starting region is excluded.
                  </p>
                </div>
                <div className="panel">
                  <h3>Your packing shortlist</h3>
                  <div className="packing-shortlist">
                    {Object.values(monthPacking(result.trek, result.month))
                      .flat()
                      .slice(0, 10)
                      .map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                  </div>
                  <Link
                    className="button secondary"
                    to={"/packing?trek=" + result.trek.id}
                  >
                    Open full checklist
                  </Link>
                  <Link
                    className="text-link inline"
                    to={"/booking/" + result.trek.id}
                  >
                    Make a demo booking
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="planner-idle">
              <div className="idle-art">
                <Mountain size={70} />
                <Compass size={26} />
              </div>
              <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
              <h2>
                More trail.
                <br />
                <em>Less figuring it out.</em>
              </h2>
              <p>
                Choose your destination or let us find your match. Your day-wise
                route, stays, meals and budget will come together here.
              </p>
              <div className="idle-stats">
                <span>
                  <b>{treks.length}</b>Indian trails
                </span>
                <span>
                  <b>8</b>Neural inputs
                </span>
                <span>
                  <b>1</b>Personal adventure
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
