import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!featureId || stepOrder === undefined || !filePath) {
      setDiff(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    GetDiff(featureId, stepOrder, filePath)
      .then((d) => {
        if (!cancelled) {
          setDiff(d);
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

  return { diff, loading, error };
}
