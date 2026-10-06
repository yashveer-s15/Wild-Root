import { useState } from "react";
import { Link, NavLink, Routes, Route, useLocation } from "react-router-dom";
import {
  Mountain,
  Menu,
  X,
  ArrowUpRight,
  Compass,
  Leaf,
  Sparkles,
  ShieldCheck,
  MapPin,
  Clock,
  Star,
  Heart,
  GitCompareArrows,
  Home as HomeIcon,
  Activity,
  CalendarDays,
  LayoutDashboard,
  CircleHelp,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { WildProvider, useWild } from "./components/Context";
import { Page, Empty } from "./components/UI";
import Explore from "./pages/ExplorerV2";
import Profile from "./pages/Profile";
import { Safety } from "./pages/Intelligence";
import Detail from "./pages/Detail";
import Planner from "./pages/PlannerV2";
import { Auth, Booking } from "./pages/AuthBooking";
import Guide from "./pages/GuideV2";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import { useEffect } from "react";
import ToolkitNav from "./components/ToolkitNav";
import Logo from "./components/Logo";
import {
  SmartHome,
  Matcher,
  FitnessReadiness,
  GearAdvisor,
  TrekPopup,
  CompareDock,
  HowItWorks,
  TrekVisual,
} from "./components/AdventureTools";
export default function App() {
  return (
    <WildProvider>
      <Shell />
    </WildProvider>
  );
}
function Shell() {
  const [menu, setMenu] = useState(false);
  const { user, treks } = useWild();
  const location = useLocation();
  useEffect(() => {
    const close = (event) => { if (event.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      "WildRoot — " +
      (location.pathname === "/"
        ? "Find your trail"
        : location.pathname.split("/")[1]);
  }, [location.pathname]);
  return (
    <>
      <div className="announcement">
        <Leaf size={13} /> A little closer to the wild.{" "}
        <Link to="/explore">Explore {treks.length} Indian trails</Link>
      </div>
      <header className="nav">
        <Link to="/" className="brand">
          <Logo />
        </Link>
        <nav
          className={menu ? "nav-links open" : "nav-links"}
          aria-label="Main navigation"
          id="main-navigation"
        >
          <div className="menu-intro"><span>YOUR NEXT ADVENTURE</span><strong>Find your way into the wild.</strong></div>
          {[
            "Home",
            "Explore",
            "AI Toolkit",
            "Safety",
            "FAQ",
            "How it works",
            "AI Guide",
            "Dashboard",
          ].map((x, index) => {
            const Icon = [HomeIcon, Compass, Sparkles, ShieldCheck, CircleHelp, CalendarDays, MessageCircle, LayoutDashboard][index];
            const description = ["Back to the beginning", "Discover 30 Indian trails", "Match, plan, pack and prepare", "Prepare with confidence", "Answers to common questions", "From your first idea to trail day", "Chat with your trekking assistant", "Your saved adventures"][index];
            return (
            <NavLink
              key={x}
              to={x === "Home" ? "/" : x === "AI Toolkit" ? "/toolkit" : x === "How it works" ? "/how-it-works" : x === "AI Guide" ? "/guide" : "/" + x.toLowerCase()}
              onClick={() => setMenu(false)}
              style={{ "--menu-index": index }}
            >
              <span className="menu-link-icon"><Icon size={20} /></span>
              <span className="menu-link-label">{x}<small>{description}</small></span>
              <ArrowUpRight className="menu-link-arrow" size={18} />
            </NavLink>
            );
          })}
          <div className="menu-footnote"><Leaf size={14} /> Rooted in nature. Ready for adventure.</div>
        </nav>
        <Link className="sign-in" to={user ? "/dashboard" : "/signin"}>
          {user ? user.name.split(" ")[0] : "Sign in"}
        </Link>
        <Link className="button small" to="/explore">
          Start exploring <ArrowUpRight size={16} />
        </Link>
        <button
          className="mobile-toggle"
          aria-label="Toggle navigation"
          aria-expanded={menu}
          aria-controls="main-navigation"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <button className={"menu-backdrop" + (menu ? " visible" : "")} aria-label="Close navigation" onClick={() => setMenu(false)} tabIndex={-1} />
      <main>
        <ToolkitNav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/treks/:id" element={<Detail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wildmatch" element={<Matcher />} />
          <Route path="/toolkit" element={<Matcher />} />
          <Route path="/rootscore" element={<FitnessReadiness />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/packing" element={<GearAdvisor />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/faq" element={<HowItWorks view="faq" />} />
          <Route path="/how-it-works" element={<HowItWorks view="how" />} />
          <Route path="/signin" element={<Auth />} />
          <Route path="/booking/:id" element={<Booking />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="*"
            element={
              <Page title="You’ve wandered off the trail.">
                <Empty title="Page not found." />
              </Page>
            }
          />
        </Routes>
      </main>
      <TrekPopup />
      <CompareDock />
      <footer>
        <Link to="/" className="brand">
          <Logo compact />
        </Link>
        <span>Rooted in Nature. Guided by Intelligence.</span>
        <div className="footer-links">
          <Link to="/packing">RootPack</Link>
          <Link to="/guide">WildGuide</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/safety">Safety</Link>
          <Link to="/admin">Trail management</Link>
        </div>
      </footer>
      <Link className="guide-fab" to="/guide" aria-label="Open WildGuide">
        <MessageCircle size={20} />
        <span>Ask AI guide</span>
      </Link>
    </>
  );
}
function Home() {
  const { treks } = useWild();
  return (
    <>
      <section className="hero">
        <div className="hero-shade" />
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="eyebrow light">
            <span /> A LITTLE WILD. A LOT MORE YOU.
          </div>
          <h1>
            Find the trail
            <br />
            that <em>fits you.</em>
          </h1>
          <p>
            Beyond the ordinary. Into your element.
            <br />
            Intelligent trail recommendations for the explorer in you.
          </p>
          <div className="actions">
            <Link className="button lime" to="/profile">
              Discover your trail <ArrowUpRight size={19} />
            </Link>
            <Link className="button glass" to="/explore">
              Explore treks <Compass size={19} />
            </Link>
          </div>
          <div className="hero-proof">
            <div className="avatars">
              <span>AK</span>
              <span>MS</span>
              <span>RJ</span>
              <span>+</span>
            </div>
            <div>
              <div className="stars">★★★★★</div>
              <small>Made for the next generation of explorers</small>
            </div>
          </div>
        </motion.div>
        <div className="hero-card">
          <div className="card-label">
            <Sparkles size={15} /> YOUR ADVENTURE, DECODED
          </div>
          <div className="profile-line">
            <div>
              <small>Adventure profile</small>
              <h3>Alpine Explorer</h3>
            </div>
            <div className="mini-ring">
              84<small>RootScore</small>
            </div>
          </div>
          <div className="recommend-line">
            <Mountain />
            <div>
              <small>Your next trail</small>
              <strong>Kedarkantha</strong>
              <span>Uttarakhand · Moderate</span>
            </div>
            <b>
              92%<small>match</small>
            </b>
          </div>
          <Link to="/profile">
            Build your own profile <ArrowUpRight size={16} />
          </Link>
          <small className="sample">
            Illustrative profile · your results will vary
          </small>
        </div>
        <div className="hero-bottom">
          <span>01 — THE HIMALAYAS ARE CALLING</span>
          <span>SCROLL TO WANDER ↓</span>
          <span>27.9878° N / 86.9250° E</span>
        </div>
      </section>
      <div className="value-strip">
        <span>
          <Compass />
          Personalized to your pace
        </span>
        <span>
          <Sparkles />
          Powered by trek intelligence
        </span>
        <span>
          <ShieldCheck />
          Confidence at every altitude
        </span>
        <span>
          <Leaf />
          Leave only footprints
        </span>
      </div>
      <div className="stats-strip">
        <div>
          <b>{treks.length}</b>
          <span>INDIAN TRAILS</span>
        </div>
        <div>
          <b>6</b>
          <span>TERRAIN WORLDS</span>
        </div>
        <div>
          <b>8</b>
          <span>NEURAL INPUTS</span>
        </div>
        <div>
          <b>100%</b>
          <span>YOUR KIND OF WILD</span>
        </div>
      </div>
      <SmartHome />
      <section className="intelligence section">
        <div>
          <div className="eyebrow">NATURE MEETS INTELLIGENCE</div>
          <h2>
            Not every trail is yours.
            <br />
            <em>Let’s find the one.</em>
          </h2>
          <p>
            Your fitness, your curiosity, your comfort zone. WildRoot brings
            them together to help you make a more thoughtful choice.
          </p>
          <Link className="button" to="/profile">
            Find your Adventure DNA <Sparkles size={18} />
          </Link>
        </div>
        <div className="feature-grid">
          {[
            [
              Compass,
              "RootProfile",
              "Understand your explorer identity.",
              "/profile",
            ],
            [
              Sparkles,
              "WildMatch",
              "Find trails that fit your goals.",
              "/wildmatch",
            ],
            [
              Mountain,
              "RootScore",
              "Get a personal readiness estimate.",
              "/rootscore",
            ],
            [
              ShieldCheck,
              "TrailPulse",
              "Prepare with practical risk insights.",
              "/safety",
            ],
            [
              Leaf,
              "RootPack",
              "Pack for your route and conditions.",
              "/packing",
            ],
            [
              Compass,
              "WildGuide",
              "Get profile-aware trail guidance.",
              "/guide",
            ],
          ].map(([Icon, title, body, to]) => (
            <Link to={to} className="feature" key={title}>
              <Icon />
              <h3>
                {title}
                <sup>™</sup>
              </h3>
              <p>{body}</p>
              <ArrowUpRight size={19} />
            </Link>
          ))}
        </div>
      </section>
      <HowItWorks />
      <section className="callout">
        <Leaf />
        <div>
          <h2>
            The wild is a gift.
            <br />
            Let’s keep it that way.
          </h2>
          <p>Small groups. Reusable essentials. Respect for every ecosystem.</p>
        </div>
        <Link to="/safety" className="button lime">
          Explore responsibly <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
export function TrekCard({ trek: t, score, mode = "photo" }) {
  const { saved, toggleSave, compare, toggleCompare, setSelectedTrek } =
    useWild();
  return (
    <motion.article className="trek-card" whileHover={{ y: -4 }}>
      <div className="trek-image">
        <button
          className="card-open"
          onClick={() => setSelectedTrek(t.id)}
          aria-label={"View " + t.name}
        >
          <TrekVisual trek={t} mode={mode} />
        </button>
        <span className="difficulty">{t.difficulty}</span>
        {score && (
          <span className="match">
            <Sparkles size={13} />
            {score}% match
          </span>
        )}
        <button
          className={saved.includes(t.id) ? "card-heart saved" : "card-heart"}
          aria-label={
            saved.includes(t.id) ? "Unsave " + t.name : "Save " + t.name
          }
          aria-pressed={saved.includes(t.id)}
          onClick={() => toggleSave(t.id)}
        >
          <Heart
            size={16}
            fill={saved.includes(t.id) ? "currentColor" : "none"}
          />
        </button>
        <span className="photo-note">{t.name}</span>
      </div>
      <div className="trek-body">
        <div className="location">
          <MapPin size={13} />
          {t.location}
          <span>
            <Star size={13} />
            {t.rating}
          </span>
        </div>
        <button className="card-title" onClick={() => setSelectedTrek(t.id)}>
          <h3>
            {t.name}
            <ArrowUpRight size={19} />
          </h3>
        </button>
        <p>{t.description}</p>
        <div className="trek-meta">
          <span>
            <Clock size={14} />
            {t.days} days
          </span>
          <span>
            <Mountain size={14} />
            {t.altitude.toLocaleString()} m
          </span>
          <strong>
            ₹{t.price.toLocaleString("en-IN")}
            <small> / person</small>
          </strong>
        </div>
        <div className="card-bottom">
          <button
            aria-pressed={compare.includes(t.id)}
            onClick={() => toggleCompare(t.id)}
          >
            <GitCompareArrows size={14} />
            {compare.includes(t.id) ? "In comparison" : "Compare"}
          </button>
          <button onClick={() => setSelectedTrek(t.id)}>
            Trail brief <Sparkles size={14} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
