// 乱数コア: crypto.getRandomValues() だけを源にする。
// Math.random() や時刻などの独自エントロピーは使わない。
// This module has no DOM access so that it can be unit-tested in Node.
// 通常のスクリプトとして読み込む（ダブルクリックで開く file:// では ES Modules が使えないため）。
(() => {

const MAX_BYTES = 65536; // getRandomValues() の1回あたりの上限

let source = null; // テスト用の差し替え口（本番では使わない）

/** テスト専用: 乱数源を差し替える。null で元に戻す。 */
function _useSource(fn) {
  source = fn;
}

function isSupported() {
  const c = globalThis.crypto;
  return !!c && typeof c.getRandomValues === 'function';
}

/** Uint32Array を暗号論的乱数で埋める。非対応環境では代替せず例外にする。 */
function fill(arr) {
  if (source) return source(arr);
  if (!isSupported()) throw new Error('UNSUPPORTED');
  const step = MAX_BYTES / arr.BYTES_PER_ELEMENT;
  for (let i = 0; i < arr.length; i += step) {
    globalThis.crypto.getRandomValues(arr.subarray(i, Math.min(i + step, arr.length)));
  }
  return arr;
}

/** 0 以上 n 未満の整数を一様に返す（n は 1 〜 2^53）。棄却サンプリングで偏りを除く。 */
function randomInt(n) {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError('n must be a positive safe integer');
  if (n === 1) return 0;
  if (n <= 0x100000000) {
    // 2^32 以下の n の倍数のうち最大のものを上限にし、それ以上の値は捨てて引き直す
    const limit = Math.floor(0x100000000 / n) * n;
    const a = new Uint32Array(1);
    for (;;) {
      fill(a);
      if (a[0] < limit) return a[0] % n;
    }
  }
  return Number(randomBigBelow(BigInt(n)));
}

/** 0 以上 N 未満の BigInt を一様に返す。N は任意の大きさでよい。 */
function randomBigBelow(N) {
  if (typeof N !== 'bigint' || N < 1n) throw new RangeError('N must be a positive bigint');
  if (N === 1n) return 0n;
  if (N <= 0x100000000n) return BigInt(randomInt(Number(N)));
  const words = Math.ceil(N.toString(2).length / 32);
  const range = 1n << BigInt(32 * words);
  const limit = (range / N) * N;
  const a = new Uint32Array(words);
  for (;;) {
    fill(a);
    let x = 0n;
    for (const w of a) x = (x << 32n) | BigInt(w);
    if (x < limit) return x % N;
  }
}

/** Fisher–Yates 法でその場でシャッフルする。 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

globalThis.R9 = Object.assign(globalThis.R9 || {}, { isSupported, randomInt, randomBigBelow, shuffle, _useSource });
})();
