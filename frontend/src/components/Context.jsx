import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import fallback from "../data/treks.json";
import { api, post } from "../services/api";
import { defaultProfile } from "../services/intelligence";
import { compareSelection } from "../services/adventure";
const Context = createContext();
export const useWild = () => useContext(Context);
export function WildProvider({ children }) {
  const [treks, setTreks] = useState(fallback),
    [offline, setOffline] = useState(false),
    [user, setUser] = useState(null),
    [profile, setProfile] = useState(() => {
      try {
        return {
          ...defaultProfile,
          ...JSON.parse(localStorage.getItem("wildroot-profile") || "{}"),
        };
      } catch {
        return defaultProfile;
      }
    }),
    [saved, setSaved] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("wildroot-favourites") || "[]");
      } catch {
        return [];
      }
    }),
    [compare, setCompare] = useState([]),
    [selectedTrek, setSelectedTrek] = useState(null),
    [toast, setToast] = useState("");
  useEffect(() => {
    localStorage.setItem("wildroot-favourites", JSON.stringify(saved));
  }, [saved]);
  const notify = useCallback((message) => setToast(message), []);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(id);
    }
  }, [toast]);
  const refresh = useCallback(async () => {
    try {
      setTreks(await api("/treks"));
      setOffline(false);
    } catch {
      setOffline(true);
    }
  }, []);
  useEffect(() => {
    refresh();
    if (localStorage.getItem("wildroot-token"))
      api("/auth/me")
        .then(async (u) => {
          setUser(u);
          const accountSaved = await api("/saved");
          setSaved((old) => [...new Set([...old, ...accountSaved])]);
          const p = await api("/profile");
          if (Object.keys(p).length) setProfile({ ...defaultProfile, ...p });
        })
        .catch(() => localStorage.removeItem("wildroot-token"));
  }, [refresh]);
  async function login(mode, values) {
    const result = await post(
      "/auth/" + mode,
      mode === "login"
        ? { email: values.email, password: values.password }
        : values,
    );
    localStorage.setItem("wildroot-token", result.token);
    setUser(result.user);
    const accountSaved = await api("/saved");
    setSaved((old) => [...new Set([...old, ...accountSaved])]);
    const p = await api("/profile");
    setProfile({ ...defaultProfile, ...p });
  }
  async function logout() {
    try {
      await post("/auth/logout", {});
    } catch {}
    localStorage.removeItem("wildroot-token");
    setUser(null);

    setProfile(defaultProfile);
    localStorage.removeItem("wildroot-profile");
  }
  async function updateProfile(p) {
    if (user) await api("/profile", { method: "PUT", body: JSON.stringify(p) });
    setProfile(p);
    localStorage.setItem("wildroot-profile", JSON.stringify(p));
    notify(
      user
        ? "Profile saved to your account."
        : "Profile saved on this device. Sign in to sync it.",
    );
  }
  async function toggleSave(id) {
    const wasSaved = saved.includes(id);
    setSaved((old) => (wasSaved ? old.filter((x) => x !== id) : [...old, id]));
    notify(
      wasSaved
        ? "Removed from your device favorites."
        : "Trail saved on this device.",
    );
    if (user) {
      try {
        const accountSaved = await api("/saved");
        if (accountSaved.includes(id) !== !wasSaved)
          await post("/saved/" + id, {});
      } catch {
        notify("Saved on this device. Account sync is unavailable.");
      }
    }
  }
  function toggleCompare(id) {
    if (compare.length >= 3 && !compare.includes(id))
      notify("Compare up to 3 trails. Remove one to add another.");
    setCompare((old) => compareSelection(old, id));
  }
  const clearCompare = () => setCompare([]);
  return (
    <Context.Provider
      value={{
        treks,
        offline,
        user,
        profile,
        saved,
        notify,
        login,
        logout,
        updateProfile,
        toggleSave,
        refresh,
        compare,
        toggleCompare,
        clearCompare,
        selectedTrek,
        setSelectedTrek,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button aria-label="Dismiss message" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
