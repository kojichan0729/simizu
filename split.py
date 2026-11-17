#!/usr/bin/env python3
# 使い方: python split.py 元のHTMLファイル
# 出力: index.html / style.css / game.js
# 同じフォルダに置く音声: home.mp3 hutuu.mp3 boss.mp3 / jump.mp3 coin.mp3 clash.mp3
import re, sys

src = sys.argv[1]
html = open(src, encoding="utf-8").read()

css = re.search(r"<style>(.*?)</style>", html, re.S)
js = re.search(r"<script>(.*)</script>", html, re.S)
if not css or not js:
    sys.exit("style または script タグが見つかりません")

EXTRA_CSS = """
/* BGM ON/OFF ボタン */
#bgm-toggle {
  position: absolute;
  right: 6px;
  bottom: 6px;
  z-index: 20;
  font-family: inherit;
  font-size: 10px;
  font-weight: 900;
  padding: 3px 7px;
  background: #FFFFFF;
  color: #1E1E24;
  border: 3px solid #1E1E24;
  border-radius: 3px;
  box-shadow: 3px 3px 0px #1E1E24;
  cursor: pointer;
}

#bgm-toggle.off {
  background: #E2E8F0;
  color: #64748B;
}

/* ボスGIFの元画像（キャンバスに描画するための読み込み用。画面には見えない） */
.boss-gif-src {
  position: fixed;
  left: 0;
  top: 0;
  width: 1px;
  height: 1px;
  opacity: 0.01;
  pointer-events: none;
  z-index: -1;
}

/* ボスGIFの表示用（キャンバスの上、HUDやメニューの下に重ねる） */
#boss-gif-overlay {
  position: absolute;
  z-index: 1;
  display: none;
  pointer-events: none;
}

/* ストーリーモード開始時のオープニング動画（ゲーム画面全体） */
#opening-screen {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: none;
  align-items: center;
  justify-content: center;
  background: #000000;
  cursor: pointer;
}

#opening-screen video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

#opening-skip {
  position: absolute;
  left: 8px;
  bottom: 8px;
  font-size: 11px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.75);
  pointer-events: none;
}

/* クリア画面のキャラクターのエモート */
#clear-emote {
  display: none;
  width: 180px;
  height: 100px;
  margin: 0 0 6px 0;
}

/* ショップのタブが3つ並ぶので少しだけ詰める */
.shop-tab {
  font-size: 12px;
  padding: 8px 2px;
}

/* 忍術ボタン（ゲーム中、画面左下。タップでも発動できる） */
#jutsu-btn {
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

#jutsu-btn .jb-gauge {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  opacity: 0.55;
}

#jutsu-btn .jb-label {
  position: relative;
}

/* ショップの忍術カード */
.jutsu-card {
  grid-column: 1 / -1;
  align-items: stretch;
  text-align: left;
  gap: 8px;
}

.jutsu-head {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.jutsu-icon {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  padding: 5px;
  border: 3px solid #1E1E24;
  border-radius: 4px;
  background: radial-gradient(circle, #334155 0%, #0F172A 100%);
}

.jutsu-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}

.jutsu-name {
  font-size: 16px;
  font-weight: 900;
}

.jutsu-sub {
  margin-left: 8px;
  font-size: 11px;
}

.jutsu-desc {
  font-size: 11px;
  font-weight: 800;
  line-height: 1.4;
  color: #CBD5E1;
  margin-top: 2px;
}

.jutsu-stat {
  font-size: 11px;
  font-weight: 900;
  color: #FDE047;
  margin-top: 4px;
}

.jutsu-row {
  display: flex;
  gap: 8px;
}

.jutsu-btn {
  flex: 1;
  font-family: inherit;
  font-size: 12px;
  font-weight: 900;
  padding: 7px 4px;
  border: 3px solid #1E1E24;
  border-radius: 3px;
  cursor: pointer;
  box-shadow: 3px 3px 0px #1E1E24;
}

.jutsu-btn.buy {
  background: #FFD600;
  color: #1E1E24;
}

.jutsu-btn.on {
  background: #00E676;
  color: #1E1E24;
}

.jutsu-btn.dim {
  background: #94A3B8;
  color: #1E293B;
}

/* かんたんチュートリアル */
#tutorial-screen {
  z-index: 25;
  padding: 14px;
}

#tutorial-canvas {
  width: 300px;
  height: 150px;
  border: 3px solid #1E1E24;
  border-radius: 3px;
  box-shadow: 4px 4px 0px #1E1E24;
  margin: 6px 0 10px 0;
  background: #FFFDF0;
}

#tutorial-title {
  font-size: 22px;
  font-weight: 900;
  margin: 0 0 8px 0;
}

#tutorial-text {
  width: 100%;
  max-width: 320px;
  min-height: 112px;
  background: #FFFFFF;
  border: 3px solid #1E1E24;
  border-radius: 3px;
  box-shadow: 4px 4px 0px #1E1E24;
  padding: 8px 12px;
  text-align: left;
}

#tutorial-text p {
  margin: 4px 0;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.5;
}

#tutorial-dots {
  display: flex;
  gap: 6px;
  margin: 12px 0;
}

.tut-dot {
  width: 10px;
  height: 10px;
  border: 2px solid #1E1E24;
  border-radius: 50%;
  background: #FFFFFF;
}

.tut-dot.on {
  background: #FFD600;
}

#tutorial-btns {
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 320px;
}

.tut-btn {
  flex: 1;
  justify-content: center;
  font-size: 14px;
  padding: 10px 6px;
}

#tutorial-open {
  position: absolute;
  right: 6px;
  top: 6px;
  z-index: 12;
  display: none;
  font-family: inherit;
  font-size: 11px;
  font-weight: 900;
  padding: 3px 8px;
  background: #FFFFFF;
  color: #1E1E24;
  border: 3px solid #1E1E24;
  border-radius: 3px;
  box-shadow: 3px 3px 0px #1E1E24;
  cursor: pointer;
}
"""

EXTRA_JS = """
// ==========================================
// BGM（ホーム/選択: home.mp3 / 通常プレイ: hutuu.mp3 / ボス戦: boss.mp3）
// 既存の処理には触れず、状態を監視して切り替える
// ==========================================
const BGM_HOME = new Audio('home.mp3');
const BGM_NORMAL = new Audio('hutuu.mp3');
const BGM_BOSS = new Audio('boss.mp3');
[BGM_HOME, BGM_NORMAL, BGM_BOSS].forEach(a => { a.loop = true; });
BGM_HOME.volume = 0.4;
BGM_NORMAL.volume = 0.4;
BGM_BOSS.volume = 0.45;

let bgmUnlocked = false;
let bgmCurrent = null;
let bgmOn = localStorage.getItem('wallKickBgmOn') !== '0';

function unlockBgm() {
  bgmUnlocked = true;
  window.removeEventListener('pointerdown', unlockBgm);
  window.removeEventListener('keydown', unlockBgm);
}
window.addEventListener('pointerdown', unlockBgm);
window.addEventListener('keydown', unlockBgm);

// ON/OFFボタン
const bgmToggleBtn = document.createElement('button');
bgmToggleBtn.id = 'bgm-toggle';
document.getElementById('game-wrapper').appendChild(bgmToggleBtn);

function refreshBgmButton() {
  bgmToggleBtn.textContent = bgmOn ? 'BGM: ON' : 'BGM: OFF';
  bgmToggleBtn.classList.toggle('off', !bgmOn);
}
bgmToggleBtn.addEventListener('click', () => {
  bgmOn = !bgmOn;
  localStorage.setItem('wallKickBgmOn', bgmOn ? '1' : '0');
  refreshBgmButton();
  if (!bgmOn && bgmCurrent) {
    bgmCurrent.pause();
    bgmCurrent = null;
  }
  bgmToggleBtn.blur();
});
refreshBgmButton();

function pickBgm() {
  if (gameState === 'playing') {
    return (activeBoss && activeBoss.active && activeBoss.hp > 0) ? BGM_BOSS : BGM_NORMAL;
  }
  const inMenu = [screenTitle, screenPractice, screenSkin, screenStory]
    .some(el => !el.classList.contains('hidden'));
  return inMenu ? BGM_HOME : BGM_NORMAL;
}

setInterval(() => {
  if (!bgmUnlocked || !bgmOn) return;
  const next = pickBgm();
  if (bgmCurrent !== next) {
    if (bgmCurrent) bgmCurrent.pause();
    next.currentTime = 0;
    bgmCurrent = next;
  }
  if (bgmCurrent.paused) bgmCurrent.play().catch(() => {});
}, 200);

// ==========================================
// 効果音ファイル（ジャンプ: jump.mp3 / コイン: coin.mp3 / ギィーン: clash.mp3）
// ファイルが読み込めない場合は従来の合成音にフォールバック
// ==========================================
const baseSfxPlay = playSound;
const SFX_MAP = {
  kick: 'jump.mp3',
  doubleKick: 'jump.mp3',
  coin: 'coin.mp3',
  clash: 'clash.mp3',
  spin: 'spin.mp3',
  clear: 'clear.mp3'
};
const SFX_BASE = {};
const SFX_FAILED = {};
Object.values(SFX_MAP).forEach(f => {
  if (SFX_BASE[f]) return;
  const a = new Audio(f);
  a.addEventListener('error', () => { SFX_FAILED[f] = true; });
  SFX_BASE[f] = a;
});

playSound = function (type) {
  const f = SFX_MAP[type];
  // ジャンプ・コイン・回転攻撃はプレイ中のみ、クリア音はステージクリア時のみ
  // （ショップ等で鳴る同名の操作音は従来のまま）
  const sfxActive = type === 'clash' || (type === 'clear' ? gameState === 'clear' : gameState === 'playing');
  if (f && !SFX_FAILED[f] && sfxActive) {
    const a = SFX_BASE[f].cloneNode();
    a.volume = 0.6;
    a.play().catch(() => {});
    return;
  }
  baseSfxPlay(type);
};

// ==========================================
// ボスGIF（boss_gif フォルダに置く。無い場合は従来のボス描画のまま）
// 差し替えたいときは右側のファイル名を書き換えるだけ
// ==========================================
const BOSS_GIFS = {
  '赤べこ将軍': 'boss_gif/akabeko_shogun.gif',
  '大仏ガーディアン': 'boss_gif/daibutsu.gif',
  '黄金シャチホコ王': 'boss_gif/shachihoko.gif',
  '高野山天狗マスター': 'boss_gif/tengu.gif',
  '関門フグ大帝': 'boss_gif/fugu.gif',
  '土佐カツオ将軍': 'boss_gif/katsuo.gif',
  '琉球シーサー神': 'boss_gif/shisa.gif',
  'ヒマラヤ雪男王': 'boss_gif/yeti.gif',
  'カッパドキア魔人': 'boss_gif/cappadocia.gif',
  '氷河ヴァイキング王': 'boss_gif/viking.gif',
  'サバンナ獅子王': 'boss_gif/lion.gif',
  '密林ケツァール神': 'boss_gif/quetzal.gif',
  '天空鏡の守護神': 'boss_gif/uyuni.gif',
  'アース・エンペラー': 'boss_gif/earth_emperor.gif',
  'コズミック・オーバーロード': 'boss_gif/cosmic_overlord.gif',
  'アンコール石像王': 'boss_gif/angkor.gif',
  '黄金エルドラド王': 'boss_gif/eldorado.gif',
  '白夜の氷床竜': 'boss_gif/ice_dragon.gif',
  '小惑星ゴーレム': 'boss_gif/asteroid_golem.gif',
  '冥界の門番ケルベロス': 'boss_gif/cerberus.gif',
  'パルサー・ビーコン': 'boss_gif/pulsar.gif',
  'ビッグバン・クロノス': 'boss_gif/chronos.gif'
};
const BOSS_GIF_IMGS = {};
Object.keys(BOSS_GIFS).forEach(n => {
  const img = document.createElement('img');
  img.className = 'boss-gif-src';
  img.alt = '';
  // 設定したファイル名 → 同じ名前をindex.htmlと同じ場所 → boss_gif/ボス名.gif → ボス名.gif の順に探す
  const cands = [BOSS_GIFS[n], BOSS_GIFS[n].split('/').pop(), 'boss_gif/' + n + '.gif', n + '.gif'];
  let ci = 0;
  img.addEventListener('error', () => {
    ci++;
    if (ci < cands.length) {
      img.src = cands[ci];
    } else {
      img.dataset.failed = '1';
      console.warn('[BOSS GIF] 読み込み失敗: ' + n + ' (' + cands.join(' / ') + ')');
    }
  });
  img.addEventListener('load', () => {
    console.log('[BOSS GIF] 読み込み成功: ' + n + ' (' + img.currentSrc + ')');
  });
  img.src = cands[0];
  document.body.appendChild(img);
  BOSS_GIF_IMGS[n] = img;
});

function getBossGif(name) {
  const img = BOSS_GIF_IMGS[name];
  return (img && !img.dataset.failed && img.complete && img.naturalWidth > 0) ? img : null;
}

// GIFはキャンバスに描くと止まってしまうため、実際のimg要素をボス位置に重ねて動かす
let bossGifDraw = null;
let bossGifEl = null;
let bossGifName = '';

function syncBossGif() {
  if (!bossGifEl) {
    bossGifEl = document.createElement('img');
    bossGifEl.id = 'boss-gif-overlay';
    bossGifEl.alt = '';
    document.getElementById('game-wrapper').appendChild(bossGifEl);
  }
  const d = bossGifDraw;
  bossGifDraw = null;
  if (!d || gameState === 'title') {
    bossGifEl.style.display = 'none';
    return;
  }
  if (bossGifName !== d.name) {
    bossGifEl.src = d.src;
    bossGifName = d.name;
  }
  const k = canvas.clientWidth / canvas.width;
  bossGifEl.style.display = 'block';
  bossGifEl.style.left = (d.x * k) + 'px';
  bossGifEl.style.top = (d.y * k) + 'px';
  bossGifEl.style.width = (d.w * k) + 'px';
  bossGifEl.style.height = (d.h * k) + 'px';
  bossGifEl.style.opacity = d.flash ? '0.4' : '1';
}

const baseDrawFn = draw;
draw = function () {
  baseDrawFn();
  syncBossGif();
};

// ==========================================
// ボスごとの攻撃パターン
// 番号: 0=狙い撃ち(元) 1=扇状(元) 2=レーザー+弾(元)
//       3=全方位リング 4=落下カーテン 5=二連狙い撃ち 6=二本レーザー 7=高速弾 8=三本レーザー
// 左から順に繰り返す。ここの数字を並べ替えるだけで調整できる
// ==========================================
// 追加: 9=連射 10=追尾弾 11=ジグザグ弾 12=予告爆弾 13=壁沿いレーザー
const BOSS_PATTERNS = {
  '赤べこ将軍': [0, 5, 9, 1],
  '大仏ガーディアン': [12, 3, 6, 12],
  '黄金シャチホコ王': [11, 4, 5, 11],
  '高野山天狗マスター': [10, 7, 5, 10],
  '関門フグ大帝': [3, 12, 0, 3],
  '土佐カツオ将軍': [9, 7, 13, 9],
  '琉球シーサー神': [13, 1, 6, 3],
  'ヒマラヤ雪男王': [4, 12, 3, 8],
  'カッパドキア魔人': [8, 10, 2, 12],
  '氷河ヴァイキング王': [11, 4, 9, 13],
  'サバンナ獅子王': [7, 9, 7, 13],
  '密林ケツァール神': [10, 5, 8, 11],
  '天空鏡の守護神': [6, 10, 8, 12],
  'アース・エンペラー': [13, 12, 4, 2, 8],
  'コズミック・オーバーロード': [8, 12, 10, 9, 11, 6]
};

function pickBossPattern(b) {
  const seq = BOSS_PATTERNS[b.name] || [0, 1, 2];
  return seq[b.attackPatternIndex % seq.length];
}

function extraBossAttack(pattern, b, px, py) {
  if (pattern >= 9) { signatureBossAttack(pattern, b, px, py); return; }
  const ox = b.x;
  const oy = b.y + 30;
  const base = Math.atan2(py - oy, px - ox);
  const orb = (ang, spd) => projectiles.push({
    type: 'bossOrb', x: ox, y: oy,
    vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
    radius: 14, reflected: false, life: 320
  });
  const shot = (x, ang, spd) => projectiles.push({
    type: 'bossSpread', x: x, y: oy,
    vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
    radius: 9, reflected: false, life: 300
  });
  const laser = (x, timer) => bossLasers.push({
    x: Math.max(LEFT_WALL_X + 24, Math.min(RIGHT_WALL_X - 24, x)),
    startY: b.y + 34, timer: timer, fired: false
  });

  if (pattern === 3) {
    // 全方位リング（隙間は十分に広い）
    for (let k = 0; k < 8; k++) shot(ox, k * Math.PI / 4 + 0.2, 3.2);
    playSound('arrow');
    b.shootTimer = 100;
  } else if (pattern === 4) {
    // 落下カーテン（隣り合う2か所だけ抜けている）
    const gap = Math.floor(Math.random() * 5);
    for (let i = 0; i < 6; i++) {
      if (i === gap || i === gap + 1) continue;
      shot(LEFT_WALL_X + 30 + i * 50, Math.PI / 2, 3.6);
    }
    playSound('snowball');
    b.shootTimer = 110;
  } else if (pattern === 5) {
    // 二連狙い撃ち（どちらも弾き返せる）
    orb(base - 0.22, 4.2);
    orb(base + 0.22, 4.2);
    playSound('snowball');
    b.shootTimer = 95;
  } else if (pattern === 6) {
    // 二本レーザー（プレイヤーの左右、真ん中は安全）
    laser(px - 80, 62);
    laser(px + 80, 62);
    playSound('laserWarn');
    b.shootTimer = 115;
  } else if (pattern === 7) {
    // 高速弾
    orb(base, 5.6);
    playSound('arrow');
    b.shootTimer = 80;
  } else {
    // 三本レーザー（5か所のうち3か所、隙間は必ず残る）
    const slots = [0, 1, 2, 3, 4];
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    slots.slice(0, 3).forEach(s => laser(LEFT_WALL_X + 40 + s * 66, 68));
    playSound('laserWarn');
    b.shootTimer = 120;
  }
}

// ==========================================
// ボスごとの色（弾・レーザー・ボス本体）
// ==========================================
function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return 'rgba(' + (n >> 16) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ', ' + a + ')';
}
function mkTheme(body, orb, spread, beam) {
  return { body: body, orb: orb, spread: spread, beam: beam, guide: hexToRgba(beam, 0.75), glow: hexToRgba(beam, 0.35) };
}
const DEFAULT_THEME = {
  body: '#FF3B6B', orb: '#FF3B6B', spread: '#A855F7', beam: '#FF2A55',
  guide: 'rgba(255, 42, 85, 0.75)', glow: 'rgba(255, 59, 107, 0.35)'
};
const BOSS_THEMES = {
  '赤べこ将軍': mkTheme('#D9302C', '#FF3B6B', '#FDA4AF', '#E11D48'),
  '大仏ガーディアン': mkTheme('#B45309', '#FACC15', '#FDE68A', '#F59E0B'),
  '黄金シャチホコ王': mkTheme('#EAB308', '#FDE047', '#FB923C', '#EAB308'),
  '高野山天狗マスター': mkTheme('#DC2626', '#16A34A', '#86EFAC', '#15803D'),
  '関門フグ大帝': mkTheme('#0EA5E9', '#38BDF8', '#A5F3FC', '#0284C7'),
  '土佐カツオ将軍': mkTheme('#1D4ED8', '#60A5FA', '#BFDBFE', '#2563EB'),
  '琉球シーサー神': mkTheme('#EA580C', '#FBBF24', '#FCA5A5', '#EA580C'),
  'ヒマラヤ雪男王': mkTheme('#CBD5E1', '#BAE6FD', '#FFFFFF', '#7DD3FC'),
  'カッパドキア魔人': mkTheme('#A16207', '#D97706', '#FCD34D', '#B45309'),
  '氷河ヴァイキング王': mkTheme('#0891B2', '#67E8F9', '#E0F2FE', '#06B6D4'),
  'サバンナ獅子王': mkTheme('#CA8A04', '#F59E0B', '#FDE68A', '#D97706'),
  '密林ケツァール神': mkTheme('#059669', '#34D399', '#A7F3D0', '#10B981'),
  '天空鏡の守護神': mkTheme('#6366F1', '#A5B4FC', '#E0E7FF', '#818CF8'),
  'アース・エンペラー': mkTheme('#0D9488', '#2DD4BF', '#99F6E4', '#14B8A6'),
  'コズミック・オーバーロード': mkTheme('#7C3AED', '#C084FC', '#F0ABFC', '#A855F7')
};
function bossTheme() {
  return (activeBoss && BOSS_THEMES[activeBoss.name]) || DEFAULT_THEME;
}

// ==========================================
// 追加攻撃 9〜13（時間差・追尾・予告爆弾・壁沿いレーザー）
// ==========================================
const bossQueue = [];
const bossBombs = [];

function signatureBossAttack(pattern, b, px, py) {
  const shotAt = (ang, spd, extra) => {
    const p = {
      type: 'bossSpread', x: b.x, y: b.y + 30,
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      radius: 9, reflected: false, life: 300
    };
    if (extra) Object.assign(p, extra);
    projectiles.push(p);
  };
  const aimNow = () => {
    const cx = player.x + player.size / 2;
    const cy = player.y + player.size / 2;
    return Math.atan2(cy - (b.y + 30), cx - b.x);
  };

  if (pattern === 9) {
    // 連射: その瞬間のプレイヤー位置を狙って5連続で撃つ
    for (let k = 0; k < 5; k++) {
      bossQueue.push({ boss: b, t: k * 9 + 1, fn: () => { shotAt(aimNow(), 3.8); playSound('arrow'); } });
    }
    b.shootTimer = 110;
  } else if (pattern === 10) {
    // 追尾弾: ゆっくり曲がってプレイヤーを追う（約2秒で追尾が切れる）
    shotAt(aimNow(), 3.0, { homing: 110, radius: 11 });
    bossQueue.push({ boss: b, t: 30, fn: () => shotAt(aimNow(), 3.0, { homing: 110, radius: 11 }) });
    playSound('snowball');
    b.shootTimer = 105;
  } else if (pattern === 11) {
    // ジグザグ弾: 左右の壁で跳ね返りながら降りてくる
    shotAt(Math.PI / 2 - 0.9, 4.0);
    shotAt(Math.PI / 2 + 0.9, 4.0);
    playSound('arrow');
    b.shootTimer = 100;
  } else if (pattern === 12) {
    // 予告爆弾: 赤い円が出て、少ししたら破裂して弾が散る
    bossBombs.push({ boss: b, x: px, y: py, t: 70, t0: 70 });
    bossBombs.push({
      boss: b,
      x: Math.max(LEFT_WALL_X + 40, Math.min(RIGHT_WALL_X - 40, LEFT_WALL_X + RIGHT_WALL_X - px)),
      y: py - 60, t: 85, t0: 85
    });
    playSound('laserWarn');
    b.shootTimer = 125;
  } else {
    // 壁沿いレーザー: プレイヤーに近い壁を予告つきで焼く（壁から離れれば避けられる）
    const x = px < canvas.width / 2 ? LEFT_WALL_X + 22 : RIGHT_WALL_X - 22;
    bossLasers.push({ x: x, startY: b.y + 34, timer: 64, fired: false });
    playSound('laserWarn');
    b.shootTimer = 95;
  }
}

function tickBossExtras() {
  if (gameState !== 'playing' || !activeBoss || activeBoss.hp <= 0) {
    bossQueue.length = 0;
    bossBombs.length = 0;
    return;
  }
  const pcx = player.x + player.size / 2;
  const pcy = player.y + player.size / 2;

  for (let i = bossQueue.length - 1; i >= 0; i--) {
    const q = bossQueue[i];
    if (q.boss !== activeBoss) { bossQueue.splice(i, 1); continue; }
    q.t--;
    if (q.t <= 0) { bossQueue.splice(i, 1); q.fn(); }
  }

  for (const p of projectiles) {
    if (p.homing > 0) {
      p.homing--;
      const cur = Math.atan2(p.vy, p.vx);
      let d = Math.atan2(pcy - p.y, pcx - p.x) - cur;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const na = cur + Math.max(-0.035, Math.min(0.035, d));
      const sp = Math.hypot(p.vx, p.vy);
      p.vx = Math.cos(na) * sp;
      p.vy = Math.sin(na) * sp;
    }
  }

  for (let i = bossBombs.length - 1; i >= 0; i--) {
    const bm = bossBombs[i];
    if (bm.boss !== activeBoss) { bossBombs.splice(i, 1); continue; }
    bm.t--;
    if (bm.t <= 0) {
      for (let k = 0; k < 6; k++) {
        const ang = k * Math.PI / 3 + 0.3;
        projectiles.push({
          type: 'bossSpread', x: bm.x, y: bm.y,
          vx: Math.cos(ang) * 3.4, vy: Math.sin(ang) * 3.4,
          radius: 9, reflected: false, life: 200
        });
      }
      shakeTime = 8;
      playSound('laserFire');
      spawnParticles(bm.x, bm.y, bossTheme().beam, 16, false);
      bossBombs.splice(i, 1);
    }
  }
}

function drawBossBombs() {
  if (gameState !== 'playing') return;
  const th = bossTheme();
  for (const bm of bossBombs) {
    const sy = bm.y - cameraY;
    if (sy < -80 || sy > canvas.height + 80) continue;
    const prog = 1 - bm.t / bm.t0;
    ctx.save();
    ctx.translate(bm.x, sy);
    ctx.globalAlpha = 0.25 + 0.25 * Math.abs(Math.sin(bm.t * 0.35));
    ctx.fillStyle = th.beam;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#1E1E24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = th.orb;
    ctx.beginPath();
    ctx.arc(0, 0, 8 + prog * 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

const baseUpdateFn = update;
update = function () {
  baseUpdateFn();
  tickBossExtras();
};
const baseDrawFn2 = draw;
draw = function () {
  baseDrawFn2();
  drawBossBombs();
};

// ==========================================
// ストーリー拡張: 世界篇 +10（計60）/ 宇宙編 +18（計24）
// 既存ステージの後ろに追加するので、既存のセーブデータはそのまま使える
// ==========================================
STORY_DATA.world.push(
  { name: 'ロシア', region: 'ヨーロッパ', goal: 205, boss: null, trivia: '国土面積が世界最大で、国内に11ものタイムゾーンがあります。' },
  { name: 'チェコ', region: 'ヨーロッパ', goal: 205, boss: null, trivia: '首都プラハは「百塔の街」と呼ばれ、中世の街並みがそのまま残っています。' },
  { name: 'ハンガリー', region: 'ヨーロッパ', goal: 210, boss: null, trivia: '首都ブダペストはドナウ川をはさむ「ブダ」と「ペスト」が合併してできた街で、温泉でも有名です。' },
  { name: 'カンボジア', region: 'アジア', goal: 215, boss: 'アンコール石像王', trivia: '世界遺産アンコール・ワットは、世界最大級の宗教建築として知られています。' },
  { name: 'スリランカ', region: 'アジア', goal: 215, boss: null, trivia: '紅茶（セイロンティー）の産地で、岩山の上の宮殿跡シギリヤロックが有名です。' },
  { name: 'キューバ', region: '北アメリカ', goal: 220, boss: null, trivia: 'カリブ海の島国で、色とりどりのクラシックカーが走る街並みと葉巻で知られています。' },
  { name: 'コロンビア', region: '南アメリカ', goal: 225, boss: '黄金エルドラド王', trivia: 'コーヒーの名産地で、黄金伝説「エルドラド」の舞台ともいわれています。' },
  { name: 'エチオピア', region: 'アフリカ', goal: 225, boss: null, trivia: 'コーヒー発祥の地といわれ、1年を13か月とする独自の暦を使っています。' },
  { name: 'フィジー', region: 'オセアニア', goal: 230, boss: null, trivia: '330ほどの島々からなる南太平洋の国で、青い海とラグビーが人気です。' },
  { name: 'グリーンランド', region: '北極圏', goal: 240, boss: '白夜の氷床竜', trivia: '世界最大の島で、国土の約8割が分厚い氷に覆われています。' }
);

STORY_DATA.space.push(
  { name: '水星', region: '太陽系・内惑星', goal: 250, boss: null, trivia: '太陽に最も近い惑星で、昼は約430度、夜は約マイナス180度にもなります。' },
  { name: '金星', region: '太陽系・内惑星', goal: 255, boss: null, trivia: '表面温度は約460度で太陽系で最も高温。自転の向きが他の惑星と逆です。' },
  { name: '国際宇宙ステーション', region: '地球周回軌道', goal: 260, boss: null, trivia: '地球を約90分で1周していて、1日に約16回も日の出を見られます。' },
  { name: '小惑星帯', region: '太陽系・火星と木星の間', goal: 265, boss: '小惑星ゴーレム', trivia: '火星と木星の間に無数の岩が漂う帯。全部を合わせても月よりずっと軽いといわれます。' },
  { name: '木星の衛星イオ', region: '太陽系・木星', goal: 270, boss: null, trivia: '太陽系で最も火山活動が活発な天体として知られています。' },
  { name: '木星の衛星エウロパ', region: '太陽系・木星', goal: 275, boss: null, trivia: '厚い氷の下に、広大な海があると考えられています。' },
  { name: '土星の衛星タイタン', region: '太陽系・土星', goal: 280, boss: null, trivia: '厚い大気を持ち、メタンの湖や川が確認されている不思議な衛星です。' },
  { name: '天王星', region: '太陽系・氷の巨人', goal: 285, boss: null, trivia: '自転軸がほぼ横倒しで、横に転がるように太陽の周りを回っています。' },
  { name: '冥王星', region: '太陽系・外縁', goal: 290, boss: '冥界の門番ケルベロス', trivia: '2006年に準惑星へ分類された天体で、表面にはハート形の明るい地形があります。' },
  { name: '彗星の尾', region: '太陽系・外縁', goal: 295, boss: null, trivia: '太陽に近づくと氷が蒸発して、ガスと塵が数百万kmもの尾になります。' },
  { name: 'カイパーベルト', region: '太陽系・外縁', goal: 300, boss: null, trivia: '海王星の外側に広がる氷の天体のドーナツ状領域で、冥王星もここにいます。' },
  { name: '太陽フレア', region: '恒星・太陽', goal: 305, boss: null, trivia: '太陽表面で起きる大爆発。放出された粒子は地球でオーロラや通信障害の原因になります。' },
  { name: 'オリオン星雲', region: '銀河系', goal: 310, boss: null, trivia: '地球から約1,300光年先にある、新しい星が次々と生まれている場所です。' },
  { name: 'パルサー', region: '銀河系', goal: 315, boss: 'パルサー・ビーコン', trivia: '高速で自転する中性子星で、灯台のように規則正しく電波のパルスを出します。' },
  { name: 'クェーサー', region: '深宇宙', goal: 320, boss: null, trivia: '巨大ブラックホールが物質を飲み込むときに放つ光で、銀河全体より明るく輝くこともあります。' },
  { name: 'アンドロメダ銀河', region: '深宇宙', goal: 325, boss: null, trivia: '約250万光年先の銀河で、約40億年後に天の川銀河と衝突すると予測されています。' },
  { name: '暗黒物質の海', region: '深宇宙', goal: 330, boss: null, trivia: '宇宙の質量の約27%を占めるといわれる、目に見えない未知の物質です。' },
  { name: '宇宙の始まり', region: '宇宙の果て・最終決戦', goal: 340, boss: 'ビッグバン・クロノス', trivia: '宇宙は約138億年前のビッグバンで始まりました。ここを突破した君は宇宙最強の壁けりマスターです！' }
);

Object.assign(BOSS_PATTERNS, {
  'アンコール石像王': [12, 13, 3, 12],
  '黄金エルドラド王': [9, 5, 11, 7],
  '白夜の氷床竜': [4, 12, 8, 10, 3],
  '小惑星ゴーレム': [11, 3, 12, 6],
  '冥界の門番ケルベロス': [9, 10, 9, 13],
  'パルサー・ビーコン': [8, 7, 6, 12],
  'ビッグバン・クロノス': [8, 12, 10, 9, 11, 13, 6, 3]
});
Object.assign(BOSS_THEMES, {
  'アンコール石像王': mkTheme('#78716C', '#FBBF24', '#D6D3D1', '#A16207'),
  '黄金エルドラド王': mkTheme('#EAB308', '#FDE047', '#34D399', '#CA8A04'),
  '白夜の氷床竜': mkTheme('#0EA5E9', '#A5F3FC', '#FFFFFF', '#38BDF8'),
  '小惑星ゴーレム': mkTheme('#57534E', '#FB923C', '#A8A29E', '#EA580C'),
  '冥界の門番ケルベロス': mkTheme('#7F1D1D', '#F87171', '#FDBA74', '#B91C1C'),
  'パルサー・ビーコン': mkTheme('#1E40AF', '#67E8F9', '#BFDBFE', '#06B6D4'),
  'ビッグバン・クロノス': mkTheme('#BE185D', '#FDE047', '#F9A8D4', '#DB2777')
});

// ==========================================
// キャラ（忍者スキン）の追加 +5
// ==========================================
SKINS.push(
  { id: 'panda', name: 'パンダ拳士', price: 40, bodyColor: '#F8FAFC', usedColor: '#CBD5E1', bandColor: '#1E1E24', eyeColor: '#1E1E24', trailColor: '#94A3B8', crown: false },
  { id: 'ember', name: '炎獄の忍', price: 100, bodyColor: '#F97316', usedColor: '#C2410C', bandColor: '#FACC15', eyeColor: '#1E1E24', trailColor: '#FB923C', crown: false },
  { id: 'iceNinja', name: '氷結の雪忍', price: 150, bodyColor: '#BAE6FD', usedColor: '#7DD3FC', bandColor: '#1D4ED8', eyeColor: '#0C4A6E', trailColor: '#E0F2FE', crown: false },
  { id: 'thunder', name: '雷光の忍', price: 220, bodyColor: '#FDE047', usedColor: '#CA8A04', bandColor: '#4F46E5', eyeColor: '#1E1E24', trailColor: '#818CF8', crown: false },
  { id: 'phantom', name: '幻影の覇王', price: 350, bodyColor: '#4C1D95', usedColor: '#2E1065', bandColor: '#F0ABFC', eyeColor: '#F0ABFC', trailColor: '#C084FC', crown: true }
);
SKINS.sort((a, b) => a.price - b.price);

// ==========================================
// 剣の追加 +4（SVGイラスト付き）
// ==========================================
function registerSword(def, svg) {
  SWORDS.push(def);
  SWORD_SVGS[def.id] = svg;
  const img = new Image();
  img.addEventListener('load', () => { if (gameState === 'title') drawHomeCharacterPreview(); });
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  SWORD_IMAGES[def.id] = img;
}

registerSword(
  { id: 'frostBlade', name: '氷刃・白夜', price: 45, batKillRate: 0.42, bladeColor: '#BAE6FD', edgeColor: '#FFFFFF', hiltColor: '#1D4ED8', glowColor: '#7DD3FC' },
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="frGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7DD3FC"/><stop offset="55%" stop-color="#E0F2FE"/><stop offset="100%" stop-color="#FFFFFF"/></linearGradient></defs><g transform="rotate(-45 32 32)"><rect x="29" y="46" width="6" height="14" rx="1.5" fill="#1D4ED8" stroke="#1E1E24" stroke-width="2"/><path d="M22 44 L27 41 L32 45 L37 41 L42 44 L37 47 L27 47 Z" fill="#BAE6FD" stroke="#1E1E24" stroke-width="2"/><path d="M28 41 L28.8 14 L32 4 L35.2 14 L36 41 Z" fill="url(#frGrad)" stroke="#1E1E24" stroke-width="2"/><path d="M32 38 L32 9" stroke="#FFFFFF" stroke-width="1.6"/><polygon points="22,22 24,26 22,30 20,26" fill="#BAE6FD" stroke="#1E1E24" stroke-width="1"/><polygon points="42,15 44,19 42,23 40,19" fill="#E0F2FE" stroke="#1E1E24" stroke-width="1"/></g></svg>`
);
registerSword(
  { id: 'flameBlade', name: '烈火の太刀', price: 110, batKillRate: 0.72, bladeColor: '#F97316', edgeColor: '#FDE047', hiltColor: '#7F1D1D', glowColor: '#FB923C' },
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="flGrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#7F1D1D"/><stop offset="50%" stop-color="#F97316"/><stop offset="100%" stop-color="#FDE047"/></linearGradient></defs><g transform="rotate(-45 32 32)"><rect x="29" y="46" width="6" height="14" rx="1.5" fill="#7F1D1D" stroke="#1E1E24" stroke-width="2"/><path d="M21 45 Q25 38 28 42 Q32 34 36 42 Q39 38 43 45 L37 47 L27 47 Z" fill="#FACC15" stroke="#1E1E24" stroke-width="2"/><path d="M29 43 Q26 34 30 27 Q27 18 31 10 Q31 6 32 3 Q35 12 35 20 Q38 28 35 43 Z" fill="url(#flGrad)" stroke="#1E1E24" stroke-width="2"/><path d="M32 40 Q31 28 32 12" stroke="#FFF7ED" stroke-width="1.6" fill="none"/></g></svg>`
);
registerSword(
  { id: 'thunderBlade', name: '雷神の槍剣', price: 160, batKillRate: 0.84, bladeColor: '#FDE047', edgeColor: '#FFFFFF', hiltColor: '#4F46E5', glowColor: '#FACC15' },
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="thGrad" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#CA8A04"/><stop offset="60%" stop-color="#FDE047"/><stop offset="100%" stop-color="#FFFFFF"/></linearGradient></defs><g transform="rotate(-45 32 32)"><rect x="29" y="46" width="6" height="14" rx="1.5" fill="#312E81" stroke="#1E1E24" stroke-width="2"/><path d="M20 44 L28 41 L32 46 L36 41 L44 44 L38 48 L26 48 Z" fill="#6366F1" stroke="#1E1E24" stroke-width="2"/><path d="M29 43 L31 32 L28 28 L33 20 L30 15 L33 3 L36 16 L34 22 L38 28 L35 33 L35 43 Z" fill="url(#thGrad)" stroke="#1E1E24" stroke-width="2"/><circle cx="32" cy="45" r="2.6" fill="#FDE047" stroke="#1E1E24" stroke-width="1.4"/></g></svg>`
);
registerSword(
  { id: 'voidBlade', name: '虚空の黒刃', price: 300, batKillRate: 0.95, bladeColor: '#1E1B4B', edgeColor: '#C084FC', hiltColor: '#4C1D95', glowColor: '#C084FC' },
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="vdGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#0F172A"/><stop offset="60%" stop-color="#312E81"/><stop offset="100%" stop-color="#7C3AED"/></linearGradient></defs><g transform="rotate(-45 32 32)"><circle cx="32" cy="59.5" r="3.4" fill="#C084FC" stroke="#1E1E24" stroke-width="2"/><rect x="29" y="46" width="6" height="11" fill="#1E1B4B" stroke="#1E1E24" stroke-width="2"/><path d="M13 39 L24 46.5 L40 46.5 L51 39 L42 42 L36 44 L28 44 L22 42 Z" fill="#4C1D95" stroke="#1E1E24" stroke-width="2"/><path d="M27.5 43 L28.5 12 L32 2.5 L35.5 12 L36.5 43 Z" fill="url(#vdGrad)" stroke="#1E1E24" stroke-width="2"/><path d="M32 40 L32 8" stroke="#E9D5FF" stroke-width="1.8"/><circle cx="32" cy="44.5" r="3" fill="#F0ABFC" stroke="#1E1E24" stroke-width="1.4"/></g></svg>`
);
SWORDS.sort((a, b) => a.price - b.price);

// ==========================================
// グラフィック強化: 地域ごとの環境パーティクル / コインの光 / 周辺減光 / ステージ開始バナー
// 既存の描画の後に重ねるだけで、既存の描画は変えていない
// ==========================================
const AMB_SNOW = ['北海道', '青森県', '岩手県', '秋田県', '山形県', '新潟県', 'ネパール', 'アイスランド', '南極大陸', 'ロシア', 'グリーンランド', 'フィンランド', 'ノルウェー', 'スウェーデン', 'カナダ', 'スイス'];
const AMB_SAND = ['エジプト', 'サウジアラビア', 'モロッコ', 'アラブ首長国連邦', 'トルコ', 'オーストラリア', 'モンゴル', 'ボリビア'];
const AMB_EMBER = ['鹿児島県', '熊本県', '大分県', 'インドネシア', '火星オリンポス山', '金星', '木星の衛星イオ', '太陽フレア'];
const AMB_LEAF = ['ブラジル', 'コスタリカ', 'タイ', 'ベトナム', 'フィリピン', 'マレーシア', 'ケニア', 'タンザニア', 'マダガスカル', 'カンボジア', 'スリランカ', 'コロンビア', 'キューバ', 'フィジー', 'インド'];

let ambientKind = null;
let ambientList = [];
let stageIntro = null;

function ambientFor(c) {
  return null; // 背景の舞う演出は無効
  if (!c.isStory) return null;
  const n = c.name;
  if (AMB_EMBER.includes(n)) return 'ember';
  if (c.storyArc === 'space') return 'star';
  if (AMB_SNOW.includes(n)) return 'snow';
  if (AMB_SAND.includes(n)) return 'sand';
  if (AMB_LEAF.includes(n)) return 'leaf';
  return null;
}

function initAmbient() {
  ambientList = [];
  if (!ambientKind) return;
  for (let i = 0; i < 44; i++) {
    ambientList.push({
      x: LEFT_WALL_X + Math.random() * (RIGHT_WALL_X - LEFT_WALL_X),
      y: Math.random() * canvas.height,
      sp: 0.5 + Math.random() * 1.3,
      sz: 1.5 + Math.random() * 3,
      ph: Math.random() * 6.28
    });
  }
}

function drawAmbient() {
  if (!ambientKind) return;
  const T = Date.now() * 0.001;
  const H = canvas.height;
  ctx.save();
  ctx.beginPath();
  ctx.rect(LEFT_WALL_X, 0, RIGHT_WALL_X - LEFT_WALL_X, H);
  ctx.clip();
  for (const p of ambientList) {
    if (ambientKind === 'snow') {
      p.y += p.sp; p.x += Math.sin(T * 1.2 + p.ph) * 0.6 + 0.2;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * 0.8, 0, 6.28); ctx.fill();
    } else if (ambientKind === 'sand') {
      p.x += 2.2 + p.sp; p.y += Math.sin(T + p.ph) * 0.3;
      ctx.strokeStyle = 'rgba(217,168,86,0.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 12 - p.sz * 2, p.y); ctx.stroke();
    } else if (ambientKind === 'petal') {
      p.y += p.sp * 0.7; p.x += Math.sin(T * 1.5 + p.ph) * 0.8;
      ctx.fillStyle = 'rgba(255,133,161,0.8)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.sz * 1.6, p.sz, T + p.ph, 0, 6.28); ctx.fill();
    } else if (ambientKind === 'leaf') {
      p.y += p.sp * 0.8; p.x += Math.sin(T * 1.1 + p.ph) * 0.9;
      ctx.fillStyle = 'rgba(52,168,83,0.75)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.sz * 1.7, p.sz * 0.9, T * 1.5 + p.ph, 0, 6.28); ctx.fill();
    } else if (ambientKind === 'ember') {
      p.y -= p.sp * 1.1; p.x += Math.sin(T * 2 + p.ph) * 0.5;
      ctx.fillStyle = 'rgba(255,140,40,0.85)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * 0.7, 0, 6.28); ctx.fill();
    } else {
      p.y += p.sp * 0.25;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.5 * Math.abs(Math.sin(T * 2 + p.ph))) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * 0.5, 0, 6.28); ctx.fill();
    }
    if (p.y > H + 12) { p.y = -12; p.x = LEFT_WALL_X + Math.random() * (RIGHT_WALL_X - LEFT_WALL_X); }
    if (p.y < -12) { p.y = H + 12; p.x = LEFT_WALL_X + Math.random() * (RIGHT_WALL_X - LEFT_WALL_X); }
    if (p.x > RIGHT_WALL_X + 14) p.x = LEFT_WALL_X - 10;
  }
  ctx.restore();
}

function drawAtmosphere() {
  drawAmbient();

  // 周辺減光
  const v = ctx.createRadialGradient(210, 360, 230, 210, 360, 520);
  v.addColorStop(0, 'rgba(10,10,30,0)');
  v.addColorStop(1, 'rgba(10,10,30,0.26)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ステージ開始バナー
  if (stageIntro && stageIntro.t > 0) {
    const el = stageIntro.total - stageIntro.t;
    const a = Math.min(1, stageIntro.t / 30) * Math.min(1, el / 10);
    const tx = stageIntro.boss ? 150 : canvas.width / 2;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = 'rgba(30,30,36,0.8)';
    ctx.fillRect(0, 150, canvas.width, 92);
    ctx.textAlign = 'center';
    ctx.font = '900 30px "M PLUS Rounded 1c", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(stageIntro.title, tx, 196);
    ctx.font = '900 14px "M PLUS Rounded 1c", sans-serif';
    ctx.fillStyle = '#FFD600';
    ctx.fillText(stageIntro.sub, tx, 224);
    if (stageIntro.boss) drawIntroSilhouette(stageIntro.boss, el);
    ctx.restore();
    stageIntro.t--;
  }
}

const baseStartGame = startGame;
startGame = function (...args) {
  baseStartGame(...args);
  const c = STAGES[currentDifficulty];
  ambientKind = ambientFor(c);
  initAmbient();
  newEnemies.length = 0;
  stageIntro = {
    t: (c.isStory && c.storyInfo.boss) ? 150 : 110,
    total: (c.isStory && c.storyInfo.boss) ? 150 : 110,
    boss: (c.isStory && c.storyInfo.boss) || null,
    title: c.isStory ? (c.storyIndex + 1) + '. ' + c.name : c.name,
    sub: c.isStory
      ? c.storyInfo.region + (c.storyInfo.boss ? '  BOSS: ' + c.storyInfo.boss : '')
      : (c.isRecord ? 'ENDLESS' : 'PRACTICE')
  };
};

const baseDrawFn3 = draw;
draw = function () {
  baseDrawFn3();
  if (gameState === 'playing') drawAtmosphere();
};

// ==========================================
// 物価: ショップの価格を2.5倍（所持済みのスキン・剣はそのまま）
// ==========================================
const PRICE_MULT = 2.5;
SKINS.forEach(s => { s.price = Math.round(s.price * PRICE_MULT / 5) * 5; });
SWORDS.forEach(s => { s.price = Math.round(s.price * PRICE_MULT / 5) * 5; });

// ==========================================
// ボス戦開始バナー: ボスのシルエットが右から「シュバッ」と登場
// ==========================================
function drawIntroSilhouette(name, el) {
  const startX = canvas.width + 110;
  const p = Math.min(1, el / 14);
  const e = 1 - Math.pow(1 - p, 3);
  const x = startX + (336 - startX) * e;
  const y = 196 + (el >= 14 ? Math.sin(el * 0.25) * 1.5 : 0);
  if (el === 14) shakeTime = 8;

  // スピード線
  if (el < 24) {
    ctx.strokeStyle = 'rgba(255,255,255,' + ((1 - el / 24) * 0.8) + ')';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const ly = 164 + i * 14;
      ctx.beginPath();
      ctx.moveTo(x + 30, ly);
      ctx.lineTo(x + 50 + 90 * (1 - el / 24), ly);
      ctx.stroke();
    }
  }

  ctx.save();
  ctx.translate(x, y);
  const g = getBossGif(name);
  if (g && 'filter' in ctx) {
    const h = 104;
    const w = h * g.naturalWidth / g.naturalHeight;
    ctx.filter = 'brightness(0)';
    ctx.drawImage(g, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = '#000000';
    drawRoundRect(-36, -32, 72, 64, 9);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-28, -32); ctx.lineTo(-40, -52); ctx.lineTo(-12, -32);
    ctx.moveTo(28, -32); ctx.lineTo(40, -52); ctx.lineTo(12, -32);
    ctx.fill();
    drawRoundRect(-50, -12, 14, 26, 3); ctx.fill();
    drawRoundRect(36, -12, 14, 26, 3); ctx.fill();
    if (el >= 14) {
      ctx.fillStyle = '#FF3B6B';
      ctx.fillRect(-20, -10, 12, 7);
      ctx.fillRect(8, -10, 12, 7);
    }
  }
  ctx.restore();

  // 到着の瞬間の閃光
  if (el >= 13 && el < 19) {
    ctx.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - (el - 13) / 6)) + ')';
    ctx.fillRect(0, 150, canvas.width, 92);
  }
}

// ==========================================
// ボス戦の難易度調整（全ボス共通）
// 攻撃の間隔を長く、弾を遅く、レーザーの予告を長く、ボスの動きを遅くする
// 数字を1に近づけるほど元の難しさに戻る（laserは0で元通り）
// ==========================================
const BOSS_EASE = { except: '', speed: 0.7, timer: 1.6, laser: 30, move: 0.7 };

function easeBossDifficulty() {
  const b = activeBoss;
  if (gameState !== 'playing' || !b || b.name === BOSS_EASE.except) return;
  if (!b.eased) { b.eased = true; b.vx *= BOSS_EASE.move; }
  if (b._pt === undefined) b._pt = b.shootTimer;
  if (b.shootTimer > b._pt + 1) b.shootTimer = Math.round(b.shootTimer * BOSS_EASE.timer);
  b._pt = b.shootTimer;
  for (const p of projectiles) {
    if (!p.eased && (p.type === 'bossOrb' || p.type === 'bossSpread')) {
      p.vx *= BOSS_EASE.speed;
      p.vy *= BOSS_EASE.speed;
      p.eased = true;
    }
  }
  for (const lz of bossLasers) {
    if (!lz.eased) { lz.timer += BOSS_EASE.laser; lz.eased = true; }
  }
}

// ==========================================
// 新しい敵 4種（アーチャー・雪だるま・コウモリ・鳥とは別）
//  boar    : イノシシ   予告の赤い線が出たあと、横一直線に突進してくる
//  ghost   : おばけ     ゆっくりプレイヤーを追ってくる
//  crawler : ムカデ     壁に張りついて上下に這い回る
//  balloon : 爆弾風船   下からふわふわ上がってきて、近づくと破裂して弾が散る
// 回転攻撃で倒せる。ボス戦エリアには出ない
// ==========================================
const newEnemies = [];
let enemySpawnTimer = 200;

function spawnNewEnemy() {
  const kinds = ['boar', 'ghost', 'balloon'];
  const k = kinds[Math.floor(Math.random() * kinds.length)];
  const left = Math.random() < 0.5;
  const pcy = player.y + player.size / 2;
  if (k === 'ghost') {
    newEnemies.push({ k: k, x: left ? LEFT_WALL_X + 20 : RIGHT_WALL_X - 20, y: cameraY + 90, life: 700, r: 15 });
  } else if (k === 'boar') {
    newEnemies.push({ k: k, side: left ? 'left' : 'right', y: pcy - 80 + Math.random() * 60, t: 60, x: 0, dashing: false });
  } else if (k === 'crawler') {
    const by = cameraY + 120 + Math.random() * 160;
    newEnemies.push({ k: k, side: left ? 'left' : 'right', baseY: by, y: by, ph: Math.random() * 6.28, life: 600 });
  } else {
    newEnemies.push({
      k: k, x: LEFT_WALL_X + 50 + Math.random() * (RIGHT_WALL_X - LEFT_WALL_X - 100),
      y: cameraY + canvas.height + 30, t: 0, ph: Math.random() * 6.28, r: 16
    });
  }
  playSound('birdWarn');
}

function enemyKillsPlayer(color) {
  shakeTime = 18;
  spawnParticles(player.x + player.size / 2, player.y + player.size / 2, color, 26);
  showResult(false);
}

function tickNewEnemies() {
  if (gameState !== 'playing') return;
  const c = STAGES[currentDifficulty];
  const pcx = player.x + player.size / 2;
  const pcy = player.y + player.size / 2;
  const inBossArea = !!activeBoss && player.y - goalY < 700;
  const nearGoal = !c.isRecord && player.y - goalY < 260;

  if (inBossArea) {
    newEnemies.length = 0;
    return;
  }
  if ((c.isStory || c.isRecord) && !nearGoal) {
    enemySpawnTimer--;
    if (enemySpawnTimer <= 0 && newEnemies.length < 3) {
      spawnNewEnemy();
      enemySpawnTimer = 210 + Math.floor(Math.random() * 150);
    }
  }

  const spinning = player.spinTimer > 0;
  const px1 = player.x + 5, px2 = player.x + player.size - 5;
  const py1 = player.y + 5, py2 = player.y + player.size - 5;
  const T = Date.now() * 0.003;

  for (let i = newEnemies.length - 1; i >= 0; i--) {
    const e = newEnemies[i];
    if (e.k === 'ghost') {
      const a = Math.atan2(pcy - e.y, pcx - e.x);
      e.x += Math.cos(a) * 1.25;
      e.y += Math.sin(a) * 1.25 + Math.sin(T + e.x * 0.05) * 0.3;
      e.life--;
      if (Math.hypot(pcx - e.x, pcy - e.y) < e.r + 11) {
        if (spinning) {
          playSound('batKill');
          spawnParticles(e.x, e.y, '#E2E8F0', 16, false);
          newEnemies.splice(i, 1);
          continue;
        }
        enemyKillsPlayer('#E2E8F0');
        return;
      }
      if (e.life <= 0 || e.y > cameraY + canvas.height + 80) newEnemies.splice(i, 1);
    } else if (e.k === 'boar') {
      const dir = e.side === 'left' ? 1 : -1;
      if (!e.dashing) {
        e.t--;
        if (e.t <= 0) {
          e.dashing = true;
          e.x = e.side === 'left' ? LEFT_WALL_X : RIGHT_WALL_X;
          playSound('laserFire');
        }
      } else {
        e.x += dir * 11;
        if (px1 < e.x + 24 && px2 > e.x - 24 && py1 < e.y + 13 && py2 > e.y - 13) {
          if (spinning) {
            playSound('batKill');
            spawnParticles(e.x, e.y, '#F59E0B', 18, false);
            newEnemies.splice(i, 1);
            continue;
          }
          enemyKillsPlayer('#F59E0B');
          return;
        }
        if ((dir > 0 && e.x > RIGHT_WALL_X + 40) || (dir < 0 && e.x < LEFT_WALL_X - 40)) newEnemies.splice(i, 1);
      }
    } else if (e.k === 'crawler') {
      e.ph += 0.03;
      e.y = e.baseY + Math.sin(e.ph) * 90;
      e.life--;
      const x1 = e.side === 'left' ? LEFT_WALL_X : RIGHT_WALL_X - 22;
      if (px1 < x1 + 22 && px2 > x1 && py1 < e.y + 24 && py2 > e.y - 24) {
        if (spinning) {
          playSound('batKill');
          spawnParticles(x1 + 11, e.y, '#7C3AED', 16, false);
          newEnemies.splice(i, 1);
          continue;
        }
        enemyKillsPlayer('#7C3AED');
        return;
      }
      if (e.life <= 0 || e.baseY > cameraY + canvas.height + 160) newEnemies.splice(i, 1);
    } else {
      e.t++;
      e.y -= 1.1;
      e.x += Math.sin(e.t * 0.05 + e.ph) * 0.5;
      const d = Math.hypot(pcx - e.x, pcy - e.y);
      if (spinning && d < e.r + player.size / 2 + 12) {
        playSound('batKill');
        spawnParticles(e.x, e.y, '#EF4444', 14, false);
        newEnemies.splice(i, 1);
        continue;
      }
      if (e.t > 200 || (e.t > 40 && d < 130)) {
        for (let k = 0; k < 6; k++) {
          const ang = k * Math.PI / 3 + 0.3;
          projectiles.push({
            type: 'bossSpread', x: e.x, y: e.y,
            vx: Math.cos(ang) * 3.0, vy: Math.sin(ang) * 3.0,
            radius: 9, reflected: false, life: 160
          });
        }
        shakeTime = 6;
        playSound('laserFire');
        spawnParticles(e.x, e.y, '#EF4444', 16, false);
        newEnemies.splice(i, 1);
        continue;
      }
      if (e.y < cameraY - 60) newEnemies.splice(i, 1);
    }
  }
}

// 敵のグラフィック（イノシシ・おばけ・ムカデ・爆弾風船）
const ENEMY_INK = '#1E1E24';

function boarShape(run) {
  const c = ctx;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  // 脚（走るアニメーション）
  for (let i = 0; i < 4; i++) {
    const lx = -16 + i * 11;
    const sw = Math.sin(run + i * 1.7) * 5;
    c.strokeStyle = ENEMY_INK; c.lineWidth = 8;
    c.beginPath(); c.moveTo(lx, 8); c.lineTo(lx + sw, 18); c.stroke();
    c.strokeStyle = '#5B2A0C'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(lx, 8); c.lineTo(lx + sw, 18); c.stroke();
  }
  // 背中のたてがみ
  c.fillStyle = '#3F1D0B'; c.strokeStyle = ENEMY_INK; c.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    const x = -22 + i * 8;
    c.beginPath(); c.moveTo(x, -10); c.lineTo(x + 4, -22 - (i % 2) * 4); c.lineTo(x + 9, -10); c.closePath();
    c.fill(); c.stroke();
  }
  // 胴体
  const g = c.createLinearGradient(0, -15, 0, 15);
  g.addColorStop(0, '#D97706'); g.addColorStop(1, '#78350F');
  c.fillStyle = g; c.strokeStyle = ENEMY_INK; c.lineWidth = 3;
  c.beginPath(); c.ellipse(0, 0, 27, 15, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.22)';
  c.beginPath(); c.ellipse(-4, -7, 14, 4, -0.1, 0, Math.PI * 2); c.fill();
  // 頭
  c.fillStyle = '#C2620A';
  c.beginPath(); c.arc(23, -1, 12.5, 0, Math.PI * 2); c.fill(); c.stroke();
  // 耳
  c.fillStyle = '#7C2D12';
  c.beginPath(); c.moveTo(14, -9); c.lineTo(15, -20); c.lineTo(23, -11); c.closePath(); c.fill(); c.stroke();
  // 鼻先
  c.fillStyle = '#FBA5A5';
  c.beginPath(); c.ellipse(32, 3, 8.5, 6.5, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = ENEMY_INK;
  c.beginPath(); c.arc(34, 1, 1.5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(34, 6, 1.5, 0, Math.PI * 2); c.fill();
  // 牙
  c.fillStyle = '#FFFFFF'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(27, 9); c.quadraticCurveTo(38, 10, 38, -2); c.quadraticCurveTo(33, 4, 27, 5); c.closePath(); c.fill(); c.stroke();
  // 怒った目
  c.fillStyle = '#FFFFFF';
  c.beginPath(); c.ellipse(24, -5, 4.6, 4, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = '#DC2626';
  c.beginPath(); c.arc(25.5, -5, 2.2, 0, Math.PI * 2); c.fill();
  c.strokeStyle = ENEMY_INK; c.lineWidth = 3.5;
  c.beginPath(); c.moveTo(17, -13); c.lineTo(29, -8); c.stroke();
}

function drawBoar(e, T) {
  const sy = e.y - cameraY;
  const dir = e.side === 'left' ? 1 : -1;
  ctx.save();
  if (!e.dashing) {
    const pulse = 0.45 + 0.4 * Math.abs(Math.sin(e.t * 0.3));
    ctx.strokeStyle = 'rgba(255,42,85,' + pulse + ')';
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 8]);
    ctx.beginPath(); ctx.moveTo(LEFT_WALL_X, sy); ctx.lineTo(RIGHT_WALL_X, sy); ctx.stroke();
    ctx.setLineDash([]);
    const wx = e.side === 'left' ? LEFT_WALL_X : RIGHT_WALL_X;
    // 壁から顔をのぞかせて、足踏みしている
    ctx.save();
    ctx.translate(wx - dir * 2 + (Math.random() - 0.5) * 3, sy);
    ctx.scale(dir * 0.9, 0.9);
    boarShape(e.t * 0.6);
    ctx.restore();
    // 警告マーク
    const sx = wx + dir * 52;
    ctx.translate(sx, sy - 26);
    ctx.fillStyle = '#FFD600'; ctx.strokeStyle = ENEMY_INK; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(13, 10); ctx.lineTo(-13, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ENEMY_INK;
    ctx.fillRect(-1.5, -5, 3, 8);
    ctx.fillRect(-1.5, 5, 3, 3);
  } else {
    ctx.translate(e.x, sy);
    ctx.scale(dir, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(-34, -10 + i * 10); ctx.lineTo(-62 - i * 6, -10 + i * 10); ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = 'rgba(214,180,140,' + (0.55 - i * 0.16) + ')';
      ctx.beginPath(); ctx.arc(-34 - i * 14, 14 - i * 3, 7 + i * 3, 0, Math.PI * 2); ctx.fill();
    }
    boarShape(T * 6);
  }
  ctx.restore();
}

function drawGhost(e, T) {
  const sy = e.y - cameraY;
  if (sy < -50 || sy > canvas.height + 50) return;
  const bob = Math.sin(T * 2 + e.x * 0.03) * 3;
  const face = (player.x + player.size / 2 > e.x) ? 1 : -1;
  const w = Math.sin(T * 4) * 2.5;
  ctx.save();
  ctx.translate(e.x, sy + bob);
  ctx.lineJoin = 'round';
  // うしろの光
  ctx.shadowColor = 'rgba(147,197,253,0.95)';
  ctx.shadowBlur = 16;
  const g = ctx.createLinearGradient(0, -18, 0, 18);
  g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#BFDBFE');
  ctx.fillStyle = g; ctx.strokeStyle = ENEMY_INK; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, 16); ctx.lineTo(-16, -2); ctx.arc(0, -2, 16, Math.PI, 0); ctx.lineTo(16, 16);
  ctx.quadraticCurveTo(11, 10 + w, 8, 16); ctx.quadraticCurveTo(4, 22 - w, 0, 16);
  ctx.quadraticCurveTo(-4, 10 + w, -8, 16); ctx.quadraticCurveTo(-12, 22 - w, -16, 16);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();
  // 手
  const arm = Math.sin(T * 3) * 2;
  ctx.fillStyle = '#E0F2FE';
  ctx.beginPath(); ctx.ellipse(-18, 5 + arm, 5.5, 3.5, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(18, 5 - arm, 5.5, 3.5, 0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // 目
  ctx.fillStyle = ENEMY_INK;
  ctx.beginPath(); ctx.ellipse(-6 + face * 1.5, -4, 3.4, 4.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6 + face * 1.5, -4, 3.4, 4.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(-7 + face * 1.5, -6, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5 + face * 1.5, -6, 1.3, 0, Math.PI * 2); ctx.fill();
  // ほっぺと口
  ctx.fillStyle = 'rgba(251,113,133,0.6)';
  ctx.beginPath(); ctx.ellipse(-11, 3, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(11, 3, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ENEMY_INK;
  ctx.beginPath(); ctx.ellipse(face * 1.5, 6, 2.6, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawCrawler(e, T) {
  const sy = e.y - cameraY;
  if (sy < -70 || sy > canvas.height + 70) return;
  const wx = e.side === 'left' ? LEFT_WALL_X + 12 : RIGHT_WALL_X - 12;
  const dirY = Math.cos(e.ph) >= 0 ? 1 : -1;
  const N = 6;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (let i = N - 1; i >= 0; i--) {
    const cy = sy - dirY * i * 10;
    const cx = wx + Math.sin(T * 3 + i * 0.9) * 3;
    const r = i === 0 ? 10 : 9 - i * 0.35;
    const sw = Math.sin(T * 9 + i * 1.2) * 4;
    // 脚
    ctx.strokeStyle = ENEMY_INK; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(cx - r + 2, cy); ctx.lineTo(cx - r - 7, cy + sw + 3);
    ctx.moveTo(cx + r - 2, cy); ctx.lineTo(cx + r + 7, cy - sw + 3); ctx.stroke();
    ctx.strokeStyle = '#FB923C'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - r + 2, cy); ctx.lineTo(cx - r - 7, cy + sw + 3);
    ctx.moveTo(cx + r - 2, cy); ctx.lineTo(cx + r + 7, cy - sw + 3); ctx.stroke();
    // 体節
    const g = ctx.createRadialGradient(cx - 2, cy - 3, 1, cx, cy, r);
    g.addColorStop(0, i === 0 ? '#D8B4FE' : '#A78BFA'); g.addColorStop(1, '#6D28D9');
    ctx.fillStyle = g; ctx.strokeStyle = ENEMY_INK; ctx.lineWidth = 2.8;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (i > 0) {
      ctx.strokeStyle = 'rgba(251,191,36,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r - 3.5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    }
  }
  // 頭（目・触角・あご）
  const hx = wx + Math.sin(T * 3) * 3;
  ctx.strokeStyle = ENEMY_INK; ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(hx - 4, sy + dirY * 8); ctx.quadraticCurveTo(hx - 9, sy + dirY * 15, hx - 7, sy + dirY * 19);
  ctx.moveTo(hx + 4, sy + dirY * 8); ctx.quadraticCurveTo(hx + 9, sy + dirY * 15, hx + 7, sy + dirY * 19);
  ctx.stroke();
  ctx.fillStyle = '#FDE047';
  ctx.beginPath(); ctx.arc(hx - 7, sy + dirY * 19, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 7, sy + dirY * 19, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = ENEMY_INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(hx - 4, sy + dirY * 2, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(hx + 4, sy + dirY * 2, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#DC2626';
  ctx.beginPath(); ctx.arc(hx - 4, sy + dirY * 3, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 4, sy + dirY * 3, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.moveTo(hx - 5, sy + dirY * 9); ctx.lineTo(hx - 1, sy + dirY * 9); ctx.lineTo(hx - 3, sy + dirY * 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + 5, sy + dirY * 9); ctx.lineTo(hx + 1, sy + dirY * 9); ctx.lineTo(hx + 3, sy + dirY * 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawBalloon(e, T) {
  const sy = e.y - cameraY;
  if (sy < -50 || sy > canvas.height + 70) return;
  const hot = e.t > 150;
  const blink = hot && Math.floor(e.t / 5) % 2 === 0;
  const pulse = hot ? 1 + 0.06 * Math.sin(e.t * 0.8) : 1;
  ctx.save();
  ctx.translate(e.x, sy);
  ctx.scale(pulse, pulse);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // ひも
  ctx.strokeStyle = ENEMY_INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 25); ctx.quadraticCurveTo(7 + Math.sin(T * 3) * 3, 33, 0, 40); ctx.quadraticCurveTo(-6, 46, 1, 52); ctx.stroke();
  // 本体
  const g = ctx.createRadialGradient(-6, -8, 2, 0, 0, 24);
  g.addColorStop(0, blink ? '#FFFFFF' : '#FCA5A5');
  g.addColorStop(0.5, blink ? '#FEE2E2' : '#EF4444');
  g.addColorStop(1, blink ? '#FCA5A5' : '#991B1B');
  ctx.fillStyle = g; ctx.strokeStyle = ENEMY_INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 17, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // 結び目
  ctx.fillStyle = '#B91C1C'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, 19); ctx.lineTo(-5, 26); ctx.lineTo(5, 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  // ツヤ
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.ellipse(-8, -10, 3.6, 7, -0.5, 0, Math.PI * 2); ctx.fill();
  // 怒った顔
  ctx.fillStyle = '#FFFFFF'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(-6, -2, 3.6, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(6, -2, 3.6, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = ENEMY_INK;
  ctx.beginPath(); ctx.arc(-5, -1, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -1, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-11, -9); ctx.lineTo(-3, -5); ctx.moveTo(11, -9); ctx.lineTo(3, -5); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-6, 9); ctx.lineTo(-3, 6); ctx.lineTo(0, 9); ctx.lineTo(3, 6); ctx.lineTo(6, 9); ctx.stroke();
  // 導火線と火花
  ctx.strokeStyle = ENEMY_INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -19); ctx.quadraticCurveTo(-4, -26, 3, -30); ctx.stroke();
  const sp = 3 + Math.abs(Math.sin(T * 12)) * 3 + (hot ? 2 : 0);
  ctx.save();
  ctx.translate(3, -31);
  ctx.rotate(T * 6);
  ctx.fillStyle = '#FDE047'; ctx.strokeStyle = '#F97316'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let k = 0; k < 8; k++) {
    const rr = k % 2 === 0 ? sp + 3 : sp - 1;
    const a = k * Math.PI / 4;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function drawNewEnemies() {
  const T = Date.now() * 0.003;
  for (const e of newEnemies) {
    if (e.k === 'boar') drawBoar(e, T);
    else if (e.k === 'ghost') drawGhost(e, T);
    else if (e.k === 'crawler') drawCrawler(e, T);
    else drawBalloon(e, T);
  }
}

const baseUpdateFn2 = update;
update = function () {
  baseUpdateFn2();
  easeBossDifficulty();
  tickNewEnemies();
};
const baseDrawFn4 = draw;
draw = function () {
  baseDrawFn4();
  if (gameState === 'playing') drawNewEnemies();
};

// ==========================================
// ストーリーモードのオープニング動画（kuso.mp4）
// タイトルから STORY MODE を押したとき、ゲーム画面全体で再生
// クリック / タップ / Esc / Enter / Space でスキップ。動画が無い場合は何も起きない
// ==========================================
const OPENING_ONCE = true;   // true: ページを開いて最初の1回だけ / false: 毎回
let openingPlayed = false;

const openingScreen = document.createElement('div');
openingScreen.id = 'opening-screen';
const openingVideo = document.createElement('video');
openingVideo.src = 'kuso.mp4';
openingVideo.preload = 'auto';
openingVideo.playsInline = true;
const openingSkip = document.createElement('div');
openingSkip.id = 'opening-skip';
openingSkip.textContent = 'クリック / タップでスキップ';
openingScreen.appendChild(openingVideo);
openingScreen.appendChild(openingSkip);
document.getElementById('game-wrapper').appendChild(openingScreen);

function playOpening(done) {
  openingPlayed = true;
  let finished = false;
  const prevBgm = bgmOn;
  bgmOn = false;
  if (bgmCurrent) { bgmCurrent.pause(); bgmCurrent = null; }

  const onKey = (e) => {
    if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space') finish();
  };
  function finish() {
    if (finished) return;
    finished = true;
    openingVideo.pause();
    openingScreen.style.display = 'none';
    window.removeEventListener('keydown', onKey);
    bgmOn = prevBgm;
    done();
  }

  openingScreen.style.display = 'flex';
  openingVideo.muted = false;
  openingVideo.currentTime = 0;
  openingVideo.onended = finish;
  openingVideo.onerror = finish;
  openingScreen.onclick = finish;
  window.addEventListener('keydown', onKey);
  const pr = openingVideo.play();
  if (pr && pr.catch) {
    // 音つきの再生が拒否された場合は、消音で再生を試す
    pr.catch(() => {
      openingVideo.muted = true;
      openingVideo.play().catch(finish);
    });
  }
}

const baseOpenStorySelect = openStorySelect;
openStorySelect = function () {
  const fromTitle = !screenTitle.classList.contains('hidden');
  if (fromTitle && !(OPENING_ONCE && openingPlayed)) {
    playOpening(() => baseOpenStorySelect());
  } else {
    baseOpenStorySelect();
  }
};

// ==========================================
// クリア画面のキャラクターのエモート
// 装備中のスキンと剣で、ジャンプ → 回転斬り → 剣を掲げるポーズ を繰り返す
// ==========================================
const emoteCanvas = document.createElement('canvas');
emoteCanvas.id = 'clear-emote';
emoteCanvas.width = 360;
emoteCanvas.height = 200;
document.querySelector('.result-stats').before(emoteCanvas);
const emoteCtx = emoteCanvas.getContext('2d');
let emoteT = 0;
let emoteRaf = null;
const confetti = [];
const CONFETTI_COLORS = ['#FF3B6B', '#FFD600', '#00D2FF', '#00E676', '#A855F7'];

function drawFighterOn(c, skin, sword, o) {
  const half = 14;
  const ink = '#1E1E24';
  const drawSword = (len) => {
    const img = SWORD_IMAGES[sword.id];
    if (img && img.complete && img.naturalWidth > 0) {
      c.save();
      c.shadowColor = sword.glowColor;
      c.shadowBlur = 8;
      c.rotate(Math.PI / 4);
      const size = len * 1.48;
      c.drawImage(img, -size * 0.24, -size * 0.76, size, size);
      c.restore();
    } else {
      c.fillStyle = sword.bladeColor;
      c.fillRect(0, -3, len, 6);
    }
  };

  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.rot || 0);
  c.scale((o.sx || 1) * o.scale, (o.sy || 1) * o.scale);
  c.lineJoin = 'round';

  if (o.swordMode === 'back') {
    c.save();
    c.translate(-(half - 2), 3);
    c.rotate(-Math.PI * 0.65);
    drawSword(36);
    c.restore();
  }

  // ハチマキの尾
  const wave = Math.sin(o.t * 0.3) * 3;
  c.fillStyle = skin.bandColor; c.strokeStyle = ink; c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(-(half - 2), -half + 6);
  c.lineTo(-(half + 14), -half + 2 + wave);
  c.lineTo(-(half + 11), -half + 11 + wave);
  c.closePath(); c.fill(); c.stroke();

  // 手足
  c.fillStyle = ink;
  if (o.armsUp) {
    c.fillRect(-half - 4, -half - 2, 4, 10);
    c.fillRect(half, -half - 2, 4, 10);
  } else {
    c.fillRect(-half - 3, 2, 4, 6);
    c.fillRect(half - 1, -4, 4, 6);
  }
  c.fillRect(-9, half - 1, 5, 6);
  c.fillRect(4, half - 1, 5, 6);

  // 本体
  c.fillStyle = skin.bodyColor; c.strokeStyle = ink; c.lineWidth = 3;
  c.beginPath();
  if (typeof c.roundRect === 'function') c.roundRect(-half, -half, 28, 28, 4); else c.rect(-half, -half, 28, 28);
  c.fill(); c.stroke();

  if (skin.crown) {
    c.fillStyle = '#FFD600';
    c.beginPath();
    c.moveTo(-8, -half); c.lineTo(-8, -half - 8); c.lineTo(-3, -half - 4); c.lineTo(0, -half - 9);
    c.lineTo(3, -half - 4); c.lineTo(8, -half - 8); c.lineTo(8, -half);
    c.closePath(); c.fill(); c.stroke();
  }

  // ハチマキ
  c.fillStyle = skin.bandColor;
  c.fillRect(-half + 1, -half + 4, 26, 6);
  c.strokeRect(-half + 1, -half + 4, 26, 6);

  // 目（ゲーム中と同じ四角い目）
  c.fillStyle = skin.eyeColor;
  c.fillRect(-1, -1, 4, 6);
  c.fillRect(6, -1, 4, 6);
  c.fillStyle = '#FFFFFF';
  c.fillRect(0, 0, 1.5, 2);
  c.fillRect(7, 0, 1.5, 2);

  if (o.swordMode === 'out') {
    c.save();
    c.rotate(Math.PI * 0.22);
    c.translate(half - 1, 0);
    drawSword(46);
    c.restore();
  } else if (o.swordMode === 'up') {
    c.save();
    c.translate(half - 2, -4);
    c.rotate(-Math.PI / 2 - 0.1);
    drawSword(40);
    c.restore();
  }
  c.restore();
}

function emoteFrame() {
  if (gameState !== 'clear' || screenResult.classList.contains('hidden')) {
    emoteCanvas.style.display = 'none';
    return;
  }
  emoteT++;
  const c = emoteCtx;
  c.setTransform(2, 0, 0, 2, 0, 0);
  c.clearRect(0, 0, 180, 100);

  // 紙吹雪
  if (confetti.length === 0) {
    for (let i = 0; i < 28; i++) {
      confetti.push({
        x: Math.random() * 180, y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.6, vy: 0.5 + Math.random(),
        w: 3 + Math.random() * 3, r: Math.random() * 6, col: CONFETTI_COLORS[i % 5]
      });
    }
  }
  for (const p of confetti) {
    p.x += p.vx; p.y += p.vy; p.r += 0.1;
    if (p.y > 104) { p.y = -4; p.x = Math.random() * 180; }
    c.save();
    c.translate(p.x, p.y); c.rotate(p.r);
    c.fillStyle = p.col;
    c.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2);
    c.restore();
  }

  const skin = getCurrentSkin();
  const sword = getCurrentSword();
  const t = emoteT % 300;
  const o = { x: 90, y: 74, rot: 0, sx: 1, sy: 1, scale: 1.3, swordMode: 'back', armsUp: false, t: emoteT };
  let lift = 0;

  if (t < 100) {
    // 連続ジャンプ
    const p = (t % 50) / 50;
    lift = Math.sin(p * Math.PI) * 28;
    const land = p < 0.12 || p > 0.88;
    o.sx = land ? 1.2 : 0.92;
    o.sy = land ? 0.82 : 1.1;
    o.armsUp = !land;
    o.y = 74 - lift;
  } else if (t < 190) {
    // 回転斬り
    const p = (t - 100) / 90;
    const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    lift = Math.sin(p * Math.PI) * 16;
    o.rot = ease * Math.PI * 4;
    o.y = 74 - lift;
    o.swordMode = 'out';
  } else {
    // 剣を掲げてキメポーズ
    o.swordMode = 'up';
    o.armsUp = true;
    o.y = 74 + Math.sin(emoteT * 0.15) * 1.5;
    o.rot = Math.sin(emoteT * 0.08) * 0.08;
  }

  // 影
  c.fillStyle = 'rgba(0,0,0,' + (0.2 - lift * 0.003) + ')';
  c.beginPath();
  c.ellipse(90, 94, 20 - lift * 0.25, 4 - lift * 0.05, 0, 0, Math.PI * 2);
  c.fill();

  drawFighterOn(c, skin, sword, o);

  // キメポーズのきらめき
  if (t >= 190) {
    const tw = Math.abs(Math.sin(emoteT * 0.2));
    c.save();
    c.translate(90 + 14 * 1.3 + 4, 74 - 46 * 1.3);
    c.rotate(emoteT * 0.05);
    c.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * tw) + ')';
    c.strokeStyle = sword.glowColor; c.lineWidth = 1.5;
    c.beginPath();
    for (let k = 0; k < 8; k++) {
      const rr = k % 2 === 0 ? 7 + tw * 3 : 2;
      c.lineTo(Math.cos(k * Math.PI / 4) * rr, Math.sin(k * Math.PI / 4) * rr);
    }
    c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
}

function loopEmote() {
  emoteFrame();
  if (emoteCanvas.style.display === 'block') emoteRaf = requestAnimationFrame(loopEmote);
  else emoteRaf = null;
}

const baseShowResult = showResult;
showResult = function (isClear) {
  baseShowResult(isClear);
  if (isClear) {
    emoteCanvas.style.display = 'block';
    emoteT = 0;
    if (!emoteRaf) emoteRaf = requestAnimationFrame(loopEmote);
  } else {
    emoteCanvas.style.display = 'none';
  }
};

// ==========================================
// 忍術（ショップの「忍術」タブで解禁・強化・装備 / ゲーム中は Zキー か 画面左下のボタンで発動）
//  鈍足: 一定時間、世界がスローになる
//  鉄壁: 一定時間、あらゆるダメージを無効にするガード（落下も防ぐ）
//  鋭鋒: ボス戦専用。大きな予備動作のあと、ボスに確実にダメージを与える
// 装備できるのは1つだけ。解禁には2000コイン以上、最大Lv5まで強化できる
// ==========================================
const JUTSU_MAXLV = 5;
const JUTSU = [
  {
    id: 'slow', name: '鈍足', price: 2000, color: '#00D2FF', sub: '時を鈍らせる',
    desc: 'ゲームの世界を一定時間スローにする。敵も弾も、ゆっくり動く。',
    icon: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="#00D2FF" stroke-width="2" stroke-dasharray="4 3"/><path d="M14 8h20M14 40h20M16 8c0 10 8 10 8 16s-8 6-8 16M32 8c0 10-8 10-8 16s8 6 8 16" fill="none" stroke="#E0F2FE" stroke-width="3" stroke-linecap="round"/><path d="M19 36c3-4 7-4 10 0z" fill="#00D2FF"/></svg>'
  },
  {
    id: 'guard', name: '鉄壁', price: 2500, color: '#FACC15', sub: '絶対防御',
    desc: '一定時間、あらゆるダメージを無効にするガードを展開する。ガード中は落下しても助かる。',
    icon: '<svg viewBox="0 0 48 48"><polygon points="24,4 40,13 40,31 24,44 8,31 8,13" fill="rgba(250,204,21,0.2)" stroke="#FACC15" stroke-width="3"/><polygon points="24,12 33,17 33,29 24,36 15,29 15,17" fill="none" stroke="#FEF9C3" stroke-width="2"/><path d="M24 15v18M17 21h14" stroke="#FACC15" stroke-width="3"/></svg>'
  },
  {
    id: 'sharp', name: '鋭鋒', price: 3000, color: '#FF3B6B', sub: '一閃必中',
    desc: 'ボス戦専用。大きな予備動作のあと、ボスに確実にダメージを与える一閃。クールダウンが長い。',
    icon: '<svg viewBox="0 0 48 48"><path d="M8 40L38 8l2 4L12 42z" fill="#F8FAFC" stroke="#FF3B6B" stroke-width="2"/><path d="M4 30L44 20" stroke="#FF3B6B" stroke-width="3" stroke-linecap="round"/><circle cx="38" cy="10" r="3" fill="#FFD600"/></svg>'
  }
];

function jutsuStats(id, lv) {
  const k = lv - 1;
  if (id === 'slow') return { dur: 3.5 + 0.8 * k, scale: 0.5 - 0.04 * k, cd: 18 - 1.5 * k };
  if (id === 'guard') return { dur: 2.5 + 0.5 * k, cd: 16 - 1.5 * k };
  return { dmg: lv >= 3 ? 2 : 1, windup: 80 - 6 * k, cd: 45 - 4 * k };
}

function jutsuStatText(id, lv) {
  const s = jutsuStats(id, lv);
  if (id === 'slow') return '持続 ' + s.dur.toFixed(1) + '秒 / 速度 x' + s.scale.toFixed(2) + ' / CD ' + s.cd.toFixed(1) + '秒';
  if (id === 'guard') return '持続 ' + s.dur.toFixed(1) + '秒 / CD ' + s.cd.toFixed(1) + '秒';
  return 'ダメージ ' + s.dmg + ' / 溜め ' + (s.windup / 60).toFixed(1) + '秒 / CD ' + s.cd.toFixed(0) + '秒';
}

function jutsuUpgradeCost(j, lv) {
  return Math.round(j.price * 0.5 * lv / 100) * 100;
}

// セーブデータ（既存のセーブとは別のキーなので、既存データには影響しない）
let jutsuSave = { unlocked: {}, levels: {}, equipped: null };
try {
  const raw = JSON.parse(localStorage.getItem('wallKickJutsu') || 'null');
  if (raw && typeof raw === 'object') jutsuSave = Object.assign(jutsuSave, raw);
} catch (e) {}
function saveJutsu() {
  try { localStorage.setItem('wallKickJutsu', JSON.stringify(jutsuSave)); } catch (e) {}
}
function equippedJutsu() {
  return JUTSU.find(j => j.id === jutsuSave.equipped && jutsuSave.unlocked[j.id]) || null;
}

// ---------- ショップ「忍術」タブ ----------
function jutsuUnlock(j) {
  if (totalCoins >= j.price) {
    totalCoins -= j.price;
    jutsuSave.unlocked[j.id] = true;
    jutsuSave.levels[j.id] = 1;
    jutsuSave.equipped = j.id;
    saveJutsu();
    saveCoinAndSkinData();
    playSound('clear');
  } else {
    playSound('hit');
  }
  renderJutsuGrid();
}
function jutsuUpgrade(j) {
  const lv = jutsuSave.levels[j.id] || 1;
  const cost = jutsuUpgradeCost(j, lv);
  if (lv < JUTSU_MAXLV && totalCoins >= cost) {
    totalCoins -= cost;
    jutsuSave.levels[j.id] = lv + 1;
    saveJutsu();
    saveCoinAndSkinData();
    playSound('clear');
  } else {
    playSound('hit');
  }
  renderJutsuGrid();
}
function jutsuToggleEquip(j) {
  jutsuSave.equipped = (jutsuSave.equipped === j.id) ? null : j.id;
  saveJutsu();
  playSound('kick');
  renderJutsuGrid();
}

function renderJutsuGrid() {
  const grid = document.getElementById('skin-grid');
  grid.innerHTML = '';
  JUTSU.forEach(j => {
    const owned = !!jutsuSave.unlocked[j.id];
    const lv = jutsuSave.levels[j.id] || 1;
    const equipped = owned && jutsuSave.equipped === j.id;
    const card = document.createElement('div');
    card.className = 'skin-card jutsu-card' + (equipped ? ' selected' : '') + (!owned ? ' locked' : '');
    card.style.background = 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)';
    card.style.color = '#F8FAFC';
    card.style.borderColor = equipped ? '#FFD600' : j.color;
    card.style.boxShadow = '4px 4px 0px ' + j.color;
    card.style.cursor = 'default';

    const head = document.createElement('div');
    head.className = 'jutsu-head';
    head.innerHTML =
      '<div class="jutsu-icon" style="box-shadow: inset 0 0 14px ' + j.color + ';">' + j.icon + '</div>' +
      '<div class="jutsu-info">' +
      '<div class="jutsu-name">' + j.name + '<span class="jutsu-sub" style="color:' + j.color + ';">' + j.sub + '</span></div>' +
      '<div class="jutsu-desc">' + j.desc + '</div>' +
      '<div class="jutsu-stat">' + (owned ? 'Lv.' + lv + ' / ' + JUTSU_MAXLV : 'Lv.1') + '  ' + jutsuStatText(j.id, owned ? lv : 1) + '</div>' +
      '</div>';
    card.appendChild(head);

    const row = document.createElement('div');
    row.className = 'jutsu-row';
    const mk = (label, cls, fn) => {
      const b = document.createElement('button');
      b.className = 'jutsu-btn ' + cls;
      b.textContent = label;
      b.onclick = fn;
      row.appendChild(b);
    };
    if (!owned) {
      mk('解禁  ' + j.price + '枚', totalCoins >= j.price ? 'buy' : 'dim', () => jutsuUnlock(j));
    } else {
      mk(equipped ? '装備中' : '装備する', equipped ? 'on' : 'buy', () => jutsuToggleEquip(j));
      if (lv >= JUTSU_MAXLV) {
        mk('MAX', 'dim', () => {});
      } else {
        const cost = jutsuUpgradeCost(j, lv);
        mk('強化 Lv.' + (lv + 1) + '  ' + cost + '枚', totalCoins >= cost ? 'buy' : 'dim', () => jutsuUpgrade(j));
      }
    }
    card.appendChild(row);
    grid.appendChild(card);
  });
}

const baseSwitchShopTab = switchShopTab;
switchShopTab = function (tab) {
  baseSwitchShopTab(tab);
  const t = document.getElementById('shop-tab-jutsu');
  if (t) t.classList.toggle('active', tab === 'jutsu');
};
const baseRenderSkinGrid = renderSkinGrid;
renderSkinGrid = function () {
  if (currentShopTab === 'jutsu') renderJutsuGrid();
  else baseRenderSkinGrid();
};

// ---------- ゲーム中の状態 ----------
function newJutsuState() {
  return { cd: 0, cdMax: 1, slowT: 0, slowScale: 0.5, sharp: null, guardT: 0, hitstop: 0, blockT: 0, postInv: 0 };
}
let jstate = newJutsuState();
const jfx = [];
let slowAccum = 0;
let worldMute = false;

const jutsuBtn = document.createElement('button');
jutsuBtn.id = 'jutsu-btn';
jutsuBtn.tabIndex = -1;
jutsuBtn.innerHTML = '<span class="jb-gauge"></span><span class="jb-label"></span>';
jutsuBtn.addEventListener('focus', () => jutsuBtn.blur());
jutsuBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); useJutsu(); });
document.getElementById('game-wrapper').appendChild(jutsuBtn);

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyZ' && !e.repeat) {
    e.preventDefault();
    useJutsu();
  }
});

function useJutsu() {
  if (gameState !== 'playing' || player.clashState) return;
  const j = equippedJutsu();
  if (!j || jstate.cd > 0 || jstate.sharp) return;
  const st = jutsuStats(j.id, jutsuSave.levels[j.id] || 1);
  const cx = player.x + player.size / 2;
  const cy = player.y + player.size / 2;

  if (j.id === 'slow') {
    jstate.slowT = Math.round(st.dur * 60);
    jstate.slowScale = st.scale;
    jstate.cdMax = jstate.cd = Math.round((st.cd + st.dur) * 60);
    playSound('laserWarn');
    jfx.push({ type: 'ring', x: cx, y: cy, t: 0, total: 26, color: '#7DEBFF' });
    jfx.push({ type: 'flash', t: 0, total: 8, color: '125,235,255' });
    jfx.push({ type: 'banner', text: j.name, sub: j.sub, color: j.color, t: 0, total: 54 });
  } else if (j.id === 'guard') {
    jstate.guardT = Math.round(st.dur * 60);
    jstate.cdMax = jstate.cd = Math.round((st.cd + st.dur) * 60);
    playSound('deflect');
    jfx.push({ type: 'ring', x: cx, y: cy, t: 0, total: 22, color: '#FEF08A' });
    jfx.push({ type: 'banner', text: j.name, sub: j.sub, color: j.color, t: 0, total: 54 });
  } else {
    if (!activeBoss || !activeBoss.active || activeBoss.hp <= 0) {
      jfx.push({ type: 'toast', text: '鋭鋒はボス戦でのみ使用できる', t: 0, total: 80 });
      return;
    }
    jstate.sharp = { t: 0, total: Math.round(st.windup), dmg: st.dmg };
    jstate.cdMax = jstate.cd = Math.round(st.cd * 60 + st.windup);
    playSound('laserWarn');
    jfx.push({ type: 'banner', text: j.name, sub: j.sub, color: j.color, t: -Math.round(st.windup * 0.35), total: 56 });
  }
}

function jutsuInvulnerable() {
  return jstate.guardT > 0 || !!jstate.sharp || jstate.postInv > 0;
}

function jutsuBlocked() {
  if (jstate.sharp || jstate.postInv > 0 || jstate.blockT > 0) return;
  jstate.blockT = 14;
  const cx = player.x + player.size / 2;
  const cy = player.y + player.size / 2;
  if (player.y - cameraY > canvas.height) {
    // 落下を防ぐ: 画面内へ打ち上げる
    player.y = cameraY + canvas.height - 120;
    player.vy = -13;
    player.onWall = null;
  } else {
    const away = player.onWall === 'left' ? 1 : (player.onWall === 'right' ? -1 : -(player.facing || 1));
    player.vx = away * 7;
    player.vy = -9;
    player.onWall = null;
    player.airJumpAvailable = true;
    player.facing = away;
  }
  player.clashState = null;
  shakeTime = 10;
  playSound('deflect');
  spawnParticles(cx, cy, '#FACC15', 18, false);
  jfx.push({ type: 'ring', x: cx, y: cy, t: 0, total: 18, color: '#FEF08A' });
}

const baseShowResult2 = showResult;
showResult = function (isClear) {
  if (!isClear && gameState === 'playing' && jutsuInvulnerable()) {
    jutsuBlocked();
    return;
  }
  baseShowResult2(isClear);
  jutsuBtn.style.display = 'none';
};

function bossTakeDamage(n) {
  const b = activeBoss;
  if (!b || b.hp <= 0) return;
  b.hp = Math.max(0, b.hp - n);
  b.hitFlash = 16;
  updateBossHpUi();
  shakeTime = 22;
  playSound('bossDamage');
  spawnParticles(b.x, b.y, '#FF3B6B', 28, false);
  if (b.hp <= 0) {
    bossHud.classList.add('hidden');
    bossLasers = [];
    spawnParticles(b.x, b.y, '#FFD600', 40, false);
    maxAltitude = STAGES[currentDifficulty].goalMeters;
    showResult(true);
  }
}

function jutsuStrike() {
  const s = jstate.sharp;
  jstate.sharp = null;
  jstate.postInv = 30;
  const b = activeBoss;
  if (!b || b.hp <= 0) return;
  const cx = player.x + player.size / 2;
  const cy = player.y + player.size / 2;
  jfx.push({ type: 'slash', x1: cx, y1: cy, x2: b.x, y2: b.y, t: 0, total: 18 });
  jfx.push({ type: 'flash', t: 0, total: 10, color: '255,255,255' });
  jfx.push({ type: 'dmg', x: b.x, y: b.y - 50, text: '-' + s.dmg, t: 0, total: 50 });
  jstate.hitstop = 8;
  playSound('deflect');
  bossTakeDamage(s.dmg);
}

function tickJutsu() {
  if (jstate.cd > 0) jstate.cd--;
  if (jstate.slowT > 0) jstate.slowT--;
  if (jstate.guardT > 0) jstate.guardT--;
  if (jstate.blockT > 0) jstate.blockT--;
  if (jstate.postInv > 0) jstate.postInv--;
  if (jstate.sharp) {
    jstate.sharp.t++;
    if (jstate.sharp.t >= jstate.sharp.total) jutsuStrike();
  }
}

function timeScale() {
  if (jstate.sharp) return 0.2;
  if (jstate.slowT > 0) return jstate.slowScale;
  return 1;
}

// ---------- 世界のスロー（敵・弾・ギミックだけを止めて、プレイヤーは通常速度） ----------
function snapshotWorld() {
  const cp = (a) => a.map(o => [o, Object.assign({}, o)]);
  return {
    bats: cp(bats), birds: cp(birds), projectiles: cp(projectiles), amb: cp(ambusherEnemies),
    spikes: cp(spikeBands), lasers: cp(bossLasers), ne: cp(newEnemies), bombs: cp(bossBombs), queue: cp(bossQueue),
    bossRef: activeBoss, boss: activeBoss ? Object.assign({}, activeBoss) : null,
    sc: {
      generatedUntilY, lastSpikeSide, lastSpikeBottomY, sameSideStreak,
      birdSpawnTimer, ambusherSpawnTimer, enemySpawnTimer, stageRngState
    }
  };
}
function restoreWorld(s) {
  const rs = (list) => list.map(pair => { Object.assign(pair[0], pair[1]); return pair[0]; });
  bats = rs(s.bats);
  birds = rs(s.birds);
  projectiles = rs(s.projectiles);
  ambusherEnemies = rs(s.amb);
  spikeBands = rs(s.spikes);
  bossLasers = rs(s.lasers);
  const refill = (arr, list) => { const items = rs(list); arr.length = 0; items.forEach(o => arr.push(o)); };
  refill(newEnemies, s.ne);
  refill(bossBombs, s.bombs);
  refill(bossQueue, s.queue);
  if (s.bossRef && s.boss) Object.assign(s.bossRef, s.boss);
  generatedUntilY = s.sc.generatedUntilY;
  lastSpikeSide = s.sc.lastSpikeSide;
  lastSpikeBottomY = s.sc.lastSpikeBottomY;
  sameSideStreak = s.sc.sameSideStreak;
  birdSpawnTimer = s.sc.birdSpawnTimer;
  ambusherSpawnTimer = s.sc.ambusherSpawnTimer;
  enemySpawnTimer = s.sc.enemySpawnTimer;
  stageRngState = s.sc.stageRngState;
}

const basePlaySound2 = playSound;
playSound = function (type) {
  if (worldMute) return;
  basePlaySound2(type);
};

// ==========================================
// 高野山天狗マスター以降のボスは、回転攻撃で直接斬りつけられる
// ただし、ボスが光る盾を張っている間（約4.3秒に1回、約1.2秒間）はガードされて弾かれる
// 赤べこ将軍・大仏ガーディアン・黄金シャチホコ王は、これまで通り弾き返しでのみダメージ
// ==========================================
const DIRECT_BOSS_EXCEPT = ['赤べこ将軍', '大仏ガーディアン', '黄金シャチホコ王'];
const BOSS_GUARD_CYCLE = 260;
const BOSS_GUARD_START = 190;

function isDirectBoss(b) {
  return !!b && !DIRECT_BOSS_EXCEPT.includes(b.name);
}
function bossGuarding(b) {
  return isDirectBoss(b) && ((b._gt || 0) % BOSS_GUARD_CYCLE) >= BOSS_GUARD_START;
}

function playerMeleeBoss() {
  const b = activeBoss;
  if (!b || b.hp <= 0 || !b.active || !isDirectBoss(b)) return;
  b._gt = (b._gt || 0) + 1;
  if (b._meleeCd > 0) b._meleeCd--;
  if (player.spinTimer <= 0 || b._meleeCd > 0) return;
  const pcx = player.x + player.size / 2;
  const pcy = player.y + player.size / 2;
  if (Math.hypot(pcx - b.x, pcy - b.y) > 48 + player.size / 2 + 22) return;
  b._meleeCd = 45;
  if (bossGuarding(b)) {
    // ガードされた: 弾かれて、回転攻撃が止まる
    const away = pcx >= b.x ? 1 : -1;
    player.vx = away * 8;
    player.vy = -4;
    player.onWall = null;
    player.facing = away;
    player.spinTimer = 0;
    shakeTime = 8;
    playSound('deflect');
    spawnParticles((pcx + b.x) / 2, (pcy + b.y) / 2, '#FFFFFF', 12, false);
    jfx.push({ type: 'ring', x: (pcx + b.x) / 2, y: (pcy + b.y) / 2, t: 0, total: 16, color: '#FFFFFF' });
    jfx.push({ type: 'dmg', x: b.x, y: b.y - 50, text: 'ガード！', t: 0, total: 40 });
  } else {
    jfx.push({ type: 'dmg', x: b.x, y: b.y - 50, text: '-1', t: 0, total: 40 });
    bossTakeDamage(1);
  }
}

function drawBossGuard() {
  const b = activeBoss;
  if (!b || b.hp <= 0 || !b.active || !bossGuarding(b)) return;
  const left = BOSS_GUARD_CYCLE - ((b._gt || 0) % BOSS_GUARD_CYCLE);
  const blink = left < 18 && Math.floor(left / 3) % 2 === 0;
  const T = Date.now() * 0.001;
  const hex = (r, rot) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = rot + i * Math.PI / 3;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  };
  ctx.save();
  ctx.translate(b.x, b.y - cameraY);
  ctx.globalAlpha = blink ? 0.35 : 1;
  ctx.shadowColor = bossTheme().beam;
  ctx.shadowBlur = 20;
  hex(68, T * 0.7);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.shadowBlur = 0;
  hex(58, -T * 1.1);
  ctx.strokeStyle = bossTheme().beam;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// 弾き返した小さい弾がボスに当たったら、大きい弾と同じように1ダメージ
// （まとめて当たっても1回分だけになるよう、ヒット後0.75秒はボスに無敵時間を付ける）
function reflectedShotsHitBoss() {
  const b = activeBoss;
  if (!b || b.hp <= 0 || !b.active) return;
  if (b._hitCd > 0) b._hitCd--;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (p.type !== 'bossSpread' || !p.reflected) continue;
    if (Math.hypot(b.x - p.x, b.y - p.y) < 48 + p.radius) {
      projectiles.splice(i, 1);
      if (b._hitCd > 0) {
        spawnParticles(p.x, p.y, '#FFFFFF', 6, false);
        continue;
      }
      b._hitCd = 45;
      bossTakeDamage(1);
      if (gameState !== 'playing') return;
    }
  }
}

// ボスのレーザー以外の弾は、回転攻撃で弾き返せる（弾き返した弾はボスに向かって飛ぶ）
function deflectBossShots() {
  if (player.spinTimer <= 0) return;
  const pcx = player.x + player.size / 2;
  const pcy = player.y + player.size / 2;
  for (const p of projectiles) {
    if (p.type !== 'bossSpread' || p.reflected) continue;
    if (Math.hypot(pcx - p.x, pcy - p.y) < p.radius + player.size / 2 + 14) {
      p.reflected = true;
      p.homing = 0;
      const tx = activeBoss ? activeBoss.x : p.x;
      const ty = activeBoss ? activeBoss.y : p.y - 300;
      const d = Math.max(1, Math.hypot(tx - p.x, ty - p.y));
      p.vx = (tx - p.x) / d * 9;
      p.vy = (ty - p.y) / d * 9;
      p.life = 70;
      shakeTime = 4;
      playSound('deflect');
      spawnParticles(p.x, p.y, '#FFD600', 8, false);
    }
  }
}

const baseUpdateFn3 = update;
update = function () {
  if (gameState !== 'playing') { baseUpdateFn3(); return; }
  tickJutsu();
  if (gameState !== 'playing') return;
  if (jstate.hitstop > 0) { jstate.hitstop--; return; }
  deflectBossShots();

  const frozen = jstate.sharp ? { x: player.x, y: player.y } : null;
  const s = timeScale();
  if (s < 1) {
    slowAccum += s;
    if (slowAccum >= 1) {
      slowAccum -= 1;
      baseUpdateFn3();
    } else {
      const snap = snapshotWorld();
      worldMute = true;
      baseUpdateFn3();
      worldMute = false;
      if (gameState === 'playing') restoreWorld(snap);
    }
  } else {
    slowAccum = 0;
    baseUpdateFn3();
  }
  if (gameState === 'playing') reflectedShotsHitBoss();
  if (gameState === 'playing') playerMeleeBoss();
  if (frozen && gameState === 'playing') {
    player.x = frozen.x; player.y = frozen.y; player.vx = 0; player.vy = 0;
  }
};

const baseStartGame2 = startGame;
startGame = function (...args) {
  baseStartGame2(...args);
  jstate = newJutsuState();
  jfx.length = 0;
  slowAccum = 0;
};

// ---------- 演出 ----------
function easeOutC(p) { return 1 - Math.pow(1 - p, 3); }

function drawJutsuBanner(f) {
  const c = ctx;
  const W = canvas.width;
  const inP = Math.min(1, f.t / 10);
  const outP = Math.min(1, (f.total - f.t) / 12);
  const a = Math.max(0, Math.min(inP, outP));
  const slide = (1 - easeOutC(inP)) * -160;
  c.save();
  c.globalAlpha = a;
  c.fillStyle = 'rgba(10,10,20,0.8)';
  c.beginPath();
  c.moveTo(-20, 262); c.lineTo(W + 20, 236); c.lineTo(W + 20, 318); c.lineTo(-20, 344);
  c.closePath(); c.fill();
  c.strokeStyle = f.color; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-20, 262); c.lineTo(W + 20, 236); c.stroke();
  c.beginPath(); c.moveTo(-20, 344); c.lineTo(W + 20, 318); c.stroke();
  c.textAlign = 'center';
  c.font = '900 62px "M PLUS Rounded 1c", sans-serif';
  c.lineJoin = 'round';
  const chars = f.text.split('');
  const gap = 66;
  const x0 = W / 2 + slide - (chars.length - 1) * gap / 2;
  chars.forEach((ch, i) => {
    const x = x0 + i * gap;
    c.shadowColor = f.color; c.shadowBlur = 22;
    c.strokeStyle = '#1E1E24'; c.lineWidth = 9;
    c.strokeText(ch, x, 314);
    c.shadowBlur = 0;
    c.fillStyle = '#FFFFFF';
    c.fillText(ch, x, 314);
  });
  c.font = '900 14px "M PLUS Rounded 1c", sans-serif';
  c.fillStyle = f.color;
  c.fillText(f.sub, W / 2 - slide * 0.5, 335);
  c.restore();
}

function drawJutsuFx() {
  const c = ctx;
  const W = canvas.width, H = canvas.height;
  const pcx = player.x + player.size / 2;
  const pcy = player.y - cameraY + player.size / 2;
  const T = Date.now() * 0.001;

  // 鈍足: 青い色調と、プレイヤーを囲む時計
  if (jstate.slowT > 0) {
    const a = Math.min(1, jstate.slowT / 20);
    c.save();
    c.fillStyle = 'rgba(30,70,170,' + (0.12 * a) + ')';
    c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, H / 2, 160, W / 2, H / 2, 480);
    g.addColorStop(0, 'rgba(0,210,255,0)');
    g.addColorStop(1, 'rgba(0,110,255,' + (0.3 * a) + ')');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.translate(pcx, pcy);
    c.strokeStyle = 'rgba(125,235,255,0.9)';
    c.lineWidth = 2;
    c.setLineDash([3, 5]);
    c.beginPath(); c.arc(0, 0, 34, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
    for (let i = 0; i < 12; i++) {
      const ang = i * Math.PI / 6;
      const r1 = i % 3 === 0 ? 46 : 42;
      c.beginPath();
      c.moveTo(Math.cos(ang) * 38, Math.sin(ang) * 38);
      c.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
      c.stroke();
    }
    c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(0, 0);
    c.lineTo(Math.cos(T * 0.9 - 1.57) * 26, Math.sin(T * 0.9 - 1.57) * 26);
    c.stroke();
    c.restore();
  }

  // 鉄壁: 回転する六角形の障壁
  if (jstate.guardT > 0) {
    const blink = jstate.guardT < 45 && Math.floor(jstate.guardT / 4) % 2 === 0;
    const hex = (r, rot) => {
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = rot + i * Math.PI / 3;
        c.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      c.closePath();
    };
    c.save();
    c.translate(pcx, pcy);
    c.globalAlpha = blink ? 0.35 : 1;
    c.shadowColor = '#FACC15';
    c.shadowBlur = 16;
    hex(30, T * 0.8);
    c.fillStyle = 'rgba(250,204,21,0.16)';
    c.fill();
    c.strokeStyle = '#FDE047';
    c.lineWidth = 3;
    c.stroke();
    c.shadowBlur = 0;
    hex(22, -T * 1.2);
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 1.5;
    c.stroke();
    if (jstate.blockT > 8) {
      hex(36, T * 0.8);
      c.fillStyle = 'rgba(255,255,255,0.45)';
      c.fill();
    }
    c.restore();
  }

  // 鋭鋒: 予備動作（暗転、収束する光、光の柱）
  if (jstate.sharp) {
    const s = jstate.sharp;
    const p = Math.min(1, s.t / s.total);
    const e = easeOutC(p);
    c.save();
    const g = c.createRadialGradient(pcx, pcy, 50, pcx, pcy, 420);
    g.addColorStop(0, 'rgba(0,0,12,0)');
    g.addColorStop(1, 'rgba(0,0,12,' + (0.65 * e) + ')');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.translate(pcx, pcy);
    c.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const ang = i * Math.PI / 9 + T * 0.5;
      const r0 = 40 + (1 - p) * 150 + (i % 3) * 14;
      const r1 = r0 + 22 + p * 12;
      const al = 0.25 + 0.6 * p;
      c.strokeStyle = i % 2 ? 'rgba(255,255,255,' + al + ')' : 'rgba(255,59,107,' + al + ')';
      c.lineWidth = 2 + p * 2;
      c.beginPath();
      c.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
      c.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
      c.stroke();
    }
    c.strokeStyle = 'rgba(255,255,255,' + (0.3 + 0.6 * p) + ')';
    c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, 20 + (1 - p) * 90, 0, Math.PI * 2); c.stroke();
    const w = 6 + p * 16;
    const pg = c.createLinearGradient(0, -420, 0, 0);
    pg.addColorStop(0, 'rgba(255,255,255,0)');
    pg.addColorStop(1, 'rgba(255,120,160,' + (0.75 * p) + ')');
    c.fillStyle = pg;
    c.shadowColor = '#FF3B6B';
    c.shadowBlur = 18;
    c.fillRect(-w / 2, -420, w, 420);
    c.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * p) + ')';
    c.beginPath(); c.arc(0, 0, 8 + p * 14, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  // 一時的な演出（リング、閃光、斬撃、ダメージ表示、バナー、メッセージ）
  for (let i = jfx.length - 1; i >= 0; i--) {
    const f = jfx[i];
    f.t++;
    if (f.t >= f.total) { jfx.splice(i, 1); continue; }
    if (f.t < 0) continue;
    const p = f.t / f.total;
    c.save();
    if (f.type === 'ring') {
      c.strokeStyle = f.color;
      c.globalAlpha = 1 - p;
      c.lineWidth = 5 * (1 - p) + 1;
      c.beginPath(); c.arc(f.x, f.y - cameraY, 8 + p * 110, 0, Math.PI * 2); c.stroke();
    } else if (f.type === 'flash') {
      c.fillStyle = 'rgba(' + f.color + ',' + (0.7 * (1 - p)) + ')';
      c.fillRect(0, 0, W, H);
    } else if (f.type === 'slash') {
      const x1 = f.x1, y1 = f.y1 - cameraY, x2 = f.x2, y2 = f.y2 - cameraY;
      const dx = x2 - x1, dy = y2 - y1;
      const ex = x2 + dx * 0.4, ey = y2 + dy * 0.4;
      c.lineCap = 'round';
      const al = 1 - p;
      const passes = [[26 * (1 - p) + 2, 'rgba(255,59,107,' + al + ')'], [12 * (1 - p) + 2, 'rgba(125,235,255,' + al + ')'], [4, 'rgba(255,255,255,' + al + ')']];
      passes.forEach(ps => {
        c.strokeStyle = ps[1]; c.lineWidth = ps[0];
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(ex, ey); c.stroke();
      });
      c.strokeStyle = 'rgba(255,255,255,' + al + ')';
      c.lineWidth = 3;
      for (let k = -1; k <= 1; k += 2) {
        c.beginPath();
        c.moveTo(x2 - 55 * k, y2 - 55);
        c.lineTo(x2 + 55 * k, y2 + 55);
        c.stroke();
      }
    } else if (f.type === 'dmg') {
      c.textAlign = 'center';
      c.font = '900 36px "M PLUS Rounded 1c", sans-serif';
      c.globalAlpha = Math.min(1, (1 - p) * 2);
      c.lineWidth = 6; c.strokeStyle = '#1E1E24'; c.lineJoin = 'round';
      c.strokeText(f.text, f.x, f.y - cameraY - p * 40);
      c.fillStyle = '#FFD600';
      c.fillText(f.text, f.x, f.y - cameraY - p * 40);
    } else if (f.type === 'toast') {
      const a = Math.min(1, f.t / 8, (f.total - f.t) / 12);
      c.globalAlpha = Math.max(0, a);
      c.fillStyle = 'rgba(30,30,36,0.85)';
      c.fillRect(70, 612, W - 140, 34);
      c.textAlign = 'center';
      c.font = '900 14px "M PLUS Rounded 1c", sans-serif';
      c.fillStyle = '#FFFFFF';
      c.fillText(f.text, W / 2, 634);
    } else if (f.type === 'banner') {
      c.restore();
      drawJutsuBanner(f);
      continue;
    }
    c.restore();
  }
}

function updateJutsuButton() {
  const j = equippedJutsu();
  if (gameState !== 'playing' || !j) { jutsuBtn.style.display = 'none'; return; }
  jutsuBtn.style.display = 'block';
  const gauge = jutsuBtn.firstChild;
  const label = jutsuBtn.lastChild;
  const ready = jstate.cd <= 0 && !jstate.sharp;
  const ratio = jstate.cdMax > 0 ? 1 - jstate.cd / jstate.cdMax : 1;
  gauge.style.background = j.color;
  gauge.style.width = (ready ? 100 : Math.max(0, Math.min(100, ratio * 100))) + '%';
  label.textContent = 'Z  ' + j.name + (ready ? '' : '  ' + Math.ceil(jstate.cd / 60) + 's');
  jutsuBtn.style.opacity = ready ? '1' : '0.85';
}

const baseDrawFn5 = draw;
draw = function () {
  baseDrawFn5();
  if (gameState === 'playing') { drawBossGuard(); drawJutsuFx(); }
  updateJutsuButton();
};

// ==========================================
// かんたんチュートリアル
// 初めて遊ぶときに自動で表示。タイトル画面右上の「遊び方」ボタンからいつでも見られる
// ==========================================
const TUTORIAL_PAGES = [
  { scene: 'kick', title: '壁を蹴って、上へ登れ！',
    lines: ['左右の壁に張りつくと、ゆっくり落ちる。', 'クリック / タップ / ↑ / W で、壁を蹴って反対の壁へ跳ぶ。', '上にあるゴールを目指そう。'] },
  { scene: 'double', title: '空中でもう一度ジャンプ',
    lines: ['空中でもう一度押すと、二段ジャンプ。', '壁に着くと、また使える。', '落ちそうなときの命綱になる。'] },
  { scene: 'spin', title: '回転攻撃',
    lines: ['スペースキーで回転攻撃。', 'コウモリを倒したり、敵の弾を弾いたりできる。', '使ったあと1秒は、二段ジャンプも回転攻撃も使えない。'] },
  { scene: 'danger', title: '危ないものに注意',
    lines: ['トゲ、コウモリ、鳥、敵の攻撃に当たるとゲームオーバー。', '赤い線や「!」マークは、攻撃の予告。', '画面の下に落ちても終わり。'] },
  { scene: 'boss', title: 'ボス戦と忍術',
    lines: ['ボスの弾（レーザー以外）は、回転攻撃で弾き返してボスに当てよう。', 'レーザーは予告線を見て避ける。', '高野山以降のボスは、回転攻撃で直接斬れる。光る盾のガード中は弾かれる。', 'Zキー（左下のボタン）で忍術。コインを貯めてショップで解禁できる。'] }
];

let tutorialIdx = 0;
let tutorialT = 0;
let tutorialRaf = null;

const tutorialScreen = document.createElement('div');
tutorialScreen.id = 'tutorial-screen';
tutorialScreen.className = 'overlay hidden';
tutorialScreen.innerHTML =
  '<div class="title-badge" style="background:#00E676; color:#1E1E24;">TUTORIAL</div>' +
  '<canvas id="tutorial-canvas" width="300" height="150"></canvas>' +
  '<h2 id="tutorial-title"></h2>' +
  '<div id="tutorial-text"></div>' +
  '<div id="tutorial-dots"></div>' +
  '<div id="tutorial-btns">' +
  '<button class="btn btn-back tut-btn" id="tut-skip">スキップ</button>' +
  '<button class="btn btn-back tut-btn" id="tut-prev">前へ</button>' +
  '<button class="btn btn-story tut-btn" id="tut-next">次へ</button>' +
  '</div>';
document.getElementById('game-wrapper').appendChild(tutorialScreen);

const tutorialCanvas = document.getElementById('tutorial-canvas');
const tutorialCtx = tutorialCanvas.getContext('2d');

const tutorialOpenBtn = document.createElement('button');
tutorialOpenBtn.id = 'tutorial-open';
tutorialOpenBtn.textContent = '遊び方';
tutorialOpenBtn.tabIndex = -1;
tutorialOpenBtn.addEventListener('focus', () => tutorialOpenBtn.blur());
document.getElementById('game-wrapper').appendChild(tutorialOpenBtn);

function renderTutorialPage() {
  const pg = TUTORIAL_PAGES[tutorialIdx];
  document.getElementById('tutorial-title').textContent = pg.title;
  const text = document.getElementById('tutorial-text');
  text.innerHTML = '';
  pg.lines.forEach(l => {
    const p = document.createElement('p');
    p.textContent = l;
    text.appendChild(p);
  });
  const dots = document.getElementById('tutorial-dots');
  dots.innerHTML = '';
  TUTORIAL_PAGES.forEach((_, i) => {
    const d = document.createElement('span');
    d.className = 'tut-dot' + (i === tutorialIdx ? ' on' : '');
    dots.appendChild(d);
  });
  document.getElementById('tut-prev').style.visibility = tutorialIdx === 0 ? 'hidden' : 'visible';
  document.getElementById('tut-next').textContent = tutorialIdx === TUTORIAL_PAGES.length - 1 ? 'はじめる' : '次へ';
  tutorialT = 0;
}

function tutorialLoop() {
  if (tutorialScreen.classList.contains('hidden')) { tutorialRaf = null; return; }
  tutorialT++;
  tutorialScene(tutorialCtx, TUTORIAL_PAGES[tutorialIdx].scene, tutorialT);
  tutorialRaf = requestAnimationFrame(tutorialLoop);
}

function openTutorial() {
  tutorialIdx = 0;
  renderTutorialPage();
  tutorialScreen.classList.remove('hidden');
  if (!tutorialRaf) tutorialRaf = requestAnimationFrame(tutorialLoop);
}

function closeTutorial() {
  tutorialScreen.classList.add('hidden');
  try { localStorage.setItem('wallKickTutorialSeen', '1'); } catch (e) {}
}

document.getElementById('tut-skip').addEventListener('click', closeTutorial);
document.getElementById('tut-prev').addEventListener('click', () => {
  if (tutorialIdx > 0) { tutorialIdx--; renderTutorialPage(); }
});
document.getElementById('tut-next').addEventListener('click', () => {
  if (tutorialIdx < TUTORIAL_PAGES.length - 1) { tutorialIdx++; renderTutorialPage(); }
  else closeTutorial();
});
tutorialOpenBtn.addEventListener('click', openTutorial);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && !tutorialScreen.classList.contains('hidden')) closeTutorial();
});

// 「遊び方」ボタンはタイトル画面にいるときだけ表示
setInterval(() => {
  const visible = !screenTitle.classList.contains('hidden') && tutorialScreen.classList.contains('hidden');
  tutorialOpenBtn.style.display = visible ? 'block' : 'none';
}, 250);

// 初回だけ自動で表示
try {
  if (localStorage.getItem('wallKickTutorialSeen') !== '1') openTutorial();
} catch (e) {}

// ---------- チュートリアルの小さなアニメーション ----------
function tutCube(c, cx, cy, rot, spin) {
  c.save();
  c.translate(cx, cy);
  c.rotate(rot);
  const h = 11;
  c.fillStyle = spin ? '#00F5D4' : '#FFD600';
  c.strokeStyle = '#1E1E24';
  c.lineWidth = 2.5;
  c.fillRect(-h, -h, 22, 22);
  c.strokeRect(-h, -h, 22, 22);
  c.fillStyle = '#FF3B6B';
  c.fillRect(-h + 1, -h + 3, 20, 5);
  c.strokeRect(-h + 1, -h + 3, 20, 5);
  c.fillStyle = '#1E1E24';
  c.fillRect(-1, 0, 3, 5);
  c.fillRect(4, 0, 3, 5);
  c.restore();
}

function tutBat(c, x, y, t) {
  const wing = Math.sin(t * 0.3) * 6;
  c.save();
  c.translate(x, y);
  c.fillStyle = '#6D28D9';
  c.strokeStyle = '#1E1E24';
  c.lineWidth = 2;
  c.beginPath(); c.moveTo(-4, 0); c.quadraticCurveTo(-16, -9 + wing, -20, 2 + wing); c.quadraticCurveTo(-10, 4, -4, 3); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(16, -9 + wing, 20, 2 + wing); c.quadraticCurveTo(10, 4, 4, 3); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#4C1D95';
  c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = '#FACC15';
  c.fillRect(-4, -2, 3, 3);
  c.fillRect(1, -2, 3, 3);
  c.restore();
}

function tutLabel(c, text, x, y, col) {
  c.save();
  c.textAlign = 'center';
  c.font = '900 12px "M PLUS Rounded 1c", sans-serif';
  c.lineWidth = 4;
  c.strokeStyle = '#FFFFFF';
  c.strokeText(text, x, y);
  c.fillStyle = col || '#E11D48';
  c.fillText(text, x, y);
  c.restore();
}

function tutKey(c, label, x, y, pressed) {
  c.save();
  c.fillStyle = pressed ? '#FFD600' : '#FFFFFF';
  c.strokeStyle = '#1E1E24';
  c.lineWidth = 2.5;
  const dy = pressed ? 2 : 0;
  c.fillRect(x - 36, y + dy, 72, 18);
  c.strokeRect(x - 36, y + dy, 72, 18);
  c.textAlign = 'center';
  c.font = '900 11px "M PLUS Rounded 1c", sans-serif';
  c.fillStyle = '#1E1E24';
  c.fillText(label, x, y + 13 + dy);
  c.restore();
}

function tutorialScene(c, scene, t) {
  const W = 300, H = 150, LW = 26, RW = W - 26;
  const ease = (v) => v * v * (3 - 2 * v);
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#FFFDF0';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#E5E0C8';
  for (let y = 8; y < H; y += 16) for (let x = 8; x < W; x += 16) c.fillRect(x, y, 2, 2);

  const scroll = scene === 'kick' ? (t * 0.8) % 40 : 0;
  c.fillStyle = '#0284C7';
  c.fillRect(0, 0, LW, H);
  c.fillRect(RW, 0, 26, H);
  c.fillStyle = '#38BDF8';
  c.fillRect(LW - 5, 0, 5, H);
  c.fillRect(RW, 0, 5, H);
  c.strokeStyle = '#1E1E24';
  c.lineWidth = 2;
  for (let y = -40 + scroll; y < H; y += 40) {
    c.strokeRect(0, y, LW, 40);
    c.strokeRect(RW, y, 26, 40);
  }

  if (scene === 'kick') {
    const u = t % 120;
    const L = LW + 11, R = RW - 11;
    let x, y = 80, rot = 0;
    if (u < 30) { x = L; y = 80 + u * 0.15; }
    else if (u < 60) { const v = (u - 30) / 30; x = L + (R - L) * ease(v); y = 80 - 22 * Math.sin(Math.PI * v); rot = v * 0.8; }
    else if (u < 90) { x = R; y = 80 + (u - 60) * 0.15; }
    else { const v = (u - 90) / 30; x = R + (L - R) * ease(v); y = 80 - 22 * Math.sin(Math.PI * v); rot = -v * 0.8; }
    tutCube(c, x, y, rot, false);
    if ((u > 20 && u < 34) || (u > 80 && u < 94)) tutLabel(c, 'クリック！', x + (u < 60 ? 38 : -38), 60);
  } else if (scene === 'double') {
    const u = t % 110;
    const L = LW + 11, R = RW - 11;
    let x, y, rot = 0;
    if (u < 30) { x = L + (150 - L) * (u / 30) * 0.8; y = 120 - 60 * Math.sin(Math.PI / 2 * u / 30); }
    else if (u < 75) { const v = (u - 30) / 45; x = L + (R - L) * (0.4 + 0.6 * ease(v)); y = 60 - 35 * Math.sin(Math.PI * v); rot = v * 3; }
    else { x = R; y = 60 + (u - 75) * 0.15; }
    if (u >= 30 && u < 48) {
      c.strokeStyle = 'rgba(255,214,0,' + (1 - (u - 30) / 18) + ')';
      c.lineWidth = 3;
      c.beginPath(); c.arc(x, y + 8, 6 + (u - 30), 0, Math.PI * 2); c.stroke();
      tutLabel(c, '2回目！', x, y - 24);
    }
    tutCube(c, x, y, rot, false);
  } else if (scene === 'spin') {
    const u = t % 110;
    const cx = 120, cy = 80;
    const pressed = u >= 45 && u < 58;
    let rot = 0, spin = false;
    if (u >= 45 && u < 75) { const v = (u - 45) / 30; rot = ease(v) * Math.PI * 4; spin = true; }
    if (u < 60) tutBat(c, 280 - u * 1.9, 78 + Math.sin(u * 0.15) * 6, t);
    if (u >= 60 && u < 78) {
      c.strokeStyle = 'rgba(167,85,247,' + (1 - (u - 60) / 18) + ')';
      c.lineWidth = 3;
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4;
        const r0 = 6 + (u - 60), r1 = r0 + 8;
        c.beginPath(); c.moveTo(166 + Math.cos(a) * r0, 80 + Math.sin(a) * r0); c.lineTo(166 + Math.cos(a) * r1, 80 + Math.sin(a) * r1); c.stroke();
      }
    }
    if (spin) {
      c.strokeStyle = '#00D2FF';
      c.lineWidth = 4;
      c.beginPath(); c.arc(cx, cy, 24, t * 0.4, t * 0.4 + Math.PI * 1.4); c.stroke();
    }
    tutCube(c, cx, cy, rot, spin);
    tutKey(c, 'SPACE', 150, 122, pressed);
  } else if (scene === 'danger') {
    c.fillStyle = '#FF2A55';
    c.strokeStyle = '#1E1E24';
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const sy = 30 + i * 18;
      c.beginPath(); c.moveTo(LW, sy); c.lineTo(LW + 22, sy + 9); c.lineTo(LW, sy + 18); c.closePath(); c.fill(); c.stroke();
    }
    tutLabel(c, 'トゲ', LW + 40, 112);
    tutBat(c, 190, 46 + Math.sin(t * 0.08) * 8, t);
    tutLabel(c, 'コウモリ', 190, 78);
    c.strokeStyle = 'rgba(255,42,85,' + (0.45 + 0.4 * Math.abs(Math.sin(t * 0.15))) + ')';
    c.lineWidth = 3;
    c.setLineDash([10, 6]);
    c.beginPath(); c.moveTo(LW, 100); c.lineTo(RW, 100); c.stroke();
    c.setLineDash([]);
    tutLabel(c, '赤い線は予告！', 200, 118);
    tutCube(c, RW - 11, 62 + Math.sin(t * 0.05) * 3, 0, false);
  } else {
    const u = t % 140;
    const bx = 150, by = 32;
    const flash = u >= 85 && u < 100 && Math.floor(u / 3) % 2 === 0;
    c.save();
    c.translate(bx, by);
    c.fillStyle = '#FFD600'; c.strokeStyle = '#1E1E24'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-24, -16); c.lineTo(-32, -30); c.lineTo(-10, -16); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(24, -16); c.lineTo(32, -30); c.lineTo(10, -16); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = flash ? '#FFFFFF' : '#FF3B6B';
    c.fillRect(-30, -17, 60, 34); c.strokeRect(-30, -17, 60, 34);
    c.fillStyle = '#1E1E24';
    c.fillRect(-18, -6, 10, 7); c.fillRect(8, -6, 10, 7);
    c.restore();
    const cx = 150, cy = 118;
    let rot = 0, spin = false;
    if (u >= 40 && u < 70) { const v = (u - 40) / 30; rot = ease(v) * Math.PI * 4; spin = true; }
    if (spin) {
      c.strokeStyle = '#00D2FF'; c.lineWidth = 4;
      c.beginPath(); c.arc(cx, cy, 24, t * 0.4, t * 0.4 + Math.PI * 1.4); c.stroke();
    }
    if (u < 50) {
      const oy = 56 + (cy - 20 - 56) * (u / 50);
      c.fillStyle = '#FF3B6B'; c.strokeStyle = '#1E1E24'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(150, oy, 8, 0, Math.PI * 2); c.fill(); c.stroke();
    } else if (u < 85) {
      const oy = (cy - 20) - (cy - 20 - 56) * ((u - 50) / 35);
      c.fillStyle = '#00E676'; c.strokeStyle = '#1E1E24'; c.lineWidth = 2.5;
      c.beginPath(); c.arc(150, oy, 8, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    if (u >= 50 && u < 70) tutLabel(c, '弾き返せ！', 210, 100, '#059669');
    if (u >= 85 && u < 110) tutLabel(c, 'ヒット！', 210, 40, '#E11D48');
    tutCube(c, cx, cy, rot, spin);
  }
}
"""

out = html[:css.start()] + '<link rel="stylesheet" href="style.css">' + html[css.end():]
m = re.search(r"<script>(.*)</script>", out, re.S)
out = out[:m.start()] + '<script src="game.js"></script>' + out[m.end():]

# 表示上の数を更新（ストーリー 47+60+24=131話 / 忍者スキン 13 / 剣 12）
for old, new in [("使用後1.5秒制限", "使用後1秒制限"), ("全103話", "全131話"), ("世界篇 (50)", "世界篇 (60)"), ("宇宙編 (6)", "宇宙編 (24)"),
                 ("忍者スキン (8)", "忍者スキン (13)"), ("剣・ブレード (8)", "剣・ブレード (12)")]:
    if old in out:
        out = out.replace(old, new)
    else:
        print("注意: 表示を更新できませんでした: " + old)

tab_old = "剣・ブレード (12)</button>"
tab_new = tab_old + "\n      <button id=\"shop-tab-jutsu\" class=\"shop-tab\" onclick=\"switchShopTab('jutsu')\">忍術 (3)</button>"
if tab_old in out:
    out = out.replace(tab_old, tab_new)
else:
    print("注意: 忍術タブを追加できませんでした")

open("index.html", "w", encoding="utf-8").write(out)
open("style.css", "w", encoding="utf-8").write(css.group(1).strip("\n") + "\n" + EXTRA_CSS)
game_js = js.group(1).strip("\n")

# ボス描画: GIFがあればGIFを描き、無ければ従来の描画をそのまま実行する
OPEN = "ctx.translate(bx, by);"
CLOSE = "ctx.strokeRect(-22, 12, 44, 10);"
if game_js.count(OPEN) != 1 or game_js.count(CLOSE) != 1:
    sys.exit("ボス描画部分が見つかりません（元のコードが変更されている可能性があります）")
game_js = game_js.replace(OPEN, OPEN + """
        const bossGif = getBossGif(activeBoss.name);
        if (bossGif) {
          const gh = 112;
          const gw = gh * bossGif.naturalWidth / bossGif.naturalHeight;
          bossGifDraw = {
            name: activeBoss.name,
            src: bossGif.currentSrc,
            x: bx - gw / 2,
            y: by - gh / 2,
            w: gw,
            h: gh,
            flash: activeBoss.hitFlash > 0 && activeBoss.hitFlash % 4 < 2
          };
        }
        if (!bossGif) {""")
game_js = game_js.replace(CLOSE, CLOSE + "\n        }")

# ボス攻撃: パターン番号の決め方だけをボスごとの順番表に差し替える
# （0〜2は元の攻撃のまま、3以降は追加攻撃）
PAT_A = "const pattern = activeBoss.attackPatternIndex % 3;"
PAT_B = "if (pattern === 0) {"
if game_js.count(PAT_A) != 1 or game_js.count(PAT_B) != 1:
    sys.exit("ボス攻撃部分が見つかりません（元のコードが変更されている可能性があります）")
game_js = game_js.replace(PAT_A, "const pattern = pickBossPattern(activeBoss);")
game_js = game_js.replace(
    PAT_B,
    "if (pattern >= 3) { extraBossAttack(pattern, activeBoss, pCenterX, pCenterY); } else if (pattern === 0) {")

# ボスごとの色: 弾・レーザーの色を、そのボスのテーマ色に差し替える
# 必須（見つからなければ中止）
COLOR_REQUIRED = [
    ("ctx.fillStyle = proj.reflected ? '#00E676' : '#FF3B6B';",
     "ctx.fillStyle = proj.reflected ? '#00E676' : bossTheme().orb;"),
    ("ctx.strokeStyle = 'rgba(255, 42, 85, 0.75)';",
     "ctx.strokeStyle = bossTheme().guide;"),
    ("ctx.fillRect(lz.x - 18, startScreenY, 36, canvas.height - startScreenY);",
     "ctx.fillStyle = bossTheme().glow; ctx.fillRect(lz.x - 18, startScreenY, 36, canvas.height - startScreenY);"),
    ("ctx.fillRect(lz.x - 10, startScreenY, 20, canvas.height - startScreenY);",
     "ctx.fillStyle = bossTheme().beam; ctx.fillRect(lz.x - 10, startScreenY, 20, canvas.height - startScreenY);"),
]
for old, new in COLOR_REQUIRED:
    if game_js.count(old) != 1:
        sys.exit("色を変える部分が見つかりません: " + old)
    game_js = game_js.replace(old, new)

# 任意（見つかった場合だけ差し替える）
COLOR_OPTIONAL = [
    ("ctx.fillStyle = '#A855F7';", "ctx.fillStyle = proj.reflected ? '#00E676' : bossTheme().spread;"),
    ("ctx.fillStyle = activeBoss.hitFlash > 0 ? '#FFFFFF' : '#FF3B6B';",
     "ctx.fillStyle = activeBoss.hitFlash > 0 ? '#FFFFFF' : bossTheme().body;"),
]
for old, new in COLOR_OPTIONAL:
    if game_js.count(old) == 1:
        game_js = game_js.replace(old, new)
    else:
        print("注意: 次の色は自動で差し替えられませんでした（元のまま）: " + old)

# ボス戦エリアには障害物・コウモリ・アーチャー・雪だるま・鳥を置かない
BOSS_AREA_PATCHES = [
    # ボス手前まで（ボス戦の画面に入る範囲）はトゲ・コウモリを生成しない
    ("generateSegment(420, goalY + 240, config);",
     "generateSegment(420, goalY + ((config.isStory && config.storyInfo.boss) ? 640 : 240), config);"),
    # 鳥はボスの手前から出さない
    ("(player.y - goalY < 260)",
     "(player.y - goalY < (activeBoss ? 700 : 260))"),
    # アーチャー・雪だるまもボス戦エリアでは出さない
    ("(!activeBoss || !activeBoss.active) && Math.random()",
     "(!activeBoss || player.y - goalY >= 700) && Math.random()"),
    # ボス戦が始まった時点で、残っている鳥・妨害キャラ・その弾を消す
    ("activeBoss.active = true;",
     "activeBoss.active = true; birds = []; ambusherEnemies = []; "
     "projectiles = projectiles.filter(p => p.type === 'bossOrb' || p.type === 'bossSpread');"),
]
BOSS_AREA_PATCHES += [
    # 弾き返した小さい弾はプレイヤーに当たらない
    ("if (dist < proj.radius + (player.size / 2 - 3)) {",
     "if (!proj.reflected && dist < proj.radius + (player.size / 2 - 3)) {"),
    # 回転攻撃の使用後の制限を 1.5秒 から 1秒 に短縮（ゲージの計算も合わせる）
    ("player.lockoutTimer = 90;", "player.lockoutTimer = 60;"),
    ("const ratio = player.lockoutTimer / 90;", "const ratio = player.lockoutTimer / 60;"),
]
for old, new in BOSS_AREA_PATCHES:
    if game_js.count(old) != 1:
        sys.exit("ボス戦エリアの処理が見つかりません: " + old)
    game_js = game_js.replace(old, new)

open("game.js", "w", encoding="utf-8").write(game_js + "\n" + EXTRA_JS)
print("index.html / style.css / game.js を出力しました")

# 追加機能（split2.py: ボス攻撃の本格化・忍具 / split3.py: ボス攻撃 v2）。同じフォルダにあれば順に自動で適用する
import os, subprocess
_here = os.path.dirname(os.path.abspath(__file__))
for _name in ("split2.py", "split3.py"):
    if os.path.exists(os.path.join(_here, _name)):
        subprocess.run([sys.executable, os.path.join(_here, _name)], check=False)