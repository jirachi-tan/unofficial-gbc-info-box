import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { trackPageView } from "./lib/gtag";
import { AnimatePresence, motion } from "framer-motion";
import {
    Music4,
    Menu,
    ExternalLink as ExternalLinkIcon,
    X,
    CircleAlert,
    RefreshCw,
} from "lucide-react";

function cn(...classes: Array<string | false | undefined | null>) {
    return classes.filter(Boolean).join(" ");
}

type HeaderNavItem = {
    key: string;
    label: string;
    shortLabel: string;
    description: string;
    path: string;
};

const headerNavItems: HeaderNavItem[] = [
    {
        key: "top",
        label: "TOP",
        shortLabel: "TOP",
        description: "スケジュール中心のトップページです。",
        path: "/",
    },
    {
        key: "anniversary",
        label: "記念日一覧",
        shortLabel: "記念日",
        description: "誕生日や周年の情報をまとめたページです。",
        path: "/dates",
    },
    {
        key: "official-links",
        label: "公式リンク一覧",
        shortLabel: "リンク",
        description: "公式サイトや配信先への導線を整理したページです。",
        path: "/links",
    },
    {
        key: "quiz",
        label: "クイズに挑戦！",
        shortLabel: "クイズ",
        description: "作品や楽曲に関するクイズ企画ページです。",
        path: "/quiz",
    },
];

function HeaderNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    const currentPath = location.pathname.replace(basePath, "") || "/";

    const activeNavKey =
        headerNavItems.find((item) => item.path === currentPath)?.key ??
        headerNavItems[0].key;

    const currentItem = headerNavItems.find((item) => item.key === activeNavKey) ?? headerNavItems[0];

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

    const handleNavClick = (item: HeaderNavItem) => {
        setIsMobileMenuOpen(false);
        if (item.path === currentPath) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            navigate(item.path);
            window.scrollTo({ top: 0 });
        }
    };

    return (
        <header className="header-nav">
            <div className="shell header-inner">
                <button
                    className="brand brand-button"
                    type="button"
                    onClick={() => handleNavClick(headerNavItems[0])}
                    aria-label="ページ先頭へ戻る"
                >
                    <div className="brand-icon">
                        <Music4 className="icon-20" />
                    </div>
                    <div className="brand-copy">
                        <div className="brand-title">ガルクラの箱</div>
                        <div className="brand-route">
                            <span className="brand-chip brand-chip-current">{currentItem.shortLabel}</span>
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
                            )}
                            onClick={() => handleNavClick(item)}
                        >
                            <span className="menu-pill-label">{item.label}</span>
                            {activeNavKey === item.key ? (
                                <span className="menu-pill-badge menu-pill-badge-current">現在地</span>
                            ) : null}
                        </button>
                    ))}
                </nav>

                <div className="header-actions">
                    <a
                        className="header-old-version-link"
                        href="https://www.notion.so/2a52575eb8cb80e2a285f1afa5f83715?v=2a92575eb8cb80afb48a000ca5aa28a5"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="旧ver.はこちら"
                    >
                        <span className="header-old-version-label">旧ver.はこちら</span>
                        <ExternalLinkIcon className="icon-14 header-old-version-icon" />
                    </a>
                    <button
                        className="button mobile-only header-menu-button"
                        type="button"
                        aria-label={isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="mobile-site-menu"
                        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                    >
                        {isMobileMenuOpen ? <X className="icon-18" /> : <Menu className="icon-18" />}
                        <span className="header-menu-label">
                            {isMobileMenuOpen ? "閉じる" : "メニュー"}
                        </span>
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
                                    <div className="eyebrow pink">site navigation</div>
                                    <h2 className="mobile-nav-title">ページ一覧</h2>
                                    <p className="mobile-nav-copy">
                                        スケジュール、記念日一覧、公式リンク一覧、クイズに挑戦の各ページへ移動できます。
                                    </p>
                                    <div className="mobile-nav-summary">
                                        <span className="mobile-nav-summary-pill">全 {headerNavItems.length} ページ</span>
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
                                            )}
                                            onClick={() => handleNavClick(item)}
                                        >
                                            <span className="mobile-nav-item-row">
                                                <span className="mobile-nav-item-label">{item.label}</span>
                                                <span className="mobile-nav-item-badge">
                                                    {activeNavKey === item.key ? "表示中" : "移動"}
                                                </span>
                                            </span>
                                            <span className="mobile-nav-item-description">{item.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </header>
    );
}

const BUILD_META_PATH = `${import.meta.env.BASE_URL}build-meta.json`;
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

function useUpdateChecker() {
    const [hasUpdate, setHasUpdate] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;

        async function check() {
            try {
                // Random query param to bypass CDN cache
                const res = await fetch(`${BUILD_META_PATH}?_=${Date.now()}`, {
                    cache: "no-store",
                });
                if (!res.ok) return;
                const meta: unknown = await res.json();
                if (
                    meta &&
                    typeof meta === "object" &&
                    "buildTime" in meta &&
                    typeof (meta as { buildTime: unknown }).buildTime === "string" &&
                    (meta as { buildTime: string }).buildTime !== __BUILD_TIMESTAMP__
                ) {
                    setHasUpdate(true);
                }
            } catch {
                // ignore network errors
            }
        }

        // First check after a short delay, then every 5 minutes
        const initialTimer = setTimeout(() => {
            void check();
            timer = setInterval(() => void check(), UPDATE_CHECK_INTERVAL);
        }, 30_000);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(timer);
        };
    }, []);

    const reload = useCallback(() => {
        window.location.reload();
    }, []);

    return { hasUpdate, reload };
}

function UpdateBanner({ onReload }: { onReload: () => void }) {
    return (
        <div className="update-banner-wrapper">
            <motion.div
                className="update-banner"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
                <span className="update-banner-text">新しいバージョンがあります</span>
                <button className="update-banner-btn" type="button" onClick={onReload}>
                    <RefreshCw className="icon-14" />
                    更新する
                </button>
            </motion.div>
        </div>
    );
}

const pageTitles: Record<string, string> = {
    "/": "TOP",
    "/dates": "記念日一覧",
    "/links": "公式リンク一覧",
    "/quiz": "クイズに挑戦！",
};

export default function Layout() {
    const { hasUpdate, reload } = useUpdateChecker();
    const location = useLocation();

    useEffect(() => {
        const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
        const path = location.pathname.replace(basePath, "") || "/";
        const title = pageTitles[path];
        trackPageView(path, title);
    }, [location.pathname]);

    return (
        <div className="page-shell">
            <HeaderNav />

            <main className="shell main-stack">
                <Outlet />

                <section className="footer-notice" aria-label="ご案内">
                    <div className="notice-card">
                        <div className="notice-title">
                            <CircleAlert className="icon-16" />
                            ご案内
                        </div>
                        <div className="notice-body">
                            <p>
                                本ページは『ガールズバンドクライ』および関係各社とは一切関係のない、個人による非公式ファンメモです。
                                情報の正確性・最新性は保証できません。
                                <br />
                                本ページの情報に基づいて利用者の方に生じたいかなる損害・トラブルについても、
                                管理人は一切の責任を負いかねます。あらかじめご了承ください。
                            </p>
                            <p>
                                ＜お願い＞
                                <br />
                                情報に間違いがある、もしくは新しい情報がある場合は優しく教えてください。
                                <strong>また、本サイトに掲載してよいファンアートなどが万が一あれば、ぜひお知らせください。その際はイラストをご紹介するページを作成させていただきます。</strong>
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="site-footer">
                <div className="shell site-footer-inner">
                    <p className="footer-attribution">
                        このサイトは個人により運営されている『ガールズバンドクライ』の非公式ファンサイトです。
                        運営・制作：<a href="https://x.com/jirachi_tan" target="_blank" rel="noopener noreferrer">@jirachi_tan</a>
                    </p>
                </div>
            </footer>

            <AnimatePresence>
                {hasUpdate && <UpdateBanner onReload={reload} />}
            </AnimatePresence>
        </div>
    );
}
