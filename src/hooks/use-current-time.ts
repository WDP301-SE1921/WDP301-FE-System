"use client";
import { useEffect, useState } from "react";

// Keeps expiring previews and future-session controls current while a page stays open.
export function useCurrentTime() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
