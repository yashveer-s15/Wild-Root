import { useState } from "react";
import { Search, Heart } from "lucide-react";
import { useWild } from "../components/Context";
import { Page, Field, Empty } from "../components/UI";
import { TrekCard } from "../App";
import { match } from "../services/intelligence";
export default function Explorer() {
  const { treks, profile, saved, offline } = useWild();
  const [query, setQuery] = useState(""),
    [difficulty, setDifficulty] = useState("All"),
    [state, setState] = useState("All"),
    [duration, setDuration] = useState("All"),
    [onlySaved, setOnlySaved] = useState(false),
    [mode, setMode] = useState(() => "photo");
  const results = treks.filter(
    (t) =>
      `${t.name} ${t.location} ${t.terrain}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (difficulty === "All" || t.difficulty === difficulty) &&
      (state === "All" || t.location === state) &&
      (duration === "All" ||
        (duration === "1–3 days"
          ? t.days <= 3
          : duration === "4–6 days"
            ? t.days >= 4 && t.days <= 6
            : t.days >= 7)) &&
      (!onlySaved || saved.includes(t.id)),
  );
  return (
    <Page
      eyebrow="THE TRAIL COLLECTION"
      title={`${treks.length} trails. A thousand new perspectives.`}
      description="From forest weekends to Himalayan adventures. Find your next chapter."
    >
      <div className="explorer-toolbar panel">
        <div className="search">
          <Search size={18} />
          <input
            aria-label="Search treks"
            placeholder="Search trails, states or terrain…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Field label="Difficulty">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {["All", "Easy", "Moderate", "Challenging"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="State">
          <select value={state} onChange={(e) => setState(e.target.value)}>
            {["All", ...new Set(treks.map((t) => t.location))].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Duration">
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            {["All", "1–3 days", "4–6 days", "7+ days"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="results-line">
        <div className="explorer-switches">
          <button
            className={onlySaved ? "pill active" : "pill"}
            onClick={() => setOnlySaved(!onlySaved)}
            aria-pressed={onlySaved}
          >
            <Heart size={14} />
            Saved {saved.length}
          </button>
        </div>
        <span>
          {results.length} trails {offline && "· Offline catalog"}
        </span>
      </div>
      {results.length ? (
        <div className="trek-grid">
          {results.map((t) => (
            <TrekCard
              key={t.id}
              trek={t}
              score={match(profile, t)}
              mode={mode}
            />
          ))}
        </div>
      ) : (
        <Empty
          title={
            onlySaved
              ? "Your trail wishlist is waiting."
              : "No trails match your filters."
          }
          description={
            onlySaved
              ? "Tap the heart on any trail to save it here."
              : "Try a different state, difficulty or duration."
          }
        />
      )}
    </Page>
  );
}
