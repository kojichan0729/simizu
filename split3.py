#!/usr/bin/env python3
# split2.py のあとに適用する、ボス攻撃 v2。
#   ・元の「丸い玉」の攻撃を廃止し、全ボスが専用の技（技名つき）を使う
#   ・弾の見た目を全面的に描き直し（魚・鈴・光輪・槍・岩・氷・隕石・雷・骸骨など）
# split.py の最後から自動で呼ばれる。単独で実行する場合は、出力があるフォルダで python split3.py
import sys

MARK = "/* SPLIT3 */"
JS = r"""
/* SPLIT3 */
// ==========================================
// ボス攻撃 v2
//   ・元の「丸い玉」の攻撃はすべて廃止。全ボスが、専用の見た目と専用の技を持つ
//   ・技は14種類の動き × ボスごとの弾（魚・鈴・光輪・槍・岩・氷・隕石・雷・骸骨など）
//   ・技名の表示、溜めの演出、予告の演出、弾の軌跡つき。どの弾も回転攻撃で弾き返せる
// ==========================================
const INK3 = '#1E1E24';

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = f < 0 ? 0 : 255, p = Math.abs(f);
  r = Math.round((t - r) * p + r);
  g = Math.round((t - g) * p + g);
  b = Math.round((t - b) * p + b);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
function gradV(c, y0, y1, stops) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  stops.forEach(s => g.addColorStop(s[0], s[1]));
  return g;
}
function sprBase(c) {
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.lineWidth = 2;
  c.strokeStyle = INK3;
}
function fillStroke(c, fill) {
  c.fillStyle = fill;
  c.fill();
  c.stroke();
}

// ---------- 弾の見た目（右向きに描く。半径12相当） ----------
const SPR = {};

SPR.shachi = (c, col, t) => {
  sprBase(c);
  const lt = shade(col, 0.5), dk = shade(col, -0.45), wag = Math.sin(t * 0.3) * 3;
  c.beginPath();
  c.moveTo(-9, 0); c.quadraticCurveTo(-15, -5 + wag, -23, -11 + wag); c.quadraticCurveTo(-18, -2 + wag, -25, 1 + wag);
  c.quadraticCurveTo(-18, 4 + wag, -23, 11 + wag); c.quadraticCurveTo(-15, 5 + wag, -9, 0);
  fillStroke(c, dk);
  for (let i = 0; i < 4; i++) {
    const x = -6 + i * 5;
    c.beginPath(); c.moveTo(x, -8 + i * 0.6); c.lineTo(x + 2.5, -15 + i); c.lineTo(x + 5, -8.5 + i * 0.6); c.closePath();
    fillStroke(c, lt);
  }
  c.beginPath();
  c.moveTo(15, 1); c.quadraticCurveTo(10, -10, -2, -9); c.quadraticCurveTo(-9, -6, -10, 0);
  c.quadraticCurveTo(-9, 6, -2, 8); c.quadraticCurveTo(10, 9, 15, 1); c.closePath();
  fillStroke(c, gradV(c, -10, 9, [[0, lt], [0.5, col], [1, dk]]));
  c.strokeStyle = 'rgba(120,53,15,0.55)'; c.lineWidth = 1;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
    c.beginPath(); c.arc(-4 + i * 4.5 + r * 2.2, -3 + r * 5, 2.8, 0.2, Math.PI - 0.2); c.stroke();
  }
  c.strokeStyle = INK3; c.lineWidth = 2;
  c.beginPath(); c.moveTo(3, 3); c.quadraticCurveTo(-1, 9, -5, 11); c.quadraticCurveTo(0, 6, 3, 3); fillStroke(c, lt);
  c.beginPath(); c.moveTo(14, 2); c.quadraticCurveTo(19, 3, 21, 8); c.stroke();
  c.beginPath(); c.arc(9, -2, 2.8, 0, 6.28); fillStroke(c, '#FFFFFF');
  c.fillStyle = '#B91C1C'; c.beginPath(); c.arc(9.6, -2, 1.5, 0, 6.28); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(-6, -6); c.quadraticCurveTo(2, -9, 9, -7); c.stroke();
};

SPR.katsuo = (c, col, t) => {
  sprBase(c);
  const lt = shade(col, 0.55), dk = shade(col, -0.5), wag = Math.sin(t * 0.35) * 3;
  c.beginPath(); c.moveTo(-10, 0); c.lineTo(-21, -8 + wag); c.quadraticCurveTo(-16, 0, -21, 8 + wag); c.closePath(); fillStroke(c, dk);
  c.beginPath();
  c.moveTo(17, 0); c.quadraticCurveTo(10, -8, -2, -7); c.quadraticCurveTo(-9, -4, -11, 0);
  c.quadraticCurveTo(-9, 4, -2, 7); c.quadraticCurveTo(10, 8, 17, 0); c.closePath();
  fillStroke(c, gradV(c, -8, 8, [[0, dk], [0.45, col], [0.55, lt], [1, '#F1F5F9']]));
  c.strokeStyle = 'rgba(15,23,42,0.6)'; c.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-6 + i * 4.5, -6.5); c.lineTo(-5 + i * 4.5, 0); c.stroke(); }
  c.strokeStyle = INK3; c.lineWidth = 2;
  c.beginPath(); c.moveTo(0, -7); c.lineTo(3, -13); c.lineTo(7, -6); c.closePath(); fillStroke(c, dk);
  c.beginPath(); c.moveTo(4, 4); c.lineTo(-2, 10); c.lineTo(-1, 3); c.closePath(); fillStroke(c, dk);
  c.beginPath(); c.arc(11, -1.5, 2.4, 0, 6.28); fillStroke(c, '#FFFFFF');
  c.fillStyle = INK3; c.beginPath(); c.arc(11.5, -1.5, 1.2, 0, 6.28); c.fill();
};

SPR.bell = (c, col, t) => {
  sprBase(c);
  c.rotate(Math.sin(t * 0.25) * 0.35);
  c.beginPath(); c.arc(0, -13, 3, 0, 6.28); c.lineWidth = 2.4; c.stroke(); c.lineWidth = 2;
  c.beginPath(); c.moveTo(-12, 8); c.quadraticCurveTo(-13, -12, 0, -12); c.quadraticCurveTo(13, -12, 12, 8); c.closePath();
  fillStroke(c, gradV(c, -12, 8, [[0, '#FEF08A'], [0.5, '#FACC15'], [1, '#B45309']]));
  c.strokeStyle = 'rgba(120,53,15,0.7)'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-12.4, 2); c.lineTo(12.4, 2); c.stroke();
  c.strokeStyle = INK3; c.lineWidth = 2;
  c.beginPath(); c.arc(0, 10, 3.4, 0, 6.28); fillStroke(c, col);
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-7, -6); c.quadraticCurveTo(-8, -1, -8, 3); c.stroke();
};

SPR.halo = (c, col, t) => {
  c.rotate(t * 0.06);
  c.lineCap = 'round';
  c.strokeStyle = '#FDE047'; c.lineWidth = 2.4;
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6, l = i % 2 ? 15 : 19;
    c.beginPath(); c.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); c.lineTo(Math.cos(a) * l, Math.sin(a) * l); c.stroke();
  }
  c.beginPath(); c.arc(0, 0, 10, 0, 6.28); c.lineWidth = 6.4; c.strokeStyle = INK3; c.stroke();
  c.lineWidth = 3.4; c.strokeStyle = '#FDE047'; c.stroke();
  c.lineWidth = 1; c.strokeStyle = '#FFFFFF'; c.stroke();
  sprBase(c);
  c.beginPath(); c.moveTo(0, -4.5); c.lineTo(3.5, 0); c.lineTo(0, 4.5); c.lineTo(-3.5, 0); c.closePath(); fillStroke(c, col);
};

SPR.feather = (c, col, t) => {
  sprBase(c);
  const lt = shade(col, 0.5), dk = shade(col, -0.4);
  c.beginPath(); c.moveTo(-17, 3); c.quadraticCurveTo(-4, -13, 16, -2); c.quadraticCurveTo(2, 11, -17, 3); c.closePath();
  fillStroke(c, gradV(c, -10, 8, [[0, lt], [1, dk]]));
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const x = -12 + i * 5;
    c.beginPath(); c.moveTo(x, -3 + i * 0.5); c.lineTo(x + 4, -8 + i * 0.9); c.stroke();
    c.beginPath(); c.moveTo(x, -2 + i * 0.5); c.lineTo(x + 3, 3 + i * 0.3); c.stroke();
  }
  c.strokeStyle = INK3; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(-20, 5); c.quadraticCurveTo(-2, -3, 15, -2); c.stroke();
};

SPR.urchin = (c, col, t) => {
  sprBase(c);
  const dk = shade(col, -0.5), lt = shade(col, 0.45);
  c.rotate(t * 0.02);
  for (let i = 0; i < 14; i++) {
    const a = i * Math.PI * 2 / 14, len = i % 2 ? 15 : 19;
    c.beginPath();
    c.moveTo(Math.cos(a - 0.14) * 8, Math.sin(a - 0.14) * 8);
    c.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    c.lineTo(Math.cos(a + 0.14) * 8, Math.sin(a + 0.14) * 8);
    c.closePath(); fillStroke(c, dk);
  }
  const g = c.createRadialGradient(-3, -3, 1, 0, 0, 10);
  g.addColorStop(0, lt); g.addColorStop(0.6, col); g.addColorStop(1, dk);
  c.beginPath(); c.arc(0, 0, 9, 0, 6.28); fillStroke(c, g);
  c.rotate(-t * 0.02);
  c.fillStyle = '#FFFFFF';
  c.beginPath(); c.arc(-3.2, -1.5, 2.4, 0, 6.28); c.fill(); c.stroke();
  c.beginPath(); c.arc(3.2, -1.5, 2.4, 0, 6.28); c.fill(); c.stroke();
  c.fillStyle = INK3;
  c.beginPath(); c.arc(-2.7, -1.2, 1.1, 0, 6.28); c.fill();
  c.beginPath(); c.arc(3.7, -1.2, 1.1, 0, 6.28); c.fill();
  c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -5); c.lineTo(-1.5, -3.5); c.moveTo(6, -5); c.lineTo(1.5, -3.5); c.stroke();
};

SPR.star = (c, col, t) => {
  sprBase(c);
  const lt = shade(col, 0.6), dk = shade(col, -0.4);
  c.rotate(t * 0.04);
  c.beginPath();
  for (let k = 0; k < 10; k++) {
    const rr = k % 2 === 0 ? 16 : 6.8, a = -Math.PI / 2 + k * Math.PI / 5;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  const g = c.createRadialGradient(-2, -3, 1, 0, 0, 16);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.35, lt); g.addColorStop(0.75, col); g.addColorStop(1, dk);
  fillStroke(c, g);
  c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(-5, -5); c.lineTo(5, 5); c.moveTo(5, -5); c.lineTo(-5, 5); c.stroke();
};

SPR.ice = (c, col, t) => {
  sprBase(c);
  const lt = shade(col, 0.65), dk = shade(col, -0.35);
  const shard = (ang, len, w) => {
    c.save(); c.rotate(ang);
    c.beginPath(); c.moveTo(0, -len); c.lineTo(w, -len * 0.25); c.lineTo(w * 0.6, len * 0.5); c.lineTo(-w * 0.6, len * 0.5); c.lineTo(-w, -len * 0.25); c.closePath();
    fillStroke(c, gradV(c, -len, len * 0.5, [[0, '#FFFFFF'], [0.4, lt], [1, dk]]));
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-w * 0.3, -len * 0.7); c.lineTo(-w * 0.3, len * 0.2); c.stroke();
    c.strokeStyle = INK3; c.lineWidth = 2;
    c.restore();
  };
  shard(-0.75, 11, 4.5);
  shard(0.75, 11, 4.5);
  shard(0, 17, 6.5);
};

SPR.boulder = (c, col, t) => {
  sprBase(c);
  const pts = [[-12, -3], [-7, -12], [4, -13], [12, -5], [11, 6], [3, 13], [-8, 11], [-13, 4]];
  c.beginPath();
  pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])));
  c.closePath();
  const g = c.createRadialGradient(-4, -5, 1, 0, 0, 16);
  g.addColorStop(0, '#E7E5E4'); g.addColorStop(0.6, '#A8A29E'); g.addColorStop(1, '#57534E');
  fillStroke(c, g);
  c.strokeStyle = 'rgba(41,37,36,0.55)'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(-7, -12); c.lineTo(-2, -2); c.lineTo(-8, 11); c.moveTo(-2, -2); c.lineTo(11, 3); c.stroke();
  c.strokeStyle = col; c.lineWidth = 2;
  c.beginPath(); c.moveTo(2, -10); c.lineTo(5, -3); c.lineTo(1, 2); c.lineTo(4, 9); c.stroke();
};

SPR.spear = (c, col, t) => {
  sprBase(c);
  const wag = Math.sin(t * 0.3) * 2;
  c.beginPath(); c.moveTo(-25, 0); c.lineTo(-31, -4 + wag); c.lineTo(-28, 0); c.lineTo(-31, 4 + wag); c.closePath(); fillStroke(c, col);
  c.fillStyle = gradV(c, -2.4, 2.4, [[0, '#B45309'], [1, '#451A03']]);
  c.fillRect(-25, -2.3, 33, 4.6); c.strokeRect(-25, -2.3, 33, 4.6);
  c.fillStyle = col;
  c.fillRect(-19, -2.3, 3.5, 4.6); c.strokeRect(-19, -2.3, 3.5, 4.6);
  c.fillRect(-9, -2.3, 3.5, 4.6); c.strokeRect(-9, -2.3, 3.5, 4.6);
  c.beginPath(); c.moveTo(8, -5.5); c.lineTo(23, 0); c.lineTo(8, 5.5); c.lineTo(11.5, 0); c.closePath();
  fillStroke(c, gradV(c, -5.5, 5.5, [[0, '#FFFFFF'], [0.5, '#CBD5E1'], [1, '#64748B']]));
  c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(11, -1.5); c.lineTo(20, -0.2); c.stroke();
};

SPR.slash = (c, col, t) => {
  c.lineJoin = 'round';
  c.strokeStyle = hexToRgba(col, 0.6); c.lineWidth = 2;
  for (let i = -1; i <= 1; i += 2) {
    c.beginPath(); c.moveTo(-8, i * 12); c.lineTo(-26, i * 17); c.stroke();
  }
  c.beginPath(); c.moveTo(-8, -18); c.quadraticCurveTo(18, 0, -8, 18); c.quadraticCurveTo(5, 0, -8, -18); c.closePath();
  const g = c.createLinearGradient(-8, 0, 16, 0);
  g.addColorStop(0, hexToRgba(col, 0.25)); g.addColorStop(0.6, col); g.addColorStop(1, '#FFFFFF');
  c.fillStyle = g; c.fill();
  c.lineWidth = 1.4; c.strokeStyle = INK3; c.stroke();
};
SPR.claw = SPR.slash;

SPR.leaf = (c, col, t) => {
  sprBase(c);
  const lt = shade(col, 0.5), dk = shade(col, -0.45);
  c.beginPath(); c.moveTo(-16, 0); c.quadraticCurveTo(-4, -13, 16, 0); c.quadraticCurveTo(-4, 13, -16, 0); c.closePath();
  fillStroke(c, gradV(c, -10, 10, [[0, lt], [0.5, col], [1, dk]]));
  c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(-15, 0); c.lineTo(14, 0); c.stroke();
  for (let i = 0; i < 4; i++) {
    const x = -9 + i * 6;
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 4, -5 + i * 0.6); c.moveTo(x, 0); c.lineTo(x + 4, 5 - i * 0.6); c.stroke();
  }
  c.strokeStyle = INK3; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-16, 0); c.lineTo(-21, 2); c.stroke();
};

SPR.crystal = (c, col, t) => {
  sprBase(c);
  const lt = shade(col, 0.6), dk = shade(col, -0.35);
  c.beginPath(); c.moveTo(0, -17); c.lineTo(8, -6); c.lineTo(6, 10); c.lineTo(0, 16); c.lineTo(-6, 10); c.lineTo(-8, -6); c.closePath();
  fillStroke(c, gradV(c, -17, 16, [[0, '#FFFFFF'], [0.35, lt], [1, dk]]));
  c.fillStyle = 'rgba(255,255,255,0.28)';
  c.beginPath(); c.moveTo(-8, -6); c.lineTo(0, -17); c.lineTo(0, 16); c.lineTo(-6, 10); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(-8, -6); c.lineTo(8, -6); c.moveTo(0, -17); c.lineTo(0, 16); c.stroke();
  const tw = 0.5 + 0.5 * Math.abs(Math.sin(t * 0.2));
  c.strokeStyle = 'rgba(255,255,255,' + tw + ')'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(-4, -11); c.lineTo(-4, -5); c.moveTo(-7, -8); c.lineTo(-1, -8); c.stroke();
};

SPR.meteor = (c, col, t) => {
  const tail = c.createLinearGradient(-36, 0, 0, 0);
  tail.addColorStop(0, 'rgba(239,68,68,0)'); tail.addColorStop(0.6, 'rgba(249,115,22,0.8)'); tail.addColorStop(1, 'rgba(253,224,71,0.95)');
  c.fillStyle = tail;
  c.beginPath(); c.moveTo(-36, 0); c.quadraticCurveTo(-20, -10 + Math.sin(t * 0.4) * 2, -2, -10); c.lineTo(-2, 10);
  c.quadraticCurveTo(-20, 10 - Math.sin(t * 0.4) * 2, -36, 0); c.fill();
  sprBase(c);
  c.beginPath();
  [[-9, -5], [-3, -11], [7, -9], [12, -1], [8, 9], [-2, 11], [-9, 5]].forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])));
  c.closePath();
  const g = c.createRadialGradient(-3, -3, 1, 0, 0, 13);
  g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.55, '#7C2D12'); g.addColorStop(1, '#1C0A04');
  fillStroke(c, g);
  c.strokeStyle = '#FDE047'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(-5, -4); c.lineTo(0, 1); c.lineTo(-2, 7); c.moveTo(0, 1); c.lineTo(7, 3); c.stroke();
};

SPR.coin = (c, col, t) => {
  const sx = Math.max(0.22, Math.abs(Math.cos(t * 0.18)));
  c.scale(sx, 1);
  sprBase(c);
  const g = c.createRadialGradient(-4, -4, 1, 0, 0, 13);
  g.addColorStop(0, '#FEF9C3'); g.addColorStop(0.5, '#FACC15'); g.addColorStop(1, '#B45309');
  c.beginPath(); c.arc(0, 0, 12, 0, 6.28); fillStroke(c, g);
  c.strokeStyle = 'rgba(120,53,15,0.8)'; c.lineWidth = 1.6;
  c.beginPath(); c.arc(0, 0, 8.5, 0, 6.28); c.stroke();
  c.fillStyle = 'rgba(120,53,15,0.85)'; c.fillRect(-1.6, -5.5, 3.2, 11); c.fillRect(-5.5, -1.6, 11, 3.2);
  c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.6;
  c.beginPath(); c.arc(0, 0, 10.5, 3.5, 4.5); c.stroke();
};

SPR.skull = (c, col, t) => {
  sprBase(c);
  const flick = Math.sin(t * 0.4) * 2;
  c.fillStyle = hexToRgba(col, 0.55);
  for (let i = -1; i <= 1; i++) {
    c.beginPath(); c.moveTo(i * 7 - 4, -8); c.quadraticCurveTo(i * 7 - 6, -16 - flick * (i === 0 ? 1 : -1), i * 7, -21 - Math.abs(i) * 2);
    c.quadraticCurveTo(i * 7 + 6, -14, i * 7 + 4, -8); c.closePath(); c.fill();
  }
  c.beginPath(); c.arc(0, -2, 10.5, 0, 6.28);
  fillStroke(c, gradV(c, -12, 8, [[0, '#FFFFFF'], [1, '#CBD5E1']]));
  c.beginPath(); c.moveTo(-6.5, 6); c.lineTo(6.5, 6); c.lineTo(5.5, 13); c.lineTo(-5.5, 13); c.closePath(); fillStroke(c, '#E2E8F0');
  c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(-2.2, 6.5); c.lineTo(-2.2, 12.5); c.moveTo(2.2, 6.5); c.lineTo(2.2, 12.5); c.stroke();
  c.lineWidth = 2;
  c.fillStyle = INK3;
  c.beginPath(); c.ellipse(-4.2, -2.5, 3.4, 4, 0, 0, 6.28); c.fill();
  c.beginPath(); c.ellipse(4.2, -2.5, 3.4, 4, 0, 0, 6.28); c.fill();
  c.fillStyle = col;
  c.beginPath(); c.arc(-4.2, -2, 1.3, 0, 6.28); c.fill();
  c.beginPath(); c.arc(4.2, -2, 1.3, 0, 6.28); c.fill();
  c.beginPath(); c.moveTo(0, 2); c.lineTo(-1.8, 5); c.lineTo(1.8, 5); c.closePath(); fillStroke(c, INK3);
};

SPR.bolt = (c, col, t) => {
  c.lineJoin = 'round'; c.lineCap = 'round';
  const pts = [[-22, -2], [-12, 3], [-9, -3], [1, 4], [4, -2], [17, 2]];
  const line = (w, s) => {
    c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.lineWidth = w; c.strokeStyle = s; c.stroke();
  };
  line(9, hexToRgba(col, 0.45));
  line(5, col);
  line(2.2, '#FFFFFF');
  c.strokeStyle = hexToRgba(col, 0.9); c.lineWidth = 1.6;
  const j = Math.sin(t * 0.8) * 2;
  c.beginPath(); c.moveTo(-9, -3); c.lineTo(-6, -9 + j); c.lineTo(-3, -11 + j); c.moveTo(1, 4); c.lineTo(4, 10 - j); c.lineTo(7, 12 - j); c.stroke();
  c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(17, 2, 3, 0, 6.28); c.fill();
};

SPR.shrapnel = (c, col, t) => {
  sprBase(c);
  c.beginPath(); c.moveTo(-8, -3); c.lineTo(4, -7); c.lineTo(9, 0); c.lineTo(2, 7); c.lineTo(-6, 5); c.closePath();
  fillStroke(c, gradV(c, -7, 7, [[0, shade(col, 0.4)], [1, shade(col, -0.4)]]));
};

// ---------- 弾の描画（軌跡・光・回転・きらめき） ----------
// 動きのある弾は、1周ぶんを16コマにして覚えておく（値は1周の長さ[フレーム]）
const SPR_ANIM = { shachi: 20.9, katsuo: 17.95, bell: 25.1, spear: 20.9, skull: 15.7, crystal: 15.7, coin: 17.45, bolt: 7.85, meteor: 15.7 };
const SPR_SCALE = 2;
const SPR_EXT = 40;
const SPR_CACHE = {};
let sprCacheCount = 0;

function sprFrame(kind, col, t) {
  const per = SPR_ANIM[kind];
  const fi = per ? Math.floor(((t % per) / per) * 16) % 16 : 0;
  const key = kind + '|' + col + '|' + fi;
  let cv = SPR_CACHE[key];
  if (!cv) {
    if (sprCacheCount > 220) {
      for (const k in SPR_CACHE) delete SPR_CACHE[k];
      sprCacheCount = 0;
    }
    cv = document.createElement('canvas');
    cv.width = cv.height = SPR_EXT * 2 * SPR_SCALE;
    const c = cv.getContext('2d');
    c.translate(SPR_EXT * SPR_SCALE, SPR_EXT * SPR_SCALE);
    c.scale(SPR_SCALE, SPR_SCALE);
    // 光の下地
    const g = c.createRadialGradient(0, 0, 2, 0, 0, 20);
    g.addColorStop(0, hexToRgba(col, 0.55));
    g.addColorStop(0.5, hexToRgba(col, 0.22));
    g.addColorStop(1, hexToRgba(col, 0));
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, 20, 0, Math.PI * 2); c.fill();
    (SPR[kind] || SPR.star)(c, col, per ? fi / 16 * per : 0);
    SPR_CACHE[key] = cv;
    sprCacheCount++;
  }
  return cv;
}

drawSigSprite = function (kind, col, rad, t) {
  const cv = sprFrame(kind, col, t || 0);
  const s = rad / 12 / SPR_SCALE;
  ctx.save();
  ctx.scale(s, s);
  ctx.drawImage(cv, -SPR_EXT * SPR_SCALE, -SPR_EXT * SPR_SCALE);
  ctx.restore();
};

const TRAIL_CACHE = {};
function trailStyle(col, a) {
  const q = Math.round(a * 20);
  const k = col + q;
  return TRAIL_CACHE[k] || (TRAIL_CACHE[k] = hexToRgba(col, q / 20 * 0.5));
}

drawSigSprites = function () {
  const spinKinds = ['star', 'boulder', 'urchin', 'ice', 'crystal', 'halo'];
  const dirKinds = ['shachi', 'katsuo', 'spear', 'feather', 'meteor', 'leaf', 'slash', 'claw', 'bolt', 'shrapnel'];
  for (const p of projectiles) {
    if (!p.sprite) continue;
    const sy = p.y - cameraY;
    p._t = (p._t || 0) + 1;
    const col = p.reflected ? '#00E676' : (p.scol || '#FFFFFF');
    const tr = p._tr || (p._tr = []);
    tr.push({ x: p.x, y: p.y });
    if (tr.length > 11) tr.shift();
    if (sy < -50 || sy > canvas.height + 50) continue;

    // 速い弾の光の帯（1枚の塗りだけなので軽い）
    const spd = Math.hypot(p.vx, p.vy);
    if (spd > 5 && !p.reflected) {
      const ux = p.vx / spd, uy = p.vy / spd;
      const len = Math.min(70, spd * 9), wd = (p.sz || 14) * 0.9;
      const bx = p.x - ux * len, by = p.y - uy * len - cameraY;
      const g = ctx.createLinearGradient(p.x, sy, bx, by);
      g.addColorStop(0, hexToRgba(col, 0.55));
      g.addColorStop(1, hexToRgba(col, 0));
      ctx.save();
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(p.x - uy * wd, sy + ux * wd);
      ctx.lineTo(bx, by);
      ctx.lineTo(p.x + uy * wd, sy - ux * wd);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 軌跡（弾が多いときは線の数を半分にして軽くする）
    ctx.save();
    ctx.lineCap = 'round';
    const step = projectiles.length > 24 ? 2 : 1;
    for (let i = 1; i < tr.length; i += step) {
      const a = i / tr.length;
      ctx.strokeStyle = trailStyle(col, a);
      ctx.lineWidth = Math.max(1, a * (p.sz || 14) * 0.85);
      ctx.beginPath();
      ctx.moveTo(tr[Math.max(0, i - step)].x, tr[Math.max(0, i - step)].y - cameraY);
      ctx.lineTo(tr[i].x, tr[i].y - cameraY);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(p.x, sy);
    if (p.reflected) {
      ctx.strokeStyle = '#00E676';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, (p.sz || 14) + 6, 0, Math.PI * 2); ctx.stroke();
    } else if (p.type === 'bossOrb') {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = -p._t * 0.6;
      ctx.beginPath(); ctx.arc(0, 0, (p.sz || 14) + 6, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (spinKinds.includes(p.sprite)) ctx.rotate(p._t * ({ star: 0.08, halo: 0.08, urchin: 0.04 }[p.sprite] || 0.02));
    else if (dirKinds.includes(p.sprite)) ctx.rotate(Math.atan2(p.vy, p.vx));
    drawSigSprite(p.sprite, col, p.sz || 14, p._t);
    ctx.restore();

  }
};

// ---------- 技の予告 ----------
drawSigWarn = function () {
  if (gameState !== 'playing' || !activeBoss) return;
  const T = Date.now() * 0.01;
  for (const q of bossQueue) {
    if (!q.warn || q.boss !== activeBoss) continue;
    const w = q.warn;
    const col = w.col || '#FF3B6B';
    const p = 1 - q.t / q.t0;
    const pulse = 0.5 + 0.5 * Math.abs(Math.sin(T * 1.2 + p * 7));
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (w.kind === 'portal') {
      const sy = w.y - cameraY;
      const rr = 8 + p * 16;
      ctx.translate(w.x - w.dir * 4, sy);
      ctx.save();
      ctx.scale(0.6, 1);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, rr * 1.7);
      g.addColorStop(0, hexToRgba(col, 0.95)); g.addColorStop(1, hexToRgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, rr * 1.7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath(); ctx.arc(0, 0, rr * (0.45 + k * 0.22), T * 0.5 + k * 2, T * 0.5 + k * 2 + 2.2); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,59,107,' + (0.4 + 0.5 * pulse) + ')';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const x = w.dir * (24 + i * 14);
        ctx.beginPath(); ctx.moveTo(x, -8); ctx.lineTo(x + w.dir * 8, 0); ctx.lineTo(x, 8); ctx.stroke();
      }
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(w.dir * 60, 0); ctx.lineTo(w.dir * 300, 0); ctx.stroke();
    } else if (w.kind === 'top') {
      const sy = w.y - cameraY;
      const g = ctx.createLinearGradient(0, sy, 0, sy + 280);
      g.addColorStop(0, hexToRgba(col, 0.5 * pulse + 0.15)); g.addColorStop(1, hexToRgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(w.x - 7, sy, 14, 280);
      ctx.fillStyle = 'rgba(255,59,107,' + (0.5 + 0.5 * pulse) + ')';
      ctx.beginPath(); ctx.moveTo(w.x - 10, sy - 6); ctx.lineTo(w.x + 10, sy - 6); ctx.lineTo(w.x, sy + 10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.stroke();
    } else if (w.kind === 'crack') {
      const sy = w.y - cameraY;
      const g = ctx.createLinearGradient(0, sy, 0, sy - 300);
      g.addColorStop(0, hexToRgba(col, 0.5 * pulse + 0.1)); g.addColorStop(1, hexToRgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(w.x - 10, sy - 300, 20, 300);
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(w.x - 16, sy); ctx.lineTo(w.x - 6, sy - 8); ctx.lineTo(w.x + 2, sy - 2); ctx.lineTo(w.x + 9, sy - 10); ctx.lineTo(w.x + 17, sy); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,59,107,' + (0.5 + 0.5 * pulse) + ')'; ctx.lineWidth = 2; ctx.stroke();
    } else if (w.kind === 'lane') {
      const bright = p > 0.8 ? 0.55 : 0.28 * pulse + 0.1;
      const g = ctx.createLinearGradient(w.x - 18, 0, w.x + 18, 0);
      g.addColorStop(0, hexToRgba(col, 0)); g.addColorStop(0.5, hexToRgba(col, bright + 0.2)); g.addColorStop(1, hexToRgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(w.x - 18, 0, 36, canvas.height);
      ctx.strokeStyle = 'rgba(255,59,107,' + (0.4 + 0.4 * pulse) + ')'; ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(w.x - 15, 0); ctx.lineTo(w.x - 15, canvas.height); ctx.moveTo(w.x + 15, 0); ctx.lineTo(w.x + 15, canvas.height); ctx.stroke();
    } else if (w.kind === 'bar') {
      const t0 = w.top - cameraY, b0 = w.bottom - cameraY, g = w.gapY - cameraY;
      ctx.lineWidth = 8;
      ctx.strokeStyle = 'rgba(255,59,107,' + (0.45 + 0.4 * pulse) + ')';
      ctx.beginPath(); ctx.moveTo(w.x, t0); ctx.lineTo(w.x, g - 80); ctx.moveTo(w.x, g + 80); ctx.lineTo(w.x, b0); ctx.stroke();
      ctx.strokeStyle = hexToRgba(col, 0.9); ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#00E676'; ctx.strokeStyle = INK3; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w.x + w.dir * 6, g - 12); ctx.lineTo(w.x + w.dir * 30, g); ctx.lineTo(w.x + w.dir * 6, g + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (w.kind === 'curtain') {
      const sy = w.y - cameraY;
      ctx.lineWidth = 8;
      ctx.strokeStyle = 'rgba(255,59,107,' + (0.45 + 0.4 * pulse) + ')';
      ctx.beginPath(); ctx.moveTo(LEFT_WALL_X, sy); ctx.lineTo(w.g0, sy); ctx.moveTo(w.g1, sy); ctx.lineTo(RIGHT_WALL_X, sy); ctx.stroke();
      ctx.strokeStyle = hexToRgba(col, 0.9); ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#00E676'; ctx.strokeStyle = INK3; ctx.lineWidth = 2;
      const mx = (w.g0 + w.g1) / 2;
      ctx.beginPath(); ctx.moveTo(mx - 12, sy - 8); ctx.lineTo(mx + 12, sy - 8); ctx.lineTo(mx, sy + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (w.kind === 'line') {
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -T * 3;
      ctx.strokeStyle = 'rgba(255,59,107,' + (0.4 + 0.5 * pulse) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(w.x, w.y - cameraY); ctx.lineTo(w.x2, w.y2 - cameraY); ctx.stroke();
      ctx.strokeStyle = hexToRgba(col, 0.85); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(w.x2, w.y2 - cameraY, 12 * (1 - p) + 6, 0, Math.PI * 2); ctx.stroke();
    } else if (w.kind === 'aim') {
      if (w.p && projectiles.includes(w.p)) {
        const pcx = player.x + player.size / 2, pcy = player.y - cameraY + player.size / 2;
        ctx.setLineDash([8, 7]);
        ctx.lineDashOffset = -T * 3;
        ctx.strokeStyle = 'rgba(255,59,107,' + (0.35 + 0.5 * p) + ')';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(w.p.x, w.p.y - cameraY); ctx.lineTo(pcx, pcy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(pcx, pcy, 14 * (1 - p) + 8, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (w.kind === 'ring') {
      const rr = w.r * (1 - 0.12 * p);
      ctx.translate(w.x, w.y - cameraY);
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, rr);
      g.addColorStop(0, hexToRgba(col, 0.4 * pulse + 0.1)); g.addColorStop(1, hexToRgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
      ctx.setLineDash([8, 7]);
      ctx.strokeStyle = 'rgba(255,59,107,' + (0.5 + 0.4 * pulse) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, rr, T * 0.15, T * 0.15 + Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 8 + 14 * (1 - p), 0, Math.PI * 2); ctx.stroke();
    } else if (w.kind === 'diag') {
      const sx = w.x, sy = w.y - cameraY;
      const len = 520;
      const ex = sx + w.vx * len, ey = sy + w.vy * len;
      ctx.strokeStyle = hexToRgba(col, 0.25 + 0.2 * pulse);
      ctx.lineWidth = 30;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.setLineDash([12, 8]);
      ctx.strokeStyle = 'rgba(255,59,107,' + (0.5 + 0.4 * pulse) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    }
    ctx.restore();
  }
};

// ---------- 溜めの演出と技名 ----------
const bossCallouts = [];

function drawBossFx() {
  if (gameState !== 'playing') return;
  const b = activeBoss;
  if (b && b.active && b.hp > 0 && b._charge > 0) {
    b._charge--;
    const p = 1 - b._charge / 32;
    const col = b._chargeCol || '#FF3B6B';
    ctx.save();
    ctx.translate(b.x, b.y - cameraY);
    ctx.lineCap = 'round';
    ctx.strokeStyle = hexToRgba(col, 0.85 * (1 - p) + 0.15);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 110 * (1 - p) + 44, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.2 + 0.6 * p) + ')';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const a = i * Math.PI * 2 / 14 + p * 1.5;
      const r0 = 120 * (1 - p) + 54;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * (r0 + 14), Math.sin(a) * (r0 + 14)); ctx.stroke();
    }
    ctx.restore();
  }
  for (let i = bossCallouts.length - 1; i >= 0; i--) {
    const f = bossCallouts[i];
    f.t++;
    if (f.t >= f.total) { bossCallouts.splice(i, 1); continue; }
    const a = Math.min(1, f.t / 8, (f.total - f.t) / 14);
    const slide = (1 - easeOutC(Math.min(1, f.t / 10))) * 150;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = 'rgba(10,10,20,0.78)';
    ctx.beginPath();
    ctx.moveTo(-20 + slide, 104); ctx.lineTo(canvas.width + 20 + slide, 98); ctx.lineTo(canvas.width + 20 + slide, 134); ctx.lineTo(-20 + slide, 140);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = f.col; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-20 + slide, 104); ctx.lineTo(canvas.width + 20 + slide, 98); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = '900 22px "M PLUS Rounded 1c", sans-serif';
    ctx.lineJoin = 'round';
    ctx.shadowColor = f.col; ctx.shadowBlur = 14;
    ctx.strokeStyle = INK3; ctx.lineWidth = 6;
    ctx.strokeText(f.text, canvas.width / 2 + slide, 128);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(f.text, canvas.width / 2 + slide, 128);
    ctx.restore();
  }
}

// ---------- 技 ----------
function v2Shot(b, cfg, x, y, vx, vy, o) {
  if (activeBoss !== b || b.hp <= 0) return null;
  o = o || {};
  const sz = o.sz || 15;
  const rad = o.r || Math.round(sz * 0.7);
  const p = {
    type: o.heavy ? 'bossOrb' : 'bossSpread',
    x: Math.max(LEFT_WALL_X + rad + 4, Math.min(RIGHT_WALL_X - rad - 4, x)), y: y, vx: vx, vy: vy,
    radius: rad, sz: sz, reflected: false, life: o.life || 240, sprite: o.sprite || cfg.s, scol: cfg.col
  };
  if (o.homing) p.homing = o.homing;
  projectiles.push(p);
  return p;
}
function pickSlots(n, count) {
  const a = [];
  for (let i = 0; i < n; i++) a.push(i);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, count);
}
function playerCenter() {
  return { x: player.x + player.size / 2, y: player.y + player.size / 2 };
}

const MOVES = {
  // 壁の渦から、横一直線に飛び出す
  wallDash(b, cfg, r, px, py) {
    const n = 4 + Math.floor(r / 5);
    for (let i = 0; i < n; i++) {
      const left = Math.random() < 0.5;
      const y = Math.max(cameraY + 110, Math.min(cameraY + canvas.height - 110, py + (Math.random() - 0.5) * 320));
      const x0 = left ? LEFT_WALL_X + 20 : RIGHT_WALL_X - 20;
      const dir = left ? 1 : -1;
      sigQueue(b, 42 + i * 13, () => {
        v2Shot(b, cfg, x0, y, dir * (3.4 + 0.05 * r), 0, { sz: 16, life: 150 });
        spawnParticles(x0, y, cfg.col, 6, false);
      }, { kind: 'portal', x: x0, y: y, dir: dir, col: cfg.col });
    }
    playSound('birdWarn');
    return 42 + n * 13 + 60;
  },
  // 上から降り注ぐ
  rainVolley(b, cfg, r) {
    const n = 5 + Math.floor(r / 4);
    const w = RIGHT_WALL_X - LEFT_WALL_X - 60;
    for (let i = 0; i < n; i++) {
      const x = LEFT_WALL_X + 30 + Math.random() * w;
      sigQueue(b, 38 + i * 10, () => v2Shot(b, cfg, x, cameraY - 24, (Math.random() - 0.5) * 0.8, 3.4 + 0.05 * r, { sz: 15, life: 220 }),
        { kind: 'top', x: x, y: cameraY + 26, col: cfg.col });
    }
    playSound('birdWarn');
    return 38 + n * 10 + 60;
  },
  // 床の割れ目から、弾の奔流が噴き上がる
  geyser(b, cfg, r) {
    const cols = 3 + Math.floor(r / 8);
    const w = RIGHT_WALL_X - LEFT_WALL_X - 80;
    pickSlots(7, cols).forEach((s, i) => {
      const x = LEFT_WALL_X + 40 + (s / 6) * w;
      sigQueue(b, 55 + i * 10, () => {
        shakeTime = 6;
        for (let k = 0; k < 4; k++) {
          sigQueue(b, 1 + k * 6, () => v2Shot(b, cfg, x, cameraY + canvas.height + 20, 0, -(6.0 + 0.05 * r), { sz: 14, life: 150 }), null);
        }
      }, { kind: 'crack', x: x, y: cameraY + canvas.height - 8, col: cfg.col });
    });
    playSound('laserWarn');
    return 55 + cols * 10 + 90;
  },
  // 壁から弾の列が押し寄せる（隙間は1か所）
  gapWall(b, cfg, r, px, py) {
    const once = (delay) => {
      const left = Math.random() < 0.5;
      const dir = left ? 1 : -1;
      const x0 = left ? LEFT_WALL_X + 20 : RIGHT_WALL_X - 20;
      const gapY = Math.max(cameraY + 170, Math.min(cameraY + canvas.height - 170, py + (Math.random() - 0.5) * 140));
      const top = cameraY + 70, bottom = cameraY + canvas.height - 70;
      const ys = [];
      for (let y = top; y <= bottom; y += 50) if (Math.abs(y - gapY) > 80) ys.push(y);
      sigQueue(b, delay, () => ys.forEach(y => v2Shot(b, cfg, x0, y, dir * (2.8 + 0.03 * r), 0, { sz: 14, life: 200 })),
        { kind: 'bar', x: x0, top: top, bottom: bottom, gapY: gapY, dir: dir, col: cfg.col });
    };
    once(60);
    if (r >= 10) once(110);
    playSound('laserWarn');
    return (r >= 10 ? 110 : 60) + 110;
  },
  // 左右の壁から同じ高さに弾が走り、中央で交差する
  pincer(b, cfg, r) {
    const n = 3 + Math.floor(r / 6);
    const slots = pickSlots(6, Math.min(6, n));
    slots.forEach((s, i) => {
      const y = cameraY + 120 + s * 85;
      sigQueue(b, 42 + i * 18, () => {
        v2Shot(b, cfg, LEFT_WALL_X + 20, y, 3.2, 0, { sz: 15, life: 160 });
        v2Shot(b, cfg, RIGHT_WALL_X - 20, y, -3.2, 0, { sz: 15, life: 160 });
      }, { kind: 'portal', x: LEFT_WALL_X + 20, y: y, dir: 1, col: cfg.col });
      sigQueue(b, 42 + i * 18, () => {}, { kind: 'portal', x: RIGHT_WALL_X - 20, y: y, dir: -1, col: cfg.col });
    });
    playSound('birdWarn');
    return 42 + slots.length * 18 + 90;
  },
  // 大きな弾を投げ、途中で向きを変えてプレイヤーに戻ってくる（弾き返しのチャンス）
  boomerang(b, cfg, r, px, py) {
    const count = r >= 10 ? 2 : 1;
    for (let k = 0; k < count; k++) {
      sigQueue(b, 40 + k * 34, () => {
        const sx = b.x, sy = b.y + 30;
        const dx = px - sx, dy = py - sy, d = Math.max(1, Math.hypot(dx, dy));
        const p = v2Shot(b, cfg, sx, sy, dx / d * 4.6, dy / d * 4.6, { heavy: true, sz: 21, r: 15, life: 210 });
        if (!p) return;
        sigQueue(b, 42, () => {
          if (p.reflected || !projectiles.includes(p)) return;
          const pc = playerCenter();
          const ddx = pc.x - p.x, ddy = pc.y - p.y, dd = Math.max(1, Math.hypot(ddx, ddy));
          p.vx = ddx / dd * 5.2;
          p.vy = ddy / dd * 5.2;
          playSound('arrow');
        }, null);
      }, { kind: 'line', x: b.x, y: b.y + 30, x2: px, y2: py, col: cfg.col });
    }
    playSound('laserWarn');
    return 40 + count * 34 + 130;
  },
  // ボスの周りに弾が浮かび、1つずつプレイヤーを狙って発射される
  hoverAim(b, cfg, r) {
    const k = 3 + Math.floor(r / 6);
    for (let i = 0; i < k; i++) {
      const a = Math.PI + 0.55 + i * (Math.PI - 1.1) / Math.max(1, k - 1);
      const p = v2Shot(b, cfg, b.x + Math.cos(a) * 80, b.y + Math.sin(a) * 70, 0, 0, { sz: 16, life: 260 });
      if (!p) continue;
      sigQueue(b, 46 + i * 12, () => {
        if (!projectiles.includes(p) || p.reflected) return;
        const pc = playerCenter();
        const dx = pc.x - p.x, dy = pc.y - p.y, d = Math.max(1, Math.hypot(dx, dy));
        p.vx = dx / d * 5.2;
        p.vy = dy / d * 5.2;
        playSound('arrow');
      }, { kind: 'aim', p: p, col: cfg.col });
    }
    playSound('laserWarn');
    return 46 + k * 12 + 70;
  },
  // 大きな炸裂弾を撃ち、途中で破裂して全方位に飛び散る（破裂前なら弾き返せる）
  burstShell(b, cfg, r, px, py) {
    sigQueue(b, 36, () => {
      const sx = b.x, sy = b.y + 30;
      const dx = px - sx, dy = py - sy, d = Math.max(1, Math.hypot(dx, dy));
      const p = v2Shot(b, cfg, sx, sy, dx / d * 4.2, dy / d * 4.2, { heavy: true, sz: 20, r: 14, life: 200 });
      if (!p) return;
      sigQueue(b, 48, () => {
        if (p.reflected || !projectiles.includes(p)) return;
        projectiles.splice(projectiles.indexOf(p), 1);
        const n = 8 + (r >= 10 ? 2 : 0);
        for (let k = 0; k < n; k++) {
          const a = k * Math.PI * 2 / n + 0.3;
          v2Shot(b, cfg, p.x, p.y, Math.cos(a) * 3.2, Math.sin(a) * 3.2, { sz: 12, life: 160 });
        }
        shakeTime = 6;
        spawnParticles(p.x, p.y, cfg.col, 14, false);
        playSound('laserFire');
      }, null);
    }, { kind: 'line', x: b.x, y: b.y + 30, x2: px, y2: py, col: cfg.col });
    playSound('laserWarn');
    return 36 + 48 + 90;
  },
  // 床に印が現れ、少ししたら破裂して弾が散る
  mineField(b, cfg, r, px, py) {
    const n = 4 + Math.floor(r / 6);
    const w = RIGHT_WALL_X - LEFT_WALL_X - 80;
    for (let i = 0; i < n; i++) {
      const x = LEFT_WALL_X + 40 + Math.random() * w;
      const y = Math.max(cameraY + 100, Math.min(cameraY + canvas.height - 110, py + (Math.random() - 0.5) * 340));
      sigQueue(b, 60 + i * 8, () => {
        const off = Math.random() * 6.28;
        for (let k = 0; k < 6; k++) {
          const a = k * Math.PI / 3 + off;
          v2Shot(b, cfg, x, y, Math.cos(a) * 3.0, Math.sin(a) * 3.0, { sz: 12, life: 150 });
        }
        spawnParticles(x, y, cfg.col, 10, false);
        playSound('laserFire');
      }, { kind: 'ring', x: x, y: y, r: 46, col: cfg.col });
    }
    playSound('laserWarn');
    return 60 + n * 8 + 90;
  },
  // 風車のように回転しながら、何本もの腕で弾を放つ
  windmill(b, cfg, r) {
    const arms = r >= 12 ? 4 : 3;
    const steps = 22;
    const base = Math.random() * Math.PI * 2;
    const sgn = Math.random() < 0.5 ? 1 : -1;
    for (let s = 0; s < steps; s++) {
      sigQueue(b, 6 + s * 4, () => {
        for (let a = 0; a < arms; a++) {
          const ang = base + sgn * s * 0.3 + a * Math.PI * 2 / arms;
          v2Shot(b, cfg, b.x, b.y + 30, Math.cos(ang) * 3.0, Math.sin(ang) * 3.0, { sz: 13, life: 200 });
        }
      }, null);
    }
    playSound('arrow');
    return 6 + steps * 4 + 80;
  },
  // プレイヤーを追尾する弾の群れ
  homingPack(b, cfg, r) {
    const k = 3 + (r >= 10 ? 1 : 0);
    for (let i = 0; i < k; i++) {
      sigQueue(b, 20 + i * 18, () => {
        const a = -Math.PI / 2 + (i - (k - 1) / 2) * 0.8;
        v2Shot(b, cfg, b.x, b.y + 20, Math.cos(a) * 3.2, Math.sin(a) * 3.2, { sz: 15, life: 240, homing: 120 });
        playSound('snowball');
      }, null);
    }
    return 20 + k * 18 + 130;
  },
  // 縦の筋が光り、そこへ高速の弾が落ちる
  laneStrike(b, cfg, r, px) {
    const lanes = 3 + (r >= 10 ? 1 : 0);
    const xs = [Math.max(LEFT_WALL_X + 30, Math.min(RIGHT_WALL_X - 30, px + (Math.random() - 0.5) * 40))];
    let guard = 0;
    while (xs.length < lanes && guard++ < 60) {
      const x = LEFT_WALL_X + 30 + Math.random() * (RIGHT_WALL_X - LEFT_WALL_X - 60);
      if (xs.every(o => Math.abs(o - x) > 70)) xs.push(x);
    }
    xs.forEach((x, i) => {
      sigQueue(b, 56 + i * 10, () => {
        v2Shot(b, cfg, x, cameraY - 30, 0, 9.0, { sz: 18, r: 11, life: 100 });
        shakeTime = 5;
      }, { kind: 'lane', x: x, col: cfg.col });
    });
    playSound('laserWarn');
    return 56 + xs.length * 10 + 70;
  },
  // 弾の幕が降りてくる（隙間は1か所）
  curtain(b, cfg, r) {
    const xs = [];
    for (let x = LEFT_WALL_X + 26; x <= RIGHT_WALL_X - 26; x += 42) xs.push(x);
    const once = (delay) => {
      const gap = Math.floor(Math.random() * (xs.length - 3));
      sigQueue(b, delay, () => xs.forEach((x, i) => {
        if (i >= gap && i < gap + 3) return;
        v2Shot(b, cfg, x, cameraY - 24, 0, 3.2 + 0.04 * r, { sz: 14, life: 260 });
      }), { kind: 'curtain', y: cameraY + 26, g0: xs[gap] - 21, g1: xs[gap + 2] + 21, col: cfg.col });
    };
    once(55);
    if (r >= 8) once(115);
    playSound('laserWarn');
    return (r >= 8 ? 115 : 55) + 110;
  },
  // 画面を斜めに横切る大きな斬撃
  crossSlash(b, cfg, r, px, py) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const ang = 0.55;
    const y0 = Math.max(cameraY + 60, py - 230);
    const x0 = dir > 0 ? LEFT_WALL_X + 26 : RIGHT_WALL_X - 26;
    const vx = dir * Math.cos(ang) * 6.6, vy = Math.sin(ang) * 6.6;
    const n = 2 + (r >= 12 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      sigQueue(b, 52 + i * 16, () => {
        v2Shot(b, cfg, x0, y0, vx, vy, { heavy: i === 0, sz: 24, r: 15, life: 60, sprite: 'slash' });
        shakeTime = 5;
        playSound('arrow');
      }, { kind: 'diag', x: x0, y: y0, vx: Math.cos(ang) * dir, vy: Math.sin(ang), col: cfg.col });
    }
    playSound('laserWarn');
    return 52 + n * 16 + 80;
  }
};

// ---------- ボスごとの技（技名つき） ----------
const BOSS_MOVES = {
  '赤べこ将軍': [{ m: 'laneStrike', n: '赤牛の突進', s: 'bell' }, { m: 'rainVolley', n: '福鈴の雨', s: 'bell' }, { m: 'hoverAim', n: '首振り鈴', s: 'bell' }],
  '大仏ガーディアン': [{ m: 'burstShell', n: '光輪炸裂', s: 'halo' }, { m: 'mineField', n: '結界の印', s: 'halo' }, { m: 'windmill', n: '千手観音', s: 'halo' }],
  '黄金シャチホコ王': [{ m: 'wallDash', n: '金鯱昇天', s: 'shachi' }, { m: 'geyser', n: '鯱の滝', s: 'shachi' }, { m: 'pincer', n: '双鯱挟み', s: 'shachi' }],
  '高野山天狗マスター': [{ m: 'crossSlash', n: '天狗風', s: 'feather' }, { m: 'homingPack', n: '羽団扇', s: 'feather' }, { m: 'hoverAim', n: '羽矢', s: 'feather' }],
  '関門フグ大帝': [{ m: 'mineField', n: '棘玉の罠', s: 'urchin' }, { m: 'geyser', n: '潮吹き', s: 'urchin' }, { m: 'burstShell', n: '破裂フグ', s: 'urchin' }],
  '土佐カツオ将軍': [{ m: 'wallDash', n: '一本釣り', s: 'katsuo' }, { m: 'curtain', n: 'カツオ雨', s: 'katsuo' }, { m: 'pincer', n: '荒波挟撃', s: 'katsuo' }],
  '琉球シーサー神': [{ m: 'gapWall', n: '獅子の咆哮', s: 'star' }, { m: 'burstShell', n: '星砕き', s: 'star' }, { m: 'boomerang', n: '守り獅子', s: 'star' }],
  'ヒマラヤ雪男王': [{ m: 'rainVolley', n: '氷柱落とし', s: 'ice' }, { m: 'mineField', n: '氷結の罠', s: 'ice' }, { m: 'curtain', n: '吹雪の幕', s: 'ice' }],
  'カッパドキア魔人': [{ m: 'geyser', n: '岩柱噴出', s: 'boulder' }, { m: 'gapWall', n: '砂岩の壁', s: 'boulder' }, { m: 'rainVolley', n: '落岩', s: 'boulder' }],
  '氷河ヴァイキング王': [{ m: 'wallDash', n: '投げ槍', s: 'spear' }, { m: 'pincer', n: '双槍', s: 'spear' }, { m: 'boomerang', n: '戦槍回帰', s: 'spear' }],
  'サバンナ獅子王': [{ m: 'crossSlash', n: '獅子の爪', s: 'claw' }, { m: 'wallDash', n: '飛び爪', s: 'claw' }, { m: 'hoverAim', n: '狩りの構え', s: 'claw' }],
  '密林ケツァール神': [{ m: 'curtain', n: '葉嵐', s: 'leaf' }, { m: 'homingPack', n: '羽ばたき', s: 'leaf' }, { m: 'windmill', n: '翡翠の渦', s: 'leaf' }],
  '天空鏡の守護神': [{ m: 'mineField', n: '鏡の結晶', s: 'crystal' }, { m: 'burstShell', n: '乱反射', s: 'crystal' }, { m: 'laneStrike', n: '天鏡の光柱', s: 'crystal' }],
  'アース・エンペラー': [{ m: 'rainVolley', n: '隕石雨', s: 'meteor' }, { m: 'geyser', n: '大地噴火', s: 'meteor' }, { m: 'burstShell', n: '星の鉄槌', s: 'meteor' }, { m: 'gapWall', n: '地殻変動', s: 'boulder' }],
  'アンコール石像王': [{ m: 'gapWall', n: '石壁の行進', s: 'boulder' }, { m: 'rainVolley', n: '崩落', s: 'boulder' }, { m: 'mineField', n: '呪いの石碑', s: 'boulder' }],
  '黄金エルドラド王': [{ m: 'wallDash', n: '黄金の洪水', s: 'coin' }, { m: 'windmill', n: '金貨の渦', s: 'coin' }, { m: 'pincer', n: '財宝の挟撃', s: 'coin' }],
  '白夜の氷床竜': [{ m: 'geyser', n: '氷床噴出', s: 'ice' }, { m: 'crossSlash', n: '氷の爪', s: 'ice' }, { m: 'windmill', n: '吹雪の輪舞', s: 'ice' }, { m: 'burstShell', n: '竜の吐息', s: 'ice' }],
  'コズミック・オーバーロード': [{ m: 'laneStrike', n: '星の裁き', s: 'star' }, { m: 'windmill', n: '銀河の渦', s: 'star' }, { m: 'mineField', n: '重力の罠', s: 'star' }, { m: 'homingPack', n: '流星群', s: 'star' }],
  '小惑星ゴーレム': [{ m: 'rainVolley', n: '岩石投下', s: 'boulder' }, { m: 'gapWall', n: '岩盤の波', s: 'boulder' }, { m: 'boomerang', n: '岩拳', s: 'boulder' }],
  '冥界の門番ケルベロス': [{ m: 'wallDash', n: '地獄の咆哮', s: 'skull' }, { m: 'hoverAim', n: '三つ首の狙撃', s: 'skull' }, { m: 'pincer', n: '双頭の牙', s: 'skull' }],
  'パルサー・ビーコン': [{ m: 'laneStrike', n: '電磁パルス', s: 'bolt' }, { m: 'windmill', n: '回転灯', s: 'bolt' }, { m: 'mineField', n: '磁場の罠', s: 'bolt' }],
  'ビッグバン・クロノス': [{ m: 'burstShell', n: '創世の爆発', s: 'star' }, { m: 'laneStrike', n: '時の鉄槌', s: 'bolt' }, { m: 'windmill', n: '時空の渦', s: 'star' }, { m: 'rainVolley', n: '星屑', s: 'meteor' }, { m: 'geyser', n: '原初の噴流', s: 'meteor' }]
};
const DEFAULT_MOVES = [{ m: 'rainVolley', n: '連撃', s: 'star' }, { m: 'wallDash', n: '突進', s: 'star' }, { m: 'mineField', n: '罠', s: 'star' }];

function bossAttackV2(b, px, py) {
  const moves = BOSS_MOVES[b.name] || DEFAULT_MOVES;
  b._mv = b._mv || 0;
  const m = moves[b._mv % moves.length];
  b._mv++;
  const col = (BOSS_THEMES[b.name] || DEFAULT_THEME).orb;
  const cfg = { s: m.s, n: m.n, col: col };
  const dur = MOVES[m.m](b, cfg, bossRank(b), px, py);
  b.shootTimer = Math.max(150, dur || 150);
  b._charge = 32;
  b._chargeCol = col;
  bossCallouts.push({ text: m.n, col: col, t: 0, total: 80 });
}

// 元の丸い玉の攻撃（狙い撃ち・扇状・レーザー+弾・追加攻撃3〜14）は、すべてこの攻撃に置き換える
pickBossPattern = function () { return 100; };
const baseSignatureBossAttack2 = signatureBossAttack;
signatureBossAttack = function (pattern, b, px, py) {
  if (pattern >= 100) { bossAttackV2(b, px, py); return; }
  baseSignatureBossAttack2(pattern, b, px, py);
};

// パーティクル（四角い粒）の出し方:
//   'light' = 通常は元どおり、ボス戦中は数を減らして少しだけ出す / 'boss' = ボス戦中は出さない
//   'all' = ゲーム全体で出さない / 'off' = 常に制限なしで出す
const PARTICLE_MODE = 'light';
const BOSS_PARTICLE_RATE = 0.4;   // ボス戦中の粒の量（1で通常と同じ）
const BOSS_PARTICLE_CAP = 40;     // ボス戦中に同時に出せる粒の上限
function inBossFight() {
  return !!activeBoss && activeBoss.active && activeBoss.hp > 0;
}
function particlesSuppressed() {
  if (PARTICLE_MODE === 'all') return true;
  return PARTICLE_MODE === 'boss' && inBossFight();
}
const baseSpawnParticles = spawnParticles;
spawnParticles = function (x, y, color, count, isScreenSpace) {
  if (particlesSuppressed()) return;
  if (PARTICLE_MODE === 'light' && inBossFight()) {
    if (particles.length > BOSS_PARTICLE_CAP) return;
    count = Math.max(1, Math.ceil(count * BOSS_PARTICLE_RATE));
  } else if (PARTICLE_MODE !== 'off' && particles.length > 160) {
    return;
  }
  baseSpawnParticles(x, y, color, count, isScreenSpace);
};

const baseDrawFn8 = draw;
draw = function () {
  // すでに出ている粒も消す
  if (particles.length && particlesSuppressed()) particles.length = 0;
  baseDrawFn8();
  drawBossFx();
};

// ==========================================
// ストップボタン（ゲーム中、画面下の中央）。押すと、再開 / このゲームを終わる の2つが出る
// Esc キーか P キーでも開閉できる。タブを切り替えたときも自動でストップする
// ==========================================
let paused = false;

const pauseBtn = document.createElement('button');
pauseBtn.id = 'pause-btn';
pauseBtn.textContent = 'ストップ';
pauseBtn.tabIndex = -1;
pauseBtn.addEventListener('focus', () => pauseBtn.blur());
pauseBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); openPause(); });

const pauseScreen = document.createElement('div');
pauseScreen.id = 'pause-screen';
pauseScreen.className = 'overlay hidden';
pauseScreen.innerHTML =
  '<div class="title-badge" style="background:#00D2FF; color:#1E1E24;">PAUSE</div>' +
  '<h2 style="font-size: 30px; font-weight: 900; margin: 0 0 22px 0;">ストップ中</h2>' +
  '<div class="btn-group">' +
  '<button class="btn btn-story" id="pause-resume" style="justify-content:center;">再開</button>' +
  '<button class="btn btn-back" id="pause-quit" style="justify-content:center;">このゲームを終わる</button>' +
  '</div>';
document.getElementById('game-wrapper').appendChild(pauseBtn);
document.getElementById('game-wrapper').appendChild(pauseScreen);

function openPause() {
  if (gameState !== 'playing' || paused) return;
  paused = true;
  pauseScreen.classList.remove('hidden');
  pauseBtn.style.display = 'none';
}
function resumeGame() {
  if (!paused) return;
  paused = false;
  pauseScreen.classList.add('hidden');
}
function quitGame() {
  paused = false;
  pauseScreen.classList.add('hidden');
  totalCoins += stageCoins;          // ここまでに集めたコインは受け取れる
  stageCoins = 0;
  saveCoinAndSkinData();
  gameState = 'gameover';
  activeBoss = null;
  hud.classList.add('hidden');
  bossHud.classList.add('hidden');
  jutsuBtn.style.display = 'none';
  toolBtn.style.display = 'none';
  pauseBtn.style.display = 'none';
  bossCallouts.length = 0;
  jfx.length = 0;
  if (bossGifEl) bossGifEl.style.display = 'none';
  backFromResult();
}
document.getElementById('pause-resume').addEventListener('click', resumeGame);
document.getElementById('pause-quit').addEventListener('click', quitGame);

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const esc = e.code === 'Escape' && tutorialScreen.classList.contains('hidden');
  if (esc || e.code === 'KeyP') {
    if (paused) resumeGame();
    else openPause();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameState === 'playing') openPause();
});

// ストップ中は、ゲームの進行も描画も、操作も止める
const baseUpdateFn5 = update;
update = function () { if (paused) return; baseUpdateFn5(); };
const baseDrawFn9 = draw;
draw = function () { if (paused) return; baseDrawFn9(); };
const basePerformKick = performKick;
performKick = function () { if (paused) return; basePerformKick(); };
const basePerformSpinAttack = performSpinAttack;
performSpinAttack = function () { if (paused) return; basePerformSpinAttack(); };
const baseUseJutsu = useJutsu;
useJutsu = function () { if (paused) return; baseUseJutsu(); };
const baseUseTool = useTool;
useTool = function () { if (paused) return; baseUseTool(); };

setInterval(() => {
  pauseBtn.style.display = (gameState === 'playing' && !paused) ? 'block' : 'none';
}, 100);
"""

CSS = r"""
/* ストップボタン（ゲーム中、画面下の中央） */
#pause-btn {
  position: absolute;
  left: 50%;
  bottom: 6px;
  transform: translateX(-50%);
  z-index: 8;
  display: none;
  font-family: inherit;
  font-size: 11px;
  font-weight: 900;
  padding: 3px 10px;
  background: #FFFFFF;
  color: #1E1E24;
  border: 3px solid #1E1E24;
  border-radius: 3px;
  box-shadow: 3px 3px 0px #1E1E24;
  cursor: pointer;
}

#pause-screen {
  z-index: 22;
}
"""

game = open("game.js", encoding="utf-8").read()
if MARK in game:
    print("split3: すでに適用済みです")
    sys.exit(0)
if "/* SPLIT2 */" not in game:
    sys.exit("split3: 先に split2.py を適用してください")

# 風船の破片も、丸い玉ではなく専用の見た目にする
old = "type: 'bossSpread', x: e.x, y: e.y,"
if game.count(old) == 1:
    game = game.replace(old, "type: 'bossSpread', sprite: 'shrapnel', scol: '#EF4444', sz: 11, x: e.x, y: e.y,")
else:
    print("注意: 風船の破片の見た目を差し替えられませんでした")

open("game.js", "w", encoding="utf-8").write(game + "\n" + JS)
css_text = open("style.css", encoding="utf-8").read()
open("style.css", "w", encoding="utf-8").write(css_text + CSS)
print("split3: ボス攻撃 v2 を追加しました")