import { useState, useEffect, useCallback } from "react";
import {
  GetAgents,
  SaveAgent,
  CreateAgent,
  DeleteAgent,
  MergeAgents,
} from "../../wailsjs/go/main/App";
import type { Agent } from "../types";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    GetAgents()
      .then((a) => {
        setAgents(a || []);
        setError(null);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = useCallback(
    async (agent: Agent) => {
      await SaveAgent(agent);
      refetch();
    },
    [refetch]
  );

  const create = useCallback(
    async (agent: Agent) => {
      await CreateAgent(agent);
      refetch();
    },
    [refetch]
  );

  const remove = useCallback(
    async (name: string) => {
      await DeleteAgent(name);
      refetch();
    },
    [refetch]
  );

  const merge = useCallback(
    async (sourceName: string, targetName: string) => {
      await MergeAgents(sourceName, targetName);
      refetch();
    },
    [refetch]
  );

  return { agents, loading, error, refetch, save, create, remove, merge };
}
