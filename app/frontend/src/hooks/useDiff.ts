import { useState, useEffect, useRef } from "react";
import { GetDiff } from "../../wailsjs/go/main/App";
import type { FileDiff } from "../types";

export function useDiff(
  featureId: string | undefined,
  stepOrder: number | undefined,
  filePath: string | undefined
) {
  const [diff, setDiff] = useState<FileDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevDiff = useRef<FileDiff | null>(null);

  useEffect(() => {
    if (!featureId || stepOrder === undefined || !filePath) {
      setDiff(null);
      prevDiff.current = null;
      return;
    }

    let cancelled = false;
    setLoading(true);
    // Keep previous diff visible while loading

    GetDiff(featureId, stepOrder, filePath)
      .then((d) => {
        if (!cancelled) {
          setDiff(d);
          prevDiff.current = d;
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [featureId, stepOrder, filePath]);

  // Return previous diff while loading so Monaco stays mounted
  return { diff: diff ?? prevDiff.current, loading, error };
}
