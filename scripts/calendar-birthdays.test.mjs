import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getCalendarBirthdayEvents } from "../src/lib/calendarBirthdays.ts";
import { isDateEntryArray, parseDateEntries } from "../src/lib/parseDates.ts";
import { getBirthdayDetails, getDateDisplayTitle } from "../src/lib/birthdayDetails.ts";
import { bands } from "../src/data/links.ts";

const entries = JSON.parse(await readFile(new URL("../public/data/dates.json", import.meta.url), "utf8"));
const expected = [
    ["kuzumimizuku_an_birthday", "和音(あん)さん", 2004, 1, 14],
    ["kuzumimizuku_mana_birthday", "茉那(まな)さん", 2008, 7, 26],
    ["kuzumimizuku_aina_birthday", "藍楠(あいな)さん", 2005, 2, 26],
    ["kuzumimizuku_noa_birthday", "乃逢(のあ)さん", 2006, 5, 5],
    ["kuzumimizuku_kaya_birthday", "佳哉(かや)さん", 2002, 12, 3],
];
const expectedDiamondDustCast = [
    ["diamond_dust_reina_kondo_birthday", "近藤 玲奈さん", 1999, 1, 28, 1999],
    ["diamond_dust_misato_matsuoka_birthday", "松岡 美里さん", 2001, 3, 23, 2001],
    ["diamond_dust_yuuki_urushiyama_birthday", "漆山 ゆうきさん", undefined, 11, 24],
    ["diamond_dust_momoko_miyashiro_birthday", "宮白 桃子さん", undefined, 5, 9],
];
const expectedCharacters = [
    ["kuzumimizuku_karuta_birthday", "乙津 歌留多", 1, 8],
    ["kuzumimizuku_suuha_birthday", "飯豊 澄羽", 8, 4],
    ["kuzumimizuku_wakaba_birthday", "若堀 若葉", 11, 23],
    ["kuzumimizuku_kazekaoru_birthday", "卯木 風薫", 10, 10],
    ["kuzumimizuku_shino_birthday", "八峰 志乃", 2, 5],
];
const expectedF272Characters = [
    ["f272_nakamura_yu_birthday", "中村 有", 6, 11],
    ["f272_udagawa_koto_birthday", "宇田川 琴", 12, 1],
    ["f272_kuromiya_hazuki_birthday", "黒宮 八月", 8, 31],
    ["f272_asai_momono_birthday", "浅井 萌々乃", 4, 16],
    ["f272_kato_sayori_birthday", "加藤 嗄生", 10, 4],
];
const expectedCannaLilyCharacters = [
    ["canna_lily_shion_birthday", "榊原 紫苑", 11, 11],
    ["canna_lily_rindo_birthday", "千ヶ崎 竜胆", 7, 22],
    ["canna_lily_ayame_birthday", "星 亜矢芽", 5, 5],
    ["canna_lily_kaede_birthday", "橘田 楓", 9, 6],
    ["canna_lily_nazuna_birthday", "雪志摩 ナズナ", 1, 25],
];
const existingBandCharacters = [
    ["iseri_nina_birthday", "togenashi_togeari"],
    ["kawaragi_momoka_birthday", "togenashi_togeari"],
    ["ebizuka_tomo_birthday", "togenashi_togeari"],
    ["awa_subaru_birthday", "togenashi_togeari"],
    ["rupa_birthday", "togenashi_togeari"],
    ["diamond_dust_nana_birthday", "diamond_dust"],
    ["diamond_dust_hina_birthday", "diamond_dust"],
    ["diamond_dust_rin_birthday", "diamond_dust"],
    ["diamond_dust_ai_birthday", "diamond_dust"],
];

test("birthday details use explicit member IDs for both sides of each pairing", () => {
    const mappedIds = new Set();
    const normalize = (value) => value.replace(/\([^)]*\)/g, "").replace(/\s/g, "");
    for (const band of bands) {
        for (const member of band.members) {
            for (const category of ["character", "cast"]) {
                const id = member.birthdayIds[category];
                assert.ok(!mappedIds.has(id), `duplicate birthday ID: ${id}`);
                mappedIds.add(id);
                const entry = entries.find((item) => item.id === id);
                assert.ok(entry, `missing birthday: ${id}`);
                assert.equal(entry.category, category);
                assert.equal(normalize(entry.title), normalize(category === "character" ? member.role : member.name));
                const details = getBirthdayDetails(entry);
                assert.equal(details.band, band.name);
                assert.equal(details.relatedLabel, category === "character" ? "CV" : "担当キャラクター");
                assert.equal(normalize(details.relatedName), normalize(category === "character" ? member.name : member.role));
            }
        }
    }
    assert.equal(mappedIds.size, entries.filter((entry) => entry.type === "birthday" && entry.castGroup).length);
});

test("birthday details distinguish character and cast parts without changing birthday data", () => {
    const character = entries.find((entry) => entry.id === "kuzumimizuku_wakaba_birthday");
    const cast = entries.find((entry) => entry.id === "kuzumimizuku_an_birthday");
    assert.deepEqual(getBirthdayDetails(character), {
        band: "クズミミズク", part: "Vo.", partLabel: "担当パート", relatedName: "和音さん", relatedLabel: "CV",
    });
    assert.deepEqual(getBirthdayDetails(cast), {
        band: "クズミミズク", part: "Vo./Gt.", partLabel: "担当パート", relatedName: "若堀 若葉", relatedLabel: "担当キャラクター",
    });
    assert.equal(getDateDisplayTitle(cast), "和音さん");
    assert.equal(parseDateEntries([cast], "2026-01-14")[0].fullDateText, "2004年1月14日");
    assert.equal(cast.title, "和音(あん)さん");
    assert.equal(getBirthdayDetails(entries.find((entry) => entry.id === "teshima_nari_birthday")), null);
    assert.equal(getBirthdayDetails(entries.find((entry) => entry.id === "togenashi_formation")), null);
    const unpublished = entries.find((entry) => entry.id === "f272_towa_birthday");
    assert.equal(getBirthdayDetails(unpublished).relatedName, "宇田川琴");
    assert.equal(parseDateEntries([unpublished], "2026-01-14")[0].unpublishedDate, true);
});

test("Diamond Dust cast cards show the character's part, not the cast member's", () => {
    for (const [id, role, part] of [
        ["diamond_dust_yuuki_urushiyama_birthday", "リン", "Gt."],
        ["diamond_dust_reina_kondo_birthday", "ヒナ", "Vo."],
        ["diamond_dust_misato_matsuoka_birthday", "ナナ", "Ba."],
        ["diamond_dust_momoko_miyashiro_birthday", "アイ", "Dr."],
    ]) {
        const details = getBirthdayDetails(entries.find((entry) => entry.id === id));
        assert.equal(details.partLabel, "キャラのパート");
        assert.equal(details.part, part);
        assert.equal(details.relatedName, role);
    }
});

test("birthday data retains the existing entries and full birth dates", () => {
    assert.ok(isDateEntryArray(entries));
    assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
    const members = entries.filter((entry) => entry.category === "cast" && entry.castGroup === "kuzumimizuku");
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

test("Diamond Dust cast birthdays retain only the published birth years", () => {
    assert.ok(isDateEntryArray(entries));
    const members = entries.filter((entry) => entry.category === "cast" && entry.castGroup === "diamond_dust");
    assert.equal(members.length, expectedDiamondDustCast.length);
    for (const [id, title, year, month, day] of expectedDiamondDustCast) {
        const entry = members.find((item) => item.id === id);
        const expectedEntry = { id, title, type: "birthday", category: "cast", castGroup: "diamond_dust", month, day };
        if (year != null) expectedEntry.year = year;
        assert.deepEqual(entry, expectedEntry);
        const [parsed] = parseDateEntries([entry], `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
        assert.equal(parsed.isToday, true);
        assert.equal(parsed.fullDateText, year == null ? undefined : `${year}年${month}月${day}日`);
        assert.equal(parsed.unpublishedDate, undefined);
    }
});

test("Kuzumimizuku character birthdays are listed without assumed birth years", () => {
    assert.ok(isDateEntryArray(entries));
    assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
    for (const [id, title, month, day] of expectedCharacters) {
        const entry = entries.find((item) => item.id === id);
        assert.deepEqual(entry, { id, title, type: "birthday", category: "character", castGroup: "kuzumimizuku", month, day });
        const [parsed] = parseDateEntries([entry], `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
        assert.equal(parsed.isToday, true);
        assert.equal(parsed.fullDateText, undefined);
        assert.equal(parsed.elapsed, undefined);
        assert.equal(parsed.unpublishedDate, undefined);
    }
});

test("F-272 character birthdays are listed without assumed birth years", () => {
    assert.ok(isDateEntryArray(entries));
    assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
    for (const [id, title, month, day] of expectedF272Characters) {
        const entry = entries.find((item) => item.id === id);
        assert.deepEqual(entry, { id, title, type: "birthday", category: "character", castGroup: "f272", month, day });
        const [parsed] = parseDateEntries([entry], `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
        assert.equal(parsed.isToday, true);
        assert.equal(parsed.fullDateText, undefined);
        assert.equal(parsed.elapsed, undefined);
        assert.equal(parsed.unpublishedDate, undefined);
    }
});

test("Canna Lily character birthdays are listed without assumed birth years", () => {
    assert.ok(isDateEntryArray(entries));
    assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
    for (const [id, title, month, day] of expectedCannaLilyCharacters) {
        const entry = entries.find((item) => item.id === id);
        assert.deepEqual(entry, { id, title, type: "birthday", category: "character", castGroup: "canna_lily", month, day });
        const [parsed] = parseDateEntries([entry], `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
        assert.equal(parsed.isToday, true);
        assert.equal(parsed.fullDateText, undefined);
        assert.equal(parsed.elapsed, undefined);
        assert.equal(parsed.unpublishedDate, undefined);
    }
});

test("existing character birthdays are assigned to their band filter", () => {
    assert.ok(isDateEntryArray(entries));
    for (const [id, castGroup] of existingBandCharacters) {
        const entry = entries.find((item) => item.id === id);
        assert.equal(entry.castGroup, castGroup);
    }
});

test("calendar birthdays recur without duplicating matching Notion events", () => {
    const birthdays = getCalendarBirthdayEvents(entries, [], [2026, 2026, 2027]);
    assert.equal(birthdays.length, 48);
    for (const [id, title, , month, day] of expected) {
        for (const year of [2026, 2027]) {
            const event = birthdays.find((item) => item.id === `birthday-${id}-${year}`);
            assert.equal(event.date, `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
            assert.equal(event.title, `${title}誕生日`);
        }
    }
    for (const [id, title, month, day] of expectedCharacters) {
        for (const year of [2026, 2027]) {
            const event = birthdays.find((item) => item.id === `birthday-${id}-${year}`);
            assert.equal(event.date, `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
            assert.equal(event.title, `${title}誕生日`);
        }
    }
    for (const [id, title, month, day] of expectedF272Characters) {
        for (const year of [2026, 2027]) {
            const event = birthdays.find((item) => item.id === `birthday-${id}-${year}`);
            assert.equal(event.date, `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
            assert.equal(event.title, `${title}誕生日`);
        }
    }
    for (const [id, title, month, day] of expectedCannaLilyCharacters) {
        for (const year of [2026, 2027]) {
            const event = birthdays.find((item) => item.id === `birthday-${id}-${year}`);
            assert.equal(event.date, `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
            assert.equal(event.title, `${title}誕生日`);
        }
    }
    for (const [id, title, , month, day] of expectedDiamondDustCast) {
        for (const year of [2026, 2027]) {
            const event = birthdays.find((item) => item.id === `birthday-${id}-${year}`);
            assert.equal(event.date, `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
            assert.equal(event.title, `${title}誕生日`);
        }
    }
    const existing = [{ id: "notion", title: "記念日：和音さん誕生日2026", category: "記念日", date: "2026-01-14", isRange: false }];
    const deduplicated = getCalendarBirthdayEvents(entries, existing, [2026, 2027]);
    assert.equal(deduplicated.length, 47);
    assert.ok(!deduplicated.some((event) => event.id === "birthday-kuzumimizuku_an_birthday-2026"));
    assert.ok(deduplicated.some((event) => event.id === "birthday-kuzumimizuku_an_birthday-2027"));
    const characterEvent = [{
        id: "notion-character",
        title: "記念日：卯木風薫 誕生日2026",
        category: "記念日",
        date: "2026-10-10",
        isRange: false,
    }];
    const characterDeduplicated = getCalendarBirthdayEvents(entries, characterEvent, [2026]);
    assert.ok(!characterDeduplicated.some((event) => event.id === "birthday-kuzumimizuku_kazekaoru_birthday-2026"));
    const f272CharacterEvent = [{
        id: "notion-f272-character",
        title: "記念日：中村有 誕生日2026",
        category: "記念日",
        date: "2026-06-11",
        isRange: false,
    }];
    const f272CharacterDeduplicated = getCalendarBirthdayEvents(entries, f272CharacterEvent, [2026]);
    assert.ok(!f272CharacterDeduplicated.some((event) => event.id === "birthday-f272_nakamura_yu_birthday-2026"));
    const cannaLilyCharacterEvent = [{
        id: "notion-canna-lily-character",
        title: "記念日：星亜矢芽 誕生日2026",
        category: "記念日",
        date: "2026-05-05",
        isRange: false,
    }];
    const cannaLilyCharacterDeduplicated = getCalendarBirthdayEvents(entries, cannaLilyCharacterEvent, [2026]);
    assert.ok(!cannaLilyCharacterDeduplicated.some((event) => event.id === "birthday-canna_lily_ayame_birthday-2026"));
    const diamondDustCastEvent = [{
        id: "notion-diamond-dust-cast",
        title: "記念日：近藤玲奈さん誕生日2026",
        category: "記念日",
        date: "2026-01-28",
        isRange: false,
    }];
    const diamondDustCastDeduplicated = getCalendarBirthdayEvents(entries, diamondDustCastEvent, [2026]);
    assert.ok(!diamondDustCastDeduplicated.some((event) => event.id === "birthday-diamond_dust_reina_kondo_birthday-2026"));
    assert.equal(
        getCalendarBirthdayEvents(entries, [], [2001]).length,
        expectedCharacters.length + expectedF272Characters.length + expectedCannaLilyCharacters.length + expectedDiamondDustCast.length,
    );
});
