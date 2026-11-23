// ─── Types ───

export type SnsType = "x" | "instagram" | "tiktok" | "youtube" | "official" | "store";

export type SnsLink = {
    type: SnsType;
    url: string;
    label?: string;
};

export type OfficialLinkCard = {
    name: string;
    description?: string;
    links: SnsLink[];
};

export type BandMember = {
    name: string;
    role: string;
    part: string;
    /** Character's part, when it differs from the cast member's part. */
    characterPart?: string;
    birthdayIds: { character: string; cast: string };
    links: SnsLink[];
};

export type BandInfo = {
    name: string;
    officialLinks?: SnsLink[];
    members: BandMember[];
};

export type LinkSection = {
    id: string;
    title: string;
    eyebrow: string;
    cards: OfficialLinkCard[];
};

// ─── Section Data ───

export const linkSections: LinkSection[] = [
    {
        id: "official",
        title: "作品公式",
        eyebrow: "official works",
        cards: [
            {
                name: "アニメ『ガールズバンドクライ』",
                links: [
                    { type: "x", url: "https://x.com/girlsbandcry" },
                    { type: "instagram", url: "https://www.instagram.com/toge0toge1/" },
                    { type: "tiktok", url: "https://www.tiktok.com/@girlsbandcry" },
                    { type: "youtube", url: "https://www.youtube.com/@girlsbandcry" },
                ],
            },
            {
                name: "ガールズバンドクライ First Riff",
                links: [
                    { type: "x", url: "https://x.com/gbc_firstriff" },
                    { type: "official", url: "https://gbc-firstriff.com/" },
                ],
            },
            {
                name: "トゲナシトゲアリのトゲラジ\n～川崎から世界へ～",
                links: [
                    { type: "official", url: "https://www.interfm.co.jp/togeradi", label: "番組ページ" },
                ],
            },
        ],
    },
];

// ─── Band Data ───

export const bands: BandInfo[] = [
    {
        name: "トゲナシトゲアリ",
        members: [
            {
                name: "理名さん",
                role: "井芹仁菜",
                part: "Vo.",
                birthdayIds: { character: "iseri_nina_birthday", cast: "rina_birthday" },
                links: [
                    { type: "x", url: "https://x.com/rina_togetoge" },
                    { type: "instagram", url: "https://www.instagram.com/rina_togetoge/" },
                ],
            },
            {
                name: "夕莉さん",
                role: "河原木桃香",
                part: "Gt.",
                birthdayIds: { character: "kawaragi_momoka_birthday", cast: "yuri_birthday" },
                links: [
                    { type: "x", url: "https://x.com/yuri_togetoge" },
                    { type: "instagram", url: "https://www.instagram.com/yuri_togetoge/" },
                ],
            },
            {
                name: "朱李さん",
                role: "ルパ",
                part: "Ba.",
                birthdayIds: { character: "rupa_birthday", cast: "shuri_birthday" },
                links: [
                    { type: "x", url: "https://x.com/shuri_togetoge" },
                    { type: "instagram", url: "https://www.instagram.com/shuri_togetoge/" },
                ],
            },
            {
                name: "凪都さん",
                role: "海老塚智",
                part: "Key.",
                birthdayIds: { character: "ebizuka_tomo_birthday", cast: "natsu_birthday" },
                links: [
                    { type: "x", url: "https://x.com/natsu_togetoge" },
                    { type: "instagram", url: "https://www.instagram.com/natsu_togetoge/" },
                ],
            },
            {
                name: "美怜さん",
                role: "安和すばる",
                part: "Dr.",
                birthdayIds: { character: "awa_subaru_birthday", cast: "mirei_birthday" },
                links: [
                    { type: "x", url: "https://x.com/mirei_togetoge" },
                    { type: "instagram", url: "https://www.instagram.com/mirei_togetoge/" },
                ],
            },
        ],
    },
    {
        name: "Canna Lily",
        officialLinks: [
            { type: "x", url: "https://x.com/CannaLily_GBC" },
        ],
        members: [
            {
                name: "箭野 結羽さん",
                role: "橘田楓",
                part: "Vo.",
                birthdayIds: { character: "canna_lily_kaede_birthday", cast: "yano_yu_birthday" },
                links: [
                    { type: "x", url: "https://x.com/YuwaCannaLily" },
                ],
            },
            {
                name: "早坂 莉寧さん",
                role: "星亜矢芽",
                part: "Gt.",
                birthdayIds: { character: "canna_lily_ayame_birthday", cast: "hayasaka_rin_birthday" },
                links: [
                    { type: "x", url: "https://x.com/RineCannaLily" },
                ],
            },
            {
                name: "紫乃月 姫咲さん",
                role: "榊原紫苑",
                part: "Ba.",
                birthdayIds: { character: "canna_lily_shion_birthday", cast: "mizunotsuki_himesaki_birthday" },
                links: [
                    { type: "x", url: "https://x.com/KisakiCannaLily" },
                ],
            },
            {
                name: "佐野 櫻さん",
                role: "雪志摩ナズナ",
                part: "Key.",
                birthdayIds: { character: "canna_lily_nazuna_birthday", cast: "sano_sakur_birthday" },
                links: [
                    { type: "x", url: "https://x.com/SakuraCannaLily" },
                ],
            },
            {
                name: "椎名 在音さん",
                role: "千ヶ崎竜胆",
                part: "Dr.",
                birthdayIds: { character: "canna_lily_rindo_birthday", cast: "shiina_zaon_birthday" },
                links: [
                    { type: "x", url: "https://x.com/AruneCannaLily" },
                ],
            },
        ],
    },
    {
        name: "F-272",
        officialLinks: [
            { type: "x", url: "https://x.com/F_272_GBC" },
            { type: "youtube", url: "https://www.youtube.com/@f272official" },
        ],
        members: [
            {
                name: "LUCAさん",
                role: "加藤嗄生",
                part: "Vo.",
                birthdayIds: { character: "f272_kato_sayori_birthday", cast: "f272_luca_birthday" },
                links: [
                    { type: "x", url: "https://x.com/luca_F272" },
                ],
            },
            {
                name: "TOWAさん",
                role: "宇田川琴",
                part: "Gt.",
                birthdayIds: { character: "f272_udagawa_koto_birthday", cast: "f272_towa_birthday" },
                links: [
                    { type: "x", url: "https://x.com/towa_F272" },
                ],
            },
            {
                name: "MIYUさん",
                role: "黒宮八月",
                part: "Gt.",
                birthdayIds: { character: "f272_kuromiya_hazuki_birthday", cast: "f272_miyu_birthday" },
                links: [
                    { type: "x", url: "https://x.com/miyu_F272" },
                ],
            },
            {
                name: "HINANOさん",
                role: "浅井萌々乃",
                part: "Ba.",
                birthdayIds: { character: "f272_asai_momono_birthday", cast: "f272_hinano_birthday" },
                links: [
                    { type: "x", url: "https://x.com/hinano_F272" },
                ],
            },
            {
                name: "YOSHIさん",
                role: "中村有",
                part: "Dr.",
                birthdayIds: { character: "f272_nakamura_yu_birthday", cast: "f272_yoshi_birthday" },
                links: [
                    { type: "x", url: "https://x.com/yoshi_F272" },
                ],
            },
        ],
    },
    {
        name: "クズミミズク",
        officialLinks: [
            { type: "official", url: "https://kuzumimizuku-official.com" },
        ],
        members: [
            {
                name: "和音(あん)さん",
                role: "若堀 若葉",
                part: "Vo./Gt.",
                characterPart: "Vo.",
                birthdayIds: { character: "kuzumimizuku_wakaba_birthday", cast: "kuzumimizuku_an_birthday" },
                links: [
                    { type: "x", url: "https://x.com/an_kzmmzk" },
                    { type: "instagram", url: "https://instagram.com/an_kzmmzk" },
                ],
            },
            {
                name: "茉那(まな)さん",
                role: "飯豊 澄羽",
                part: "Gt./Vo.",
                characterPart: "Gt.",
                birthdayIds: { character: "kuzumimizuku_suuha_birthday", cast: "kuzumimizuku_mana_birthday" },
                links: [
                    { type: "x", url: "https://x.com/mana_kzmmzk" },
                    { type: "instagram", url: "https://instagram.com/mana_kzmmzk" },
                ],
            },
            {
                name: "藍楠(あいな)さん",
                role: "乙津 歌留多",
                part: "Ba.",
                birthdayIds: { character: "kuzumimizuku_karuta_birthday", cast: "kuzumimizuku_aina_birthday" },
                links: [
                    { type: "x", url: "https://x.com/aina_kzmmzk" },
                    { type: "instagram", url: "https://instagram.com/aina_kzmmzk" },
                ],
            },
            {
                name: "乃逢(のあ)さん",
                role: "卯木 風薫",
                part: "Dr.",
                birthdayIds: { character: "kuzumimizuku_kazekaoru_birthday", cast: "kuzumimizuku_noa_birthday" },
                links: [
                    { type: "x", url: "https://x.com/noa_kzmmzk" },
                    { type: "instagram", url: "https://instagram.com/noa_kzmmzk" },
                ],
            },
            {
                name: "佳哉(かや)さん",
                role: "八峰 志乃",
                part: "Key.",
                birthdayIds: { character: "kuzumimizuku_shino_birthday", cast: "kuzumimizuku_kaya_birthday" },
                links: [
                    { type: "x", url: "https://x.com/kaya_kzmmzk" },
                    { type: "instagram", url: "https://instagram.com/kaya_kzmmzk" },
                ],
            },
        ],
    },
    {
        name: "ダイヤモンドダスト",
        members: [
            {
                name: "近藤 玲奈さん",
                role: "ヒナ",
                part: "Vo.",
                birthdayIds: { character: "diamond_dust_hina_birthday", cast: "diamond_dust_reina_kondo_birthday" },
                links: [
                    { type: "x", url: "https://x.com/reina_kondo" },
                ],
            },
            {
                name: "漆山 ゆうきさん",
                role: "リン",
                part: "Gt.",
                birthdayIds: { character: "diamond_dust_rin_birthday", cast: "diamond_dust_yuuki_urushiyama_birthday" },
                links: [
                    { type: "x", url: "https://x.com/urushiyamayuuki" },
                ],
            },
            {
                name: "松岡 美里さん",
                role: "ナナ",
                part: "Ba.",
                birthdayIds: { character: "diamond_dust_nana_birthday", cast: "diamond_dust_misato_matsuoka_birthday" },
                links: [
                    { type: "x", url: "https://x.com/Matsuoka_Misato" },
                ],
            },
            {
                name: "宮白 桃子さん",
                role: "アイ",
                part: "Dr.",
                birthdayIds: { character: "diamond_dust_ai_birthday", cast: "diamond_dust_momoko_miyashiro_birthday" },
                links: [
                    { type: "x", url: "https://x.com/miyamo_0509" },
                ],
            },
        ],
    },
];

// ─── Helpers ───

const snsLabels: Record<SnsType, string> = {
    x: "X",
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    official: "公式サイト",
    store: "ストア",
};

export function getSnsLabel(type: SnsType, customLabel?: string): string {
    return customLabel ?? snsLabels[type];
}

/** All section ids including band-specific sections for jump navigation */
export function getAllSectionIds(): Array<{ id: string; label: string }> {
    const ids: Array<{ id: string; label: string }> = linkSections.map((s) => ({
        id: s.id,
        label: s.title,
    }));

    ids.push({ id: "bands", label: "バンド公式 / キャスト" });

    for (const band of bands) {
        ids.push({ id: `band-${band.name}`, label: band.name });
    }

    return ids;
}
