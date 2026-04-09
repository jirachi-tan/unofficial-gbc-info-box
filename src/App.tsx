
import React, { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  Music4,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Menu,
  Link as LinkIcon,
  ChevronUp,
  GanttChart,
  X,
  HelpCircle,
  Eye,
} from "lucide-react";
import { getTokyoTodayYmd, parseCsvRows, type EventItem, type RawCsvRow } from "./lib/parseEvents";

type ViewKey = "focus" | "timeline" | "calendar";
type HeaderNavItem = {
  key: string;
  label: string;
  description: string;
  target?: string;
  status: "available" | "coming-soon";
  emphasis?: "primary" | "secondary";
};

const viewTabs: Array<{ key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "focus", label: "今日", icon: Clock3 },
  { key: "timeline", label: "タイムライン", icon: GanttChart },
  { key: "calendar", label: "カレンダー", icon: CalendarDays },
];

const headerNavItems: HeaderNavItem[] = [
  {
    key: "top",
    label: "TOP",
    description: "ページの先頭へ戻ります。",
    target: "top",
    status: "available",
    emphasis: "primary",
  },
  {
    key: "anniversary",
    label: "記念日一覧",
    description: "誕生日や周年の情報をまとめるページを追加予定です。",
    status: "coming-soon",
  },
  {
    key: "official-links",
    label: "公式リンク一覧",
    description: "公式サイトや配信先への導線を整理したページを追加予定です。",
    status: "coming-soon",
  },
  {
    key: "quiz",
    label: "クイズに挑戦",
    description: "作品や楽曲に関するクイズ企画を追加予定です。",
    status: "coming-soon",
  },
];
const eventsJsonPath = `${import.meta.env.BASE_URL}data/events.json`;
const quizJsonPath = `${import.meta.env.BASE_URL}data/quiz.json`;
const dailyQuizStorageKey = "gbc-daily-quiz-progress-v2";

type QuizItem = { id: string; question: string; answer: string };
type DailyQuizProgress = {
  currentDate: string;
  currentId: string | null;
  remainingIds: string[];
  catalogIds: string[];
  revealedDate: string | null;
  revealedId: string | null;
};

function isQuizItemArray(value: unknown): value is QuizItem[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;

      const candidate = item as Record<string, unknown>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.question === "string" &&
        typeof candidate.answer === "string"
      );
    })
  );
}

function parseQuizJson(payload: unknown): QuizItem[] {
  if (!isQuizItemArray(payload)) {
    throw new Error("quiz.json must be an array of { id, question, answer } objects");
  }

  const seenIds = new Set<string>();

  return payload.map((quiz) => {
    const normalizedQuiz = {
      id: quiz.id.trim(),
      question: quiz.question.trim(),
      answer: quiz.answer.trim(),
    };

    if (!normalizedQuiz.id || !normalizedQuiz.question || !normalizedQuiz.answer) {
      throw new Error("quiz.json items require non-empty id, question, and answer");
    }

    if (seenIds.has(normalizedQuiz.id)) {
      throw new Error(`quiz.json contains duplicate id: ${normalizedQuiz.id}`);
    }

    seenIds.add(normalizedQuiz.id);
    return normalizedQuiz;
  });
}

function shuffleItems<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function insertIdsRandomly(queue: string[], incomingIds: string[]) {
  const nextQueue = [...queue];

  for (const quizId of shuffleItems(incomingIds)) {
    const insertIndex = Math.floor(Math.random() * (nextQueue.length + 1));
    nextQueue.splice(insertIndex, 0, quizId);
  }

  return nextQueue;
}

function getDaysBetween(fromYmd: string, toYmd: string) {
  const diff = parseYmd(toYmd).getTime() - parseYmd(fromYmd).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function readDailyQuizProgress(): DailyQuizProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(dailyQuizStorageKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<DailyQuizProgress>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      currentDate: typeof parsed.currentDate === "string" ? parsed.currentDate : getTokyoTodayYmd(),
      currentId: typeof parsed.currentId === "string" ? parsed.currentId : null,
      remainingIds: Array.isArray(parsed.remainingIds) ? parsed.remainingIds.filter((id): id is string => typeof id === "string") : [],
      catalogIds: Array.isArray(parsed.catalogIds) ? parsed.catalogIds.filter((id): id is string => typeof id === "string") : [],
      revealedDate: typeof parsed.revealedDate === "string" ? parsed.revealedDate : null,
      revealedId: typeof parsed.revealedId === "string" ? parsed.revealedId : null,
    };
  } catch {
    return null;
  }
}

function writeDailyQuizProgress(progress: DailyQuizProgress) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(dailyQuizStorageKey, JSON.stringify(progress));
  } catch {
    // ignore storage write failures and keep the in-memory state only
  }
}

function pickNextDailyQuiz(allIds: string[], remainingIds: string[]) {
  if (allIds.length === 0) {
    return {
      currentId: null,
      remainingIds: [],
    };
  }

  if (remainingIds.length === 0) {
    const reshuffled = shuffleItems(allIds);
    return {
      currentId: reshuffled[0] ?? null,
      remainingIds: reshuffled.slice(1),
    };
  }

  return {
    currentId: remainingIds[0] ?? null,
    remainingIds: remainingIds.slice(1),
  };
}

function resolveDailyQuizProgress(quizItems: QuizItem[], todayYmd: string) {
  if (quizItems.length === 0) return null;

  const allIds = quizItems.map((quiz) => quiz.id);
  const availableIds = new Set(allIds);
  const stored = readDailyQuizProgress();
  const knownIds = new Set(stored?.catalogIds.length ? stored.catalogIds : allIds);

  let remainingIds = (stored?.remainingIds ?? []).filter((quizId) => availableIds.has(quizId));
  let currentId = stored?.currentId && availableIds.has(stored.currentId) ? stored.currentId : null;

  const referencedIds = new Set(remainingIds);
  if (currentId) {
    referencedIds.add(currentId);
  }

  const incomingIds = allIds.filter((quizId) => !knownIds.has(quizId) && !referencedIds.has(quizId));
  if (incomingIds.length > 0) {
    remainingIds = insertIdsRandomly(remainingIds, incomingIds);
  }

  if (!currentId) {
    const initialSelection = pickNextDailyQuiz(allIds, remainingIds);
    currentId = initialSelection.currentId;
    remainingIds = initialSelection.remainingIds;
  }

  const daysElapsed = stored ? getDaysBetween(stored.currentDate, todayYmd) : 0;
  for (let step = 0; step < daysElapsed; step += 1) {
    const nextSelection = pickNextDailyQuiz(allIds, remainingIds);
    currentId = nextSelection.currentId;
    remainingIds = nextSelection.remainingIds;
  }

  const isRevealStateReusable = stored?.revealedDate === todayYmd && stored?.revealedId === currentId;
  const nextProgress: DailyQuizProgress = {
    currentDate: todayYmd,
    currentId,
    remainingIds,
    catalogIds: allIds,
    revealedDate: isRevealStateReusable ? todayYmd : null,
    revealedId: isRevealStateReusable ? currentId : null,
  };

  writeDailyQuizProgress(nextProgress);
  return nextProgress;
}

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function isRawCsvRowArray(value: unknown): value is RawCsvRow[] {
  return Array.isArray(value) && value.every((item) => item !== null && typeof item === "object" && !Array.isArray(item));
}

function parseYmd(input: string) {
  const [y, m, d] = input.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatYmd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
}

function formatDisplayDate(input: string) {
  const d = parseYmd(input);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${weekday})`;
}

function formatTimeRange(time?: string | null, endTime?: string | null) {
  if (time && endTime) return `${time} - ${endTime}`;
  if (time) return time;
  return "終日";
}

function formatPeriodEndpoint(date: string, time?: string | null) {
  return time ? `${formatDisplayDate(date)} ${time}` : formatDisplayDate(date);
}

function getSafeExternalUrl(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number) {
  const first = new Date(year, month, 1);
  const day = first.getDay();
  const offset = (weekday - day + 7) % 7;
  return new Date(year, month, 1 + offset + 7 * (nth - 1));
}

function equinoxDay(year: number, spring: boolean) {
  const yearOffset = year - 1980;
  if (spring) {
    return Math.floor(20.8431 + 0.242194 * yearOffset - Math.floor(yearOffset / 4));
  }
  return Math.floor(23.2488 + 0.242194 * yearOffset - Math.floor(yearOffset / 4));
}

function getJapaneseHolidays(year: number) {
  const holidays = new Set<string>();
  const add = (date: Date) => holidays.add(formatYmd(date));

  add(new Date(year, 0, 1));
  add(nthWeekdayOfMonth(year, 0, 1, 2));
  add(new Date(year, 1, 11));
  add(new Date(year, 3, 29));
  add(new Date(year, 4, 3));
  add(new Date(year, 4, 4));
  add(new Date(year, 4, 5));
  add(nthWeekdayOfMonth(year, 6, 1, 3));
  add(new Date(year, 7, 11));
  add(nthWeekdayOfMonth(year, 8, 1, 3));
  add(nthWeekdayOfMonth(year, 9, 1, 2));
  add(new Date(year, 10, 3));
  add(new Date(year, 10, 23));
  add(new Date(year, 1, 23));

  add(new Date(year, 2, equinoxDay(year, true)));
  add(new Date(year, 8, equinoxDay(year, false)));

  const originals = Array.from(holidays);
  for (const dateStr of originals) {
    const date = parseYmd(dateStr);
    if (date.getDay() === 0) {
      const substitute = new Date(date);
      do {
        substitute.setDate(substitute.getDate() + 1);
      } while (holidays.has(formatYmd(substitute)));
      add(substitute);
    }
  }

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    const key = formatYmd(current);
    if (!holidays.has(key)) {
      const prev = new Date(current);
      prev.setDate(prev.getDate() - 1);
      const next = new Date(current);
      next.setDate(next.getDate() + 1);
      if (holidays.has(formatYmd(prev)) && holidays.has(formatYmd(next))) {
        add(current);
      }
    }
  }

  return holidays;
}

const holidayCache = new Map<number, Set<string>>();

function isJapaneseHoliday(date: Date) {
  const year = date.getFullYear();
  if (!holidayCache.has(year)) {
    holidayCache.set(year, getJapaneseHolidays(year));
  }
  return holidayCache.get(year)!.has(formatYmd(date));
}

function formatPeriod(event: EventItem) {
  if (event.endDate && event.endDate !== event.date) {
    return `${formatPeriodEndpoint(event.date, event.time)} → ${formatPeriodEndpoint(event.endDate, event.endTime)}`;
  }
  return `${formatDisplayDate(event.date)} / ${formatTimeRange(event.time, event.endTime)}`;
}

function scrollToHeaderTarget(target: string) {
  if (target === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const section = document.querySelector(target);
  if (!section) return;

  const headerHeight = (document.querySelector(".header-nav") as HTMLElement | null)?.offsetHeight || 0;
  const offsetTop = section.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
  window.scrollTo({ top: Math.max(offsetTop, 0), behavior: "smooth" });
}

function isSameDate(a: string, b: string) {
  return a === b;
}

function isInRange(target: string, start: string, end?: string | null) {
  if (!end) return target === start;
  return target >= start && target <= end;
}

function getMonthMatrix(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const start = new Date(year, month, 1 - startDay);

  return Array.from({ length: 42 }, (_, i) => {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    return current;
  });
}

function getSortedEvents(events: EventItem[]) {
  return [...events].sort((a, b) => {
    const ak = `${a.date} ${a.time ?? "99:99"}`;
    const bk = `${b.date} ${b.time ?? "99:99"}`;
    return ak.localeCompare(bk);
  });
}

function countActiveOn(date: string, events: EventItem[]) {
  return events.filter((event) => isInRange(date, event.date, event.endDate)).length;
}

function chooseReferenceDate(events: EventItem[], systemDate: string) {
  if (countActiveOn(systemDate, events) > 0) return systemDate;
  const future = getSortedEvents(events.filter((event) => event.date >= systemDate));
  if (future.length > 0) return future[0].date;
  return getSortedEvents(events).slice(-1)[0]?.date ?? systemDate;
}

function getCategoryTone(category: string) {
  if (["ライブ", "舞台挨拶", "トークイベント"].includes(category)) {
    return {
      badge: "tone-live-badge",
      mini: "tone-live-mini",
    };
  }
  if (["配信", "先行配信", "ラジオ"].includes(category)) {
    return {
      badge: "tone-stream-badge",
      mini: "tone-stream-mini",
    };
  }
  if (["リリース", "物販", "ポップアップストア"].includes(category)) {
    return {
      badge: "tone-release-badge",
      mini: "tone-release-mini",
    };
  }
  if (["コラボ", "スタンプラリー"].includes(category)) {
    return {
      badge: "tone-collab-badge",
      mini: "tone-collab-mini",
    };
  }
  if (["申込", "当落発表", "記念日", "映画"].includes(category)) {
    return {
      badge: "tone-special-badge",
      mini: "tone-special-mini",
    };
  }
  return {
    badge: "tone-other-badge",
    mini: "tone-other-mini",
  };
}

function EventBadge({ category }: { category: string }) {
  const tone = getCategoryTone(category);
  return <span className={cn("event-badge", tone.badge)}>{category}</span>;
}

function DecorativeBackground() {
  return (
    <div className="hero-bg">
      <div className="hero-bg-layer" />
      <div className="hero-grid" />

      <motion.div
        className="hero-orb hero-orb-left"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <div className="hero-orb-inner hero-orb-inner-1" />
        <div className="hero-orb-inner hero-orb-inner-2" />
      </motion.div>

      <motion.div
        className="hero-orb hero-orb-right"
        animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="hero-orb-inner hero-orb-inner-1" />
      </motion.div>

      <div className="hero-eq">
        {Array.from({ length: 32 }).map((_, i) => (
          <motion.div
            key={i}
            className="hero-eq-bar"
            animate={{ height: [18 + (i % 6) * 5, 42 + (i % 8) * 6, 20 + (i % 4) * 8] }}
            transition={{ duration: 1.8 + (i % 5) * 0.2, repeat: Infinity, repeatType: "mirror" }}
          />
        ))}
      </div>
    </div>
  );
}

function HeaderNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const plannedCount = headerNavItems.filter((item) => item.status === "coming-soon").length;
  const availableCount = headerNavItems.filter((item) => item.status === "available").length;

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1080) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const [activeNavKey, setActiveNavKey] = useState<string>(() => headerNavItems.find((i) => i.emphasis === "primary")?.key ?? headerNavItems[0].key);

  const handleNavClick = (item: HeaderNavItem) => {
    if (item.status !== "available" || !item.target) return;
    setIsMobileMenuOpen(false);
    setActiveNavKey(item.key);
    scrollToHeaderTarget(item.target);
  };

  return (
    <header className="header-nav">
      <div className="shell header-inner">
        <button className="brand brand-button" type="button" onClick={() => handleNavClick(headerNavItems[0])} aria-label="ページ先頭へ戻る">
          <div className="brand-icon">
            <Music4 className="icon-20" />
          </div>
          <div className="brand-copy">
            <div className="brand-title">ガルクラの箱</div>
            <div className="brand-route">
              <span className="brand-chip brand-chip-current">TOP</span>
            </div>
          </div>
        </button>

        <nav className="menu-desktop" aria-label="サイト内メニュー">
          {headerNavItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={cn(
                "menu-pill",
                activeNavKey === item.key && "menu-pill-active",
                item.status === "coming-soon" && "menu-pill-planned",
              )}
              onClick={() => handleNavClick(item)}
              disabled={item.status === "coming-soon"}
              aria-disabled={item.status === "coming-soon"}
            >
              <span className="menu-pill-label">{item.label}</span>
              {item.status === "coming-soon" ? (
                <span className="menu-pill-badge">準備中</span>
              ) : activeNavKey === item.key ? (
                <span className="menu-pill-badge menu-pill-badge-current">現在地</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="button icon-button mobile-only header-menu-button"
            type="button"
            aria-label={isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-site-menu"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X className="icon-18" /> : <Menu className="icon-18" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.button
              className="mobile-nav-backdrop"
              type="button"
              aria-label="メニューを閉じる"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              id="mobile-site-menu"
              className="shell mobile-nav-shell"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
            >
              <div className="mobile-nav-sheet">
                <div className="mobile-nav-head">
                  <div className="eyebrow pink">top / schedule hub</div>
                  <h2 className="mobile-nav-title">今はスケジュール中心のトップページ</h2>
                  <p className="mobile-nav-copy">
                    記念日一覧、公式リンク一覧、クイズに挑戦は順次追加予定です。まずは今の予定と直近の動きを見やすく整理します。
                  </p>
                  <div className="mobile-nav-summary">
                    <span className="mobile-nav-summary-pill">公開中 {availableCount} 導線</span>
                    <span className="mobile-nav-summary-pill mobile-nav-summary-pill-muted">準備中 {plannedCount} ページ</span>
                  </div>
                </div>

                <div className="mobile-nav-list">
                  {headerNavItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={cn(
                        "mobile-nav-item",
                        activeNavKey === item.key && "mobile-nav-item-current",
                        item.status === "coming-soon" && "mobile-nav-item-planned",
                      )}
                      onClick={() => handleNavClick(item)}
                      disabled={item.status === "coming-soon"}
                      aria-disabled={item.status === "coming-soon"}
                    >
                      <span className="mobile-nav-item-row">
                        <span className="mobile-nav-item-label">{item.label}</span>
                        <span
                          className={cn(
                            "mobile-nav-item-badge",
                            item.status === "coming-soon" && "mobile-nav-item-badge-muted",
                          )}
                        >
                          {item.status === "coming-soon" ? "準備中" : activeNavKey === item.key ? "表示中" : "移動"}
                        </span>
                      </span>
                      <span className="mobile-nav-item-description">{item.description}</span>
                    </button>
                  ))}
                </div>

                {/* 公式サイトリンクはヘッダーから削除済み */}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

function RealtimeClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const weekday = ["日", "月", "火", "水", "木", "金", "土"][now.getDay()];
  const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}(${weekday})`;
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  return (
    <div className="hero-clock-tile">
      <div className="hero-clock-head">
        <Clock3 className="icon-16" />
        <span className="hero-clock-label">現在日時</span>
      </div>
      <div className="hero-clock-date">{dateStr}</div>
      <div className="hero-clock-time">{timeStr}</div>
    </div>
  );
}

function getQuizTextDensityClass(text: string) {
  if (text.length >= 180) return "hero-quiz-text-dense";
  if (text.length >= 110) return "hero-quiz-text-compact";
  return undefined;
}

function DailyQuiz({ quizItems }: { quizItems: QuizItem[] }) {
  const [todayYmd, setTodayYmd] = useState(() => getTokyoTodayYmd());
  const [progress, setProgress] = useState<DailyQuizProgress | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextTodayYmd = getTokyoTodayYmd();
      setTodayYmd((current) => (current === nextTodayYmd ? current : nextTodayYmd));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setProgress(resolveDailyQuizProgress(quizItems, todayYmd));
  }, [quizItems, todayYmd]);

  const quiz = useMemo(() => {
    if (!progress?.currentId) return null;
    return quizItems.find((item) => item.id === progress.currentId) ?? null;
  }, [progress?.currentId, quizItems]);

  const revealed = Boolean(progress && progress.revealedDate === todayYmd && progress.revealedId === progress.currentId);

  const handleClick = () => {
    if (!progress || !progress.currentId || revealed) return;

    const nextProgress: DailyQuizProgress = {
      ...progress,
      revealedDate: todayYmd,
      revealedId: progress.currentId,
    };

    setProgress(nextProgress);
    writeDailyQuizProgress(nextProgress);
  };

  if (!quiz) return null;

  const questionDensityClass = getQuizTextDensityClass(quiz.question);
  const answerDensityClass = getQuizTextDensityClass(quiz.answer);

  return (
    <motion.button
      type="button"
      className={cn("hero-quiz-tile", revealed && "hero-quiz-tile-revealed")}
      onClick={handleClick}
      whileTap={revealed ? undefined : { scale: 0.97 }}
    >
      <div className="hero-quiz-head">
        <HelpCircle className="icon-16" />
        <span className="hero-quiz-label">今日の一問</span>
        {revealed && <Eye className="icon-14 hero-quiz-hint-icon" />}
      </div>
      <div className="hero-quiz-body">
        <div className={cn("hero-quiz-question", questionDensityClass)}>{quiz.question}</div>
        <AnimatePresence mode="wait">
          {revealed ? (
            <motion.div
              key="answer"
              className={cn("hero-quiz-answer", answerDensityClass)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              A. {quiz.answer}
            </motion.div>
          ) : (
            <motion.div
              key="prompt"
              className="hero-quiz-tap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              タップで答えを見る
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="hero-quiz-refresh-hint">次の出題は 0:00 に切り替わります</div>
    </motion.button>
  );
}

function HeroSection({
  quizItems,
}: {
  quizItems: QuizItem[];
}) {
  return (
    <section className="hero-card">
      <DecorativeBackground />
      <div className="hero-content">
        <div className="hero-top">
          <div className="hero-copy">
            <div className="hero-chip">
              <Sparkles className="icon-14" />
              fan made GBC portal
            </div>

            <h1 className="hero-title">【非公式】ガルクラの箱</h1>

            <p className="hero-note">本サイトについては画面最下部に記載しています。ご確認ください。</p>
          </div>

          <div className="hero-widgets">
            <RealtimeClock />
            <DailyQuiz quizItems={quizItems} />
          </div>
        </div>
      </div>
    </section>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const safeOfficialLink = getSafeExternalUrl(event.officialLink);

  return (
    <article className="event-card">
      <div className="event-meta-row">
        <EventBadge category={event.category} />
        <span className="muted-text">{formatPeriod(event)}</span>
      </div>
      <h3 className="event-title">{event.title}</h3>
      <div className="event-detail-grid">
        <div>時間：{formatTimeRange(event.time, event.endTime)}</div>
        <div>場所：{event.place ?? "-"}</div>
      </div>
      {event.note && <p className="event-note">{event.note}</p>}
      {safeOfficialLink && (
        <a className="event-link" href={safeOfficialLink} target="_blank" rel="noopener noreferrer">
          <LinkIcon className="icon-14" />
          公式リンクを開く
        </a>
      )}
    </article>
  );
}

function EventModal({ event, onClose }: { event: EventItem; onClose: () => void }) {
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="close">
          ×
        </button>
        <EventCard event={event} />
      </motion.div>
    </motion.div>
  );
}

function UpcomingButton({ view }: { view: ViewKey }) {
  const handleTopClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewClick = () => {
    const section = document.querySelector('#schedule-switch');
    if (section) {
      const headerHeight = (document.querySelector('.header-nav') as HTMLElement | null)?.offsetHeight || 0;
      const offsetTop = section.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20; // 少し余裕を
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  const handleUpcomingClick = () => {
    const section = document.querySelector('#upcoming-section');
    if (section) {
      const headerHeight = (document.querySelector('.header-nav') as HTMLElement | null)?.offsetHeight || 0;
      const offsetTop = section.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20; // 少し余裕を
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  return (
    <div className="upcoming-buttons">
      <motion.button
        className="upcoming-button"
        onClick={handleTopClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        aria-label="scroll to top"
      >
        <ChevronUp className="icon-16" />
        <span>TOP</span>
      </motion.button>

      <motion.button
        className="upcoming-button"
        onClick={handleViewClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.1 }}
        aria-label="scroll to schedule switch"
      >
        {view === "focus" ? <Clock3 className="icon-16" /> : view === "timeline" ? <GanttChart className="icon-16" /> : <CalendarDays className="icon-16" />}
        <span>{view === "focus" ? "今日" : view === "timeline" ? "タイムライン" : "カレンダー"}</span>
      </motion.button>

      <motion.button
        className="upcoming-button"
        onClick={handleUpcomingClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.2 }}
        aria-label="scroll to upcoming events"
      >
        <CalendarDays className="icon-16" />
        <span>直近</span>
      </motion.button>
    </div>
  );
}

/* ─── Timeline helpers ─── */

function getWeekRange(baseDate: string) {
  const d = parseYmd(baseDate);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

function getTimelineBarColor(category: string) {
  if (["ライブ", "舞台挨拶", "トークイベント"].includes(category)) return { strong: "#ec4899", light: "#fbcfe8" };
  if (["配信", "先行配信", "ラジオ"].includes(category)) return { strong: "#0ea5e9", light: "#bae6fd" };
  if (["リリース", "物販", "ポップアップストア"].includes(category)) return { strong: "#10b981", light: "#a7f3d0" };
  if (["コラボ", "スタンプラリー"].includes(category)) return { strong: "#8b5cf6", light: "#ddd6fe" };
  if (["申込", "当落発表", "記念日", "映画"].includes(category)) return { strong: "#f97316", light: "#fed7aa" };
  return { strong: "#64748b", light: "#e2e8f0" };
}

function buildTimelineBarStyle(
  event: EventItem,
  weekDays: Date[],
): { startCol: number; span: number; gradient: string } | null {
  const weekStart = formatYmd(weekDays[0]);
  const weekEnd = formatYmd(weekDays[6]);
  const eventEnd = event.endDate ?? event.date;

  if (event.date > weekEnd || eventEnd < weekStart) return null;

  const clampedStart = event.date < weekStart ? weekStart : event.date;
  const clampedEnd = eventEnd > weekEnd ? weekEnd : eventEnd;

  const startCol = weekDays.findIndex((d) => formatYmd(d) === clampedStart);
  const endIdx = weekDays.findIndex((d) => formatYmd(d) === clampedEnd);
  if (startCol === -1 || endIdx === -1) return null;
  const span = endIdx - startCol + 1;

  const { strong, light } = getTimelineBarColor(event.category);

  const isEventStart = event.date >= weekStart;
  const isEventEnd = eventEnd <= weekEnd;

  let gradient: string;
  if (span === 1) {
    gradient = strong;
  } else if (isEventStart && isEventEnd) {
    gradient = `linear-gradient(90deg, ${strong} 0%, ${light} 30%, ${light} 70%, ${strong} 100%)`;
  } else if (isEventStart) {
    gradient = `linear-gradient(90deg, ${strong} 0%, ${light} 40%, ${light} 100%)`;
  } else if (isEventEnd) {
    gradient = `linear-gradient(90deg, ${light} 0%, ${light} 60%, ${strong} 100%)`;
  } else {
    gradient = light;
  }

  return { startCol, span, gradient };
}

function TimelineView({
  events,
  referenceDate,
  setSelectedEvent,
  view,
}: {
  events: EventItem[];
  referenceDate: string;
  setSelectedEvent: (event: EventItem) => void;
  view: ViewKey;
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const anchorDate = useMemo(() => {
    const d = parseYmd(referenceDate);
    d.setDate(d.getDate() + weekOffset * 7);
    return formatYmd(d);
  }, [referenceDate, weekOffset]);

  const weekDays = useMemo(() => getWeekRange(anchorDate), [anchorDate]);

  const weekEvents = useMemo(() => {
    const weekStart = formatYmd(weekDays[0]);
    const weekEnd = formatYmd(weekDays[6]);
    return getSortedEvents(
      events.filter((event) => {
        const eventEnd = event.endDate ?? event.date;
        return event.date <= weekEnd && eventEnd >= weekStart;
      }),
    );
  }, [events, weekDays]);

  const goToToday = () => setWeekOffset(0);

  const weekLabel = (() => {
    const s = weekDays[0];
    const e = weekDays[6];
    return `${s.getMonth() + 1}/${s.getDate()} – ${e.getMonth() + 1}/${e.getDate()}`;
  })();

  return (
    <div className="timeline-layout">
      <section className="panel" id="timeline-section">
        <div className="panel-head">
          <div>
            <div className="eyebrow teal">weekly timeline</div>
            <h2 className="panel-title">タイムライン表示</h2>
          </div>
          <div className="month-toolbar">
            <button className="button icon-button" type="button" onClick={() => setWeekOffset((p) => p - 1)} aria-label="前の週">
              <ChevronLeft className="icon-18" />
            </button>
            <div className="month-label">{weekLabel}</div>
            <button className="button icon-button" type="button" onClick={() => setWeekOffset((p) => p + 1)} aria-label="次の週">
              <ChevronRight className="icon-18" />
            </button>
            <button className="button pink-soft-button" type="button" onClick={goToToday}>
              今週へ戻る
            </button>
          </div>
        </div>

        {/* Day header row */}
        <div className="timeline-day-header">
          {weekDays.map((day) => {
            const ymd = formatYmd(day);
            const isToday = ymd === referenceDate;
            const dow = ["日", "月", "火", "水", "木", "金", "土"][day.getDay()];
            const isHoliday = isJapaneseHoliday(day);
            return (
              <div
                key={ymd}
                className={cn(
                  "timeline-day-cell",
                  isToday && "timeline-day-today",
                  day.getDay() === 6 && "timeline-day-sat",
                  (day.getDay() === 0 || isHoliday) && "timeline-day-sun",
                )}
              >
                <span className="timeline-dow">{dow}</span>
                <span className="timeline-date-num">{day.getDate()}</span>
              </div>
            );
          })}
        </div>

        {/* Event bars */}
        <div className="timeline-body">
          {weekEvents.length === 0 ? (
            <div className="empty-card">この週に重なるイベントはありません。</div>
          ) : (
            weekEvents.map((event) => {
              const bar = buildTimelineBarStyle(event, weekDays);
              if (!bar) return null;
              return (
                <div key={event.id} className="timeline-row" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {bar.startCol > 0 && <div style={{ gridColumn: `1 / ${bar.startCol + 1}` }} />}
                  <div
                    className="timeline-bar"
                    style={{
                      gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
                      background: bar.gradient,
                    }}
                    onClick={() => setSelectedEvent(event)}
                    title={event.title}
                  >
                    <span className="timeline-bar-label">{event.title}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
      <UpcomingButton view={view} />
    </div>
  );
}

function FocusView({ events, referenceDate, setSelectedEvent, view }: { events: EventItem[]; referenceDate: string; setSelectedEvent: (event: EventItem) => void; view: ViewKey }) {
  const focusEvents = getSortedEvents(events.filter((event) => isInRange(referenceDate, event.date, event.endDate)));
  const upcomingSoon = getSortedEvents(events.filter((event) => event.date >= referenceDate)).slice(0, 5);

  return (
    <div className="two-column">
      <section className="panel" id="focus-section">
        <div className="panel-head">
          <div>
            <div className="eyebrow pink">focus day</div>
            <h2 className="panel-title">今日の予定</h2>
          </div>
          <div className="date-pill">{formatDisplayDate(referenceDate)}</div>
        </div>

        <div className="stack-gap">
          {focusEvents.length === 0 ? (
            <div className="empty-card">この日に重なる掲載イベントはありません。</div>
          ) : (
            <div className="mini-list">
              {focusEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div className="mini-card" onClick={() => setSelectedEvent(event)}>
                    <div className="mini-card-date">{formatPeriod(event)}</div>
                    <div className="mini-card-title">{event.title}</div>
                    <div className="mini-card-place">{event.place ?? "-"}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="sidebar-stack">

        <section className="panel" id="upcoming-section">
          <div className="panel-subtitle">
            <CalendarDays className="icon-16 sky-icon" />
            直近の予定
          </div>
          <div className="mini-list">
            {upcomingSoon.map((event) => (
              <div key={event.id} className="mini-card" onClick={() => setSelectedEvent(event)}>
                <div className="mini-card-date">{formatPeriod(event)}</div>
                <div className="mini-card-title">{event.title}</div>
                <div className="mini-card-place">{event.place ?? "-"}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <UpcomingButton view={view} />
    </div>
  );
}

function CalendarView({
  events,
  monthDate,
  setMonthDate,
  referenceDate,
  setSelectedEvent,
  view,
}: {
  events: EventItem[];
  monthDate: Date;
  setMonthDate: React.Dispatch<React.SetStateAction<Date>>;
  referenceDate: string;
  setSelectedEvent: (event: EventItem) => void;
  view: ViewKey;
}) {
  const cells = useMemo(() => getMonthMatrix(monthDate), [monthDate]);
  const currentMonth = monthDate.getMonth();
  const [selectedDate, setSelectedDate] = useState(referenceDate);

  const dayEventCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    const visibleStart = cells[0];
    const visibleEnd = cells[cells.length - 1];

    if (!visibleStart || !visibleEnd) return counts;

    const visibleStartKey = formatYmd(visibleStart);
    const visibleEndKey = formatYmd(visibleEnd);

    for (const event of events) {
      const eventEnd = event.endDate ?? event.date;
      if (event.date > visibleEndKey || eventEnd < visibleStartKey) continue;

      const rangeStart = parseYmd(event.date < visibleStartKey ? visibleStartKey : event.date);
      const rangeEnd = parseYmd(eventEnd > visibleEndKey ? visibleEndKey : eventEnd);

      for (const current = new Date(rangeStart); current <= rangeEnd; current.setDate(current.getDate() + 1)) {
        const key = formatYmd(current);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return counts;
  }, [cells, events]);

  const selectedDayEvents = useMemo(() => {
    return getSortedEvents(events.filter((event) => isInRange(selectedDate, event.date, event.endDate)));
  }, [events, selectedDate]);

  useEffect(() => {
    setSelectedDate(referenceDate);
  }, [referenceDate]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      const element = document.querySelector('#selected-day-section');
      if (element) {
        const headerHeight = (document.querySelector('.header-nav') as HTMLElement | null)?.offsetHeight || 0;
        const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
        window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    }
  }, [selectedDate]);

  const goToReference = () => {
    const d = parseYmd(referenceDate);
    setMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(referenceDate);
  };

  const moveMonth = (diff: number) => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + diff, 1));
  };

  return (
    <div className="calendar-layout">
      <section className="panel" id="calendar-section">
        <div className="panel-head">
          <div>
            <div className="eyebrow violet">monthly calendar</div>
            <h2 className="panel-title">カレンダー表示</h2>
          </div>

          <div className="month-toolbar">
            <button className="button icon-button" type="button" onClick={() => moveMonth(-1)} aria-label="previous month">
              <ChevronLeft className="icon-18" />
            </button>
            <div className="month-label">{formatMonthLabel(monthDate)}</div>
            <button className="button icon-button" type="button" onClick={() => moveMonth(1)} aria-label="next month">
              <ChevronRight className="icon-18" />
            </button>
            <button className="button pink-soft-button" type="button" onClick={goToReference}>
              今日へ戻る
            </button>
          </div>
        </div>

        <div className="weekdays">
          {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
            <div key={w} className="weekday">
              {w}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {cells.map((day) => {
            const ymd = formatYmd(day);
            const dayEventCount = dayEventCountMap.get(ymd) ?? 0;
            const isCurrentMonth = day.getMonth() === currentMonth;
            const isReference = isSameDate(ymd, referenceDate);
            const isSelected = isSameDate(ymd, selectedDate);
            const isHoliday = isJapaneseHoliday(day);
            const dayNumberClass = cn(
              "calendar-day-number",
              day.getDay() === 6 && "calendar-day-number-saturday",
              (day.getDay() === 0 || isHoliday) && "calendar-day-number-sunday"
            );
            return (
              <button
                key={ymd}
                type="button"
                className={cn(
                  "calendar-cell",
                  isCurrentMonth ? "calendar-cell-current" : "calendar-cell-outside",
                  isReference && "calendar-cell-reference",
                  isSelected && "calendar-cell-selected"
                )}
                onClick={() => setSelectedDate(ymd)}
              >
                <div className="calendar-cell-head">
                  <span className={dayNumberClass}>{day.getDate()}</span>
                </div>

                <div className="calendar-cell-body">
                  {dayEventCount > 0 ? (
                    <div className="calendar-event-summary">
                      <div className="calendar-event-count">
                        <span>{dayEventCount}</span>
                        <small>件</small>
                      </div>
                      <div className="calendar-event-label">予定</div>
                    </div>
                  ) : (
                    <div className="calendar-empty">予定なし</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="panel sidebar-stack">
        <section className="panel" id="selected-day-section">
          <div className="panel-head compact">
            <div>
              <div className="eyebrow pink">selected day</div>
              <h3 className="panel-title small-title">{formatDisplayDate(selectedDate)} の予定</h3>
              <div className="muted-text">全 {selectedDayEvents.length} 件</div>
            </div>
            {isSameDate(selectedDate, referenceDate) && <span className="date-pill">今日</span>}
          </div>

          <div className="selected-note">
            カレンダーではその日の予定件数のみを表示します。日付を押すとここにその日の詳細を展開し、右側で確認できます。
          </div>

          <div className="selected-list">
            {selectedDayEvents.length === 0 ? (
              <div className="empty-card">この日に登録されているイベントはありません。</div>
            ) : (
              selectedDayEvents.map((event) => (
                <div key={event.id} className="mini-card" onClick={() => setSelectedEvent(event)}>
                  <div className="mini-card-date">{formatPeriod(event)}</div>
                  <div className="mini-card-title">{event.title}</div>
                  <div className="mini-card-place">{event.place ?? "-"}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel" id="upcoming-section">
          <div className="panel-subtitle">
            <CalendarDays className="icon-16 sky-icon" />
            直近の予定
          </div>
          <div className="mini-list">
            {getSortedEvents(events.filter((event) => event.date >= referenceDate))
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="mini-card" onClick={() => setSelectedEvent(event)}>
                  <div className="mini-card-date">{formatPeriod(event)}</div>
                  <div className="mini-card-title">{event.title}</div>
                  <div className="mini-card-place">{event.place ?? "-"}</div>
                </div>
              ))}
          </div>
        </section>
      </aside>
      <UpcomingButton view={view} />
    </div>
  );
}

export default function App() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const systemDate = getTokyoTodayYmd();
  const referenceDate = useMemo(() => chooseReferenceDate(events, systemDate), [events, systemDate]);
  const [view, setView] = useState<ViewKey>("focus");
  const [monthDate, setMonthDate] = useState(() => {
    const d = parseYmd(systemDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEventsFromJson() {
      try {
        const response = await fetch(eventsJsonPath, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`events.json request failed: ${response.status}`);
        }

        const payload = await response.json();
        if (!isRawCsvRowArray(payload)) {
          throw new Error("events.json must be an array of row objects");
        }

        if (!cancelled) {
          setEvents(getSortedEvents(parseCsvRows(payload)));
        }
      } catch (error) {
        console.error("Failed to load public/data/events.json.", error);
      }
    }

    void loadEventsFromJson();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadQuiz() {
      try {
        const res = await fetch(quizJsonPath, { cache: "no-store" });
        if (!res.ok) throw new Error(`quiz.json request failed: ${res.status}`);
        const payload = await res.json();
        if (!cancelled) setQuizItems(parseQuizJson(payload));
      } catch (err) {
        console.error("Failed to load public/data/quiz.json.", err);
      }
    }
    void loadQuiz();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const d = parseYmd(referenceDate);
    setMonthDate((prev) => {
      if (prev.getFullYear() === d.getFullYear() && prev.getMonth() === d.getMonth()) {
        return prev;
      }
      return new Date(d.getFullYear(), d.getMonth(), 1);
    });
  }, [referenceDate]);

  return (
    <div className="page-shell">
      <HeaderNav />

      <main className="shell main-stack">
        <HeroSection
          quizItems={quizItems}
        />

        <section className="panel" id="schedule-switch">
          <div className="panel-head">
            <div>
              <div className="eyebrow muted">schedule hub</div>
              <h2 className="panel-title">スケジュール表示切替</h2>
            </div>

            <div className="tab-row">
              {viewTabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  className={cn("tab-button", view === key && "tab-button-active")}
                  onClick={() => setView(key)}
                >
                  <Icon className="icon-16" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {view === "focus" && (
            <motion.div
              key="focus"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <FocusView events={events} referenceDate={referenceDate} setSelectedEvent={setSelectedEvent} view={view} />
            </motion.div>
          )}

          {view === "timeline" && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <TimelineView events={events} referenceDate={referenceDate} setSelectedEvent={setSelectedEvent} view={view} />
            </motion.div>
          )}

          {view === "calendar" && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <CalendarView
                events={events}
                monthDate={monthDate}
                setMonthDate={setMonthDate}
                referenceDate={referenceDate}
                setSelectedEvent={setSelectedEvent}
                view={view}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="footer-card">
          <div className="footer-title">今後の実装候補</div>
          <div className="footer-text">
            カテゴリ絞り込み / 検索 / 地域別ページ / 画像付きカード / 締切強調 / 外部リンク集 / アーカイブ整理。
          </div>

          <div className="notice-card">
            <div className="notice-title">
              <CircleAlert className="icon-16" />
              ご案内
            </div>
            <div className="notice-body">
              <p>
                本ページは『ガールズバンドクライ』および関係各社とは一切関係のない、個人による非公式ファンメモです。
                情報の正確性・最新性は保証できません。本ページの情報に基づいて利用者の方に生じたいかなる損害・トラブルについても、
                管理人は一切の責任を負いかねます。あらかじめご了承ください。
              </p>
              <p>
                ＜内容＞
                <br />
                公式及び公式に準じるところから発信された情報を中心にまとめたものです。
              </p>
            </div>
          </div>
        </footer>
      </main>

      <AnimatePresence>
        {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </AnimatePresence>
    </div>
  );
}
