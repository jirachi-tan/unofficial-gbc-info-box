import { parseDateEntries, type DateEntryRaw } from "./parseDates";

export type TodayAnniversaryTheme = {
    id: string;
    title: string;
    type: "birthday" | "anniversary";
    category: "character" | "cast" | "other";
    colorHex: string;
    message: string;
    todayYmd: string;
};

const themeColorById: Record<string, string> = {
    // #D90E2C
    iseri_nina_birthday: "#D90E2C",
    rina_birthday: "#D90E2C",
    togenashi_formation: "#D90E2C",
    anime_broadcast_start: "#D90E2C",

    // #84C9DC
    kawaragi_momoka_birthday: "#84C9DC",
    yuri_birthday: "#84C9DC",

    // #76BD53
    awa_subaru_birthday: "#76BD53",
    mirei_birthday: "#76BD53",

    // #E34D8D
    ebizuka_tomo_birthday: "#E34D8D",
    natsu_birthday: "#E34D8D",

    // #EEDA00
    rupa_birthday: "#EEDA00",
    shuri_birthday: "#EEDA00",
};

function getCategoryPriority(category: "character" | "cast" | "other"): number {
    if (category === "character") return 3;
    if (category === "cast") return 2;
    return 1;
}

function getTypePriority(type: "birthday" | "anniversary"): number {
    return type === "birthday" ? 2 : 1;
}

function getTokyoTodayYmd(): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());

    const year = Number(parts.find((part) => part.type === "year")?.value ?? "1970");
    const month = Number(parts.find((part) => part.type === "month")?.value ?? "1");
    const day = Number(parts.find((part) => part.type === "day")?.value ?? "1");

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMessage(title: string, type: "birthday" | "anniversary"): string {
    if (type === "birthday") {
        return `今日は${title}の誕生日です！`;
    }
    return `今日は${title}の記念日です！`;
}

export function resolveTodayAnniversaryTheme(rawEntries: DateEntryRaw[]): TodayAnniversaryTheme | null {
    const todayYmd = getTokyoTodayYmd();
    const todayEntries = parseDateEntries(rawEntries, todayYmd).filter((entry) => entry.isToday);

    if (todayEntries.length === 0) {
        return null;
    }

    const sorted = [...todayEntries].sort((a, b) => {
        const categoryDiff = getCategoryPriority(b.category) - getCategoryPriority(a.category);
        if (categoryDiff !== 0) return categoryDiff;

        const typeDiff = getTypePriority(b.type) - getTypePriority(a.type);
        if (typeDiff !== 0) return typeDiff;

        return a.id.localeCompare(b.id);
    });

    const selected = sorted.find((entry) => Boolean(themeColorById[entry.id]));
    if (!selected) return null;

    return {
        id: selected.id,
        title: selected.title,
        type: selected.type,
        category: selected.category,
        colorHex: themeColorById[selected.id],
        message: buildMessage(selected.title, selected.type),
        todayYmd,
    };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const cleaned = hex.trim().replace(/^#/, "");
    if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;

    return {
        r: Number.parseInt(cleaned.slice(0, 2), 16),
        g: Number.parseInt(cleaned.slice(2, 4), 16),
        b: Number.parseInt(cleaned.slice(4, 6), 16),
    };
}
