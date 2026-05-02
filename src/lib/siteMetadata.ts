export type SiteRouteMetadata = {
    path: string;
    title: string;
    description: string;
    pageViewTitle: string;
};

export const siteMetadata = {
    siteName: "ガルクラの箱",
    siteTitle: "【非公式】ガルクラの箱",
    siteUrl: "https://jirachi-tan.github.io/unofficial-gbc-info-box",
    locale: "ja_JP",
    twitterCard: "summary",
};

export const routeMetadataList: SiteRouteMetadata[] = [
    {
        path: "/",
        title: "【非公式】ガルクラの箱 | ガルクラ情報まとめ",
        description:
            "ガールズバンドクライの非公式ファンサイト。ガルクラ情報まとめ、記念日一覧、公式リンク、毎日クイズ、スタンプラリーまとめを掲載しています。",
        pageViewTitle: "TOP",
    },
    {
        path: "/dates",
        title: "ガルクラ記念日一覧 | 【非公式】ガルクラの箱",
        description:
            "ガールズバンドクライの誕生日・周年・記念日一覧をまとめた非公式ページです。ガルクラの記念日を一覧で確認できます。",
        pageViewTitle: "記念日一覧",
    },
    {
        path: "/links",
        title: "ガルクラ公式リンク一覧 | 【非公式】ガルクラの箱",
        description:
            "ガールズバンドクライ関連の公式サイト、配信先、各種公式リンクをまとめた非公式リンク一覧ページです。",
        pageViewTitle: "公式リンク一覧",
    },
    {
        path: "/quiz",
        title: "ガルクラクイズ | 【非公式】ガルクラの箱",
        description:
            "ガールズバンドクライの楽曲や本編に関するクイズを毎日楽しめる非公式ページです。",
        pageViewTitle: "クイズに挑戦！",
    },
    {
        path: "/tools",
        title: "ガルクラ便利ツール一覧 | 【非公式】ガルクラの箱",
        description:
            "ガールズバンドクライの便利ツールをまとめた非公式ページです。スタンプラリーまとめなど補助導線を一覧できます。",
        pageViewTitle: "便利ツール",
    },
    {
        path: "/tools/stamp-tour",
        title: "ガルクラスタンプラリーまとめ | 【非公式】ガルクラの箱",
        description:
            "ガールズバンドクライ スタンプラリーの設置場所、営業時間、缶バッジ販売場所、注意事項をまとめた非公式サポートページです。",
        pageViewTitle: "ガルクラスタンプラリー",
    },
];

export const routeMetadataMap = Object.fromEntries(
    routeMetadataList.map((route) => [route.path, route]),
) as Record<string, SiteRouteMetadata>;

export function getRouteMetadata(path: string) {
    return routeMetadataMap[path] ?? routeMetadataMap["/"];
}

export function toAbsoluteSiteUrl(path: string) {
    const normalizedPath = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
    return `${siteMetadata.siteUrl}${normalizedPath}`;
}