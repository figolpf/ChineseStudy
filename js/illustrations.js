(function () {
  const INK = "#4A3428";

  function svg(label, body) {
    return `<svg class="scene" viewBox="0 0 240 240" role="img" aria-label="${label}">${body}</svg>`;
  }

  function eyes(cx, cy, r, sleep) {
    if (sleep) {
      return `<path d="M ${cx - r * 0.42} ${cy} q ${r * 0.2} ${r * 0.16} ${r * 0.36} 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M ${cx + r * 0.06} ${cy} q ${r * 0.2} ${r * 0.16} ${r * 0.36} 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    const er = Math.max(1.8, r * 0.09);
    const blush = r > 16
      ? `<circle cx="${cx - r * 0.52}" cy="${cy + r * 0.22}" r="${r * 0.11}" fill="#F4A4A4" opacity=".85"/>
         <circle cx="${cx + r * 0.52}" cy="${cy + r * 0.22}" r="${r * 0.11}" fill="#F4A4A4" opacity=".85"/>`
      : "";
    return `<circle cx="${cx - r * 0.32}" cy="${cy - r * 0.06}" r="${er}" fill="${INK}"/>
      <circle cx="${cx + r * 0.32}" cy="${cy - r * 0.06}" r="${er}" fill="${INK}"/>
      <path d="M ${cx - r * 0.26} ${cy + r * 0.32} Q ${cx} ${cy + r * 0.52} ${cx + r * 0.26} ${cy + r * 0.32}" stroke="${INK}" stroke-width="${Math.max(2, r * 0.1)}" fill="none" stroke-linecap="round"/>
      ${blush}`;
  }

  function sunFace(x, y, r, delay) {
    let rays = "";
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const x1 = x + Math.cos(a) * (r + 8);
      const y1 = y + Math.sin(a) * (r + 8);
      const x2 = x + Math.cos(a) * (r + 22);
      const y2 = y + Math.sin(a) * (r + 22);
      rays += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#F4A261" stroke-width="6" stroke-linecap="round"/>`;
    }
    return `<g class="rise" style="animation-delay:${delay || 0}s">
      <g class="spin">${rays}</g>
      <circle cx="${x}" cy="${y}" r="${r}" fill="#FFD166" stroke="${INK}" stroke-width="4"/>
      ${eyes(x, y, r)}
    </g>`;
  }

  function moonFace(x, y, r, delay) {
    const d = `M ${x.toFixed(1)} ${(y - r).toFixed(1)} A ${r} ${r} 0 1 0 ${x.toFixed(1)} ${(y + r).toFixed(1)} A ${(r * 0.72).toFixed(1)} ${(r * 0.96).toFixed(1)} 0 1 1 ${x.toFixed(1)} ${(y - r).toFixed(1)} Z`;
    return `<g class="rise" style="animation-delay:${delay || 0}s">
      <path d="${d}" fill="#FFF6D0" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      ${eyes(x - r * 0.32, y, r * 0.46)}
    </g>`;
  }

  function star(x, y, r, delay, color) {
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const b = a + Math.PI / 5;
      pts.push(`${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`);
      pts.push(`${(x + Math.cos(b) * r * 0.42).toFixed(1)},${(y + Math.sin(b) * r * 0.42).toFixed(1)}`);
    }
    return `<polygon class="rise" style="animation-delay:${delay}s" points="${pts.join(" ")}" fill="${color || "#FFD166"}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  }

  function tree(x, base, s, delay, leaf) {
    const top = base - 92 * s;
    const mid = base - 46 * s;
    const color = leaf || "#52B788";
    return `<g class="rise" style="animation-delay:${delay || 0}s">
      <path d="M ${x} ${top} L ${x} ${base}" stroke="#C4A484" stroke-width="${11 * s}" stroke-linecap="round"/>
      <path d="M ${x - 36 * s} ${mid} L ${x + 36 * s} ${mid}" stroke="#2D6A4F" stroke-width="${8 * s}" stroke-linecap="round"/>
      <path d="M ${x} ${base - 6 * s} L ${x - 30 * s} ${base + 18 * s}" stroke="#2D6A4F" stroke-width="${8 * s}" stroke-linecap="round"/>
      <path d="M ${x} ${base - 6 * s} L ${x + 30 * s} ${base + 18 * s}" stroke="#2D6A4F" stroke-width="${8 * s}" stroke-linecap="round"/>
      <circle cx="${x}" cy="${top + 4 * s}" r="${14 * s}" fill="${color}" stroke="${INK}" stroke-width="3"/>
      <circle cx="${x - 36 * s}" cy="${mid}" r="${9 * s}" fill="${color}" stroke="${INK}" stroke-width="3"/>
      <circle cx="${x + 36 * s}" cy="${mid}" r="${9 * s}" fill="#95D5B2" stroke="${INK}" stroke-width="3"/>
    </g>`;
  }

  function flame(x, y, s, delay, color) {
    return `<path class="rise flicker" style="animation-delay:${delay || 0}s" d="M ${x} ${y - 46 * s} C ${x + 20 * s} ${y - 24 * s}, ${x + 18 * s} ${y - 4 * s}, ${x} ${y + 8 * s} C ${x - 18 * s} ${y - 4 * s}, ${x - 20 * s} ${y - 24 * s}, ${x} ${y - 46 * s} Z" fill="${color || "#E76F51"}" stroke="${INK}" stroke-width="3"/>`;
  }

  function apple(x, y, s, delay) {
    return `<g class="rise" style="animation-delay:${delay || 0}s">
      <circle cx="${x}" cy="${y}" r="${18 * s}" fill="#E76F51" stroke="${INK}" stroke-width="3"/>
      <path d="M ${x} ${y - 16 * s} q ${6 * s} ${-12 * s} ${14 * s} ${-6 * s}" stroke="#2D6A4F" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="${x - 6 * s}" cy="${y - 4 * s}" rx="${4 * s}" ry="3" fill="#fff" opacity=".45"/>
    </g>`;
  }

  function kid(o) {
    const s = o.s || 1;
    const x = o.x;
    const y = o.y;
    const r = 20 * s;
    const shirt = o.shirt || "#8ECAE6";
    const bodyTop = y + r * 0.85;
    const bodyW = 36 * s;
    const bodyH = 38 * s;
    const sw = 4;
    let hair = "";
    if (o.hair === "short") {
      hair = `<path d="M ${x - r * 0.92} ${y - r * 0.15} Q ${x} ${y - r * 1.45} ${x + r * 0.92} ${y - r * 0.15} Q ${x} ${y - r * 0.55} ${x - r * 0.92} ${y - r * 0.15}" fill="${INK}"/>`;
    } else if (o.hair === "long") {
      hair = `<path d="M ${x - r * 0.2} ${y - r * 0.95} Q ${x} ${y - r * 1.45} ${x + r * 0.55} ${y - r * 0.7}" stroke="${INK}" stroke-width="${6 * s}" fill="none" stroke-linecap="round"/>
        <path d="M ${x - r * 0.72} ${y + r * 0.15} Q ${x - r * 1.15} ${y + r} ${x - r * 0.55} ${y + r * 1.85}" stroke="${INK}" stroke-width="${6 * s}" fill="none" stroke-linecap="round"/>
        <path d="M ${x + r * 0.72} ${y + r * 0.15} Q ${x + r * 1.15} ${y + r} ${x + r * 0.55} ${y + r * 1.85}" stroke="${INK}" stroke-width="${6 * s}" fill="none" stroke-linecap="round"/>`;
    } else if (o.hair === "pigtail") {
      hair = `<circle cx="${x - r * 1.15}" cy="${y + r * 0.05}" r="${r * 0.38}" fill="${INK}"/>
        <circle cx="${x + r * 1.15}" cy="${y + r * 0.05}" r="${r * 0.38}" fill="${INK}"/>
        <circle cx="${x - r * 1.15}" cy="${y + r * 0.05}" r="${r * 0.14}" fill="#FF8FAB"/>
        <circle cx="${x + r * 1.15}" cy="${y + r * 0.05}" r="${r * 0.14}" fill="#FF8FAB"/>
        <path d="M ${x - r * 0.7} ${y - r * 0.35} Q ${x} ${y - r * 1.25} ${x + r * 0.7} ${y - r * 0.35}" stroke="${INK}" stroke-width="${7 * s}" fill="none" stroke-linecap="round"/>`;
    } else if (o.hair === "tuft") {
      hair = `<path d="M ${x - 2 * s} ${y - r * 0.72} Q ${x + 4 * s} ${y - r * 1.55} ${x + 16 * s} ${y - r * 0.85}" stroke="${INK}" stroke-width="${5 * s}" fill="none" stroke-linecap="round"/>`;
    }
    const glasses = o.glasses
      ? `<circle cx="${x - r * 0.34}" cy="${y - r * 0.05}" r="${r * 0.28}" fill="none" stroke="${INK}" stroke-width="2"/>
         <circle cx="${x + r * 0.34}" cy="${y - r * 0.05}" r="${r * 0.28}" fill="none" stroke="${INK}" stroke-width="2"/>
         <path d="M ${x - r * 0.06} ${y - r * 0.05} H ${x + r * 0.06}" stroke="${INK}" stroke-width="2"/>`
      : "";
    const heart = o.heart
      ? `<path d="M ${x} ${bodyTop + 22 * s} l ${-7 * s} ${-6 * s} a ${4 * s} ${4 * s} 0 0 1 ${7 * s} ${-4 * s} a ${4 * s} ${4 * s} 0 0 1 ${7 * s} ${4 * s} z" fill="#E76F51"/>`
      : "";
    const zzz = o.sleep ? `<text x="${x + r + 8}" y="${y - r}" fill="#7AA2C7" font-size="${16 * s}" font-family="sans-serif">z</text>` : "";
    return `<g class="rise" style="animation-delay:${o.delay || 0}s">
      <circle cx="${x}" cy="${y}" r="${r}" fill="#F6C7A1" stroke="${INK}" stroke-width="${sw}"/>
      ${hair}
      ${eyes(x, y, r, o.sleep)}
      ${glasses}
      <rect x="${x - bodyW / 2}" y="${bodyTop}" width="${bodyW}" height="${bodyH}" rx="${12 * s}" fill="${shirt}" stroke="${INK}" stroke-width="${sw}"/>
      ${heart}
      <path d="M ${x - bodyW / 2 + 4} ${bodyTop + 8 * s} L ${x - bodyW / 2 - 16 * s} ${bodyTop + 28 * s}" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round"/>
      <path d="M ${x + bodyW / 2 - 4} ${bodyTop + 8 * s} L ${x + bodyW / 2 + 16 * s} ${bodyTop + 28 * s}" stroke="${INK}" stroke-width="${sw}" stroke-linecap="round"/>
      <path d="M ${x - 8 * s} ${bodyTop + bodyH} L ${x - 14 * s} ${bodyTop + bodyH + 24 * s}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M ${x + 8 * s} ${bodyTop + bodyH} L ${x + 14 * s} ${bodyTop + bodyH + 24 * s}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      ${zzz}
    </g>`;
  }

  function poseDa(x, y, s, delay) {
    const r = 16 * s;
    const armY = y + r + 16 * s;
    const foot = armY + 58 * s;
    return `<g class="rise" style="animation-delay:${delay || 0}s">
      <circle cx="${x}" cy="${y}" r="${r}" fill="#F6C7A1" stroke="${INK}" stroke-width="4"/>
      ${eyes(x, y, r)}
      <path d="M ${x - 54 * s} ${armY} L ${x + 54 * s} ${armY}" stroke="#E76F51" stroke-width="${12 * s}" stroke-linecap="round"/>
      <circle cx="${x - 54 * s}" cy="${armY}" r="${7 * s}" fill="#F6C7A1" stroke="${INK}" stroke-width="3"/>
      <circle cx="${x + 54 * s}" cy="${armY}" r="${7 * s}" fill="#F6C7A1" stroke="${INK}" stroke-width="3"/>
      <path d="M ${x} ${armY + 4 * s} L ${x - 34 * s} ${foot}" stroke="${INK}" stroke-width="${8 * s}" stroke-linecap="round"/>
      <path d="M ${x} ${armY + 4 * s} L ${x + 34 * s} ${foot}" stroke="${INK}" stroke-width="${8 * s}" stroke-linecap="round"/>
    </g>`;
  }

  function poseRen(x, y, s, delay) {
    const r = 18 * s;
    return `<g class="rise" style="animation-delay:${delay || 0}s">
      <circle cx="${x + 6 * s}" cy="${y}" r="${r}" fill="#F6C7A1" stroke="${INK}" stroke-width="4"/>
      ${eyes(x + 4 * s, y, r * 0.85)}
      <path d="M ${x} ${y + r} C ${x - 20 * s} ${y + 50 * s}, ${x - 46 * s} ${y + 80 * s}, ${x - 58 * s} ${y + 108 * s}" stroke="${INK}" stroke-width="${8 * s}" fill="none" stroke-linecap="round"/>
      <path d="M ${x + 4 * s} ${y + r + 8 * s} C ${x + 24 * s} ${y + 50 * s}, ${x + 48 * s} ${y + 78 * s}, ${x + 62 * s} ${y + 108 * s}" stroke="${INK}" stroke-width="${8 * s}" fill="none" stroke-linecap="round"/>
    </g>`;
  }

  function hand(x, y, s, delay) {
    let fingers = "";
    for (let i = 0; i < 4; i++) {
      const fx = x - 30 * s + i * 18 * s;
      fingers += `<rect x="${fx}" y="${y - 78 * s}" width="${14 * s}" height="${40 * s}" rx="${7 * s}" fill="#F6C7A1" stroke="${INK}" stroke-width="3"/>`;
    }
    return `<g class="rise" style="animation-delay:${delay || 0}s">
      ${fingers}
      <path d="M ${x - 38 * s} ${y - 36 * s} q ${-22 * s} ${6 * s} ${-6 * s} ${30 * s} q ${10 * s} ${8 * s} ${20 * s} 0" fill="#F6C7A1" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="${x - 36 * s}" y="${y - 48 * s}" width="${78 * s}" height="${52 * s}" rx="${22 * s}" fill="#F6C7A1" stroke="${INK}" stroke-width="4"/>
    </g>`;
  }

  function ground() {
    return `<ellipse cx="120" cy="214" rx="86" ry="10" fill="rgba(74,52,40,.1)"/>`;
  }

  function peaks() {
    return `<path class="rise" d="M 18 196 L 68 118 L 108 196 Z" fill="#95D5B2" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path class="rise" style="animation-delay:.08s" d="M 78 196 L 138 64 L 198 196 Z" fill="#52B788" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path class="rise" style="animation-delay:.16s" d="M 168 196 L 214 126 L 236 196 Z" fill="#74C69D" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M 122 92 L 138 64 L 154 92 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  }

  function countDots(n, cols) {
    const rows = Math.ceil(n / cols);
    let out = "";
    const colors = ["#E76F51", "#FFD166", "#4EA8DE"];
    for (let i = 0; i < n; i++) {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const x = 28 + c * ((184) / (cols - 1 || 1));
      const y = rows === 1 ? 120 : 58 + r * (130 / (rows - 1));
      out += `<circle class="rise" style="animation-delay:${i * 0.04}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="${colors[r % 3]}" stroke="${INK}" stroke-width="2"/>`;
    }
    return out;
  }

  const scenes = {
    sun: () => svg("太阳", `${ground()}${sunFace(120, 108, 48)}`),
    moon: () => svg("月亮", `<rect width="240" height="240" rx="28" fill="#243864"/>${star(48, 48, 10, 0)}${star(190, 64, 8, 0.1, "#fff")}${star(64, 150, 6, 0.15, "#fff")}${moonFace(124, 116, 52)}`),
    water: () => svg("流水", `${ground()}
      <path class="draw" d="M 120 36 V 168" stroke="#4EA8DE" stroke-width="12" stroke-linecap="round"/>
      <path class="draw" style="animation-delay:.15s" d="M 120 62 C 88 84 62 70 36 108" stroke="#4EA8DE" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path class="draw" style="animation-delay:.3s" d="M 120 96 C 156 118 176 104 208 142" stroke="#48BFE3" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path class="draw" style="animation-delay:.4s" d="M 70 156 q 24 18 46 0" stroke="#4EA8DE" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle class="rise" cx="168" cy="78" r="10" fill="#BDE0FE" stroke="#4EA8DE" stroke-width="3"/>`),
    fire: () => svg("火焰", `${ground()}
      <rect x="78" y="168" width="84" height="16" rx="6" fill="#C4A484" stroke="${INK}" stroke-width="3"/>
      ${flame(120, 150, 1.15, 0, "#E76F51")}
      ${flame(86, 162, 0.72, 0.1, "#F4A261")}
      ${flame(156, 162, 0.72, 0.16, "#FFD166")}`),
    mountain: () => svg("高山", `${ground()}${peaks()}`),
    person: () => svg("人", `${ground()}${poseRen(120, 62, 1.05)}`),
    mouth: () => svg("嘴巴", `<circle cx="120" cy="108" r="78" fill="#FFE8C7" stroke="${INK}" stroke-width="4"/>
      ${eyes(120, 92, 36)}
      <rect class="rise" x="78" y="124" width="84" height="48" rx="16" fill="#E76F51" stroke="${INK}" stroke-width="4"/>`),
    eye: () => svg("眼睛", `<ellipse cx="120" cy="120" rx="92" ry="58" fill="#fff" stroke="${INK}" stroke-width="5"/>
      <circle cx="120" cy="120" r="34" fill="#4EA8DE" stroke="${INK}" stroke-width="4"/>
      <circle cx="120" cy="120" r="16" fill="${INK}"/>
      <circle cx="130" cy="110" r="6" fill="#fff"/>`),
    tree: () => svg("树木", `${ground()}${tree(120, 186, 1.15, 0)}`),
    field: () => svg("田地", `<rect x="36" y="36" width="168" height="168" rx="12" fill="#E7C8A0" stroke="${INK}" stroke-width="5"/>
      <path d="M 120 40 V 200 M 40 120 H 200" stroke="${INK}" stroke-width="5"/>
      <rect class="rise" x="48" y="48" width="60" height="60" rx="6" fill="#95D5B2"/>
      <rect class="rise" style="animation-delay:.08s" x="132" y="48" width="60" height="60" rx="6" fill="#74C69D"/>
      <rect class="rise" style="animation-delay:.16s" x="48" y="132" width="60" height="60" rx="6" fill="#FFD166"/>
      <rect class="rise" style="animation-delay:.24s" x="132" y="132" width="60" height="60" rx="6" fill="#52B788"/>`),
    bird: () => svg("小鸟", `${ground()}
      <g class="rise float">
        <ellipse cx="112" cy="128" rx="46" ry="26" fill="#FFD166" stroke="${INK}" stroke-width="4"/>
        <circle cx="156" cy="112" r="20" fill="#FFD166" stroke="${INK}" stroke-width="4"/>
        <path d="M 172 112 L 198 104 L 172 122 Z" fill="#E76F51" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="162" cy="106" r="3" fill="${INK}"/>
        <path d="M 96 124 q 16 20 36 0" fill="#F4A261" stroke="${INK}" stroke-width="3"/>
        <path d="M 70 122 L 40 100 L 58 128 Z" fill="#FFD166" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M 100 152 v 18 M 124 152 v 18" stroke="#C4A484" stroke-width="4" stroke-linecap="round"/>
      </g>`),
    fish: () => svg("小鱼", `<rect width="240" height="240" rx="28" fill="#D7F0FF"/>
      <g class="rise float">
        <ellipse cx="128" cy="120" rx="58" ry="30" fill="#4EA8DE" stroke="${INK}" stroke-width="4"/>
        <path d="M 74 120 L 36 92 L 36 148 Z" fill="#48BFE3" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="160" cy="112" r="4" fill="${INK}"/>
        <path d="M 112 128 q 16 10 32 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
      <circle class="rise" cx="40" cy="64" r="6" fill="#fff" opacity=".8"/>
      <circle class="rise" style="animation-delay:.1s" cx="58" cy="48" r="4" fill="#fff" opacity=".8"/>`),
    one: () => svg("一个", `${ground()}${apple(120, 120, 1.4, 0)}`),
    two: () => svg("两个", `${ground()}${apple(78, 124, 1.15, 0)}${apple(158, 124, 1.15, 0.1)}`),
    three: () => svg("三个", `${ground()}${apple(58, 128, 1, 0)}${apple(120, 112, 1, 0.08)}${apple(182, 128, 1, 0.16)}`),
    ten: () => svg("十个", countDots(10, 5)),
    up: () => svg("上面", `<path d="M 36 150 H 204" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      ${apple(120, 96, 1, 0)}
      <path class="rise" d="M 120 186 V 214 M 108 198 L 120 186 L 132 198" stroke="#E07A3D" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
    down: () => svg("下面", `<path d="M 36 78 H 204" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      ${apple(120, 150, 1, 0)}
      <path class="rise" d="M 120 36 V 58 M 108 46 L 120 58 L 132 46" stroke="#3D7EA6" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
    big: () => svg("大大", `${ground()}${poseDa(120, 62, 1.15)}`),
    small: () => svg("小小", `${ground()}${apple(120, 150, 0.7, 0)}
      <circle class="rise" cx="78" cy="168" r="6" fill="#FFD166" stroke="${INK}" stroke-width="2"/>
      <circle class="rise" style="animation-delay:.1s" cx="162" cy="168" r="6" fill="#FFD166" stroke="${INK}" stroke-width="2"/>`),
    sky: () => svg("天空", `<rect width="240" height="150" fill="#BDE0FE"/>
      <path d="M 28 58 H 212" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="120" cy="214" rx="100" ry="28" fill="#C9EDB8"/>
      ${poseDa(120, 108, 0.85)}`),
    earth: () => svg("土地", `<rect width="240" height="240" fill="#F3E6CF"/>
      <rect y="120" width="240" height="120" fill="#C4A484"/>
      <path d="M 0 120 Q 40 108 80 120 T 160 120 T 240 120 V 132 H 0 Z" fill="#95D5B2"/>
      <path class="rise" d="M 120 150 v 28" stroke="#2D6A4F" stroke-width="4" stroke-linecap="round"/>
      <circle class="rise" cx="120" cy="142" r="10" fill="#52B788" stroke="${INK}" stroke-width="3"/>`),
    dad: () => svg("爸爸", `${ground()}${kid({ x: 120, y: 78, s: 1.15, shirt: "#7EB6D9", hair: "short", glasses: true })}`),
    mom: () => svg("妈妈", `${ground()}${kid({ x: 120, y: 78, s: 1.12, shirt: "#F4A4C0", hair: "long" })}`),
    me: () => svg("我", `${ground()}${kid({ x: 120, y: 84, s: 1.12, shirt: "#FFE08A", hair: "tuft", heart: true })}`),
    woman: () => svg("女孩", `${ground()}${kid({ x: 120, y: 82, s: 1.12, shirt: "#FF8FAB", hair: "pigtail" })}`),
    child: () => svg("孩子", `${ground()}${kid({ x: 120, y: 96, s: 0.95, shirt: "#F4A261", hair: "tuft" })}`),
    hand: () => svg("小手", hand(124, 168, 1.2)),
    bright: () => svg("明亮", `<rect width="240" height="240" fill="#FFF6E4"/>${sunFace(70, 100, 36)}${moonFace(168, 116, 36, 0.12)}`),
    woods: () => svg("树林", `${ground()}${tree(68, 198, 0.78, 0)}${tree(172, 198, 0.78, 0.1, "#74C69D")}`),
    follow: () => svg("跟着", `${ground()}${kid({ x: 78, y: 86, s: 0.9, shirt: "#F4A261", hair: "tuft" })}${kid({ x: 158, y: 96, s: 0.82, shirt: "#8ECAE6", hair: "short", delay: 0.12 })}`),
    rest: () => svg("休息", `${ground()}${tree(156, 188, 1, 0)}${kid({ x: 78, y: 100, s: 0.9, shirt: "#FFE08A", hair: "tuft", sleep: true })}`),
    good: () => svg("很好", `${ground()}${kid({ x: 78, y: 86, s: 1, shirt: "#F4A4C0", hair: "long" })}${kid({ x: 162, y: 108, s: 0.75, shirt: "#FFE08A", hair: "tuft", delay: 0.1 })}`),
    morning: () => svg("早上", `<rect width="240" height="240" fill="#FFE3B8"/>
      <rect y="150" width="240" height="90" fill="#C9EDB8"/>
      <path d="M 0 150 Q 60 138 120 150 T 240 150 V 162 H 0 Z" fill="#95D5B2"/>
      ${sunFace(120, 132, 36)}`),
    sharp: () => svg("尖尖", `<path class="rise" d="M 120 28 L 196 196 H 44 Z" fill="#FFD166" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M 120 28 L 150 90" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>`),
    apricot: () => svg("杏子", `${ground()}${tree(120, 196, 1.05, 0)}
      <circle class="rise" cx="92" cy="108" r="12" fill="#F4A261" stroke="${INK}" stroke-width="3"/>
      <circle class="rise" style="animation-delay:.1s" cx="132" cy="96" r="12" fill="#E76F51" stroke="${INK}" stroke-width="3"/>
      <circle class="rise" style="animation-delay:.16s" cx="148" cy="128" r="11" fill="#F4A261" stroke="${INK}" stroke-width="3"/>`),
    hot: () => svg("热热", `${flame(120, 118, 1.2, 0, "#E76F51")}${flame(120, 186, 1, 0.1, "#F4A261")}`),
    forest: () => svg("森林", `${ground()}${tree(120, 132, 0.52, 0)}${tree(58, 206, 0.58, 0.08, "#74C69D")}${tree(182, 206, 0.58, 0.14, "#2D6A4F")}`),
    crowd: () => svg("众人", `${ground()}${kid({ x: 120, y: 62, s: 0.72, shirt: "#F4A261", hair: "tuft" })}${kid({ x: 62, y: 100, s: 0.78, shirt: "#8ECAE6", hair: "short", delay: 0.08 })}${kid({ x: 178, y: 100, s: 0.78, shirt: "#FF8FAB", hair: "pigtail", delay: 0.14 })}`),
    crystal: () => svg("亮晶晶", `${sunFace(120, 62, 28)}${sunFace(68, 150, 28, 0.08)}${sunFace(172, 150, 28, 0.14)}`),
    landscape: () => svg("山水", `${peaks()}
      <path class="draw" d="M 20 176 Q 60 160 100 176 T 180 176 T 230 168" stroke="#4EA8DE" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path class="draw" style="animation-delay:.15s" d="M 16 196 Q 70 182 120 196 T 230 190" stroke="#48BFE3" stroke-width="8" fill="none" stroke-linecap="round"/>`),
    bigfire: () => svg("大火", `${ground()}${flame(120, 168, 1.7, 0, "#E76F51")}${flame(78, 186, 1, 0.1, "#FFD166")}${flame(168, 186, 1, 0.16, "#F4A261")}`),
    volcano: () => svg("火山", `${ground()}
      <path class="rise" d="M 36 196 L 120 78 L 204 196 Z" fill="#74C69D" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      ${flame(120, 92, 0.7, 0.1, "#E76F51")}`),
    gemwater: () => svg("水晶", `<rect width="240" height="240" rx="28" fill="#E7F6FF"/>
      <path class="rise" d="M 120 36 L 168 90 L 120 168 L 72 90 Z" fill="#BDE0FE" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path class="rise" style="animation-delay:.1s" d="M 120 78 L 150 108 L 120 150 L 90 108 Z" fill="#fff" stroke="#4EA8DE" stroke-width="3"/>
      <path class="draw" d="M 40 196 Q 80 180 120 196 T 200 190" stroke="#4EA8DE" stroke-width="6" fill="none"/>`),
    brightmoon: () => svg("明月", `<rect width="240" height="240" rx="28" fill="#243864"/>${star(46, 46, 8, 0, "#fff")}${star(188, 70, 6, 0.1, "#fff")}${star(52, 180, 5, 0.15, "#fff")}${moonFace(120, 118, 58)}`),
    thirty: () => svg("三十", countDots(30, 10)),
    world: () => svg("天地", `<rect width="240" height="120" fill="#BDE0FE"/>
      <rect y="120" width="240" height="120" fill="#C4A484"/>
      <path d="M 0 120 Q 40 108 80 120 T 160 120 T 240 120 V 132 H 0 Z" fill="#95D5B2"/>
      ${sunFace(168, 58, 24)}
      <path d="M 28 46 H 120" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`),
    bigsmall: () => svg("大小", `${ground()}${apple(78, 132, 1.45, 0)}${apple(172, 150, 0.75, 0.12)}`)
  };

  window.sceneSVG = function (name) {
    const fn = scenes[name] || scenes.sun;
    return fn();
  };
})();
