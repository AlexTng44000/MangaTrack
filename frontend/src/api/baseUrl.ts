function isLoopback(host: string) {
  return (
    ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(host) ||
    host.endsWith(".localhost")
  );
}

export function resolveApiBaseUrl(
  configured: string | undefined,
  origin: string,
) {
  const page = new URL(origin);
  const fallback = isLoopback(page.hostname) ? "http://localhost:3354" : "/api";
  if (!configured?.trim()) return fallback;
  try {
    const api = new URL(configured.trim(), page.origin);
    if (
      !["http:", "https:"].includes(api.protocol) ||
      api.username ||
      api.password ||
      api.search ||
      api.hash
    )
      return fallback;
    // A visitor's localhost is their own device, never the host running the tunnel.
    if (!isLoopback(page.hostname) && isLoopback(api.hostname)) return "/api";
    const normalized = api.href.replace(/\/+$/, "");
    return api.origin === page.origin
      ? api.pathname.replace(/\/+$/, "")
      : normalized;
  } catch {
    return fallback;
  }
}

export const API_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_URL,
  window.location.origin,
);
