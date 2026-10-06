import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Mountain, CheckCircle, Calendar } from "lucide-react";
import { useWild } from "../components/Context";
import { Page, Field, ErrorBox, Empty } from "../components/UI";
import { post } from "../services/api";
export function Auth() {
  const { login, user, logout } = useWild();
  const [mode, setMode] = useState("login"),
    [values, setValues] = useState({ email: "", password: "", name: "" }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(mode, values);
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      eyebrow="WELCOME TO YOUR NEXT CHAPTER"
      title={user ? "You’re ready to explore." : "The wild is better with you."}
    >
      <div className="auth-layout">
        <div className="auth-image">
          <Mountain size={48} />
          <h2>
            Rooted in Nature.
            <br />
            <em>Guided by Intelligence.</em>
          </h2>
          <p>A little closer to your next adventure.</p>
        </div>
        {user ? (
          <div className="panel">
            <h3>Signed in as {user.name}</h3>
            <p>{user.email}</p>
            <Link className="button spaced" to="/dashboard">
              Open dashboard
            </Link>
            <button className="text-link inline" onClick={logout}>
              Sign out
            </button>
          </div>
        ) : (
          <form className="panel" onSubmit={submit}>
            <div className="tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                onClick={() => setMode("register")}
              >
                Create account
              </button>
            </div>
            <h3 className="spaced">
              {mode === "login"
                ? "Good to see you again."
                : "Make it your adventure."}
            </h3>
            {mode === "register" && (
              <Field label="Your name">
                <input
                  required
                  minLength="2"
                  maxLength="60"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) =>
                    setValues({ ...values, name: e.target.value })
                  }
                />
              </Field>
            )}
            <Field label="Email address">
              <input
                required
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) =>
                  setValues({ ...values, email: e.target.value })
                }
              />
            </Field>
            <Field label="Password">
              <input
                required
                type="password"
                minLength="8"
                maxLength="128"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={values.password}
                onChange={(e) =>
                  setValues({ ...values, password: e.target.value })
                }
              />
              <small>At least 8 characters.</small>
            </Field>
            <ErrorBox error={error} />
            <button disabled={busy} className="button spaced">
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
            <p className="disclaimer">
              Demo project. Use a unique test password.
            </p>
          </form>
        )}
      </div>
    </Page>
  );
}
export function Booking() {
  const { id } = useParams();
  const { treks, user } = useWild();
  const t = treks.find((t) => t.id === id);
  const [form, setForm] = useState({
      trek_id: id,
      date: "",
      travellers: 1,
      package: "Standard",
      contact: "",
      emergency: "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirmation, setConfirmation] = useState(null);
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const set = (k, v) => setForm({ ...form, [k]: v });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setConfirmation(await post("/bookings", form));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!t) return <Page title="Trail not found." />;
  return (
    <Page
      eyebrow="YOUR NEXT ADVENTURE"
      title={
        confirmation
          ? "A new story starts here."
          : `Plan your ${t.name} escape.`
      }
      description="Demo Project — No Real Payment Required."
    >
      {!user ? (
        <Empty
          title="Sign in to make a demo booking."
          to="/signin"
          action="Sign in"
          description="Your booking will be stored in your account."
        />
      ) : confirmation ? (
        <div className="panel confirmation">
          <CheckCircle size={60} />
          <h2>Demo booking confirmed</h2>
          <h3>{confirmation.id}</h3>
          <p>
            {t.name} · {form.date} · {form.travellers} traveler(s)
          </p>
          <p>No payment was taken and no real reservation was made.</p>
          <Link to="/dashboard" className="button spaced">
            View my bookings
          </Link>
        </div>
      ) : (
        <div className="split">
          <form className="panel" onSubmit={submit}>
            <div className="panel-title">
              <Calendar />
              <h3>Adventure details</h3>
            </div>
            <div className="form-grid">
              <Field label="Travel date">
                <input
                  required
                  type="date"
                  min={today.toISOString().slice(0, 10)}
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </Field>
              <Field label="Number of travelers">
                <input
                  required
                  type="number"
                  min="1"
                  max="20"
                  value={form.travellers}
                  onChange={(e) => set("travellers", +e.target.value)}
                />
              </Field>
              <Field label="Package">
                <select
                  value={form.package}
                  onChange={(e) => set("package", e.target.value)}
                >
                  <option>Standard</option>
                  <option>Private group</option>
                </select>
              </Field>
              <Field label="Contact email or phone">
                <input
                  required
                  minLength="5"
                  maxLength="150"
                  value={form.contact}
                  onChange={(e) => set("contact", e.target.value)}
                />
              </Field>
              <Field label="Emergency contact (name + phone)">
                <input
                  required
                  minLength="5"
                  maxLength="150"
                  value={form.emergency}
                  onChange={(e) => set("emergency", e.target.value)}
                />
              </Field>
            </div>
            <ErrorBox error={error} />
            <button disabled={busy} className="button spaced">
              {busy ? "Confirming…" : "Confirm demo booking"}
            </button>
          </form>
          <div className="panel">
            <img
              className="summary-image"
              src={t.image}
              alt="Illustrative mountain landscape"
            />
            <h3>{t.name}</h3>
            <p>
              {t.days} days · {t.difficulty} · {t.location}
            </p>
            <div className="price">
              ₹{(t.price * form.travellers).toLocaleString()}
              <small> sample group estimate</small>
            </div>
            <p>
              This college demonstration does not provide travel services,
              payments or real reservations.
            </p>
          </div>
        </div>
      )}
    </Page>
  );
}
