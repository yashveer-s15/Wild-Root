import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Mountain,
  Clock,
  Route,
  Calendar,
  Heart,
  Check,
  Star,
} from "lucide-react";
import { useWild } from "../components/Context";
import { Page, Empty, Disclaimer } from "../components/UI";
import { Suitability } from "./Intelligence";
import { match, readiness, pulse } from "../services/intelligence";
export default function Detail() {
  const { id } = useParams();
  const { treks, profile, saved, toggleSave } = useWild();
  const [tab, setTab] = useState("Overview");
  const t = treks.find((x) => x.id === id);
  if (!t)
    return (
      <Page title="Trail not found.">
        <Empty title="This trail is no longer in the catalog." />
      </Page>
    );
  const risk = pulse(profile, t);
  return (
    <>
      <div
        className="detail-hero"
        style={{
          backgroundImage: `linear-gradient(0deg,#102d29e8,#102d2908),url(${t.image})`,
        }}
      >
        <div>
          <Link to="/explore" className="eyebrow light">
            EXPLORE / {t.location.toUpperCase()}
          </Link>
          <h1>{t.name}</h1>
          <p>
            <MapPin size={17} />
            {t.location} <span>★ {t.rating} · Catalog rating</span>
          </p>
          <small>{t.photo_credit && <><a href={t.photo_credit.source} target="_blank" rel="noreferrer">Photo: {t.photo_credit.author}</a> · <a href={t.photo_credit.license_url || t.photo_credit.source} target="_blank" rel="noreferrer">{t.photo_credit.license}</a></>}</small>
        </div>
      </div>
      <section className="section detail">
        <div className="detail-stats">
          {[
            [Mountain, "Difficulty", t.difficulty],
            [Clock, "Duration", `${t.days} days`],
            [Mountain, "Max altitude", `${t.altitude.toLocaleString()} m`],
            [Route, "Distance", `${t.distance} km`],
            [Calendar, "Best season", t.season],
          ].map(([Icon, l, v]) => (
            <div key={l}>
              <Icon size={20} />
              <small>{l}</small>
              <b>{v}</b>
            </div>
          ))}
        </div>
        <div className="detail-layout">
          <div>
            <div className="tabs" role="tablist">
              {["Overview", "Itinerary", "Preparation", "Reviews"].map((x) => (
                <button
                  role="tab"
                  aria-selected={tab === x}
                  key={x}
                  className={tab === x ? "active" : ""}
                  onClick={() => setTab(x)}
                >
                  {x}
                </button>
              ))}
            </div>
            {tab === "Overview" && (
              <div className="panel">
                <h2>A little closer to the wild.</h2>
                <p className="spaced">
                  {t.description} This sample route is designed for planning;
                  confirm access, permits, camps and the final itinerary with
                  your trekking operator.
                </p>
                <h3 className="spaced">Trail highlights</h3>
                <ul className="tip-list">
                  {t.highlights.map((x) => (
                    <li key={x}>
                      <Check size={16} />
                      {x}
                    </li>
                  ))}
                </ul>
                <h3>Route information</h3>
                <p>
                  {t.distance} km over {t.days} days, with a maximum altitude of{" "}
                  {t.altitude.toLocaleString()} m. Expect{" "}
                  {t.terrain.toLowerCase()} terrain and approximately{" "}
                  {t.elevation_gain.toLocaleString()} m of cumulative ascent in
                  this planning model.
                </p>
              </div>
            )}
            {tab === "Itinerary" && (
              <div className="panel">
                <h3>Your days on the trail</h3>
                <div className="timeline">
                  {(t.itinerary.length
                    ? t.itinerary
                    : [
                        {
                          day: 1,
                          title: "Confirm your route with your guide",
                          description:
                            "An operator itinerary has not been added to this trail.",
                        },
                      ]
                  ).map((d) => (
                    <div key={d.day}>
                      <span>{String(d.day).padStart(2, "0")}</span>
                      <article>
                        <h4>{d.title}</h4>
                        <p>{d.description}</p>
                      </article>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === "Preparation" && (
              <div className="panel">
                <h3>Build a steady foundation</h3>
                <p>
                  Practice regular walking, build endurance gradually, and try
                  carrying your daypack before departure. Seek qualified advice
                  if you have health concerns.
                </p>
                <h3 className="spaced">Conditions & safety</h3>
                <p>
                  Best season: {t.season}. Weather risk input:{" "}
                  {Math.round(t.weather_risk * 100)}% in the educational model.
                  No live forecast is connected.
                </p>
                <ul className="tip-list">
                  {risk.tips.map((x) => (
                    <li key={x}>
                      <Check size={16} />
                      {x}
                    </li>
                  ))}
                </ul>
                <Link to={"/packing?trek=" + t.id} className="button">
                  Build my packing list
                </Link>
              </div>
            )}
            {tab === "Reviews" && (
              <div className="panel">
                <div className="panel-title">
                  <Star />
                  <h3>Traveler reviews</h3>
                </div>
                <p>
                  The catalog rating ({t.rating}/5) is sample data. No verified
                  traveler reviews have been collected yet.
                </p>
              </div>
            )}
            <div className="spaced">
              <Suitability trek={t} />
            </div>
          </div>
          <aside>
            <div className="panel booking-card">
              <div className="eyebrow">YOUR TRAIL CONNECTION</div>
              <div className="match-large">
                <b>{match(profile, t)}%</b>
                <span>profile match</span>
              </div>
              <div className="metric">
                <span>
                  RootScore<b>{readiness(profile, t)} / 100</b>
                </span>
                <div>
                  <i style={{ width: readiness(profile, t) + "%" }} />
                </div>
              </div>
              <div className="price">
                ₹{t.price.toLocaleString()}
                <small> / person · demo estimate</small>
              </div>
              <Link className="button" to={"/planner?trek=" + t.id}>
                Plan this trek
              </Link>
              <Link className="button secondary" to={"/booking/" + t.id}>
                Book a demo adventure
              </Link>
              <button
                className="text-link inline"
                onClick={() => toggleSave(t.id)}
              >
                <Heart
                  size={17}
                  fill={saved.includes(t.id) ? "currentColor" : "none"}
                />
                {saved.includes(t.id) ? "Saved to your trails" : "Save trek"}
              </button>
              <p className="disclaimer">
                Demo Project — No Real Payment Required.
              </p>
            </div>
            <Disclaimer />
          </aside>
        </div>
      </section>
    </>
  );
}
