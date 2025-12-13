import { useEffect, useRef, useState } from "react";

type VersionPayload = {
  version: string;
  builtAt?: string;
};

async function fetchVersion(): Promise<VersionPayload | null> {
  try {
    // cache-bust so we don’t get a stale response even if something upstream caches it
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as VersionPayload;
  } catch {
    return null;
  }
}

export function useBuildVersion(pollMs: number = 60_000) {
  const [current, setCurrent] = useState<VersionPayload | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const initialVersionRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const tick = async () => {
      const v = await fetchVersion();
      if (!mounted || !v?.version) return;

      // First successful read becomes our baseline
      if (!initialVersionRef.current) {
        initialVersionRef.current = v.version;
        setCurrent(v);
        return;
      }

      // If version changes, prompt refresh
      if (v.version !== initialVersionRef.current) {
        setCurrent(v);
        setUpdateAvailable(true);
      }
    };

    // initial + polling
    tick();
    const timer = window.setInterval(tick, pollMs);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [pollMs]);

  return { current, updateAvailable };
}
