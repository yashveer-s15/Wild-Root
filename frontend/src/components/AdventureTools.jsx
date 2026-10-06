import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Search,
  Heart,
  GitCompareArrows,
  X,
  Check,
  Mountain,
  ArrowUpRight,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { useWild } from "./Context";
import { Page, Field, Ring, ErrorBox, Empty } from "./UI";
import {
  MONTHS,
  smartSearch,
  rankTreks,
  trekBrief,
  monthPacking,
  fitnessPlan,
} from "../services/adventure";
import { defaultProfile } from "../services/intelligence";
import { post } from "../services/api";
import { Suitability } from "../pages/Intelligence";
import { TrekCard } from "../App";
export async function neuralScore(p, t) {
  return post("/predict-suitability", {
    fitness: p.fitness,
    experience: p.experience,
    age: p.age,
    difficulty: { Easy: 1, Moderate: 2, Challenging: 3 }[t.difficulty],
    altitude: t.altitude,
    elevation_gain: t.elevation_gain,
    duration: t.days,
    weather_risk: t.weather_risk,
  });
}
export function MonthField({ value, onChange }) {
  return (
    <Field label="Travel month">
      <select value={value} onChange={(e) => onChange(+e.target.value)}>
        {MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
    </Field>
  );
}
export function SmartHome() {
  const { treks } = useWild();
  const [query, setQuery] = useState(""),
    [submitted, setSubmitted] = useState("");
  const results = smartSearch(treks, submitted);
  return (
    <section className="smart-home section">
      <div className="smart-title">
        <Sparkles />
        <div>
          <div className="eyebrow">LESS GUESSWORK. MORE ADVENTURE.</div>
          <h2>Describe your perfect escape.</h2>
        </div>
        <span className="tool-badge">SMART SEARCH</span>
      </div>
      <form
        className="smart-search"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query);
        }}
      >
        <Search />
        <input
          aria-label="Describe your ideal trek"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="An easy 3-day trek in December under ₹8000"
        />
        <button className="button lime">
          Find my trail <Sparkles size={17} />
        </button>
      </form>
      <div className="search-examples">
        {[
          "easy 3-day trek in December under ₹8000",
          "snow trek under ₹15000",
          "forest trek in Karnataka",
        ].map((q) => (
          <button
            key={q}
            onClick={() => {
              setQuery(q);
              setSubmitted(q);
            }}
          >
            {q}
          </button>
        ))}
      </div>
      <div className="results-line">
        <span>
          {submitted
            ? `${results.length} trails fit “${submitted}”`
            : "A few places to begin your next chapter"}
        </span>
        <Link to="/explore">All {treks.length} trails</Link>
      </div>
      {results.length ? (
        <div className="trek-grid">
          {results.slice(0, submitted ? 6 : 3).map(({ trek, reason }) => (
            <div key={trek.id}>
              <TrekCard trek={trek} />
              {submitted && (
                <p className="pick-reason">
                  <Check size={14} />
                  {reason}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="No exact match for that escape."
          description="Try a larger budget, more days, or another month."
        />
      )}
    </section>
  );
}
export function Matcher() {
  const { profile, treks, updateProfile } = useWild();
  const [p, setP] = useState({
      ...profile,
      experience:
        profile.experience < 30 ? 15 : profile.experience < 65 ? 45 : 80,
    }),
    [month, setMonth] = useState(12),
    [results, setResults] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (k, v) => setP({ ...p, [k]: v });
  async function generate(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const ranked = rankTreks(treks, p, month);
    const predictions = await Promise.allSettled(
      ranked.map((r) => neuralScore(p, r.trek)),
    );
    setResults(
      ranked.map((r, i) => ({
        ...r,
        neural:
          predictions[i].status === "fulfilled" ? predictions[i].value : null,
      })),
    );
    if (predictions.some((r) => r.status === "rejected"))
      setError(
        "Neural service unavailable for some trails. Profile matches are still available.",
      );
    setBusy(false);
  }
  return (
    <Page
      eyebrow="WILDMATCH / TREK MATCHER"
      title="Less searching. More belonging."
      description="Your fitness, your budget, your season. Three trails that make sense for you."
    >
      <div className="matcher-layout">
        <form className="panel compact-form" onSubmit={generate}>
          <h3>Fine-tune your escape</h3>
          <Field label={`Fitness · ${p.fitness}%`}>
            <input
              type="range"
              min="0"
              max="100"
              value={p.fitness}
              onChange={(e) => set("fitness", +e.target.value)}
            />
          </Field>
          <Field label="Experience">
            <select
              value={p.experience}
              onChange={(e) => set("experience", +e.target.value)}
            >
              <option value="15">First trek</option>
              <option value="45">A few trails</option>
              <option value="80">Experienced trekker</option>
            </select>
          </Field>
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
            <Field label="Budget (₹)">
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
          <MonthField value={month} onChange={setMonth} />
          <Field label="Your preferred terrain">
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
          <button className="button lime" disabled={busy}>
            {busy ? "Finding your matches…" : "Find my top 3"}
            <Sparkles size={16} />
          </button>
          <button
            type="button"
            className="text-link inline"
            onClick={async () => {
              try {
                await updateProfile(p);
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            Save these preferences
          </button>
        </form>
        <div>
          <ErrorBox error={error} />
          {results ? (
            <div className="match-results">
              {results.map((r, i) => (
                <div key={r.trek.id} className="match-result">
                  <span className="rank-number">0{i + 1}</span>
                  <TrekCard trek={r.trek} score={r.score} />
                  <div className="match-insights">
                    {r.neural && (
                      <div className="neural-pill">
                        <Sparkles size={15} />
                        Neural suitability {r.neural.score}% ·{" "}
                        {r.neural.classification}
                      </div>
                    )}
                    <h4>What to watch out for</h4>
                    {r.warnings.map((w) => (
                      <p key={w}>
                        <ShieldCheck size={13} />
                        {w}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="matcher-preview">
              <Sparkles size={40} />
              <h2>Your next trail is personal.</h2>
              <p>
                Set your preferences and we’ll rank three routes, check neural
                suitability, and highlight the tradeoffs.
              </p>
              <div className="preview-tags">
                <span>01 Profile match</span>
                <span>02 Season fit</span>
                <span>03 Things to know</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
export function FitnessReadiness() {
  const { treks, profile } = useWild();
  const [f, setF] = useState({ time: 40, age: 24, exercise: 3, weeks: 6 }),
    [result, setResult] = useState(null),
    [id, setId] = useState(treks[0]?.id);
  const t = treks.find((t) => t.id === id) || treks[0];
  return (
    <Page
      eyebrow="ROOTSCORE / FITNESS READINESS"
      title="Get trail-ready, one week at a time."
      description="Turn your current walking pace and preparation time into a practical training plan."
    >
      <div className="split">
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            setResult(fitnessPlan(f));
          }}
        >
          <h3>Your starting point</h3>
          <div className="form-grid">
            {[
              ["time", "Your 5 km walk / run time (minutes)", 15, 120],
              ["age", "Age", 12, 85],
              ["exercise", "Exercise days per week", 0, 7],
              ["weeks", "Preparation weeks", 1, 16],
            ].map(([k, label, min, max]) => (
              <Field key={k} label={label}>
                <input
                  required
                  type="number"
                  min={min}
                  max={max}
                  value={f[k]}
                  onChange={(e) => setF({ ...f, [k]: +e.target.value })}
                />
              </Field>
            ))}
          </div>
          <button className="button lime spaced">
            Build my readiness plan <Sparkles size={17} />
          </button>
        </form>
        <div className="panel score-panel">
          {result ? (
            <>
              <Ring score={result.score} label="Fitness readiness" />
              <h3>
                {result.score >= 75
                  ? "A solid foundation"
                  : result.score >= 50
                    ? "Keep building consistency"
                    : "Start with a gentler trail"}
              </h3>
              <ul className="tip-list">
                {result.gaps.map((g) => (
                  <li key={g}>
                    <Check size={16} />
                    {g}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <Mountain size={55} />
              <h3 className="spaced">A summit begins before the trail.</h3>
              <p>
                Enter your current pace and preparation window to see the gaps
                to focus on.
              </p>
            </>
          )}
        </div>
      </div>
      {result && (
        <>
          <div className="section-heading spaced">
            <h2>Your {result.plan.length}-week preparation plan</h2>
            <span className="tool-badge">GRADUAL PROGRESSION</span>
          </div>
          <div className="training-grid">
            {result.plan.map((w) => (
              <div className="panel" key={w.week}>
                <div className="eyebrow">
                  WEEK {String(w.week).padStart(2, "0")}
                </div>
                <h3>
                  {w.week === result.plan.length
                    ? "Rest & get ready"
                    : "Build your base"}
                </h3>
                <p>{w.walk}</p>
                <p>{w.strength}</p>
                <p>{w.long}</p>
                <small>{w.recovery}</small>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="split spaced">
        <div className="panel">
          <h3>Check a specific trek</h3>
          <Field label="Choose your route">
            <select value={id} onChange={(e) => setId(e.target.value)}>
              {treks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <p>The route-specific neural check uses your saved RootProfile.</p>
          <Link to="/profile" className="text-link inline">
            Update RootProfile
          </Link>
        </div>
        {t && <Suitability trek={t} key={t.id} />}
      </div>
    </Page>
  );
}
export function GearAdvisor() {
  const { treks, notify, user } = useWild();
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get("trek") || treks[0]?.id),
    [month, setMonth] = useState(12),
    [owned, setOwned] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("wildroot-owned") || "[]");
      } catch {
        return [];
      }
    }),
    [checked, setChecked] = useState([]),
    [hide, setHide] = useState(true);
  const t = treks.find((t) => t.id === id) || treks[0];
  useEffect(() => {
    localStorage.setItem("wildroot-owned", JSON.stringify(owned));
  }, [owned]);
  useEffect(() => {
    try {
      setChecked(
        JSON.parse(localStorage.getItem("wildroot-pack-" + id) || "[]"),
      );
    } catch {
      setChecked([]);
    }
  }, [id]);
  useEffect(() => {
    localStorage.setItem("wildroot-pack-" + id, JSON.stringify(checked));
  }, [checked, id]);
  if (!t) return <Page title="No trails available." />;
  const all = monthPacking(t, month),
    groups = monthPacking(t, month, hide ? owned : []),
    total = Object.values(groups).flat(),
    packed = checked.filter((i) => total.includes(i)).length;
  function toggle(set, value) {
    set((old) =>
      old.includes(value) ? old.filter((x) => x !== value) : [...old, value],
    );
  }
  return (
    <Page
      eyebrow="ROOTPACK / GEAR ADVISOR"
      title="Everything you need. Nothing extra."
      description="A month-aware checklist that remembers your kit and what you’ve packed."
    >
      <div className="gear-top panel">
        <Field label="Your trek">
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {treks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <MonthField value={month} onChange={setMonth} />
        <label className="check-item">
          <input
            type="checkbox"
            checked={hide}
            onChange={(e) => setHide(e.target.checked)}
          />
          Skip items I already own
        </label>
        <div className="gear-count">
          <b>
            {packed}
            <span>/{total.length}</span>
          </b>
          <small>PACKED & READY</small>
        </div>
      </div>
      <div className="pack-grid spaced">
        {Object.entries(groups).map(([group, items]) => (
          <div className="panel gear-panel" key={group}>
            <h3>
              {group}
              <small>{items.length} items</small>
            </h3>
            {items.length ? (
              items.map((item) => (
                <div className="gear-item" key={item}>
                  <label className="check-item">
                    <input
                      type="checkbox"
                      checked={checked.includes(item)}
                      onChange={() => toggle(setChecked, item)}
                    />
                    <span>{item}</span>
                  </label>
                  <button
                    aria-pressed={owned.includes(item)}
                    onClick={() => toggle(setOwned, item)}
                    title="Mark as already owned"
                  >
                    {owned.includes(item) ? "Owned" : "I own this"}
                  </button>
                </div>
              ))
            ) : (
              <p>All essentials in this category are already in your kit.</p>
            )}
          </div>
        ))}
      </div>
      <details className="panel spaced">
        <summary>Your existing kit · {owned.length} items</summary>
        <div className="owned-list">
          {owned.map((i) => (
            <button key={i} onClick={() => toggle(setOwned, i)}>
              {i} <X size={13} />
            </button>
          ))}
        </div>
        {!owned.length && (
          <p>
            Use “I own this” beside any item. Owned items are skipped when the
            option above is enabled.
          </p>
        )}
      </details>
      <p className="disclaimer">
        Your kit and checklist are saved on this device.
      </p>
    </Page>
  );
}
export function TrekVisual({ trek: t, className = "" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [t.photo, t.image]);
  if (failed) return <div className={"landscape-photo photo-unavailable " + className} role="img" aria-label={`${t.name} photograph unavailable`}>Photo unavailable</div>;
  return (
    <img
      className={"landscape-photo " + className}
      src={t.photo || t.image}
      alt={failed ? "Landscape photograph unavailable" : `${t.name} — ${t.photo_credit?.title || "trail photograph"}`}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
export function TrekPopup() {
  const {
    selectedTrek,
    setSelectedTrek,
    treks,
    profile,
    saved,
    toggleSave,
    compare,
    toggleCompare,
  } = useWild();
  const ref = useRef();
  const [brief, setBrief] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const t = treks.find((t) => t.id === selectedTrek);
  useEffect(() => {
    setBrief(null);
    setError("");
    if (!selectedTrek) return;
    const previous = document.activeElement;
    const el = ref.current;
    if (el && !el.open) el.showModal();
    return () => {
      el?.close();
      previous?.focus();
    };
  }, [selectedTrek]);
  if (!t) return null;
  async function generate() {
    setBusy(true);
    setError("");
    try {
      const neural = await neuralScore(profile, t);
      setBrief({ ...trekBrief(t, profile), neural });
    } catch (e) {
      setBrief(trekBrief(t, profile));
      setError(
        "Neural score could not be loaded. Route information is available below.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={ref}
      className="trek-dialog"
      onCancel={() => setSelectedTrek(null)}
      onClick={(e) => {
        if (e.target === ref.current) setSelectedTrek(null);
      }}
    >
      <div className="popup-visual">
        <TrekVisual trek={t} />
        <button
          className="popup-close"
          aria-label="Close trek details"
          onClick={() => setSelectedTrek(null)}
        >
          <X />
        </button>
        <span className="difficulty">{t.difficulty}</span>
      </div>
      <div className="popup-body">
        <div className="eyebrow">
          {t.location} / {t.terrain}
        </div>
        <h2>{t.name}</h2>
        <p>{t.description}</p>
        {t.photo_credit && <small className="photo-credit"><a href={t.photo_credit.source} target="_blank" rel="noreferrer">Photo: {t.photo_credit.author}</a> · <a href={t.photo_credit.license_url || t.photo_credit.source} target="_blank" rel="noreferrer">{t.photo_credit.license}</a></small>}
        <div className="popup-stats">
          {[
            ["Duration", t.days + " days"],
            ["Altitude", t.altitude.toLocaleString() + " m"],
            ["Season", t.season],
            ["Cost", "₹" + t.price.toLocaleString("en-IN")],
            [
              "Altitude exposure",
              t.altitude >= 4000
                ? "High"
                : t.altitude >= 2500
                  ? "Moderate"
                  : "Lower",
            ],
          ].map(([k, v]) => (
            <div key={k}>
              <small>{k}</small>
              <b>{v}</b>
            </div>
          ))}
        </div>
        <div className="actions">
          <button className="button lime" disabled={busy} onClick={generate}>
            <Sparkles size={17} />
            {busy ? "Generating brief…" : "Generate AI brief"}
          </button>
          <button
            className="button secondary"
            aria-pressed={saved.includes(t.id)}
            onClick={() => toggleSave(t.id)}
          >
            <Heart
              size={17}
              fill={saved.includes(t.id) ? "currentColor" : "none"}
            />
            {saved.includes(t.id) ? "Saved" : "Save"}
          </button>
          <button
            className="button secondary"
            aria-pressed={compare.includes(t.id)}
            onClick={() => toggleCompare(t.id)}
          >
            <GitCompareArrows size={17} />
            {compare.includes(t.id) ? "In comparison" : "Compare"}
          </button>
        </div>
        <ErrorBox error={error} />
        {brief && (
          <div className="trail-brief">
            <div className="eyebrow">YOUR TRAIL INTELLIGENCE BRIEF</div>
            {brief.neural && (
              <div className="neural-pill">
                <Sparkles size={15} />
                {brief.neural.score}% neural suitability ·{" "}
                {brief.neural.classification}
              </div>
            )}
            <h4>Who this trail suits</h4>
            <p>{brief.suits}</p>
            <h4>Best time</h4>
            <p>{brief.best}</p>
            <h4>Three things to know</h4>
            <ol>
              {brief.things.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
            <div className="brief-safety">
              <ShieldCheck size={17} />
              {brief.safety}
            </div>
          </div>
        )}
        <div className="popup-links">
          <Link to={"/treks/" + t.id} onClick={() => setSelectedTrek(null)}>
            Full trail details <ArrowUpRight size={15} />
          </Link>
          <Link
            to={"/planner?trek=" + t.id}
            onClick={() => setSelectedTrek(null)}
          >
            Plan this trek <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </dialog>
  );
}
export function CompareDock() {
  const { compare, treks, toggleCompare, clearCompare } = useWild();
  const [open, setOpen] = useState(false),
    ref = useRef();
  useEffect(() => {
    if (open && ref.current && !ref.current.open) ref.current.showModal();
  }, [open]);
  if (!compare.length) return null;
  const selected = compare
    .map((id) => treks.find((t) => t.id === id))
    .filter(Boolean);
  return (
    <>
      <div className="compare-dock">
        <GitCompareArrows size={20} />
        <div>
          <b>{selected.length} / 3 trails</b>
          <small>{selected.map((t) => t.name).join(" · ")}</small>
        </div>
        <button className="button lime small" onClick={() => setOpen(true)}>
          Compare trails
        </button>
        <button
          aria-label="Clear comparison"
          onClick={() => {
            clearCompare();
            setOpen(false);
          }}
        >
          <X size={19} />
        </button>
      </div>
      {open && (
        <dialog
          className="compare-dialog"
          ref={ref}
          onCancel={() => setOpen(false)}
        >
          <div className="section-heading">
            <h2>Your trails, side by side.</h2>
            <button
              aria-label="Close comparison"
              onClick={() => {
                ref.current.close();
                setOpen(false);
              }}
            >
              <X />
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>What matters</th>
                  {selected.map((t) => (
                    <th key={t.id}>{t.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["State", (t) => t.location],
                  ["Difficulty", (t) => t.difficulty],
                  ["Duration", (t) => t.days + " days"],
                  ["Altitude", (t) => t.altitude.toLocaleString() + " m"],
                  ["Distance", (t) => t.distance + " km"],
                  ["Terrain", (t) => t.terrain],
                  ["Best season", (t) => t.season],
                  ["Sample cost", (t) => "₹" + t.price.toLocaleString("en-IN")],
                  [
                    "Altitude exposure",
                    (t) =>
                      t.altitude >= 4000
                        ? "High"
                        : t.altitude >= 2500
                          ? "Moderate"
                          : "Lower",
                  ],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    {selected.map((t) => (
                      <td key={t.id}>{value(t)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="compare-footer">
            {selected.map((t) => (
              <Link
                className="button small"
                key={t.id}
                to={"/planner?trek=" + t.id}
                onClick={() => setOpen(false)}
              >
                Plan {t.name}
              </Link>
            ))}
          </div>
        </dialog>
      )}
    </>
  );
}
export function HowItWorks({ view = "all" }) {
  return (
    <section className="section how-section">
      {view !== "faq" && <>
      <div className="section-heading">
        <div>
          <div className="eyebrow">FROM “SOMEDAY” TO TRAIL DAY</div>
          <h2>
            Less planning friction.
            <br />
            More mountain moments.
          </h2>
        </div>
        <Link className="button lime" to="/wildmatch">
          Find my trail <Sparkles size={17} />
        </Link>
      </div>
      <div className="how-grid">
        {[
          [
            "01",
            "Tell us your kind of wild",
            "Set your fitness, time, budget and travel month.",
          ],
          [
            "02",
            "Find your trail connection",
            "Compare three personal matches and check your suitability.",
          ],
          [
            "03",
            "Make the adventure yours",
            "Build your itinerary, prepare your kit and train for the trail.",
          ],
        ].map(([n, t, p]) => (
          <div key={n}>
            <span>{n}</span>
            <h3>{t}</h3>
            <p>{p}</p>
          </div>
        ))}
      </div>
      </>}
      {view !== "how" && <div className="faq">
        <div className="eyebrow">FAQ / HERE TO HELP</div>
        <h3>A few things you might be wondering.</h3>
        {[
          [
            "Can I use WildRoot without an account?",
            "Yes. Explore, compare, use the tools and save favorites on your device. Sign in for demo bookings and account features.",
          ],
          [
            "Are the routes and costs fixed?",
            "No. They are planning estimates. Permits, access, camps, meals and operator costs can change.",
          ],
          [
            "What powers the recommendations?",
            "Personal preferences and season-aware matching rank routes. A trained TensorFlow neural network adds route suitability scores. The guide uses a built-in trail knowledge engine with conversation memory.",
          ],
          [
            "Can I see actual photographs?",
            "Every trek has its own real photograph of the destination or trail, saved locally. Photographer and license credits are available in the trek details.",
          ],
          [
            "Does a booking reserve a real trek?",
            "No. Bookings are demonstrations with no real payment or travel reservation.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>}
      <div className="help-guide-cta"><MessageCircle size={24} /><div><h3>Have a question about your next trek?</h3><p>Ask the guide about seasons, permits, packing and your chosen trail.</p></div><Link className="button lime" to="/guide">Chat with AI Guide <ArrowUpRight size={17} /></Link></div>
    </section>
  );
}
