const base = import.meta.env.VITE_API_URL || "";
export async function api(path, options = {}) {
  const token = localStorage.getItem("wildroot-token");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${base}/api${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : "Please check your entries and try again.",
      );
    return data;
  } catch (e) {
    if (e.name === "AbortError")
      throw new Error("The server took too long. Please try again.");
    if (e instanceof TypeError)
      throw new Error(
        "We couldn’t reach the server. Please try again shortly.",
      );
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
export const post = (path, body) =>
  api(path, { method: "POST", body: JSON.stringify(body) });
