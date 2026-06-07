import type { Board, Resource, ResourceKind } from "@/lib/types";

import ib from "../../data/resources/ib.json";
import igcse from "../../data/resources/igcse.json";
import neet from "../../data/resources/neet.json";
import jee from "../../data/resources/jee.json";
import upsc from "../../data/resources/upsc.json";
import sat from "../../data/resources/sat.json";

const ALL: Resource[] = [
  ...(ib as Resource[]),
  ...(igcse as Resource[]),
  ...(neet as Resource[]),
  ...(jee as Resource[]),
  ...(upsc as Resource[]),
  ...(sat as Resource[]),
];

/** All catalogue resources, merged from the per-board JSON files. */
export function getResources(): Resource[] {
  return ALL;
}

export function filterResources(
  resources: Resource[],
  opts: { boards?: Board[]; subject?: string; year?: number; kinds?: ResourceKind[] },
): Resource[] {
  return resources.filter((resource) => {
    if (opts.boards && opts.boards.length > 0 && !opts.boards.includes(resource.board)) {
      return false;
    }
    if (opts.kinds && opts.kinds.length > 0 && !opts.kinds.includes(resource.kind)) {
      return false;
    }
    if (opts.year && resource.year !== opts.year) {
      return false;
    }
    if (
      opts.subject &&
      !(resource.subject ?? "").toLowerCase().includes(opts.subject.toLowerCase())
    ) {
      return false;
    }
    return true;
  });
}

/** Distinct years present in the dataset, newest first. */
export function resourceYears(resources: Resource[]): number[] {
  const years = new Set<number>();
  for (const resource of resources) {
    if (typeof resource.year === "number") years.add(resource.year);
  }
  return [...years].sort((a, b) => b - a);
}
