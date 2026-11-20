import type { DateEntryRaw } from "./parseDates";
import type { EventItem } from "./parseEvents";

export function getCalendarBirthdayEvents(
    entries: DateEntryRaw[],
    events: EventItem[],
    years: number[],
): EventItem[] {
    return entries.flatMap((entry) => {
        const isKuzumimizukuBirthday = entry.castGroup === "kuzumimizuku";
        const isBandCharacterBirthday = entry.category === "character" &&
            (entry.castGroup === "f272" || entry.castGroup === "canna_lily");
        const isDiamondDustCastBirthday = entry.category === "cast" && entry.castGroup === "diamond_dust";
        if (entry.type !== "birthday" ||
            (!isKuzumimizukuBirthday && !isBandCharacterBirthday && !isDiamondDustCastBirthday) ||
            entry.month == null || entry.day == null) return [];

        const name = entry.title.replace(/\([^)]*\)/g, "").replace(/さん$/, "");
        const normalizedName = name.replace(/\s/g, "");
        return [...new Set(years)].flatMap((year) => {
            if (entry.year != null && year < entry.year) return [];
            const date = `${year}-${String(entry.month).padStart(2, "0")}-${String(entry.day).padStart(2, "0")}`;
            const alreadyExists = events.some((event) =>
                event.date === date && event.category === "記念日" &&
                event.title.replace(/\s/g, "").includes(normalizedName) && event.title.includes("誕生日")
            );
            if (alreadyExists) return [];
            return [{
                id: `birthday-${entry.id}-${year}`,
                title: `${entry.title}誕生日`,
                category: "記念日",
                date,
                isRange: false,
            }];
        });
    });
}
