"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createWorkItem,
  getWorkItem,
  updateWorkItem,
  type WorkItem,
  type WorkItemStatus,
  type WorkflowType,
} from "@/lib/work-items";

type UseWorkItemDraftOptions = {
  workflowType: WorkflowType;
  fallbackTitle: string;
};

export function useWorkItemDraft({ workflowType, fallbackTitle }: UseWorkItemDraftOptions) {
  const [workItemId, setWorkItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = new URLSearchParams(window.location.search).get("workItemId");
    if (value) setWorkItemId(value);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function ensureItem() {
      if (workItemId) return;
      setLoading(true);
      const created = await createWorkItem({
        title: fallbackTitle,
        workflow_type: workflowType,
        status: "draft",
        input_data: {},
        keyword_data: {},
        generated_output: {},
      });
      if (!cancelled) {
        setWorkItemId(created?.id ?? null);
        setLoading(false);
      }
    }
    void ensureItem();
    return () => {
      cancelled = true;
    };
  }, [fallbackTitle, workflowType, workItemId]);

  const save = useCallback(
    async ({
      title,
      summary,
      sourceUrl,
      competitorUrl,
      inputData,
      keywordData,
      generatedOutput,
      status,
    }: {
      title?: string;
      summary?: string | null;
      sourceUrl?: string | null;
      competitorUrl?: string | null;
      inputData?: Record<string, unknown>;
      keywordData?: Record<string, unknown>;
      generatedOutput?: Record<string, unknown>;
      status?: WorkItemStatus;
    }) => {
      if (!workItemId) return null;
      return updateWorkItem(workItemId, {
        title: title || fallbackTitle,
        workflow_type: workflowType,
        status,
        summary,
        source_url: sourceUrl,
        competitor_url: competitorUrl,
        input_data: inputData,
        keyword_data: keywordData,
        generated_output: generatedOutput,
      });
    },
    [fallbackTitle, workflowType, workItemId],
  );

  const load = useCallback(async (): Promise<WorkItem | null> => {
    if (!workItemId) return null;
    return getWorkItem(workItemId);
  }, [workItemId]);

  const isReady = useMemo(() => Boolean(workItemId) && !loading, [workItemId, loading]);

  return { workItemId, isReady, loading, save, load };
}

