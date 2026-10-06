import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Sparkles,
  Heart,
  Calendar,
  Backpack,
  Settings,
  Mountain,
  LogOut,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useWild } from "../components/Context";
import { Page, Dna, Ring, Empty, ErrorBox } from "../components/UI";
import { readiness, match, explorer } from "../services/intelligence";
import { api } from "../services/api";
import { TrekCard } from "../App";
import Profile from "./Profile";
import {
  Matcher as WildMatch,
  GearAdvisor as RootPack,
} from "../components/AdventureTools";
export default function Dashboard() {
  const { user, profile, treks, saved, logout } = useWild();
  const [tab, setTab] = useState("Overview"),
    [bookings, setBookings] = useState([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    if (user) {
      setBusy(true);
      api("/bookings")
        .then(setBookings)
        .catch((e) => setError(e.message))
        .finally(() => setBusy(false));
    }
  }, [user]);
  if (!user)
    return (
      <Page title="Your adventure starts here.">
        <Empty
          title="Sign in to open your dashboard."
          to="/signin"
          action="Sign in"
          description="Keep your profile, saved trails and bookings in one place."
        />
      </Page>
    );
  const next = bookings.find((b) => b.status === "Confirmed"),
    completed = bookings.filter((b) => b.status === "Completed"),
    best = [...treks].sort((a, b) => match(profile, b) - match(profile, a))[0];
  const menus = [
    [LayoutDashboard, "Overview"],
    [User, "My Profile"],
    [Sparkles, "Adventure DNA"],
    [Heart, "Saved Treks"],
    [Calendar, "Bookings"],
    [Mountain, "AI Recommendations"],
    [Backpack, "Packing Lists"],
    [Settings, "Settings"],
  ];
  const progress = completed.map((b, i) => ({
    stage: treks.find((t) => t.id === b.trek_id)?.name || b.trek_id,
    treks: i + 1,
  }));
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="eyebrow">YOUR BASE CAMP</div>
        {menus.map(([Icon, x]) => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            <Icon size={18} />
            {x}
          </button>
        ))}
        {user.role === "admin" && (
          <Link to="/admin">
            <Settings size={18} />
            Admin dashboard
          </Link>
        )}
        <button onClick={logout}>
          <LogOut size={18} />
          Sign out
        </button>
        <div className="sidebar-note">
          <LeafMark />
          <p>
            Take the trail.
            <br />
            Leave the wild.
          </p>
        </div>
      </aside>
      <div className="dashboard-main">
        <Page
          eyebrow="YOUR PERSONAL BASE CAMP"
          title={
            tab === "Overview"
              ? `Welcome back, ${user.name.split(" ")[0]}.`
              : tab
          }
          description={
            tab === "Overview"
              ? "A new trail. A new perspective. Let’s see what’s next."
              : null
          }
        >
          <ErrorBox error={error} />
          {tab === "Overview" && (
            <>
              <div className="stat-grid">
                <div className="panel">
                  <small>RootScore</small>
                  <strong>
                    {best ? readiness(profile, best) : "—"}
                    <span>/100</span>
                  </strong>
                  <p>{best?.name || "Choose a trail"}</p>
                </div>
                <div className="panel">
                  <small>Saved treks</small>
                  <strong>{saved.length}</strong>
                  <button
                    className="text-link"
                    onClick={() => setTab("Saved Treks")}
                  >
                    Your wishlist
                  </button>
                </div>
                <div className="panel">
                  <small>Completed treks</small>
                  <strong>{completed.length}</strong>
                  <p>
                    {completed.length < 3
                      ? "Beginner"
                      : completed.length < 8
                        ? "Explorer"
                        : completed.length < 15
                          ? "Adventurer"
                          : "Mountaineer"}
                  </p>
                </div>
                <div className="panel">
                  <small>Adventure identity</small>
                  <strong className="text-stat">{explorer(profile)}</strong>
                  <button
                    className="text-link"
                    onClick={() => setTab("Adventure DNA")}
                  >
                    Explore your DNA
                  </button>
                </div>
              </div>
              <div className="split spaced">
                <div className="panel">
                  <h3>Your next trek</h3>
                  {busy ? (
                    <p>Loading bookings…</p>
                  ) : next ? (
                    <>
                      <h2 className="spaced">
                        {treks.find((t) => t.id === next.trek_id)?.name ||
                          next.trek_id}
                      </h2>
                      <p>
                        {next.date} · {next.travellers} traveler(s)
                      </p>
                      <Link
                        className="button spaced"
                        to={"/treks/" + next.trek_id}
                      >
                        View trek
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="spaced">
                        No upcoming adventure yet. A good place to start is{" "}
                        {best?.name || "the trek catalog"}.
                      </p>
                      <Link className="button spaced" to="/explore">
                        Find your next trail
                      </Link>
                    </>
                  )}
                </div>
                <div className="panel">
                  <h3>Adventure progress</h3>
                  {progress.length ? (
                    <ResponsiveContainer width="100%" height={210}>
                      <AreaChart data={progress}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Area dataKey="treks" stroke="#6e8748" fill="#d2e2af" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="spaced">
                      Your journey chart begins when a trek is marked completed.
                      Beginner → Explorer → Adventurer → Mountaineer.
                    </p>
                  )}
                </div>
              </div>
              <div className="section-heading spaced">
                <h2>Recommended for you</h2>
                <Link to="/wildmatch" className="text-link">
                  All recommendations
                </Link>
              </div>
              {best && (
                <div className="trek-grid">
                  {[...treks]
                    .sort((a, b) => match(profile, b) - match(profile, a))
                    .slice(0, 3)
                    .map((t) => (
                      <TrekCard trek={t} key={t.id} score={match(profile, t)} />
                    ))}
                </div>
              )}
            </>
          )}
          {tab === "My Profile" && <Profile />}
          {tab === "Adventure DNA" && (
            <div className="split">
              <Dna profile={profile} />
              <div className="panel">
                <h3>Your explorer identity</h3>
                <p className="spaced">
                  {explorer(profile)} reflects your self-reported terrain,
                  duration, altitude and adventure preferences. It is a
                  descriptive identity rather than a psychological or health
                  assessment.
                </p>
                <button
                  className="button spaced"
                  onClick={() => setTab("My Profile")}
                >
                  Refine my profile
                </button>
              </div>
            </div>
          )}
          {tab === "Saved Treks" &&
            (saved.length ? (
              <div className="trek-grid">
                {treks
                  .filter((t) => saved.includes(t.id))
                  .map((t) => (
                    <TrekCard trek={t} key={t.id} score={match(profile, t)} />
                  ))}
              </div>
            ) : (
              <Empty
                title="A wishlist waiting to happen."
                description="Save a trek from its detail page to find it here."
              />
            ))}
          {tab === "Bookings" &&
            (busy ? (
              <p>Loading your bookings…</p>
            ) : bookings.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Trail</th>
                      <th>Date</th>
                      <th>Travelers</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.id}</td>
                        <td>
                          <Link to={"/treks/" + b.trek_id}>
                            {treks.find((t) => t.id === b.trek_id)?.name ||
                              b.trek_id}
                          </Link>
                        </td>
                        <td>{b.date}</td>
                        <td>{b.travellers}</td>
                        <td>{b.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="disclaimer">
                  Demo bookings only. No payment or real reservation.
                </p>
              </div>
            ) : (
              <Empty title="No bookings yet." />
            ))}
          {tab === "AI Recommendations" && <WildMatch />}
          {tab === "Packing Lists" && <RootPack />}
          {tab === "Settings" && (
            <div className="panel">
              <h3>Account details</h3>
              <p className="spaced">
                {user.name} · {user.email}
              </p>
              <p>
                Role: {user.role}. Your session expires after 24 hours. Change
                your adventure preferences in My Profile.
              </p>
              <button className="button spaced" onClick={logout}>
                Sign out
              </button>
            </div>
          )}
        </Page>
      </div>
    </div>
  );
}
function LeafMark() {
  return <Mountain size={30} />;
}
