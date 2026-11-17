#!/usr/bin/env python3
# split.py が出力した index.html / style.css / game.js に、追加の機能を足す。
#   1. ボス攻撃の本格化（全ボス専用の攻撃、あとのボスほど強い）
#   2. ショップの「忍具」タブ（不死のトーテムなど）
# 使い方: split.py と同じフォルダに置いて、split.py を実行するだけ（自動で呼ばれる）。
#         単独で実行する場合は、split.py の出力があるフォルダで python split2.py
import re, sys

MARK = "/* SPLIT2 */"
JS = r"""
/* SPLIT2 */
// ==========================================
// 1. ボス攻撃の本格化
//   ・全ボスに、そのボス専用の攻撃（固有の弾の見た目 + 出現のしかた）を追加
//   ・どの攻撃も回転攻撃で弾き返せる（弾き返した弾はボスに当たる）
//   ・あとのボスほど強くなる（HP、攻撃の速さ、弾の速さ、弾数）
// ==========================================
const BOSS_ORDER = [
  '赤べこ将軍', '大仏ガーディアン', '黄金シャチホコ王', '高野山天狗マスター', '関門フグ大帝', '土佐カツオ将軍', '琉球シーサー神',
  'ヒマラヤ雪男王', 'カッパドキア魔人', '氷河ヴァイキング王', 'サバンナ獅子王', '密林ケツァール神', '天空鏡の守護神', 'アース・エンペラー',
  'アンコール石像王', '黄金エルドラド王', '白夜の氷床竜',
  'コズミック・オーバーロード', '小惑星ゴーレム', '冥界の門番ケルベロス', 'パルサー・ビーコン', 'ビッグバン・クロノス'
];
function bossRank(b) {
  const i = BOSS_ORDER.indexOf(b.name);
  return i < 0 ? 0 : i;
}

// sprite: 弾の見た目 / forms: 出現のしかた（順番に繰り返す）
const BOSS_SIG = {
  '赤べこ将軍': { sprite: 'bell', forms: ['skyFall', 'spiral'] },
  '大仏ガーディアン': { sprite: 'halo', forms: ['circleTrap', 'crossfire'] },
  '黄金シャチホコ王': { sprite: 'fish', forms: ['wallFish', 'riseUp'] },
  '高野山天狗マスター': { sprite: 'feather', forms: ['crossfire', 'wallSweepGap'] },
  '関門フグ大帝': { sprite: 'urchin', forms: ['spiral', 'riseUp'] },
  '土佐カツオ将軍': { sprite: 'fish', forms: ['wallFish', 'skyFall'] },
  '琉球シーサー神': { sprite: 'star', forms: ['wallSweepGap', 'circleTrap'] },
  'ヒマラヤ雪男王': { sprite: 'ice', forms: ['skyFall', 'circleTrap'] },
  'カッパドキア魔人': { sprite: 'boulder', forms: ['riseUp', 'wallSweepGap'] },
  '氷河ヴァイキング王': { sprite: 'spear', forms: ['wallFish', 'crossfire'] },
  'サバンナ獅子王': { sprite: 'claw', forms: ['wallFish', 'spiral'] },
  '密林ケツァール神': { sprite: 'leaf', forms: ['skyFall', 'crossfire'] },
  '天空鏡の守護神': { sprite: 'crystal', forms: ['circleTrap', 'spiral'] },
  'アース・エンペラー': { sprite: 'meteor', forms: ['skyFall', 'riseUp', 'circleTrap'] },
  'アンコール石像王': { sprite: 'boulder', forms: ['wallSweepGap', 'skyFall'] },
  '黄金エルドラド王': { sprite: 'coin', forms: ['wallFish', 'spiral'] },
  '白夜の氷床竜': { sprite: 'ice', forms: ['riseUp', 'crossfire', 'spiral'] },
  'コズミック・オーバーロード': { sprite: 'star', forms: ['circleTrap', 'spiral', 'crossfire'] },
  '小惑星ゴーレム': { sprite: 'meteor', forms: ['skyFall', 'wallSweepGap'] },
  '冥界の門番ケルベロス': { sprite: 'skull', forms: ['wallFish', 'crossfire'] },
  'パルサー・ビーコン': { sprite: 'bolt', forms: ['circleTrap', 'spiral'] },
  'ビッグバン・クロノス': { sprite: 'star', forms: ['skyFall', 'riseUp', 'wallFish', 'spiral', 'circleTrap'] }
};

// 既存の攻撃順に、専用攻撃(14)を差し込む。あとのボスほど専用攻撃が多い
BOSS_ORDER.forEach((n, r) => {
  const seq = BOSS_PATTERNS[n] || [0, 1, 2];
  const out = [];
  seq.forEach((p, i) => {
    out.push(p);
    if (r >= 14 || i % 2 === 0) out.push(14);
  });
  BOSS_PATTERNS[n] = out;
});

function sigQueue(b, t, fn, warn) {
  bossQueue.push({ boss: b, t: t, t0: t, fn: fn, warn: warn || null });
}
function sigShot(b, spec, x, y, vx, vy, big, life) {
  if (activeBoss !== b || b.hp <= 0) return;
  const cx = Math.max(LEFT_WALL_X + 15, Math.min(RIGHT_WALL_X - 15, x));
  projectiles.push({
    type: big ? 'bossOrb' : 'bossSpread', x: cx, y: y, vx: vx, vy: vy,
    radius: big ? 14 : 11, reflected: false, life: life || 280, sprite: spec.sprite, scol: spec.color
  });
}

const SIG_FORMS = {
  // 壁から横一直線に飛び出してくる（金の魚、槍、爪、骸骨など）
  wallFish(b, spec, r, px, py) {
    const n = 4 + Math.floor(r / 5);
    for (let i = 0; i < n; i++) {
      const left = Math.random() < 0.5;
      const y = Math.max(cameraY + 100, Math.min(cameraY + canvas.height - 100, py + (Math.random() - 0.5) * 300));
      const x0 = left ? LEFT_WALL_X + 16 : RIGHT_WALL_X - 16;
      const dir = left ? 1 : -1;
      sigQueue(b, 40 + i * 14, () => sigShot(b, spec, x0, y, dir * (3.2 + r * 0.04), 0),
        { kind: 'wall', x: x0, y: y, dir: dir });
    }
    playSound('birdWarn');
  },
  // 上から降ってくる
  skyFall(b, spec, r) {
    const n = 5 + Math.floor(r / 4);
    const w = RIGHT_WALL_X - LEFT_WALL_X - 60;
    for (let i = 0; i < n; i++) {
      const x = LEFT_WALL_X + 30 + Math.random() * w;
      const y0 = cameraY - 20;
      sigQueue(b, 40 + i * 10, () => sigShot(b, spec, x, y0, 0, 3.3 + r * 0.04),
        { kind: 'top', x: x, y: cameraY + 24 });
    }
    playSound('birdWarn');
  },
  // 下から噴き上がってくる
  riseUp(b, spec, r) {
    const n = 5 + Math.floor(r / 4);
    const w = RIGHT_WALL_X - LEFT_WALL_X - 60;
    for (let i = 0; i < n; i++) {
      const x = LEFT_WALL_X + 30 + Math.random() * w;
      const y0 = cameraY + canvas.height + 20;
      sigQueue(b, 40 + i * 10, () => sigShot(b, spec, x, y0, 0, -(3.3 + r * 0.04)),
        { kind: 'bottom', x: x, y: cameraY + canvas.height - 24 });
    }
    playSound('birdWarn');
  },
  // 壁から弾の列が押し寄せる（1か所だけ隙間がある）
  wallSweepGap(b, spec, r, px, py) {
    const left = Math.random() < 0.5;
    const dir = left ? 1 : -1;
    const x0 = left ? LEFT_WALL_X + 16 : RIGHT_WALL_X - 16;
    const gapY = Math.max(cameraY + 170, Math.min(cameraY + canvas.height - 170, py + (Math.random() - 0.5) * 120));
    const top = cameraY + 70;
    const bottom = cameraY + canvas.height - 70;
    const ys = [];
    for (let y = top; y <= bottom; y += 50) if (Math.abs(y - gapY) > 80) ys.push(y);
    sigQueue(b, 60, () => ys.forEach(y => sigShot(b, spec, x0, y, dir * (2.8 + r * 0.03), 0, false, 200)),
      { kind: 'bar', x: x0, top: top, bottom: bottom, gapY: gapY, dir: dir });
    playSound('laserWarn');
  },
  // 画面の両上から、プレイヤーの位置めがけて扇状に
  crossfire(b, spec, r, px, py) {
    const fans = 1 + Math.floor(r / 8);
    for (let f = 0; f < fans; f++) {
      [true, false].forEach(left => {
        const sx = left ? LEFT_WALL_X + 22 : RIGHT_WALL_X - 22;
        const sy = cameraY + 30;
        sigQueue(b, 50 + f * 40, () => {
          const base = Math.atan2(py - sy, px - sx);
          [-0.22, 0, 0.22].forEach(o => sigShot(b, spec, sx, sy, Math.cos(base + o) * 3.8, Math.sin(base + o) * 3.8));
        }, { kind: 'line', x: sx, y: sy, x2: px, y2: py });
      });
    }
    playSound('laserWarn');
  },
  // プレイヤーを囲む輪から、弾が中心へ集まる（輪の外へ逃げる）
  circleTrap(b, spec, r, px, py) {
    const R = 105;
    const m = 8 + Math.floor(r / 6);
    sigQueue(b, 62, () => {
      for (let k = 0; k < m; k++) {
        const a = k * Math.PI * 2 / m;
        const x = Math.max(LEFT_WALL_X + 15, Math.min(RIGHT_WALL_X - 15, px + Math.cos(a) * R));
        const y = py + Math.sin(a) * R;
        const d = Math.max(1, Math.hypot(px - x, py - y));
        sigShot(b, spec, x, y, (px - x) / d * 2.6, (py - y) / d * 2.6, false, 160);
      }
    }, { kind: 'ring', x: px, y: py, r: R });
    playSound('laserWarn');
  },
  // ボスから渦を巻くように連射
  spiral(b, spec, r) {
    const cnt = 14 + Math.floor(r / 2);
    const base = Math.random() * Math.PI * 2;
    const sgn = Math.random() < 0.5 ? 1 : -1;
    for (let k = 0; k < cnt; k++) {
      sigQueue(b, 1 + k * 5, () => {
        const a = base + sgn * k * 0.45;
        sigShot(b, spec, b.x, b.y + 30, Math.cos(a) * 3.0, Math.sin(a) * 3.0);
      }, null);
    }
    playSound('arrow');
  }
};

function bossSignature(b, px, py) {
  const d = BOSS_SIG[b.name] || { sprite: 'star', forms: ['skyFall', 'spiral'] };
  const spec = { sprite: d.sprite, color: (BOSS_THEMES[b.name] || DEFAULT_THEME).orb };
  b._sigIdx = b._sigIdx || 0;
  const f = d.forms[b._sigIdx % d.forms.length];
  b._sigIdx++;
  SIG_FORMS[f](b, spec, bossRank(b), px, py);
  b.shootTimer = 130;
}

const baseSignatureBossAttack = signatureBossAttack;
signatureBossAttack = function (pattern, b, px, py) {
  if (pattern === 14) { bossSignature(b, px, py); return; }
  baseSignatureBossAttack(pattern, b, px, py);
};

// ボスのランクが高いほど強い: HP(3〜6)、攻撃の間隔、弾の速さ、レーザーの予告時間
easeBossDifficulty = function () {
  const b = activeBoss;
  if (gameState !== 'playing' || !b) return;
  const r = bossRank(b);
  if (!b.eased) {
    b.eased = true;
    b.vx *= 0.8 * (1 + 0.01 * r);
    b.maxHp = b.hp = 3 + Math.floor(r / 6);
    updateBossHpUi();
  }
  const tMul = 1.35 / (1 + 0.015 * r);
  const sMul = 0.8 * (1 + 0.012 * r);
  const lAdd = Math.round(24 - r * 0.8);
  if (b._pt === undefined) b._pt = b.shootTimer;
  if (b.shootTimer > b._pt + 1) b.shootTimer = Math.round(b.shootTimer * tMul);
  b._pt = b.shootTimer;
  for (const p of projectiles) {
    if (!p.eased && (p.type === 'bossOrb' || p.type === 'bossSpread')) {
      p.vx *= sMul;
      p.vy *= sMul;
      p.eased = true;
    }
  }
  for (const lz of bossLasers) {
    if (!lz.eased) { lz.timer += lAdd; lz.eased = true; }
  }
};

// ---------- 専用攻撃の予告と弾の描画 ----------
function drawSigWarn() {
  if (gameState !== 'playing' || !activeBoss) return;
  const T = Date.now() * 0.01;
  const red = '#FF3B6B';
  for (const q of bossQueue) {
    if (!q.warn || q.boss !== activeBoss) continue;
    const w = q.warn;
    const p = 1 - q.t / q.t0;
    ctx.save();
    ctx.globalAlpha = Math.min(1, (0.35 + 0.45 * Math.abs(Math.sin(T * 1.3 + p * 8))) * (0.5 + p));
    ctx.strokeStyle = red;
    ctx.fillStyle = red;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    if (w.kind === 'wall') {
      const sy = w.y - cameraY;
      for (let i = 0; i < 3; i++) {
        const x = w.x + w.dir * (8 + i * 14);
        ctx.beginPath(); ctx.moveTo(x, sy - 8); ctx.lineTo(x + w.dir * 8, sy); ctx.lineTo(x, sy + 8); ctx.stroke();
      }
      ctx.globalAlpha *= 0.4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(w.x + w.dir * 50, sy); ctx.lineTo(w.x + w.dir * 300, sy); ctx.stroke();
    } else if (w.kind === 'top' || w.kind === 'bottom') {
      const sy = w.y - cameraY;
      const d = w.kind === 'top' ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(w.x - 9, sy - d * 6); ctx.lineTo(w.x + 9, sy - d * 6); ctx.lineTo(w.x, sy + d * 8); ctx.closePath(); ctx.fill();
      ctx.globalAlpha *= 0.4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(w.x, sy + d * 20); ctx.lineTo(w.x, sy + d * 280); ctx.stroke();
    } else if (w.kind === 'bar') {
      const t0 = w.top - cameraY, b0 = w.bottom - cameraY, g = w.gapY - cameraY;
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(w.x, t0); ctx.lineTo(w.x, g - 80); ctx.moveTo(w.x, g + 80); ctx.lineTo(w.x, b0); ctx.stroke();
      ctx.fillStyle = '#00E676';
      ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.moveTo(w.x + w.dir * 6, g - 10); ctx.lineTo(w.x + w.dir * 26, g); ctx.lineTo(w.x + w.dir * 6, g + 10); ctx.closePath(); ctx.fill();
    } else if (w.kind === 'line') {
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(w.x, w.y - cameraY); ctx.lineTo(w.x2, w.y2 - cameraY); ctx.stroke();
    } else if (w.kind === 'ring') {
      const rr = w.r * (1 - 0.15 * p);
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.arc(w.x, w.y - cameraY, rr, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
}

function drawSigSprite(kind, col, rad) {
  const c = ctx;
  c.save();
  c.scale(rad / 11, rad / 11);
  c.lineJoin = 'round';
  c.lineWidth = 2.2;
  c.strokeStyle = '#1E1E24';
  const poly = (pts, fill) => {
    c.beginPath();
    pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])));
    c.closePath(); c.fillStyle = fill; c.fill(); c.stroke();
  };
  const circ = (x, y, r, fill) => {
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); c.stroke();
  };
  if (kind === 'fish') {
    poly([[-10, 0], [-19, -7], [-19, 7]], col);
    c.beginPath(); c.ellipse(0, 0, 13, 7.5, 0, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.stroke();
    poly([[-3, -6], [3, -13], [6, -6]], col);
    circ(6, -2, 2.6, '#FFFFFF');
    c.fillStyle = '#1E1E24'; c.fillRect(6.5, -3, 2, 2.4);
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.3;
    c.beginPath(); c.arc(-1, 0, 6, -0.9, 0.9); c.stroke();
  } else if (kind === 'spear') {
    c.fillStyle = '#B45309'; c.fillRect(-16, -1.8, 24, 3.6); c.strokeRect(-16, -1.8, 24, 3.6);
    poly([[8, -5.5], [21, 0], [8, 5.5]], '#E2E8F0');
    poly([[-16, -4], [-11, 0], [-16, 4]], col);
  } else if (kind === 'feather') {
    c.beginPath(); c.moveTo(-15, 0); c.quadraticCurveTo(0, -10, 15, 0); c.quadraticCurveTo(0, 10, -15, 0); c.closePath();
    c.fillStyle = col; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-15, 0); c.lineTo(13, 0); c.stroke();
  } else if (kind === 'urchin') {
    for (let k = 0; k < 10; k++) {
      const a = k * Math.PI / 5;
      c.beginPath(); c.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); c.stroke();
    }
    circ(0, 0, 8, col);
    circ(-2.5, -2.5, 2, '#FFFFFF');
  } else if (kind === 'ice') {
    poly([[0, -13], [8, 0], [0, 13], [-8, 0]], col);
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, -10); c.lineTo(0, 10); c.moveTo(-5, 0); c.lineTo(5, 0); c.stroke();
  } else if (kind === 'boulder') {
    poly([[-10, -4], [-4, -11], [6, -10], [11, -2], [8, 9], [-3, 11], [-11, 5]], '#A8A29E');
    c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -6); c.lineTo(2, 0); c.lineTo(-2, 6); c.stroke();
  } else if (kind === 'claw') {
    c.beginPath(); c.arc(0, 0, 12, -1.9, 1.9); c.arc(5, 0, 9, 1.9, -1.9, true); c.closePath();
    c.fillStyle = col; c.fill(); c.stroke();
  } else if (kind === 'leaf') {
    c.beginPath(); c.ellipse(0, 0, 13, 6.5, 0, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-12, 0); c.lineTo(11, 0); c.stroke();
  } else if (kind === 'crystal') {
    poly([[0, -14], [7, -4], [5, 11], [-5, 11], [-7, -4]], col);
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0, -12); c.lineTo(-1, 9); c.moveTo(-6, -3); c.lineTo(6, -3); c.stroke();
  } else if (kind === 'meteor') {
    c.fillStyle = 'rgba(249,115,22,0.75)';
    c.beginPath(); c.moveTo(-24, 0); c.lineTo(-3, -8); c.lineTo(-3, 8); c.closePath(); c.fill();
    circ(0, 0, 9, col);
    circ(-2, -2, 3, '#FFFFFF');
  } else if (kind === 'coin') {
    circ(0, 0, 10, '#FACC15');
    c.beginPath(); c.arc(0, 0, 6, 0, Math.PI * 2); c.strokeStyle = '#B45309'; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = '#B45309'; c.fillRect(-1.2, -4, 2.4, 8);
  } else if (kind === 'skull') {
    circ(0, -1, 9, '#F8FAFC');
    c.fillStyle = '#F8FAFC'; c.fillRect(-5, 6, 10, 6); c.strokeRect(-5, 6, 10, 6);
    c.fillStyle = '#1E1E24'; c.fillRect(-6, -3, 4, 5); c.fillRect(2, -3, 4, 5);
    poly([[0, 3], [-1.5, 6], [1.5, 6]], '#1E1E24');
  } else if (kind === 'bolt') {
    poly([[3, -14], [-7, 1], [-1, 1], [-4, 14], [8, -3], [1, -3]], '#FDE047');
  } else if (kind === 'bell') {
    c.beginPath(); c.moveTo(-10, 8); c.quadraticCurveTo(-10, -10, 0, -10); c.quadraticCurveTo(10, -10, 10, 8); c.closePath();
    c.fillStyle = '#FACC15'; c.fill(); c.stroke();
    circ(0, 9, 3, col);
  } else if (kind === 'halo') {
    c.beginPath(); c.arc(0, 0, 10, 0, Math.PI * 2); c.lineWidth = 5; c.strokeStyle = '#1E1E24'; c.stroke();
    c.beginPath(); c.arc(0, 0, 10, 0, Math.PI * 2); c.lineWidth = 2.6; c.strokeStyle = '#FDE047'; c.stroke();
    circ(0, 0, 3, col);
  } else if (kind === 'star') {
    const pts = [];
    for (let k = 0; k < 10; k++) {
      const rr = k % 2 === 0 ? 13 : 5.5;
      const a = -Math.PI / 2 + k * Math.PI / 5;
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    poly(pts, col);
  } else {
    circ(0, 0, 10, col);
  }
  c.restore();
}

function drawSigSprites() {
  const spinKinds = ['star', 'boulder', 'claw', 'ice', 'urchin'];
  const dirKinds = ['fish', 'spear', 'feather', 'meteor', 'leaf'];
  for (const p of projectiles) {
    if (!p.sprite) continue;
    const sy = p.y - cameraY;
    if (sy < -40 || sy > canvas.height + 40) continue;
    ctx.save();
    ctx.translate(p.x, sy);
    if (p.reflected) {
      ctx.strokeStyle = '#00E676';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2); ctx.stroke();
    } else if (p.type === 'bossOrb') {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, p.radius + 5, 0, Math.PI * 2); ctx.stroke();
    }
    if (spinKinds.includes(p.sprite)) ctx.rotate(Date.now() * 0.008);
    else if (dirKinds.includes(p.sprite)) ctx.rotate(Math.atan2(p.vy, p.vx));
    drawSigSprite(p.sprite, p.scol, p.radius);
    ctx.restore();
  }
}

const baseDrawFn6 = draw;
draw = function () {
  baseDrawFn6();
  if (gameState === 'playing') { drawSigWarn(); drawSigSprites(); }
};

// ==========================================
// 2. 忍具（ショップの「忍具」タブ）
//   買った数だけ使える消耗品。1回の挑戦で持ち込めるのは1種類（数は複数）
//   忍術とは併用できない。不死のトーテムは、やられたときに自動で復活
// ==========================================
const TOOLS = [
  {
    id: 'totem', name: '不死のトーテム', price: 500, max: 3, color: '#FACC15',
    desc: '持っていると、やられたときに自動で復活する（約2秒の無敵付き）。1個につき1回。',
    icon: '<svg viewBox="0 0 48 48"><rect x="14" y="5" width="20" height="38" rx="4" fill="#FACC15" stroke="#1E1E24" stroke-width="2"/><rect x="18" y="14" width="5" height="6" fill="#1E1E24"/><rect x="26" y="14" width="5" height="6" fill="#1E1E24"/><rect x="18" y="28" width="12" height="4" fill="#1E1E24"/><path d="M9 11l5 5M39 11l-5 5M24 1v4" stroke="#FDE047" stroke-width="3" stroke-linecap="round"/></svg>'
  },
  {
    id: 'smoke', name: '煙玉', price: 200, max: 5, color: '#CBD5E1',
    desc: 'Zキーで使用。画面の敵の弾とレーザーを消し、約1.5秒の間ダメージを受けない。',
    icon: '<svg viewBox="0 0 48 48"><circle cx="16" cy="28" r="9" fill="#E2E8F0" stroke="#1E1E24" stroke-width="2"/><circle cx="28" cy="24" r="11" fill="#F1F5F9" stroke="#1E1E24" stroke-width="2"/><circle cx="34" cy="32" r="7" fill="#CBD5E1" stroke="#1E1E24" stroke-width="2"/></svg>'
  },
  {
    id: 'flash', name: '閃光玉', price: 250, max: 5, color: '#FEF08A',
    desc: 'Zキーで使用。画面内のコウモリ・鳥・妨害キャラなどの敵を一掃する。ボスには効かない。',
    icon: '<svg viewBox="0 0 48 48"><polygon points="24,3 29,18 44,14 33,25 44,36 29,32 24,45 19,32 4,36 15,25 4,14 19,18" fill="#FEF08A" stroke="#1E1E24" stroke-width="2"/></svg>'
  },
  {
    id: 'charm', name: '跳躍符', price: 150, max: 5, color: '#FB7185',
    desc: 'Zキーで使用。空中でも、その場でもう一度ジャンプできる。',
    icon: '<svg viewBox="0 0 48 48"><rect x="13" y="5" width="22" height="38" fill="#FFFBEB" stroke="#1E1E24" stroke-width="2"/><path d="M24 12v24M17 20h14M18 30l6-6 6 6" stroke="#E11D48" stroke-width="3" stroke-linecap="round" fill="none"/></svg>'
  },
  {
    id: 'magnet', name: '招福の磁石', price: 180, max: 5, color: '#60A5FA',
    desc: 'Zキーで使用。10秒間、近くのコインが吸い寄せられる。',
    icon: '<svg viewBox="0 0 48 48"><path d="M10 8v18a14 14 0 0 0 28 0V8h-9v18a5 5 0 0 1-10 0V8z" fill="#EF4444" stroke="#1E1E24" stroke-width="2"/><rect x="10" y="8" width="9" height="8" fill="#F8FAFC" stroke="#1E1E24" stroke-width="2"/><rect x="29" y="8" width="9" height="8" fill="#F8FAFC" stroke="#1E1E24" stroke-width="2"/></svg>'
  }
];

let toolSave = { owned: {}, equipped: null, carry: 1 };
try {
  const raw = JSON.parse(localStorage.getItem('wallKickTools') || 'null');
  if (raw && typeof raw === 'object') toolSave = Object.assign(toolSave, raw);
} catch (e) {}
function saveTools() {
  try { localStorage.setItem('wallKickTools', JSON.stringify(toolSave)); } catch (e) {}
}
function toolDef(id) { return TOOLS.find(t => t.id === id) || null; }
function toolOwned(id) { return (toolSave.owned && toolSave.owned[id]) || 0; }

// ---------- ショップ「忍具」タブ ----------
function toolBuy(t) {
  if (totalCoins >= t.price && toolOwned(t.id) < 99) {
    totalCoins -= t.price;
    toolSave.owned[t.id] = toolOwned(t.id) + 1;
    saveTools();
    saveCoinAndSkinData();
    playSound('clear');
  } else {
    playSound('hit');
  }
  renderToolGrid();
}
function toolToggleEquip(t) {
  if (toolSave.equipped === t.id) {
    toolSave.equipped = null;
  } else {
    toolSave.equipped = t.id;
    toolSave.carry = Math.max(1, Math.min(toolSave.carry || 1, toolOwned(t.id), t.max));
    jutsuSave.equipped = null;   // 忍術とは併用できない
    saveJutsu();
  }
  saveTools();
  playSound('kick');
  renderToolGrid();
}
function toolChangeCarry(t, d) {
  const lim = Math.max(1, Math.min(toolOwned(t.id), t.max));
  toolSave.carry = Math.max(1, Math.min(lim, (toolSave.carry || 1) + d));
  saveTools();
  playSound('kick');
  renderToolGrid();
}

function renderToolGrid() {
  const grid = document.getElementById('skin-grid');
  grid.innerHTML = '';
  TOOLS.forEach(t => {
    const owned = toolOwned(t.id);
    const equipped = toolSave.equipped === t.id && owned > 0;
    const card = document.createElement('div');
    card.className = 'skin-card jutsu-card' + (equipped ? ' selected' : '') + (owned === 0 ? ' locked' : '');
    card.style.background = 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)';
    card.style.color = '#F8FAFC';
    card.style.borderColor = equipped ? '#FFD600' : t.color;
    card.style.boxShadow = '4px 4px 0px ' + t.color;
    card.style.cursor = 'default';

    const head = document.createElement('div');
    head.className = 'jutsu-head';
    head.innerHTML =
      '<div class="jutsu-icon" style="box-shadow: inset 0 0 14px ' + t.color + ';">' + t.icon + '</div>' +
      '<div class="jutsu-info">' +
      '<div class="jutsu-name">' + t.name + '<span class="jutsu-sub" style="color:' + t.color + ';">所持 ' + owned + '個</span></div>' +
      '<div class="jutsu-desc">' + t.desc + '</div>' +
      '<div class="jutsu-stat">持ち込み上限 ' + t.max + '個 / 1回の挑戦で1種類まで</div>' +
      '</div>';
    card.appendChild(head);

    const row = document.createElement('div');
    row.className = 'jutsu-row';
    const mk = (parent, label, cls, fn) => {
      const b = document.createElement('button');
      b.className = 'jutsu-btn ' + cls;
      b.textContent = label;
      b.onclick = fn;
      parent.appendChild(b);
    };
    mk(row, '購入  ' + t.price + '枚', totalCoins >= t.price ? 'buy' : 'dim', () => toolBuy(t));
    if (owned > 0) mk(row, equipped ? '装備中' : '装備する', equipped ? 'on' : 'buy', () => toolToggleEquip(t));
    card.appendChild(row);

    if (equipped) {
      const lim = Math.max(1, Math.min(owned, t.max));
      const carry = Math.max(1, Math.min(toolSave.carry || 1, lim));
      const row2 = document.createElement('div');
      row2.className = 'jutsu-row';
      mk(row2, '-', 'dim', () => toolChangeCarry(t, -1));
      const lab = document.createElement('div');
      lab.className = 'tool-carry';
      lab.textContent = '持ち込み ' + carry + ' / ' + lim;
      row2.appendChild(lab);
      mk(row2, '+', 'dim', () => toolChangeCarry(t, 1));
      card.appendChild(row2);
    }
    grid.appendChild(card);
  });
}

const baseSwitchShopTab2 = switchShopTab;
switchShopTab = function (tab) {
  baseSwitchShopTab2(tab);
  const b = document.getElementById('shop-tab-tool');
  if (b) b.classList.toggle('active', tab === 'tool');
};
const baseRenderSkinGrid2 = renderSkinGrid;
renderSkinGrid = function () {
  if (currentShopTab === 'tool') renderToolGrid();
  else baseRenderSkinGrid2();
};

// 忍術を装備したら、忍具は外れる
const baseJutsuToggleEquip = jutsuToggleEquip;
jutsuToggleEquip = function (j) {
  baseJutsuToggleEquip(j);
  if (jutsuSave.equipped) { toolSave.equipped = null; saveTools(); }
};
const baseJutsuUnlock = jutsuUnlock;
jutsuUnlock = function (j) {
  baseJutsuUnlock(j);
  if (jutsuSave.equipped) { toolSave.equipped = null; saveTools(); }
};

// ---------- ゲーム中 ----------
let toolRun = null;
let toolLock = 0;
let magnetT = 0;

const toolBtn = document.createElement('button');
toolBtn.id = 'tool-btn';
toolBtn.tabIndex = -1;
toolBtn.innerHTML = '<span class="jb-gauge"></span><span class="jb-label"></span>';
toolBtn.addEventListener('focus', () => toolBtn.blur());
toolBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); useTool(); });
document.getElementById('game-wrapper').appendChild(toolBtn);

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyZ' && !e.repeat) useTool();
});

const baseStartGame3 = startGame;
startGame = function (...args) {
  baseStartGame3(...args);
  toolRun = null;
  toolLock = 0;
  magnetT = 0;
  const t = toolDef(toolSave.equipped);
  if (t && !equippedJutsu() && toolOwned(t.id) > 0) {
    toolRun = { id: t.id, left: Math.max(1, Math.min(toolSave.carry || 1, toolOwned(t.id), t.max)) };
  }
};

function consumeTool() {
  toolRun.left--;
  toolSave.owned[toolRun.id] = Math.max(0, toolOwned(toolRun.id) - 1);
  saveTools();
}

function useTool() {
  if (gameState !== 'playing' || !toolRun || toolRun.left <= 0 || toolRun.id === 'totem' || toolLock > 0) return;
  const id = toolRun.id;
  const t = toolDef(id);
  const cx = player.x + player.size / 2;
  const cy = player.y + player.size / 2;
  consumeTool();
  toolLock = 30;
  if (id === 'smoke') {
    projectiles = projectiles.filter(p => p.reflected);
    bossLasers = [];
    jstate.postInv = Math.max(jstate.postInv, 90);
    spawnParticles(cx, cy, '#E2E8F0', 26, false);
    jfx.push({ type: 'ring', x: cx, y: cy, t: 0, total: 24, color: '#E2E8F0' });
    jfx.push({ type: 'banner', text: t.name, sub: '身を隠す', color: t.color, t: 0, total: 50 });
    playSound('deflect');
  } else if (id === 'flash') {
    bats = [];
    birds = [];
    ambusherEnemies = [];
    newEnemies.length = 0;
    projectiles = projectiles.filter(p => p.type !== 'arrow' && p.type !== 'snowball');
    jfx.push({ type: 'flash', t: 0, total: 12, color: '255,255,230' });
    jfx.push({ type: 'banner', text: t.name, sub: '闇を裂く', color: t.color, t: 0, total: 50 });
    playSound('laserFire');
  } else if (id === 'charm') {
    player.airJumpAvailable = true;
    player.lockoutTimer = 0;
    performKick();
    jfx.push({ type: 'ring', x: cx, y: cy, t: 0, total: 20, color: '#FB7185' });
  } else if (id === 'magnet') {
    magnetT = 600;
    jfx.push({ type: 'ring', x: cx, y: cy, t: 0, total: 24, color: '#93C5FD' });
    jfx.push({ type: 'banner', text: t.name, sub: 'コインを引き寄せる', color: t.color, t: 0, total: 50 });
    playSound('coin');
  }
}

function totemRevive() {
  consumeTool();
  const cx = player.x + player.size / 2;
  const cy = player.y + player.size / 2;
  if (player.y - cameraY > canvas.height) {
    player.y = cameraY + canvas.height - 130;
    player.vy = -14;
  } else {
    const away = player.onWall === 'left' ? 1 : (player.onWall === 'right' ? -1 : -(player.facing || 1));
    player.vx = away * 7;
    player.vy = -10;
    player.facing = away;
  }
  player.onWall = null;
  player.airJumpAvailable = true;
  player.clashState = null;
  projectiles = projectiles.filter(p => p.reflected);
  bossLasers = [];
  const near = (o) => Math.hypot(o.x - cx, o.y - cy) > 110;
  bats = bats.filter(near);
  birds = birds.filter(near);
  const keep = newEnemies.filter(near);
  newEnemies.length = 0;
  keep.forEach(o => newEnemies.push(o));
  jstate.postInv = 120;
  shakeTime = 20;
  spawnParticles(cx, cy, '#FDE047', 40, false);
  jfx.push({ type: 'ring', x: cx, y: cy, t: 0, total: 30, color: '#FDE047' });
  jfx.push({ type: 'flash', t: 0, total: 12, color: '255,236,150' });
  jfx.push({ type: 'banner', text: '復活', sub: '不死のトーテム', color: '#FDE047', t: 0, total: 60 });
  playSound('clear');
}

const baseShowResult3 = showResult;
showResult = function (isClear) {
  if (!isClear && gameState === 'playing' && toolRun && toolRun.id === 'totem' && toolRun.left > 0 && !jutsuInvulnerable()) {
    totemRevive();
    return;
  }
  baseShowResult3(isClear);
  toolBtn.style.display = 'none';
};

function tickTools() {
  if (toolLock > 0) toolLock--;
  if (magnetT > 0) {
    magnetT--;
    const pcx = player.x + player.size / 2;
    const pcy = player.y + player.size / 2;
    for (const c of coins) {
      const d = Math.hypot(pcx - c.x, pcy - c.y);
      if (d < 230 && d > 1) {
        c.x += (pcx - c.x) / d * 6;
        c.y += (pcy - c.y) / d * 6;
      }
    }
  }
}
const baseUpdateFn4 = update;
update = function () {
  if (gameState === 'playing') tickTools();
  baseUpdateFn4();
};

function updateToolButton() {
  const t = toolRun ? toolDef(toolRun.id) : null;
  if (gameState !== 'playing' || !t) { toolBtn.style.display = 'none'; return; }
  toolBtn.style.display = 'block';
  const gauge = toolBtn.firstChild;
  const label = toolBtn.lastChild;
  gauge.style.background = t.color;
  gauge.style.width = toolRun.left > 0 ? '100%' : '0%';
  if (t.id === 'totem') label.textContent = 'トーテム x' + toolRun.left;
  else label.textContent = 'Z  ' + t.name + ' x' + toolRun.left;
  toolBtn.style.opacity = toolRun.left > 0 ? '1' : '0.5';
}

const baseDrawFn7 = draw;
draw = function () {
  baseDrawFn7();
  updateToolButton();
};
"""

CSS = r"""
/* ショップのタブが4つ並ぶので、2行にする */
.shop-tabs {
  flex-wrap: wrap;
}

.shop-tab {
  flex: 1 1 calc(50% - 4px);
}

/* 忍具ボタン（ゲーム中、画面左下。忍術ボタンと同じ位置・同じ見た目） */
#tool-btn {
  position: absolute;
  left: 6px;
  bottom: 6px;
  z-index: 8;
  display: none;
  overflow: hidden;
  min-width: 96px;
  text-align: left;
  font-family: inherit;
  font-size: 12px;
  font-weight: 900;
  padding: 5px 10px;
  background: #FFFFFF;
  color: #1E1E24;
  border: 3px solid #1E1E24;
  border-radius: 3px;
  box-shadow: 3px 3px 0px #1E1E24;
  cursor: pointer;
}

#tool-btn .jb-gauge {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  opacity: 0.55;
}

#tool-btn .jb-label {
  position: relative;
}

.tool-carry {
  flex: 2;
  text-align: center;
  font-size: 12px;
  font-weight: 900;
  color: #FDE047;
  align-self: center;
}
"""

game = open("game.js", encoding="utf-8").read()
if MARK in game:
    print("split2: すでに適用済みです")
    sys.exit(0)

# ボスの専用弾は、元の丸い弾の描画をやめて、専用の見た目で描く
pat = re.compile(r"(for \(let proj of projectiles\) \{\s*const py = proj\.y - cameraY;)")
if len(pat.findall(game)) == 1:
    game = pat.sub(lambda m: m.group(1) + "\n      if (proj.sprite) continue;", game)
else:
    print("注意: 弾の描画部分が見つかりませんでした。専用弾の下に元の丸い弾が重なって見えます")

open("game.js", "w", encoding="utf-8").write(game + "\n" + JS)

css_text = open("style.css", encoding="utf-8").read()
open("style.css", "w", encoding="utf-8").write(css_text + CSS)

html = open("index.html", encoding="utf-8").read()
old = "忍術 (3)</button>"
new = old + "\n      <button id=\"shop-tab-tool\" class=\"shop-tab\" onclick=\"switchShopTab('tool')\">忍具 (5)</button>"
if old in html:
    html = html.replace(old, new)
    open("index.html", "w", encoding="utf-8").write(html)
else:
    print("注意: 忍具タブを追加できませんでした")

print("split2: ボス攻撃の本格化 と 忍具 を追加しました")