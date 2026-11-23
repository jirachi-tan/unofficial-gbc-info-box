import { bands } from "../data/links.ts";
import { castGroupLabels, type DateEntryRaw } from "./parseDates.ts";

export function getDateDisplayTitle(entry: DateEntryRaw): string {
    return entry.type === "birthday" && entry.category === "cast" && entry.castGroup === "kuzumimizuku"
        ? entry.title.replace(/\([^)]*\)/g, "")
        : entry.title;
}

export function getBirthdayDetails(entry: DateEntryRaw) {
    if (entry.type !== "birthday" || entry.category === "other" || !entry.castGroup) return null;

    const category = entry.category;
    const bandName = castGroupLabels[entry.castGroup];
    const band = bands.find((item) => item.name === bandName);
    const member = band?.members.find((item) => item.birthdayIds[category] === entry.id);
    const isDiamondDustCast = category === "cast" && entry.castGroup === "diamond_dust";

    return {
        band: bandName,
        part: member && (category === "character" || isDiamondDustCast
            ? member.characterPart ?? member.part
            : member.part),
        partLabel: isDiamondDustCast ? "キャラのパート" : "担当パート",
        relatedName: member && (category === "character"
            ? getDateDisplayTitle({ ...entry, category: "cast", title: member.name })
            : member.role),
        relatedLabel: category === "character" ? "CV" : "担当キャラクター",
    };
}
