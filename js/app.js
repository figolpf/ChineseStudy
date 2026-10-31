(function () {
  const CHARS = window.CHARS;
  const LEVELS = window.LEVELS;
  const WORDS = window.WORDS;
  const STRUCT = window.STRUCT;
  const KEY = "zibaby-v1";

  const app = document.getElementById("app");
  const overlay = document.getElementById("overlay");

  let prefs = loadPrefs();
  let token = 0;
  let speakGen = 0;
  let audioCtx = null;
  let writer = null;
  let recog = null;
  const state = {
    screen: "home",
    level: 1,
    ch: "日",
    tab: "look",
    word: "山水",
    returnTo: null,
    game: null,
    quiz: null,
    drill: "speak",
    listen: null,
    read: null
  };

  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(KEY)) || {};
      return {
        sound: p.sound !== false,
        pinyin: p.pinyin !== false,
        slow: !!p.slow,
        hello: !!p.hello,
        stars: p.stars || {}
      };
    } catch (e) {
      return { sound: true, pinyin: true, slow: false, hello: false, stars: {} };
    }
  }

  function savePrefs() {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }

  function applyBody() {
    document.body.classList.toggle("hide-py", !prefs.pinyin);
  }

  function byChar(ch) {
    return CHARS.find((c) => c.char === ch);
  }

  function byWord(word) {
    return WORDS.find((w) => w.word === word);
  }

  function current() {
    return byChar(state.ch);
  }

  function strokeCount(ch) {
    const data = window.STROKE_DATA && window.STROKE_DATA[ch];
    return data && data.strokes ? data.strokes.length : 0;
  }

  function cn(n) {
    const d = "零一二三四五六七八九";
    if (n <= 10) return n === 10 ? "十" : d[n];
    if (n < 20) return "十" + (n % 10 ? d[n % 10] : "");
    return d[Math.floor(n / 10)] + "十" + (n % 10 ? d[n % 10] : "");
  }

  function starsOf(ch) {
    return prefs.stars[ch] || 0;
  }

  function learnedCount() {
    return CHARS.filter((c) => starsOf(c.char) > 0).length;
  }

  function earn(ch, n) {
    if ((prefs.stars[ch] || 0) >= n) return;
    prefs.stars[ch] = n;
    savePrefs();
    document.querySelectorAll(`[data-star="${ch}"]`).forEach((el) => {
      el.innerHTML = starsHTML(n);
    });
  }

  function starsHTML(n) {
    return [1, 2, 3].map((i) => {
      return `<svg viewBox="0 0 20 20" class="${i <= n ? "on" : "off"}" aria-hidden="true"><polygon points="10,1.5 12.6,7.2 18.8,7.8 14.1,12 15.5,18.2 10,15 4.5,18.2 5.9,12 1.2,7.8 7.4,7.2"/></svg>`;
    }).join("");
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function alive(t) {
    return t === token;
  }

  function waitFrame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  let voiceEl = null;
  let clipStop = null;

  function voiceElement() {
    if (!voiceEl) {
      voiceEl = new Audio();
      voiceEl.preload = "auto";
      voiceEl.setAttribute("playsinline", "");
      voiceEl.setAttribute("webkit-playsinline", "");
    }
    return voiceEl;
  }

  function unlockSound() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        if (!audioCtx) audioCtx = new Ctx();
        const resume = audioCtx.resume();
        if (resume && resume.catch) resume.catch(() => {});
        if (audioCtx.state !== "running") {
          const buf = audioCtx.createBuffer(1, 1, 22050);
          const src = audioCtx.createBufferSource();
          src.buffer = buf;
          src.connect(audioCtx.destination);
          src.start(0);
        }
      }
    } catch (e) { /* 平板上没有提示音也不拦认字 */ }
    try {
      const el = voiceElement();
      if (!el.getAttribute("data-warm")) {
        el.setAttribute("data-warm", "1");
        el.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
        const p = el.play();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) { /* 忽略 */ }
    if (window.speechSynthesis) {
      try { speechSynthesis.resume(); } catch (e) { /* 忽略 */ }
    }
  }

  function tone(freq, dur) {
    if (!prefs.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      const resume = audioCtx.resume();
      if (resume && resume.catch) resume.catch(() => {});
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      const now = audioCtx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(now);
      o.stop(now + dur + 0.02);
    } catch (e) { /* 没有音频也不影响认字 */ }
  }

  function chime() {
    [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.14), i * 90));
  }

  function pickVoice() {
    const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    const zh = voices.filter((v) => /zh|cmn|chinese|中文/i.test((v.lang || "") + " " + (v.name || "")));
    return zh.find((v) => v.localService)
      || zh.find((v) => /zh(-|_)CN|cmn-Hans/i.test(v.lang || ""))
      || zh[0]
      || null;
  }

  function playClip(text, gen) {
    const url = window.VOICE_CLIPS && window.VOICE_CLIPS[text];
    if (!url) return Promise.resolve(false);
    return new Promise((resolve) => {
      const el = voiceElement();
      let settled = false;
      let started = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        if (clipStop === cancel) clipStop = null;
        el.onended = null;
        el.onerror = null;
        resolve(!!ok);
      };
      const cancel = () => finish(false);
      clipStop = cancel;
      el.onended = () => finish(true);
      el.onerror = () => finish(false);
      try {
        el.volume = 1;
        el.muted = false;
        el.playbackRate = prefs.slow ? 0.82 : 1;
      } catch (e) { /* 有的浏览器要等音频就绪才能改速度 */ }
      el.setAttribute("data-warm", "2");
      el.src = url;
      const begin = () => {
        if (settled || gen !== speakGen) {
          finish(false);
          return;
        }
        const p = el.play();
        if (p && p.then) p.then(() => { started = true; }).catch(() => finish(false));
        else started = true;
      };
      begin();
      setTimeout(() => {
        if (!settled && !started && gen === speakGen && el.paused) begin();
      }, 400);
      setTimeout(() => finish(started), 1600 + String(text).length * 420);
    });
  }

  function speakEngine(text, gen) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        setTimeout(resolve, 700);
        return;
      }
      let settled = false;
      let kick = null;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (kick) clearInterval(kick);
        resolve();
      };
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.rate = prefs.slow ? 0.7 : 0.85;
      u.pitch = 1.05;
      u.volume = 1;
      const voice = pickVoice();
      if (voice) u.voice = voice;
      u.onend = finish;
      u.onerror = finish;
      const start = () => {
        if (gen !== speakGen) {
          finish();
          return;
        }
        try {
          speechSynthesis.resume();
          speechSynthesis.speak(u);
          speechSynthesis.resume();
        } catch (e) {
          finish();
          return;
        }
        kick = setInterval(() => {
          if (gen !== speakGen) {
            finish();
            return;
          }
          try {
            if (speechSynthesis.speaking || speechSynthesis.paused) speechSynthesis.resume();
          } catch (e) { /* 忽略 */ }
        }, 200);
      };
      try {
        if (speechSynthesis.speaking || speechSynthesis.pending) {
          speechSynthesis.cancel();
          setTimeout(start, 160);
        } else start();
      } catch (e) {
        finish();
      }
      setTimeout(finish, 1000 + String(text).length * 420);
    });
  }

  function speak(text) {
    const gen = ++speakGen;
    const said = text == null ? "" : String(text);
    return new Promise((resolve) => {
      if (!prefs.sound || !said) {
        setTimeout(resolve, 400);
        return;
      }
      playClip(said, gen).then((ok) => {
        if (gen !== speakGen || ok) {
          resolve();
          return;
        }
        speakEngine(said, gen).then(resolve);
      });
    });
  }

  function stopVoice() {
    speakGen++;
    if (clipStop) clipStop();
    if (voiceEl) {
      try { voiceEl.pause(); } catch (e) { /* 忽略 */ }
    }
    try { speechSynthesis.cancel(); } catch (e) { /* 忽略 */ }
  }

  function confetti() {
    const layer = document.createElement("div");
    layer.className = "confetti";
    const colors = ["#ffb703", "#fb8500", "#2a9d8f", "#8ecae6", "#e76f51", "#bde0fe"];
    for (let i = 0; i < 26; i++) {
      const bit = document.createElement("i");
      bit.style.left = Math.random() * 100 + "%";
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = Math.random() * 0.15 + "s";
      layer.appendChild(bit);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 1400);
  }

  function iconBack() {
    return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M14 6 L8 12 L14 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function iconMic() {
    return `<svg viewBox="0 0 24 24" width="42" height="42" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M6 11a6 6 0 0 0 12 0M12 17v3M8 20h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  }

  function iconSpeaker() {
    const waves = prefs.sound
      ? `<path d="M16 9 a4 4 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`
      : `<path d="M16 10 L20 14 M20 10 L16 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 9 h4 l5 -4 v14 l-5 -4 H4 z" fill="currentColor"/>${waves}</svg>`;
  }

  function mascot() {
    return `<svg class="mascot-svg" viewBox="0 0 160 150" aria-hidden="true">
      <ellipse cx="80" cy="142" rx="36" ry="6" fill="rgba(74,52,40,.12)"/>
      <g class="arm">
        <path d="M118 78 Q142 58 134 40" stroke="#4A3428" stroke-width="6" fill="none" stroke-linecap="round"/>
        <circle cx="132" cy="36" r="8" fill="#F6C7A1" stroke="#4A3428" stroke-width="3"/>
      </g>
      <circle cx="80" cy="74" r="46" fill="#FFD6A5" stroke="#4A3428" stroke-width="4"/>
      <circle cx="64" cy="68" r="5" fill="#4A3428"/>
      <circle cx="98" cy="68" r="5" fill="#4A3428"/>
      <path d="M66 88 Q80 100 94 88" stroke="#4A3428" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="58" y="100" width="44" height="34" rx="8" fill="#fff" stroke="#E6B56A" stroke-width="3"/>
      <path d="M80 104 V130 M64 116 H96" stroke="#F0D3A4" stroke-width="2"/>
      <text x="80" y="124" text-anchor="middle" font-size="20" font-family="KaiTi, STKaiti, 楷体, serif" fill="#5c3d2e">字</text>
    </svg>`;
  }

  function levelStats(id) {
    if (id === 4) {
      return `${WORDS.length} 个词`;
    }
    const list = CHARS.filter((c) => c.level === id);
    const done = list.filter((c) => starsOf(c.char) > 0).length;
    return `认识 ${done} / ${list.length}`;
  }

  function viewHome() {
    const next = CHARS.find((c) => starsOf(c.char) === 0);
    const learned = learnedCount();
    const cards = LEVELS.map((lv) => `
      <button class="level-card" data-act="level" data-level="${lv.id}">
        <span class="watermark kai">${lv.mark}</span>
        <span class="step">${lv.step}</span>
        <strong>${lv.name}</strong>
        <p>${lv.desc}</p>
        <div class="count">${levelStats(lv.id)}</div>
      </button>`).join("");
    const go = next
      ? `<button class="btn primary wide" data-act="open" data-char="${next.char}">继续学「${next.char}」</button>`
      : `<button class="btn primary wide" data-act="level" data-level="4">字都认识了，去组词</button>`;
    const review = learned >= 3
      ? `<button class="btn" data-act="review">复习学过的字</button>`
      : "";
    const readGo = `<button class="btn" data-act="read-go" data-level="1">看字读音闯关</button>`;
    return `<main class="shell">
      <header class="topbar">
        <button class="icon-btn ${prefs.sound ? "on" : ""}" data-act="sound" aria-label="${prefs.sound ? "关闭声音" : "打开声音"}">${iconSpeaker()}</button>
        <span class="spacer"></span>
        <button class="icon-btn ${prefs.pinyin ? "on" : ""}" data-act="pinyin" aria-label="拼音开关">${prefs.pinyin ? "拼音" : "关"}</button>
      </header>
      <section class="hero">
        ${mascot()}
        <h1>字宝宝</h1>
        <p class="lead">看图画，认字形，一笔一笔写出来</p>
      </section>
      <div class="actions" style="margin-bottom:16px">${go}</div>
      <section class="levels">${cards}</section>
      <p class="progress-line">已经认识 <b>${learned}</b> 个字</p>
      <div class="actions">${readGo}${review}</div>
      <p class="progress-line">适合 3–6 岁，和爸爸妈妈一起读。</p>
    </main>`;
  }

  function viewLevel() {
    const lv = LEVELS.find((item) => item.id === state.level);
    const body = state.level === 4 ? wordGrid() : charGrid();
    const play = state.level === 4
      ? `<div class="actions"><button class="btn primary wide" data-act="play-words">开始找词</button></div>`
      : `<div class="actions"><button class="btn primary wide" data-act="read-go" data-level="${state.level}">看字读音闯关</button></div>`;
    return `<main class="shell">
      <header class="topbar">
        <button class="icon-btn" data-act="home" aria-label="返回首页">${iconBack()}</button>
        <div class="who"><strong>${lv.step} · ${lv.name}</strong></div>
      </header>
      <p class="level-lead">${lv.detail}</p>
      ${play}
      ${body}
    </main>`;
  }

  function charGrid() {
    const list = CHARS.filter((c) => c.level === state.level);
    return `<section class="char-grid">${list.map((c) => `
      <button class="char-bubble ${starsOf(c.char) ? "met" : ""}" data-act="open" data-char="${c.char}">
        <span class="glyph kai">${c.char}</span>
        <small>${c.word}</small>
        <small class="py">${c.pinyin}</small>
        <span class="stars" data-star="${c.char}">${starsHTML(starsOf(c.char))}</span>
      </button>`).join("")}</section>`;
  }

  function wordGrid() {
    return `<section class="word-grid">${WORDS.map((w) => `
      <button class="word-card" data-act="word" data-word="${w.word}">
        <div class="thumb"><div class="scene-slot">${window.sceneSVG(w.scene)}</div></div>
        <span class="kai">${w.word}</span>
        <small class="py">${w.pinyin}</small>
      </button>`).join("")}</section>`;
  }

  function viewLearn() {
    const item = current();
    const list = CHARS.filter((c) => c.level === item.level);
    const index = list.findIndex((c) => c.char === item.char);
    const hide = state.tab === "drill" && state.drill === "listen";
    return `<main class="shell">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="返回">${iconBack()}</button>
        <div class="who">
          <span class="glyph kai">${hide ? "听" : item.char}</span>
          <span class="word">${hide ? "听音选字" : item.word}</span>
          <span class="py">${hide ? "" : item.pinyin}</span>
        </div>
        <button class="icon-btn ${prefs.slow ? "on" : ""}" data-act="toggle-slow" aria-label="慢速">${prefs.slow ? "慢" : "慢"}</button>
        <button class="icon-btn" data-act="speak" aria-label="听一听">${iconSpeaker()}</button>
      </header>
      <div class="stars" data-star="${item.char}" style="justify-content:center;margin-top:8px">${starsHTML(starsOf(item.char))}</div>
      <nav class="tabs">
        <button data-act="tab" data-tab="look" class="${state.tab === "look" ? "on" : ""}">看一看</button>
        <button data-act="tab" data-tab="parts" class="${state.tab === "parts" ? "on" : ""}">拆一拆</button>
        <button data-act="tab" data-tab="write" class="${state.tab === "write" ? "on" : ""}">写一写</button>
        <button data-act="tab" data-tab="drill" class="${state.tab === "drill" ? "on" : ""}">练一练</button>
      </nav>
      <section id="panel"></section>
      <div class="footer-nav">
        <button class="btn" data-act="prev" ${index <= 0 ? "disabled" : ""}>上一个</button>
        <span>${index + 1} / ${list.length}</span>
        <button class="btn" data-act="next">${index >= list.length - 1 ? "回到这一关" : "下一个"}</button>
      </div>
    </main>`;
  }

  function writerBox(extra) {
    const item = current();
    const legend = item.parts
      ? `<p class="legend"><i class="dot o"></i>橙色是其中一块<i class="dot k"></i>其余笔画</p>`
      : "";
    return `<div class="${extra || ""}">
      <div class="tz">
        <div class="tz-lines"></div>
        <div class="hw" id="writer"></div>
      </div>
      <p class="stroke-label" id="strokeLabel">看轮廓</p>
      <div class="stroke-nos" id="strokeNos"></div>
      ${legend}
    </div>`;
  }

  function panelHTML() {
    const item = current();
    if (state.tab === "look") {
      return `<div class="look" id="look">
        <div class="card scene-card">
          <div class="scene-slot">${window.sceneSVG(item.scene)}</div>
          <p class="cap">${item.word} <span class="py">${item.pinyin}</span></p>
        </div>
        <div class="morph" aria-hidden="true"><span>变成</span><b class="to-side">→</b><b class="to-down">↓</b></div>
        <div class="card writer-card">${writerBox()}</div>
      </div>
      <p class="story">${item.story}</p>
      <div class="struct-badge" data-s="${item.structure}">${STRUCT[item.structure]}</div>
      <div class="actions">
        <button class="btn" data-act="replay">再看一遍</button>
        <button class="btn primary" data-act="ask">考一考</button>
      </div>`;
    }
    if (state.tab === "parts") {
      if (item.parts) {
        const layout = item.structure === "左右" ? "lr" : item.structure === "上下" ? "tb" : "pin";
        return `<div class="card">
          <div class="parts-top">
            <div class="scene-slot tiny">${window.sceneSVG(item.scene)}</div>
            <p class="part-line" id="partLine">${item.story}</p>
          </div>
          <div class="stage-box">
            <div class="assembly layout-${layout}" id="assembly">
              ${item.parts.map((p) => `<div class="piece" style="--c:${p.color}"><span class="kai">${p.t}</span><em>${p.name}</em></div>`).join("")}
            </div>
            <div class="merge-hold" id="mergeHold" hidden>${glyphHTML(item)}</div>
          </div>
          <div class="struct-badge" data-s="${item.structure}">${STRUCT[item.structure]}</div>
          <div class="actions"><button class="btn" data-act="replay">再拆一次</button></div>
        </div>`;
      }
      return `<div class="card">
        <div class="solo-teach">
          <div class="scene-slot">${window.sceneSVG(item.scene)}</div>
          <div style="text-align:center">
            <div class="solo-glyph kai">${item.char}</div>
            <div class="struct-badge" data-s="${item.structure}">${STRUCT[item.structure]}</div>
          </div>
        </div>
        <ul class="notes">${(item.notes || []).map((n) => `<li class="note">${n.say}</li>`).join("")}</ul>
        <p class="story">${item.story}</p>
        <div class="actions"><button class="btn" data-act="replay">再看一次</button></div>
      </div>`;
    }
    if (state.tab === "drill") return drillHTML();
    const n = strokeCount(item.char);
    return `<div class="card write-layout">
      ${writerBox("write-layout")}
      <p class="hint" id="writeHint">一共 ${cn(n)} 笔。先看，再沿着淡淡的字写。</p>
      <div class="actions">
        <button class="btn" data-act="demo">看笔顺</button>
        <button class="btn primary" data-act="quiz">我来写</button>
      </div>
    </div>`;
  }

  function drillModes() {
    const speakOn = state.drill !== "listen";
    return `<div class="mode-switch" role="tablist">
      <button data-act="drill" data-drill="speak" class="${speakOn ? "on" : ""}" role="tab">我说</button>
      <button data-act="drill" data-drill="listen" class="${speakOn ? "" : "on"}" role="tab">听音选</button>
    </div>`;
  }

  function drillHTML() {
    const item = current();
    if (state.drill !== "listen") {
      state.listen = null;
      return `<div class="card drill">
        ${drillModes()}
        <p class="hint">看着这个字，点麦克风说出来。</p>
        <div class="say-glyph kai">${item.char}</div>
        <button class="mic-btn" id="micBtn" data-act="mic" aria-label="说出这个字" aria-pressed="false">${iconMic()}</button>
        <p class="hint" id="micHint">点一下，开始说</p>
      </div>`;
    }
    const options = shuffle([item, ...distractors(item, 4)]);
    state.listen = { answer: item.char, missed: false, locked: false };
    return `<div class="card drill">
      ${drillModes()}
      <p class="hint" id="listenHint">听一听，是哪个字？</p>
      <div class="choices five">
        ${options.map((c) => `<button class="choice" data-act="listen-pick" data-key="${c.char}"><b class="kai">${c.char}</b></button>`).join("")}
      </div>
      <div class="actions"><button class="btn" data-act="listen-hear">再听一次</button></div>
    </div>`;
  }

  function syncLearnHeader() {
    if (state.screen !== "learn") return;
    const item = current();
    const hide = state.tab === "drill" && state.drill === "listen";
    const glyph = document.querySelector(".who .glyph");
    const word = document.querySelector(".who .word");
    const py = document.querySelector(".who .py");
    if (glyph) glyph.textContent = hide ? "听" : item.char;
    if (word) word.textContent = hide ? "听音选字" : item.word;
    if (py) py.textContent = hide ? "" : item.pinyin;
  }

  function stopRecog() {
    const rec = recog;
    recog = null;
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    try { rec.abort(); } catch (e) {
      try { rec.stop(); } catch (err) { /* 已经停了 */ }
    }
  }

  function matchHeard(transcript, ch) {
    const text = String(transcript || "").replace(/\s+/g, "").replace(/[，。！？、,.!?\-—~～]/g, "");
    return text.indexOf(ch) !== -1;
  }

  let hearCancel = null;

  function stopHear() {
    if (hearCancel) hearCancel();
    hearCancel = null;
  }

  function micDeniedText(err) {
    const text = String((err && (err.message || err.name)) || "");
    if (/advancedSecurityMode|坚盾/.test(text)) return "请先关闭「坚盾守护模式」，再点麦克风。";
    if (err && (err.name === "NotAllowedError" || err.name === "SecurityError")) {
      return "网页还不能用麦克风。请点地址栏左边的锁，允许本站使用麦克风。系统里打开还不够。";
    }
    if (err && err.name === "NotFoundError") return "没找到麦克风。";
    return "麦克风打不开，请再点一次。";
  }

  function finishHeard(ch, hooks, samples, rate, t) {
    if (!alive(t) || (hooks.still && !hooks.still())) return;
    const result = window.Mfcc ? window.Mfcc.judge(samples, rate, ch) : "quiet";
    if (result === "ok") hooks.onCorrect();
    else if (result === "wrong") hooks.onWrong();
    else {
      const hint = document.getElementById("micHint");
      if (hint) hint.textContent = "没听清，再点一次说吧。";
    }
  }

  function startMicMatch(ch, hooks) {
    const hint = document.getElementById("micHint");
    const btn = document.getElementById("micBtn");
    if (!window.isSecureContext) {
      if (hint) hint.textContent = "请用浏览器打开这个网页（https），才能使用麦克风。";
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (hint) hint.textContent = "这个浏览器不能打开麦克风。";
      return;
    }
    stopHear();
    stopRecog();
    stopVoice();
    if (btn) {
      btn.classList.add("on");
      btn.setAttribute("aria-pressed", "true");
    }
    if (hint) hint.textContent = "正在听，请说出这个字";
    const t = token;
    let stopped = false;
    let stream = null;
    let proc = null;
    let source = null;
    let mute = null;
    const chunks = [];
    const cleanup = () => {
      stopped = true;
      if (proc) {
        proc.onaudioprocess = null;
        try { proc.disconnect(); } catch (e) { /* 已经断开 */ }
      }
      if (source) { try { source.disconnect(); } catch (e) { /* 已经断开 */ } }
      if (mute) { try { mute.disconnect(); } catch (e) { /* 已经断开 */ } }
      if (stream) stream.getTracks().forEach((track) => track.stop());
      proc = null;
      source = null;
      mute = null;
      stream = null;
      if (hearCancel === cancel) hearCancel = null;
      const liveBtn = document.getElementById("micBtn");
      if (liveBtn) {
        liveBtn.classList.remove("on");
        liveBtn.setAttribute("aria-pressed", "false");
      }
    };
    const cancel = () => cleanup();
    hearCancel = cancel;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx && !audioCtx) audioCtx = new Ctx();
    if (audioCtx) {
      const resume = audioCtx.resume();
      if (resume && resume.catch) resume.catch(() => {});
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
      if (stopped || !alive(t)) {
        s.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = s;
      const ctx = audioCtx;
      if (!ctx || !ctx.createScriptProcessor) {
        cleanup();
        if (hint) hint.textContent = "这个浏览器不能打开麦克风。";
        return;
      }
      const resume = ctx.resume();
      if (resume && resume.catch) resume.catch(() => {});
      source = ctx.createMediaStreamSource(stream);
      proc = ctx.createScriptProcessor(4096, 1, 1);
      mute = ctx.createGain();
      mute.gain.value = 0;
      proc.onaudioprocess = (e) => {
        if (stopped) return;
        chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(proc);
      proc.connect(mute);
      mute.connect(ctx.destination);
      setTimeout(() => {
        if (stopped || !alive(t)) return;
        const rate = ctx.sampleRate || 16000;
        let total = 0;
        for (let i = 0; i < chunks.length; i++) total += chunks[i].length;
        const samples = new Float32Array(total);
        let offset = 0;
        for (let i = 0; i < chunks.length; i++) {
          samples.set(chunks[i], offset);
          offset += chunks[i].length;
        }
        cleanup();
        finishHeard(ch, hooks, samples, rate, t);
      }, 2000);
    }).catch((err) => {
      cleanup();
      if (hint && alive(t)) hint.textContent = micDeniedText(err);
    });
  }

  function listenChar(ch, hooks) {
    startMicMatch(ch, hooks);
  }

  function startSpeakQuiz() {
    const item = current();
    listenChar(item.char, {
      still() { return state.tab === "drill" && state.drill !== "listen"; },
      onCorrect() { praiseSpeak(item.char); },
      onWrong() { missSpeak(); }
    });
  }

  function startRead(level) {
    const chars = CHARS.filter((c) => c.level === level).map((c) => c.char);
    if (!chars.length) return;
    state.level = level;
    state.screen = "read";
    state.returnTo = null;
    state.read = { chars: chars, index: 0, cleared: {}, busy: false };
    render();
  }

  function startReadMic() {
    const r = state.read;
    if (!r || r.busy || r.index >= r.chars.length) return;
    const ch = r.chars[r.index];
    listenChar(ch, {
      unavailable: "现在听不了麦克风。请允许使用麦克风后再点一次。",
      still() {
        return state.screen === "read" && state.read && state.read.chars[state.read.index] === ch;
      },
      onCorrect() { passRead(ch); },
      onWrong() { missSpeak(); }
    });
  }

  async function passRead(ch) {
    const r = state.read;
    if (!r || r.busy || r.chars[r.index] !== ch) return;
    r.busy = true;
    await praiseSpeak(ch);
    if (state.screen !== "read" || !state.read || state.read.chars[state.read.index] !== ch) return;
    state.read.cleared[ch] = true;
    state.read.index += 1;
    state.read.busy = false;
    render();
  }

  function viewRead() {
    const r = state.read;
    const lv = LEVELS.find((item) => item.id === state.level);
    const total = r.chars.length;
    const done = r.index >= total;
    const list = `<div class="read-list" aria-label="这一关的字">${r.chars.map((ch, i) => {
      const cls = r.cleared[ch] ? "done" : i === r.index ? "now" : "";
      return `<b class="kai ${cls}">${ch}</b>`;
    }).join("")}</div>`;
    const body = done
      ? `<div class="card drill">
          <h2 class="kai read-title">读完啦</h2>
          <p class="story">这一关 ${total} 个字都读过了。</p>
          <div class="actions">
            ${state.level < 3 ? `<button class="btn primary" data-act="read-go" data-level="${state.level + 1}">下一关</button>` : ""}
            <button class="btn" data-act="back">返回</button>
          </div>
        </div>`
      : `<div class="card drill">
          <p class="hint">看着这个字，点麦克风读出来。</p>
          <div class="say-glyph kai">${r.chars[r.index]}</div>
          <button class="mic-btn" id="micBtn" data-act="read-mic" aria-label="说出这个字" aria-pressed="false">${iconMic()}</button>
          <p class="hint" id="micHint">点一下，开始说</p>
        </div>`;
    return `<main class="shell">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="返回">${iconBack()}</button>
        <div class="who"><strong>看字读音</strong><span class="word">${lv ? lv.name : ""}</span></div>
      </header>
      <p class="progress-line">${done ? "闯关完成" : `第 ${r.index + 1} 个，共 ${total} 个`}</p>
      ${list}
      ${body}
    </main>`;
  }

  async function praiseSpeak(ch) {
    const hint = document.getElementById("micHint");
    if (hint) hint.textContent = "真棒";
    confetti();
    chime();
    earn(ch, 3);
    await speak("真棒");
  }

  async function missSpeak() {
    const hint = document.getElementById("micHint");
    if (hint) hint.textContent = "不对哦，再想一想吧";
    tone(196, 0.12);
    await speak("不对哦，再想一想吧");
  }

  function armListen() {
    const hint = document.getElementById("listenHint");
    if (!prefs.sound) {
      if (hint) hint.textContent = "先打开声音，机器才能读这个字。";
      return;
    }
    const item = current();
    speak(item.say || item.char);
  }

  async function gradeListen(key, btn) {
    const q = state.listen;
    if (!q || q.locked || !btn || btn.disabled) return;
    if (key !== q.answer) {
      q.missed = true;
      btn.classList.add("wrong");
      btn.disabled = true;
      tone(196, 0.12);
      const hint = document.getElementById("listenHint");
      if (hint) hint.textContent = "不对哦，再想一想吧";
      speak("不对哦，再想一想吧");
      return;
    }
    q.locked = true;
    btn.classList.add("right");
    document.querySelectorAll(".drill .choice").forEach((el) => {
      if (el !== btn) el.disabled = true;
    });
    confetti();
    chime();
    earn(q.answer, q.missed ? 2 : 3);
    const hint = document.getElementById("listenHint");
    if (hint) hint.textContent = "真棒";
    await speak("真棒");
  }

  function clipPaths(item) {
    if (item.structure === "品字") {
      return ["inset(0 0 50% 0)", "inset(47% 50% 0 0)", "inset(47% 0 0 50%)"];
    }
    const pct = Math.round((item.split == null ? 0.5 : item.split) * 100);
    if (item.structure === "左右") {
      return [`inset(0 ${100 - pct - 1}% 0 0)`, `inset(0 0 0 ${pct - 1}%)`];
    }
    return [`inset(0 0 ${100 - pct - 1}% 0)`, `inset(${pct - 1}% 0 0 0)`];
  }

  function glyphHTML(item) {
    const clips = clipPaths(item);
    return `<div class="split-glyph kai" aria-label="${item.char}">
      ${item.parts.map((p, i) => `<span style="color:${p.color};clip-path:${clips[i]}">${item.char}</span>`).join("")}
    </div>`;
  }

  function makeWriter(el, ch) {
    writer = null;
    if (!el) return null;
    if (!window.HanziWriter || !window.STROKE_DATA || !window.STROKE_DATA[ch]) {
      el.innerHTML = `<div class="solo-glyph kai">${ch}</div>`;
      return null;
    }
    el.innerHTML = "";
    const size = Math.max(220, Math.round(el.getBoundingClientRect().width || 300));
    const item = byChar(ch);
    writer = HanziWriter.create(el, ch, {
      width: size,
      height: size,
      padding: 14,
      showOutline: true,
      showCharacter: false,
      renderer: "svg",
      strokeAnimationSpeed: prefs.slow ? 0.38 : 0.8,
      delayBetweenStrokes: prefs.slow ? 640 : 260,
      strokeFadeDuration: 180,
      strokeColor: "#5c3d2e",
      radicalColor: item && item.parts ? "#e07a3d" : "#5c3d2e",
      outlineColor: "#efd0a4",
      highlightColor: "#ffb703",
      drawingColor: "#0f7b6c",
      drawingWidth: 24,
      highlightOnComplete: true,
      highlightCompleteColor: "#1f8a7a",
      showHintAfterMisses: 1,
      markStrokeCorrectAfterMisses: 3,
      leniency: 1.35,
      charDataLoader(char, ok, err) {
        const data = window.STROKE_DATA[char];
        setTimeout(() => (data ? ok(data) : err && err()), 0);
      }
    });
    return writer;
  }

  function setNos(n, active) {
    const el = document.getElementById("strokeNos");
    if (!el) return;
    let html = "";
    for (let i = 0; i < n; i++) {
      const cls = i < active ? "done" : i === active ? "now" : "";
      html += `<b class="${cls}">${i + 1}</b>`;
    }
    el.innerHTML = html;
  }

  async function drawStrokes(t, ch) {
    const n = strokeCount(ch);
    if (!writer || !n) return;
    for (let i = 0; i < n; i++) {
      if (!alive(t)) return;
      setNos(n, i);
      try {
        await Promise.all([
          speak(`第${cn(i + 1)}笔`),
          writer.animateStroke(i)
        ]);
      } catch (e) {
        return;
      }
    }
    if (!alive(t)) return;
    setNos(n, n);
  }

  async function playLook(t) {
    await waitFrame();
    if (!alive(t)) return;
    const item = current();
    makeWriter(document.getElementById("writer"), item.char);
    const label = document.getElementById("strokeLabel");
    if (label) label.textContent = "看图";
    await speak(item.word);
    if (!alive(t)) return;
    const look = document.getElementById("look");
    if (look) look.classList.add("go");
    if (label) label.textContent = "写成字";
    await drawStrokes(t, item.char);
    if (!alive(t)) return;
    const n = strokeCount(item.char);
    if (label) label.textContent = `一共 ${cn(n)} 笔`;
    await speak(`${item.say}。一共${cn(n)}笔。`);
    if (!alive(t)) return;
    earn(item.char, 1);
    tone(660, 0.1);
  }

  async function playParts(t) {
    const item = current();
    if (!item.parts) {
      const notes = document.querySelectorAll(".note");
      for (let i = 0; i < notes.length; i++) {
        if (!alive(t)) return;
        notes[i].classList.add("in");
        await speak(item.notes[i].say);
      }
      if (!alive(t)) return;
      await speak(item.story);
      if (!alive(t)) return;
      earn(item.char, 2);
      return;
    }
    const pieces = document.querySelectorAll("#assembly .piece");
    const line = document.getElementById("partLine");
    for (let i = 0; i < item.parts.length; i++) {
      if (!alive(t)) return;
      if (pieces[i]) pieces[i].classList.add("in");
      if (line) line.textContent = item.parts[i].say;
      await speak(item.parts[i].say);
    }
    if (!alive(t)) return;
    const assembly = document.getElementById("assembly");
    const hold = document.getElementById("mergeHold");
    if (assembly) assembly.classList.add("away");
    if (hold) {
      hold.hidden = false;
      hold.classList.add("pop");
    }
    if (line) line.textContent = item.story;
    await speak(item.say + "。" + item.story);
    if (!alive(t)) return;
    earn(item.char, 2);
    chime();
  }

  async function mountWrite(t) {
    await waitFrame();
    if (!alive(t)) return;
    const item = current();
    makeWriter(document.getElementById("writer"), item.char);
    setNos(strokeCount(item.char), -1);
  }

  async function playDemo(t) {
    const item = current();
    const hint = document.getElementById("writeHint");
    if (hint) hint.textContent = "看着一笔一笔写出来。";
    if (!writer) makeWriter(document.getElementById("writer"), item.char);
    await drawStrokes(t, item.char);
    if (!alive(t)) return;
    if (hint) hint.textContent = "看完啦。想写的话，按「我来写」。";
    earn(item.char, 1);
  }

  function startWriteQuiz() {
    token++;
    const item = current();
    const el = document.getElementById("writer");
    if (!el) return;
    makeWriter(el, item.char);
    if (!writer) return;
    const hint = document.getElementById("writeHint");
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (hint) hint.textContent = touch ? "用手指沿着亮亮的地方画。" : "按住鼠标，沿着亮亮的地方画。";
    setNos(strokeCount(item.char), 0);
    writer.quiz({
      onMistake() {
        const h = document.getElementById("writeHint");
        if (h) h.textContent = "没关系，看这一笔再写。";
        tone(196, 0.12);
      },
      onCorrectStroke(data) {
        tone(640, 0.08);
        const done = data && typeof data.strokeNum === "number" ? data.strokeNum + 1 : 0;
        setNos(strokeCount(item.char), done);
      },
      onComplete() {
        const h = document.getElementById("writeHint");
        if (h) h.textContent = "写完啦，真厉害！";
        setNos(strokeCount(item.char), strokeCount(item.char));
        earn(item.char, 3);
        confetti();
        chime();
        speak("写得真好");
      }
    });
  }

  function viewWord() {
    const w = byWord(state.word);
    return `<main class="shell">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="返回">${iconBack()}</button>
        <div class="who"><strong class="kai" style="font-size:32px">${w.word}</strong><span class="py">${w.pinyin}</span></div>
        <button class="icon-btn" data-act="speak" aria-label="听一听">${iconSpeaker()}</button>
      </header>
      <div class="card" style="margin-top:16px">
        <div class="scene-slot big">${window.sceneSVG(w.scene)}</div>
        <div class="word-row" id="wordRow">
          ${w.chars.map((ch) => `<button class="kai" data-act="open" data-char="${ch}" style="color:#5c3d2e">${ch}<small>${starsOf(ch) ? "学过" : "去学"}</small></button>`).join("")}
        </div>
        <p class="story" id="wordLine">${w.line}</p>
        <div class="actions"><button class="btn" data-act="replay">再听一遍</button></div>
      </div>
    </main>`;
  }

  async function playWord(t) {
    const w = byWord(state.word);
    await speak(w.word);
    if (!alive(t)) return;
    const buttons = document.querySelectorAll("#wordRow button");
    for (let i = 0; i < w.chars.length; i++) {
      if (!alive(t)) return;
      if (buttons[i]) buttons[i].classList.add("in");
      await speak(w.chars[i]);
    }
    if (!alive(t)) return;
    const line = document.getElementById("wordLine");
    if (line) line.textContent = w.line;
    await speak(w.line);
  }

  function viewGame() {
    return `<main class="shell">
      <header class="topbar">
        <button class="icon-btn" data-act="back" aria-label="返回">${iconBack()}</button>
        <div class="who"><strong>${state.game.mode === "word" ? "找词" : "复习"}</strong></div>
        <button class="icon-btn" data-act="hear" aria-label="再听一次">${iconSpeaker()}</button>
      </header>
      <div id="gameBody"></div>
    </main>`;
  }

  function roundHTML() {
    const g = state.game;
    const round = g.rounds[g.index];
    return `<p class="progress-line">第 ${g.index + 1} 题，共 ${g.rounds.length} 题</p>
      <div class="card">
        <div class="scene-slot big">${window.sceneSVG(round.scene)}</div>
        <p class="story">${round.say}</p>
        <div class="choices">
          ${round.options.map((o) => `<button class="choice" data-act="pick" data-key="${o.key}"><b class="kai">${o.label}</b></button>`).join("")}
        </div>
      </div>`;
  }

  function endHTML() {
    const g = state.game;
    const again = g.mode === "word" ? "play-words" : "review";
    return `<div class="card" style="text-align:center;padding:28px 16px">
      <h2 class="kai" style="font-size:40px;font-weight:400;margin:0">找完啦</h2>
      <p class="story">${g.rounds.length} 题里面，一次就找到 ${g.firstCorrect} 题。</p>
      <div class="actions">
        <button class="btn primary" data-act="${again}">再玩一次</button>
        <button class="btn" data-act="back">返回</button>
      </div>
    </div>`;
  }

  async function showRound(t) {
    const g = state.game;
    const body = document.getElementById("gameBody");
    if (!body || !g) return;
    if (g.index >= g.rounds.length) {
      body.innerHTML = endHTML();
      chime();
      return;
    }
    body.innerHTML = roundHTML();
    await speak(g.rounds[g.index].say);
    if (!alive(t)) return;
  }

  function wordRounds() {
    return shuffle(WORDS).slice(0, 6).map((w) => {
      const others = shuffle(WORDS.filter((item) => item.word !== w.word)).slice(0, 2);
      return {
        say: w.word + "，在哪里？",
        scene: w.scene,
        answer: w.word,
        options: shuffle([w, ...others]).map((item) => ({ key: item.word, label: item.word }))
      };
    });
  }

  function reviewRounds() {
    let learned = CHARS.filter((c) => starsOf(c.char) > 0);
    if (learned.length < 3) learned = CHARS.slice(0, 6);
    return shuffle(learned).slice(0, Math.min(6, learned.length)).map((item) => {
      let pool = shuffle(learned.filter((c) => c.char !== item.char));
      if (pool.length < 2) {
        pool = pool.concat(shuffle(CHARS.filter((c) => c.char !== item.char && !pool.includes(c))));
      }
      const options = shuffle([item, ...pool.slice(0, 2)]);
      return {
        say: item.word + "，是哪个字？",
        scene: item.scene,
        answer: item.char,
        options: options.map((c) => ({ key: c.char, label: c.char }))
      };
    });
  }

  function distractors(item, n) {
    const count = n || 2;
    const same = shuffle(CHARS.filter((c) => c.level === item.level && c.char !== item.char));
    const rest = shuffle(CHARS.filter((c) => c.level !== item.level && c.char !== item.char));
    return same.concat(rest).slice(0, count);
  }

  function openAsk() {
    token++;
    stopVoice();
    const item = current();
    const options = shuffle([item, ...distractors(item)]);
    state.quiz = { answer: item.char, missed: false, locked: false };
    overlay.innerHTML = `<div class="overlay">
      <div class="dialog" role="dialog" aria-label="考一考">
        <button class="icon-btn x" data-act="close" aria-label="关闭">×</button>
        <div class="scene-slot" style="width:160px">${window.sceneSVG(item.scene)}</div>
        <p class="story">${item.word}，是哪个字？</p>
        <div class="choices">
          ${options.map((c) => `<button class="choice" data-act="pick" data-key="${c.char}"><b class="kai">${c.char}</b></button>`).join("")}
        </div>
        <div class="actions"><button class="btn" data-act="ask-hear">再听一次</button></div>
      </div>
    </div>`;
    speak(item.word + "，是哪个字？");
  }

  async function gradeQuiz(key, btn) {
    const q = state.quiz;
    if (!q || q.locked) return;
    if (key !== q.answer) {
      q.missed = true;
      btn.classList.add("wrong");
      tone(196, 0.12);
      speak("再找找");
      return;
    }
    q.locked = true;
    btn.classList.add("right");
    confetti();
    chime();
    if (!q.missed) earn(q.answer, 3);
    else earn(q.answer, 2);
    await speak("对啦，这是" + q.answer);
    state.quiz = null;
    overlay.innerHTML = "";
  }

  async function gradeGame(key, btn) {
    const g = state.game;
    if (!g || g.locked || g.index >= g.rounds.length) return;
    const round = g.rounds[g.index];
    if (key !== round.answer) {
      round.missed = true;
      btn.classList.add("wrong");
      tone(196, 0.12);
      speak("再找找");
      return;
    }
    g.locked = true;
    if (!round.missed) g.firstCorrect++;
    btn.classList.add("right");
    confetti();
    chime();
    await speak("对啦");
    if (state.screen !== "game") return;
    g.index += 1;
    g.locked = false;
    token++;
    showRound(token);
  }

  function showWelcome() {
    overlay.innerHTML = `<div class="overlay">
      <div class="dialog" role="dialog" aria-label="欢迎">
        ${mascot()}
        <h2>我是字宝</h2>
        <p class="story">小朋友你好。我们看图画、认字形，再一笔一笔写。</p>
        <button class="btn primary wide" data-act="hello">出发</button>
      </div>
    </div>`;
  }

  function render() {
    token++;
    stopVoice();
    stopRecog();
    stopHear();
    writer = null;
    state.quiz = null;
    overlay.innerHTML = "";
    applyBody();
    const views = { home: viewHome, level: viewLevel, learn: viewLearn, word: viewWord, game: viewGame, read: viewRead };
    app.innerHTML = views[state.screen]();
    const t = token;
    if (state.screen === "learn") fillPanel(t);
    else if (state.screen === "word") playWord(t);
    else if (state.screen === "game") showRound(t);
    else if (state.screen === "home" && !prefs.hello) showWelcome();
  }

  function fillPanel(t) {
    const panel = document.getElementById("panel");
    if (!panel) return;
    panel.innerHTML = panelHTML();
    document.querySelectorAll(".tabs button").forEach((b) => {
      b.classList.toggle("on", b.dataset.tab === state.tab);
    });
    syncLearnHeader();
    if (state.tab === "look") playLook(t);
    else if (state.tab === "parts") playParts(t);
    else if (state.tab === "drill") {
      if (state.drill === "listen") armListen();
    } else mountWrite(t);
  }

  function openTab(tab) {
    state.tab = tab;
    if (tab !== "drill") state.drill = state.drill || "speak";
    token++;
    stopVoice();
    stopRecog();
    stopHear();
    fillPanel(token);
  }

  function openChar(ch) {
    const item = byChar(ch);
    if (!item) return;
    state.screen = "learn";
    state.ch = ch;
    state.level = item.level;
    state.tab = "look";
    render();
  }

  function openLevel(id) {
    state.screen = "level";
    state.level = id;
    state.returnTo = null;
    render();
  }

  function goBack() {
    if (state.returnTo && state.returnTo.screen === "word") {
      const word = state.returnTo.word;
      state.returnTo = null;
      state.screen = "word";
      state.word = word;
      state.level = 4;
      render();
      return;
    }
    if (state.screen === "read") {
      openLevel(state.level);
      return;
    }
    if (state.screen === "home") return;
    openLevel(state.level);
  }

  function shiftChar(dir) {
    state.returnTo = null;
    const list = CHARS.filter((c) => c.level === state.level);
    const index = list.findIndex((c) => c.char === state.ch);
    const next = index + dir;
    if (next < 0 || next >= list.length) openLevel(state.level);
    else openChar(list[next].char);
  }

  function startGame(mode) {
    const rounds = mode === "word" ? wordRounds() : reviewRounds();
    state.screen = "game";
    state.level = mode === "word" ? 4 : state.level;
    state.returnTo = null;
    state.game = { mode, rounds, index: 0, firstCorrect: 0, locked: false };
    render();
  }

  function onClick(e) {
    unlockSound();
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    const act = btn.dataset.act;
    if (act === "hello") {
      prefs.hello = true;
      savePrefs();
      overlay.innerHTML = "";
      speak("我们一起认字吧");
      return;
    }
    if (act === "close") {
      state.quiz = null;
      overlay.innerHTML = "";
      return;
    }
    if (act === "home") {
      state.screen = "home";
      state.returnTo = null;
      render();
      return;
    }
    if (act === "back") {
      goBack();
      return;
    }
    if (act === "level") {
      openLevel(Number(btn.dataset.level));
      return;
    }
    if (act === "open") {
      state.returnTo = state.screen === "word" ? { screen: "word", word: state.word } : null;
      openChar(btn.dataset.char);
      return;
    }
    if (act === "word") {
      state.returnTo = null;
      state.screen = "word";
      state.word = btn.dataset.word;
      state.level = 4;
      render();
      return;
    }
    if (act === "tab") {
      openTab(btn.dataset.tab);
      return;
    }
    if (act === "replay") {
      if (state.screen === "learn") openTab(state.tab);
      else if (state.screen === "word") {
        token++;
        stopVoice();
        playWord(token);
      }
      return;
    }
    if (act === "speak") {
      token++;
      if (state.screen === "learn") speak(current().say);
      else if (state.screen === "word") speak(byWord(state.word).word + "。" + byWord(state.word).line);
      return;
    }
    if (act === "hear" || act === "ask-hear") {
      if (state.quiz) speak(current().word + "，是哪个字？");
      else if (state.game && state.game.rounds[state.game.index]) speak(state.game.rounds[state.game.index].say);
      return;
    }
    if (act === "toggle-slow") {
      prefs.slow = !prefs.slow;
      savePrefs();
      if (state.screen === "learn") openTab(state.tab);
      return;
    }
    if (act === "sound") {
      prefs.sound = !prefs.sound;
      savePrefs();
      if (!prefs.sound) stopVoice();
      render();
      return;
    }
    if (act === "pinyin") {
      prefs.pinyin = !prefs.pinyin;
      savePrefs();
      applyBody();
      const toggle = document.querySelector('[data-act="pinyin"]');
      if (toggle) {
        toggle.classList.toggle("on", prefs.pinyin);
        toggle.textContent = prefs.pinyin ? "拼音" : "关";
      }
      return;
    }
    if (act === "ask") {
      openAsk();
      return;
    }
    if (act === "demo") {
      token++;
      stopVoice();
      playDemo(token);
      return;
    }
    if (act === "quiz") {
      startWriteQuiz();
      return;
    }
    if (act === "drill") {
      state.drill = btn.dataset.drill === "listen" ? "listen" : "speak";
      openTab("drill");
      return;
    }
    if (act === "mic") {
      startSpeakQuiz();
      return;
    }
    if (act === "read-go") {
      startRead(Number(btn.dataset.level) || 1);
      return;
    }
    if (act === "read-mic") {
      startReadMic();
      return;
    }
    if (act === "listen-hear") {
      token++;
      stopVoice();
      armListen();
      return;
    }
    if (act === "listen-pick") {
      gradeListen(btn.dataset.key, btn);
      return;
    }
    if (act === "pick") {
      if (state.quiz) gradeQuiz(btn.dataset.key, btn);
      else if (state.game) gradeGame(btn.dataset.key, btn);
      return;
    }
    if (act === "prev") shiftChar(-1);
    if (act === "next") shiftChar(1);
    if (act === "play-words") startGame("word");
    if (act === "review") startGame("char");
  }

  document.addEventListener("click", onClick);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (overlay.innerHTML) {
      state.quiz = null;
      overlay.innerHTML = "";
      return;
    }
    if (state.screen !== "home") goBack();
  });
  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest(".hw")) e.preventDefault();
  });

  if (window.speechSynthesis) {
    speechSynthesis.getVoices();
    speechSynthesis.addEventListener("voiceschanged", () => speechSynthesis.getVoices());
  }
  document.addEventListener("pointerdown", unlockSound, { capture: true });
  applyBody();
  render();
})();
