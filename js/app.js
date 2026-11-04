// UI 操作・検証・コピー・Service Worker の登録。
// 結果は DOM 上にだけ置く（console 出力・保存・URL への反映はしない）。
(() => {
const { isSupported, generateIntegers, generatePassword, ModeError, LIMITS, parseSafeInt, t, getLang, setLang, detectLang } = globalThis.R9;

const $ = (id) => document.getElementById(id);
const els = {
  tabs: { int: $('tab-int'), pw: $('tab-pw') },
  panels: { int: $('panel-int'), pw: $('panel-pw') },
  form: $('form'),
  error: $('error'),
  out: $('out'),
  detail: $('detail'),
  copy: $('copy'),
  toast: $('toast'),
  about: $('about'),
};

const state = { mode: 'int', text: '', count: 0, detail: null, level: 0 };
let toastTimer = 0;

/* ---------- 表示まわり ---------- */

/** `code` を <code>、**太字** を <strong> にして追加する（innerHTML は使わない）。 */
function richText(parent, str) {
  str.split(/(`[^`]+`|\*\*[^*]+\*\*)/).forEach((part) => {
    if (part.startsWith('`')) {
      const c = document.createElement('code');
      c.textContent = part.slice(1, -1);
      parent.append(c);
    } else if (part.startsWith('**')) {
      const b = document.createElement('strong');
      b.textContent = part.slice(2, -2);
      parent.append(b);
    } else if (part) {
      parent.append(part);
    }
  });
}

function applyI18n() {
  document.documentElement.lang = getLang();
  document.title = t('title');
  document.querySelector('meta[name="description"]').setAttribute('content', t('description'));
  document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll('[data-i18n-label]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
  updateCopyLabel();
  updateGenLabel();
  if (state.count) {
    els.detail.textContent = state.detail ? state.detail() : '';
    updateGauge();
  } else {
    showPlaceholder();
  }
  els.error.textContent = '';
}

function updateGenLabel() {
  $('generate').textContent = t(state.mode === 'pw' ? 'generatePw' : 'generate');
}

function updateCopyLabel() {
  $('copy-label').textContent = state.count > 1 ? t('copyAll') : t('copy');
}

function updateGauge() {
  const g = $('gauge');
  g.classList.toggle('on', state.level > 0);
  g.setAttribute('aria-valuenow', String(state.level));
  g.setAttribute('aria-valuetext', state.detail ? state.detail() : '');
  [...g.children].forEach((seg, i) => {
    seg.className = i < state.level ? 'fill l' + state.level : '';
  });
}

function showPlaceholder() {
  state.level = 0;
  state.text = '';
  state.count = 0;
  state.detail = null;
  $('result').dataset.state = 'empty';
  els.out.textContent = '';
  els.out.className = 'out';
  els.detail.textContent = '';
  els.copy.disabled = true;
  updateCopyLabel();
  updateGauge();
}

function showResult(text, count, detail, level = 0) {
  state.level = level;
  state.text = text;
  state.count = count;
  state.detail = detail;
  els.out.textContent = text;
  els.out.className = (count > 1 ? 'out multi' : 'out') + (state.mode === 'pw' ? ' mono' : '');
  $('result').dataset.state = 'ready';
  els.detail.textContent = detail();
  els.copy.disabled = false;
  updateCopyLabel();
  updateGauge();
}

function showError(msg) {
  els.error.textContent = msg;
}

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1600);
}

/* ---------- 生成 ---------- */

function strengthLevel(bits) {
  return bits >= 100 ? 4 : bits >= 70 ? 3 : bits >= 50 ? 2 : 1;
}
function strengthLabel(bits) {
  return t('strength')[strengthLevel(bits) - 1];
}

function generate() {
  showError('');
  try {
    if (state.mode === 'int') {
      const min = $('int-min').value;
      const max = $('int-max').value;
      const values = generateIntegers({ min, max, count: $('int-count').value, unique: $('int-unique').checked });
      showResult(values.join(', '), values.length, () => '');
    } else {
      const { password, bits } = generatePassword({
        length: $('pw-length').value,
        digits: $('pw-digits').checked,
        alpha: $('pw-alpha').checked,
        symbols: $('pw-symbols').checked,
      });
      const b = Math.floor(bits);
      showResult(password, 1, () => t('detailPw', b, strengthLabel(b)), strengthLevel(b));
    }
  } catch (e) {
    if (e instanceof ModeError) {
      showError(t('err.' + e.code));
    } else {
      showError(t('unsupported'));
    }
  }
}

/* ---------- タブ ---------- */

function selectMode(mode, focus) {
  state.mode = mode;
  for (const m of ['int', 'pw']) {
    const on = m === mode;
    els.tabs[m].setAttribute('aria-selected', String(on));
    els.tabs[m].tabIndex = on ? 0 : -1;
    els.panels[m].hidden = !on;
  }
  updateGenLabel();
  if (focus) els.tabs[mode].focus();
  showError('');
  showPlaceholder(); // モード切り替え時は前の結果を消す
}

function setupTabs() {
  els.tabs.int.addEventListener('click', () => selectMode('int'));
  els.tabs.pw.addEventListener('click', () => selectMode('pw'));
  $('tabs').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    selectMode(e.key === 'ArrowLeft' || e.key === 'Home' ? 'int' : 'pw', true);
  });
}

/* ---------- 起動 ---------- */

/** スライダーの塗り（見た目だけ）。CSS 変数 --p に 0〜100 を渡す。 */
function syncRange() {
  const r = $('pw-length');
  r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100);
}


/* ---------- スクロール（ホイール）・矢印キーで数値を変える ---------- */

function setupNudge() {
  const safe = LIMITS.safe;
  const fire = (el) => el.dispatchEvent(new Event('input', { bubbles: true }));

  // dir: +1 / -1、big: 10 刻み
  const nudge = (el, dir, big) => {
    const step = big ? 10 : 1;
    if (el.type === 'range') {
      const v = Math.min(Number(el.max), Math.max(Number(el.min), Number(el.value) + dir * step));
      if (String(v) !== el.value) { el.value = String(v); fire(el); }
    } else if (el.type === 'number') {
      const cur = Number(el.value);
      const base = Number.isInteger(cur) ? cur : 1;
      el.value = String(Math.min(LIMITS.countMax, Math.max(1, base + dir * step)));
    } else {
      const cur = parseSafeInt(el.value);
      if (cur === null) return;
      let v = cur + BigInt(dir * step);
      if (v > safe) v = safe;
      if (v < -safe) v = -safe;
      el.value = v.toString();
    }
  };

  for (const id of ['int-min', 'int-max', 'int-count', 'pw-length']) {
    const el = $(id);
    let acc = 0;
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      acc += e.deltaY * (e.deltaMode === 1 ? 40 : 1);
      while (Math.abs(acc) >= 100) {
        nudge(el, acc < 0 ? 1 : -1, e.shiftKey);
        acc -= Math.sign(acc) * 100;
      }
    }, { passive: false });
    if (el.type === 'text') {
      el.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        nudge(el, e.key === 'ArrowUp' ? 1 : -1, e.shiftKey);
      });
    }
  }
}

function init() {
  setLang(detectLang());
  setupTabs();
  setupNudge();
  applyI18n();
  syncRange();

  if (!isSupported()) {
    showError(t('unsupported'));
    $('generate').disabled = true;
  }

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    generate();
  });

  // パスワードは設定を変えるたびに作り直す
  const regen = () => {
    syncRange();
    $('pw-length-out').textContent = $('pw-length').value;
    if (state.mode === 'pw' && isSupported()) generate();
  };
  $('pw-length').addEventListener('input', regen);
  $('pw-digits').addEventListener('change', regen);
  $('pw-alpha').addEventListener('change', regen);
  $('pw-symbols').addEventListener('change', regen);

  els.copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(state.text);
      toast(t('copied'));
    } catch {
      toast(t('copyFail'));
    }
  });

  // 表示言語はブラウザ（OS）の言語設定に従う。設定が変わったら即反映する
  window.addEventListener('languagechange', () => {
    setLang(detectLang());
    applyI18n();
  });

  $('how').addEventListener('click', () => {
    $('about-title').textContent = t('aboutTitle');
    const body = $('about-body');
    body.replaceChildren();
    for (const [title, text] of t('about')) {
      const h = document.createElement('h3');
      h.textContent = title;
      const p = document.createElement('p');
      richText(p, text);
      body.append(h, p);
    }
    if (typeof els.about.showModal === 'function') els.about.showModal();
    else els.about.setAttribute('open', '');
  });
  $('about-close').addEventListener('click', () => (els.about.close ? els.about.close() : els.about.removeAttribute('open')));
  els.about.addEventListener('click', (e) => {
    if (e.target === els.about) els.about.close();
  });

  // PWA: Service Worker は同一サイトの静的ファイルをキャッシュするだけ
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
}

init();
})();
