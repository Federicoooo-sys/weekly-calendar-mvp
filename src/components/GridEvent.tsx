import { getStrings } from "@/constants/strings";
import { categoryConfig, CATEGORY_LABEL_KEYS } from "@/constants/categories";
import { formatTimeRange, parseTime } from "@/lib/dates";
import type { CalendarEvent } from "@/types";

/** Height in px of each 15-minute slot */
const SLOT_HEIGHT = 16;

interface GridEventProps {
  event: CalendarEvent;
  startHour: number;
  /** Number of overlapping events in this group (1 = no overlap) */
  columnCount: number;
  /** This event's column index within the overlap group (0-based) */
  columnIndex: number;
  /** Called when the event is clicked */
  onClick?: (event: CalendarEvent) => void;
  /** Called when the status toggle circle is clicked */
  onStatusToggle?: (event: CalendarEvent) => void;
}

/**
 * Calculates top offset and height for a timed event within the time grid.
 */
function getEventPosition(event: CalendarEvent, startHour: number) {
  if (!event.startTime) return null;

  const startParsed = parseTime(event.startTime);
  if (!startParsed) return null;

  const [sh, sm] = startParsed;
  const startMinutes = (sh - startHour) * 60 + sm;
  const top = (startMinutes / 15) * SLOT_HEIGHT;

  let height = SLOT_HEIGHT * 2; // default: 30 min
  if (event.endTime) {
    const endParsed = parseTime(event.endTime);
    if (endParsed) {
      const endMinutes = (endParsed[0] - startHour) * 60 + endParsed[1];
      const diff = endMinutes - startMinutes;
      height = Math.max((diff / 15) * SLOT_HEIGHT, SLOT_HEIGHT);
    }
  }

  return { top, height };
}

export default function GridEvent({ event, startHour, columnCount, columnIndex, onClick, onStatusToggle }: GridEventProps) {
  const strings = getStrings();
  const pos = getEventPosition(event, startHour);
  if (!pos) return null;

  const isCompleted = event.status === "completed";
  const isSkipped = event.status === "skipped";
  const isDimmed = isCompleted || isSkipped;
  const isCompact = pos.height <= SLOT_HEIGHT * 2;
  const isTall = pos.height >= SLOT_HEIGHT * 4;

  // Horizontal positioning for overlaps
  const widthPercent = columnCount > 1 ? 100 / columnCount : 100;
  const leftPercent = columnCount > 1 ? columnIndex * widthPercent : 0;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick?.(event); }}
      className="absolute rounded-md px-1.5 py-0.5 overflow-hidden cursor-pointer transition-opacity hover:opacity-100"
      style={{
        top: `${pos.top}px`,
        height: `${pos.height}px`,
        left: columnCount > 1 ? `${leftPercent}%` : "2px",
        width: columnCount > 1 ? `calc(${widthPercent}% - 3px)` : "calc(100% - 4px)",
        background: categoryConfig[event.category].colorVar,
        opacity: isDimmed ? 0.5 : 0.85,
        zIndex: 10 + columnIndex,
        border: event.isInvited ? "2px dashed var(--color-bg-primary)" : "none",
      }}
    >
      <span
        className={`text-[11px] font-medium leading-snug block truncate ${isDimmed ? "line-through" : ""}`}
        style={{ color: "var(--color-bg-primary)" }}
      >
        {event.title}
      </span>
      {!isCompact && event.startTime && (
        <span
          className="text-[10px] leading-tight block truncate"
          style={{ color: "var(--color-bg-primary)", opacity: 0.8 }}
        >
          {formatTimeRange(event.startTime, event.endTime)}
        </span>
      )}
      {isTall && (
        <span
          className="text-[9px] leading-tight block truncate mt-0.5"
          style={{ color: "var(--color-bg-primary)", opacity: 0.65 }}
        >
          {strings[CATEGORY_LABEL_KEYS[event.category]]}
        </span>
      )}
      {isTall && event.note && (
        <span
          className="text-[9px] leading-tight block truncate mt-0.5"
          style={{ color: "var(--color-bg-primary)", opacity: 0.5 }}
        >
          {event.note}
        </span>
      )}
    </div>
  );
}

// ─── Overlap layout logic ───

interface LayoutedEvent {
  event: CalendarEvent;
  columnCount: number;
  columnIndex: number;
}

/**
 * Takes a list of timed events for a single day and computes overlap groups.
 * Returns events annotated with columnCount and columnIndex for side-by-side rendering.
 */
export function layoutEvents(events: CalendarEvent[], startHour: number): LayoutedEvent[] {
  if (events.length === 0) return [];

  // Sort by start time, then by duration (longer first)
  const sorted = [...events].sort((a, b) => {
    const cmp = a.startTime!.localeCompare(b.startTime!);
    if (cmp !== 0) return cmp;
    // Longer events first so they get column 0
    const aDur = getEndMinutes(a, startHour) - getStartMinutes(a, startHour);
    const bDur = getEndMinutes(b, startHour) - getStartMinutes(b, startHour);
    return bDur - aDur;
  });

  // Greedy column assignment
  const columns: { endMinute: number }[] = [];
  const assignments: { event: CalendarEvent; col: number }[] = [];

  for (const event of sorted) {
    const start = getStartMinutes(event, startHour);
    const end = getEndMinutes(event, startHour);

    // Find first column where the event fits (no overlap)
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      if (columns[c].endMinute <= start) {
        columns[c].endMinute = end;
        assignments.push({ event, col: c });
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push({ endMinute: end });
      assignments.push({ event, col: columns.length - 1 });
    }
  }

  // Now figure out the max columns for each overlap cluster
  // For simplicity: use total column count for all events in the day
  // This is the 80/20 approach — works well for typical weekly planner usage
  const totalColumns = columns.length;

  return assignments.map(({ event, col }) => ({
    event,
    columnCount: totalColumns,
    columnIndex: col,
  }));
}

function getStartMinutes(event: CalendarEvent, startHour: number): number {
  const parsed = parseTime(event.startTime!);
  if (!parsed) return 0;
  return (parsed[0] - startHour) * 60 + parsed[1];
}

function getEndMinutes(event: CalendarEvent, startHour: number): number {
  if (event.endTime) {
    const parsed = parseTime(event.endTime);
    if (parsed) return (parsed[0] - startHour) * 60 + parsed[1];
  }
  // Default 30 min duration for events without end time
  return getStartMinutes(event, startHour) + 30;
}

export { SLOT_HEIGHT };
