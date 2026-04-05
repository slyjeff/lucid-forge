import { useState, useEffect, useCallback } from "react";
import { GetFeatures } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import type { Feature } from "../types";

export function useFeatures() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    GetFeatures()
      .then((f) => {
        setFeatures(f || []);
        setError(null);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
    const cleanup = EventsOn("features:changed", refetch);
    return cleanup;
  }, [refetch]);

  return { features, loading, error, refetch };
}
