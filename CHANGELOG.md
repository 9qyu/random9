# Changelog

## 1.3.0
- 参考画像に合わせてデザインを刷新（チャコール背景・白文字・赤ピンクのアクセント、ロゴ原本をそのまま使用）
- ヒーロー、設定カード、結果カード、「もう一度生成」ボタン、安心バッジを追加
- 横長では左にロゴ・説明、右に操作カードの2カラム
- 乱数生成ロジック・通信しない仕様は変更なし。sw.js のキャッシュを v4 に更新

## 1.2.0
- 完全モノクロのダークテーマに変更（ロゴ・PWA アイコンもグレースケール化）
- 横長の画面では画面全体を使い、左に設定・右に大きな結果表示の2カラムにした
- sw.js のキャッシュを v3 に更新

## 1.1.0 — 2026-11-05

- デザイン刷新: 白に近いグレー背景・インク色・落ち着いたグリーンの3系統、セグメント式タブ、結果を主役にした画面構成、控えめな状態表現（ホバー・フォーカス・押下）。ダークモード固定をやめ、ライト配色に変更。機能とロジックは変更なし。
- Redesign: near-white background, ink and a calm green; segmented tabs; result-first layout; subtle hover/focus/active states. Dark-only styling replaced by a light theme. No functional changes.

## 1.0.1 — 2026-11-05

- 修正: `index.html` をダブルクリック（`file://`）で開くと JavaScript が読み込まれず操作できなかった問題。ES Modules をやめ、通常のスクリプトにした。
- Fix: opening `index.html` directly from disk (`file://`) left the UI unusable because ES modules are blocked there; scripts are now classic scripts.

## 1.0.0 — 2026-11-05

- 初回リリース: 整数・パスワードの生成、ダークモード固定、1画面表示、日本語 / English、PWA（オフライン動作）、「仕組み」の説明ダイアログ。
- Initial release: integer and password generation, dark-only UI, single-screen layout, Japanese / English, PWA with offline support, "How it works" dialog.
