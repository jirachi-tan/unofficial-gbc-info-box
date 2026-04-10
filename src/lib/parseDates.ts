export type DateEntryRaw = {
    id: string;
    title: string;
    type: "birthday" | "anniversary";
    category: "character" | "cast" | "other";
    month?: number;
    day?: number;
    startDate?: string;
};

export type DateEntry = DateEntryRaw & {
    /** Next occurrence as YYYY-MM-DD */
    nextDate: string;
    /** true when today is the anniversary/birthday */
    isToday: boolean;
    /** For anniversary type: how many years since startDate on the next occurrence */
    anniversaryYear?: number;
    /** For anniversary type: elapsed years/months/days from startDate to today */
    elapsed?: { years: number; months: number; days: number };
};

function z2(n: number): string {
    return String(n).padStart(2, "0");
}

/** Get current Tokyo date parts */
function tokyoNow(): { year: number; month: number; day: number } {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    return {
        year: Number(parts.find((p) => p.type === "year")?.value ?? 1970),
        month: Number(parts.find((p) => p.type === "month")?.value ?? 1),
        day: Number(parts.find((p) => p.type === "day")?.value ?? 1),
    };
}

function tokyoDate(): Date {
    const { year, month, day } = tokyoNow();
    return new Date(year, month - 1, day);
}

function ymd(year: number, month: number, day: number): string {
    return `${year}-${z2(month)}-${z2(day)}`;
}

/** Calculate elapsed years/months/days between two dates */
function elapsedParts(
    startYear: number,
    startMonth: number,
    startDay: number,
    endYear: number,
    endMonth: number,
    endDay: number,
): { years: number; months: number; days: number } {
    let years = endYear - startYear;
    let months = endMonth - startMonth;
    let days = endDay - startDay;

    if (days < 0) {
        months -= 1;
        const prevMonth = new Date(endYear, endMonth - 1, 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    return { years, months, days };
}

export function parseDateEntries(raw: DateEntryRaw[], todayOverride?: string): DateEntry[] {
    const tokyo = todayOverride
        ? { year: Number(todayOverride.slice(0, 4)), month: Number(todayOverride.slice(5, 7)), day: Number(todayOverride.slice(8, 10)) }
        : tokyoNow();
    const todayYmd = ymd(tokyo.year, tokyo.month, tokyo.day);

    return raw.map((entry) => {
        if (entry.type === "birthday") {
            const m = entry.month!;
            const d = entry.day!;
            const thisYear = ymd(tokyo.year, m, d);
            const nextDate = thisYear >= todayYmd ? thisYear : ymd(tokyo.year + 1, m, d);
            const isToday = thisYear === todayYmd;
            return { ...entry, nextDate, isToday };
        }

        // anniversary
        const [sy, sm, sd] = entry.startDate!.split("-").map(Number);
        const annivThisYear = ymd(tokyo.year, sm, sd);
        const isToday = annivThisYear === todayYmd;
        const nextDate = annivThisYear >= todayYmd ? annivThisYear : ymd(tokyo.year + 1, sm, sd);
        const nextYear = Number(nextDate.slice(0, 4));
        const anniversaryYear = nextYear - sy;
        const elapsed = elapsedParts(sy, sm, sd, tokyo.year, tokyo.month, tokyo.day);

        return { ...entry, nextDate, isToday, anniversaryYear, elapsed };
    });
}

/** Remaining time until a target date (Tokyo midnight). Returns null if target is today or past. */
export function countdownTo(targetYmd: string): { days: number; hours: number; minutes: number; seconds: number } | null {
    const [y, m, d] = targetYmd.split("-").map(Number);
    const target = new Date(y, m - 1, d);
    const now = tokyoDate();

    const targetMs = target.getTime();
    const todayMs = now.getTime();
    if (targetMs <= todayMs) return null;

    const diffDays = Math.floor((targetMs - todayMs) / 86400000);
    // Remaining time within the current day (JST = UTC+9)
    const dayMs = 86400000;
    const nowMs = Date.now();
    const passedToday = ((nowMs % dayMs) + 9 * 3600000) % dayMs;
    const remaining = dayMs - passedToday;

    const totalSec = Math.max(0, (diffDays - 1) * 86400 + Math.floor(remaining / 1000));
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    return { days, hours, minutes, seconds };
}

export function formatCountdown(c: { days: number; hours: number; minutes: number; seconds: number }): string {
    const parts: string[] = [];
    if (c.days > 0) parts.push(`${c.days}日`);
    parts.push(`${z2(c.hours)}時間`);
    parts.push(`${z2(c.minutes)}分`);
    parts.push(`${z2(c.seconds)}秒`);
    return parts.join(" ");
}

export function formatElapsed(e: { years: number; months: number; days: number }): string {
    const parts: string[] = [];
    if (e.years > 0) parts.push(`${e.years}年`);
    if (e.months > 0) parts.push(`${e.months}ヶ月`);
    parts.push(`${e.days}日`);
    return parts.join(" ");
}

export const categoryLabels: Record<string, string> = {
    character: "キャラクター",
    cast: "キャスト",
    other: "その他",
};

export function isDateEntryArray(value: unknown): value is DateEntryRaw[] {
    return (
        Array.isArray(value) &&
        value.every((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) return false;
            const c = item as Record<string, unknown>;
            return (
                typeof c.id === "string" &&
                typeof c.title === "string" &&
                (c.type === "birthday" || c.type === "anniversary") &&
                (c.category === "character" || c.category === "cast" || c.category === "other")
            );
        })
    );
}
