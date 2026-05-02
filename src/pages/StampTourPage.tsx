import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    CircleAlert,
    ExternalLink,
    Filter,
    MapPin,
    Sparkles,
    Store,
} from "lucide-react";
import {
    buildStampTourMapUrl,
    isDifferentSpotAndBadgeLocation,
    isDifferentSpotAndStampLocation,
    isSplitStampAndBadgeLocation,
    stampTourCharacters,
    stampTourGlobalNotices,
    stampTourOfficialLinks,
    stampTourSpots,
    stampTourSummary,
    type StampTourSpot,
} from "../data/stampTour";
import { trackOutboundLink } from "../lib/gtag";

function cn(...classes: Array<string | false | undefined | null>) {
    return classes.filter(Boolean).join(" ");
}

function formatOrOfficialFallback(value?: string) {
    if (!value) return <span className="stamp-tour-fallback">公式ページ要確認</span>;
    return <span>{value}</span>;
}

function buildLocationNotice(spot: StampTourSpot) {
    const splitStampAndBadge = isSplitStampAndBadgeLocation(spot);
    const differentSpotAndStamp = isDifferentSpotAndStampLocation(spot);
    const differentSpotAndBadge = isDifferentSpotAndBadgeLocation(spot);

    if (differentSpotAndStamp && differentSpotAndBadge) {
        return {
            tone: spot.spotType === "kawasaki_spot" ? "danger" : "warning",
            title: "スタンプ設置場所及び缶バッジ販売場所が別です",
            body: splitStampAndBadge
                ? `スタンプ設置場所は ${spot.stampPlace}、缶バッジ販売場所は ${spot.badgeSalePlace} です。`
                : `スタンプ設置場所及び缶バッジ販売場所は ${spot.stampPlace} です。`,
        };
    }

    if (differentSpotAndStamp) {
        return {
            tone: "info",
            title: "スタンプ設置場所が別です",
            body: `スタンプ設置場所は ${spot.stampPlace} です。`,
        };
    }

    if (differentSpotAndBadge || splitStampAndBadge) {
        return {
            tone: "warning",
            title: "缶バッジ販売場所が別です",
            body: `缶バッジ販売場所は ${spot.badgeSalePlace} です。`,
        };
    }

    return null;
}

function normalizeNoticeText(value: string) {
    return value.replace(/\s+/g, "").replace(/[、，,。・／/]/g, "").trim();
}

function splitNoticePlaces(value?: string) {
    if (!value) return [];
    return value
        .split(/[／/、,，]/)
        .map((part) => part.trim())
        .filter(Boolean);
}

function isRedundantLocationNote(
    note: string,
    spot: StampTourSpot,
    locationNotice: ReturnType<typeof buildLocationNotice>,
) {
    if (!locationNotice) return false;

    const normalizedNote = normalizeNoticeText(note);
    const title = locationNotice.title;
    const relevantPlaces = title.includes("及び")
        ? Array.from(new Set([...splitNoticePlaces(spot.stampPlace), ...splitNoticePlaces(spot.badgeSalePlace)]))
        : title.includes("スタンプ設置場所")
            ? splitNoticePlaces(spot.stampPlace)
            : splitNoticePlaces(spot.badgeSalePlace);

    if (relevantPlaces.length === 0) return false;

    const mentionsAllPlaces = relevantPlaces.every((place) => normalizedNote.includes(normalizeNoticeText(place)));
    if (!mentionsAllPlaces) return false;

    if (title.includes("及び")) {
        return /スタンプ設置|スタンプ/.test(note) && /缶バッジ販売|グッズ販売/.test(note);
    }

    if (title.includes("スタンプ設置場所")) {
        return /スタンプ設置|スタンプ/.test(note);
    }

    if (title.includes("缶バッジ販売場所")) {
        return /缶バッジ販売|グッズ販売/.test(note);
    }

    return false;
}

function FilterRow({
    title,
    value,
    options,
    onChange,
}: {
    title: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (nextValue: string) => void;
}) {
    return (
        <div className="stamp-tour-filter-block">
            <div className="stamp-tour-filter-title">{title}</div>
            <div className="stamp-tour-filter-chip-row">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        className={cn(
                            "stamp-tour-filter-chip",
                            value === option.value && "stamp-tour-filter-chip-active",
                        )}
                        onClick={() => onChange(option.value)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function StampTourCard({ spot }: { spot: StampTourSpot }) {
    const mapUrl = buildStampTourMapUrl(spot);
    const locationNotice = buildLocationNotice(spot);
    const noteItems = spot.notes ?? [];
    const displayNoteItems = noteItems.filter((note) => !isRedundantLocationNote(note, spot, locationNotice));
    const noticeTone = locationNotice?.tone ?? "info";
    const noticeTitle = locationNotice?.title ?? "注意事項";
    const noticeBody = locationNotice?.body;
    const hasNoticePanel = Boolean(locationNotice || displayNoteItems.length > 0);

    return (
        <motion.article
            className="stamp-tour-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            layout
        >
            <div className="stamp-tour-card-top">
                <span className="stamp-tour-lineup">No.{spot.lineupNo}</span>
            </div>

            <h3 className="stamp-tour-card-title">{spot.name}</h3>

            <div className="stamp-tour-chip-row">
                <span className="stamp-tour-meta-chip stamp-tour-character-chip">{spot.character}</span>
            </div>

            {hasNoticePanel && (
                <div
                    className={cn(
                        "stamp-tour-location-alert",
                        noticeTone === "danger" && "stamp-tour-location-alert-danger",
                        noticeTone === "warning" && "stamp-tour-location-alert-warning",
                        noticeTone === "info" && "stamp-tour-location-alert-info",
                    )}
                >
                    <CircleAlert className="icon-16" />
                    <div className="stamp-tour-location-alert-content">
                        <div className="stamp-tour-location-alert-title">{noticeTitle}</div>
                        {noticeBody ? (
                            <p className="stamp-tour-location-alert-body">{noticeBody}</p>
                        ) : null}
                        {displayNoteItems.length > 0 ? (
                            <ul className="stamp-tour-location-alert-list">
                                {displayNoteItems.map((note) => (
                                    <li key={note} className="stamp-tour-location-alert-item">{note}</li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                </div>
            )}

            <dl className="stamp-tour-detail-list">
                <div className="stamp-tour-detail-row">
                    <dt>スタンプ設置</dt>
                    <dd>{spot.stampPlace}</dd>
                </div>
                <div className="stamp-tour-detail-row">
                    <dt>缶バッジ販売</dt>
                    <dd>{formatOrOfficialFallback(spot.badgeSalePlace)}</dd>
                </div>
                <div className="stamp-tour-detail-row">
                    <dt>営業時間</dt>
                    <dd>{formatOrOfficialFallback(spot.businessHours)}</dd>
                </div>
                <div className="stamp-tour-detail-row">
                    <dt>定休日</dt>
                    <dd>{formatOrOfficialFallback(spot.regularHoliday)}</dd>
                </div>
                <div className="stamp-tour-detail-row">
                    <dt>住所</dt>
                    <dd>{formatOrOfficialFallback(spot.address)}</dd>
                </div>
            </dl>

            <div className="stamp-tour-card-actions">
                <a
                    className="tools-action-button tools-action-button-primary"
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackOutboundLink(mapUrl, `${spot.name} Google Map`)}
                >
                    <MapPin className="icon-16" />
                    Google Map検索
                </a>

                {spot.officialLinks?.map((link) => (
                    <a
                        key={link.url}
                        className="tools-action-button tools-action-button-secondary"
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackOutboundLink(link.url, `${spot.name} ${link.label}`)}
                    >
                        <ExternalLink className="icon-16" />
                        {link.label}
                    </a>
                ))}

                <a
                    className="stamp-tour-source-link"
                    href={spot.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackOutboundLink(spot.sourceUrl, `${spot.name} 公式スポット一覧`)}
                >
                    公式スポット一覧で確認
                </a>
            </div>
        </motion.article>
    );
}

export default function StampTourPage() {
    const [characterFilter, setCharacterFilter] = useState("all");

    const filteredSpots = useMemo(() => {
        return stampTourSpots.filter((spot) => {
            return characterFilter === "all" || spot.character === characterFilter;
        });
    }, [characterFilter]);

    return (
        <div className="shell main-stack">
            <section className="panel stamp-tour-hero-panel">
                <div className="stamp-tour-hero-layout">
                    <div>
                        <div className="eyebrow sky">fan-made support page</div>
                        <h2 className="panel-title">ガルクラスタンプラリー簡易まとめ</h2>
                        <p className="stamp-tour-hero-text">
                            詳細は公式ページに記載されておりますのでまずはそちらをご確認ください。
                            あくまでこのページはリンク一覧や注意事項など簡易的なまとめページです。
                        </p>
                    </div>

                    <div className="stamp-tour-official-box">
                        <div className="stamp-tour-official-badge">
                            <Sparkles className="icon-14" />
                            最新情報は公式で確認
                        </div>
                        <p className="stamp-tour-official-text">
                            営業時間、定休日、販売状況、設置終了の有無は公式情報が最優先です。
                        </p>

                        <div className="stamp-tour-action-row">
                            {stampTourOfficialLinks.map((link, index) => (
                                <a
                                    key={link.url}
                                    className={cn(
                                        "tools-action-button",
                                        index === 1 ? "tools-action-button-primary" : "tools-action-button-secondary",
                                    )}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackOutboundLink(link.url, link.label)}
                                >
                                    <ExternalLink className="icon-16" />
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="panel stamp-tour-notice-panel">
                <div className="panel-head compact no-border">
                    <div>
                        <div className="eyebrow pink">before you go</div>
                        <h3 className="panel-title small-title">確認しておきたいこと</h3>
                    </div>
                </div>

                <div className="stamp-tour-global-notice-list">
                    {stampTourGlobalNotices.map((notice) => (
                        <div key={notice} className="stamp-tour-global-notice-item">
                            <CircleAlert className="icon-16" />
                            <span>{notice}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="panel stamp-tour-filter-panel">
                <div className="panel-head">
                    <div>
                        <div className="eyebrow teal">filter & list</div>
                        <h3 className="panel-title small-title">スポット一覧</h3>
                    </div>

                    <div className="stamp-tour-result-chip">
                        <Filter className="icon-16" />
                        {filteredSpots.length} / {stampTourSummary.totalSpots} 件
                    </div>
                </div>

                <FilterRow
                    title="キャラクター"
                    value={characterFilter}
                    options={[
                        { value: "all", label: "すべて" },
                        ...stampTourCharacters.map((character) => ({ value: character, label: character })),
                    ]}
                    onChange={setCharacterFilter}
                />

                {filteredSpots.length === 0 ? (
                    <div className="stamp-tour-empty-state">
                        <Store className="icon-18" />
                        条件に一致するスポットがありません。キャラクターを切り替えてください。
                    </div>
                ) : (
                    <div className="stamp-tour-grid">
                        {filteredSpots.map((spot) => (
                            <StampTourCard key={spot.id} spot={spot} />
                        ))}
                    </div>
                )}
            </section>

            <section className="panel stamp-tour-footer-panel">
                <div className="stamp-tour-footer-layout">
                    <div>
                        <div className="eyebrow sky">official check</div>
                        <h3 className="panel-title small-title">最後にもう一度公式確認</h3>
                        <p className="stamp-tour-footer-text">
                            このページだけで完結させず、移動前と入店前に公式スポット一覧・各店舗HPを見ておく前提で使ってください。
                        </p>
                    </div>

                    <div className="stamp-tour-action-row">
                        {stampTourOfficialLinks.map((link, index) => (
                            <a
                                key={link.url}
                                className={cn(
                                    "tools-action-button",
                                    index === 1 ? "tools-action-button-primary" : "tools-action-button-secondary",
                                )}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackOutboundLink(link.url, `${link.label} footer`)}
                            >
                                <ExternalLink className="icon-16" />
                                {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}