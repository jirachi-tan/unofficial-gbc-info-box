/**
 * 「今日の予定」セクションを高解像度で2分割キャプチャするスクリプト
 *
 * 使い方:
 *   node scripts/capture-focus.mjs
 *
 * 出力: プロジェクトルートに focus-1.png, focus-2.png を生成
 */

import { chromium } from "playwright";
import { spawn } from "child_process";
import { createServer } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PORT = 4201;
const DPR = 3; // 高解像度 (3倍)
const VIEWPORT_WIDTH = 700; // モバイル幅でフォーカスセクションをフルワイドに
const INITIAL_VIEWPORT_HEIGHT = 3000;
const VIEWPORT_PADDING = 120;
const MAX_VIEWPORT_HEIGHT = 12000;
const SKIP_UPDATE = process.env.CAPTURE_SKIP_UPDATE === "1";

function runCommand(command, args, options = {}) {
    return new Promise((resolvePromise, reject) => {
        const proc = spawn(command, args, {
            cwd: ROOT,
            stdio: ["ignore", "pipe", "pipe"],
            ...options,
        });

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        proc.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        proc.on("error", reject);
        proc.on("close", (code) => {
            if (code === 0) {
                resolvePromise({ stdout, stderr });
                return;
            }

            const message = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
            reject(new Error(message || `${command} exited with code ${code}`));
        });
    });
}

async function updateFromOriginMain() {
    console.log("🔄 origin/main の最新状態を確認中...");

    const branch = (await runCommand("git", ["rev-parse", "--abbrev-ref", "HEAD"]))
        .stdout
        .trim();
    if (branch !== "main") {
        throw new Error(`現在のブランチが main ではありません: ${branch}`);
    }

    const trackedChanges = (await runCommand("git", ["status", "--porcelain", "--untracked-files=no"]))
        .stdout
        .trim();
    if (trackedChanges) {
        throw new Error("ローカル変更があるため自動更新を中止しました。コミット・退避後に再実行してください。");
    }

    const pullResult = await runCommand("git", ["pull", "--ff-only", "origin", "main"]);
    const pullLog = [pullResult.stdout.trim(), pullResult.stderr.trim()].filter(Boolean).join("\n");

    if (pullLog) {
        console.log(pullLog);
    }
}

async function main() {
    if (SKIP_UPDATE) {
        console.log("⏭️ CAPTURE_SKIP_UPDATE=1 のため git pull をスキップします。");
    } else {
        await updateFromOriginMain();
    }

    console.log("🚀 Vite dev server を起動中...");
    const server = await createServer({
        root: ROOT,
        server: { port: PORT, strictPort: true },
    });
    await server.listen();
    const addr = server.resolvedUrls?.local?.[0];
    console.log(`   → ${addr}`);

    try {
        const browser = await chromium.launch();
        const context = await browser.newContext({
            viewport: { width: VIEWPORT_WIDTH, height: INITIAL_VIEWPORT_HEIGHT },
            deviceScaleFactor: DPR,
        });
        const page = await context.newPage();

        const captureUrl = `${addr}?capture=1`;
        console.log("📄 ページを読込中...");
        await page.goto(captureUrl, { waitUntil: "networkidle" });

        // キャプチャ時はアニメーション/トランジションを止めて寸法を安定化
        await page.addStyleTag({
            content: `
                *, *::before, *::after {
                    animation: none !important;
                    transition: none !important;
                }
            `,
        });

        // Webフォントとレイアウト反映完了を待ってから座標を計測
        await page.evaluate(async () => {
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }
            await new Promise((resolvePromise) => requestAnimationFrame(() => resolvePromise()));
            await new Promise((resolvePromise) => requestAnimationFrame(() => resolvePromise()));
        });

        // アニメーション完了待ち
        await page.waitForTimeout(1500);

        // #focus-section 存在確認
        const section = await page.$("#focus-section");
        if (!section) {
            throw new Error("#focus-section が見つかりません。イベントが 0件の可能性があります。");
        }

        // カード一覧と分割点を計算
        const readLayout = async () =>
            page.evaluate(() => {
                const sec = document.querySelector("#focus-section");
                if (!sec) return null;

                const secRect = sec.getBoundingClientRect();
                const cards = Array.from(sec.querySelectorAll(".mini-card"));

                // カードごとの矩形を取得（直近ラッパー優先で分割基準を安定化）
                const cardRects = cards.map((card) => {
                    const wrapper = card.parentElement ?? card;
                    const r = wrapper.getBoundingClientRect();
                    return { top: r.top, bottom: r.bottom };
                });

                return {
                    sectionTop: secRect.top,
                    sectionBottom: secRect.bottom,
                    sectionLeft: secRect.left,
                    sectionWidth: secRect.width,
                    sectionHeight: secRect.height,
                    cardCount: cards.length,
                    cardRects,
                };
            });

        let layout = await readLayout();

        if (layout) {
            const currentViewport = page.viewportSize();
            const requiredHeight = Math.min(
                MAX_VIEWPORT_HEIGHT,
                Math.ceil(layout.sectionBottom + VIEWPORT_PADDING),
            );

            if (currentViewport && requiredHeight > currentViewport.height) {
                await page.setViewportSize({
                    width: currentViewport.width,
                    height: requiredHeight,
                });
                // viewport変更後に再計測
                layout = await readLayout();
            }
        }

        if (!layout || layout.cardCount === 0) {
            console.log("⚠️ 今日のイベントがありません。セクション全体を 1 枚でキャプチャします。");
            await section.screenshot({ path: resolve(ROOT, "focus-1.png") });
            console.log("✅ focus-1.png を保存しました。");
        } else {
            // 2分割: 前半・後半のカード数を決定
            const splitIndex = Math.ceil(layout.cardCount / 2);

            // 分割 Y 座標 = splitIndex 番目のカードの上端と、(splitIndex-1) 番目の下端の中間
            const prevBottom = layout.cardRects[splitIndex - 1].bottom;
            const nextTop = layout.cardRects[splitIndex]?.top ?? layout.sectionBottom;
            const splitY = (prevBottom + nextTop) / 2;

            // クリップ座標は整数化して境界の端切れを防ぐ
            const sectionLeft = Math.floor(layout.sectionLeft);
            const sectionTop = Math.floor(layout.sectionTop);
            const sectionRight = Math.ceil(layout.sectionLeft + layout.sectionWidth);
            const sectionBottom = Math.ceil(layout.sectionBottom);
            const splitLine = Math.ceil(splitY);

            // -- パート 1: ヘッダー〜前半カード --
            const clip1 = {
                x: sectionLeft,
                y: sectionTop,
                width: sectionRight - sectionLeft,
                height: splitLine - sectionTop,
            };

            // -- パート 2: 後半カード〜セクション末尾 --
            const clip2 = {
                x: sectionLeft,
                y: splitLine,
                width: sectionRight - sectionLeft,
                height: sectionBottom - splitLine,
            };

            await page.screenshot({
                path: resolve(ROOT, "focus-1.png"),
                clip: clip1,
            });
            console.log(`✅ focus-1.png (カード 1-${splitIndex}, ${Math.round(clip1.width * DPR)}x${Math.round(clip1.height * DPR)}px)`);

            await page.screenshot({
                path: resolve(ROOT, "focus-2.png"),
                clip: clip2,
            });
            console.log(`✅ focus-2.png (カード ${splitIndex + 1}-${layout.cardCount}, ${Math.round(clip2.width * DPR)}x${Math.round(clip2.height * DPR)}px)`);
        }

        await browser.close();
        console.log("🎉 完了！");
    } finally {
        await server.close();
    }
}

main().catch((err) => {
    console.error("❌ エラー:", err.message);
    process.exit(1);
});
