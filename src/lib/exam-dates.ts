/**
 * Exam calendar data: upcoming SAT, IB, and Cambridge IGCSE sessions.
 *
 * Dates are sourced from the official boards (links in `source`).
 * `confirmed: false` means the board has published a provisional window
 * that is still subject to confirmation.
 *
 * Last verified: 2026-09-05.
 */

export type ExamBoard = "SAT" | "IB" | "IGCSE";

export interface ExamEvent {
  id: string;
  board: ExamBoard;
  /** Session label, e.g. "August 2026 (International)" */
  session: string;
  /** ISO date the exams start (single-day exams: same as examEnd). */
  examStart: string;
  /** ISO date the exams end. */
  examEnd: string;
  /** ISO date results release, or a human-readable expectation. */
  results: string;
  /** True when results date is an estimate based on board guidance. */
  resultsEstimated?: boolean;
  confirmed: boolean;
  /**
   * True once a maintainer has confirmed this session has fully passed and
   * is being kept only as a historical record. `exam-dates.test.ts` fails
   * for any event whose results/exam-end date is in the past and isn't
   * marked `archived`, so aging entries can't go stale silently.
   */
  archived?: boolean;
  notes?: string;
  source: { label: string; url: string };
}

export const EXAM_EVENTS: ExamEvent[] = [
  // ---- SAT: next 4 international administrations ----
  {
    id: "sat-2026-08",
    board: "SAT",
    session: "August 2026",
    examStart: "2026-08-22",
    examEnd: "2026-08-22",
    results: "2026-09-04",
    confirmed: true,
    archived: true,
    source: {
      label: "College Board: SAT dates and deadlines",
      url: "https://satsuite.collegeboard.org/sat/dates-deadlines",
    },
  },
  {
    id: "sat-2026-09",
    board: "SAT",
    session: "September 2026",
    examStart: "2026-09-12",
    examEnd: "2026-09-12",
    results: "2026-09-25",
    confirmed: true,
    source: {
      label: "College Board: SAT dates and deadlines",
      url: "https://satsuite.collegeboard.org/sat/dates-deadlines",
    },
  },
  {
    id: "sat-2026-10",
    board: "SAT",
    session: "October 2026",
    examStart: "2026-10-03",
    examEnd: "2026-10-03",
    results: "2026-10-16",
    confirmed: true,
    source: {
      label: "College Board: SAT dates and deadlines",
      url: "https://satsuite.collegeboard.org/sat/dates-deadlines",
    },
  },
  {
    id: "sat-2026-11",
    board: "SAT",
    session: "November 2026",
    examStart: "2026-11-07",
    examEnd: "2026-11-07",
    results: "2026-11-20",
    confirmed: true,
    notes: "Register early: international centre seats fill fast.",
    source: {
      label: "College Board: SAT dates and deadlines",
      url: "https://satsuite.collegeboard.org/sat/dates-deadlines",
    },
  },

  // ---- IB Diploma Programme ----
  {
    id: "ib-2026-11",
    board: "IB",
    session: "November 2026 session",
    examStart: "2026-10-26",
    examEnd: "2026-11-13",
    results: "Early January 2027",
    resultsEstimated: true,
    confirmed: false,
    notes: "Window subject to IB confirmation. Results historically release in the first week of January.",
    source: {
      label: "IBO: Diploma exam schedule",
      url: "https://ibo.org/programmes/diploma-programme/assessment-and-exams/exam-schedule/",
    },
  },
  {
    id: "ib-2027-05",
    board: "IB",
    session: "May 2027 session",
    examStart: "2027-04-23",
    examEnd: "2027-05-19",
    results: "Early July 2027",
    resultsEstimated: true,
    confirmed: false,
    notes: "No exams on 1 May. Schedule subject to IB confirmation. Results historically release around 6 July.",
    source: {
      label: "IBO: Diploma exam schedule",
      url: "https://ibo.org/programmes/diploma-programme/assessment-and-exams/exam-schedule/",
    },
  },

  // ---- Cambridge IGCSE ----
  {
    id: "igcse-2026-06",
    board: "IGCSE",
    session: "June 2026 series",
    examStart: "2026-04-24",
    examEnd: "2026-06-09",
    results: "2026-08-18",
    confirmed: true,
    archived: true,
    notes: "Results released 2026-08-18. Certificates ship by end of October 2026.",
    source: {
      label: "Cambridge International: June 2026 results",
      url: "https://help.cambridgeinternational.org/hc/en-gb/articles/29567611785234-When-will-June-2026-results-be-released",
    },
  },
  {
    id: "igcse-2026-11",
    board: "IGCSE",
    session: "October/November 2026 series",
    examStart: "2026-10-01",
    examEnd: "2026-11-30",
    results: "Mid-January 2027",
    resultsEstimated: true,
    confirmed: false,
    notes: "Exact paper dates publish in the official timetable. Certificates ship by end of March 2027.",
    source: {
      label: "Cambridge International: exam series and results",
      url: "https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-upper-secondary/cambridge-igcse/",
    },
  },
];

export const BOARD_LABELS: Record<ExamBoard, string> = {
  SAT: "SAT (College Board)",
  IB: "IB Diploma (IBO)",
  IGCSE: "Cambridge IGCSE",
};

export function eventsByBoard(board: ExamBoard): ExamEvent[] {
  return EXAM_EVENTS.filter((event) => event.board === board);
}

/** First event (by exam start) that hasn't finished yet, relative to `now`. */
export function nextUpcomingEvent(now: Date): ExamEvent | undefined {
  return [...EXAM_EVENTS]
    .sort((a, b) => a.examStart.localeCompare(b.examStart))
    .find((event) => new Date(event.examEnd + "T23:59:59") >= now);
}
