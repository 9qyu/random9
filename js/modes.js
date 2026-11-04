// 生成モード: 整数 (F1) とパスワード (F2)。DOM には触れない。
(() => {
const { randomInt, randomBigBelow, shuffle } = globalThis.R9;

class ModeError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const LIMITS = {
  safe: 2n ** 53n - 1n, // 整数の範囲 ±(2^53-1)
  countMax: 1000,
  pwMin: 8,
  pwMax: 128,
  smallSpan: 100000n, // これ以下の範囲は配列を使った重複なし抽選にする
};

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?/~';

/** 整数文字列を BigInt にする。整数でない・範囲外なら null。 */
function parseSafeInt(str) {
  const s = String(str).trim();
  if (!/^[+-]?\d+$/.test(s)) return null;
  const v = BigInt(s);
  return v > LIMITS.safe || v < -LIMITS.safe ? null : v;
}

/** 範囲 [min, max] の整数を count 個返す（BigInt の配列）。 */
function generateIntegers({ min, max, count, unique }) {
  const lo = parseSafeInt(min);
  const hi = parseSafeInt(max);
  if (lo === null || hi === null) throw new ModeError('int_invalid');
  if (lo > hi) throw new ModeError('int_range');
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1 || n > LIMITS.countMax) throw new ModeError('int_count');
  const span = hi - lo + 1n;
  if (unique && BigInt(n) > span) throw new ModeError('int_unique');

  const out = [];
  if (!unique) {
    for (let i = 0; i < n; i++) out.push(lo + randomBigBelow(span));
    return out;
  }
  if (span <= LIMITS.smallSpan) {
    // 部分的な Fisher–Yates: 先頭から n 個だけ確定させる
    const size = Number(span);
    const pool = Array.from({ length: size }, (_, i) => i);
    for (let i = 0; i < n; i++) {
      const j = i + randomInt(size - i);
      [pool[i], pool[j]] = [pool[j], pool[i]];
      out.push(lo + BigInt(pool[i]));
    }
    return out;
  }
  // 範囲が十分に広いので、重複が出たら引き直す
  const seen = new Set();
  while (out.length < n) {
    const v = lo + randomBigBelow(span);
    const key = v.toString();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out;
}

/** パスワードを1つ作る。数字は常に含め、有効な文字種は各1文字以上含める。 */
function generatePassword({ length, alpha, symbols }) {
  const len = Number(length);
  if (!Number.isInteger(len) || len < LIMITS.pwMin || len > LIMITS.pwMax) throw new ModeError('pw_length');
  const sets = [DIGITS];
  if (alpha) sets.push(UPPER, LOWER);
  if (symbols) sets.push(SYMBOLS);
  const pool = sets.join('');

  const chars = sets.map((s) => s[randomInt(s.length)]);
  while (chars.length < len) chars.push(pool[randomInt(pool.length)]);
  shuffle(chars);
  return {
    password: chars.join(''),
    bits: len * Math.log2(pool.length), // 目安（各文字種の必須条件による差は小さい）
    poolSize: pool.length,
  };
}

globalThis.R9 = Object.assign(globalThis.R9, { ModeError, LIMITS, parseSafeInt, generateIntegers, generatePassword });
})();
