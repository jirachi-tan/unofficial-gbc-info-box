/**
 * 「今日の予定」セクションを高解像度で2分割キャプチャするスクリプト
 *
 * 使い方:
 *   node scripts/capture-focus.mjs
 *
 * 出力: プロジェクトルートに focus-1.png, focus-2.png を生成
 */

import { chromium } from "playwright";
import { createServer } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PORT = 4201;
const DPR = 3; // 高解像度 (3倍)
const VIEWPORT_WIDTH = 700; // モバイル幅でフォーカスセクションをフルワイドに

async function main() {
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
            viewport: { width: VIEWPORT_WIDTH, height: 3000 },
            deviceScaleFactor: DPR,
        });
        const page = await context.newPage();

        console.log("📄 ページを読込中...");
        await page.goto(addr, { waitUntil: "networkidle" });

        // アニメーション完了待ち
        await page.waitForTimeout(1500);

        // #focus-section 存在確認
        const section = await page.$("#focus-section");
        if (!section) {
            throw new Error("#focus-section が見つかりません。イベントが 0件の可能性があります。");
        }

        // カード一覧と分割点を計算
        const layout = await page.evaluate(() => {
            const sec = document.querySelector("#focus-section");
            if (!sec) return null;

            const secRect = sec.getBoundingClientRect();
            const cards = Array.from(sec.querySelectorAll(".mini-card"));

            // カードごとの矩形を取得（motion.divラッパーがあればそちらの矩形を使う）
            const cardRects = cards.map((card) => {
                const wrapper = card.closest("[style]") ?? card;
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

            // -- パート 1: ヘッダー〜前半カード --
            const clip1 = {
                x: layout.sectionLeft,
                y: layout.sectionTop,
                width: layout.sectionWidth,
                height: splitY - layout.sectionTop,
            };

            // -- パート 2: 後半カード〜セクション末尾 --
            const clip2 = {
                x: layout.sectionLeft,
                y: splitY,
                width: layout.sectionWidth,
                height: layout.sectionBottom - splitY,
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
