
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
  ExternalLink,
  Menu,
  Link as LinkIcon,
  ChevronUp,
} from "lucide-react";
import { eventsData, type EventItem } from "./data/events";

type ViewKey = "focus" | "calendar";

const viewTabs: Array<{ key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "focus", label: "今日", icon: Clock3 },
  { key: "calendar", label: "カレンダー", icon: CalendarDays },
];

const topMenu = ["TOP", "スケジュール", "ライブ", "配信/メディア", "リリース", "アーカイブ", "データ", "リンク"];

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
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
  if (event.periodText) return event.periodText;
  if (event.endDate && event.endDate !== event.date) {
    return `${formatDisplayDate(event.date)} → ${formatDisplayDate(event.endDate)}`;
  }
  return event.time ? `${formatDisplayDate(event.date)} ${event.time}` : formatDisplayDate(event.date);
}

function isSameDate(a: string, b: string) {
  return a === b;
}

function isInRange(target: string, start: string, end?: string | null) {
  if (!end) return target === start;
  return target >= start && target <= end;
}

function overlapsMonth(event: EventItem, monthDate: Date) {
  const monthStart = formatYmd(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
  const monthEnd = formatYmd(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
  const eventEnd = event.endDate ?? event.date;
  return event.date <= monthEnd && eventEnd >= monthStart;
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
  return (
    <header className="header-nav">
      <div className="shell header-inner">
        <div className="brand">
          <div className="brand-icon">
            <Music4 className="icon-20" />
          </div>
          <div>
            <div className="brand-title">ガルクラの箱</div>
            <div className="brand-subtitle">Girls Band Cry Fan Memo</div>
          </div>
        </div>

        <nav className="menu-desktop">
          {topMenu.map((item) => (
            <button key={item} className="menu-pill">
              {item}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <a className="button ghost-button desktop-only" href="https://girls-band-cry.com/" target="_blank" rel="noreferrer">
            公式サイト
            <ExternalLink className="icon-16" />
          </a>
          <button className="button icon-button mobile-only" type="button" aria-label="menu">
            <Menu className="icon-18" />
          </button>
        </div>
      </div>
    </header>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="stat-tile">
      <div className="stat-head">
        <span className="stat-label">{label}</span>
        <Icon className="icon-16" />
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function HeroSection({
  referenceDate,
  monthCount,
  focusCount,
  categoryCount,
}: {
  referenceDate: string;
  monthCount: number;
  focusCount: number;
  categoryCount: number;
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

            <p className="hero-lead">
              ガールズバンドクライ関連の予定・公開情報・メモを、
              かわいさと視認性の両立を目指して整理するファン向けポータル。
              GitHub Pages 上で軽快に動作し、今後のページ追加にも耐えられる構成を前提にしたトップデザインです。
            </p>
          </div>

          <div className="stats-grid">
            <StatTile icon={CalendarDays} label="今月の予定" value={String(monthCount)} />
            <StatTile icon={Clock3} label="今日の件数" value={String(focusCount)} />
            <StatTile icon={Music4} label="カテゴリ数" value={String(categoryCount)} />
            <StatTile icon={Sparkles} label="基準日" value={formatDisplayDate(referenceDate)} />
          </div>
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
      </div>
    </section>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="info-card">
      <div className="info-title">{title}</div>
      <p className="info-text">{text}</p>
    </div>
  );
}

function EventCard({ event }: { event: EventItem }) {
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
      {event.officialLink && (
        <a className="event-link" href={event.officialLink} target="_blank" rel="noreferrer">
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
        {view === "focus" ? <Clock3 className="icon-16" /> : <CalendarDays className="icon-16" />}
        <span>{view === "focus" ? "今日" : "カレンダー"}</span>
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
                    <div className="mini-card-date">
                      {formatTimeRange(event.time, event.endTime)}
                    </div>
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
        <section className="panel">
          <div className="panel-subtitle">
            <Sparkles className="icon-16 pink-icon" />
            このページで見せたいこと
          </div>
          <div className="stack-gap small-gap">
            <InfoCard title="CSVベース反映" text="今回の Notion CSV から反映したデータをもとに表示しています。" />
            <InfoCard title="今後の拡張" text="カテゴリ絞り込み、画像、地域別まとめ、締切強調などを追加しやすい構成です。" />
            <InfoCard title="表示方針" text="カレンダーは一覧性優先、詳細は右側パネルで深掘りする作りです。" />
          </div>
        </section>

        <section className="panel" id="upcoming-section">
          <div className="panel-subtitle">
            <CalendarDays className="icon-16 sky-icon" />
            直近の予定
          </div>
          <div className="mini-list">
            {upcomingSoon.map((event) => (
              <div key={event.id} className="mini-card" onClick={() => setSelectedEvent(event)}>
                <div className="mini-card-date">
                  {formatDisplayDate(event.date)} / {formatTimeRange(event.time, event.endTime)}
                </div>
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

  const selectedDayEvents = useMemo(() => {
    return getSortedEvents(events.filter((event) => isInRange(selectedDate, event.date, event.endDate)));
  }, [events, selectedDate]);

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
            const dayEvents = getSortedEvents(events.filter((event) => isInRange(ymd, event.date, event.endDate)));
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
                  {dayEvents.length > 0 ? (
                    <div className="calendar-event-summary">
                      <div className="calendar-event-count">
                        <span>{dayEvents.length}</span>
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
                  <div className="mini-card-date">
                    {formatTimeRange(event.time, event.endTime)}
                  </div>
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
                  <div className="mini-card-date">
                    {formatDisplayDate(event.date)} / {formatTimeRange(event.time, event.endTime)}
                  </div>
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
  const events = useMemo(() => getSortedEvents(eventsData), []);
  const systemDate = formatYmd(new Date());
  const referenceDate = useMemo(() => chooseReferenceDate(events, systemDate), [events, systemDate]);
  const [view, setView] = useState<ViewKey>("focus");
  const [monthDate, setMonthDate] = useState(() => {
    const d = parseYmd(referenceDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const monthEvents = useMemo(() => events.filter((event) => overlapsMonth(event, monthDate)), [events, monthDate]);
  const focusEvents = useMemo(() => events.filter((event) => isInRange(referenceDate, event.date, event.endDate)), [events, referenceDate]);
  const categoryCount = useMemo(() => new Set(events.map((event) => event.category)).size, [events]);

  return (
    <div className="page-shell">
      <HeaderNav />

      <main className="shell main-stack">
        <HeroSection
          referenceDate={referenceDate}
          monthCount={monthEvents.length}
          focusCount={focusEvents.length}
          categoryCount={categoryCount}
        />

        <section className="intro-grid">
          <div className="panel" id="schedule-switch">
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

            <div className="info-grid">
              <InfoCard title="今日" text="今日に重なっているイベントを一覧化して把握しやすく表示。" />
              <InfoCard title="タイムライン" text="今日以降の予定を時系列で追いやすい一覧に整理。" />
              <InfoCard title="カレンダー" text="1か月単位で俯瞰しつつ、クリックでその日の全件を確認。" />
            </div>
          </div>

          <div className="panel gradient-panel">
            <div className="panel-subtitle">
              <Music4 className="icon-16 pink-icon" />
              今回のセットについて
            </div>
            <div className="stack-gap small-gap">
              <p className="paragraph">
                これは Vite 初期状態のままでは動かない Tailwind / shadcn 前提モックを、
                <strong> 素の Vite React プロジェクトでもそのまま使える形</strong> に組み直したセットです。
              </p>
              <p className="paragraph">
                そのため、<code>src/App.tsx</code> だけではなく <code>src/index.css</code> と
                <code> src/data/events.ts</code> もセットで入れる前提になっています。
              </p>
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
        </footer>
      </main>

      <AnimatePresence>
        {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      </AnimatePresence>
    </div>
  );
}
