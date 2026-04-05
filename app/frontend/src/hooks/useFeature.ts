import { useState, useEffect, useRef } from "react";
import {
  GetFeature,
  GetDiscovery,
  GetUxDesign,
  GetPlan,
  GetMockups,
  GetReview,
} from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";
import type { Feature, Review } from "../types";

export interface FeatureDetail {
  feature: Feature;
  discovery: string;
  uxDesign: string;
  plan: string;
  mockups: string[];
  review: Review | null;
}

export function useFeature(id: string | undefined) {
  const [detail, setDetail] = useState<FeatureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      // Only show loading spinner on first load, not refetches
      if (!hasLoaded.current) {
        setLoading(true);
      }
      try {
        const [feature, discovery, uxDesign, plan, mockups, review] =
          await Promise.all([
            GetFeature(id!),
            GetDiscovery(id!),
            GetUxDesign(id!),
            GetPlan(id!),
            GetMockups(id!),
            GetReview(id!),
          ]);
        if (!cancelled) {
          setDetail({
            feature,
            discovery,
            uxDesign,
            plan,
            mockups: mockups || [],
            review,
          });
          setError(null);
          hasLoaded.current = true;
        }
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const cleanup = EventsOn("features:changed", load);
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [id]);

  return { detail, loading, error };
}
