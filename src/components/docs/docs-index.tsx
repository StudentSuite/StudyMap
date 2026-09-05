"use client";

import { useViewMode, ViewToggle } from "@/components/competitions/view-toggle";
import { DocsIndexGrid } from "@/components/docs/docs-index-grid";
import { DocsIndexList } from "@/components/docs/docs-index-list";

const STORAGE_KEY = "studymap:docs-view";

/**
 * The /docs index body: a list/grid toggle (see #202's ViewToggle, reused
 * as-is) over the same grouped entries. Always renders "list" on the
 * server and first paint, then syncs from localStorage in an effect (see
 * useViewMode), so there's no hydration mismatch and no error when storage
 * is unavailable - just the list default either way.
 */
export function DocsIndex() {
  const [mode, setMode] = useViewMode(STORAGE_KEY);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <ViewToggle value={mode} onChange={setMode} />
      </div>
      {mode === "grid" ? <DocsIndexGrid /> : <DocsIndexList />}
    </div>
  );
}
