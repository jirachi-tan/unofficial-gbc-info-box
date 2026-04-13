import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { trackDatesFilter } from "../lib/gtag";
import { CalendarDays, Cake, Award, Sparkles, Clock3 } from "lucide-react";
import {
    type DateEntry,
    type DateEntryRaw,
    parseDateEntries,
    countdownTo,
    formatCountdown,
    formatElapsed,
    categoryLabels,
    isDateEntryArray,
} from "../lib/parseDates";

const datesJsonPath = `${import.meta.env.BASE_URL}data/dates.json`;

type CategoryFilter = "all" | "character" | "cast" | "other";

const filterTabs: Array<{ key: CategoryFilter; label: string }> = [
    { key: "all", label: "すべて" },
    { key: "character", label: "キャラクター" },
    { key: "cast", label: "キャスト" },
    { key: "other", label: "その他" },
];

function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [countdown, setCountdown] = useState(() => countdownTo(targetDate));

    useEffect(() => {
        const id = setInterval(() => setCountdown(countdownTo(targetDate)), 1000);
        return () => clearInterval(id);
    }, [targetDate]);

    if (!countdown) return null;

    return (
        <span className="dates-countdown-value">
            {formatCountdown(countdown)}
        </span>
    );
}

function DateCard({ entry }: { entry: DateEntry }) {
    const isBirthday = entry.type === "birthday";
    const icon = isBirthday ? <Cake className="icon-18" /> : <Award className="icon-18" />;
    const monthDay = entry.type === "birthday"
        ? `${entry.month}月${entry.day}日`
        : `${Number(entry.startDate!.slice(5, 7))}月${Number(entry.startDate!.slice(8, 10))}日`;

    return (
        <motion.div
            className={`dates-card ${entry.isToday ? "dates-card-today" : ""}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            layout
        >
            {entry.isToday && (
                <div className="dates-today-banner">
                    <Sparkles className="icon-16" />
                    {isBirthday
                        ? `今日は${entry.title.replace("誕生日", "")}の誕生日です！おめでとうございます！`
                        : `本日で${entry.title}${entry.anniversaryYear}周年です！`}
                </div>
            )}

            <div className="dates-card-body">
                <div className="dates-card-top">
                    <span className={`dates-type-badge dates-type-${entry.type}`}>
                        {icon}
                        <span>{isBirthday ? "誕生日" : "周年記念"}</span>
                    </span>
                    <span className="dates-category-chip">
                        {categoryLabels[entry.category] ?? entry.category}
                    </span>
                </div>

                <h3 className="dates-card-title">{entry.title}</h3>

                <div className="dates-card-meta">
                    <CalendarDays className="icon-14" />
                    <span>{monthDay}</span>
                </div>

                {!entry.isToday && (
                    <div className="dates-card-countdown">
                        <Clock3 className="icon-14" />
                        <span className="dates-countdown-label">
                            {entry.type === "anniversary" && entry.anniversaryYear != null
                                ? `${entry.anniversaryYear}周年まで `
                                : "次回まで "}
                        </span>
                        <CountdownTimer targetDate={entry.nextDate} />
                    </div>
                )}

                {entry.type === "anniversary" && entry.elapsed && !entry.isToday && (
                    <div className="dates-card-elapsed">
                        <span className="dates-elapsed-label">経過：</span>
                        <span>{formatElapsed(entry.elapsed)}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default function DatesPage() {
    const [raw, setRaw] = useState<DateEntryRaw[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<CategoryFilter>("all");

    useEffect(() => {
        fetch(datesJsonPath)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json) => {
                if (!isDateEntryArray(json)) throw new Error("Invalid dates.json format");
                setRaw(json);
            })
            .catch((err) => setError(String(err)));
    }, []);

    const entries = useMemo(() => parseDateEntries(raw), [raw]);
    const sorted = useMemo(() => {
        const filtered = filter === "all" ? entries : entries.filter((e) => e.category === filter);
        return [...filtered].sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    }, [entries, filter]);

    const todayEntries = sorted.filter((e) => e.isToday);
    const upcomingEntries = sorted.filter((e) => !e.isToday);

    return (
        <div className="shell main-stack">
            <section className="panel">
                <div className="panel-head">
                    <div>
                        <div className="eyebrow pink">anniversary list</div>
                        <h2 className="panel-title">記念日一覧</h2>
                    </div>
                    <div className="tab-row">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`tab-button ${filter === tab.key ? "tab-button-active" : ""}`}
                                onClick={() => { setFilter(tab.key); trackDatesFilter(tab.key); }}
                            >
                                <span style={{ fontSize: 13, fontWeight: 800 }}>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="empty-card" style={{ textAlign: "center", padding: "2rem 1rem" }}>
                        <p style={{ color: "#be123c", fontWeight: 600 }}>データの読み込みに失敗しました</p>
                    </div>
                )}

                {!error && sorted.length === 0 && raw.length > 0 && (
                    <div className="empty-card" style={{ textAlign: "center", padding: "2rem 1rem" }}>
                        <p className="muted-text">該当する記念日がありません。</p>
                    </div>
                )}

                {todayEntries.length > 0 && (
                    <div className="dates-section">
                        <div className="panel-subtitle">
                            <Sparkles className="icon-18 pink-icon" />
                            <span>本日の記念日</span>
                        </div>
                        <div className="dates-grid">
                            <AnimatePresence mode="popLayout">
                                {todayEntries.map((entry) => (
                                    <DateCard key={entry.id} entry={entry} />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}

                {upcomingEntries.length > 0 && (
                    <div className="dates-section">
                        {todayEntries.length > 0 && (
                            <div className="panel-subtitle">
                                <Clock3 className="icon-18 pink-icon" />
                                <span>今後の記念日</span>
                            </div>
                        )}
                        <div className="dates-grid">
                            <AnimatePresence mode="popLayout">
                                {upcomingEntries.map((entry) => (
                                    <DateCard key={entry.id} entry={entry} />
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
