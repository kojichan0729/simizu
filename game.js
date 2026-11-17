  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // 角丸矩形の安全な描画ヘルパー（非対応ブラウザ対策）
  function drawRoundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    }
  }

  // UI要素
  const screenTitle = document.getElementById('screen-title');
  const screenPractice = document.getElementById('screen-practice');
  const screenSkin = document.getElementById('screen-skin');
  const screenStory = document.getElementById('screen-story');
  const screenResult = document.getElementById('screen-result');
  const hud = document.getElementById('hud');
  const bossHud = document.getElementById('boss-hud');
  const hudStage = document.getElementById('hud-stage');
  const hudHeight = document.getElementById('hud-height');
  const hudKicks = document.getElementById('hud-kicks');
  const titleBestRecordEl = document.getElementById('title-best-record');
  const newRecordTag = document.getElementById('new-record-tag');

  // 最高記録の読み込み
  let bestRecord = parseInt(localStorage.getItem('wallKickBestRecord') || '0', 10);
  titleBestRecordEl.textContent = `${bestRecord}m`;

  // ストーリー進行状況の読み込み
  let storyProgress = JSON.parse(localStorage.getItem('wallKickStoryProgress') || '{"japan":0,"world":0,"space":0}');

  // Web Audio API 効果音ジェネレーター
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function playSound(type) {
    try {
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      const now = audioCtx.currentTime;

      if (type === 'kick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'doubleKick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.11);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
        osc.start(now);
        osc.stop(now + 0.11);
      } else if (type === 'spin') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.14);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'deflect') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1480, now + 0.12);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'batKill') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.16);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'clash') {
        // 鍔迫り合い（ギィーン！）の金属摩擦音
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1450, now);
        osc.frequency.linearRampToValueAtTime(920, now + 0.18);
        osc.frequency.linearRampToValueAtTime(1620, now + 0.36);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.48);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.48);
        osc.start(now);
        osc.stop(now + 0.48);
      } else if (type === 'laserWarn') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(760, now);
        osc.frequency.linearRampToValueAtTime(1140, now + 0.25);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'laserFire') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(95, now + 0.22);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'land') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'birdWarn') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.06);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'arrow') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.11);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
        osc.start(now);
        osc.stop(now + 0.11);
      } else if (type === 'snowball') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.09);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'bossDamage') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.06);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'clear') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {}
  }

  // ==========================================
  // 忍者スキン＆剣スキン独立定義（コインで別々に解放・装備）
  // ==========================================
  const SKINS = [
    {
      id: 'normal',
      name: 'ノーマル忍者',
      price: 0,
      bodyColor: '#FFD600',
      usedColor: '#FF9E00',
      bandColor: '#FF3B6B',
      eyeColor: '#1E1E24',
      trailColor: '#00D2FF',
      crown: false
    },
    {
      id: 'shadow',
      name: 'シャドウ暗殺者',
      price: 15,
      bodyColor: '#1E293B',
      usedColor: '#0F172A',
      bandColor: '#EF4444',
      eyeColor: '#38BDF8',
      trailColor: '#64748B',
      crown: false
    },
    {
      id: 'slime',
      name: 'エメラルド精霊',
      price: 30,
      bodyColor: '#10B981',
      usedColor: '#059669',
      bandColor: '#FDE047',
      eyeColor: '#1E1E24',
      trailColor: '#34D399',
      crown: false
    },
    {
      id: 'sakura',
      name: '桜花剣豪',
      price: 50,
      bodyColor: '#FF85A1',
      usedColor: '#FBB1BD',
      bandColor: '#FFFFFF',
      eyeColor: '#590D22',
      trailColor: '#FF477E',
      crown: false
    },
    {
      id: 'cyber',
      name: 'サイバーナイト',
      price: 80,
      bodyColor: '#00F5D4',
      usedColor: '#00BBF9',
      bandColor: '#7209B7',
      eyeColor: '#1E1E24',
      trailColor: '#F72585',
      crown: false
    },
    {
      id: 'king',
      name: 'ゴールデン王様',
      price: 120,
      bodyColor: '#FACC15',
      usedColor: '#EAB308',
      bandColor: '#DC2626',
      eyeColor: '#1E1E24',
      trailColor: '#FDE047',
      crown: true
    },
    {
      id: 'crimson',
      name: 'クリムゾン龍神',
      price: 180,
      bodyColor: '#DC2626',
      usedColor: '#991B1B',
      bandColor: '#FACC15',
      eyeColor: '#FEF08A',
      trailColor: '#FB923C',
      crown: true
    },
    {
      id: 'cosmos',
      name: 'コスモ皇帝',
      price: 250,
      bodyColor: '#312E81',
      usedColor: '#1E1B4B',
      bandColor: '#38BDF8',
      eyeColor: '#FDE047',
      trailColor: '#C084FC',
      crown: true
    }
  ];

  const SWORDS = [
    {
      id: 'wooden',
      name: '見習いの竹刀',
      price: 0,
      batKillRate: 0.10,
      bladeColor: '#D97706',
      edgeColor: '#FDE68A',
      hiltColor: '#78350F',
      glowColor: '#FBBF24'
    },
    {
      id: 'iron',
      name: '忍刀・疾風',
      price: 15,
      batKillRate: 0.22,
      bladeColor: '#CBD5E1',
      edgeColor: '#FFFFFF',
      hiltColor: '#FF3B6B',
      glowColor: '#00D2FF'
    },
    {
      id: 'muramasa',
      name: '妖刀ムラマサ',
      price: 35,
      batKillRate: 0.35,
      bladeColor: '#4C1D95',
      edgeColor: '#F43F5E',
      hiltColor: '#FACC15',
      glowColor: '#F43F5E'
    },
    {
      id: 'emerald',
      name: '翠玉の聖剣',
      price: 60,
      batKillRate: 0.50,
      bladeColor: '#10B981',
      edgeColor: '#ECFDF5',
      hiltColor: '#D97706',
      glowColor: '#34D399'
    },
    {
      id: 'sakuraBlade',
      name: '桜吹雪の太刀',
      price: 90,
      batKillRate: 0.65,
      bladeColor: '#FFE4E6',
      edgeColor: '#FF477E',
      hiltColor: '#9D174D',
      glowColor: '#FF85A1'
    },
    {
      id: 'plasma',
      name: 'プラズマブレード',
      price: 130,
      batKillRate: 0.78,
      bladeColor: '#F72585',
      edgeColor: '#FFFFFF',
      hiltColor: '#1E1E24',
      glowColor: '#00F5D4'
    },
    {
      id: 'excalibur',
      name: '聖剣エクスカリバー',
      price: 190,
      batKillRate: 0.90,
      bladeColor: '#FEF08A',
      edgeColor: '#FFFFFF',
      hiltColor: '#2563EB',
      glowColor: '#FACC15'
    },
    {
      id: 'galaxy',
      name: '創世神剣・アルテマコスモス',
      price: 500,
      batKillRate: 1.00,
      isUltimate: true,
      bladeColor: '#FACC15',
      edgeColor: '#FFFFFF',
      hiltColor: '#7C3AED',
      glowColor: '#FDE047'
    }
  ];

  // ==========================================
  // 8種類の高精細SVG剣イラスト＆Canvas用イメージ生成
  // ==========================================
  const SWORD_SVGS = {
    wooden: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="woodGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F59E0B"/>
          <stop offset="50%" stop-color="#D97706"/>
          <stop offset="100%" stop-color="#92400E"/>
        </linearGradient>
      </defs>
      <g transform="rotate(-45 32 32)">
        <!-- 柄（白革巻き） -->
        <rect x="28.5" y="45" width="7" height="15" rx="1.5" fill="#F8FAFC" stroke="#1E1E24" stroke-width="2"/>
        <path d="M28.5 49 L35.5 52 M28.5 54 L35.5 57" stroke="#CBD5E1" stroke-width="1.5"/>
        <!-- ツバ（黒革） -->
        <ellipse cx="32" cy="44" rx="7" ry="2.2" fill="#334155" stroke="#1E1E24" stroke-width="2"/>
        <!-- 竹刀本体 -->
        <path d="M29 43 L29.8 8 L34.2 8 L35 43 Z" fill="url(#woodGrad)" stroke="#1E1E24" stroke-width="2"/>
        <!-- 節と中結い革 -->
        <rect x="29.3" y="22" width="5.4" height="3.5" fill="#F8FAFC" stroke="#1E1E24" stroke-width="1.5"/>
        <line x1="29.2" y1="32" x2="34.8" y2="32" stroke="#78350F" stroke-width="1.8"/>
        <!-- 先革 -->
        <path d="M29.8 8 Q32 4 34.2 8 L34.4 12 L29.6 12 Z" fill="#FFFFFF" stroke="#1E1E24" stroke-width="1.8"/>
      </g>
    </svg>`,

    iron: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="steelGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#94A3B8"/>
          <stop offset="55%" stop-color="#E2E8F0"/>
          <stop offset="100%" stop-color="#FFFFFF"/>
        </linearGradient>
      </defs>
      <g transform="rotate(-45 32 32)">
        <!-- 柄頭＆柄 -->
        <rect x="29" y="46" width="6" height="14" rx="1" fill="#1E293B" stroke="#1E1E24" stroke-width="2"/>
        <path d="M29 48 L35 51 L29 54 L35 57" fill="none" stroke="#FF3B6B" stroke-width="2"/>
        <!-- 忍鍔（四角鉄鍔） -->
        <rect x="24" y="43" width="16" height="3.5" rx="1" fill="#334155" stroke="#1E1E24" stroke-width="2"/>
        <!-- 刀身（直刀・切先） -->
        <path d="M29.2 43 L29.2 11 L32 4 L34.8 12 L34.8 43 Z" fill="url(#steelGrad)" stroke="#1E1E24" stroke-width="2"/>
        <!-- 刃文ハイライト -->
        <path d="M33.2 42 L33.2 12 L32 6" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
      </g>
    </svg>`,

    muramasa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="muraBlade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#3B0764"/>
          <stop offset="60%" stop-color="#BE123C"/>
          <stop offset="100%" stop-color="#FDA4AF"/>
        </linearGradient>
      </defs>
      <g transform="rotate(-45 32 32)">
        <!-- 妖刀の柄 -->
        <rect x="29" y="46" width="6" height="14" rx="1" fill="#4C1D95" stroke="#1E1E24" stroke-width="2"/>
        <path d="M29 48 L35 51 L29 54 L35 57" fill="none" stroke="#FACC15" stroke-width="2"/>
        <!-- 黄金の彫金丸鍔 -->
        <ellipse cx="32" cy="44.5" rx="8.5" ry="2.6" fill="#FACC15" stroke="#1E1E24" stroke-width="2"/>
        <!-- 反りのある妖刀身 -->
        <path d="M29 43 Q27 25 30 5 Q34 10 35 43 Z" fill="url(#muraBlade)" stroke="#1E1E24" stroke-width="2"/>
        <!-- 紅蓮の刃文 -->
        <path d="M33 41 Q32 35 33.5 30 Q31.5 25 33.5 20 Q31.5 15 32.5 9" fill="none" stroke="#FFE4E6" stroke-width="1.6"/>
      </g>
    </svg>`,

    emerald: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="emeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#047857"/>
          <stop offset="50%" stop-color="#10B981"/>
          <stop offset="100%" stop-color="#A7F3D0"/>
        </linearGradient>
      </defs>
      <g transform="rotate(-45 32 32)">
        <!-- 黄金ポメル＆柄 -->
        <circle cx="32" cy="59" r="3.5" fill="#FACC15" stroke="#1E1E24" stroke-width="2"/>
        <rect x="29.2" y="46" width="5.6" height="11" fill="#064E3B" stroke="#1E1E24" stroke-width="2"/>
        <!-- 黄金クロスガード -->
        <path d="M21 43 L26 46 L38 46 L43 43 L37 42 L27 42 Z" fill="#FACC15" stroke="#1E1E24" stroke-width="2"/>
        <!-- 翠玉の双刃 -->
        <path d="M27.5 42 L28.5 12 L32 4 L35.5 12 L36.5 42 Z" fill="url(#emeGrad)" stroke="#1E1E24" stroke-width="2"/>
        <!-- 中央の黄金稜線と宝玉 -->
        <line x1="32" y1="39" x2="32" y2="9" stroke="#ECFDF5" stroke-width="2"/>
        <polygon points="32,41 34.5,44 32,47 29.5,44" fill="#34D399" stroke="#1E1E24" stroke-width="1.5"/>
      </g>
    </svg>`,

    sakuraBlade: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="sakuraGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#F43F5E"/>
          <stop offset="55%" stop-color="#FBCFE8"/>
          <stop offset="100%" stop-color="#FFFFFF"/>
        </linearGradient>
      </defs>
      <g transform="rotate(-45 32 32)">
        <!-- 桜色の柄 -->
        <rect x="29" y="46" width="6" height="14" rx="1.5" fill="#9D174D" stroke="#1E1E24" stroke-width="2"/>
        <path d="M29 48 L35 51 L29 54 L35 57" fill="none" stroke="#FBCFE8" stroke-width="1.8"/>
        <!-- 桜花鍔 -->
        <ellipse cx="32" cy="44.5" rx="8.5" ry="2.8" fill="#FF477E" stroke="#1E1E24" stroke-width="2"/>
        <!-- 優美な反り刀身 -->
        <path d="M29.2 43 Q27.5 24 30.5 5 Q34.5 11 34.8 43 Z" fill="url(#sakuraGrad)" stroke="#1E1E24" stroke-width="2"/>
        <!-- 舞う花びら装飾 -->
        <ellipse cx="22" cy="24" rx="3" ry="1.8" transform="rotate(-25 22 24)" fill="#FF85A1" stroke="#9D174D" stroke-width="1"/>
        <ellipse cx="42" cy="17" rx="2.8" ry="1.6" transform="rotate(30 42 17)" fill="#FBCFE8" stroke="#9D174D" stroke-width="1"/>
      </g>
    </svg>`,

    plasma: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="plasmaBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#F72585"/>
          <stop offset="50%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#00F5D4"/>
        </linearGradient>
      </defs>
      <g transform="rotate(-45 32 32)">
        <!-- サイバーグリップ -->
        <rect x="28" y="44" width="8" height="16" rx="2" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
        <rect x="26.5" y="42" width="11" height="4" rx="1" fill="#64748B" stroke="#0F172A" stroke-width="2"/>
        <rect x="30.5" y="48" width="3" height="8" rx="1" fill="#00F5D4"/>
        <!-- 外側ネオンオーラ刃 -->
        <rect x="27" y="4" width="10" height="38" rx="5" fill="#F72585" opacity="0.55"/>
        <!-- 高出力プラズマ光刃 -->
        <rect x="29" y="6" width="6" height="36" rx="3" fill="url(#plasmaBeam)" stroke="#FFFFFF" stroke-width="1.2"/>
      </g>
    </svg>`,

    excalibur: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="excalGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#EAB308"/>
          <stop offset="50%" stop-color="#FEF9C3"/>
          <stop offset="100%" stop-color="#FFFFFF"/>
        </linearGradient>
      </defs>
      <g transform="rotate(-45 32 32)">
        <!-- 王家のポメル＆グリップ -->
        <circle cx="32" cy="59.5" r="3.8" fill="#FACC15" stroke="#1E1E24" stroke-width="2"/>
        <rect x="29" y="46" width="6" height="11" fill="#1D4ED8" stroke="#1E1E24" stroke-width="2"/>
        <!-- 翼型聖騎士ガード -->
        <path d="M18 41 L25 46.5 L39 46.5 L46 41 L38 42.5 L26 42.5 Z" fill="#2563EB" stroke="#1E1E24" stroke-width="2"/>
        <!-- 黄金と白銀の聖剣身 -->
        <path d="M27 42.5 L28 11 L32 3 L36 11 L37 42.5 Z" fill="url(#excalGrad)" stroke="#1E1E24" stroke-width="2"/>
        <!-- 聖なる青の溝（フラー） -->
        <rect x="30.8" y="13" width="2.4" height="26" rx="1" fill="#2563EB"/>
        <!-- ガード中央の太陽宝玉 -->
        <circle cx="32" cy="44.2" r="3" fill="#FACC15" stroke="#1E1E24" stroke-width="1.5"/>
      </g>
    </svg>`,

    galaxy: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="ultBlade" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="#F59E0B"/>
          <stop offset="30%" stop-color="#EC4899"/>
          <stop offset="65%" stop-color="#38BDF8"/>
          <stop offset="100%" stop-color="#FFFFFF"/>
        </linearGradient>
        <linearGradient id="ultGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FEF08A"/>
          <stop offset="50%" stop-color="#FACC15"/>
          <stop offset="100%" stop-color="#B45309"/>
        </linearGradient>
      </defs>
      <g transform="rotate(-45 32 32)">
        <!-- 後光リング -->
        <circle cx="32" cy="43" r="14" fill="none" stroke="#FDE047" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.9"/>
        <!-- 創世の宝玉ポメル -->
        <polygon points="32,63 37,58.5 32,54 27,58.5" fill="#38BDF8" stroke="#1E1E24" stroke-width="1.8"/>
        <!-- 黄金王家のグリップ -->
        <rect x="28.8" y="46" width="6.4" height="9" fill="url(#ultGold)" stroke="#1E1E24" stroke-width="2"/>
        <!-- 大天使の翼クロスガード -->
        <path d="M11 36 L22 46.5 L42 46.5 L53 36 L44 39 L38 42 L26 42 L20 39 Z" fill="url(#ultGold)" stroke="#1E1E24" stroke-width="2"/>
        <!-- 宇宙光刃の広幅ブレード -->
        <path d="M25.5 42 L27 10 L32 1.5 L37 10 L38.5 42 Z" fill="url(#ultBlade)" stroke="#1E1E24" stroke-width="2"/>
        <!-- 黄金の中央稜線と三連宝玉 -->
        <line x1="32" y1="39" x2="32" y2="6" stroke="#FFFFFF" stroke-width="2.4"/>
        <circle cx="32" cy="44" r="3.4" fill="#F43F5E" stroke="#1E1E24" stroke-width="1.5"/>
        <polygon points="32,25 34.8,28.5 32,32 29.2,28.5" fill="#FEF08A" stroke="#1E1E24" stroke-width="1"/>
        <polygon points="32,13 34.2,16 32,19 29.8,16" fill="#FFFFFF"/>
        <!-- 周回する聖星オーブ -->
        <polygon points="17,22 19.5,25.5 17,29 14.5,25.5" fill="#38BDF8" stroke="#1E1E24" stroke-width="1.2"/>
        <polygon points="47,16 49.5,19.5 47,23 44.5,19.5" fill="#FDE047" stroke="#1E1E24" stroke-width="1.2"/>
      </g>
    </svg>`
  };

  // Canvas描画用にSVG文字列をImageオブジェクトへ事前変換
  const SWORD_IMAGES = {};
  Object.keys(SWORD_SVGS).forEach(id => {
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(SWORD_SVGS[id]);
    SWORD_IMAGES[id] = img;
  });

  // Canvas上で剣のSVG画像を描画するヘルパー（発光オーラ＆大型描画で視認性アップ）
  function drawSwordGraphic(sword, length) {
    const img = SWORD_IMAGES[sword.id];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.shadowColor = sword.glowColor;
      ctx.shadowBlur = sword.isUltimate ? 16 : 9;
      // SVGは右上（-45度）向きなので、+45度回転させて右方向（0度）に合わせる
      ctx.rotate(Math.PI / 4);
      const size = length * 1.48;
      ctx.drawImage(img, -size * 0.24, -size * 0.76, size, size);
      ctx.restore();
    } else {
      // 読み込み直後のフォールバック描画
      ctx.fillStyle = sword.hiltColor;
      ctx.fillRect(-4, -2.5, 9, 5);
      ctx.fillStyle = sword.bladeColor;
      ctx.strokeStyle = '#1E1E24';
      ctx.lineWidth = 2;
      ctx.fillRect(5, -4, length - 5, 8);
      ctx.strokeRect(5, -4, length - 5, 8);
    }
  }

  let totalCoins = parseInt(localStorage.getItem('wallKickTotalCoins') || '0', 10);
  let unlockedSkins = JSON.parse(localStorage.getItem('wallKickUnlockedSkins') || '["normal"]');
  let selectedSkinId = localStorage.getItem('wallKickSelectedSkin') || 'normal';
  let unlockedSwords = JSON.parse(localStorage.getItem('wallKickUnlockedSwords') || '["wooden"]');
  let selectedSwordId = localStorage.getItem('wallKickSelectedSword') || 'wooden';
  let currentShopTab = 'ninja';

  function saveCoinAndSkinData() {
    localStorage.setItem('wallKickTotalCoins', String(totalCoins));
    localStorage.setItem('wallKickUnlockedSkins', JSON.stringify(unlockedSkins));
    localStorage.setItem('wallKickSelectedSkin', selectedSkinId);
    localStorage.setItem('wallKickUnlockedSwords', JSON.stringify(unlockedSwords));
    localStorage.setItem('wallKickSelectedSword', selectedSwordId);
    document.getElementById('title-total-coins').textContent = totalCoins;
    const shopCoinEl = document.getElementById('shop-total-coins');
    if (shopCoinEl) shopCoinEl.textContent = totalCoins;
    updateTitleEquipTag();
  }

  function getCurrentSkin() {
    return SKINS.find(s => s.id === selectedSkinId) || SKINS[0];
  }

  function getCurrentSword() {
    return SWORDS.find(s => s.id === selectedSwordId) || SWORDS[0];
  }

  function updateTitleEquipTag() {
    const sk = getCurrentSkin();
    const sw = getCurrentSword();
    document.getElementById('title-skin-tag').textContent = `${sk.name} / 撃破${Math.round(sw.batKillRate * 100)}%`;
    const homeNinjaEl = document.getElementById('home-ninja-name');
    const homeSwordEl = document.getElementById('home-sword-name');
    if (homeNinjaEl) homeNinjaEl.textContent = sk.name;
    if (homeSwordEl) homeSwordEl.textContent = `${sw.name} (撃破${Math.round(sw.batKillRate * 100)}%)`;
    drawHomeCharacterPreview();
  }

  // ホーム画面用の装備キャラクター（忍者＋背中の剣）プレビュー描画
  function drawHomeCharacterPreview() {
    const hCanvas = document.getElementById('home-char-canvas');
    if (!hCanvas) return;
    const hCtx = hCanvas.getContext('2d');
    const sk = getCurrentSkin();
    const sw = getCurrentSword();

    hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);

    const cx = 36;
    const cy = 38;
    const size = 28;
    const half = size / 2;

    hCtx.save();
    // 背中に斜めに装備した剣（大きく目立つように描画）
    hCtx.save();
    hCtx.translate(-(half - 2), 3);
    hCtx.rotate(-Math.PI * 0.65);
    const img = SWORD_IMAGES[sw.id];
    if (img && img.complete && img.naturalWidth > 0) {
      hCtx.save();
      hCtx.shadowColor = sw.glowColor;
      hCtx.shadowBlur = sw.isUltimate ? 12 : 6;
      hCtx.rotate(Math.PI / 4);
      const sSize = 48;
      hCtx.drawImage(img, -sSize * 0.24, -sSize * 0.76, sSize, sSize);
      hCtx.restore();
    } else {
      hCtx.fillStyle = sw.bladeColor;
      hCtx.fillRect(0, -3.5, 34, 7);
    }
    hCtx.restore();

    // ハチマキの尾
    hCtx.fillStyle = sk.bandColor;
    hCtx.strokeStyle = '#1E1E24';
    hCtx.lineWidth = 2.5;
    hCtx.beginPath();
    hCtx.moveTo(-(half - 2), -half + 6);
    hCtx.lineTo(-(half + 14), -half + 3);
    hCtx.lineTo(-(half + 11), -half + 12);
    hCtx.closePath();
    hCtx.fill();
    hCtx.stroke();

    // 手足
    hCtx.fillStyle = '#1E1E24';
    hCtx.fillRect(-half - 3, 2, 4, 6);
    hCtx.fillRect(half - 1, -4, 4, 6);

    // 本体キューブ
    hCtx.fillStyle = sk.bodyColor;
    hCtx.beginPath();
    if (typeof hCtx.roundRect === 'function') {
      hCtx.roundRect(-half, -half, size, size, 4);
    } else {
      hCtx.rect(-half, -half, size, size);
    }
    hCtx.fill();
    hCtx.stroke();

    // 王冠装飾
    if (sk.crown) {
      hCtx.fillStyle = '#FFD600';
      hCtx.beginPath();
      hCtx.moveTo(-8, -half);
      hCtx.lineTo(-8, -half - 8);
      hCtx.lineTo(-3, -half - 4);
      hCtx.lineTo(0, -half - 9);
      hCtx.lineTo(3, -half - 4);
      hCtx.lineTo(8, -half - 8);
      hCtx.lineTo(8, -half);
      hCtx.closePath();
      hCtx.fill();
      hCtx.stroke();
    }

    // ハチマキ本体
    hCtx.fillStyle = sk.bandColor;
    hCtx.fillRect(-half + 1, -half + 4, size - 2, 6);
    hCtx.strokeRect(-half + 1, -half + 4, size - 2, 6);

    // 目
    hCtx.fillStyle = sk.eyeColor;
    hCtx.fillRect(4 - 5, -1, 4, 6);
    hCtx.fillRect(4 + 2, -1, 4, 6);
    hCtx.fillStyle = '#FFFFFF';
    hCtx.fillRect(4 - 4, 0, 1.5, 2);
    hCtx.fillRect(4 + 3, 0, 1.5, 2);

    hCtx.restore();
  }

  // SVG画像ロード完了時にもホーム画面プレビューを再描画
  Object.values(SWORD_IMAGES).forEach(img => {
    img.addEventListener('load', () => {
      if (gameState === 'title') drawHomeCharacterPreview();
    });
  });

  updateTitleEquipTag();
  document.getElementById('title-total-coins').textContent = totalCoins;

  // ==========================================
  // ストーリーモード全103ステージデータ（日本47・世界50・宇宙6）
  // ==========================================
  const STORY_DATA = {
    japan: [
      { name: '北海道', region: '北海道地方', goal: 90, boss: null, trivia: '日本の総面積の約22%を占める広大な大地。実は本州・四国・九州を合わせた面積の約4分の1もあります！' },
      { name: '青森県', region: '東北地方', goal: 95, boss: null, trivia: 'りんごの生産量が日本一（全国の約60%）！ねぶた祭の迫力ある山車でも有名です。' },
      { name: '岩手県', region: '東北地方', goal: 95, boss: null, trivia: '都道府県の中で北海道に次いで2番目に広い面積を持ち、わんこそばや中尊寺金色堂が有名です。' },
      { name: '宮城県', region: '東北地方', goal: 100, boss: null, trivia: '日本三景のひとつ「松島」があり、伊達政宗が築いた仙台城や牛タン焼きが名物です。' },
      { name: '秋田県', region: '東北地方', goal: 100, boss: null, trivia: '日本で最も深い湖「田沢湖（水深423.4m）」があり、冬でも凍らない神秘の湖として知られます。' },
      { name: '山形県', region: '東北地方', goal: 105, boss: null, trivia: 'さくらんぼの生産量が全国の約70%を占めるフルーツ王国。樹氷が見られる蔵王も有名です。' },
      { name: '福島県', region: '東北地方', goal: 110, boss: '赤べこ将軍', trivia: '全国で3番目に広い県で、会津・中通り・浜通りの3つのエリアで気候や文化が大きく異なります。' },
      { name: '茨城県', region: '関東地方', goal: 110, boss: null, trivia: 'メロンの生産量が日本一！日本三名園のひとつ「偕楽園」や袋田の滝があります。' },
      { name: '栃木県', region: '関東地方', goal: 110, boss: null, trivia: 'いちごの生産量が50年以上連続で日本一！世界遺産の日光東照宮も有名です。' },
      { name: '群馬県', region: '関東地方', goal: 115, boss: null, trivia: 'こんにゃく芋の生産量が全国の約90%以上！草津温泉や伊香保温泉など名湯の宝庫です。' },
      { name: '埼玉県', region: '関東地方', goal: 115, boss: null, trivia: '快晴日数が日本トップクラス！川越の「小江戸」の街並みや秩父の自然が人気です。' },
      { name: '千葉県', region: '関東地方', goal: 115, boss: null, trivia: '落花生や梨、醤油の生産量が日本一！日本の空の玄関口である成田国際空港があります。' },
      { name: '東京都', region: '関東地方', goal: 120, boss: null, trivia: '日本の首都であり世界最大級の都市圏。実は小笠原諸島など南の島々も東京都に含まれます。' },
      { name: '神奈川県', region: '関東地方', goal: 125, boss: '大仏ガーディアン', trivia: '日本最大のチャイナタウン「横浜中華街」や、古都・鎌倉、温泉地の箱根など見どころ満載です。' },
      { name: '新潟県', region: '中部地方', goal: 120, boss: null, trivia: 'コシヒカリに代表される日本有数の米どころ！佐渡島は沖縄本島に次いで日本で2番目に大きい離島です。' },
      { name: '富山県', region: '中部地方', goal: 120, boss: null, trivia: '標高3,000m級の立山連峰から水深1,000mの富山湾まで、高低差4,000mのダイナミックな地形を持ちます。' },
      { name: '石川県', region: '中部地方', goal: 125, boss: null, trivia: '日本の金箔の99%以上が金沢で生産されています！兼六園や輪島塗など伝統工芸が盛んです。' },
      { name: '福井県', region: '中部地方', goal: 125, boss: null, trivia: '国内で発見された恐竜化石の約8割が福井県で見つかっており、「恐竜王国」と呼ばれています。' },
      { name: '山梨県', region: '中部地方', goal: 125, boss: null, trivia: 'ぶどう・桃・すももの生産量が日本一！日本最高峰の富士山を静岡県と分け合っています。' },
      { name: '長野県', region: '中部地方', goal: 130, boss: null, trivia: '日本で最も多くの県（8県）と隣接しており、標高3,000m級の山々が連なる「日本の屋根」です。' },
      { name: '岐阜県', region: '中部地方', goal: 130, boss: null, trivia: '世界遺産の白川郷合掌造り集落があり、関市は世界三大刃物産地のひとつとして有名です。' },
      { name: '静岡県', region: '中部地方', goal: 130, boss: null, trivia: 'お茶の生産量が日本一！また、日本のプラモデルの出荷額の約80%以上が静岡県で作られています。' },
      { name: '愛知県', region: '中部地方', goal: 135, boss: '黄金シャチホコ王', trivia: '織田信長・豊臣秀吉・徳川家康の三英傑ゆかりの地。自動車産業を中心とするものづくり王国です。' },
      { name: '三重県', region: '近畿地方', goal: 135, boss: null, trivia: '伊勢神宮や熊野古道など歴史ある聖地が多く、伊賀流忍者の発祥地としても知られています。' },
      { name: '滋賀県', region: '近畿地方', goal: 135, boss: null, trivia: '日本最大の湖「琵琶湖」が県の面積の約6分の1を占めており、約400万年もの歴史を持つ古代湖です。' },
      { name: '京都府', region: '近畿地方', goal: 140, boss: null, trivia: '794年の平安京遷都から1000年以上にわたり日本の都として栄え、17もの世界遺産があります。' },
      { name: '大阪府', region: '近畿地方', goal: 140, boss: null, trivia: '「天下の台所」と呼ばれ、たこ焼き・お好み焼きなどの粉もん文化や笑いの文化が根付いています。' },
      { name: '兵庫県', region: '近畿地方', goal: 140, boss: null, trivia: '日本海と瀬戸内海の両方に面し、世界遺産の姫路城や日本三古湯の有馬温泉があります。' },
      { name: '奈良県', region: '近畿地方', goal: 145, boss: null, trivia: '世界最古の木造建築である法隆寺や、奈良公園の鹿、東大寺の大仏など日本史の原点が集まります。' },
      { name: '和歌山県', region: '近畿地方', goal: 150, boss: '高野山天狗マスター', trivia: 'みかんと梅の生産量が日本一！落差133mで日本一の直瀑「那智の滝」があります。' },
      { name: '鳥取県', region: '中国地方', goal: 145, boss: null, trivia: '日本最大級の海岸砂丘「鳥取砂丘」があり、二十世紀梨や松葉ガニが名物です。' },
      { name: '島根県', region: '中国地方', goal: 150, boss: null, trivia: '縁結びの神様として有名な出雲大社があり、旧暦10月は全国から神様が集まる「神在月」と呼ばれます。' },
      { name: '岡山県', region: '中国地方', goal: 150, boss: null, trivia: '晴れの日が多いことから「晴れの国おかやま」と呼ばれ、桃太郎伝説や白桃・マスカットが有名です。' },
      { name: '広島県', region: '中国地方', goal: 155, boss: null, trivia: '原爆ドームと厳島神社の2つの世界遺産があり、牡蠣やレモンの生産量が日本一です。' },
      { name: '山口県', region: '中国地方', goal: 160, boss: '関門フグ大帝', trivia: '本州の最西端に位置し、日本最大級のカルスト台地「秋吉台」や角島大橋の絶景が人気です。' },
      { name: '徳島県', region: '四国地方', goal: 155, boss: null, trivia: '400年以上の歴史を持つ「阿波おどり」や、世界三大潮流のひとつ「鳴門の渦潮」が有名です。' },
      { name: '香川県', region: '四国地方', goal: 155, boss: null, trivia: '日本で最も面積が小さい県ですが、讃岐うどんの消費量は圧倒的日本一を誇ります。' },
      { name: '愛媛県', region: '四国地方', goal: 160, boss: null, trivia: '日本最古の温泉といわれる「道後温泉」があり、しまなみ海道はサイクリストの聖地です。' },
      { name: '高知県', region: '四国地方', goal: 165, boss: '土佐カツオ将軍', trivia: '坂本龍馬の出身地であり、日本最後の清流と呼ばれる四万十川やカツオのたたきが名物です。' },
      { name: '福岡県', region: '九州・沖縄地方', goal: 160, boss: null, trivia: 'アジアの玄関口として栄え、博多ラーメン・もつ鍋・明太子などグルメの宝庫です。' },
      { name: '佐賀県', region: '九州・沖縄地方', goal: 165, boss: null, trivia: '有田焼・伊万里焼など日本の磁器発祥の地であり、吉野ヶ里遺跡では弥生時代の暮らしが見られます。' },
      { name: '長崎県', region: '九州・沖縄地方', goal: 165, boss: null, trivia: '日本で最も島の数が多い県（約1,479島）！江戸時代には唯一海外に開かれた出島がありました。' },
      { name: '熊本県', region: '九州・沖縄地方', goal: 170, boss: null, trivia: '世界最大級のカルデラを持つ阿蘇山があり、「火の国」と呼ばれています。名水百選も豊富です。' },
      { name: '大分県', region: '九州・沖縄地方', goal: 170, boss: null, trivia: '源泉数・湧出量ともに日本一の「おんせん県」！別府温泉や湯布院温泉が全国から人気を集めます。' },
      { name: '宮崎県', region: '九州・沖縄地方', goal: 175, boss: null, trivia: '日照時間や快晴日数がトップクラスの南国リゾート！マンゴーや地鶏の炭火焼が名物です。' },
      { name: '鹿児島県', region: '九州・沖縄地方', goal: 175, boss: null, trivia: '活火山の桜島や、世界自然遺産の屋久島（樹齢数千年の縄文杉）など雄大な自然が魅力です。' },
      { name: '沖縄県', region: '九州・沖縄地方', goal: 190, boss: '琉球シーサー神', trivia: '日本最南端・最西端の県。独自の琉球王国の歴史とサンゴ礁の美しい海が広がっています！' }
    ],
    world: [
      { name: '韓国', region: 'アジア', goal: 110, boss: null, trivia: '韓国では年齢の数え方や食文化が独特で、キムチは200種類以上あるといわれています。' },
      { name: '中国', region: 'アジア', goal: 115, boss: null, trivia: '総延長2万kmを超える万里の長城は、人類史上最大の建造物として世界遺産に登録されています。' },
      { name: '台湾', region: 'アジア', goal: 115, boss: null, trivia: '世界有数の夜市文化があり、タピオカミルクティー発祥の地としても知られています。' },
      { name: 'モンゴル', region: 'アジア', goal: 120, boss: null, trivia: '人口よりも馬や羊などの家畜の数の方が圧倒的に多く、移動式住居「ゲル」で暮らす遊牧民がいます。' },
      { name: 'ベトナム', region: 'アジア', goal: 120, boss: null, trivia: '世界有数のコーヒー生産国（世界第2位）であり、米粉麺のフォーやバインミーが名物です。' },
      { name: 'タイ', region: 'アジア', goal: 125, boss: null, trivia: 'バンコクの正式名称は世界一長い都市名としてギネス世界記録に認定されています。' },
      { name: 'フィリピン', region: 'アジア', goal: 125, boss: null, trivia: '大小合わせて7,600以上の島々からなる国で、公用語として英語が広く使われています。' },
      { name: 'インドネシア', region: 'アジア', goal: 130, boss: null, trivia: '世界最大の群島国家（約1万7,000島）で、世界最大の花「ラフレシア」が自生しています。' },
      { name: 'シンガポール', region: 'アジア', goal: 130, boss: null, trivia: '東京23区とほぼ同じ広さの都市国家で、マーライオンやマリーナベイ・サンズが象徴です。' },
      { name: 'マレーシア', region: 'アジア', goal: 135, boss: null, trivia: 'ボルネオ島には世界最古級の熱帯雨林が広がり、オランウータンなどの希少動物が生息しています。' },
      { name: 'インド', region: 'アジア', goal: 135, boss: null, trivia: '数字の「0（ゼロ）」の概念が発明された国であり、現在は世界最大の人口を抱えています。' },
      { name: 'ネパール', region: 'アジア', goal: 145, boss: 'ヒマラヤ雪男王', trivia: '世界最高峰エベレスト（標高8,849m）を擁し、国旗が四角形ではない世界で唯一の国です。' },
      { name: 'アラブ首長国連邦', region: '中東', goal: 140, boss: null, trivia: 'ドバイには世界一高い超高層ビル「ブルジュ・ハリファ（高さ828m）」がそびえ立っています。' },
      { name: 'サウジアラビア', region: '中東', goal: 145, boss: null, trivia: '国土の大部分が砂漠であり、一年中流れる川が1本もない国として知られています。' },
      { name: 'トルコ', region: '中東', goal: 150, boss: 'カッパドキア魔人', trivia: 'イスタンブールはアジアとヨーロッパの2つの大陸にまたがる世界で唯一の都市です。' },
      { name: 'ギリシャ', region: 'ヨーロッパ', goal: 145, boss: null, trivia: '古代オリンピック発祥の地であり、パルテノン神殿など西洋文明の源流が数多く残っています。' },
      { name: 'イタリア', region: 'ヨーロッパ', goal: 150, boss: null, trivia: '世界遺産の登録数が世界最多クラスの芸術と美食の国。国土がブーツの形をしています。' },
      { name: 'スペイン', region: 'ヨーロッパ', goal: 150, boss: null, trivia: '140年以上建設が続くサグラダ・ファミリアや、情熱的なフラメンコ、パエリアで有名です。' },
      { name: 'ポルトガル', region: 'ヨーロッパ', goal: 150, boss: null, trivia: 'ユーラシア大陸最西端のロカ岬があり、カステラや天ぷらなど日本に多くの文化を伝えました。' },
      { name: 'フランス', region: 'ヨーロッパ', goal: 155, boss: null, trivia: '世界で最も多くの外国人観光客が訪れる観光大国で、ルーヴル美術館やエッフェル塔が有名です。' },
      { name: 'イギリス', region: 'ヨーロッパ', goal: 155, boss: null, trivia: '世界の時刻の基準となる「グリニッジ標準時（経度0度）」が通る天文台があります。' },
      { name: 'アイルランド', region: 'ヨーロッパ', goal: 155, boss: null, trivia: '「エメラルドの島」と呼ばれる緑豊かな国で、ハロウィンの発祥地ともいわれています。' },
      { name: 'オランダ', region: 'ヨーロッパ', goal: 160, boss: null, trivia: '国土の約4分の1が海面よりも低い位置にあり、風車とチューリップ、自転車大国として有名です。' },
      { name: 'ベルギー', region: 'ヨーロッパ', goal: 160, boss: null, trivia: 'ベルギーチョコレートやワッフルのほかに、実はフライドポテト発祥の地ともいわれています。' },
      { name: 'ドイツ', region: 'ヨーロッパ', goal: 160, boss: null, trivia: '300種類以上のパンと1,500種類以上のソーセージがあり、ノイシュヴァンシュタイン城が人気です。' },
      { name: 'スイス', region: 'ヨーロッパ', goal: 165, boss: null, trivia: 'アルプス山脈に囲まれた永世中立国で、高級時計やチーズフォンデュ、登山鉄道が有名です。' },
      { name: 'オーストリア', region: 'ヨーロッパ', goal: 165, boss: null, trivia: 'モーツァルトやベートーヴェンが活躍した「音楽の都ウィーン」を擁する芸術の国です。' },
      { name: 'ポーランド', region: 'ヨーロッパ', goal: 165, boss: null, trivia: '作曲家ショパンや地動説を唱えたコペルニクスの出身国で、美しい中世の旧市街が残ります。' },
      { name: 'スウェーデン', region: 'ヨーロッパ', goal: 170, boss: null, trivia: 'ノーベル賞の授賞式が行われる国であり、リサイクル率が非常に高い環境先進国です。' },
      { name: 'ノルウェー', region: 'ヨーロッパ', goal: 170, boss: null, trivia: '氷河が削ってできた絶景「フィヨルド」や、冬に夜空を舞うオーロラ観測で有名です。' },
      { name: 'フィンランド', region: 'ヨーロッパ', goal: 170, boss: null, trivia: 'サンタクロース村がある「森と湖の国」で、人口約550万人に対しサウナが300万以上あります。' },
      { name: 'アイスランド', region: 'ヨーロッパ', goal: 180, boss: '氷河ヴァイキング王', trivia: '「火と氷の国」と呼ばれ、活火山の地熱を利用した巨大な露天風呂ブルーラグーンが有名です。' },
      { name: 'エジプト', region: 'アフリカ', goal: 165, boss: null, trivia: '約4,500年前に建造されたギザの三大ピラミッドとスフィンクスが今も砂漠にそびえています。' },
      { name: 'モロッコ', region: 'アフリカ', goal: 170, boss: null, trivia: '街全体が青い壁で塗られた「シャウエン」や、サハラ砂漠のラクダツアーが人気です。' },
      { name: 'ケニア', region: 'アフリカ', goal: 170, boss: null, trivia: '赤道直下にありながら標高が高いため過ごしやすく、サファリで野生のビッグ5に出会えます。' },
      { name: 'タンザニア', region: 'アフリカ', goal: 175, boss: null, trivia: 'アフリカ大陸最高峰キリマンジャロ（標高5,895m）とセレンゲティ国立公園があります。' },
      { name: 'マダガスカル', region: 'アフリカ', goal: 175, boss: null, trivia: '独自の進化を遂げた動植物の宝庫で、キツネザルや巨大なバオバブの並木道が有名です。' },
      { name: '南アフリカ', region: 'アフリカ', goal: 185, boss: 'サバンナ獅子王', trivia: '世界で唯一「3つの首都（行政・立法・司法）」を持つ国で、喜望峰やテーブルマウンテンがあります。' },
      { name: 'カナダ', region: '北アメリカ', goal: 175, boss: null, trivia: '世界で2番目に広い国土を持ち、世界のメープルシロップの約70%以上を生産しています。' },
      { name: 'アメリカ合衆国', region: '北アメリカ', goal: 180, boss: null, trivia: 'グランドキャニオンなどの雄大な国立公園から、自由の女神、ハリウッドまで多様性に富んでいます。' },
      { name: 'メキシコ', region: '北アメリカ', goal: 180, boss: null, trivia: '古代マヤ・アステカ文明のピラミッド遺跡が残り、タコスやチョコレート（カカオ）のルーツです。' },
      { name: 'コスタリカ', region: '北アメリカ', goal: 190, boss: '密林ケツァール神', trivia: '国土の約4分の1が国立公園や自然保護区に指定されており、軍隊を持たない平和国家です。' },
      { name: 'ブラジル', region: '南アメリカ', goal: 185, boss: null, trivia: '世界最大の流域面積を持つアマゾン川と熱帯雨林があり、サッカーとサンバの情熱の国です。' },
      { name: 'アルゼンチン', region: '南アメリカ', goal: 185, boss: null, trivia: '南米最南端のパタゴニア地方には、今も成長を続ける巨大なペリト・モレノ氷河があります。' },
      { name: 'チリ', region: '南アメリカ', goal: 190, boss: null, trivia: '南北に約4,300kmも細長く伸びる国で、イースター島のモアイ像もチリ領に属しています。' },
      { name: 'ペルー', region: '南アメリカ', goal: 190, boss: null, trivia: '標高2,430mの断崖にあるインカ帝国の空中都市「マチュピチュ」やナスカの地上絵が有名です。' },
      { name: 'ボリビア', region: '南アメリカ', goal: 200, boss: '天空鏡の守護神', trivia: '雨季に空が地面に反射する「ウユニ塩原」は、世界で最も平らな場所として知られています。' },
      { name: 'オーストラリア', region: 'オセアニア', goal: 195, boss: null, trivia: '世界最大のサンゴ礁「グレートバリアリーフ」と、一枚岩ウルル（エアーズロック）があります。' },
      { name: 'ニュージーランド', region: 'オセアニア', goal: 200, boss: null, trivia: '飛べない鳥キウイが国のシンボルで、美しいフィヨルドや満天の星空が保護されています。' },
      { name: '南極大陸', region: '南極', goal: 220, boss: 'アース・エンペラー', trivia: '地球上の淡水の約70%が氷として存在し、最低気温マイナス89.2度を記録した極限の大陸です！' }
    ],
    space: [
      { name: '月面基地ルナ', region: '太陽系・衛星', goal: 160, boss: null, trivia: '地球から約38万km離れた唯一の自然衛星。重力が地球の約6分の1なので高くジャンプできます！' },
      { name: '火星オリンポス山', region: '太陽系・内惑星', goal: 180, boss: null, trivia: '火星にある「オリンポス山」は標高約25,000mで、エベレストの約3倍もある太陽系最大の火山です。' },
      { name: '木星大赤斑', region: '太陽系・巨大ガス惑星', goal: 200, boss: null, trivia: '太陽系最大の惑星で、地球が1,300個以上入る大きさ。大赤斑は地球2〜3個分の巨大な台風です。' },
      { name: '土星リング軌道', region: '太陽系・環の惑星', goal: 220, boss: null, trivia: '氷と岩石の無数の粒でできた美しいリングを持ち、実は水よりも密度が軽いため水に浮く惑星です！' },
      { name: '海王星ダークストーム', region: '太陽系・最果て', goal: 240, boss: null, trivia: '太陽から最も遠い惑星で、時速2,000kmを超える太陽系で最も激しい暴風が吹き荒れています。' },
      { name: '銀河の果て・ブラックホール', region: '深宇宙・最終決戦', goal: 270, boss: 'コズミック・オーバーロード', trivia: '光さえも脱出できない圧倒的な重力を持つ天体。ここを突破した君は真の壁けりマスターです！' }
    ]
  };

  let currentStoryArc = 'japan';
  let currentStoryIndex = 0;

  // ==========================================
  // 物理＆ゲーム定数
  // ==========================================
  const WALL_WIDTH = 38;
  const LEFT_WALL_X = WALL_WIDTH;
  const RIGHT_WALL_X = canvas.width - WALL_WIDTH;
  const GRAVITY = 0.52;
  const SLIDE_GRAVITY = 0.045;
  const MAX_SLIDE_SPEED = 1.1;
  const JUMP_VX = 9.0;
  const JUMP_VY = -13.2;
  const PIXELS_PER_METER = 26;

  // 各モード設定
  const STAGES = {
    easy: {
      name: 'EASY',
      goalMeters: 100,
      isRecord: false,
      spikeBandChance: 0.32,
      minSpikes: 3,
      maxSpikes: 4,
      movingSpikeChance: 0,
      batChance: 0.42,
      birdInterval: 280,
      bgTop: '#E0F2FE',
      bgBottom: '#F8FAFC',
      wallColor: '#0284C7',
      wallLight: '#38BDF8',
      wallDark: '#0369A1'
    },
    normal: {
      name: 'NORMAL',
      goalMeters: 180,
      isRecord: false,
      spikeBandChance: 0.44,
      minSpikes: 3,
      maxSpikes: 5,
      movingSpikeChance: 0.25,
      batChance: 0.56,
      birdInterval: 210,
      bgTop: '#FEF3C7',
      bgBottom: '#FFFBEB',
      wallColor: '#D97706',
      wallLight: '#FBBF24',
      wallDark: '#92400E'
    },
    hard: {
      name: 'HARD',
      goalMeters: 260,
      isRecord: false,
      spikeBandChance: 0.54,
      minSpikes: 4,
      maxSpikes: 6,
      movingSpikeChance: 0.42,
      batChance: 0.68,
      birdInterval: 155,
      bgTop: '#FFE4E6',
      bgBottom: '#FFF1F2',
      wallColor: '#E11D48',
      wallLight: '#FB7185',
      wallDark: '#9F1239'
    },
    record: {
      name: 'RECORD',
      goalMeters: Infinity,
      isRecord: true,
      spikeBandChance: 0.42,
      minSpikes: 3,
      maxSpikes: 5,
      movingSpikeChance: 0.25,
      batChance: 0.54,
      birdInterval: 195,
      bgTop: '#F3E8FF',
      bgBottom: '#FAF5FF',
      wallColor: '#7C3AED',
      wallLight: '#A78BFA',
      wallDark: '#5B21B6'
    }
  };

  // ストーリーステージ用の動的設定ビルダー
  function buildStoryConfig(arc, idx) {
    const info = STORY_DATA[arc][idx];
    const progressRatio = idx / STORY_DATA[arc].length;

    let palette = {
      bgTop: '#E0F2FE',
      bgBottom: '#FFF7ED',
      wallColor: '#EA580C',
      wallLight: '#FB923C',
      wallDark: '#9A3412'
    };
    if (arc === 'world') {
      palette = {
        bgTop: '#DCFCE7',
        bgBottom: '#FEFCE8',
        wallColor: '#0D9488',
        wallLight: '#2DD4BF',
        wallDark: '#115E59'
      };
    } else if (arc === 'space') {
      palette = {
        bgTop: '#1E1B4B',
        bgBottom: '#312E81',
        wallColor: '#4F46E5',
        wallLight: '#818CF8',
        wallDark: '#312E81'
      };
    }

    return {
      name: info.name,
      goalMeters: info.goal,
      isRecord: false,
      isStory: true,
      storyArc: arc,
      storyIndex: idx,
      storyInfo: info,
      spikeBandChance: Math.min(0.56, 0.28 + progressRatio * 0.25),
      minSpikes: arc === 'space' ? 4 : 3,
      maxSpikes: arc === 'space' ? 6 : (progressRatio > 0.5 ? 5 : 4),
      movingSpikeChance: Math.min(0.45, 0.1 + progressRatio * 0.35),
      batChance: Math.min(0.68, 0.38 + progressRatio * 0.28),
      birdInterval: Math.max(150, 260 - Math.floor(progressRatio * 100)),
      archerChance: arc === 'japan' && idx < 10 ? 0.15 : 0.32,
      ...palette
    };
  }

  let currentDifficulty = 'easy';
  let gameState = 'title';
  let animationId = null;

  // 固定ステージ生成用の決定論的疑似乱数（PRNG）
  let stageRngState = 123456789;
  function seedStageRng(seedStr) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    stageRngState = (h >>> 0) || 987654321;
  }
  function stageRand() {
    stageRngState = (Math.imul(1664525, stageRngState) + 1013904223) >>> 0;
    return stageRngState / 4294967296;
  }

  let player = {};
  let spikeBands = [];
  let coins = [];
  let bats = [];
  let birds = [];
  let ambusherEnemies = [];
  let projectiles = [];
  let bossLasers = [];
  let particles = [];
  let afterimages = [];
  let bgClouds = [];

  let cameraY = 0;
  let goalY = 0;
  let generatedUntilY = 0;
  let lastSpikeSide = null;
  let lastSpikeBottomY = Infinity;
  let sameSideStreak = 0;
  let birdSpawnTimer = 120;
  let ambusherSpawnTimer = 160;
  let kickCount = 0;
  let stageCoins = 0;
  let maxAltitude = 0;
  let shakeTime = 0;

  // ボス戦状態
  let activeBoss = null;

  function initClouds() {
    bgClouds = [];
    for (let i = 0; i < 9; i++) {
      bgClouds.push({
        x: LEFT_WALL_X + Math.random() * (RIGHT_WALL_X - LEFT_WALL_X - 70),
        y: Math.random() * canvas.height,
        w: 55 + Math.random() * 45,
        h: 22 + Math.random() * 10,
        speed: 0.15 + Math.random() * 0.25
      });
    }
  }

  // コイン列の配置ヘルパー
  function spawnCoinLine(x, startY, count, spacingY = 30) {
    for (let i = 0; i < count; i++) {
      coins.push({
        x: x,
        y: startY - i * spacingY,
        radius: 10,
        phase: i * 0.6,
        collected: false
      });
    }
  }

  // 指定したY座標範囲に連続トゲ帯とコウモリを生成（固定シード＆詰みポジ防止設計）
  function generateSegment(fromY, toY, config) {
    const rand = config.isRecord ? Math.random : stageRand;
    let currentY = fromY;

    while (currentY > toY) {
      const altitudeMeters = Math.max(0, (580 - currentY) / PIXELS_PER_METER);
      const difficultyScale = config.isRecord ? Math.min(1.0, altitudeMeters / 300) : 0;

      const spikeChance = Math.min(0.68, config.spikeBandChance + difficultyScale * 0.2);
      const batChance = Math.min(0.75, config.batChance + difficultyScale * 0.22);
      const movingChance = Math.min(0.55, config.movingSpikeChance + difficultyScale * 0.25);

      // ジャンプ軌道が必ず成立するよう十分な縦間隔を確保
      const gap = 175 + rand() * 55;
      currentY -= gap;
      if (currentY <= toY) break;

      // 1. 連続トゲ帯の配置（詰みポジを防ぐため反対壁との縦の逃げ場を必ず確保）
      if (rand() < spikeChance) {
        let side = rand() < 0.5 ? 'left' : 'right';
        if (side === lastSpikeSide) {
          sameSideStreak++;
          if (sameSideStreak >= 2) {
            side = side === 'left' ? 'right' : 'left';
            sameSideStreak = 0;
          }
        } else {
          sameSideStreak = 0;
        }

        const minC = config.minSpikes;
        const maxC = Math.min(5, config.maxSpikes + (difficultyScale > 0.5 ? 1 : 0));
        const count = minC + Math.floor(rand() * (maxC - minC + 1));
        const spikeH = 22;
        const totalHeight = count * spikeH;
        const isMoving = rand() < movingChance;
        const moveRange = isMoving ? 26 : 0;

        let bandTopY = currentY - totalHeight / 2;
        // 反対側の直前トゲと高さが被って挟み撃ち（詰みポジ）にならないよう縦位置をずらす
        if (lastSpikeSide && side !== lastSpikeSide) {
          const minSafeGap = 115 + moveRange;
          if (lastSpikeBottomY - (bandTopY + totalHeight) < minSafeGap) {
            bandTopY = lastSpikeBottomY - totalHeight - minSafeGap;
            currentY = bandTopY + totalHeight / 2;
            if (currentY <= toY) break;
          }
        }

        lastSpikeSide = side;
        lastSpikeBottomY = bandTopY - moveRange;

        spikeBands.push({
          side: side,
          baseY: bandTopY,
          y: bandTopY,
          count: count,
          spikeHeight: spikeH,
          totalHeight: totalHeight,
          width: 24,
          isMoving: isMoving,
          moveOffset: rand() * Math.PI * 2,
          moveRange: moveRange
        });

        // トゲ帯の反対側の安全な空間にコインを配置（壁から十分離す）
        const safeCoinX = side === 'left' ? (RIGHT_WALL_X - 54) : (LEFT_WALL_X + 54);
        if (rand() < 0.65) {
          spawnCoinLine(safeCoinX, currentY + 14, 2 + Math.floor(rand() * 2), 28);
        }

        // 反対側の壁でプレイヤーが蹴るスペースを潰さないよう、中央寄りの高めの位置にコウモリを配置
        if (rand() < batChance) {
          const batX = canvas.width / 2 + (rand() - 0.5) * 60;
          bats.push(createBat(batX, bandTopY - 48, rand));
        }
      } else {
        // 中央付近に縦並びのコインを配置
        if (rand() < 0.7) {
          const coinX = LEFT_WALL_X + 75 + rand() * (RIGHT_WALL_X - LEFT_WALL_X - 150);
          spawnCoinLine(coinX, currentY + 10, 3, 28);
        }

        if (rand() < batChance) {
          const centerX = canvas.width / 2 + (rand() - 0.5) * 80;
          bats.push(createBat(centerX, currentY, rand));
        }
      }
    }
    generatedUntilY = toY;
  }

  function createBat(x, y, randFn = Math.random) {
    return {
      x: x,
      baseY: y,
      y: y,
      vx: (randFn() < 0.5 ? 1 : -1) * (1.7 + randFn() * 1.2),
      radius: 15,
      flapPhase: randFn() * Math.PI * 2,
      bobPhase: randFn() * Math.PI * 2
    };
  }

  // ステージ初期化
  function initStage(config) {
    spikeBands = [];
    coins = [];
    bats = [];
    birds = [];
    ambusherEnemies = [];
    projectiles = [];
    bossLasers = [];
    lastSpikeSide = null;
    lastSpikeBottomY = Infinity;
    sameSideStreak = 0;
    birdSpawnTimer = 95;
    ambusherSpawnTimer = 145;

    if (config.isRecord) {
      goalY = -Infinity;
      generateSegment(420, -2400, config);
    } else {
      // ステージ名・番号から固定シードを生成（毎回同じレイアウトで練習・攻略可能）
      const seedKey = config.isStory ? `story_${config.storyArc}_${config.storyIndex}_${config.name}` : `practice_${config.name}`;
      seedStageRng(seedKey);
      goalY = 580 - (config.goalMeters * PIXELS_PER_METER);
      // ゴール手前240pxは安全地帯として空ける
      generateSegment(420, goalY + ((config.isStory && config.storyInfo.boss) ? 640 : 240), config);
    }
  }

  // 奥（Z軸方向）から突っ込んでくる鳥の生成
  function spawnDepthBird() {
    const margin = 52;
    const minX = LEFT_WALL_X + margin;
    const maxX = RIGHT_WALL_X - margin;
    const targetX = minX + Math.random() * (maxX - minX);
    const worldY = cameraY + 180 + Math.random() * 240;

    birds.push({
      x: targetX,
      y: worldY,
      z: 0.05,
      speedZ: 0.0115,
      wingPhase: 0,
      hasHit: false
    });
    playSound('birdWarn');
  }

  // 横から現れる妨害キャラ（画面外狙撃アーチャー / 雪だるま）の生成
  function spawnAmbusher() {
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const isArcher = Math.random() < 0.55;
    const relY = isArcher ? (230 + Math.random() * 210) : (120 + Math.random() * 70);

    ambusherEnemies.push({
      type: isArcher ? 'archer' : 'snowman',
      side: side,
      relY: relY,
      slideProgress: 0,
      state: 'entering',
      timer: 0,
      shotsFired: 0,
      aimY: 0
    });
  }

  // パーティクル生成
  function spawnParticles(x, y, color, count = 10, isScreenSpace = false) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6.5;
      particles.push({
        x: x,
        y: isScreenSpace ? y + cameraY : y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 5 + Math.random() * 6,
        color: color,
        life: 1.0,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.35
      });
    }
  }

  // ボスの初期化
  function initBoss(bossName, goalPixelY) {
    activeBoss = {
      name: bossName,
      x: canvas.width / 2,
      y: goalPixelY + 110,
      hp: 3,
      maxHp: 3,
      vx: 2.2,
      shootTimer: 75,
      attackPatternIndex: 0,
      hitFlash: 0,
      active: false
    };
    document.getElementById('boss-name-label').textContent = `BOSS: ${bossName}`;
    updateBossHpUi();
  }

  function updateBossHpUi() {
    const barsEl = document.getElementById('boss-hp-bars');
    barsEl.innerHTML = '';
    if (!activeBoss) return;
    for (let i = 0; i < activeBoss.maxHp; i++) {
      const pip = document.createElement('div');
      pip.className = 'boss-hp-pip' + (i >= activeBoss.hp ? ' lost' : '');
      barsEl.appendChild(pip);
    }
  }

  // ゲーム開始（通常モード / RECORDモード / STORYモード共通）
  function startGame(difficulty, storyArc = null, storyIdx = 0) {
    currentDifficulty = difficulty;
    if (difficulty === 'record') {
      lastSelectScreen = 'title';
    }
    let config;

    if (difficulty === 'story') {
      currentStoryArc = storyArc;
      currentStoryIndex = storyIdx;
      config = buildStoryConfig(storyArc, storyIdx);
      STAGES.story = config;
    } else {
      config = STAGES[difficulty];
    }

    screenTitle.classList.add('hidden');
    screenPractice.classList.add('hidden');
    screenSkin.classList.add('hidden');
    screenStory.classList.add('hidden');
    screenResult.classList.add('hidden');
    hud.classList.remove('hidden');
    bossHud.classList.add('hidden');

    hudStage.textContent = config.isRecord ? 'RECORD' : (config.isStory ? `${storyIdx + 1}.${config.name}` : `STAGE: ${config.name}`);
    hudStage.className = 'hud-box' + (config.isRecord ? ' record-mode' : (config.isStory ? ' story-mode' : ''));

    kickCount = 0;
    stageCoins = 0;
    maxAltitude = 0;
    particles = [];
    afterimages = [];
    shakeTime = 0;
    activeBoss = null;

    player = {
      x: LEFT_WALL_X,
      y: 580,
      size: 28,
      vx: 0,
      vy: 0,
      onWall: 'left',
      airJumpAvailable: true,
      facing: 1,
      squashX: 1,
      squashY: 1,
      rotation: 0,
      spinTimer: 0,
      lockoutTimer: 0,
      clashState: null
    };

    cameraY = 0;
    initClouds();
    initStage(config);

    if (config.isStory && config.storyInfo.boss) {
      initBoss(config.storyInfo.boss, goalY);
    }

    gameState = 'playing';
    if (animationId) cancelAnimationFrame(animationId);
    loop();
  }

  // モード選択画面の遷移管理
  let lastSelectScreen = 'title';

  function openStorySelect() {
    lastSelectScreen = 'story';
    screenTitle.classList.add('hidden');
    screenPractice.classList.add('hidden');
    screenSkin.classList.add('hidden');
    screenResult.classList.add('hidden');
    screenStory.classList.remove('hidden');
    switchStoryTab(currentStoryArc);
  }

  function switchStoryTab(arc) {
    currentStoryArc = arc;
    document.getElementById('tab-japan').classList.toggle('active', arc === 'japan');
    document.getElementById('tab-world').classList.toggle('active', arc === 'world');
    document.getElementById('tab-space').classList.toggle('active', arc === 'space');
    renderStoryList();
  }

  function renderStoryList() {
    const listEl = document.getElementById('story-stage-list');
    listEl.innerHTML = '';
    const stages = STORY_DATA[currentStoryArc] || [];
    const unlockedCount = storyProgress[currentStoryArc] || 0;

    stages.forEach((st, idx) => {
      const isLocked = idx > unlockedCount;
      const isCleared = idx < unlockedCount;
      const item = document.createElement('button');
      item.className = `story-item ${isLocked ? 'locked' : ''} ${st.boss ? 'boss-stage' : ''} ${isCleared ? 'cleared' : ''}`;

      const badgeHtml = st.boss
        ? `<span class="story-badge boss">BOSS: ${st.boss}</span>`
        : `<span class="story-badge">${st.region}</span>`;
      const statusText = isLocked ? 'LOCKED' : (isCleared ? 'CLEAR!' : `${st.goal}m`);

      item.innerHTML = `
        <div>
          <span>${idx + 1}. ${st.name}</span>
          ${badgeHtml}
        </div>
        <span>${statusText}</span>
      `;

      if (!isLocked) {
        item.onclick = () => startGame('story', currentStoryArc, idx);
      }
      listEl.appendChild(item);
    });
  }

  function playNextStoryStage() {
    const stages = STORY_DATA[currentStoryArc] || [];
    if (currentStoryIndex + 1 < stages.length) {
      startGame('story', currentStoryArc, currentStoryIndex + 1);
    } else if (currentStoryArc === 'japan') {
      startGame('story', 'world', 0);
    } else if (currentStoryArc === 'world') {
      startGame('story', 'space', 0);
    } else {
      openStorySelect();
    }
  }

  function openPracticeSelect() {
    lastSelectScreen = 'practice';
    screenTitle.classList.add('hidden');
    screenResult.classList.add('hidden');
    screenPractice.classList.remove('hidden');
  }

  function openSkinSelect() {
    screenTitle.classList.add('hidden');
    screenResult.classList.add('hidden');
    screenSkin.classList.remove('hidden');
    document.getElementById('shop-total-coins').textContent = totalCoins;
    switchShopTab(currentShopTab);
  }

  function switchShopTab(tab) {
    currentShopTab = tab;
    document.getElementById('shop-tab-ninja').classList.toggle('active', tab === 'ninja');
    document.getElementById('shop-tab-sword').classList.toggle('active', tab === 'sword');
    renderSkinGrid();
  }

  function renderSkinGrid() {
    const grid = document.getElementById('skin-grid');
    grid.innerHTML = '';

    if (currentShopTab === 'ninja') {
      SKINS.forEach(skin => {
        const isOwned = unlockedSkins.includes(skin.id);
        const isSelected = skin.id === selectedSkinId;
        const card = document.createElement('div');
        card.className = `skin-card ${isSelected ? 'selected' : ''} ${!isOwned ? 'locked' : ''}`;

        let statusTagHtml = '';
        if (isSelected) {
          statusTagHtml = `<span class="skin-price-tag equipped">装備中</span>`;
        } else if (isOwned) {
          statusTagHtml = `<span class="skin-price-tag owned">所持済み</span>`;
        } else {
          statusTagHtml = `<span class="skin-price-tag"><span class="coin-icon" style="width:10px;height:10px;vertical-align:middle;margin-right:3px;"></span>${skin.price}</span>`;
        }

        card.innerHTML = `
          <div class="skin-preview-box" style="background:${skin.bodyColor}; box-shadow: inset 0 -4px 0 rgba(0,0,0,0.2);">
            <div style="position:absolute; top:4px; left:0; right:0; height:6px; background:${skin.bandColor}; border-top:2px solid #1E1E24; border-bottom:2px solid #1E1E24;"></div>
            <div style="display:flex; gap:4px; margin-top:6px;">
              <span style="width:4px; height:6px; background:${skin.eyeColor}; display:inline-block;"></span>
              <span style="width:4px; height:6px; background:${skin.eyeColor}; display:inline-block;"></span>
            </div>
            ${skin.crown ? '<div class="crown-badge"></div>' : ''}
          </div>
          <div>${skin.name}</div>
          ${statusTagHtml}
        `;

        card.onclick = () => {
          if (isOwned) {
            selectedSkinId = skin.id;
            saveCoinAndSkinData();
            playSound('kick');
            renderSkinGrid();
          } else if (totalCoins >= skin.price) {
            totalCoins -= skin.price;
            unlockedSkins.push(skin.id);
            selectedSkinId = skin.id;
            saveCoinAndSkinData();
            playSound('clear');
            renderSkinGrid();
          } else {
            playSound('hit');
          }
        };
        grid.appendChild(card);
      });
    } else {
      SWORDS.forEach(sword => {
        const isOwned = unlockedSwords.includes(sword.id);
        const isSelected = sword.id === selectedSwordId;
        const card = document.createElement('div');
        card.className = `skin-card ${isSelected ? 'selected' : ''} ${!isOwned ? 'locked' : ''}`;

        let statusTagHtml = '';
        if (isSelected) {
          statusTagHtml = `<span class="skin-price-tag equipped">装備中</span>`;
        } else if (isOwned) {
          statusTagHtml = `<span class="skin-price-tag owned">所持済み</span>`;
        } else {
          statusTagHtml = `<span class="skin-price-tag"><span class="coin-icon" style="width:10px;height:10px;vertical-align:middle;margin-right:3px;"></span>${sword.price}</span>`;
        }

        const ratePercent = Math.round(sword.batKillRate * 100);
        const swordSvgHtml = `<div class="sword-svg-preview">${SWORD_SVGS[sword.id] || ''}</div>`;

        if (sword.isUltimate) {
          card.classList.add('ultimate-sword');
        }

        const rateBadgeStyle = sword.isUltimate
          ? 'background:#FACC15; color:#1E1E24; border-color:#FFFFFF;'
          : '';

        card.innerHTML = `
          <div class="skin-preview-box" style="background:radial-gradient(circle, #334155 0%, #0F172A 100%); box-shadow: inset 0 0 14px ${sword.glowColor}; ${sword.isUltimate ? 'border-color:#FACC15;' : ''}">
            ${swordSvgHtml}
          </div>
          <div style="font-size:${sword.isUltimate ? '11.5px' : '13px'};">${sword.name}</div>
          <div class="sword-tag" style="${rateBadgeStyle}">コウモリ撃破率: ${ratePercent}%</div>
          ${statusTagHtml}
        `;

        card.onclick = () => {
          if (isOwned) {
            selectedSwordId = sword.id;
            saveCoinAndSkinData();
            playSound('kick');
            renderSkinGrid();
          } else if (totalCoins >= sword.price) {
            totalCoins -= sword.price;
            unlockedSwords.push(sword.id);
            selectedSwordId = sword.id;
            saveCoinAndSkinData();
            playSound('clear');
            renderSkinGrid();
          } else {
            playSound('hit');
          }
        };
        grid.appendChild(card);
      });
    }
  }

  function retryGame() {
    if (currentDifficulty === 'story') {
      startGame('story', currentStoryArc, currentStoryIndex);
    } else {
      startGame(currentDifficulty);
    }
  }

  function backFromResult() {
    if (lastSelectScreen === 'story') {
      openStorySelect();
    } else if (lastSelectScreen === 'practice') {
      openPracticeSelect();
    } else {
      backToTitle();
    }
  }

  function backToTitle() {
    gameState = 'title';
    activeBoss = null;
    hud.classList.add('hidden');
    bossHud.classList.add('hidden');
    screenPractice.classList.add('hidden');
    screenSkin.classList.add('hidden');
    screenStory.classList.add('hidden');
    screenResult.classList.add('hidden');
    screenTitle.classList.remove('hidden');
    titleBestRecordEl.textContent = `${bestRecord}m`;
    document.getElementById('title-total-coins').textContent = totalCoins;
    updateTitleEquipTag();
    if (animationId) cancelAnimationFrame(animationId);
  }

  // 壁けり＆二段ジャンプアクション
  function performKick() {
    if (gameState !== 'playing' || player.clashState) return;

    if (player.onWall === 'left') {
      player.vx = JUMP_VX;
      player.vy = JUMP_VY;
      player.onWall = null;
      player.facing = 1;
      player.airJumpAvailable = true;
      kickCount++;
      player.squashX = 0.72;
      player.squashY = 1.32;
      playSound('kick');
      spawnParticles(player.x, player.y + player.size / 2, '#00D2FF', 8);
    } else if (player.onWall === 'right') {
      player.vx = -JUMP_VX;
      player.vy = JUMP_VY;
      player.onWall = null;
      player.facing = -1;
      player.airJumpAvailable = true;
      kickCount++;
      player.squashX = 0.72;
      player.squashY = 1.32;
      playSound('kick');
      spawnParticles(player.x + player.size, player.y + player.size / 2, '#00D2FF', 8);
    } else if (player.airJumpAvailable && player.lockoutTimer <= 0) {
      // 進行方向を維持したまま二段ジャンプ
      player.vx = JUMP_VX * player.facing * 0.92;
      player.vy = JUMP_VY * 0.94;
      player.airJumpAvailable = false;
      kickCount++;
      player.squashX = 1.28;
      player.squashY = 0.76;
      playSound('doubleKick');
      spawnParticles(player.x + player.size / 2, player.y + player.size, '#FFD600', 12);
    }
  }

  // スペースキー専用：回転攻撃（発動後1.5秒＝90フレーム間は二段ジャンプ＆回転攻撃を制限）
  function performSpinAttack() {
    if (gameState !== 'playing' || player.clashState) return;
    if (player.lockoutTimer > 0) return;

    player.spinTimer = 26;
    player.lockoutTimer = 60;
    playSound('spin');
    spawnParticles(player.x + player.size / 2, player.y + player.size / 2, '#00D2FF', 10);
  }

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (gameState === 'playing') performSpinAttack();
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (gameState === 'playing') performKick();
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (gameState === 'playing') performKick();
  });

  // 結果画面表示
  function showResult(isClear) {
    gameState = isClear ? 'clear' : 'gameover';
    if (!isClear) playSound('hit');
    else playSound('clear');

    // 獲得コインを累計に加算して保存
    totalCoins += stageCoins;
    saveCoinAndSkinData();

    hud.classList.add('hidden');
    bossHud.classList.add('hidden');
    screenResult.classList.remove('hidden');

    const config = STAGES[currentDifficulty];
    const titleEl = document.getElementById('result-title');
    const badgeEl = document.getElementById('result-badge');
    const resBestRow = document.getElementById('res-best-row');
    const triviaBox = document.getElementById('result-trivia-box');
    const btnNextStory = document.getElementById('btn-next-story');
    const btnResultBack = document.getElementById('btn-result-back');

    const reachedMeters = config.isRecord
      ? Math.floor(maxAltitude)
      : Math.min(config.goalMeters, Math.floor(maxAltitude));

    let isNewRecord = false;
    if (config.isRecord && reachedMeters > bestRecord) {
      bestRecord = reachedMeters;
      localStorage.setItem('wallKickBestRecord', String(bestRecord));
      isNewRecord = true;
    }

    triviaBox.classList.add('hidden');
    btnNextStory.classList.add('hidden');
    btnResultBack.textContent = config.isStory
      ? 'ステージ一覧へ'
      : (lastSelectScreen === 'practice' ? 'PRACTICE選択へ' : 'タイトルへ');

    if (config.isStory && isClear) {
      if ((storyProgress[currentStoryArc] || 0) <= currentStoryIndex) {
        storyProgress[currentStoryArc] = currentStoryIndex + 1;
        localStorage.setItem('wallKickStoryProgress', JSON.stringify(storyProgress));
      }
      triviaBox.classList.remove('hidden');
      document.getElementById('trivia-header').textContent = `[豆知識] ${config.storyInfo.name}（${config.storyInfo.region}）`;
      document.getElementById('trivia-body').textContent = config.storyInfo.trivia;
      btnNextStory.classList.remove('hidden');
    }

    if (isNewRecord) {
      newRecordTag.classList.remove('hidden');
    } else {
      newRecordTag.classList.add('hidden');
    }

    if (isClear) {
      badgeEl.textContent = 'CONGRATULATIONS!';
      badgeEl.style.background = '#00E676';
      badgeEl.style.color = '#1E1E24';
      titleEl.textContent = 'STAGE CLEAR!';
      titleEl.style.color = '#00C853';
    } else {
      badgeEl.textContent = config.isRecord ? 'RECORD FINISHED!' : 'OUCH!!';
      badgeEl.style.background = config.isRecord ? '#A855F7' : '#FF3B6B';
      badgeEl.style.color = config.isRecord ? '#FFFFFF' : '#1E1E24';
      titleEl.textContent = config.isRecord ? 'RESULT' : 'GAME OVER';
      titleEl.style.color = config.isRecord ? '#7C3AED' : '#FF3B6B';
    }

    document.getElementById('res-stage').textContent = config.name;
    document.getElementById('res-height').textContent = config.isRecord
      ? `${reachedMeters}m`
      : `${reachedMeters}m / ${config.goalMeters}m`;
    document.getElementById('res-coins').textContent = `+${stageCoins}枚 (計 ${totalCoins}枚)`;

    if (config.isRecord) {
      resBestRow.classList.remove('hidden');
      document.getElementById('res-best').textContent = `${bestRecord}m`;
    } else {
      resBestRow.classList.add('hidden');
    }

    document.getElementById('res-kicks').textContent = `${kickCount}回`;
  }

  // 更新処理
  function update() {
    if (gameState !== 'playing') return;

    const config = STAGES[currentDifficulty];

    // コウモリに押し負ける「鍔迫り合い（ギィーン！）」演出中の専用更新
    if (player.clashState) {
      const cs = player.clashState;
      cs.timer--;
      shakeTime = 3;

      // 鍔迫り合い中は剣とコウモリの接点から火花が散り続け、少しずつ押し込まれる
      player.rotation += 0.18 * player.facing;
      player.x += cs.pushVx * 0.25;
      player.y += 0.35;

      if (cs.timer % 2 === 0) {
        const sparkX = (player.x + player.size / 2 + cs.batX) / 2;
        const sparkY = (player.y + player.size / 2 + cs.batY) / 2;
        spawnParticles(sparkX, sparkY, cs.timer % 4 === 0 ? '#FFD600' : '#FFFFFF', 4, false);
      }

      // パーティクル更新
      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.rotation += p.vRot;
        p.life -= 0.035;
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (cs.timer <= 0) {
        // 押し負けて弾き飛ばされゲームオーバーへ
        shakeTime = 22;
        spawnParticles(player.x + player.size / 2, player.y + player.size / 2, '#FF2A55', 30, false);
        player.clashState = null;
        showResult(false);
      }
      return;
    }

    // 雲のスクロール更新
    for (let c of bgClouds) {
      c.x += c.speed;
      if (c.x > RIGHT_WALL_X) c.x = LEFT_WALL_X - c.w;
    }

    // 回転攻撃＆クールダウンタイマー更新
    if (player.spinTimer > 0) player.spinTimer--;
    if (player.lockoutTimer > 0) player.lockoutTimer--;

    // プレイヤーの物理演算（重力・速度・回転）
    if (player.onWall) {
      player.vy += SLIDE_GRAVITY;
      if (player.vy > MAX_SLIDE_SPEED) player.vy = MAX_SLIDE_SPEED;
      player.vx = 0;
      player.rotation += (0 - player.rotation) * 0.25;
    } else {
      player.vy += GRAVITY;
      const rotSpeed = player.spinTimer > 0 ? 0.45 : 0.14;
      player.rotation += rotSpeed * player.facing;
    }

    player.x += player.vx;
    player.y += player.vy;

    // 伸縮アニメーションの復元
    player.squashX += (1 - player.squashX) * 0.18;
    player.squashY += (1 - player.squashY) * 0.18;

    // 残像の記録（空中移動中または回転攻撃中）
    if (!player.onWall || player.spinTimer > 0) {
      afterimages.push({
        x: player.x,
        y: player.y,
        rotation: player.rotation,
        alpha: player.spinTimer > 0 ? 0.55 : 0.3,
        isSpin: player.spinTimer > 0
      });
    }
    for (let i = afterimages.length - 1; i >= 0; i--) {
      afterimages[i].alpha -= 0.045;
      if (afterimages[i].alpha <= 0) afterimages.splice(i, 1);
    }

    // 左壁との接触判定
    if (player.x <= LEFT_WALL_X) {
      player.x = LEFT_WALL_X;
      if (player.onWall !== 'left') {
        player.onWall = 'left';
        player.vy *= 0.25;
        player.airJumpAvailable = true;
        player.squashX = 0.72;
        player.squashY = 1.28;
        playSound('land');
        spawnParticles(LEFT_WALL_X, player.y + player.size / 2, '#FFFFFF', 5);
      }
    }

    // 右壁との接触判定
    if (player.x + player.size >= RIGHT_WALL_X) {
      player.x = RIGHT_WALL_X - player.size;
      if (player.onWall !== 'right') {
        player.onWall = 'right';
        player.vy *= 0.25;
        player.airJumpAvailable = true;
        player.squashX = 0.72;
        player.squashY = 1.28;
        playSound('land');
        spawnParticles(RIGHT_WALL_X, player.y + player.size / 2, '#FFFFFF', 5);
      }
    }

    // カメラ追従（ボス戦中はカメラをボスエリアで固定）
    if (activeBoss && activeBoss.hp > 0 && player.y <= goalY + 460) {
      if (!activeBoss.active) {
        activeBoss.active = true; birds = []; ambusherEnemies = []; projectiles = projectiles.filter(p => p.type === 'bossOrb' || p.type === 'bossSpread');
        bossHud.classList.remove('hidden');
      }
      const bossLockCamY = goalY - 90;
      cameraY += (bossLockCamY - cameraY) * 0.12;
    } else {
      const targetCameraY = player.y - 440;
      if (targetCameraY < cameraY) {
        cameraY += (targetCameraY - cameraY) * 0.16;
      }
    }

    // RECORDモード：無限生成＆不要になった過去オブジェクトの掃除
    if (config.isRecord) {
      if (cameraY - 1200 < generatedUntilY) {
        generateSegment(generatedUntilY, generatedUntilY - 2200, config);
      }
      const cleanupY = cameraY + canvas.height + 350;
      spikeBands = spikeBands.filter(b => b.y - b.totalHeight < cleanupY);
      bats = bats.filter(b => b.y < cleanupY);
      coins = coins.filter(c => !c.collected && c.y < cleanupY);
    }

    // 高度計算とHUD更新
    const currentAltitude = Math.max(0, (580 - player.y) / PIXELS_PER_METER);
    if (currentAltitude > maxAltitude) {
      maxAltitude = currentAltitude;
    }

    if (config.isRecord) {
      hudHeight.textContent = `記録: ${Math.floor(maxAltitude)}m`;
    } else if (activeBoss && activeBoss.hp > 0 && activeBoss.active) {
      hudHeight.textContent = `BOSS戦！`;
    } else {
      const remaining = Math.max(0, Math.ceil(config.goalMeters - currentAltitude));
      hudHeight.textContent = `残り: ${remaining}m`;
    }
    hudKicks.textContent = `COIN: ${stageCoins}`;

    // 画面下へ落下でゲームオーバー
    if (player.y - cameraY > canvas.height + 40) {
      shakeTime = 16;
      spawnParticles(player.x + player.size / 2, player.y, '#FF3B6B', 22);
      showResult(false);
      return;
    }

    // ゴール到達判定（ボスがいる場合はボス撃破必須）
    if (!config.isRecord && player.y <= goalY && (!activeBoss || activeBoss.hp <= 0)) {
      maxAltitude = config.goalMeters;
      spawnParticles(player.x + player.size / 2, player.y, '#00E676', 32);
      showResult(true);
      return;
    }

    const pMargin = 5;
    const pCenterX = player.x + player.size / 2;
    const pCenterY = player.y + player.size / 2;
    const px1 = player.x + pMargin;
    const py1 = player.y + pMargin;
    const px2 = player.x + player.size - pMargin;
    const py2 = player.y + player.size - pMargin;

    // 連続トゲ帯の更新と当たり判定
    for (let band of spikeBands) {
      if (band.isMoving) {
        band.moveOffset += 0.04;
        band.y = band.baseY + Math.sin(band.moveOffset) * band.moveRange;
      }

      const sx1 = band.side === 'left' ? LEFT_WALL_X : (RIGHT_WALL_X - band.width + 4);
      const sx2 = band.side === 'left' ? (LEFT_WALL_X + band.width - 4) : RIGHT_WALL_X;
      const sy1 = band.y + 4;
      const sy2 = band.y + band.totalHeight - 4;

      if (px1 < sx2 && px2 > sx1 && py1 < sy2 && py2 > sy1) {
        shakeTime = 18;
        spawnParticles(pCenterX, pCenterY, '#FF2A55', 26);
        showResult(false);
        return;
      }
    }

    // コインの回転・取得判定
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (c.collected) continue;
      c.phase += 0.08;
      const dx = pCenterX - c.x;
      const dy = pCenterY - c.y;
      if (Math.sqrt(dx * dx + dy * dy) < (player.size / 2) + c.radius + 4) {
        c.collected = true;
        stageCoins++;
        playSound('coin');
        spawnParticles(c.x, c.y, '#FFD600', 8, false);
        coins.splice(i, 1);
      }
    }

    // ボス戦の更新処理（多彩な攻撃バリエーション＋3回エネルギー弾を弾き返すと撃破）
    if (activeBoss && activeBoss.hp > 0 && activeBoss.active) {
      if (activeBoss.hitFlash > 0) activeBoss.hitFlash--;

      activeBoss.x += activeBoss.vx;
      if (activeBoss.x < LEFT_WALL_X + 68) {
        activeBoss.x = LEFT_WALL_X + 68;
        activeBoss.vx *= -1;
      } else if (activeBoss.x > RIGHT_WALL_X - 68) {
        activeBoss.x = RIGHT_WALL_X - 68;
        activeBoss.vx *= -1;
      }

      activeBoss.shootTimer--;
      if (activeBoss.shootTimer <= 0) {
        const dx = pCenterX - activeBoss.x;
        const dy = pCenterY - (activeBoss.y + 30);
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const baseAngle = Math.atan2(dy, dx);
        const pattern = pickBossPattern(activeBoss);
        activeBoss.attackPatternIndex++;

        if (pattern >= 3) { extraBossAttack(pattern, activeBoss, pCenterX, pCenterY); } else if (pattern === 0) {
          const speed = 4.4;
          projectiles.push({
            type: 'bossOrb',
            x: activeBoss.x,
            y: activeBoss.y + 30,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            radius: 14,
            reflected: false,
            life: 320
          });
          playSound('snowball');
          activeBoss.shootTimer = 85;
        } else if (pattern === 1) {
          const spreadAngles = [-0.34, 0, 0.34];
          spreadAngles.forEach((offset, idx) => {
            const ang = baseAngle + offset;
            const spd = 4.1;
            projectiles.push({
              type: idx === 1 ? 'bossOrb' : 'bossSpread',
              x: activeBoss.x,
              y: activeBoss.y + 30,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              radius: idx === 1 ? 13 : 9,
              reflected: false,
              life: 300
            });
          });
          playSound('arrow');
          activeBoss.shootTimer = 95;
        } else {
          const targetLaserX = Math.max(LEFT_WALL_X + 24, Math.min(RIGHT_WALL_X - 24, pCenterX));
          bossLasers.push({
            x: targetLaserX,
            startY: activeBoss.y + 34,
            timer: 58,
            fired: false
          });
          playSound('laserWarn');
          projectiles.push({
            type: 'bossOrb',
            x: activeBoss.x,
            y: activeBoss.y + 30,
            vx: (dx / dist) * 4.0,
            vy: (dy / dist) * 4.0,
            radius: 14,
            reflected: false,
            life: 320
          });
          activeBoss.shootTimer = 105;
        }
      }
    }

    // ボスの予告レーザー更新＆当たり判定
    for (let i = bossLasers.length - 1; i >= 0; i--) {
      const lz = bossLasers[i];
      lz.timer--;
      if (lz.timer === 18 && !lz.fired) {
        lz.fired = true;
        shakeTime = 10;
        playSound('laserFire');
      }
      if (lz.timer <= 18 && lz.timer > 0) {
        if (Math.abs(pCenterX - lz.x) < 16 && pCenterY > lz.startY) {
          shakeTime = 18;
          spawnParticles(pCenterX, pCenterY, '#FF3B6B', 26);
          showResult(false);
          return;
        }
      }
      if (lz.timer <= 0) {
        bossLasers.splice(i, 1);
      }
    }

    // RECORDモード & ストーリーモード：画面外から狙撃するアーチャー＆雪だるまのスポーン
    const canSpawnAmbusher = config.isRecord || (config.isStory && (!activeBoss || player.y - goalY >= 700) && Math.random() < (config.archerChance || 0));
    if (canSpawnAmbusher) {
      ambusherSpawnTimer--;
      if (ambusherSpawnTimer <= 0 && ambusherEnemies.length < 2) {
        spawnAmbusher();
        const scaleReduction = config.isRecord ? Math.min(85, Math.floor(maxAltitude * 0.25)) : 0;
        ambusherSpawnTimer = Math.max(150, 270 - scaleReduction + Math.floor(Math.random() * 70));
      }
    }

    // 妨害敵キャラの更新（アーチャーは画面外から狙撃、雪だるまは壁際から雪玉投下）
    for (let i = ambusherEnemies.length - 1; i >= 0; i--) {
      const e = ambusherEnemies[i];
      const worldY = cameraY + e.relY;

      if (e.state === 'entering') {
        e.slideProgress += 0.08;
        if (e.slideProgress >= 1) {
          e.slideProgress = 1;
          e.state = 'action';
          e.timer = 0;
          if (e.type === 'archer') {
            e.aimY = Math.max(cameraY + 120, Math.min(cameraY + canvas.height - 120, pCenterY));
          }
        }
      } else if (e.state === 'action') {
        e.timer++;
        if (e.type === 'archer') {
          if (e.timer < 38) {
            e.aimY += (pCenterY - e.aimY) * 0.07;
          }
          if (e.timer === 52 && e.shotsFired === 0) {
            const startX = e.side === 'left' ? -16 : canvas.width + 16;
            const targetX = e.side === 'left' ? RIGHT_WALL_X : LEFT_WALL_X;
            const dx = targetX - startX;
            const dy = e.aimY - worldY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const arrowSpeed = 4.8;

            projectiles.push({
              type: 'arrow',
              x: startX,
              y: worldY,
              vx: (dx / dist) * arrowSpeed,
              vy: (dy / dist) * arrowSpeed,
              angle: Math.atan2(dy, dx),
              life: 240
            });
            playSound('arrow');
            e.shotsFired = 1;
          }
          if (e.timer >= 72) {
            e.state = 'leaving';
          }
        } else {
          if ((e.timer === 25 || e.timer === 58) && e.shotsFired < 2) {
            const startX = e.side === 'left' ? LEFT_WALL_X + 26 : RIGHT_WALL_X - 26;
            const dir = e.side === 'left' ? 1 : -1;
            projectiles.push({
              type: 'snowball',
              x: startX,
              y: worldY - 8,
              vx: dir * (2.0 + Math.random() * 1.4),
              vy: -3.2,
              radius: 11,
              reflected: false,
              life: 320
            });
            playSound('snowball');
            e.shotsFired++;
          }
          if (e.timer >= 82) {
            e.state = 'leaving';
          }
        }
      } else if (e.state === 'leaving') {
        e.slideProgress -= 0.08;
        if (e.slideProgress <= 0) {
          ambusherEnemies.splice(i, 1);
        }
      }
    }

    // 飛び道具（矢・雪玉・ボスエネルギー弾）の更新と当たり判定
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      proj.life--;
      if (proj.life <= 0) {
        projectiles.splice(i, 1);
        continue;
      }

      if (proj.type === 'arrow') {
        proj.x += proj.vx;
        proj.y += proj.vy;
        const pastLeft = proj.vx < 0 && proj.x < -30;
        const pastRight = proj.vx > 0 && proj.x > canvas.width + 30;
        if (pastLeft || pastRight) {
          projectiles.splice(i, 1);
          continue;
        }
        if (proj.x > px1 && proj.x < px2 && proj.y > py1 && proj.y < py2) {
          shakeTime = 18;
          spawnParticles(pCenterX, pCenterY, '#FF3B6B', 26);
          showResult(false);
          return;
        }
      } else if (proj.type === 'snowball') {
        if (!proj.reflected) {
          proj.vy += 0.24;
        }
        proj.x += proj.vx;
        proj.y += proj.vy;

        if (!proj.reflected) {
          if (proj.x - proj.radius <= LEFT_WALL_X) {
            proj.x = LEFT_WALL_X + proj.radius;
            proj.vx = Math.abs(proj.vx) * 0.85;
          } else if (proj.x + proj.radius >= RIGHT_WALL_X) {
            proj.x = RIGHT_WALL_X - proj.radius;
            proj.vx = -Math.abs(proj.vx) * 0.85;
          }
        }

        const dx = pCenterX - proj.x;
        const dy = pCenterY - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = player.spinTimer > 0 ? (player.size / 2 + 12) : (player.size / 2 - 2);

        if (dist < (proj.radius - 2) + hitRadius) {
          if (player.spinTimer > 0 && !proj.reflected) {
            proj.reflected = true;
            proj.vx = (dx >= 0 ? -1 : 1) * 9.5;
            proj.vy = -6.5;
            proj.life = 90;
            shakeTime = 6;
            playSound('deflect');
            spawnParticles(proj.x, proj.y, '#00D2FF', 14, false);
          } else if (!proj.reflected) {
            shakeTime = 18;
            spawnParticles(pCenterX, pCenterY, '#00D2FF', 26);
            showResult(false);
            return;
          }
        }

        if (proj.reflected) {
          for (let j = bats.length - 1; j >= 0; j--) {
            const b = bats[j];
            const bdx = b.x - proj.x;
            const bdy = b.y - proj.y;
            if (Math.sqrt(bdx * bdx + bdy * bdy) < b.radius + proj.radius) {
              playSound('batKill');
              spawnParticles(b.x, b.y, '#A855F7', 16, false);
              bats.splice(j, 1);
              projectiles.splice(i, 1);
              break;
            }
          }
        }
      } else if (proj.type === 'bossOrb') {
        proj.x += proj.vx;
        proj.y += proj.vy;

        if (!proj.reflected) {
          if (proj.x - proj.radius <= LEFT_WALL_X || proj.x + proj.radius >= RIGHT_WALL_X) {
            proj.vx *= -1;
          }
          const dx = pCenterX - proj.x;
          const dy = pCenterY - proj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const hitRadius = player.spinTimer > 0 ? (player.size / 2 + 14) : (player.size / 2 - 2);

          if (dist < (proj.radius - 2) + hitRadius) {
            if (player.spinTimer > 0 && activeBoss) {
              proj.reflected = true;
              const bdx = activeBoss.x - proj.x;
              const bdy = activeBoss.y - proj.y;
              const bdist = Math.max(1, Math.sqrt(bdx * bdx + bdy * bdy));
              proj.vx = (bdx / bdist) * 11.5;
              proj.vy = (bdy / bdist) * 11.5;
              shakeTime = 7;
              playSound('deflect');
              spawnParticles(proj.x, proj.y, '#FFD600', 14, false);
            } else {
              shakeTime = 18;
              spawnParticles(pCenterX, pCenterY, '#FF3B6B', 26);
              showResult(false);
              return;
            }
          }
        } else if (activeBoss && activeBoss.hp > 0) {
          const bdx = activeBoss.x - proj.x;
          const bdy = activeBoss.y - proj.y;
          if (Math.sqrt(bdx * bdx + bdy * bdy) < 48 + proj.radius) {
            activeBoss.hp--;
            activeBoss.hitFlash = 16;
            updateBossHpUi();
            shakeTime = 14;
            playSound('bossDamage');
            spawnParticles(activeBoss.x, activeBoss.y, '#FF3B6B', 24, false);
            projectiles.splice(i, 1);

            if (activeBoss.hp <= 0) {
              bossHud.classList.add('hidden');
              bossLasers = [];
              spawnParticles(activeBoss.x, activeBoss.y, '#FFD600', 40, false);
              maxAltitude = config.goalMeters;
              showResult(true);
              return;
            }
            continue;
          }
        }
      } else if (proj.type === 'bossSpread') {
        proj.x += proj.vx;
        proj.y += proj.vy;
        if (proj.x - proj.radius <= LEFT_WALL_X || proj.x + proj.radius >= RIGHT_WALL_X) {
          proj.vx *= -1;
        }
        const dx = pCenterX - proj.x;
        const dy = pCenterY - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (!proj.reflected && dist < proj.radius + (player.size / 2 - 3)) {
          shakeTime = 18;
          spawnParticles(pCenterX, pCenterY, '#A855F7', 24);
          showResult(false);
          return;
        }
      }
    }

    // 奥から迫る鳥のスポーン＆更新（出現位置から横・縦に動かない固定軌道）
    const nearGoal = !config.isRecord && (player.y - goalY < (activeBoss ? 700 : 260));
    if (!nearGoal && (!activeBoss || !activeBoss.active)) {
      birdSpawnTimer--;
      if (birdSpawnTimer <= 0) {
        spawnDepthBird();
        const scaleReduction = config.isRecord ? Math.min(75, Math.floor(maxAltitude * 0.2)) : 0;
        birdSpawnTimer = Math.max(95, config.birdInterval - scaleReduction + Math.floor(Math.random() * 55));
      }
    }

    for (let i = birds.length - 1; i >= 0; i--) {
      const bird = birds[i];
      bird.z += bird.speedZ;
      bird.wingPhase += 0.28;

      if (bird.z >= 0.90 && bird.z <= 1.08 && !bird.hasHit) {
        const dx = pCenterX - bird.x;
        const dy = pCenterY - bird.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 25) {
          bird.hasHit = true;
          shakeTime = 20;
          spawnParticles(pCenterX, pCenterY, '#FF9100', 28);
          showResult(false);
          return;
        }
      }

      if (bird.z > 1.25) {
        birds.splice(i, 1);
      }
    }

    // コウモリの移動と当たり判定（回転攻撃中なら剣の撃破率に応じて撃破、押し負け時は鍔迫り合い演出）
    for (let i = bats.length - 1; i >= 0; i--) {
      const bat = bats[i];
      bat.x += bat.vx;
      bat.flapPhase += 0.24;
      bat.bobPhase += 0.06;
      bat.y = bat.baseY + Math.sin(bat.bobPhase) * 14;

      if (bat.x - bat.radius <= LEFT_WALL_X + 6) {
        bat.x = LEFT_WALL_X + 6 + bat.radius;
        bat.vx *= -1;
      } else if (bat.x + bat.radius >= RIGHT_WALL_X - 6) {
        bat.x = RIGHT_WALL_X - 6 - bat.radius;
        bat.vx *= -1;
      }

      const dx = pCenterX - bat.x;
      const dy = pCenterY - bat.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitDist = player.spinTimer > 0 ? (bat.radius + player.size / 2 + 12) : (bat.radius + player.size / 2 - 4);

      if (dist < hitDist) {
        if (player.spinTimer > 0) {
          const equippedSword = getCurrentSword();
          if (Math.random() < equippedSword.batKillRate) {
            shakeTime = 8;
            playSound('batKill');
            spawnParticles(bat.x, bat.y, equippedSword.glowColor, 20, false);
            bats.splice(i, 1);
            continue;
          } else {
            // 確率で押し負けた場合：「ギィーン！」と火花を散らす鍔迫り合い演出へ移行
            playSound('clash');
            shakeTime = 12;
            const pushDir = pCenterX < bat.x ? -1 : 1;
            player.clashState = {
              timer: 32,
              batX: bat.x,
              batY: bat.y,
              pushVx: pushDir * 3.5
            };
            spawnParticles((pCenterX + bat.x) / 2, (pCenterY + bat.y) / 2, '#FFD600', 18, false);
            return;
          }
        } else {
          shakeTime = 18;
          spawnParticles(pCenterX, pCenterY, '#A855F7', 26);
          showResult(false);
          return;
        }
      }
    }

    // パーティクル更新
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.rotation += p.vRot;
      p.life -= 0.035;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // 描画処理
  function draw() {
    const config = STAGES[currentDifficulty];

    ctx.save();
    if (shakeTime > 0) {
      const dx = (Math.random() - 0.5) * 11;
      const dy = (Math.random() - 0.5) * 11;
      ctx.translate(dx, dy);
      shakeTime--;
    }

    // 1. 背景グラデーション
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, config.bgTop);
    bgGrad.addColorStop(1, config.bgBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1.5 パララックス遠景シルエット（各サブパスを必ず独立したbeginPathで描画）
    ctx.save();
    const parallaxY = -(cameraY * 0.08);
    if (config.isStory && config.storyArc === 'space') {
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 36; i++) {
        const sx = LEFT_WALL_X + ((i * 73) % (RIGHT_WALL_X - LEFT_WALL_X));
        const sy = ((i * 137 + parallaxY) % canvas.height + canvas.height) % canvas.height;
        const r = (i % 3 === 0) ? 2.2 : 1.2;
        ctx.globalAlpha = 0.4 + ((i % 5) * 0.12);
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#A5B4FC';
      ctx.beginPath();
      ctx.arc(260, 220, 42, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#C7D2FE';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(260, 220, 78, 16, -0.25, 0, Math.PI * 2);
      ctx.stroke();
    } else if (config.isStory && config.storyArc === 'world') {
      ctx.fillStyle = 'rgba(13, 148, 136, 0.12)';
      ctx.beginPath();
      ctx.moveTo(60, canvas.height);
      ctx.lineTo(160, canvas.height - 150);
      ctx.lineTo(260, canvas.height);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(200, canvas.height);
      ctx.lineTo(285, canvas.height - 110);
      ctx.lineTo(370, canvas.height);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(2, 132, 199, 0.11)';
      ctx.beginPath();
      ctx.moveTo(45, canvas.height);
      ctx.quadraticCurveTo(155, canvas.height - 55, 190, canvas.height - 155);
      ctx.lineTo(230, canvas.height - 155);
      ctx.quadraticCurveTo(265, canvas.height - 55, 375, canvas.height);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.moveTo(190, canvas.height - 155);
      ctx.lineTo(230, canvas.height - 155);
      ctx.lineTo(242, canvas.height - 122);
      ctx.lineTo(222, canvas.height - 132);
      ctx.lineTo(210, canvas.height - 120);
      ctx.lineTo(198, canvas.height - 132);
      ctx.lineTo(178, canvas.height - 122);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 雲（宇宙編以外）
    if (!config.isStory || config.storyArc !== 'space') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      for (let c of bgClouds) {
        const cy = ((c.y - cameraY * 0.25) % canvas.height + canvas.height) % canvas.height;
        drawRoundRect(c.x, cy, c.w, c.h, 8);
        ctx.fill();
      }
    }

    // 2. 背景のポップなグリッド線
    ctx.strokeStyle = (config.isStory && config.storyArc === 'space') ? 'rgba(255, 255, 255, 0.08)' : 'rgba(30, 30, 36, 0.06)';
    ctx.lineWidth = 2;
    const gridSize = 52;
    const offsetY = -(cameraY % gridSize);
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(LEFT_WALL_X, y);
      ctx.lineTo(RIGHT_WALL_X, y);
      ctx.stroke();
    }

    // 3. 高度マーカー（20mごと・カメラ表示範囲内のみ計算）
    ctx.font = '900 13px "M PLUS Rounded 1c", sans-serif';
    ctx.fillStyle = (config.isStory && config.storyArc === 'space') ? 'rgba(255, 255, 255, 0.28)' : 'rgba(30, 30, 36, 0.24)';
    ctx.textAlign = 'center';
    const minVisibleAlt = Math.max(20, Math.floor(((580 - (cameraY + canvas.height + 40)) / PIXELS_PER_METER) / 20) * 20);
    const rawMaxAlt = Math.ceil(((580 - (cameraY - 40)) / PIXELS_PER_METER) / 20) * 20;
    const maxVisibleAlt = Number.isFinite(config.goalMeters) ? Math.min(config.goalMeters - 10, rawMaxAlt) : rawMaxAlt;
    for (let m = minVisibleAlt; m <= maxVisibleAlt; m += 20) {
      const lineY = (580 - m * PIXELS_PER_METER) - cameraY;
      ctx.fillText(`- ${m}m -`, canvas.width / 2, lineY);
    }

    // 4. ゴールラインの描画（通常ステージ＆ストーリーモード）
    if (!config.isRecord) {
      const screenGoalY = goalY - cameraY;
      if (screenGoalY > -100 && screenGoalY < canvas.height + 100) {
        const stripeW = 20;
        for (let x = LEFT_WALL_X; x < RIGHT_WALL_X; x += stripeW) {
          ctx.fillStyle = ((x / stripeW) % 2 === 0) ? '#00E676' : '#1E1E24';
          ctx.fillRect(x, screenGoalY - 12, stripeW, 12);
          ctx.fillStyle = ((x / stripeW) % 2 === 0) ? '#1E1E24' : '#00E676';
          ctx.fillRect(x, screenGoalY, stripeW, 12);
        }
        ctx.fillStyle = (config.isStory && config.storyArc === 'space') ? '#FFD600' : '#1E1E24';
        ctx.font = '900 20px "M PLUS Rounded 1c", sans-serif';
        ctx.fillText('GOAL!!', canvas.width / 2, screenGoalY - 20);
      }
    }

    // 4.5 コインの描画
    for (let c of coins) {
      const cy = c.y - cameraY;
      if (cy < -30 || cy > canvas.height + 30) continue;

      const scaleX = Math.max(0.25, Math.abs(Math.cos(c.phase)));
      ctx.save();
      ctx.translate(c.x, cy);
      ctx.scale(scaleX, 1);

      ctx.fillStyle = '#FFD600';
      ctx.strokeStyle = '#1E1E24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(-2, -5, 4, 10);

      ctx.restore();
    }

    // 5. 連続トゲ帯の描画
    for (let band of spikeBands) {
      const by = band.y - cameraY;
      if (by + band.totalHeight < -50 || by > canvas.height + 50) continue;

      const baseFill = band.isMoving ? '#FF9100' : '#FF2A55';
      const darkFill = band.isMoving ? '#C2410C' : '#BE123C';
      ctx.strokeStyle = '#1E1E24';
      ctx.lineWidth = 2.5;

      ctx.fillStyle = '#1E1E24';
      if (band.side === 'left') {
        ctx.fillRect(LEFT_WALL_X - 2, by, 6, band.totalHeight);
      } else {
        ctx.fillRect(RIGHT_WALL_X - 4, by, 6, band.totalHeight);
      }

      for (let i = 0; i < band.count; i++) {
        const sy = by + i * band.spikeHeight;
        const midY = sy + band.spikeHeight / 2;
        const tipX = band.side === 'left' ? (LEFT_WALL_X + band.width) : (RIGHT_WALL_X - band.width);
        const baseX = band.side === 'left' ? LEFT_WALL_X : RIGHT_WALL_X;

        ctx.fillStyle = baseFill;
        ctx.beginPath();
        ctx.moveTo(baseX, sy);
        ctx.lineTo(tipX, midY);
        ctx.lineTo(baseX, midY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = darkFill;
        ctx.beginPath();
        ctx.moveTo(baseX, midY);
        ctx.lineTo(tipX, midY);
        ctx.lineTo(baseX, sy + band.spikeHeight);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(baseX, sy);
        ctx.lineTo(tipX, midY);
        ctx.lineTo(baseX, sy + band.spikeHeight);
        ctx.closePath();
        ctx.stroke();
      }
    }

    // 6. ボスの描画
    if (activeBoss && activeBoss.hp > 0) {
      const bx = activeBoss.x;
      const by = activeBoss.y - cameraY;
      if (by > -120 && by < canvas.height + 120) {
        ctx.save();
        ctx.translate(bx, by);
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
        if (!bossGif) {

        // 背後の回転エネルギーリング
        ctx.save();
        ctx.rotate(Date.now() * 0.002);
        ctx.strokeStyle = 'rgba(255, 59, 107, 0.45)';
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, 56, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 左右の浮遊ショルダーアーマー（別々のパスで描画）
        const hoverY = Math.sin(Date.now() * 0.006) * 5;
        ctx.fillStyle = '#FFD600';
        ctx.strokeStyle = '#1E1E24';
        ctx.lineWidth = 3;
        drawRoundRect(-56, -16 + hoverY, 16, 30, 3);
        ctx.fill();
        ctx.stroke();

        drawRoundRect(40, -16 + hoverY, 16, 30, 3);
        ctx.fill();
        ctx.stroke();

        // ボス本体
        ctx.fillStyle = activeBoss.hitFlash > 0 ? '#FFFFFF' : bossTheme().body;
        drawRoundRect(-42, -36, 84, 72, 10);
        ctx.fill();
        ctx.stroke();

        // 左右のツノ装飾（別々のパスで描画）
        ctx.fillStyle = '#FFD600';
        ctx.beginPath();
        ctx.moveTo(-34, -36);
        ctx.lineTo(-46, -58);
        ctx.lineTo(-16, -36);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(34, -36);
        ctx.lineTo(46, -58);
        ctx.lineTo(16, -36);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 顔・目
        ctx.fillStyle = '#1E1E24';
        ctx.fillRect(-26, -12, 18, 12);
        ctx.fillRect(8, -12, 18, 12);
        ctx.fillStyle = '#FFD600';
        ctx.fillRect(-20, -9, 8, 6);
        ctx.fillRect(12, -9, 8, 6);

        // 口
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-22, 12, 44, 10);
        ctx.strokeRect(-22, 12, 44, 10);
        }

        ctx.restore();
      }
    }

    // 6.5 ボスの予告レーザー＆照射ビームの描画
    for (let lz of bossLasers) {
      const startScreenY = lz.startY - cameraY;
      ctx.save();
      if (lz.timer > 18) {
        // 照射前の赤い照準ガイドライン
        ctx.strokeStyle = bossTheme().guide;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(lz.x, startScreenY);
        ctx.lineTo(lz.x, canvas.height);
        ctx.stroke();
      } else {
        // 極太レーザービーム本体
        ctx.fillStyle = 'rgba(255, 59, 107, 0.35)';
        ctx.fillStyle = bossTheme().glow; ctx.fillRect(lz.x - 18, startScreenY, 36, canvas.height - startScreenY);
        ctx.fillStyle = '#FF2A55';
        ctx.fillStyle = bossTheme().beam; ctx.fillRect(lz.x - 10, startScreenY, 20, canvas.height - startScreenY);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(lz.x - 4, startScreenY, 8, canvas.height - startScreenY);
      }
      ctx.restore();
    }

    // 7. 横から現れる妨害キャラの描画
    for (let e of ambusherEnemies) {
      const sy = e.relY;
      ctx.save();

      if (e.type === 'archer') {
        const isLeft = e.side === 'left';
        const peekX = isLeft ? (LEFT_WALL_X + e.slideProgress * 14) : (RIGHT_WALL_X - e.slideProgress * 14);
        const dir = isLeft ? 1 : -1;

        if (e.state === 'action' && e.timer < 52) {
          const aimScreenY = e.aimY - cameraY;
          ctx.save();
          ctx.strokeStyle = e.timer > 36 ? '#FF2A55' : 'rgba(255, 42, 85, 0.55)';
          ctx.lineWidth = e.timer > 36 ? 3 : 2;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.moveTo(isLeft ? 0 : canvas.width, sy);
          ctx.lineTo(isLeft ? RIGHT_WALL_X : LEFT_WALL_X, aimScreenY);
          ctx.stroke();

          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(isLeft ? LEFT_WALL_X + 36 : RIGHT_WALL_X - 36, sy + (aimScreenY - sy) * 0.15, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.translate(peekX, sy);
        ctx.scale(dir, 1);

        ctx.fillStyle = '#065F46';
        ctx.strokeStyle = '#1E1E24';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-14, -10);
        ctx.lineTo(-26, 16);
        ctx.lineTo(-8, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(-4, -4, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1E1E24';
        ctx.beginPath();
        ctx.arc(-1, -4, 7, -0.6, 1.2);
        ctx.fill();
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(0, -6, 4, 3);

        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.ellipse(-4, -13, 15, 4, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FF3B6B';
        ctx.beginPath();
        ctx.moveTo(-10, -14);
        ctx.quadraticCurveTo(-22, -26, -14, -28);
        ctx.quadraticCurveTo(-6, -22, -8, -14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#92400E';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(4, -20);
        ctx.quadraticCurveTo(18, -10, 14, 0);
        ctx.quadraticCurveTo(18, 10, 4, 20);
        ctx.stroke();

        ctx.fillStyle = '#FFD600';
        ctx.fillRect(11, -3, 5, 6);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(4, -20);
        ctx.lineTo(e.shotsFired === 0 ? -4 : 4, 0);
        ctx.lineTo(4, 20);
        ctx.stroke();
      } else {
        const offset = e.slideProgress * 34;
        const sx = e.side === 'left' ? (LEFT_WALL_X - 34 + offset) : (RIGHT_WALL_X + 34 - offset);
        const dir = e.side === 'left' ? 1 : -1;

        ctx.translate(sx, sy);
        ctx.scale(dir, 1);

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#1E1E24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 10, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, -8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FF3B6B';
        ctx.fillRect(-7, -24, 14, 9);
        ctx.strokeRect(-7, -24, 14, 9);

        ctx.fillStyle = '#1E1E24';
        ctx.fillRect(3, -10, 3, 3);
        ctx.fillStyle = '#FF9100';
        ctx.beginPath();
        ctx.moveTo(8, -7);
        ctx.lineTo(17, -5);
        ctx.lineTo(8, -3);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 8. 飛び道具の描画
    for (let proj of projectiles) {
      const py = proj.y - cameraY;
      if (proj.sprite) continue;
      if (py < -50 || py > canvas.height + 50) continue;

      ctx.save();
      ctx.translate(proj.x, py);

      if (proj.type === 'arrow') {
        ctx.rotate(proj.angle);
        ctx.fillStyle = '#92400E';
        ctx.strokeStyle = '#1E1E24';
        ctx.lineWidth = 2;
        ctx.fillRect(-16, -2.5, 28, 5);
        ctx.strokeRect(-16, -2.5, 28, 5);

        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.moveTo(12, -6);
        ctx.lineTo(22, 0);
        ctx.lineTo(12, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FF3B6B';
        ctx.fillRect(-18, -5, 6, 10);
      } else if (proj.type === 'snowball') {
        ctx.fillStyle = proj.reflected ? '#00D2FF' : '#E0F2FE';
        ctx.strokeStyle = '#1E1E24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-3, -3, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'bossOrb') {
        ctx.fillStyle = proj.reflected ? '#00E676' : bossTheme().orb;
        ctx.strokeStyle = '#1E1E24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFD600';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (proj.type === 'bossSpread') {
        ctx.fillStyle = proj.reflected ? '#00E676' : bossTheme().spread;
        ctx.strokeStyle = '#1E1E24';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 9. 左右の立体的な壁
    ctx.fillStyle = config.wallColor;
    ctx.fillRect(0, 0, WALL_WIDTH, canvas.height);
    ctx.fillRect(RIGHT_WALL_X, 0, WALL_WIDTH, canvas.height);

    ctx.fillStyle = config.wallLight;
    ctx.fillRect(LEFT_WALL_X - 7, 0, 7, canvas.height);
    ctx.fillRect(RIGHT_WALL_X, 0, 7, canvas.height);

    ctx.fillStyle = config.wallDark;
    ctx.fillRect(0, 0, 8, canvas.height);
    ctx.fillRect(canvas.width - 8, 0, 8, canvas.height);

    const blockH = 64;
    const wallOffsetY = -(cameraY % blockH);
    ctx.strokeStyle = '#1E1E24';
    ctx.lineWidth = 3;
    for (let y = wallOffsetY - blockH; y < canvas.height + blockH; y += blockH) {
      ctx.strokeRect(0, y, WALL_WIDTH, blockH);
      ctx.strokeRect(RIGHT_WALL_X, y, WALL_WIDTH, blockH);

      ctx.fillStyle = '#1E1E24';
      ctx.beginPath();
      ctx.arc(14, y + 12, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(14, y + blockH - 12, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(RIGHT_WALL_X + 24, y + 12, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(RIGHT_WALL_X + 24, y + blockH - 12, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 10. コウモリの描画（耳のパスを個別に分離）
    for (let bat of bats) {
      const by = bat.y - cameraY;
      if (by < -50 || by > canvas.height + 50) continue;

      const wingY = Math.sin(bat.flapPhase) * 9;
      ctx.save();
      ctx.translate(bat.x, by);

      ctx.fillStyle = '#6D28D9';
      ctx.strokeStyle = '#1E1E24';
      ctx.lineWidth = 2.5;

      // 左翼
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(-22, -14 + wingY, -28, 2 + wingY);
      ctx.quadraticCurveTo(-16, 6, -6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 右翼
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.quadraticCurveTo(22, -14 + wingY, 28, 2 + wingY);
      ctx.quadraticCurveTo(16, 6, 6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 胴体
      ctx.fillStyle = '#4C1D95';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 左耳
      ctx.beginPath();
      ctx.moveTo(-8, -7);
      ctx.lineTo(-10, -16);
      ctx.lineTo(-2, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 右耳
      ctx.beginPath();
      ctx.moveTo(8, -7);
      ctx.lineTo(10, -16);
      ctx.lineTo(2, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 光る黄色い目
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-6, -3, 4, 4);
      ctx.fillRect(2, -3, 4, 4);

      ctx.restore();
    }

    // 11. 奥（Z軸）から迫りくる鳥の描画（左右の目を別々のパスで描画）
    for (let bird of birds) {
      const by = bird.y - cameraY;
      if (by < -80 || by > canvas.height + 80) continue;

      const scale = 0.22 + bird.z * 1.15;
      const isDangerZone = bird.z >= 0.72 && bird.z <= 1.08;

      ctx.save();
      ctx.translate(bird.x, by);

      if (bird.z < 1.05) {
        ctx.strokeStyle = isDangerZone ? '#FF2A55' : 'rgba(255, 145, 0, 0.65)';
        ctx.lineWidth = isDangerZone ? 3 : 2;
        const ringRadius = Math.max(12, 38 * (1.15 - bird.z));
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        if (isDangerZone) {
          ctx.fillStyle = '#FF2A55';
          ctx.font = '900 18px "M PLUS Rounded 1c", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('!', 0, -ringRadius - 6);
        }
      }

      ctx.scale(scale, scale);
      const flap = Math.sin(bird.wingPhase) * 14;

      ctx.fillStyle = isDangerZone ? '#FF3B6B' : '#FF9100';
      ctx.strokeStyle = '#1E1E24';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.quadraticCurveTo(-34, -22 + flap, -44, -4 + flap);
      ctx.quadraticCurveTo(-24, 8, -10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.quadraticCurveTo(34, -22 + flap, 44, -4 + flap);
      ctx.quadraticCurveTo(24, 8, 10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-6, -3, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(6, -3, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1E1E24';
      ctx.beginPath();
      ctx.arc(-6, -3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(6, -3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFD600';
      ctx.beginPath();
      ctx.moveTo(-5, 3);
      ctx.lineTo(5, 3);
      ctx.lineTo(0, 13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    // 12. プレイヤーの残像＆キャラクター本体
    const activeSkin = getCurrentSkin();
    const activeSword = getCurrentSword();
    for (let img of afterimages) {
      ctx.save();
      ctx.globalAlpha = img.alpha;
      ctx.translate(img.x + player.size / 2, (img.y - cameraY) + player.size / 2);
      ctx.rotate(img.rotation);
      ctx.fillStyle = img.isSpin ? activeSword.glowColor : activeSkin.trailColor;
      drawRoundRect(-player.size / 2, -player.size / 2, player.size, player.size, 4);
      ctx.fill();
      ctx.restore();
    }

    if (gameState === 'playing' || gameState === 'clear' || gameState === 'title') {
      const px = player.x + player.size / 2;
      const py = (player.y - cameraY) + player.size / 2;
      const half = player.size / 2;

      // 回転攻撃中の斬撃オーラリング
      if (player.spinTimer > 0) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Date.now() * 0.03);
        ctx.strokeStyle = activeSword.glowColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, half + 18, 0, Math.PI * 1.45);
        ctx.stroke();

        ctx.strokeStyle = '#FFD600';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, half + 23, Math.PI, Math.PI * 2.35);
        ctx.stroke();
        ctx.restore();
      }

      // 鍔迫り合い（押し負け）中の火花リング＆「ギィーン！」演出
      if (player.clashState) {
        const cs = player.clashState;
        const clashX = (px + cs.batX) / 2;
        const clashY = (py + (cs.batY - cameraY)) / 2;
        ctx.save();
        ctx.translate(clashX, clashY);
        ctx.rotate(Date.now() * 0.04);
        ctx.strokeStyle = '#FFD600';
        ctx.lineWidth = 3;
        for (let k = 0; k < 4; k++) {
          ctx.rotate(Math.PI / 4);
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(18, 0);
          ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.font = '900 15px "M PLUS Rounded 1c", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD600';
        ctx.strokeStyle = '#1E1E24';
        ctx.lineWidth = 4;
        ctx.strokeText('ギィーン!!', clashX, clashY - 22);
        ctx.fillText('ギィーン!!', clashX, clashY - 22);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(px, py);

      // キャラクター本体と一体になって回転・伸縮するグループ
      ctx.rotate(player.rotation);
      ctx.scale(player.squashX, player.squashY);

      // 通常時（非攻撃時）：常にキャラクターの背中に斜めに装備している見た目
      if (player.spinTimer <= 0 && !player.clashState) {
        ctx.save();
        const backDir = -player.facing;
        ctx.translate(backDir * (half - 2), 3);
        const sheathedAngle = backDir === -1 ? (-Math.PI * 0.65) : (-Math.PI * 0.35);
        ctx.rotate(sheathedAngle);
        drawSwordGraphic(activeSword, 36);
        ctx.restore();
      }

      // 風になびくハチマキの尾
      ctx.fillStyle = activeSkin.bandColor;
      ctx.strokeStyle = '#1E1E24';
      ctx.lineWidth = 2.5;
      const tailDir = -player.facing;
      const wave = Math.sin(Date.now() * 0.018) * 4;
      ctx.beginPath();
      ctx.moveTo(tailDir * (half - 2), -half + 6);
      ctx.lineTo(tailDir * (half + 14), -half + 2 + wave);
      ctx.lineTo(tailDir * (half + 11), -half + 11 + wave);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 手足のアクション表現
      ctx.fillStyle = '#1E1E24';
      if (player.onWall) {
        const wallDir = player.onWall === 'left' ? -1 : 1;
        ctx.fillRect(wallDir * (half + 2), -6, 4, 6);
        ctx.fillRect(wallDir * (half + 2), 6, 4, 6);
      } else {
        ctx.fillRect(-half - 3, 2, 4, 6);
        ctx.fillRect(half - 1, -4, 4, 6);
      }

      // 本体キューブ
      if (player.spinTimer > 0) {
        ctx.fillStyle = '#00F5D4';
      } else if (player.lockoutTimer > 0) {
        ctx.fillStyle = '#94A3B8';
      } else {
        ctx.fillStyle = player.airJumpAvailable ? activeSkin.bodyColor : activeSkin.usedColor;
      }
      ctx.strokeStyle = '#1E1E24';
      ctx.lineWidth = 3;
      drawRoundRect(-half, -half, player.size, player.size, 4);
      ctx.fill();
      ctx.stroke();

      // 王様スキンの王冠装飾
      if (activeSkin.crown) {
        ctx.fillStyle = '#FFD600';
        ctx.beginPath();
        ctx.moveTo(-8, -half);
        ctx.lineTo(-8, -half - 8);
        ctx.lineTo(-3, -half - 4);
        ctx.lineTo(0, -half - 9);
        ctx.lineTo(3, -half - 4);
        ctx.lineTo(8, -half - 8);
        ctx.lineTo(8, -half);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // ハチマキ本体
      ctx.fillStyle = activeSkin.bandColor;
      ctx.fillRect(-half + 1, -half + 4, player.size - 2, 6);
      ctx.strokeRect(-half + 1, -half + 4, player.size - 2, 6);

      // 目
      ctx.fillStyle = activeSkin.eyeColor;
      const eyeOffsetX = player.facing * 4;
      ctx.fillRect(eyeOffsetX - 5, -1, 4, 6);
      ctx.fillRect(eyeOffsetX + 2, -1, 4, 6);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(eyeOffsetX - 4, 0, 1.5, 2);
      ctx.fillRect(eyeOffsetX + 3, 0, 1.5, 2);

      // 回転攻撃中または鍔迫り合い中：「Q」の丸と棒のように、キャラ中心から斜め外周へ剣を突き出して一緒に回転
      if (player.spinTimer > 0 || player.clashState) {
        ctx.save();
        if (player.facing === -1) {
          ctx.scale(-1, 1);
        }
        ctx.rotate(Math.PI * 0.22);
        ctx.translate(half - 1, 0);
        drawSwordGraphic(activeSword, 46);
        ctx.restore();
      }

      ctx.restore();

      // クールダウン中の頭上ミニゲージ
      if (player.lockoutTimer > 0) {
        const ratio = player.lockoutTimer / 60;
        const barW = 28;
        const barX = px - barW / 2;
        const barY = py - half - 11;
        ctx.fillStyle = '#1E1E24';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, 6);
        ctx.fillStyle = '#00D2FF';
        ctx.fillRect(barX, barY, barW * (1 - ratio), 4);
      }
    }

    // 13. パーティクルの描画
    for (let p of particles) {
      ctx.save();
      ctx.translate(p.x, p.y - cameraY);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#1E1E24';
      ctx.lineWidth = 2;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    ctx.restore();
  }

  // メインループ
  function loop() {
    update();
    draw();
    if (gameState === 'playing' || particles.length > 0 || shakeTime > 0) {
      animationId = requestAnimationFrame(loop);
    }
  }

  // 初期背景描画
  initClouds();
  draw();

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
            type: 'bossSpread', sprite: 'shrapnel', scol: '#EF4444', sz: 11, x: e.x, y: e.y,
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
    id: 'totem', name: '不死のトーテム', price: 810, max: 3, color: '#FACC15',
    desc: '持っていると、やられたときに自動で復活する（約2秒の無敵付きだぜ）。1個につき1回。',
    icon: '<svg viewBox="0 0 48 48"><rect x="14" y="5" width="20" height="38" rx="4" fill="#FACC15" stroke="#1E1E24" stroke-width="2"/><rect x="18" y="14" width="5" height="6" fill="#1E1E24"/><rect x="26" y="14" width="5" height="6" fill="#1E1E24"/><rect x="18" y="28" width="12" height="4" fill="#1E1E24"/><path d="M9 11l5 5M39 11l-5 5M24 1v4" stroke="#FDE047" stroke-width="3" stroke-linecap="round"/></svg>'
  },
  {
    id: 'smoke', name: '煙玉', price: 250, max: 5, color: '#CBD5E1',
    desc: 'Zキーで使用。画面の敵の弾とレーザーを消し、約1.5秒の間ダメージを受けないように設定下つもりだけど死がったらごめんちょ',
    icon: '<svg viewBox="0 0 48 48"><circle cx="16" cy="28" r="9" fill="#E2E8F0" stroke="#1E1E24" stroke-width="2"/><circle cx="28" cy="24" r="11" fill="#F1F5F9" stroke="#1E1E24" stroke-width="2"/><circle cx="34" cy="32" r="7" fill="#CBD5E1" stroke="#1E1E24" stroke-width="2"/></svg>'
  },
  {
    id: 'flash', name: '閃光玉', price: 300, max: 5, color: '#FEF08A',
    desc: 'Zキーで使用。画面内のコウモリ・鳥・妨害キャラなどの敵を一掃する。ボスには効かない。',
    icon: '<svg viewBox="0 0 48 48"><polygon points="24,3 29,18 44,14 33,25 44,36 29,32 24,45 19,32 4,36 15,25 4,14 19,18" fill="#FEF08A" stroke="#1E1E24" stroke-width="2"/></svg>'
  },
  {
    id: 'charm', name: '跳躍符', price: 100, max: 5, color: '#FB7185',
    desc: 'Zキーで使用。空中でも、その場でもう一度ジャンプできる。',
    icon: '<svg viewBox="0 0 48 48"><rect x="13" y="5" width="22" height="38" fill="#FFFBEB" stroke="#1E1E24" stroke-width="2"/><path d="M24 12v24M17 20h14M18 30l6-6 6 6" stroke="#E11D48" stroke-width="3" stroke-linecap="round" fill="none"/></svg>'
  },
  {
    id: 'magnet', name: '招福の磁石', price: 80, max: 5, color: '#60A5FA',
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
