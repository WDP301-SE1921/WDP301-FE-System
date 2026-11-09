"use client";

import { useEffect, useState } from "react";
import { todayInVietnam } from "@/lib/calendar-date";

/** Refresh date-dependent labels at midnight, including after a suspended tab resumes. */
export function useVietnamDate() {
  const [date, setDate] = useState(() => todayInVietnam());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      const today = todayInVietnam();
      setDate(today);
      clearTimeout(timer);
      const tomorrow = Date.parse(`${today}T00:00:00+07:00`) + 86400000;
      timer = setTimeout(update, Math.max(1, tomorrow - Date.now()));
    };
    const visible = () => { if (document.visibilityState === "visible") update(); };
    timer = setTimeout(update, Math.max(1, Date.parse(`${todayInVietnam()}T00:00:00+07:00`) + 86400000 - Date.now()));
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return date;
}
