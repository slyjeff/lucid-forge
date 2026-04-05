import { useState, useEffect } from "react";
import { GetSteps } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import type { Step } from "../types";

export function useSteps(featureId: string | undefined) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!featureId) return;

    let cancelled = false;

    function load() {
      setLoading(true);
      GetSteps(featureId!)
        .then((s) => {
          if (!cancelled) {
            setSteps(s || []);
            setError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) setError(String(err));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    load();
    const cleanup = EventsOn("features:changed", load);
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [featureId]);

  return { steps, loading, error };
}
