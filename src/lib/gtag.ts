/**
 * GA4 (gtag.js) ヘルパー
 * index.html で読み込んだ gtag.js と連携する薄いラッパー。
 */

const GA_MEASUREMENT_ID = "G-SEPSCRC1H6";

/* ---------- 型定義 ---------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GtagFn = (...args: any[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

/* ---------- 低レベル ---------- */

function gtag(...args: Parameters<GtagFn>) {
  if (typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

/* ---------- ページビュー ---------- */

/**
 * SPA のルート遷移時に呼び出す。
 * GA4 の enhanced measurement が自動取得する page_view は初回ロードのみなので、
 * React Router の location 変更時にこれを呼んで各ページの PV を計測する。
 */
export function trackPageView(path: string, title?: string) {
  gtag("config", GA_MEASUREMENT_ID, {
    page_path: path,
    ...(title ? { page_title: title } : {}),
  });
}

/* ---------- カスタムイベント ---------- */

export function trackEvent(
  action: string,
  params?: Record<string, string | number | boolean>,
) {
  gtag("event", action, params);
}

/* ── クイズ関連 ── */

export function trackQuizStart() {
  trackEvent("quiz_start");
}

export function trackQuizAnswer(questionId: string, isCorrect: boolean) {
  trackEvent("quiz_answer", {
    question_id: questionId,
    result: isCorrect ? "correct" : "wrong",
  });
}

export function trackQuizComplete(
  correctCount: number,
  totalCount: number,
  scorePercent: number,
) {
  trackEvent("quiz_complete", {
    correct_count: correctCount,
    total_count: totalCount,
    score_percent: scorePercent,
  });
}

/* ── 外部リンククリック ── */

export function trackOutboundLink(url: string, label?: string) {
  trackEvent("click", {
    event_category: "outbound",
    event_label: label ?? url,
    link_url: url,
  });
}

/* ── 記念日ページ フィルター変更 ── */

export function trackDatesFilter(filter: string) {
  trackEvent("dates_filter", {
    filter_value: filter,
  });
}
