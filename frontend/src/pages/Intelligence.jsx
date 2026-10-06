import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, ShieldCheck, Leaf, Check, Backpack } from "lucide-react";
import { Page, Field, Ring, Disclaimer, ErrorBox } from "../components/UI";
import { useWild } from "../components/Context";
import { TrekCard } from "../App";
import {
  match,
  readiness,
  pulse,
  packing,
  eco,
} from "../services/intelligence";
import { post, api } from "../services/api";
export function WildMatch() {
  const { profile, treks } = useWild();
  const ranked = [...treks].sort(
    (a, b) => match(profile, b) - match(profile, a),
  );
  return (
    <Page
      eyebrow="WILDMATCH™"
      title="The trails that get you."
      description="Personalized recommendations based on your fitness, experience, budget and preferred terrain."
    >
      <div className="notice">
        <Sparkles />
        <div>
          <b>Your profile, your possibilities.</b>
          <p>
            Rule-based matches · {profile.fitness}% fitness · {profile.days}{" "}
            days · ₹{profile.budget.toLocaleString()} budget
          </p>
        </div>
        <Link className="button small" to="/profile">
          Refine profile
        </Link>
      </div>
      <div className="trek-grid">
        {ranked.map((t) => (
          <TrekCard key={t.id} trek={t} score={match(profile, t)} />
        ))}
      </div>
      <Disclaimer />
    </Page>
  );
}
export function Suitability({ trek }) {
  const { profile } = useWild();
  const [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function run() {
    setBusy(true);
    setError("");
    try {
      setResult(
        await post("/predict-suitability", {
          fitness: profile.fitness,
          experience: profile.experience,
          age: profile.age,
          difficulty: { Easy: 1, Moderate: 2, Challenging: 3 }[trek.difficulty],
          altitude: trek.altitude,
          elevation_gain: trek.elevation_gain,
          duration: trek.days,
          weather_risk: trek.weather_risk,
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="panel neural">
      <div className="panel-title">
        <Sparkles />
        <h3>Trek Suitability Neural Network</h3>
      </div>
      <p>
        A TensorFlow neural network trained on synthetic examples. This
        educational estimate is separate from your rule-based RootScore.
      </p>
      <button className="button" disabled={busy} onClick={run}>
        {busy ? "Calculating suitability…" : "Check my suitability"}
      </button>
      <ErrorBox error={error} />
      {result && (
        <div className="prediction">
          <strong>{result.score}%</strong>
          <div>
            <b>{result.classification}</b>
            <p>Neural network · synthetic training data</p>
          </div>
        </div>
      )}
      <Disclaimer />
    </div>
  );
}
export function RootScore() {
  const { treks, profile } = useWild();
  const [id, setId] = useState(treks[0]?.id);
  const t = treks.find((t) => t.id === id) || treks[0];
  if (!t) return <Page title="No treks available." />;
  const score = readiness(profile, t);
  return (
    <Page
      eyebrow="ROOTSCORE™"
      title="Know your starting point."
      description="A thoughtful readiness estimate. A better-prepared adventure."
    >
      <Field label="Choose a trail">
        <select value={t.id} onChange={(e) => setId(e.target.value)}>
          {treks.map((x) => (
            <option value={x.id} key={x.id}>
              {x.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="split spaced">
        <div className="panel score-panel">
          <Ring score={score} label="RootScore" />
          <h3>
            {score >= 75
              ? "Ready for this challenge"
              : score >= 50
                ? "Build your preparation"
                : "Consider an easier route"}
          </h3>
          <p>
            {t.name} · {t.difficulty} · {t.altitude.toLocaleString()} m
          </p>
          {[
            ["Fitness", profile.fitness],
            ["Experience", profile.experience],
            ["Altitude comfort", profile.altitude],
          ].map(([label, n]) => (
            <div className="metric" key={label}>
              <span>
                {label}
                <b>{n}%</b>
              </span>
              <div>
                <i style={{ width: n + "%" }} />
              </div>
            </div>
          ))}
          <Link to="/profile" className="text-link inline">
            Update your inputs
          </Link>
        </div>
        <Suitability key={t.id} trek={t} />
      </div>
      <Disclaimer />
    </Page>
  );
}
export function RootPack() {
  const { treks, user, notify } = useWild();
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get("trek") || treks[0]?.id),
    [weather, setWeather] = useState("Normal"),
    [checked, setChecked] = useState([]),
    [busy, setBusy] = useState(false);
  const t = treks.find((t) => t.id === id) || treks[0];
  if (!t) return <Page title="No treks available." />;
  const groups = packing(t, weather),
    total = Object.values(groups).flat().length;
  async function load() {
    setBusy(true);
    try {
      setChecked((await api("/packing/" + t.id)).items);
      notify("Account packing list loaded.");
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    try {
      await api("/packing/" + t.id, {
        method: "PUT",
        body: JSON.stringify({ items: checked }),
      });
      notify("Packing list saved to your account.");
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      eyebrow="ROOTPACK™"
      title="Pack light. Prepare well."
      description="A responsive packing checklist based on altitude, trip length and expected weather."
    >
      <div className="filter-row">
        <Field label="Destination">
          <select
            value={t.id}
            onChange={(e) => {
              setId(e.target.value);
              setChecked([]);
            }}
          >
            {treks.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Expected conditions">
          <select
            value={weather}
            onChange={(e) => {
              setWeather(e.target.value);
              setChecked([]);
            }}
          >
            {["Normal", "Cold", "Storm"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <div className="pack-progress">
          <Backpack />
          <b>
            {
              checked.filter((x) => Object.values(groups).flat().includes(x))
                .length
            }{" "}
            / {total} packed
          </b>
          <span>
            {t.days} days · {t.difficulty}
          </span>
        </div>
      </div>
      {weather === "Storm" && (
        <div className="error-box">
          A packing list does not make a storm safe. Consult a local guide and
          postpone if necessary.
        </div>
      )}
      <div className="pack-grid">
        {Object.entries(groups).map(([group, items]) => (
          <div className="panel" key={group}>
            <h3>{group}</h3>
            {items.map((item) => (
              <label className="check-item" key={item}>
                <input
                  type="checkbox"
                  checked={checked.includes(item)}
                  onChange={() =>
                    setChecked((old) =>
                      old.includes(item)
                        ? old.filter((x) => x !== item)
                        : [...old, item],
                    )
                  }
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
      {user ? (
        <div className="actions spaced">
          <button disabled={busy} className="button" onClick={save}>
            Save packing list
          </button>
          <button disabled={busy} className="button secondary" onClick={load}>
            Load saved checklist
          </button>
        </div>
      ) : (
        <p className="disclaimer">
          Checklist is temporary. Sign in to save it to your account.
        </p>
      )}
    </Page>
  );
}
export function Safety() {
  const { treks, profile } = useWild();
  const [id, setId] = useState(treks[0]?.id),
    [weather, setWeather] = useState("Normal"),
    [group, setGroup] = useState(2),
    [transport, setTransport] = useState(200);
  const t = treks.find((t) => t.id === id) || treks[0];
  if (!t) return <Page title="No treks available." />;
  const risk = pulse(profile, t, weather),
    impact = eco(t, group, transport);
  return (
    <Page
      eyebrow="TRAILPULSE™"
      title="Confidence comes prepared."
      description="Know the terrain. Respect the conditions. Look after each other."
    >
      <div className="filter-row">
        <Field label="Your route">
          <select value={t.id} onChange={(e) => setId(e.target.value)}>
            {treks.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Weather scenario">
          <select value={weather} onChange={(e) => setWeather(e.target.value)}>
            {["Normal", "Cold", "Storm"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="split spaced">
        <div className="panel">
          <div className="panel-title">
            <ShieldCheck />
            <h3>TrailPulse analysis</h3>
          </div>
          <div className={"risk " + risk.level.toLowerCase()}>
            {risk.level} estimated risk
          </div>
          <p>
            Rule-based scenario analysis. No live weather or emergency
            monitoring.
          </p>
          <ul className="tip-list">
            {risk.tips.map((x) => (
              <li key={x}>
                <Check size={16} />
                {x}
              </li>
            ))}
          </ul>
          <SafetyAlerts />
        </div>
        <div className="panel">
          <div className="panel-title">
            <Leaf />
            <h3>WildRoot EcoScore</h3>
          </div>
          <div className="prediction">
            <strong>{impact.score}</strong>
            <div>
              <b>{impact.label}</b>
              <p>Heuristic impact estimate · no carbon accounting</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Group size">
              <input
                type="number"
                min="1"
                max="20"
                value={group}
                onChange={(e) =>
                  setGroup(Math.min(20, Math.max(1, +e.target.value)))
                }
              />
            </Field>
            <Field label="Transport distance (km)">
              <input
                type="number"
                min="0"
                max="20000"
                value={transport}
                onChange={(e) => setTransport(Math.max(0, +e.target.value))}
              />
            </Field>
          </div>
          <p>
            Carry reusable bottles, avoid disposable plastics, stay on marked
            trails, and respect protected ecosystems. Share transport where
            practical.
          </p>
        </div>
      </div>
      <div className="pack-grid spaced">
        {[
          [
            "Altitude awareness",
            "Ascend gradually. Do not climb higher while you have altitude symptoms; seek qualified help if they worsen.",
          ],
          ["Hydration", "Drink regularly and plan safe water refill points."],
          [
            "Weather preparation",
            "Check official local forecasts and carry adaptable layers.",
          ],
          [
            "Emergency checklist",
            "Share your route, contacts and return time with someone at home.",
          ],
          [
            "Navigation",
            "Carry an offline map and a backup; keep to authorized trails.",
          ],
          [
            "Wildlife awareness",
            "Keep distance from animals and secure food without feeding wildlife.",
          ],
          [
            "First aid",
            "Carry personal medication and a first aid kit; know your limits.",
          ],
          [
            "Responsible trekking",
            "Follow permits, local rules and leave-no-trace practices.",
          ],
        ].map(([title, text]) => (
          <div className="panel" key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
      <div className="panel spaced">
        <h3>Preparation references</h3>
        <p>
          <a
            className="text-link inline"
            href="https://wwwnc.cdc.gov/travel/page/travel-to-high-altitudes"
            target="_blank"
            rel="noreferrer"
          >
            CDC · High-altitude travel
          </a>
          <br />
          <a
            className="text-link inline"
            href="https://www.nps.gov/articles/10essentials.htm"
            target="_blank"
            rel="noreferrer"
          >
            National Park Service · Ten Essentials
          </a>
        </p>
      </div>
      <Disclaimer />
    </Page>
  );
}
function SafetyAlerts() {
  const [alerts, setAlerts] = useState(null),
    [error, setError] = useState("");
  return (
    <div className="spaced">
      <button
        className="text-link"
        onClick={async () => {
          try {
            setAlerts(await api("/alerts"));
            setError("");
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        Check operator safety alerts
      </button>
      <ErrorBox error={error} />
      {alerts &&
        (alerts.length ? (
          alerts.map((a) => (
            <div className="notice" key={a.id}>
              <div>
                <b>{a.title}</b>
                <p>{a.description}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="disclaimer">
            No operator alerts posted. This does not confirm safe conditions.
          </p>
        ))}
    </div>
  );
}
