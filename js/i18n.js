// 日本語・英語の文言辞書。選択は保存しない（初回はブラウザの言語設定で判定）。

(() => {
const dict = {
  ja: {
    title: 'サーバー通信をしない乱数・パスワードジェネレーター',
    description: 'サーバーに何も送らず、ブラウザの中だけで安全な乱数を作ります。',
    tabInt: '整数',
    tabPw: 'パスワード',
    min: '最小値',
    max: '最大値',
    count: '個数',
    unique: '重複なし',
    length: '長さ',
    alpha: 'アルファベットを含む',
    symbols: '記号を含む',
    digitsNote: '数字は常に含まれます',
    generate: '乱数を生成',
    generatePw: 'パスワードを生成',
    resultTitle: '生成結果',
    badge1: '偏りを防ぐ設計',
    badge2: 'サーバーに送信なし',
    badge3: 'オープンソース',
    copy: 'コピー',
    copyAll: '全てコピー',
    copied: 'コピーしました',
    copyFail: 'コピーできませんでした',
    placeholder: '生成ボタンを押してください',
    noComm: 'このページは一切通信しません',
    source: 'ソースコード (MIT)',
    how: '仕組み',
    close: '閉じる',
    langButton: 'English',
    langLabel: 'Switch to English',
    result: '結果',
    modes: '生成モード',
    unsupported: 'このブラウザは安全な乱数に対応していないため、利用できません。',
    err: {
      int_invalid: '最小値・最大値は整数で入力してください（±9,007,199,254,740,991 まで）。',
      int_range: '最小値は最大値以下にしてください。',
      int_count: '個数は 1〜1,000 で入力してください。',
      int_unique: '重複なしの個数が、範囲の整数の数を超えています。',
      pw_length: '長さは 8〜128 で指定してください。',
    },
    detailInt: (n, lo, hi) => `${n}個 ／ ${lo} 〜 ${hi}`,
    detailPw: (bits, label) => `強度の目安: 約 ${bits} bit（${label}）`,
    strength: ['弱い', '普通', '強い', '非常に強い'],
    aboutTitle: 'このサイトの仕組み',
    about: [
      ['プライバシー', '乱数の生成はすべてお使いのブラウザ内で行われます。入力した数値や生成結果がサーバーに送信されることはありません。'],
      ['暗号学的に安全な乱数', 'random9は、ブラウザ標準の `crypto.getRandomValues()` を使用しています。\nこの機能は、OSが提供する予測困難な乱数をもとに値を生成します。一般的な疑似乱数とは異なり、次に生成される値を予測することが非常に困難です。パスワードや暗号鍵など、安全性が求められる用途にも使われています。'],
      ['数字の偏りを防ぐ仕組み', '指定した範囲の数字を均等な確率で選ぶため、**棄却サンプリング（Rejection Sampling）**を採用しています。\n単純な余りの計算では、数字によって選ばれやすさに偏りが生じる場合があります。random9では、偏りの原因となる値を採用せず、引き直すことで、指定範囲内の各数字が均等に選ばれるようにしています。'],
    ],

  },
  en: {
    title: 'Random number & password generator, no server communication',
    description: 'Generates secure random values inside your browser. Nothing is sent to any server.',
    tabInt: 'Integer',
    tabPw: 'Password',
    min: 'Minimum',
    max: 'Maximum',
    count: 'Count',
    unique: 'No duplicates',
    length: 'Length',
    alpha: 'Include letters',
    symbols: 'Include symbols',
    digitsNote: 'Digits are always included',
    generate: 'Generate numbers',
    generatePw: 'Generate password',
    resultTitle: 'Result',
    badge1: 'Bias-free by design',
    badge2: 'No data sent to servers',
    badge3: 'Open source',
    copy: 'Copy',
    copyAll: 'Copy all',
    copied: 'Copied',
    copyFail: 'Could not copy',
    placeholder: 'Press the button to generate',
    noComm: 'This page sends nothing',
    source: 'Source code (MIT)',
    how: 'How it works',
    close: 'Close',
    langButton: '日本語',
    langLabel: '日本語に切り替え',
    result: 'Result',
    modes: 'Generator mode',
    unsupported: 'This browser does not support secure random numbers, so it cannot be used.',
    err: {
      int_invalid: 'Enter whole numbers for minimum and maximum (up to ±9,007,199,254,740,991).',
      int_range: 'The minimum must not be greater than the maximum.',
      int_count: 'Enter a count from 1 to 1,000.',
      int_unique: 'The count is larger than the number of integers in the range.',
      pw_length: 'Enter a length from 8 to 128.',
    },
    detailInt: (n, lo, hi) => `${n} value${n === 1 ? '' : 's'} / ${lo} to ${hi}`,
    detailPw: (bits, label) => `Strength estimate: about ${bits} bits (${label})`,
    strength: ['weak', 'fair', 'strong', 'very strong'],
    aboutTitle: 'How this site works',
    about: [
      ['Privacy', 'All random numbers are generated entirely inside your browser. The values you enter and the results are never sent to a server.'],
      ['Cryptographically secure randomness', 'random9 uses the browser’s built-in `crypto.getRandomValues()`.\nThis function produces values from unpredictable randomness supplied by the operating system. Unlike ordinary pseudo-random generators, it is extremely difficult to predict the next value. It is also used where security matters, such as passwords and cryptographic keys.'],
      ['Preventing bias in the numbers', 'To pick every number in the range with equal probability, random9 uses **rejection sampling**.\nA simple remainder calculation can make some numbers more likely than others. random9 discards the values that would cause the bias and draws again, so every number in the range is equally likely.'],
    ],

  },
};

function detectLang() {
  const nav = globalThis.navigator || {};
  const l = (nav.languages && nav.languages[0]) || nav.language || 'ja';
  return l.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

let lang = detectLang();

const getLang = () => lang;
const setLang = (l) => {
  lang = l in dict ? l : 'en';
};
const otherLang = () => (lang === 'ja' ? 'en' : 'ja');

/** t('err.int_range') のようにドット区切りで引く。 */
function t(key, ...args) {
  const v = key.split('.').reduce((o, k) => (o ? o[k] : undefined), dict[lang]);
  return typeof v === 'function' ? v(...args) : v;
}

globalThis.R9 = Object.assign(globalThis.R9, { t, getLang, setLang, otherLang, detectLang });
})();
