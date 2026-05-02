export type StampTourSpotType = "store" | "facility" | "kawasaki_spot" | "gallery";

export type StampTourExternalLink = {
    label: string;
    url: string;
};

export type StampTourSpot = {
    id: string;
    lineupNo: number;
    name: string;
    character: string;
    spotType: StampTourSpotType;
    area: string;
    address?: string;
    stampPlace: string;
    badgeSalePlace?: string;
    businessHours?: string;
    regularHoliday?: string;
    notes?: string[];
    officialUrl?: string;
    officialLinks?: StampTourExternalLink[];
    mapQuery?: string;
    sourceUrl: string;
};

export const STAMP_TOUR_OFFICIAL_TOP_URL = "https://girlsbandcrystamptour.com/";
export const STAMP_TOUR_OFFICIAL_SPOT_URL = "https://girlsbandcrystamptour.com/spot/";
export const STAMP_TOUR_GALLERY_NAME = "GIRLS BAND CRY STAMP GALLERY";
export const STAMP_TOUR_GALLERY_PLACE = `川崎アゼリア内 ${STAMP_TOUR_GALLERY_NAME}`;
export const STAMP_TOUR_GALLERY_HOURS = "平日 13:00〜20:00 / 土日祝 11:00〜20:00";
export const STAMP_TOUR_GALLERY_HOLIDAY = "川崎アゼリアの営業情報に準ずる";

const defaultSourceUrl = STAMP_TOUR_OFFICIAL_SPOT_URL;

export const stampTourOfficialLinks: StampTourExternalLink[] = [
    { label: "公式トップ", url: STAMP_TOUR_OFFICIAL_TOP_URL },
    { label: "公式スポット一覧", url: STAMP_TOUR_OFFICIAL_SPOT_URL },
];

export const stampTourGlobalNotices = [
    "このページは非公式の簡易まとめです。最新情報は必ず公式ページと各店舗HPで確認してください。",
    "営業時間・定休日・販売状況は変更される可能性があります。",
    "スタンプ設置期間は限定されていませんが、予告なく終了する可能性があります。",
    "缶バッジは品切れや再入荷の可能性があります。",
    "地図はスポット位置の確認用です。実際のスタンプ設置場所・缶バッジ販売場所は上記案内をご確認ください。",
];

export const stampTourSpots: StampTourSpot[] = [
    {
        id: "marufuku-coffee-kawasaki-azalea",
        lineupNo: 1,
        name: "丸福珈琲店川崎アゼリア店",
        character: "井芹仁菜",
        spotType: "store",
        area: "川崎駅東口",
        address: "〒210-0007 神奈川県川崎市川崎区駅前本町26番地2-1067 川崎アゼリアB1F",
        stampPlace: "丸福珈琲店川崎アゼリア店",
        badgeSalePlace: "丸福珈琲店川崎アゼリア店",
        businessHours: "(日〜木) 7:30〜21:00 / (金・土) 7:30〜22:00",
        regularHoliday: "なし",
        notes: ["年末年始は営業時間が異なる場合があります。店舗HPを確認してください。"],
        officialUrl: "https://marufukucoffeeten.com/store/marufukucoffee-kawasaki/",
        officialLinks: [{ label: "店舗HP", url: "https://marufukucoffeeten.com/store/marufukucoffee-kawasaki/" }],
        mapQuery: "丸福珈琲店川崎アゼリア店 川崎アゼリア",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "shimamura-lazona-kawasaki",
        lineupNo: 2,
        name: "島村楽器ラゾーナ川崎店",
        character: "河原木桃香",
        spotType: "store",
        area: "川崎駅西口",
        address: "〒212-0013 神奈川県川崎市幸区堀川町72-1 ラゾーナ川崎プラザ4・5F",
        stampPlace: "島村楽器ラゾーナ川崎店",
        badgeSalePlace: "島村楽器ラゾーナ川崎店",
        businessHours: "10:00〜21:00",
        regularHoliday: "なし",
        notes: [
            "2026年9月中旬をもって閉店予定と案内されています。最終営業日などの詳細は別途確認が必要です。",
            "年末年始は営業時間が異なる場合があります。店舗HPを確認してください。",
        ],
        officialUrl: "https://www.shimamura.co.jp/shop/l-kawasaki/",
        officialLinks: [
            { label: "店舗HP", url: "https://www.shimamura.co.jp/shop/l-kawasaki/" },
            { label: "閉店のお知らせ", url: "https://www.shimamura.co.jp/shop/l-kawasaki/important/9242" },
        ],
        mapQuery: "島村楽器ラゾーナ川崎店",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "yakouyu",
        lineupNo: 3,
        name: "矢向湯",
        character: "安和すばる",
        spotType: "store",
        area: "矢向",
        address: "〒230-0001 神奈川県横浜市鶴見区矢向5-3-19",
        stampPlace: "矢向湯",
        badgeSalePlace: "矢向湯",
        businessHours: "15:00〜22:00",
        regularHoliday: "不定休",
        officialUrl: "https://x.com/yakouyu",
        officialLinks: [{ label: "店舗案内", url: "https://x.com/yakouyu" }],
        mapQuery: "矢向湯",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "muza-kawasaki",
        lineupNo: 4,
        name: "ミューザ川崎",
        character: "海老塚智",
        spotType: "facility",
        area: "川崎駅西口",
        address: "〒212-0014 神奈川県川崎市幸区大宮町1310 ミューザ川崎2F",
        stampPlace: "アニメイト川崎",
        badgeSalePlace: "アニメイト川崎",
        businessHours: "(平日) 11:00〜20:00 / (土日祝) 10:00〜20:00",
        regularHoliday: "なし",
        notes: ["スタンプ設置とグッズ販売はアニメイト川崎です。"],
        officialUrl: "https://www.animate.co.jp/shop/kawasaki/",
        officialLinks: [
            { label: "アニメイト川崎", url: "https://www.animate.co.jp/shop/kawasaki/" },
            { label: "ミューザ川崎", url: "https://muzakawasaki.com/" },
        ],
        mapQuery: "ミューザ川崎",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "hmv-lazona-kawasaki",
        lineupNo: 5,
        name: "HMVラゾーナ川崎",
        character: "ルパ",
        spotType: "store",
        area: "川崎駅西口",
        address: "〒212-8576 神奈川県川崎市幸区堀川町72-1 ラゾーナ川崎プラザ4F",
        stampPlace: "HMVラゾーナ川崎",
        badgeSalePlace: "HMVラゾーナ川崎",
        businessHours: "10:00〜21:00",
        regularHoliday: "なし",
        officialUrl: "https://www.hmv.co.jp/store/lkw/",
        officialLinks: [{ label: "店舗HP", url: "https://www.hmv.co.jp/store/lkw/" }],
        mapQuery: "HMVラゾーナ川崎",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "kawasaki-azalea",
        lineupNo: 6,
        name: "川崎アゼリア",
        character: "河原木桃香",
        spotType: "facility",
        area: "川崎駅東口",
        address: "〒210-0007 神奈川県川崎市川崎区駅前本町26番地2-1067 川崎アゼリアB1F",
        stampPlace: "丸福珈琲店川崎アゼリア店",
        badgeSalePlace: "丸福珈琲店川崎アゼリア店",
        businessHours: "(日〜木) 7:30〜21:00 / (金・土) 7:30〜22:00",
        regularHoliday: "なし",
        notes: ["スタンプ設置と缶バッジ販売は丸福珈琲店川崎アゼリア店です。"],
        officialUrl: "https://www.azalea.co.jp/",
        officialLinks: [{ label: "川崎アゼリア", url: "https://www.azalea.co.jp/" }],
        mapQuery: "川崎アゼリア",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "tower-records-kawasaki",
        lineupNo: 7,
        name: "タワーレコード川崎店",
        character: "安和すばる",
        spotType: "store",
        area: "川崎駅東口",
        address: "〒210-0023 神奈川県川崎市川崎区小川町4-1 ラ チッタデッラ内 マッジョーレ1F",
        stampPlace: "タワーレコード川崎店",
        badgeSalePlace: "タワーレコード川崎店",
        businessHours: "11:00〜21:00",
        regularHoliday: "なし",
        notes: ["予約・取り置き不可。"],
        officialUrl: "https://tower.jp/store/kanto/Kawasaki",
        officialLinks: [{ label: "店舗HP", url: "https://tower.jp/store/kanto/Kawasaki" }],
        mapQuery: "タワーレコード川崎店",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "ganso-new-tantan-kyomachi",
        lineupNo: 8,
        name: "元祖ニュータンタンメン本舗京町店",
        character: "三浦潮美",
        spotType: "store",
        area: "京町",
        address: "〒210-0848 神奈川県川崎市川崎区京町1丁目18-7",
        stampPlace: "元祖ニュータンタンメン本舗京町店",
        badgeSalePlace: "元祖ニュータンタンメン本舗京町店 店内カプセルトイ",
        businessHours: "11:00〜23:00",
        regularHoliday: "なし",
        notes: [
            "缶バッジは店内のカプセルトイで販売。スタンプ帳の販売はありません。",
            "店内カプセルトイの利用には500円硬貨が必要です。",
        ],
        officialUrl: "https://new-tantan.jp/",
        officialLinks: [{ label: "店舗HP", url: "https://new-tantan.jp/" }],
        mapQuery: "元祖ニュータンタンメン本舗京町店",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "lazona-kawasaki-plaza",
        lineupNo: 9,
        name: "ラゾーナ川崎プラザ",
        character: "井芹仁菜",
        spotType: "facility",
        area: "川崎駅西口",
        address: "〒212-0013 神奈川県川崎市幸区堀川町72-1 ラゾーナ川崎プラザ",
        stampPlace: "島村楽器ラゾーナ川崎店 / HMVラゾーナ川崎",
        badgeSalePlace: "島村楽器ラゾーナ川崎店 / HMVラゾーナ川崎",
        businessHours: "施設営業時間に準ずる",
        regularHoliday: "施設営業日に準ずる",
        notes: [
            "スタンプ設置とグッズ販売は島村楽器ラゾーナ川崎店、HMVラゾーナ川崎の2箇所です。",
            "参加店舗のうち島村楽器ラゾーナ川崎店は2026年9月中旬をもって閉店予定と案内されています。最終営業日などの詳細は別途確認が必要です。",
        ],
        officialUrl: "https://mitsui-shopping-park.com/lazona-kawasaki/event/3106830.html",
        officialLinks: [
            { label: "ラゾーナ川崎プラザ", url: "https://mitsui-shopping-park.com/lazona-kawasaki/event/3106830.html" },
            { label: "島村楽器ラゾーナ川崎店", url: "https://www.shimamura.co.jp/shop/l-kawasaki/" },
            { label: "島村楽器 閉店のお知らせ", url: "https://www.shimamura.co.jp/shop/l-kawasaki/important/9242" },
            { label: "HMVラゾーナ川崎", url: "https://www.hmv.co.jp/store/lkw/" },
        ],
        mapQuery: "ラゾーナ川崎プラザ",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "hillvalley-cinecitta-kawasaki",
        lineupNo: 10,
        name: "ヒルバレーラチッタデッラ川崎店",
        character: "ヒナ",
        spotType: "store",
        area: "川崎駅東口",
        address: "〒210-0023 神奈川県川崎市川崎区小川町4-1 ラ チッタデッラ内マッジョーレ A-211",
        stampPlace: "ヒルバレーラチッタデッラ川崎店",
        badgeSalePlace: "ヒルバレーラチッタデッラ川崎店",
        businessHours: "11:00〜20:00",
        regularHoliday: "毎月不定期。詳細はヒルバレーHPで確認。",
        officialUrl: "https://www.hillvalley.jp/",
        officialLinks: [
            { label: "店舗HP", url: "https://www.hillvalley.jp/" },
            { label: "店休日案内", url: "https://www.hillvalley.jp/topics/article-5922/" },
        ],
        mapQuery: "ヒルバレー ラチッタデッラ川崎店",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "cinecitta",
        lineupNo: 11,
        name: "チネチッタ",
        character: "井芹仁菜",
        spotType: "facility",
        area: "川崎駅東口",
        address: "〒210-0023 神奈川県川崎市川崎区小川町4-1 ラ チネチッタデッラ内 マジョーレ2F",
        stampPlace: "チネチッタ2F入場口の出口側",
        badgeSalePlace: "チネチッタグッズショップ",
        businessHours: "8:30〜21:00",
        regularHoliday: "なし",
        notes: ["上映開始・終了時間により営業時間が変更になる場合があります。"],
        officialUrl: "https://cinecitta.co.jp/",
        officialLinks: [{ label: "施設HP", url: "https://cinecitta.co.jp/" }],
        mapQuery: "チネチッタ",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "tamagawa-miharashi-park",
        lineupNo: 12,
        name: "多摩川見晴らし公園",
        character: "井芹仁菜",
        spotType: "kawasaki_spot",
        area: "幸区",
        address: "〒212-0011 神奈川県川崎市幸区幸町2丁目",
        stampPlace: STAMP_TOUR_GALLERY_PLACE,
        badgeSalePlace: STAMP_TOUR_GALLERY_PLACE,
        businessHours: STAMP_TOUR_GALLERY_HOURS,
        regularHoliday: STAMP_TOUR_GALLERY_HOLIDAY,
        notes: ["KAWASAKI SPOTのスタンプと缶バッジ販売は現地ではなく川崎アゼリア内GIRLS BAND CRY STAMP GALLERYです。"],
        officialUrl: "https://www.azalea.co.jp/shops/4018",
        officialLinks: [{ label: "STAMP GALLERY案内", url: "https://www.azalea.co.jp/shops/4018" }],
        mapQuery: "多摩川見晴らし公園 川崎市幸区",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "fro-cafe",
        lineupNo: 13,
        name: "川崎フロンターレ公式カフェ FRO CAFE",
        character: "海老塚智",
        spotType: "store",
        area: "武蔵小杉",
        address: "〒211-0005 神奈川県川崎市中原区新丸子町1008-2",
        stampPlace: "川崎フロンターレ公式カフェ FRO CAFE",
        badgeSalePlace: "川崎フロンターレ公式カフェ FRO CAFE",
        businessHours: "11:30〜21:00",
        regularHoliday: "毎週月曜日（祝日の場合は翌火曜日）",
        notes: ["ホームゲームやイベント開催時は営業時間が変更となる場合があります。"],
        officialUrl: "https://www.frontale.co.jp/access/goods_cafe.html",
        officialLinks: [{ label: "店舗HP", url: "https://www.frontale.co.jp/access/goods_cafe.html" }],
        mapQuery: "FRO CAFE 川崎フロンターレ",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "shinmeicho-children-park",
        lineupNo: 14,
        name: "神明町児童公園",
        character: "海老塚智",
        spotType: "kawasaki_spot",
        area: "幸区",
        address: "〒212-0022 神奈川県川崎市幸区神明町2丁目2-2",
        stampPlace: STAMP_TOUR_GALLERY_PLACE,
        badgeSalePlace: STAMP_TOUR_GALLERY_PLACE,
        businessHours: STAMP_TOUR_GALLERY_HOURS,
        regularHoliday: STAMP_TOUR_GALLERY_HOLIDAY,
        notes: ["KAWASAKI SPOTのスタンプと缶バッジ販売は現地ではなく川崎アゼリア内GIRLS BAND CRY STAMP GALLERYです。"],
        officialUrl: "https://www.azalea.co.jp/shops/4018",
        officialLinks: [{ label: "STAMP GALLERY案内", url: "https://www.azalea.co.jp/shops/4018" }],
        mapQuery: "神明町児童公園 川崎市幸区",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "miyakocho-pedestrian-bridge",
        lineupNo: 15,
        name: "都町歩道橋",
        character: "ルパ",
        spotType: "kawasaki_spot",
        area: "幸区",
        address: "〒212-0016 神奈川県川崎市幸区南幸町1丁目",
        stampPlace: STAMP_TOUR_GALLERY_PLACE,
        badgeSalePlace: STAMP_TOUR_GALLERY_PLACE,
        businessHours: STAMP_TOUR_GALLERY_HOURS,
        regularHoliday: STAMP_TOUR_GALLERY_HOLIDAY,
        notes: ["KAWASAKI SPOTのスタンプと缶バッジ販売は現地ではなく川崎アゼリア内GIRLS BAND CRY STAMP GALLERYです。"],
        officialUrl: "https://www.azalea.co.jp/shops/4018",
        officialLinks: [{ label: "STAMP GALLERY案内", url: "https://www.azalea.co.jp/shops/4018" }],
        mapQuery: "都町歩道橋 川崎市幸区",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "higashi-ogishima-park",
        lineupNo: 16,
        name: "東扇島東公園",
        character: "安和すばる",
        spotType: "kawasaki_spot",
        area: "東扇島",
        address: "〒210-0869 神奈川県川崎市川崎区東扇島58-1",
        stampPlace: STAMP_TOUR_GALLERY_PLACE,
        badgeSalePlace: STAMP_TOUR_GALLERY_PLACE,
        businessHours: STAMP_TOUR_GALLERY_HOURS,
        regularHoliday: STAMP_TOUR_GALLERY_HOLIDAY,
        notes: ["KAWASAKI SPOTのスタンプと缶バッジ販売は現地ではなく川崎アゼリア内GIRLS BAND CRY STAMP GALLERYです。"],
        officialUrl: "https://www.azalea.co.jp/shops/4018",
        officialLinks: [{ label: "STAMP GALLERY案内", url: "https://www.azalea.co.jp/shops/4018" }],
        mapQuery: "東扇島東公園",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "minamigawara-park",
        lineupNo: 17,
        name: "南河原公園",
        character: "河原木桃香",
        spotType: "kawasaki_spot",
        area: "幸区",
        address: "〒212-0002 神奈川県川崎市幸区都町74-2",
        stampPlace: STAMP_TOUR_GALLERY_PLACE,
        badgeSalePlace: STAMP_TOUR_GALLERY_PLACE,
        businessHours: STAMP_TOUR_GALLERY_HOURS,
        regularHoliday: STAMP_TOUR_GALLERY_HOLIDAY,
        notes: ["KAWASAKI SPOTのスタンプと缶バッジ販売は現地ではなく川崎アゼリア内GIRLS BAND CRY STAMP GALLERYです。"],
        officialUrl: "https://www.azalea.co.jp/shops/4018",
        officialLinks: [{ label: "STAMP GALLERY案内", url: "https://www.azalea.co.jp/shops/4018" }],
        mapQuery: "南河原公園 川崎市幸区",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "sumiyoshi-kawasaki-daishi",
        lineupNo: 18,
        name: "川崎大師 山門前 住吉",
        character: "安和すばる",
        spotType: "store",
        area: "川崎大師",
        address: "〒210-0816 神奈川県川崎市川崎区大師町4-47",
        stampPlace: "川崎大師 山門前 住吉",
        badgeSalePlace: "川崎大師 山門前 住吉",
        businessHours: "8:30〜17:00",
        regularHoliday: "なし",
        officialUrl: "https://kuzumochi.com/",
        officialLinks: [{ label: "店舗HP", url: "https://kuzumochi.com/" }],
        mapQuery: "川崎大師 山門前 住吉",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "kawasui",
        lineupNo: 19,
        name: "カワスイ 川崎水族館",
        character: "海老塚智",
        spotType: "facility",
        area: "川崎駅東口",
        address: "〒210-0024 神奈川県川崎市川崎区日進町1-11 川崎ルフロン9・10階",
        stampPlace: "カワスイ 川崎水族館10階入口手前",
        badgeSalePlace: "カワスイ 川崎水族館 10階 チケットカウンター",
        businessHours: "10:00〜20:00（最終入館 19:00）",
        regularHoliday: "なし",
        notes: ["年末年始は営業時間が異なる場合があります。施設HPを確認してください。"],
        officialUrl: "https://kawa-sui.com/",
        officialLinks: [{ label: "施設HP", url: "https://kawa-sui.com/" }],
        mapQuery: "カワスイ 川崎水族館",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "rainbow-hat-kawasaki",
        lineupNo: 20,
        name: "レインボーハット 川崎店",
        character: "井芹仁菜",
        spotType: "store",
        area: "川崎駅東口",
        address: "〒210-0007 神奈川県川崎市川崎区駅前本町26-2 川崎地下街アゼリア",
        stampPlace: "レインボーハット 川崎店",
        badgeSalePlace: STAMP_TOUR_GALLERY_PLACE,
        businessHours: "10:00〜21:00（L.O.20:30 / クレープ20:20）",
        regularHoliday: "なし",
        officialUrl: "https://www.rainbowhat.co.jp/store-lists/",
        officialLinks: [{ label: "店舗HP", url: "https://www.rainbowhat.co.jp/store-lists/" }],
        mapQuery: "レインボーハット 川崎店",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "tokaido-beer-kawasaki",
        lineupNo: 21,
        name: "東海道BEER川崎宿工場",
        character: "ルパ",
        spotType: "store",
        area: "京急川崎",
        address: "〒210-0001 神奈川県川崎市川崎区本町1-4-1 本町コーポ1階",
        stampPlace: "東海道BEER川崎宿工場",
        badgeSalePlace: "東海道BEER川崎宿工場",
        businessHours: "平日 17:30〜22:00 / 土・日・祝祭日 12:00〜22:00",
        regularHoliday: "火曜日（祝祭日は営業）",
        notes: ["年末年始は営業時間が異なる場合があります。店舗HPを確認してください。"],
        officialUrl: "https://tokaido.beer/en/",
        officialLinks: [{ label: "店舗HP", url: "https://tokaido.beer/en/" }],
        mapQuery: "東海道BEER川崎宿工場",
        sourceUrl: defaultSourceUrl,
    },
    {
        id: "mervism",
        lineupNo: 22,
        name: "MeRvism",
        character: "安和すばる",
        spotType: "store",
        area: "川崎駅東口",
        address: "〒210-0007 神奈川県川崎市川崎区駅前本町26番地2 川崎アゼリア内店舗番号3042号",
        stampPlace: "MeRvism",
        badgeSalePlace: "MeRvism",
        businessHours: "10:00〜21:00",
        regularHoliday: "なし",
        officialUrl: "https://mervism.com/",
        officialLinks: [{ label: "店舗HP", url: "https://mervism.com/" }],
        mapQuery: "MeRvism 川崎アゼリア",
        sourceUrl: defaultSourceUrl,
    },
];

export const stampTourSpotTypeLabels: Record<StampTourSpotType, string> = {
    store: "店舗",
    facility: "施設",
    kawasaki_spot: "KAWASAKI SPOT",
    gallery: "GALLERY",
};

function collectUniqueStrings(values: string[]) {
    return values.filter((value, index) => values.indexOf(value) === index);
}

export const stampTourCharacters = collectUniqueStrings(stampTourSpots.map((spot) => spot.character));
export const stampTourAreas = collectUniqueStrings(stampTourSpots.map((spot) => spot.area));
export const stampTourAvailableSpotTypes = collectUniqueStrings(
    stampTourSpots.map((spot) => spot.spotType),
) as StampTourSpotType[];

export const stampTourSummary = {
    totalSpots: stampTourSpots.length,
    totalCharacters: stampTourCharacters.length,
    totalAreas: stampTourAreas.length,
};

function normalizeLocation(value: string) {
    return value.replace(/\s+/g, "").replace(/[／/]/g, "").trim();
}

export function isSplitStampAndBadgeLocation(spot: StampTourSpot) {
    if (!spot.badgeSalePlace) return false;
    return normalizeLocation(spot.stampPlace) !== normalizeLocation(spot.badgeSalePlace);
}

export function isDifferentSpotAndStampLocation(spot: StampTourSpot) {
    return normalizeLocation(spot.name) !== normalizeLocation(spot.stampPlace);
}

export function isDifferentSpotAndBadgeLocation(spot: StampTourSpot) {
    if (!spot.badgeSalePlace) return false;
    return normalizeLocation(spot.name) !== normalizeLocation(spot.badgeSalePlace);
}

export function buildStampTourMapUrl(spot: StampTourSpot) {
    const query = spot.mapQuery ?? [spot.name, spot.address].filter(Boolean).join(" ");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}