import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getCalendarBirthdayEvents } from "../src/lib/calendarBirthdays.ts";
import { isDateEntryArray, parseDateEntries } from "../src/lib/parseDates.ts";

const entries = JSON.parse(await readFile(new URL("../public/data/dates.json", import.meta.url), "utf8"));
const expected = [
    ["kuzumimizuku_an_birthday", "和音(あん)さん", 2004, 1, 14],
    ["kuzumimizuku_mana_birthday", "茉那(まな)さん", 2008, 7, 26],
    ["kuzumimizuku_aina_birthday", "藍楠(あいな)さん", 2005, 2, 26],
    ["kuzumimizuku_noa_birthday", "乃逢(のあ)さん", 2006, 5, 5],
    ["kuzumimizuku_kaya_birthday", "佳哉(かや)さん", 2002, 12, 3],
];

test("birthday data retains the existing entries and full birth dates", () => {
    assert.ok(isDateEntryArray(entries));
    assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
    const members = entries.filter((entry) => entry.castGroup === "kuzumimizuku");
    assert.equal(members.length, expected.length);
    for (const [id, title, year, month, day] of expected) {
        const entry = members.find((item) => item.id === id);
        assert.deepEqual(entry, { id, title, type: "birthday", category: "cast", castGroup: "kuzumimizuku", year, month, day });
        const [parsed] = parseDateEntries([entry], `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
        assert.equal(parsed.isToday, true);
        assert.equal(parsed.fullDateText, `${year}年${month}月${day}日`);
        assert.equal(parsed.elapsed.years, 2026 - year);
        assert.equal(parsed.unpublishedDate, undefined);
        const [next] = parseDateEntries([entry], "2027-12-31");
        assert.equal(next.nextDate, `2028-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
});

test("calendar birthdays recur without duplicating matching Notion events", () => {
    const birthdays = getCalendarBirthdayEvents(entries, [], [2026, 2026, 2027]);
    assert.equal(birthdays.length, 10);
    for (const [id, title, , month, day] of expected) {
        for (const year of [2026, 2027]) {
            const event = birthdays.find((item) => item.id === `birthday-${id}-${year}`);
            assert.equal(event.date, `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
            assert.equal(event.title, `${title}誕生日`);
        }
    }
    const existing = [{ id: "notion", title: "記念日：和音さん誕生日2026", category: "記念日", date: "2026-01-14", isRange: false }];
    const deduplicated = getCalendarBirthdayEvents(entries, existing, [2026, 2027]);
    assert.equal(deduplicated.length, 9);
    assert.ok(!deduplicated.some((event) => event.id === "birthday-kuzumimizuku_an_birthday-2026"));
    assert.ok(deduplicated.some((event) => event.id === "birthday-kuzumimizuku_an_birthday-2027"));
    assert.equal(getCalendarBirthdayEvents(entries, [], [2001]).length, 0);
});
