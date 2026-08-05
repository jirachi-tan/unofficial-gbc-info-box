
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
	- GitHub Pages 公開領域:
		- 最新: `public/captures/latest/focus-1.png`, `public/captures/latest/focus-2.png`
		- 履歴: `public/captures/history/focus-1-<timestamp>.png`, `public/captures/history/focus-2-<timestamp>.png`
- `publish_to_pages` を `true` にすると、`public/captures/latest` が `main` に自動コミットされ、Pages 側でも更新されます。
- ワークフローは `CAPTURE_SKIP_UPDATE=1` で実行されるため、GitHub Actions 上では `git pull` 前提チェックをスキップします。
- 以前は画像が前回と同一だった場合、見た目上 `generated_at_utc.txt` だけ更新されたように見えることがありました。現在は `history` に時刻付きPNGを必ず追加するため、毎回の実行結果が判別できます。
