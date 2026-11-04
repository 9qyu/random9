# random9

サーバーに何も送らず、ブラウザの `window.crypto.getRandomValues()` だけで動く乱数ジェネレータです。
Secure random numbers made entirely in your browser — nothing is ever sent to a server.

- 生成モード / Modes: 整数 (Integer) ・ パスワード (Password)
- 白に近いグレーとグリーンのミニマルなデザイン、1画面表示（スクロール不要）、PWA（オフライン動作）、日本語 / English
- 外部ライブラリ・ビルドなし。HTML / CSS / JavaScript だけです。

## 「通信しない」設計 / No network by design

- `fetch` / `XMLHttpRequest` / `WebSocket` / `sendBeacon` を使いません（`test/` が自動で検査します）。
  Service Worker だけが、同一サイトの静的ファイルをキャッシュするために取得します。
- CSP（`index.html` の `<meta>` と `_headers`）で `connect-src 'none'` を指定し、外部への接続をブラウザ側でも禁止しています。
- 生成結果はメモリ上だけに置き、保存・履歴・URL への反映・`console` 出力はしません。
- 確認方法: 開発者ツールの Network タブで、ページ読み込み後に「生成」を押してもリクエストが増えないことを確認できます。

## 乱数の作り方 / How the numbers are made

- 乱数源は `crypto.getRandomValues()` のみ。`Math.random()` は使いません。
- 範囲を決めて選ぶときは**棄却サンプリング**で偏り（modulo bias）を除きます。
  例: 0〜9 を 3 つに割り当てるとき、余りで選ぶと A が 4/10・B と C が 3/10 になります。端数にあたる `9` を捨てて引き直すことで、各 3/9 になります。（`js/rng.js`）
- シャッフルは Fisher–Yates 法です。
- パスワードは、数字を常に含め、有効にした文字種（アルファベットの大文字・小文字／記号）を各 1 文字以上含めます。
  強度の表示は `長さ × log2(文字の種類数)` の目安です。

## ローカルで開く / Run locally

`index.html` をダブルクリックで開くだけでも使えます（通常のスクリプトのため `file://` で動きます）。ただしその場合、PWA（オフライン用の Service Worker）は動きません。

```sh
npm run serve      # http://localhost:8080/ （Service Worker は localhost か HTTPS でのみ動きます）
npm test           # 単体テスト（Node.js 20 以上）
```

## 公開（Cloudflare Pages）/ Deploy

1. この内容を GitHub のリポジトリに置く。
2. Cloudflare Pages で「Git に接続」→ そのリポジトリを選ぶ。
3. ビルドコマンドは空、出力ディレクトリは `/`（リポジトリ直下）にする。
4. `_headers` が自動で読み込まれ、CSP などが HTTP ヘッダーとして付きます。

公開前に `index.html` の `https://github.com/YOUR-ACCOUNT/random9`（2 か所）を実際のリポジトリ URL に書き換えてください。

ファイルを変更したら `sw.js` の `VERSION` を上げてください（古いキャッシュが入れ替わります）。

## ファイル構成

| ファイル | 内容 |
| --- | --- |
| `index.html` | ページ本体・CSP の `<meta>` |
| `_headers` | Cloudflare Pages 用の HTTP ヘッダー |
| `manifest.webmanifest` / `sw.js` | PWA |
| `css/style.css` | ダーク配色・タイポグラフィ・レイアウト |
| `js/rng.js` | 乱数コア（`randomInt`・棄却サンプリング・シャッフル） |
| `js/modes.js` | 整数・パスワードの生成ロジック |
| `js/i18n.js` | 日本語・英語の文言と「仕組み」の説明文 |
| `js/app.js` | UI 操作・検証・コピー |
| `icons/` | PWA アイコン（192・512・maskable・apple-touch-icon） |
| `test/rng.test.js` | 偏り・形式・禁止 API の検査 |

## 貢献 / Contributing

Issue・Pull Request を歓迎します。`js/rng.js` を変更する場合は、テストの追加が必須です。

## License

[MIT](LICENSE)
