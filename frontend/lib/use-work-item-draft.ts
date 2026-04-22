"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  /** Pathname senza query (es. `/new-listing`) per `router.replace` dopo creazione bozza. */
  basePath?: string;
};

export function useWorkItemDraft({
  workflowType,
  fallbackTitle,
  basePath = "/new-listing",
}: UseWorkItemDraftOptions) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("workItemId");

  const [createdId, setCreatedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const workItemId = idFromUrl ?? createdId;

  useEffect(() => {
    if (idFromUrl) return;
    if (createdId) return;

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const created = await createWorkItem({
        title: fallbackTitle,
        workflow_type: workflowType,
        status: "draft",
        input_data: {},
        keyword_data: {},
        generated_output: {},
      });
      if (cancelled) {
        setLoading(false);
        return;
      }
      const id = created?.id ?? null;
      if (id) {
        setCreatedId(id);
        routerRef.current.replace(`${basePath}?workItemId=${encodeURIComponent(id)}`);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [idFromUrl, createdId, fallbackTitle, workflowType, basePath]);

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
