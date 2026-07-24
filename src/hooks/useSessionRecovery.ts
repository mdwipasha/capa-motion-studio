import { useEffect } from "react";
import { writeApplicationLog } from "@/lib/desktop";

const activeSessionKey = "capa-motion.session-active";

export function useSessionRecovery(): void {
  useEffect(() => {
    localStorage.setItem(activeSessionKey, "true");
    void writeApplicationLog("application", "Session started").catch(() => undefined);
    const clean = (): void => { localStorage.removeItem(activeSessionKey); };
    window.addEventListener("pagehide", clean);
    return () => { window.removeEventListener("pagehide", clean); clean(); };
  }, []);
}
