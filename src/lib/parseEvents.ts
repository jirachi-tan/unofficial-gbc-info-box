export type RawCsvRow = {
  id?: string;
  名前?: string;
  カテゴリ?: string;
  メモ?: string;
  公式リンク?: string;
  場所?: string;
  開催期間?: string;
  最終更新日時?: string;
  [key: string]: unknown;
};

export type EventItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  time?: string | null;
  endDate?: string | null;
  endTime?: string | null;
  place?: string | null;
  note?: string | null;
  officialLink?: string | null;
  periodText?: string | null;
  updatedAt?: string | null;
  isRange: boolean;
};

function z2(n: number): string {
  return String(n).padStart(2, "0");
}

function toYmd(year: number, month: number, day: number): string {
  return `${year}-${z2(month)}-${z2(day)}`;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanupPeriodText(value: string): string {
  return value.replace(/\s*\(GMT\+9\)/g, "").replace(/\s+/g, " ").trim();
}

function parseDateTimeJa(input: string): { date: string; time?: string | null } | null {
  const text = cleanupPeriodText(input);
  const match = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s+(\d{1,2}:\d{2}))?/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = match[4] ?? null;
  return {
    date: toYmd(year, month, day),
    time,
  };
}

function parsePeriod(periodTextRaw: string): Pick<EventItem, "date" | "time" | "endDate" | "endTime" | "periodText" | "isRange"> {
  const periodText = cleanupPeriodText(periodTextRaw);
  const parts = periodText.split("→").map((part) => part.trim()).filter(Boolean);

  const start = parseDateTimeJa(parts[0] ?? "");
  if (!start) {
    return {
      date: "1970-01-01",
      time: null,
      endDate: null,
      endTime: null,
      periodText,
      isRange: false,
    };
  }

  let endDate: string | null = null;
  let endTime: string | null = null;

  if (parts[1]) {
    const right = parts[1];
    const rightDateTime = parseDateTimeJa(right);
    if (rightDateTime) {
      endDate = rightDateTime.date;
      endTime = rightDateTime.time ?? null;
    } else {
      const timeOnly = right.match(/^(\d{1,2}:\d{2})$/);
      if (timeOnly) {
        endDate = start.date;
        endTime = timeOnly[1];
      }
    }
  }

  return {
    date: start.date,
    time: start.time ?? null,
    endDate,
    endTime,
    periodText,
    isRange: Boolean(endDate && (endDate !== start.date || endTime)),
  };
}

export function parseCsvRows(rows: RawCsvRow[]): EventItem[] {
  return rows
    .map((row, index) => {
      const sourceId = normalizeText(row.id);
      const title = normalizeText(row["名前"]);
      const category = normalizeText(row["カテゴリ"]) || "その他";
      const note = normalizeText(row["メモ"]) || null;
      const officialLink = normalizeText(row["公式リンク"]) || null;
      const place = normalizeText(row["場所"]) || null;
      const updatedAt = normalizeText(row["最終更新日時"]) || null;
      const period = parsePeriod(normalizeText(row["開催期間"]));

      return {
        id: sourceId || `csv-${index + 1}`,
        title,
        category,
        place,
        note,
        officialLink,
        updatedAt,
        ...period,
      } satisfies EventItem;
    })
    .filter((item) => item.title);
}

export function formatDisplayDate(input: string): string {
  const [y, m, d] = input.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${m}/${d}(${weekdays[date.getDay()]})`;
}

export function formatMonthLabel(date: Date): string {
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
}

export function formatYmd(date: Date): string {
  return `${date.getFullYear()}-${z2(date.getMonth() + 1)}-${z2(date.getDate())}`;
}

export function getTokyoTodayYmd(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function parseYmd(input: string): Date {
  const [y, m, d] = input.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isSameDate(a: string, b: string): boolean {
  return a === b;
}

export function isInRange(target: string, start: string, end?: string | null): boolean {
  if (!end) return target === start;
  return target >= start && target <= end;
}

export function getMonthMatrix(baseDate: Date): Date[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const start = new Date(year, month, 1 - startDay);

  return Array.from({ length: 42 }, (_, i) => {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    return current;
  });
}

export function getSortedEvents(events: EventItem[]): EventItem[] {
  return [...events].sort((a, b) => {
    const aKey = `${a.date} ${a.time ?? "99:99"} ${a.title}`;
    const bKey = `${b.date} ${b.time ?? "99:99"} ${b.title}`;
    return aKey.localeCompare(bKey);
  });
}

export function getFocusDate(events: EventItem[], today: string): string {
  if (events.some((event) => isInRange(today, event.date, event.endDate))) {
    return today;
  }

  const upcoming = getSortedEvents(events).find((event) => event.date >= today || (event.endDate && event.endDate >= today));
  if (upcoming) return upcoming.date;

  return events[0]?.date ?? today;
}

export function formatTimeRange(event: EventItem): string {
  if (event.time && event.endTime) return `${event.time} - ${event.endTime}`;
  if (event.time) return event.time;
  return event.isRange ? "期間開催" : "終日";
}

export function overlapsMonth(event: EventItem, monthDate: Date): boolean {
  const monthStart = formatYmd(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
  const monthEnd = formatYmd(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
  const eventEnd = event.endDate ?? event.date;
  return event.date <= monthEnd && eventEnd >= monthStart;
}
