import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useWild } from "../components/Context";
import { Page, Field, ErrorBox, Empty } from "../components/UI";
import { api, post } from "../services/api";
import { readiness, defaultProfile } from "../services/intelligence";
const blank = {
  id: "",
  name: "",
  location: "",
  difficulty: "Moderate",
  days: 4,
  altitude: 3000,
  distance: 20,
  season: "May–Jun",
  terrain: "Mountain",
  price: 10000,
  description: "",
  image: "/images/mountains.jpg",
  rating: 4.7,
  elevation_gain: 1000,
  weather_risk: 0.2,
  protected: false,
  highlights: [],
  itinerary: [],
};
export default function Admin() {
  const { user, refresh, notify } = useWild();
  const [data, setData] = useState(null),
    [tab, setTab] = useState("Overview"),
    [error, setError] = useState(""),
    [form, setForm] = useState(null),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [alert, setAlert] = useState({ title: "", description: "" }),
    [alerts, setAlerts] = useState([]),
    [deleting, setDeleting] = useState(null);
  async function load() {
    try {
      setData(await api("/admin/overview"));
      setAlerts(await api("/alerts"));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user]);
  useEffect(() => {
    if (!form && !deleting) return;
    const previous = document.activeElement;
    const modal = document.querySelector(".modal");
    const controls = () =>
      [...modal.querySelectorAll("button,input,select,textarea")].filter(
        (el) => !el.disabled,
      );
    controls()[0]?.focus();
    function key(e) {
      if (e.key === "Escape") {
        setForm(null);
        setDeleting(null);
      }
      if (e.key === "Tab") {
        const items = controls(),
          first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [!!form, !!deleting]);
  if (!user || user.role !== "admin")
    return (
      <Page title="Trail management.">
        <Empty
          title="Administrator access required."
          description="Create an admin account with the documented server environment variables."
          to="/signin"
          action="Sign in"
        />
      </Page>
    );
  async function mutation(action, message) {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
      await refresh();
      notify(message);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    const ok = await mutation(
      () =>
        editing
          ? api("/admin/treks/" + form.id, {
              method: "PUT",
              body: JSON.stringify(form),
            })
          : post("/admin/treks", form),
      "Trek catalog updated.",
    );
    if (ok) setForm(null);
  }
  const months = {};
  (data?.bookings || []).forEach((b) => {
    const month = b.date.slice(0, 7);
    months[month] = (months[month] || 0) + 1;
  });
  const categories = Object.entries(
    (data?.treks || []).reduce(
      (acc, t) => ({ ...acc, [t.terrain]: (acc[t.terrain] || 0) + 1 }),
      {},
    ),
  ).map(([name, value]) => ({ name, value }));
  const difficulties = ["Easy", "Moderate", "Challenging"].map((name) => ({
    name,
    value: data?.treks.filter((t) => t.difficulty === name).length || 0,
  }));
  const popular = Object.entries(
    (data?.bookings || []).reduce(
      (a, b) => ({ ...a, [b.trek_id]: (a[b.trek_id] || 0) + 1 }),
      {},
    ),
  ).sort((a, b) => b[1] - a[1])[0];
  const profiled =
    data?.users.filter((u) => Object.keys(JSON.parse(u.profile)).length) || [];
  const average =
    profiled.length && data?.treks.length
      ? Math.round(
          profiled.reduce(
            (sum, u) =>
              sum +
              readiness(
                { ...defaultProfile, ...JSON.parse(u.profile) },
                data.treks[0],
              ),
            0,
          ) / profiled.length,
        )
      : null;
  return (
    <Page
      eyebrow="WILDROOT TRAIL MANAGEMENT"
      title="A better-run adventure."
      description="Manage the catalog, demo bookings and operator safety alerts."
    >
      <div className="tabs">
        {["Overview", "Treks", "Users", "Bookings", "Safety alerts"].map(
          (x) => (
            <button
              key={x}
              className={tab === x ? "active" : ""}
              onClick={() => setTab(x)}
            >
              {x}
            </button>
          ),
        )}
      </div>
      <ErrorBox error={error} />
      {!data ? (
        <p className="spaced">Loading management data…</p>
      ) : (
        <>
          {tab === "Overview" && (
            <>
              <div className="stat-grid spaced">
                {[
                  ["Total treks", data.treks.length],
                  ["Users", data.users.length],
                  ["Demo bookings", data.bookings.length],
                  [
                    "Average RootScore",
                    average === null ? "—" : average + "/100",
                  ],
                ].map(([l, v]) => (
                  <div className="panel" key={l}>
                    <small>{l}</small>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
              <div className="notice spaced">
                <ShieldCheck />
                <div>
                  <b>Most popular trek</b>
                  <p>
                    {popular
                      ? data.treks.find((t) => t.id === popular[0])?.name ||
                        popular[0]
                      : "No bookings yet"}
                  </p>
                </div>
              </div>
              <p className="disclaimer">
                Average RootScore uses saved profiles against{" "}
                {data.treks[0]?.name || "the first catalog trail"}; unprofiled
                users are excluded.
              </p>
              <div className="pack-grid spaced">
                <div className="panel">
                  <h3>Bookings by travel month</h3>
                  {data.bookings.length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={Object.entries(months).map(([month, value]) => ({
                          month,
                          value,
                        }))}
                      >
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill="#789252"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="spaced">No bookings to chart yet.</p>
                  )}
                </div>
                {[
                  ["Terrain categories", categories],
                  ["Difficulty distribution", difficulties],
                ].map(([title, values]) => (
                  <div className="panel" key={title}>
                    <h3>{title}</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={values}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={45}
                          outerRadius={75}
                        >
                          {values.map((_, i) => (
                            <Cell
                              key={i}
                              fill={
                                [
                                  "#244c38",
                                  "#789252",
                                  "#bdcb9b",
                                  "#c9aa75",
                                  "#93aaa0",
                                ][i % 5]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === "Treks" && (
            <>
              <button
                className="button spaced"
                onClick={() => {
                  setForm({ ...blank });
                  setEditing(false);
                }}
              >
                <Plus size={17} />
                Add trek
              </button>
              <div className="table-wrap spaced">
                <table>
                  <thead>
                    <tr>
                      <th>Trail</th>
                      <th>Location</th>
                      <th>Difficulty</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.treks.map((t) => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td>{t.location}</td>
                        <td>{t.difficulty}</td>
                        <td>₹{t.price.toLocaleString()}</td>
                        <td className="table-actions">
                          <button
                            aria-label={"Edit " + t.name}
                            onClick={() => {
                              setForm({ ...t });
                              setEditing(true);
                            }}
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            aria-label={"Delete " + t.name}
                            onClick={() => setDeleting(t)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === "Users" && (
            <div className="table-wrap spaced">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Fitness input</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{JSON.parse(u.profile).fitness ?? "Not set"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "Bookings" &&
            (data.bookings.length ? (
              <div className="table-wrap spaced">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Trail</th>
                      <th>Date</th>
                      <th>Contact / emergency</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bookings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.id}</td>
                        <td>
                          {data.treks.find((t) => t.id === b.trek_id)?.name ||
                            b.trek_id}
                        </td>
                        <td>{b.date}</td>
                        <td>
                          {b.contact}
                          <br />
                          {b.emergency}
                        </td>
                        <td>
                          <select
                            aria-label={"Status " + b.id}
                            disabled={busy}
                            value={b.status}
                            onChange={(e) =>
                              mutation(
                                () =>
                                  api("/admin/bookings/" + b.id, {
                                    method: "PATCH",
                                    body: JSON.stringify({
                                      status: e.target.value,
                                    }),
                                  }),
                                "Booking status updated.",
                              )
                            }
                          >
                            <option>Confirmed</option>
                            <option>Cancelled</option>
                            <option>Completed</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="No demo bookings yet." />
            ))}
          {tab === "Safety alerts" && (
            <>
              <form
                className="panel spaced"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await mutation(
                      () => post("/admin/alerts", alert),
                      "Safety alert posted.",
                    )
                  )
                    setAlert({ title: "", description: "" });
                }}
              >
                <h3>Post an operator alert</h3>
                <Field label="Title">
                  <input
                    required
                    minLength="3"
                    maxLength="100"
                    value={alert.title}
                    onChange={(e) =>
                      setAlert({ ...alert, title: e.target.value })
                    }
                  />
                </Field>
                <Field label="Message">
                  <textarea
                    required
                    minLength="5"
                    maxLength="500"
                    value={alert.description}
                    onChange={(e) =>
                      setAlert({ ...alert, description: e.target.value })
                    }
                  />
                </Field>
                <button disabled={busy} className="button spaced">
                  Post alert
                </button>
              </form>
              {alerts.map((a) => (
                <div className="notice spaced" key={a.id}>
                  <div>
                    <b>{a.title}</b>
                    <p>{a.description}</p>
                  </div>
                  <button
                    disabled={busy}
                    aria-label={"Remove alert " + a.title}
                    onClick={() =>
                      mutation(
                        () =>
                          api("/admin/alerts/" + a.id, { method: "DELETE" }),
                        "Alert removed.",
                      )
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </>
          )}
        </>
      )}
      {form && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={editing ? "Edit trek" : "Add trek"}
          >
            <h2>{editing ? "Edit trail" : "Add a new trail"}</h2>
            <form onSubmit={submit}>
              <div className="form-grid">
                {[
                  ["id", "Trail ID", "text"],
                  ["name", "Name", "text"],
                  ["location", "Location", "text"],
                  ["days", "Days", "number"],
                  ["altitude", "Altitude (m)", "number"],
                  ["distance", "Distance (km)", "number"],
                  ["price", "Price (₹)", "number"],
                  ["season", "Best season", "text"],
                  ["elevation_gain", "Elevation gain (m)", "number"],
                  ["weather_risk", "Weather risk (0–1)", "number"],
                ].map(([k, l, type]) => (
                  <Field key={k} label={l}>
                    <input
                      required
                      type={type}
                      disabled={k === "id" && editing}
                      step={k === "weather_risk" ? 0.01 : 1}
                      min={type === "number" ? 0 : undefined}
                      max={k === "weather_risk" ? 1 : undefined}
                      value={form[k]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [k]:
                            type === "number"
                              ? +e.target.value
                              : e.target.value,
                        })
                      }
                    />
                  </Field>
                ))}
                <Field label="Difficulty">
                  <select
                    value={form.difficulty}
                    onChange={(e) =>
                      setForm({ ...form, difficulty: e.target.value })
                    }
                  >
                    {["Easy", "Moderate", "Challenging"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Terrain">
                  <select
                    value={form.terrain}
                    onChange={(e) =>
                      setForm({ ...form, terrain: e.target.value })
                    }
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
                <Field label="Atmospheric image">
                  <select
                    value={form.image}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                  >
                    <option value="/images/mountains.jpg">Mountains</option>
                    <option value="/images/forest.jpg">Forest</option>
                  </select>
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  required
                  minLength="10"
                  maxLength="1000"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </Field>
              <ErrorBox error={error} />
              <div className="actions spaced">
                <button disabled={busy} className="button">
                  {busy ? "Saving…" : "Save trek"}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setForm(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {deleting && (
        <div className="modal-backdrop">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm deletion"
            className="modal compact"
          >
            <h3>Delete {deleting.name}?</h3>
            <p className="spaced">
              This removes the trail and its saved references. Treks with
              bookings cannot be deleted.
            </p>
            <ErrorBox error={error} />
            <div className="actions spaced">
              <button
                disabled={busy}
                className="button danger"
                onClick={async () => {
                  if (
                    await mutation(
                      () =>
                        api("/admin/treks/" + deleting.id, {
                          method: "DELETE",
                        }),
                      "Trek deleted.",
                    )
                  )
                    setDeleting(null);
                }}
              >
                Delete trek
              </button>
              <button
                className="button secondary"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
