import { NavLink, useLocation } from "react-router-dom";
import {
  Compass,
  CalendarDays,
  Backpack,
  Activity,
  MessageCircle,
} from "lucide-react";
export default function ToolkitNav() {
  const location = useLocation();
  if (
    ![
      "/wildmatch",
      "/planner",
      "/packing",
      "/rootscore",
      "/guide",
      "/toolkit",
    ].includes(location.pathname)
  )
    return null;
  return (
    <div className="toolkit-nav-wrap">
      <div className="toolkit-nav" aria-label="AI Toolkit">
        {[
          [Compass, "Trek Matcher", "/wildmatch"],
          [CalendarDays, "Itinerary", "/planner"],
          [Backpack, "Gear", "/packing"],
          [Activity, "Fitness", "/rootscore"],
          [MessageCircle, "Guide", "/guide"],
        ].map(([Icon, label, to]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ||
              (location.pathname === "/toolkit" && to === "/wildmatch")
                ? "toolkit-tab active"
                : "toolkit-tab"
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
