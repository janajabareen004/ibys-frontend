/**
 * Shared deterministic ordering for `progress` table rows before they are
 * positionally assigned canonical construction stage keys.
 *
 * The backend's GET /progress and GET /projects/<id>/progress return rows
 * with no ORDER BY (see ibys-backend/services/progress_service.py), so raw
 * API order is not guaranteed to match the real construction sequence. Both
 * the Project Manager and Building Company stage mappings assign canonical
 * stage keys by array index, so they MUST order rows the same deterministic
 * way first — otherwise the same underlying row can land under a different
 * stage key (and therefore show a different status/progress/date) on each
 * portal for the same project.
 *
 * Kept dependency-free (no manager/company-specific types) so any stage
 * mapping can reuse it.
 */

/** Minimal shape this helper needs from a progress row. */
export type OrderableProgressRow = {
  task_name: string | null;
  start_date: string | null;
};

// Real-world construction sequence, lower-cased. A task_name not found here
// ties at STAGE_SEQUENCE.length and falls back to start_date ordering.
const STAGE_SEQUENCE: string[] = [
  "site preparation",
  "foundation",
  "structure construction",
  "electrical installation",
  "interior finishing",
];

/** Rank of a task_name within the real construction sequence (unknown names tie last). */
export function stageSequenceRank(taskName: string | null | undefined): number {
  const i = STAGE_SEQUENCE.indexOf((taskName ?? "").trim().toLowerCase());
  return i === -1 ? STAGE_SEQUENCE.length : i;
}

function safeDateForSort(value: string | null | undefined): string {
  return value ?? "";
}

/**
 * Orders progress rows deterministically by (1) stage sequence rank, then
 * (2) start_date as a tie-breaker. Does not mutate the input array.
 */
export function orderProgressRowsForStages<T extends OrderableProgressRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const rank = stageSequenceRank(a.task_name) - stageSequenceRank(b.task_name);
    if (rank !== 0) return rank;
    return safeDateForSort(a.start_date).localeCompare(safeDateForSort(b.start_date));
  });
}
