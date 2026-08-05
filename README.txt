
# unofficial-gbc-info-box replacement set

このセットは、Vite 初期状態のプロジェクトにそのまま上書きしやすいように作ったものです。

## 置き換えるファイル
- `src/App.tsx`
- `src/index.css`
- `public/data/events.json`
- `vite.config.ts`

## 依存関係
```bash
npm install framer-motion lucide-react
```

## 反映
```bash
npm run dev
git add .
git commit -m "Apply mock site set"
git push
```

## スマホ向け: フォーカス画像の自動キャプチャ
- GitHub Actions の `Capture Focus Images` を `Run workflow` で実行します。
- 画像は 2 つの場所に保存されます。
	- Actions の Artifacts: `focus-captures`（zipで取得）
	- GitHub Pages 公開領域: `public/captures/latest/focus-1.png`, `public/captures/latest/focus-2.png`
- `publish_to_pages` を `true` にすると、`public/captures/latest` が `main` に自動コミットされ、Pages 側でも更新されます。
- ワークフローは `CAPTURE_SKIP_UPDATE=1` で実行されるため、GitHub Actions 上では `git pull` 前提チェックをスキップします。
