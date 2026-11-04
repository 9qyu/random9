import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
// js/ は通常のスクリプト（file:// で開けるようにするため）。読み込むと globalThis.R9 に登録される。
import '../js/rng.js';
import '../js/modes.js';
const { randomInt, randomBigBelow, shuffle, _useSource, generateIntegers, generatePassword, parseSafeInt, ModeError } = globalThis.R9;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** カイ二乗値。df + 5*sqrt(2*df) を超えたら偏りありとみなす（誤検出は極めてまれ）。 */
function chiSquareOk(counts, total) {
  const expected = total / counts.length;
  const chi = counts.reduce((s, c) => s + (c - expected) ** 2 / expected, 0);
  const df = counts.length - 1;
  return { chi, limit: df + 5 * Math.sqrt(2 * df) };
}

test('randomInt: 2の冪でない範囲を 1,000,000 回生成しても一様（カイ二乗）', () => {
  for (const n of [6, 7, 10]) {
    const counts = new Array(n).fill(0);
    const total = 1_000_000;
    for (let i = 0; i < total; i++) counts[randomInt(n)]++;
    const { chi, limit } = chiSquareOk(counts, total);
    assert.ok(chi < limit, `n=${n}: chi=${chi.toFixed(2)} limit=${limit.toFixed(2)}`);
  }
});

test('randomInt: 範囲外や不正な値は拒否する', () => {
  assert.throws(() => randomInt(0), RangeError);
  assert.throws(() => randomInt(-1), RangeError);
  assert.throws(() => randomInt(1.5), RangeError);
  assert.equal(randomInt(1), 0);
});

test('棄却サンプリング: 端数にあたる値は捨てて引き直す', () => {
  // n=3 のとき 2^32 = 3*1431655765 + 1。0xFFFFFFFF は端数なので捨てられる。
  const queue = [0xffffffff, 5];
  _useSource((a) => {
    a[0] = queue.shift();
    return a;
  });
  try {
    assert.equal(randomInt(3), 5 % 3);
    assert.equal(queue.length, 0, '端数の値を引いた後に引き直している');
  } finally {
    _useSource(null);
  }
});

test('棄却サンプリング: 64bit 側でも端数を捨てる', () => {
  // N = 2^40 は 2^64 を割り切るため棄却されない。N = 2^40+1 で上位端数を確認する。
  const N = 2n ** 40n + 1n;
  const limit = ((1n << 64n) / N) * N;
  const hi = (limit >> 32n) | 0n;
  const lo = limit & 0xffffffffn;
  const queue = [
    [Number(hi), Number(lo)], // x == limit → 棄却
    [0, 7],
  ];
  _useSource((a) => {
    const [h, l] = queue.shift();
    a[0] = h;
    a[1] = l;
    return a;
  });
  try {
    assert.equal(randomBigBelow(N), 7n);
    assert.equal(queue.length, 0);
  } finally {
    _useSource(null);
  }
});

test('randomBigBelow: 2^54 級の範囲でも上限未満', () => {
  const N = 2n ** 54n - 3n;
  for (let i = 0; i < 2000; i++) {
    const v = randomBigBelow(N);
    assert.ok(v >= 0n && v < N);
  }
});

test('shuffle: 要素を保ったまま並べ替える', () => {
  const arr = Array.from({ length: 50 }, (_, i) => i);
  const out = shuffle([...arr]);
  assert.deepEqual([...out].sort((a, b) => a - b), arr);
});

test('整数: 範囲内・個数・重複なし', () => {
  const v = generateIntegers({ min: '1', max: '100', count: '1000', unique: false });
  assert.equal(v.length, 1000);
  assert.ok(v.every((x) => x >= 1n && x <= 100n));

  const u = generateIntegers({ min: '1', max: '100', count: '100', unique: true });
  assert.equal(new Set(u.map(String)).size, 100);

  const big = generateIntegers({ min: '-9007199254740991', max: '9007199254740991', count: '200', unique: true });
  assert.equal(new Set(big.map(String)).size, 200);
  assert.ok(big.every((x) => x >= -(2n ** 53n - 1n) && x <= 2n ** 53n - 1n));
});

test('整数: 入力検証', () => {
  const code = (fn) => {
    try {
      fn();
    } catch (e) {
      return e instanceof ModeError ? e.code : 'other';
    }
    return 'none';
  };
  assert.equal(code(() => generateIntegers({ min: 'a', max: '5', count: 1 })), 'int_invalid');
  assert.equal(code(() => generateIntegers({ min: '9007199254740992', max: '9007199254740993', count: 1 })), 'int_invalid');
  assert.equal(code(() => generateIntegers({ min: '5', max: '1', count: 1 })), 'int_range');
  assert.equal(code(() => generateIntegers({ min: '1', max: '5', count: 0 })), 'int_count');
  assert.equal(code(() => generateIntegers({ min: '1', max: '5', count: 1001 })), 'int_count');
  assert.equal(code(() => generateIntegers({ min: '1', max: '5', count: 6, unique: true })), 'int_unique');
  assert.equal(parseSafeInt(' -42 '), -42n);
});

test('整数: 幅が2の冪でない範囲を一様に引く（カイ二乗）', () => {
  const counts = new Array(7).fill(0);
  const total = 200_000;
  for (let i = 0; i < total; i++) counts[Number(generateIntegers({ min: '10', max: '16', count: 1 })[0] - 10n)]++;
  const { chi, limit } = chiSquareOk(counts, total);
  assert.ok(chi < limit, `chi=${chi.toFixed(2)} limit=${limit.toFixed(2)}`);
});

test('パスワード: 文字種のON/OFFと長さ', () => {
  for (let i = 0; i < 300; i++) {
    const all = generatePassword({ length: 20, alpha: true, symbols: true }).password;
    assert.equal(all.length, 20);
    assert.match(all, /[A-Z]/);
    assert.match(all, /[a-z]/);
    assert.match(all, /[0-9]/);
    assert.match(all, /[^A-Za-z0-9]/);

    const noSym = generatePassword({ length: 8, alpha: true, symbols: false }).password;
    assert.match(noSym, /^[A-Za-z0-9]{8}$/);
    assert.match(noSym, /[0-9]/);

    const noAlpha = generatePassword({ length: 12, alpha: false, symbols: true }).password;
    assert.doesNotMatch(noAlpha, /[A-Za-z]/);
    assert.match(noAlpha, /[0-9]/);
    assert.match(noAlpha, /[^0-9]/);

    assert.match(generatePassword({ length: 128, alpha: false, symbols: false }).password, /^[0-9]{128}$/);
  }
  assert.throws(() => generatePassword({ length: 7, alpha: true, symbols: true }), ModeError);
  assert.throws(() => generatePassword({ length: 129, alpha: true, symbols: true }), ModeError);
});

test('コード規約: 禁止APIを使っていない（通信ゼロ・暗号用乱数のみ）', () => {
  const forbidden = [/Math\.random/, /\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /sendBeacon/, /localStorage/, /sessionStorage/, /document\.cookie/, /console\./, /\beval\s*\(/, /new Function/, /innerHTML/];
  for (const f of readdirSync(join(root, 'js'))) {
    const src = readFileSync(join(root, 'js', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    for (const re of forbidden) assert.doesNotMatch(src, re, `js/${f} に ${re} がある`);
  }
  // sw.js は同一オリジンのキャッシュ取得だけ fetch を使ってよい
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  assert.match(sw, /origin !== self\.location\.origin/);
  for (const re of [/Math\.random/, /XMLHttpRequest/, /WebSocket/, /sendBeacon/]) assert.doesNotMatch(sw, re);
});

test('index.html: 外部リソースとインラインのスクリプト/スタイルがない', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /(src|href)="https?:\/\/(?!github\.com)/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/);
  assert.doesNotMatch(html, /type="module"/); // file:// で開けるよう通常のスクリプトにする
  assert.doesNotMatch(html, /<style/);
  assert.doesNotMatch(html, /\sstyle=/);
  assert.match(html, /connect-src 'none'/);
});
