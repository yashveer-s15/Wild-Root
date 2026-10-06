import { useState } from "react";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Page, Field, Dna, ErrorBox } from "../components/UI";
import { useWild } from "../components/Context";
export default function Profile() {
  const { profile, updateProfile } = useWild();
  const [p, setP] = useState(profile),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (k, v) => setP({ ...p, [k]: v });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await updateProfile(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      eyebrow="ROOTPROFILE™"
      title="Every explorer is different."
      description="Tell us how you like to move. We’ll help you find where you belong."
    >
      <div className="split">
        <form className="panel" onSubmit={submit}>
          <div className="panel-title">
            <Sparkles />
            <h3>Build your adventure profile</h3>
          </div>
          <div className="form-grid">
            {[
              ["fitness", "Fitness level"],
              ["experience", "Trekking experience"],
              ["adventure", "Adventure preference"],
              ["altitude", "Altitude comfort"],
              ["risk", "Risk tolerance"],
            ].map(([k, label]) => (
              <Field key={k} label={`${label} · ${p[k]}%`}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={p[k]}
                  onChange={(e) => set(k, +e.target.value)}
                />
                <small>
                  {k === "experience"
                    ? "0 = first trek · 100 = extensive experience"
                    : "Self-reported preference, not a medical assessment"}
                </small>
              </Field>
            ))}
            <Field label="Age group">
              <select
                value={p.age}
                onChange={(e) => set("age", +e.target.value)}
              >
                {["Under 18", "18–35", "36–55", "56+"].map((x, i) => (
                  <option key={x} value={i}>
                    {x}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Preferred terrain">
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
            <Field label="Available days">
              <input
                required
                type="number"
                min="1"
                max="30"
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
            <Field label="Travel companions">
              <select
                value={p.group}
                onChange={(e) => set("group", e.target.value)}
              >
                {["Solo", "Friends", "Family", "Group"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
          <ErrorBox error={error} />
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Save my RootProfile"}
            <Sparkles size={17} />
          </button>
          <Link className="text-link inline" to="/wildmatch">
            See my matches <ArrowUpRight size={17} />
          </Link>
        </form>
        <Dna profile={p} />
      </div>
    </Page>
  );
}
