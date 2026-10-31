(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Mfcc = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const SR = 16000;
  const NFFT = 512;
  const NF = 26;
  const KEEP = 12;

  function resample(input, fromRate, toRate) {
    if (!input || !input.length) return new Float32Array(0);
    if (fromRate === toRate) return input instanceof Float32Array ? input : Float32Array.from(input);
    const step = fromRate / toRate;
    const outLen = Math.max(1, Math.floor(input.length / step));
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const x = i * step;
      const i0 = Math.floor(x);
      const i1 = Math.min(i0 + 1, input.length - 1);
      const t = x - i0;
      out[i] = input[i0] * (1 - t) + input[i1] * t;
    }
    return out;
  }

  function trimSilence(samples) {
    const frame = 320;
    if (samples.length < frame) return new Float32Array(0);
    const rms = [];
    for (let i = 0; i + frame <= samples.length; i += frame) {
      let s = 0;
      for (let j = i; j < i + frame; j++) s += samples[j] * samples[j];
      rms.push(Math.sqrt(s / frame));
    }
    let peak = 0;
    for (let i = 0; i < rms.length; i++) if (rms[i] > peak) peak = rms[i];
    if (peak < 0.012) return new Float32Array(0);
    const th = peak * 0.18;
    let a = 0;
    let b = rms.length - 1;
    while (a < rms.length && rms[a] < th) a++;
    while (b > a && rms[b] < th) b--;
    const start = Math.max(0, a * frame - 160);
    const end = Math.min(samples.length, (b + 1) * frame + 160);
    if (end - start < SR * 0.12) return new Float32Array(0);
    return samples.subarray(start, end);
  }

  function normalize(samples) {
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      const a = samples[i] < 0 ? -samples[i] : samples[i];
      if (a > peak) peak = a;
    }
    if (peak < 1e-4) return samples;
    const out = new Float32Array(samples.length);
    const g = 0.9 / peak;
    for (let i = 0; i < samples.length; i++) out[i] = samples[i] * g;
    return out;
  }

  function hzToMel(hz) { return 2595 * Math.log10(1 + hz / 700); }
  function melToHz(mel) { return 700 * (Math.pow(10, mel / 2595) - 1); }

  let filters = null;
  function melFilters() {
    if (filters) return filters;
    const low = hzToMel(80);
    const high = hzToMel(7600);
    const points = new Float64Array(NF + 2);
    for (let i = 0; i < points.length; i++) {
      const hz = melToHz(low + (high - low) * i / (NF + 1));
      points[i] = Math.floor((NFFT + 1) * hz / SR);
    }
    filters = [];
    for (let m = 1; m <= NF; m++) {
      const left = points[m - 1];
      const mid = points[m];
      const right = points[m + 1];
      const row = new Float64Array(NFFT / 2 + 1);
      for (let k = left; k < mid; k++) if (mid !== left) row[k] = (k - left) / (mid - left);
      for (let k = mid; k < right; k++) if (right !== mid) row[k] = (right - k) / (right - mid);
      filters.push(row);
    }
    return filters;
  }

  function fftPower(frame) {
    const n = NFFT;
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    for (let i = 0; i < frame.length && i < n; i++) re[i] = frame[i];
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        const tr = re[i]; re[i] = re[j]; re[j] = tr;
        const ti = im[i]; im[i] = im[j]; im[j] = ti;
      }
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const theta = -2 * Math.PI / size;
      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < half; j++) {
          const wr = Math.cos(theta * j);
          const wi = Math.sin(theta * j);
          const k = i + j + half;
          const tr = wr * re[k] - wi * im[k];
          const ti = wr * im[k] + wi * re[k];
          re[k] = re[i + j] - tr;
          im[k] = im[i + j] - ti;
          re[i + j] += tr;
          im[i + j] += ti;
        }
      }
    }
    const pow = new Float64Array(n / 2 + 1);
    for (let i = 0; i < pow.length; i++) pow[i] = re[i] * re[i] + im[i] * im[i];
    return pow;
  }

  function features(samples, sampleRate) {
    let x = resample(samples, sampleRate || SR, SR);
    x = trimSilence(x);
    if (!x.length) return null;
    x = normalize(x);
    const emphasized = new Float32Array(x.length);
    emphasized[0] = x[0];
    for (let i = 1; i < x.length; i++) emphasized[i] = x[i] - 0.97 * x[i - 1];
    const win = 400;
    const hop = 160;
    if (emphasized.length < win) return null;
    const bank = melFilters();
    const seq = [];
    const window = new Float64Array(win);
    for (let n = 0; n < win; n++) window[n] = 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (win - 1));
    for (let start = 0; start + win <= emphasized.length; start += hop) {
      const frame = new Float64Array(win);
      for (let n = 0; n < win; n++) frame[n] = emphasized[start + n] * window[n];
      const spec = fftPower(frame);
      const mel = new Float64Array(NF);
      for (let m = 0; m < NF; m++) {
        let e = 0;
        const row = bank[m];
        for (let k = 0; k < row.length; k++) e += row[k] * spec[k];
        mel[m] = Math.log(e + 1e-10);
      }
      const coef = new Array(KEEP);
      for (let k = 1; k <= KEEP; k++) {
        let sum = 0;
        for (let n = 0; n < NF; n++) sum += mel[n] * Math.cos(Math.PI * k * (n + 0.5) / NF);
        coef[k - 1] = sum;
      }
      seq.push(coef);
    }
    if (seq.length < 6) return null;
    for (let k = 0; k < KEEP; k++) {
      let mean = 0;
      for (let i = 0; i < seq.length; i++) mean += seq[i][k];
      mean /= seq.length;
      for (let i = 0; i < seq.length; i++) seq[i][k] -= mean;
    }
    return seq;
  }

  function dist(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) {
      const d = a[i] - b[i];
      s += d * d;
    }
    return Math.sqrt(s);
  }

  function dtw(a, b) {
    const n = a.length;
    const m = b.length;
    const inf = 1e12;
    let prev = new Float64Array(m + 1);
    let cur = new Float64Array(m + 1);
    prev[0] = 0;
    for (let j = 1; j <= m; j++) prev[j] = inf;
    for (let i = 1; i <= n; i++) {
      cur[0] = inf;
      const ai = a[i - 1];
      for (let j = 1; j <= m; j++) {
        const cost = dist(ai, b[j - 1]);
        const stay = prev[j];
        const diag = prev[j - 1];
        const left = cur[j - 1];
        const best = stay < diag ? (stay < left ? stay : left) : (diag < left ? diag : left);
        cur[j] = cost + best;
      }
      const swap = prev;
      prev = cur;
      cur = swap;
    }
    return prev[m] / (n + m);
  }

  function judge(samples, sampleRate, targetChar) {
    const bank = globalThis.SYLLABLES || [];
    const seq = features(samples, sampleRate);
    if (!seq || !bank.length) return "quiet";
    let target = null;
    let best = null;
    for (let i = 0; i < bank.length; i++) {
      const item = bank[i];
      if (item.char === targetChar) target = item;
      let d = Infinity;
      for (let s = 0; s < item.seqs.length; s++) {
        const score = dtw(seq, item.seqs[s]);
        if (score < d) d = score;
      }
      if (!best || d < best.d) best = { d: d, pinyin: item.pinyin };
    }
    if (!target || !best) return "quiet";
    return best.pinyin === target.pinyin ? "ok" : "wrong";
  }

  return { features: features, dtw: dtw, judge: judge, resample: resample };
});
