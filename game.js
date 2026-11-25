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
    desc: 'ゲームの世界を一定時間スローにする。敵も弾も、ゆっくり動く。最終強化では、時間が完全に止まる。',
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
  const fin = lv >= JUTSU_MAXLV ? 0.85 : 1;   // 最終進化は、クールダウンが少し短くなる
  if (id === 'slow') return { dur: 4.0 + 1.0 * k, scale: lv >= JUTSU_MAXLV ? 0 : 0.5 - 0.04 * k, cd: (18 - 1.5 * k) * fin };
  if (id === 'guard') return { dur: 2.5 + 0.5 * k, cd: (16 - 1.5 * k) * fin };
  return { dmg: lv >= 3 ? 2 : 1, windup: 80 - 6 * k, cd: (45 - 4 * k) * fin };
}

function jutsuStatText(id, lv) {
  const s = jutsuStats(id, lv);
  if (id === 'slow') return '持続 ' + s.dur.toFixed(1) + '秒 / ' + (s.scale === 0 ? '時間停止' : '速度 x' + s.scale.toFixed(2)) + ' / CD ' + s.cd.toFixed(1) + '秒';
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
    const stopped = st.scale === 0;
    jfx.push({ type: 'flash', t: 0, total: stopped ? 14 : 8, color: stopped ? '255,255,255' : '125,235,255' });
    jfx.push({ type: 'banner', text: stopped ? '時止め' : j.name, sub: stopped ? '世界が止まる' : j.sub, color: stopped ? '#E0F2FE' : j.color, t: 0, total: stopped ? 70 : 54 });
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
  if (timeScale() > 0) b._gt = (b._gt || 0) + 1;
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
    const timeStop = jstate.slowScale === 0;
    if (timeStop) {
      c.globalCompositeOperation = 'saturation';
      c.fillStyle = 'rgba(128,128,128,' + (0.9 * a) + ')';
      c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
    }
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
    c.lineTo(Math.cos((timeStop ? 0 : T * 0.9) - 1.57) * 26, Math.sin((timeStop ? 0 : T * 0.9) - 1.57) * 26);
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
// エクストラボス「否愚魔」（北海道・全ステージ制覇後に出現）
//   ・最初からボス戦。体力12
//   ・これまでの全ボスの全技を、ランダムに繰り出す
//   ・技を出している間、その技のボスの「魂」が灰色に透けて背後に浮かぶ
// ==========================================
const EXTRA_BOSS = '否愚魔';
STORY_DATA.extra = [{
  name: '北海道', region: 'EXTRA BOSS', goal: 10, boss: EXTRA_BOSS,
  trivia: 'ヒグマは、日本では北海道だけに生息する最大の陸上動物。全ステージを制覇した君に、最後の試練が現れた！'
}];
BOSS_ORDER.push(EXTRA_BOSS);
BOSS_THEMES[EXTRA_BOSS] = mkTheme('#78350F', '#B45309', '#FDBA74', '#EA580C');
const BOSS_HP_OVERRIDE = {};
BOSS_HP_OVERRIDE[EXTRA_BOSS] = 12;

// 全ボスの全技（技名・弾の見た目はそのまま。色はそのボス本来の色）
BOSS_MOVES[EXTRA_BOSS] = [];
BOSS_ORDER.forEach(n => {
  if (n === EXTRA_BOSS) return;
  (BOSS_MOVES[n] || []).forEach(m => BOSS_MOVES[EXTRA_BOSS].push({ m: m.m, n: m.n, s: m.s, src: n }));
});

function registerBossGif(name, path) {
  if (BOSS_GIF_IMGS[name]) return;
  const img = document.createElement('img');
  img.className = 'boss-gif-src';
  img.alt = '';
  const cands = [path, path.split('/').pop(), 'boss_gif/' + name + '.gif', name + '.gif'];
  let ci = 0;
  img.addEventListener('error', () => {
    ci++;
    if (ci < cands.length) img.src = cands[ci];
    else img.dataset.failed = '1';
  });
  img.src = cands[0];
  document.body.appendChild(img);
  BOSS_GIFS[name] = path;
  BOSS_GIF_IMGS[name] = img;
}
registerBossGif(EXTRA_BOSS, 'boss_gif/higuma.gif');

// 体力12
const baseEaseBoss = easeBossDifficulty;
easeBossDifficulty = function () {
  const b = activeBoss;
  const first = !!b && !b.eased;
  baseEaseBoss();
  if (first && b && BOSS_HP_OVERRIDE[b.name]) {
    b.maxHp = b.hp = BOSS_HP_OVERRIDE[b.name];
    updateBossHpUi();
  }
};

// 技の選び方（全技からランダム）
const baseBossAttackV2 = bossAttackV2;
bossAttackV2 = function (b, px, py) {
  if (b.name !== EXTRA_BOSS) { baseBossAttackV2(b, px, py); return; }
  const moves = BOSS_MOVES[EXTRA_BOSS];
  let i;
  do { i = Math.floor(Math.random() * moves.length); } while (i === b._lastMv && moves.length > 1);
  b._lastMv = i;
  const m = moves[i];
  const col = (BOSS_THEMES[m.src] || DEFAULT_THEME).orb;
  const cfg = { s: m.s, n: m.n, col: col };
  const dur = MOVES[m.m](b, cfg, Math.min(bossRank(b), 16), px, py) || 150;
  let timer = Math.max(150, dur);
  if (b.hp <= 6) timer = Math.round(timer * 0.8);   // 体力が半分以下で、攻撃の間隔が短くなる
  b.shootTimer = timer;
  b._charge = 32;
  b._chargeCol = col;
  bossCallouts.push({ text: m.n, col: col, t: 0, total: 80 });
  b._souls = [m.src].concat((b._souls || []).filter(n => n !== m.src)).slice(0, 3);
  b._soulT = b._soulTotal = dur + 30;
};

// ---------- 魂の描画 ----------
function drawSoul(name, x, y, scale, alpha, T) {
  const g = getBossGif(name);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  if (g && 'filter' in ctx) {
    const h = 112 * scale;
    const w = h * g.naturalWidth / g.naturalHeight;
    ctx.filter = 'grayscale(1) brightness(1.25)';
    ctx.drawImage(g, -w / 2, -h / 2, w, h);
    ctx.filter = 'none';
  } else {
    ctx.scale(scale, scale);
    const wv = Math.sin(T * 3) * 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-34, 30); ctx.lineTo(-34, -6); ctx.quadraticCurveTo(-34, -40, 0, -40);
    ctx.quadraticCurveTo(34, -40, 34, -6); ctx.lineTo(34, 30);
    ctx.quadraticCurveTo(26, 22 + wv, 17, 30); ctx.quadraticCurveTo(8, 38 - wv, 0, 30);
    ctx.quadraticCurveTo(-8, 22 + wv, -17, 30); ctx.quadraticCurveTo(-26, 38 - wv, -34, 30);
    ctx.closePath();
    const gr = ctx.createLinearGradient(0, -40, 0, 36);
    gr.addColorStop(0, 'rgba(228,231,238,0.95)');
    gr.addColorStop(1, 'rgba(150,155,165,0.15)');
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,95,105,0.85)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(205,210,220,0.9)';
    ctx.beginPath(); ctx.moveTo(-22, -34); ctx.lineTo(-30, -52); ctx.lineTo(-10, -38); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(22, -34); ctx.lineTo(30, -52); ctx.lineTo(10, -38); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(35,38,48,0.85)';
    ctx.beginPath(); ctx.ellipse(-12, -10, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(12, -10, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(35,38,48,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-9, 8); ctx.quadraticCurveTo(0, 3, 9, 8); ctx.stroke();
  }
  ctx.restore();
  // 名前と、揺らめく人魂
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.font = '900 10px "M PLUS Rounded 1c", sans-serif';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(30,32,42,0.85)';
  ctx.strokeText(name, x, y + 44 * scale + 8);
  ctx.fillStyle = 'rgba(232,234,242,0.95)';
  ctx.fillText(name, x, y + 44 * scale + 8);
  ctx.fillStyle = 'rgba(210,214,226,0.7)';
  for (let k = 0; k < 3; k++) {
    const a = T * 1.4 + k * 2.1;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 46 * scale, y + Math.sin(a * 1.3) * 22 * scale - 10, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawExtraSouls() {
  const b = activeBoss;
  if (gameState !== 'playing' || !b || b.name !== EXTRA_BOSS || !b.active || b.hp <= 0 || !(b._soulT > 0)) return;
  b._soulT--;
  const total = b._soulTotal || 1;
  const a = Math.max(0, Math.min(1, (total - b._soulT) / 18, b._soulT / 18));
  const T = Date.now() * 0.002;
  const offs = [0, -80, 80];
  const alphas = [0.6, 0.3, 0.3];
  (b._souls || []).forEach((name, i) => {
    drawSoul(name, b.x + offs[i], b.y - cameraY - 92 + (i ? 22 : 0) + Math.sin(T * 2 + i * 2) * 5, i === 0 ? 1.25 : 0.9, a * alphas[i], T + i);
  });
}
const baseDrawFn10 = draw;
draw = function () {
  baseDrawFn10();
  drawExtraSouls();
};

// ---------- 出現条件と、ステージ選択画面のボタン ----------
function allStoryCleared() {
  return ['japan', 'world', 'space'].every(a => (storyProgress[a] || 0) >= STORY_DATA[a].length);
}
const extraBtn = document.createElement('button');
extraBtn.id = 'extra-boss-btn';
extraBtn.className = 'btn';
extraBtn.innerHTML = '<span>EXTRA BOSS  北海道</span><span class="stage-tag">否愚魔</span>';
extraBtn.addEventListener('click', () => startGame('story', 'extra', 0));
document.getElementById('story-stage-list').before(extraBtn);
function refreshExtraButton() {
  extraBtn.style.display = allStoryCleared() ? 'flex' : 'none';
}
const baseRenderStoryList = renderStoryList;
renderStoryList = function () {
  baseRenderStoryList();
  refreshExtraButton();
};
const baseSwitchStoryTab = switchStoryTab;
switchStoryTab = function (arc) {
  baseSwitchStoryTab(arc === 'extra' ? 'japan' : arc);
};
const baseStartGame4 = startGame;
startGame = function (...args) {
  baseStartGame4(...args);
  if (currentDifficulty === 'story' && currentStoryArc === 'extra') {
    hudStage.textContent = 'EXTRA 北海道';
    if (stageIntro) {
      stageIntro.title = 'EXTRA: 北海道';
      stageIntro.sub = 'EXTRA BOSS  BOSS: ' + EXTRA_BOSS;
    }
  }
};

// ==========================================
// コインの上限（カンスト）: 99999
// 保存のたびに上限を超えた分を切り捨てる。すでに保存されている値も、起動時に上限へそろえる
// ==========================================
const COIN_CAP = 99999;
const baseSaveCoinAndSkinData = saveCoinAndSkinData;
saveCoinAndSkinData = function () {
  if (totalCoins > COIN_CAP) totalCoins = COIN_CAP;
  baseSaveCoinAndSkinData();
};
saveCoinAndSkinData();

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


/* SPLIT4 */
// ==========================================
// エクストラボス「否愚魔」の調整
// ==========================================
const EXTRA_FREE_CLIMB_M = 50;      // スタートから、何mは障害物なしで登らせるか
const EXTRA_CLIMB_SPEED = 0.5;      // 否愚魔が登る速さ（1フレームあたりのpx）。体力が減るほど少し速くなる
const EXTRA_VIGNETTE = 0.6;         // 戦闘中の画面の四隅の暗さ（0〜1）
const EXTRA_REQUIRE_CLEAR = true;   // true: 全ステージ制覇後のみ北海道が否愚魔戦になる / false: 常に否愚魔戦（動作確認用）

// 戦闘開始位置: ボス戦は「ゴールの460px手前」で始まるので、そこが50mの地点になるようゴールを置く
STORY_DATA.extra[0].goal = Math.ceil(EXTRA_FREE_CLIMB_M + 460 / PIXELS_PER_METER);

function isExtraStage() {
  return currentDifficulty === 'story' && currentStoryArc === 'extra';
}
function exFight() {
  return isExtraStage() && gameState === 'playing' && !!activeBoss &&
    activeBoss.name === EXTRA_BOSS && activeBoss.active && activeBoss.hp > 0;
}

// ---------- 選択画面のボタン（ポップアップ）を出さない ----------
extraBtn.remove();
refreshExtraButton = function () {};

// 全ステージ制覇後は、日本列島篇の1番「北海道」を押すと、そのまま否愚魔のステージになる
// （見た目は普通の北海道。障害物は何もなく、登っていくとボス戦が始まる）

// ---------- 最初の50mは何も出さない ----------
const baseInitStage2 = initStage;
initStage = function (config) {
  baseInitStage2(config);
  if (config.isStory && config.storyArc === 'extra') {
    spikeBands = [];
    bats = [];
    birds = [];
  }
};

// ---------- セリフ ----------
const exDlg = { q: [], cur: null, t: 0 };
function exSay(text, urgent) {
  const d = { text: text, hold: 130 };
  if (urgent) {
    exDlg.q = [d];
    exDlg.cur = null;
  } else {
    if (exDlg.q.length >= 2) exDlg.q.shift();
    exDlg.q.push(d);
  }
}
const EX_TAUNTS = [
  '逃げ場など、どこにもないぞ。',
  'その程度か、小僧。',
  '我は逃げぬ。さあ、上へ来い。',
  'かつて挑んだ者どもの魂が、我に力を貸す。',
  '壁を蹴るしか能がないのか？',
  '落ちれば、そこで終わりだ。',
  'グルルル……もっと足掻いてみせろ。'
];
const EX_HP_LINES = {
  10: 'ぬっ……？ 少しはやるようだな。',
  6: '……面白い。ここからは本気だ。',
  3: 'まだだ……まだ、我は倒れぬ！',
  1: 'ば、馬鹿な……この我が……！'
};

function wrapJa(text, maxW) {
  const lines = [];
  let cur = '';
  for (const ch of text) {
    if (ctx.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; }
    else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawExDialogue() {
  if (!exDlg.cur) {
    if (!exDlg.q.length) return;
    exDlg.cur = exDlg.q.shift();
    exDlg.t = 0;
  }
  const d = exDlg.cur;
  exDlg.t++;
  const typeEnd = d.text.length * 2;
  const end = typeEnd + d.hold;
  if (exDlg.t >= end) { exDlg.cur = null; return; }
  const a = Math.max(0, Math.min(1, exDlg.t / 8, (end - exDlg.t) / 14));
  const n = Math.min(d.text.length, Math.floor(exDlg.t / 2));

  ctx.save();
  ctx.globalAlpha = a;
  ctx.lineJoin = 'round';
  // 名前札
  ctx.fillStyle = '#EA580C';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.fillRect(30, 600, 66, 20);
  ctx.strokeRect(30, 600, 66, 20);
  ctx.textAlign = 'center';
  ctx.font = '900 13px "M PLUS Rounded 1c", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('否愚魔', 63, 615);
  // ウィンドウ
  ctx.fillStyle = 'rgba(8,8,12,0.9)';
  ctx.fillRect(24, 620, 372, 56);
  ctx.strokeStyle = '#EA580C';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 620, 372, 56);
  // 文字
  ctx.textAlign = 'left';
  ctx.font = '900 14px "M PLUS Rounded 1c", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  const lines = wrapJa(d.text, 346);
  let left = n;
  lines.forEach((ln, i) => {
    const s = ln.slice(0, Math.max(0, Math.min(ln.length, left)));
    left -= ln.length;
    ctx.fillText(s, 38, 644 + i * 20);
  });
  ctx.restore();
}

function drawExVignette() {
  const b = activeBoss;
  b._dark = Math.min(1, (b._dark || 0) + 1 / 60);
  const v = ctx.createRadialGradient(210, 360, 160, 210, 360, 430);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,' + (EXTRA_VIGNETTE * b._dark) + ')');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 攻撃のたびに、ときどきしゃべる
const baseBossAttackV2b = bossAttackV2;
bossAttackV2 = function (b, px, py) {
  baseBossAttackV2b(b, px, py);
  if (b.name !== EXTRA_BOSS) return;
  b._atkN = (b._atkN || 0) + 1;
  if (b._atkN % 2 === 0) {
    let i;
    do { i = Math.floor(Math.random() * EX_TAUNTS.length); } while (i === b._lastTaunt && EX_TAUNTS.length > 1);
    b._lastTaunt = i;
    exSay(EX_TAUNTS[i]);
  }
};

// ---------- 開始時の処理 ----------
const baseStartGame5 = startGame;
startGame = function (...args) {
  if (args[0] === 'story' && args[1] === 'japan' && args[2] === 0 &&
      (!EXTRA_REQUIRE_CLEAR || allStoryCleared())) {
    args = ['story', 'extra', 0];
  }
  baseStartGame5(...args);
  exDlg.q = [];
  exDlg.cur = null;
  exDlg.t = 0;
  document.body.classList.toggle('extra-nohud', isExtraStage());
  document.body.classList.remove('extra-dark');
  if (isExtraStage()) {
    // 最初は何も予告しない。ボスの登場演出は、戦闘が始まるときに出す
    hudStage.textContent = '1.北海道';
    stageIntro = { t: 100, total: 100, boss: null, title: '1. 北海道', sub: '北海道地方' };
  }
};

// ---------- 毎フレーム ----------
const baseUpdateFn6 = update;
update = function () {
  const pre = isExtraStage() && gameState === 'playing';
  if (pre && activeBoss && !activeBoss.active) {
    // 戦闘が始まるまでは、敵を一切出さない
    birdSpawnTimer = 999;
    ambusherSpawnTimer = 999;
    enemySpawnTimer = 999;
  }
  baseUpdateFn6();
  if (paused || !exFight()) return;

  const b = activeBoss;
  if (!b._exIntro) {
    b._exIntro = true;
    b._exHp = b.hp;
    stageIntro = { t: 150, total: 150, boss: EXTRA_BOSS, title: '否愚魔', sub: 'EXTRA BOSS' };
    exSay('グルルル……よくぞ、ここまで登ってきた。');
    exSay('ここから先は我が縄張り。生きて帰れると思うな。');
  }
  if (b.hp < b._exHp) {
    b._exHp = b.hp;
    if (EX_HP_LINES[b.hp]) exSay(EX_HP_LINES[b.hp], true);
  }

  // 少しずつ上へ登る（ゴールの位置ごと上がるので、カメラも一緒に上がる）
  const lost = b.maxHp - b.hp;
  goalY -= (EXTRA_CLIMB_SPEED + lost * 0.03) * Math.max(0, timeScale());
  b.y = goalY + 110;
};

const baseDrawFn11 = draw;
draw = function () {
  if (paused) return;
  baseDrawFn11();
  if (exFight()) {
    drawExVignette();
    drawExDialogue();
  }
};

// 戦闘中は、画面外（ページ背景）も黒くする
setInterval(() => {
  document.body.classList.toggle('extra-dark', exFight());
  document.body.classList.toggle('extra-nohud', isExtraStage() && gameState === 'playing');
}, 100);


/* SPLIT5 */
// ==========================================
// 否愚魔 第二形態
// ==========================================
const EX2_HP = 14;                 // 第二形態の体力
const EX2_COL = '#EA580C';
const EX_CR_END = 100;             // ヒビが入る時間（フレーム）
const EX_SH_END = 190;             // 割れて砕け散る時間
const EX_AB_END = 370;             // 全ボスが吸い込まれる時間（終わると第二形態が始まる）
const EX_P2_NAME = '否愚魔2';
registerBossGif(EX_P2_NAME, 'boss_gif/higuma2.gif');   // 第二形態の画像

let exPhase = 1;                   // 1: 第一形態 / 'break': 変身中 / 2: 第二形態
let exSkin = 1;                    // 表示する画像（1 or 2）
let exBreakT = 0;
let exShards = [];
let exCracks = [];
let exHoles = [];
let exBeams = [];
let exBuf = null;
const EX_HP_LINES_P1 = Object.assign({}, EX_HP_LINES);
const EX_HP_LINES_P2 = {
  10: 'ほう……ここまで我に迫るか。',
  6: '否……我は負けぬ。山の主が、負けてなるものか！',
  3: 'ぐ、ぐぬぬ……！',
  1: 'まさか……この我が……。'
};
const EX2_TAUNTS = [
  '壁など、我には紙も同じだ。',
  '喰らえ、すべての魂の怒りを。',
  '逃げ場は、我が穿つ。',
  'この山ごと、砕いてくれる。',
  '足掻け。足掻け。足掻け！',
  'まだ登るか、愚かな小僧よ。'
];

// 変身中も「戦闘中」として扱う（体力0でも画面の演出を続ける）
exFight = function () {
  return isExtraStage() && gameState === 'playing' && !!activeBoss &&
    activeBoss.name === EXTRA_BOSS && activeBoss.active && (activeBoss.hp > 0 || exPhase === 'break');
};

// ---------- 画像（第一形態 / 第二形態）----------
const baseGetBossGif = getBossGif;
getBossGif = function (name) {
  if (name === EXTRA_BOSS && exSkin === 2) {
    const g = baseGetBossGif(EX_P2_NAME);
    if (g) return g;
  }
  return baseGetBossGif(name);
};

// ---------- セリフ: 画面の外に、明朝体で ----------
const exDlgEl = document.createElement('div');
exDlgEl.id = 'ex-dialogue';
document.body.appendChild(exDlgEl);

drawExDialogue = function () {
  if (!exDlg.cur) {
    if (!exDlg.q.length) { exDlgEl.style.opacity = '0'; return; }
    exDlg.cur = exDlg.q.shift();
    exDlg.t = 0;
  }
  const d = exDlg.cur;
  exDlg.t++;
  const typeEnd = d.text.length * 3;
  const end = typeEnd + d.hold;
  if (exDlg.t >= end) { exDlg.cur = null; exDlgEl.style.opacity = '0'; return; }
  const a = Math.max(0, Math.min(1, exDlg.t / 8, (end - exDlg.t) / 14));
  exDlgEl.textContent = d.text.slice(0, Math.min(d.text.length, Math.floor(exDlg.t / 3)));
  exDlgEl.style.opacity = String(a);
};

// ---------- ダメージ無効（変身中）と、第一形態撃破の横取り ----------
const baseBossTakeDamage2 = bossTakeDamage;
bossTakeDamage = function (n) {
  if (exPhase === 'break' && activeBoss && activeBoss.name === EXTRA_BOSS) return;
  baseBossTakeDamage2(n);
};

const baseShowResult4 = showResult;
showResult = function (isClear) {
  if (isClear && gameState === 'playing' && isExtraStage() && activeBoss && activeBoss.name === EXTRA_BOSS) {
    if (exPhase === 1) { exBeginBreak(); return; }
    if (exPhase === 'break') return;
  }
  baseShowResult4(isClear);
};

// ---------- 変身 ----------
function exBossDims() {
  const g = getBossGif(EXTRA_BOSS);
  if (g) {
    const h = 112;
    return { g: g, w: h * g.naturalWidth / g.naturalHeight, h: h };
  }
  return { g: null, w: 100, h: 100 };
}

function exBodyFallback(c, skin) {
  const body = skin === 2 ? '#4C1D95' : '#78350F';
  const face = skin === 2 ? '#7C3AED' : '#B45309';
  c.lineJoin = 'round';
  c.lineWidth = 3;
  c.strokeStyle = INK3;
  c.fillStyle = body;
  c.beginPath(); c.arc(-30, -34, 12, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.arc(30, -34, 12, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(0, -4, 46, 42, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = face;
  c.beginPath(); c.ellipse(0, 12, 22, 16, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = INK3;
  c.beginPath(); c.ellipse(0, 5, 6, 4, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#FFFFFF';
  c.beginPath(); c.ellipse(-16, -12, 8, 7, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(16, -12, 8, 7, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = '#DC2626';
  c.beginPath(); c.arc(-14, -11, 3.5, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(14, -11, 3.5, 0, Math.PI * 2); c.fill();
  c.lineWidth = 4;
  c.beginPath(); c.moveTo(-28, -26); c.lineTo(-8, -18); c.moveTo(28, -26); c.lineTo(8, -18); c.stroke();
  c.fillStyle = '#FFFFFF';
  c.lineWidth = 2;
  c.beginPath(); c.moveTo(-8, 22); c.lineTo(-3, 22); c.lineTo(-5, 30); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(8, 22); c.lineTo(3, 22); c.lineTo(5, 30); c.closePath(); c.fill(); c.stroke();
}

function drawExBossBody(c, dims, skin) {
  if (dims.g) c.drawImage(dims.g, -dims.w / 2, -dims.h / 2, dims.w, dims.h);
  else exBodyFallback(c, skin);
}

function exBeginBreak() {
  const b = activeBoss;
  exPhase = 'break';
  exBreakT = 0;
  b.hp = 1;
  b._exHp = 1;
  projectiles = [];
  bossLasers = [];
  bossQueue.length = 0;
  bossBombs.length = 0;
  exHoles = [];
  exBeams = [];
  exShards = [];
  b.shootTimer = 99999;
  b._pt = 99999;
  b._charge = 0;

  // ヒビ（ボスの中心から外へ、ギザギザに伸びる）
  const dims = exBossDims();
  const R = Math.max(dims.w, dims.h) * 0.55;
  exCracks = [];
  for (let k = 0; k < 7; k++) {
    const a0 = k / 7 * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const pts = [[0, 0]];
    for (let i = 1; i <= 5; i++) {
      const a = a0 + (Math.random() - 0.5) * 0.7;
      const r = R * i / 5;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    exCracks.push(pts);
  }
  shakeTime = 16;
  playSound('bossDamage');
  exSay('……ぐ、ぐおおおおお……！', true);
}

function exMakeShards() {
  const b = activeBoss;
  const dims = exBossDims();
  const cols = 4, rows = 4;
  const vx = [], vy = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const edge = i === 0 || j === 0 || i === cols || j === rows;
      const jx = edge ? 0 : (Math.random() - 0.5) * dims.w / cols * 0.6;
      const jy = edge ? 0 : (Math.random() - 0.5) * dims.h / rows * 0.6;
      vx.push(-dims.w / 2 + i * dims.w / cols + jx);
      vy.push(-dims.h / 2 + j * dims.h / rows + jy);
    }
  }
  const at = (i, j) => [vx[j * (cols + 1) + i], vy[j * (cols + 1) + i]];
  exShards = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const p00 = at(i, j), p10 = at(i + 1, j), p01 = at(i, j + 1), p11 = at(i + 1, j + 1);
      const tris = ((i + j) % 2 === 0) ? [[p00, p10, p11], [p00, p11, p01]] : [[p00, p10, p01], [p10, p11, p01]];
      tris.forEach(pts => {
        const cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
        const cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
        const d = Math.max(1, Math.hypot(cx, cy));
        const sp = 2 + Math.random() * 4;
        exShards.push({
          pts: pts, cx: cx, cy: cy,
          dx: 0, dy: 0, rot: 0,
          vx: cx / d * sp + (Math.random() - 0.5) * 2,
          vy: cy / d * sp - 2.5,
          vr: (Math.random() - 0.5) * 0.3
        });
      });
    }
  }
}

function tickExBreak() {
  const b = activeBoss;
  exBreakT++;
  b.hp = Math.max(b.hp, 1);
  b._exHp = b.hp;
  b.shootTimer = 99999;
  b._pt = 99999;
  const t = exBreakT;

  if (t < EX_CR_END && t % 30 === 0) { shakeTime = 8 + t / 10; playSound('laserFire'); }

  if (t === EX_CR_END) {
    exMakeShards();
    jfx.push({ type: 'flash', t: 0, total: 16, color: '255,255,255' });
    jfx.push({ type: 'ring', x: b.x, y: b.y, t: 0, total: 28, color: '#FFFFFF' });
    shakeTime = 26;
    playSound('bossDamage');
    spawnParticles(b.x, b.y, '#EA580C', 24, false);
    spawnParticles(b.x, b.y, '#FFFFFF', 14, false);
    exSay('……よくぞ、我が殻を砕いた。', true);
  }
  if (t > EX_CR_END && t <= EX_SH_END) {
    exShards.forEach(s => {
      s.dx += s.vx; s.dy += s.vy; s.vy += 0.3; s.rot += s.vr;
    });
  }
  if (t === EX_SH_END) {
    exSkin = 2;
    bossGifName = '';   // 画像を第二形態に差し替える
    exShards = [];
    jfx.push({ type: 'flash', t: 0, total: 14, color: '255,200,150' });
    jfx.push({ type: 'ring', x: b.x, y: b.y, t: 0, total: 30, color: '#EA580C' });
    shakeTime = 20;
    playSound('laserFire');
    stageIntro = { t: 150, total: 150, boss: EXTRA_BOSS, title: '否愚魔', sub: '第二形態' };
    exSay('来い……我が内に眠る、すべての魂よ！', true);
  }
  if (t > EX_SH_END && t < EX_AB_END) {
    // 吸い込まれた瞬間の演出
    const n = BOSS_ORDER.length - 1;
    for (let i = 0; i < n; i++) {
      if (t === EX_SH_END + i * 5 + 70) {
        b._pulse = 8;
        if (i % 3 === 0) { shakeTime = 5; playSound('deflect'); }
        spawnParticles(b.x, b.y, '#FDE047', 5, false);
      }
    }
  }
  if (t >= EX_AB_END) {
    exPhase = 2;
    b.maxHp = b.hp = EX2_HP;
    updateBossHpUi();
    b._exHp = b.hp;
    b.shootTimer = 70;
    b._pt = 70;
    b.vx *= 1.25;
    Object.keys(EX_HP_LINES).forEach(k => delete EX_HP_LINES[k]);
    Object.assign(EX_HP_LINES, EX_HP_LINES_P2);
    jfx.push({ type: 'flash', t: 0, total: 16, color: '255,255,255' });
    shakeTime = 24;
    playSound('clear');
    bossCallouts.push({ text: '第二形態', col: EX2_COL, t: 0, total: 90 });
    exSay('我こそは山の主、否愚魔。ここからが、真の戦いだ。', true);
  }
}

// ---------- 変身中の描画 ----------
function drawExBreakBoss() {
  const b = activeBoss;
  const T = exBreakT;
  const sx = b.x, sy = b.y - cameraY;
  const dims = exBossDims();
  if (T < EX_CR_END) {
    const p = T / EX_CR_END;
    if (!exBuf) { exBuf = document.createElement('canvas'); exBuf.width = 360; exBuf.height = 280; }
    const c = exBuf.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, 360, 280);
    c.save();
    c.translate(180, 140);
    drawExBossBody(c, dims, 1);
    c.globalCompositeOperation = 'source-atop';
    const gl = c.createRadialGradient(0, 0, 4, 0, 0, 90);
    gl.addColorStop(0, 'rgba(255,180,80,' + (0.15 + 0.55 * p) + ')');
    gl.addColorStop(1, 'rgba(255,90,30,' + (0.05 + 0.3 * p) + ')');
    c.fillStyle = gl;
    c.fillRect(-180, -140, 360, 280);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    exCracks.forEach(pts => {
      const L = pts.length - 1;
      const reach = Math.min(L, p * L * 1.2);
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i <= L; i++) {
        if (i <= reach) c.lineTo(pts[i][0], pts[i][1]);
        else {
          const f = reach - (i - 1);
          if (f > 0) c.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f);
          break;
        }
      }
      c.strokeStyle = '#1E1E24'; c.lineWidth = 5; c.stroke();
      c.strokeStyle = '#FFF3D6'; c.lineWidth = 2.2; c.stroke();
    });
    c.restore();
    const jx = (Math.random() - 0.5) * (2 + p * 8);
    const jy = (Math.random() - 0.5) * (2 + p * 8);
    ctx.drawImage(exBuf, sx + jx - 180, sy + jy - 140);
  } else {
    const q = (T - EX_CR_END) / (EX_SH_END - EX_CR_END);
    const alpha = Math.max(0, 1 - Math.pow(q, 1.5));
    exShards.forEach(s => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(sx + s.cx + s.dx, sy + s.cy + s.dy);
      ctx.rotate(s.rot);
      ctx.translate(-s.cx, -s.cy);
      ctx.beginPath();
      ctx.moveTo(s.pts[0][0], s.pts[0][1]);
      ctx.lineTo(s.pts[1][0], s.pts[1][1]);
      ctx.lineTo(s.pts[2][0], s.pts[2][1]);
      ctx.closePath();
      ctx.clip();
      drawExBossBody(ctx, dims, 1);
      ctx.restore();
    });
  }
}

function drawExAbsorb() {
  const b = activeBoss;
  const t = exBreakT - EX_SH_END;
  if (t < 0) return;
  const sx = b.x, sy = b.y - cameraY;
  const T = Date.now() * 0.002;
  const arrived = Math.min(1, t / 175);
  const pulse = (b._pulse > 0) ? b._pulse-- : 0;
  ctx.save();
  const g = ctx.createRadialGradient(sx, sy, 10, sx, sy, 70 + arrived * 70 + pulse * 3);
  g.addColorStop(0, 'rgba(255,220,150,' + (0.35 + 0.4 * arrived) + ')');
  g.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(sx, sy, 150, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  const souls = BOSS_ORDER.filter(n => n !== EXTRA_BOSS);
  souls.forEach((n, i) => {
    const p = (t - i * 5) / 70;
    if (p <= 0 || p >= 1) return;
    const e = p * p;
    const ang = i / souls.length * Math.PI * 2 + p * 2.4;
    const rad = 270 * (1 - e);
    const x = sx + Math.cos(ang) * rad;
    const y = sy + Math.sin(ang) * rad * 0.8;
    drawSoul(n, x, y, 0.2 + 0.7 * (1 - e), 0.85 * (1 - e * 0.6), T + i);
  });
}

// ---------- 壁の穴 ----------
const HOLE_WARN = 70, HOLE_OPEN = 330, HOLE_CLOSE = 20;

function exAddHole(side, y, h) {
  exHoles.push({ side: side, y: y, h: h, t: 0, shot: 0 });
}

function tickExHoles(dt) {
  const b = activeBoss;
  for (let i = exHoles.length - 1; i >= 0; i--) {
    const h = exHoles[i];
    const prev = h.t;
    h.t += dt;
    if (prev < HOLE_WARN && h.t >= HOLE_WARN) {
      shakeTime = 14;
      playSound('laserFire');
      spawnParticles(h.side === 'left' ? LEFT_WALL_X : RIGHT_WALL_X, h.y + h.h / 2, '#78716C', 14, false);
    }
    if (h.t >= HOLE_WARN && h.t < HOLE_WARN + HOLE_OPEN) {
      // 穴に壁が無いので、壁に張りついたままだと落ちてしまう
      const onSide = h.side === 'left' ? player.x <= LEFT_WALL_X + 4 : player.x + player.size >= RIGHT_WALL_X - 4;
      if (onSide && player.y + player.size - 4 > h.y && player.y + 4 < h.y + h.h) {
        enemyKillsPlayer('#78716C');
        return;
      }
      // 穴から岩が飛び出してくる
      h.shot += dt;
      if (h.shot >= 55 && b && b.hp > 0) {
        h.shot = 0;
        const dir = h.side === 'left' ? 1 : -1;
        const x0 = h.side === 'left' ? LEFT_WALL_X + 20 : RIGHT_WALL_X - 20;
        v2Shot(b, { s: 'boulder', col: '#B45309' }, x0, h.y + h.h / 2 + (Math.random() - 0.5) * h.h * 0.6, dir * 3.0, 0, { sz: 14, life: 170 });
      }
    }
    if (h.t >= HOLE_WARN + HOLE_OPEN + HOLE_CLOSE) exHoles.splice(i, 1);
  }
}

function drawExHoles() {
  const T = Date.now() * 0.01;
  for (const h of exHoles) {
    const sy = h.y - cameraY;
    if (sy > canvas.height + 20 || sy + h.h < -20) continue;
    const left = h.side === 'left';
    const x0 = left ? 0 : RIGHT_WALL_X;
    const inner = left ? LEFT_WALL_X : RIGHT_WALL_X;
    const dir = left ? 1 : -1;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (h.t < HOLE_WARN) {
      const p = h.t / HOLE_WARN;
      ctx.beginPath(); ctx.rect(x0, sy, WALL_WIDTH, h.h); ctx.clip();
      ctx.fillStyle = 'rgba(255,59,107,' + (0.15 + 0.25 * Math.abs(Math.sin(T * 0.8))) + ')';
      ctx.fillRect(x0, sy, WALL_WIDTH, h.h);
      for (let k = 0; k < 4; k++) {
        const yy = sy + (k + 0.5) / 4 * h.h;
        ctx.beginPath();
        ctx.moveTo(inner, yy);
        for (let s = 1; s <= 4; s++) {
          ctx.lineTo(inner - dir * s * 9 * p, yy + (s % 2 ? -1 : 1) * 7 * p);
        }
        ctx.strokeStyle = '#1E1E24'; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = '#FFF3D6'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.restore();
      // 予告の矢印
      ctx.save();
      ctx.fillStyle = 'rgba(255,59,107,' + (0.45 + 0.45 * Math.abs(Math.sin(T * 1.2))) + ')';
      for (let k = 0; k < 2; k++) {
        const ax = inner + dir * (16 + k * 14);
        const ay = sy + h.h / 2;
        ctx.beginPath(); ctx.moveTo(ax + dir * 8, ay); ctx.lineTo(ax - dir * 6, ay - 9); ctx.lineTo(ax - dir * 6, ay + 9); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      continue;
    }
    const closeT = h.t - HOLE_WARN - HOLE_OPEN;
    const a = closeT > 0 ? Math.max(0, 1 - closeT / HOLE_CLOSE) : 1;
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.rect(x0, sy, WALL_WIDTH, h.h); ctx.clip();
    const g = ctx.createLinearGradient(left ? 0 : RIGHT_WALL_X + WALL_WIDTH, 0, inner, 0);
    g.addColorStop(0, '#000000');
    g.addColorStop(1, '#1B0B2E');
    ctx.fillStyle = g;
    ctx.fillRect(x0, sy, WALL_WIDTH, h.h);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let k = 0; k < 6; k++) {
      ctx.fillRect(x0 + 6 + (k * 11) % 26, sy + 10 + (k * 23) % (h.h - 14), 2, 2);
    }
    ctx.restore();
    // ギザギザの縁
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(inner, sy);
    const n = 8;
    for (let k = 1; k <= n; k++) {
      ctx.lineTo(inner + dir * (k % 2 ? 7 : 0), sy + k / n * h.h);
    }
    ctx.strokeStyle = '#1E1E24'; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = EX2_COL; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
}

// ---------- 天地裂き（横一直線のビーム）----------
function exAddBeam(y, delay) {
  exBeams.push({ y: y, t: -delay, warn: 70, fire: 16 });
}

function tickExBeams(dt) {
  for (let i = exBeams.length - 1; i >= 0; i--) {
    const m = exBeams[i];
    const prev = m.t;
    m.t += dt;
    if (prev < m.warn && m.t >= m.warn) { shakeTime = 10; playSound('laserFire'); }
    if (m.t >= m.warn && m.t < m.warn + m.fire) {
      if (player.y + 5 < m.y + 16 && player.y + player.size - 5 > m.y - 16) {
        enemyKillsPlayer('#EA580C');
        return;
      }
    }
    if (m.t >= m.warn + m.fire) exBeams.splice(i, 1);
  }
}

function drawExBeams() {
  const T = Date.now() * 0.01;
  const W = canvas.width;
  for (const m of exBeams) {
    if (m.t < 0) continue;
    const sy = m.y - cameraY;
    if (sy < -40 || sy > canvas.height + 40) continue;
    ctx.save();
    if (m.t < m.warn) {
      const p = m.t / m.warn;
      const pulse = 0.5 + 0.5 * Math.abs(Math.sin(T * 1.2 + p * 8));
      ctx.strokeStyle = 'rgba(255,59,107,' + (0.35 + 0.5 * pulse) + ')';
      ctx.lineWidth = 2 + p * 4;
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -T * 4;
      ctx.beginPath(); ctx.moveTo(LEFT_WALL_X, sy); ctx.lineTo(RIGHT_WALL_X, sy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,59,107,' + (0.5 + 0.4 * pulse) + ')';
      [[LEFT_WALL_X + 8, 1], [RIGHT_WALL_X - 8, -1]].forEach(a => {
        ctx.beginPath(); ctx.moveTo(a[0] + a[1] * 10, sy); ctx.lineTo(a[0], sy - 9); ctx.lineTo(a[0], sy + 9); ctx.closePath(); ctx.fill();
      });
    } else {
      const q = (m.t - m.warn) / m.fire;
      const th = 30 * (1 - q * 0.4);
      ctx.fillStyle = 'rgba(234,88,12,0.45)';
      ctx.fillRect(0, sy - th, W, th * 2);
      ctx.fillStyle = '#FDBA74';
      ctx.fillRect(0, sy - th * 0.55, W, th * 1.1);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, sy - th * 0.2, W, th * 0.4);
    }
    ctx.restore();
  }
}

// ---------- 第二形態の攻撃 ----------
function exMoveHoles(b, r, px, py) {
  const sides = Math.random() < 0.5 ? ['left', 'right'] : ['right', 'left'];
  const clampY = (y) => Math.max(cameraY + 90, Math.min(cameraY + canvas.height - 220, y));
  const ys = [clampY(py - 70 + (Math.random() - 0.5) * 80), clampY(py - 230 + (Math.random() - 0.5) * 80)];
  sides.forEach((s, i) => {
    sigQueue(b, 24 + i * 50, () => exAddHole(s, ys[i], 120), null);
  });
  playSound('laserWarn');
  return 260;
}

function exMoveBeams(b, r, px, py) {
  const clampY = (y) => Math.max(cameraY + 110, Math.min(cameraY + canvas.height - 100, y));
  for (let i = 0; i < 3; i++) {
    const y = clampY(py + (i - 1) * 150 + (Math.random() - 0.5) * 80);
    exAddBeam(y, i * 22);
  }
  playSound('laserWarn');
  return 70 + 3 * 22 + 70;
}

function exMoveClaw(b, r, px, py) {
  const cfg = { s: 'slash', col: EX2_COL };
  const d1 = MOVES.crossSlash(b, cfg, r + 4, px, py);
  sigQueue(b, 90, () => {
    const pc = playerCenter();
    MOVES.crossSlash(b, cfg, r + 4, pc.x, pc.y);
  }, null);
  return 90 + d1;
}

function exMoveQuake(b, r, px, py) {
  const cfg = { s: 'boulder', col: '#A8A29E' };
  shakeTime = 20;
  const d1 = MOVES.rainVolley(b, cfg, r + 6, px, py);
  sigQueue(b, 60, () => { MOVES.rainVolley(b, cfg, r + 6, px, py); shakeTime = 14; }, null);
  return 60 + d1;
}

function exMoveSoul(b, r, px, py) {
  const names = BOSS_ORDER.filter(n => n !== EXTRA_BOSS && BOSS_MOVES[n]);
  const n1 = names[Math.floor(Math.random() * names.length)];
  let n2;
  do { n2 = names[Math.floor(Math.random() * names.length)]; } while (n2 === n1 && names.length > 1);
  const pick = (n) => {
    const list = BOSS_MOVES[n];
    const m = list[Math.floor(Math.random() * list.length)];
    return { m: m, cfg: { s: m.s, n: m.n, col: (BOSS_THEMES[n] || DEFAULT_THEME).orb } };
  };
  const a = pick(n1), c = pick(n2);
  const d1 = MOVES[a.m.m](b, a.cfg, r, px, py) || 150;
  bossCallouts.push({ text: '魂解放・' + a.m.n, col: a.cfg.col, t: 0, total: 80 });
  sigQueue(b, 100, () => {
    const pc = playerCenter();
    MOVES[c.m.m](b, c.cfg, r, pc.x, pc.y);
    bossCallouts.push({ text: c.m.n, col: c.cfg.col, t: 0, total: 80 });
  }, null);
  b._souls = [n1, n2];
  b._soulT = b._soulTotal = 130;
  return Math.max(d1, 100 + 150);
}

const EX2_MOVES = [
  { f: exMoveHoles, n: '壁穿ち' },
  { f: exMoveHoles, n: '壁穿ち' },
  { f: exMoveBeams, n: '天地裂き' },
  { f: exMoveBeams, n: '天地裂き' },
  { f: exMoveClaw, n: '熊爪連撃' },
  { f: exMoveQuake, n: '山崩しの咆哮' },
  { f: exMoveSoul, n: null },
  { f: exMoveSoul, n: null }
];

function exPhase2Attack(b, px, py) {
  let i;
  do { i = Math.floor(Math.random() * EX2_MOVES.length); } while (EX2_MOVES[i].f === b._lastEx2 && EX2_MOVES.length > 1);
  const m = EX2_MOVES[i];
  b._lastEx2 = m.f;
  const r = Math.min(bossRank(b), 16);
  const dur = m.f(b, r, px, py) || 160;
  b.shootTimer = Math.max(110, Math.round(dur * 0.8));
  b._charge = 32;
  b._chargeCol = EX2_COL;
  if (m.n) bossCallouts.push({ text: m.n, col: EX2_COL, t: 0, total: 80 });
  b._atkN2 = (b._atkN2 || 0) + 1;
  if (b._atkN2 % 2 === 0) {
    let k;
    do { k = Math.floor(Math.random() * EX2_TAUNTS.length); } while (k === b._lastTaunt2 && EX2_TAUNTS.length > 1);
    b._lastTaunt2 = k;
    exSay(EX2_TAUNTS[k]);
  }
}

const baseBossAttackV2c = bossAttackV2;
bossAttackV2 = function (b, px, py) {
  if (b.name === EXTRA_BOSS && exPhase === 2) { exPhase2Attack(b, px, py); return; }
  baseBossAttackV2c(b, px, py);
};

// ---------- 開始時の初期化 ----------
const baseStartGame6 = startGame;
startGame = function (...args) {
  exPhase = 1;
  exSkin = 1;
  exBreakT = 0;
  exShards = [];
  exCracks = [];
  exHoles = [];
  exBeams = [];
  bossGifName = '';
  Object.keys(EX_HP_LINES).forEach(k => delete EX_HP_LINES[k]);
  Object.assign(EX_HP_LINES, EX_HP_LINES_P1);
  baseStartGame6(...args);
};

// ---------- 毎フレーム ----------
const baseUpdateFn7 = update;
update = function () {
  baseUpdateFn7();
  if (paused || gameState !== 'playing' || !isExtraStage() || !activeBoss ||
      activeBoss.name !== EXTRA_BOSS || !activeBoss.active) return;
  if (exPhase === 'break') tickExBreak();
  const dt = Math.max(0, timeScale());
  if (gameState === 'playing') tickExHoles(dt);
  if (gameState === 'playing') tickExBeams(dt);
  if (gameState === 'playing' && exPhase === 2 && activeBoss.hp > 0) {
    goalY -= 0.15 * dt;                   // 第二形態は、登る速さが少し上がる
    activeBoss.y = goalY + 110;
  }
};

function drawExPhaseFx() {
  const b = activeBoss;
  if (exPhase === 'break') {
    if (exBreakT < EX_SH_END) drawExBreakBoss();
    else drawExAbsorb();
  } else if (exPhase === 2 && b.hp > 0) {
    const sx = b.x, sy = b.y - cameraY;
    const g = ctx.createRadialGradient(sx, sy, 20, sx, sy, 110);
    g.addColorStop(0, 'rgba(220,38,38,' + (0.22 + 0.08 * Math.sin(Date.now() * 0.006)) + ')');
    g.addColorStop(1, 'rgba(220,38,38,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(sx, sy, 110, 0, Math.PI * 2); ctx.fill();
  }
  drawExHoles();
  drawExBeams();
}

const baseDrawFn12 = draw;
draw = function () {
  if (paused) return;
  const live = gameState === 'playing' && isExtraStage() && !!activeBoss && activeBoss.name === EXTRA_BOSS;
  // 変身中の前半は、元のボスを描かず、ヒビ割れ・破片を自前で描く
  const hide = live && exPhase === 'break' && exBreakT < EX_SH_END;
  let saved = 0;
  if (hide) { saved = activeBoss.hp; activeBoss.hp = 0; }
  baseDrawFn12();
  if (hide) activeBoss.hp = saved;
  if (live) {
    drawExPhaseFx();
    // 第二形態の画像が無いときは、第一形態の画像の色を変えて代用する
    if (bossGifEl) {
      bossGifEl.style.filter = (exSkin === 2 && !baseGetBossGif(EX_P2_NAME))
        ? 'hue-rotate(250deg) saturate(1.5) contrast(1.15)' : '';
    }
  }
};

// 戦闘中でないときは、セリフを消す
setInterval(() => {
  if (!exFight()) exDlgEl.style.opacity = '0';
}, 100);


/* SPLIT6 */
// ==========================================
// 否愚魔の最期（巨大な手）と、ENDLESS STORY THE FANTASY の解禁
// ==========================================
const FANTASY_KEY = 'wallKickFantasy';
let exFinT = 0;
let exBlood = [];
let exBloodBurst = false;
let fantasyUnlocked = false;
try { fantasyUnlocked = localStorage.getItem(FANTASY_KEY) === '1'; } catch (e) {}

STORY_DATA.extra[0].trivia = 'ヒグマは、日本では北海道だけに生息する最大の陸上動物。否愚魔を倒した君の前に、ストーリーモードの新しいタブ「THE FANTASY」（ENDLESS STORY THE FANTASY）が解禁された！';

// ---------- 握りつぶす効果音 ----------
function exCrushSound() {
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    // きしみながら低くなる音
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const f = audioCtx.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(140, now);
    o.frequency.exponentialRampToValueAtTime(38, now + 0.9);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, now);
    f.frequency.exponentialRampToValueAtTime(120, now + 0.9);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.28, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
    o.connect(f); f.connect(g); g.connect(audioCtx.destination);
    o.start(now); o.stop(now + 1.0);
    // 骨がきしむようなパチパチ音
    const len = Math.floor(audioCtx.sampleRate * 0.9);
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const tt = i / len;
      d[i] = (Math.random() * 2 - 1) * (Math.random() < 0.08 ? 1 : 0.15) * (1 - tt);
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 600;
    const ng = audioCtx.createGain();
    ng.gain.value = 0.35;
    src.connect(hp); hp.connect(ng); ng.connect(audioCtx.destination);
    src.start(now + 0.05);
    // 最後の「ぐしゃっ」
    const p = audioCtx.createOscillator();
    const pg = audioCtx.createGain();
    p.type = 'square';
    p.frequency.setValueAtTime(220, now + 0.85);
    p.frequency.exponentialRampToValueAtTime(40, now + 1.1);
    pg.gain.setValueAtTime(0.0001, now + 0.84);
    pg.gain.exponentialRampToValueAtTime(0.3, now + 0.86);
    pg.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
    p.connect(pg); pg.connect(audioCtx.destination);
    p.start(now + 0.84); p.stop(now + 1.2);
  } catch (e) {}
}

// ---------- 巨大な手 ----------
function exCapsule(c, x0, y0, x1, y1, w) {
  const dx = x1 - x0, dy = y1 - y0;
  const d = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / d, ny = dx / d;
  const o = w * 0.24;
  const line = (ox, oy, lw, col) => {
    c.strokeStyle = col;
    c.lineWidth = lw;
    c.beginPath(); c.moveTo(x0 + ox, y0 + oy); c.lineTo(x1 + ox, y1 + oy); c.stroke();
  };
  c.lineCap = 'round';
  line(0, 0, w + 5, INK3);
  line(0, 0, w, '#F6C9A1');
  line(-nx * o, -ny * o, w * 0.32, '#DBA074');
  line(nx * o, ny * o, w * 0.3, '#FFE6CC');
}

function drawGiantHandBack(c, x, y, s, curl) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineJoin = 'round';
  c.lineCap = 'round';

  // 後光
  const aura = c.createRadialGradient(0, 40, 10, 0, 40, 240);
  aura.addColorStop(0, 'rgba(255,230,150,0.5)');
  aura.addColorStop(1, 'rgba(255,230,150,0)');
  c.fillStyle = aura;
  c.beginPath(); c.arc(0, 40, 240, 0, Math.PI * 2); c.fill();

  // 袖（画面の上まで続く）
  const sl = c.createLinearGradient(-90, 0, 90, 0);
  sl.addColorStop(0, '#CBD5E1'); sl.addColorStop(0.5, '#FFFFFF'); sl.addColorStop(1, '#B6C2D2');
  c.fillStyle = sl; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-60, -112); c.lineTo(-92, -1000); c.lineTo(92, -1000); c.lineTo(60, -112); c.closePath();
  c.fill(); c.stroke();
  c.strokeStyle = 'rgba(100,116,139,0.45)'; c.lineWidth = 3;
  for (let k = 0; k < 5; k++) {
    c.beginPath(); c.moveTo(-40 + k * 20, -135); c.quadraticCurveTo(-46 + k * 23, -300, -52 + k * 26, -700); c.stroke();
  }

  // 腕
  const arm = c.createLinearGradient(-40, 0, 40, 0);
  arm.addColorStop(0, '#DBA074'); arm.addColorStop(0.4, '#F6C9A1'); arm.addColorStop(1, '#E3AD83');
  c.fillStyle = arm; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-36, -112); c.lineTo(-40, -52); c.lineTo(40, -52); c.lineTo(36, -112); c.closePath(); c.fill(); c.stroke();

  // 金の袖口
  const gold = c.createLinearGradient(0, -134, 0, -100);
  gold.addColorStop(0, '#FEF08A'); gold.addColorStop(0.5, '#FACC15'); gold.addColorStop(1, '#B45309');
  c.fillStyle = gold; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-66, -134); c.lineTo(66, -134); c.lineTo(62, -104); c.lineTo(-62, -104); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#38BDF8';
  [-36, 0, 36].forEach(gx => { c.beginPath(); c.arc(gx, -119, 6, 0, Math.PI * 2); c.fill(); c.stroke(); });

  // 手のひら
  const palm = c.createLinearGradient(0, -58, 0, 60);
  palm.addColorStop(0, '#F6C9A1'); palm.addColorStop(1, '#E8B58A');
  c.fillStyle = palm; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-38, -58);
  c.quadraticCurveTo(-64, -20, -60, 30);
  c.quadraticCurveTo(-58, 58, -30, 60);
  c.lineTo(30, 60);
  c.quadraticCurveTo(58, 58, 60, 30);
  c.quadraticCurveTo(64, -20, 38, -58);
  c.closePath();
  c.fill(); c.stroke();
  c.fillStyle = 'rgba(180,110,70,0.22)';
  c.beginPath(); c.ellipse(26, 26, 30, 26, 0.3, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,240,225,0.35)';
  c.beginPath(); c.ellipse(-24, -14, 20, 30, 0.2, 0, Math.PI * 2); c.fill();
  if (curl < 0.65) {
    c.strokeStyle = 'rgba(150,85,50,' + (0.6 * (1 - curl / 0.65)) + ')';
    c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(-46, 4); c.quadraticCurveTo(-10, 18, 40, 0); c.stroke();
    c.beginPath(); c.moveTo(-40, -20); c.quadraticCurveTo(-5, -4, 30, -22); c.stroke();
    c.beginPath(); c.moveTo(-30, 30); c.quadraticCurveTo(-26, 0, -34, -24); c.stroke();
  }

  c.restore();
}

// グー（握りこぶし）。手のひらの中心を原点に、指が下を向いて丸まった形を描く
function drawFistShape(c) {
  // 握った拳のかたまり
  const g = c.createLinearGradient(0, 4, 0, 104);
  g.addColorStop(0, '#F2BE92'); g.addColorStop(1, '#DDA27A');
  c.fillStyle = g; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-64, 20);
  c.quadraticCurveTo(-68, 4, -40, 2);
  c.lineTo(40, 2);
  c.quadraticCurveTo(68, 4, 64, 20);
  c.lineTo(62, 82);
  c.quadraticCurveTo(58, 108, 30, 108);
  c.lineTo(-30, 108);
  c.quadraticCurveTo(-58, 108, -62, 82);
  c.closePath();
  c.fill(); c.stroke();
  // 丸まった4本の指（中節）
  for (let i = 0; i < 4; i++) {
    const cx = -46 + i * 31;
    exCapsule(c, cx, 18, cx, 92, 28);
    c.strokeStyle = 'rgba(150,85,50,0.7)';
    c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(cx - 9, 44); c.lineTo(cx + 9, 44); c.stroke();
    c.beginPath(); c.moveTo(cx - 9, 68); c.lineTo(cx + 9, 68); c.stroke();
    // 指の付け根の関節（こぶし）
    c.fillStyle = '#FFE6CC';
    c.beginPath(); c.ellipse(cx - 3, 10, 7, 4, 0, 0, Math.PI * 2); c.fill();
  }
  // 親指（指の上を横切る）
  exCapsule(c, -66, 70, 36, 58, 27);
  c.fillStyle = '#FBE3D0'; c.strokeStyle = INK3; c.lineWidth = 2.5;
  c.beginPath(); c.ellipse(38, 57, 10, 8, -0.2, 0, Math.PI * 2); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(150,85,50,0.6)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-20, 52); c.lineTo(-20, 66); c.moveTo(8, 50); c.lineTo(8, 63); c.stroke();
}

// 指と親指（否愚魔の手前に描く）
function drawGiantHandFront(c, x, y, s, curl) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineJoin = 'round';
  c.lineCap = 'round';

  // しっかり握ったときは、グーの手にする
  if (curl >= 0.8) {
    drawFistShape(c);
    c.restore();
    return;
  }

  // 指（人差し指〜小指）
  const FING = [
    { bx: -42, L: 66, sp: -0.2 },
    { bx: -14, L: 80, sp: -0.06 },
    { bx: 14, L: 74, sp: 0.06 },
    { bx: 42, L: 58, sp: 0.2 }
  ];
  const fr = [0.42, 0.30, 0.28];
  const bend = [0.4, 0.5, 0.4];
  FING.forEach(f => {
    let px = f.bx * (1 - 0.5 * curl), py = 52;
    const ang = f.sp * (1 - curl) + (f.bx < 0 ? 1 : -1) * 0.3 * curl;
    let cum = 0;
    for (let k = 0; k < 3; k++) {
      const len = f.L * fr[k];
      cum += curl * bend[k];
      const vis = Math.max(0.12, Math.cos(Math.min(cum, 1.45)));
      const x1 = px + Math.sin(ang) * len * vis;
      const y1 = py + Math.cos(ang) * len * vis;
      const w = (26 - k * 2) * (1 + 0.28 * Math.sin(Math.min(cum, 1.5)));
      exCapsule(c, px, py, x1, y1, w);
      if (k > 0 && curl < 0.8) {
        c.strokeStyle = 'rgba(150,85,50,0.6)';
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(px - w * 0.32, py); c.lineTo(px + w * 0.32, py); c.stroke();
      }
      px = x1; py = y1;
    }
  });

  // 親指
  let a1 = 1.0 + (-0.7 - 1.0) * curl;
  let tx = -50, ty = 16;
  for (let k = 0; k < 2; k++) {
    const len = k === 0 ? 42 : 34;
    const a = a1 + k * 0.25 * curl;
    const x1 = tx - Math.sin(a) * len;
    const y1 = ty + Math.cos(a) * len;
    exCapsule(c, tx, ty, x1, y1, 29 - k * 3);
    tx = x1; ty = y1;
  }
  c.restore();
}

// ---------- 最期の演出 ----------
function exBeginFinale() {
  const b = activeBoss;
  exPhase = 'finale';
  exFinT = 0;
  exBlood = [];
  exBloodBurst = false;
  b.hp = 1;
  b._exHp = 1;
  projectiles = [];
  bossLasers = [];
  bossQueue.length = 0;
  bossBombs.length = 0;
  exHoles = [];
  exBeams = [];
  b.shootTimer = 99999;
  b._pt = 99999;
  b._charge = 0;
  shakeTime = 16;
  playSound('bossDamage');
}

function tickExFinale() {
  const b = activeBoss;
  exFinT++;
  const t = exFinT;
  b.hp = Math.max(b.hp, 1);
  b._exHp = b.hp;
  b.shootTimer = 99999;
  b._pt = 99999;
  projectiles = [];
  bossLasers = [];
  bossQueue.length = 0;
  bossBombs.length = 0;
  jstate.postInv = Math.max(jstate.postInv, 10);   // 演出中は、プレイヤーはやられない

  if (t === 24) exSay('お役目ご苦労さん。', true);
  if (t === 40) playSound('laserWarn');
  if (t === 170) exCrushSound();
  if (t > 170 && t < 222 && t % 4 === 0) {
    shakeTime = 6;
    spawnParticles(b.x + (Math.random() - 0.5) * 50, b.y + (Math.random() - 0.5) * 40, '#B91C1C', 3, false);
  }
  if (t === 222) {
    jfx.push({ type: 'flash', t: 0, total: 14, color: '255,255,255' });
    jfx.push({ type: 'ring', x: b.x, y: b.y, t: 0, total: 26, color: '#FFFFFF' });
    shakeTime = 26;
    spawnParticles(b.x, b.y, '#7F1D1D', 24, false);
    spawnParticles(b.x, b.y, '#FDE047', 12, false);
  }
  if (t === 232) exSay('……さあ、帰ろうか。', true);
  if (t === 310) {
    fantasyUnlocked = true;
    try { localStorage.setItem(FANTASY_KEY, '1'); } catch (e) {}
    exFantasyRefresh();
    playSound('clear');
  }
  if (t >= 390) {
    exPhase = 'done';
    maxAltitude = STAGES[currentDifficulty].goalMeters;
    showResult(true);
  }
}

function exBloodSpray(x, y, n, sp, up) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = sp * (0.4 + Math.random() * 0.6);
    exBlood.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (up || 0), r: 1.5 + Math.random() * 3, life: 40 + Math.random() * 30 });
  }
}

function drawExBlood() {
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = exBlood.length - 1; i >= 0; i--) {
    const d = exBlood[i];
    d.x += d.vx; d.y += d.vy; d.vy += 0.3; d.life--;
    if (d.life <= 0 || d.y > canvas.height + 20) { exBlood.splice(i, 1); continue; }
    ctx.globalAlpha = Math.min(1, d.life / 20);
    ctx.strokeStyle = '#7F1D1D';
    ctx.lineWidth = d.r * 2 + 2;
    ctx.beginPath(); ctx.moveTo(d.x - d.vx * 1.6, d.y - d.vy * 1.6); ctx.lineTo(d.x, d.y); ctx.stroke();
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = d.r * 2;
    ctx.beginPath(); ctx.moveTo(d.x - d.vx * 1.6, d.y - d.vy * 1.6); ctx.lineTo(d.x, d.y); ctx.stroke();
  }
  ctx.restore();
}

function drawBossPose(p) {
  if (!p) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.sx, p.sy);
  drawExBossBody(ctx, exBossDims(), 2);
  ctx.restore();
}

function drawExFinale() {
  const b = activeBoss;
  const t = exFinT;
  const W = canvas.width;
  const bx = b.x, by = b.y - cameraY;
  const ease = v => (v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v));

  // 上から闇が落ちてくる
  let dark = 0;
  if (t < 40) dark = t / 40 * 0.5;
  else if (t < 222) dark = 0.5;
  else dark = 0.5 * (1 - ease((t - 222) / 88));
  if (dark > 0) {
    const g = ctx.createLinearGradient(0, 0, 0, by + 160);
    g.addColorStop(0, 'rgba(0,0,12,' + dark + ')');
    g.addColorStop(1, 'rgba(0,0,12,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, by + 160);
  }

  // 否愚魔（握られる前）。手のひらの手前・指の奥に描くので、ここでは位置だけ決める
  let bossPose = null;
  if (t < 222) {
    const sp = ease((t - 40) / 80);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * sp) + ')';
    ctx.beginPath(); ctx.ellipse(bx, by + 60, 70 + sp * 30, 16 + sp * 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const q = t < 170 ? 0 : Math.min(1, (t - 170) / 52);
    const sh = t < 20 ? 0 : (Math.random() - 0.5) * (t < 140 ? 3 : 3 + q * 8);
    bossPose = { x: bx + sh, y: by + 56 * q * 0.6, sx: 1 + 0.15 * q, sy: 1 - 0.6 * q };
  }

  // 手
  if (t >= 40) {
    const hover = by - 225, dive = by - 54, top = -520;
    let hx = bx, hy, curl;
    if (t < 120) {
      hy = top + (hover - top) * ease((t - 40) / 80);
      curl = 0;
      hx += Math.sin(t * 0.08) * 6;
    } else if (t < 140) {
      hy = hover + Math.sin((t - 120) * 0.4) * 3;
      curl = 0;
    } else if (t < 170) {
      const p = ease((t - 140) / 30);
      hy = hover + (dive - hover) * p;
      curl = 0.7 * p;
    } else if (t < 222) {
      const p = (t - 170) / 52;
      hy = dive + (Math.random() - 0.5) * (2 + p * 6);
      hx += (Math.random() - 0.5) * (2 + p * 8);
      curl = 0.7 + 0.3 * p;
    } else {
      const p = ease((t - 222) / 88);
      hy = dive + (top - dive) * p * p;
      curl = 1;
    }
    // 手のひら（奥）→ 否愚魔 → 指（手前）の順に描く
    drawGiantHandBack(ctx, hx, hy, 1.35, curl);
    drawBossPose(bossPose);
    drawGiantHandFront(ctx, hx, hy, 1.35, curl);

    // 指に付く血
    if (t >= 190) {
      const stain = Math.min(1, (t - 190) / 40);
      ctx.fillStyle = 'rgba(185,28,28,' + (0.7 * stain) + ')';
      for (let k = 0; k < 7; k++) {
        ctx.beginPath();
        ctx.ellipse(hx + (k - 3) * 20, hy + 85 + (k % 2) * 16, 9, 5, 0.3 * (k - 3), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 握る指の間から、赤いものが飛び散る
    if (t >= 170 && t < 222) exBloodSpray(bx + (Math.random() - 0.5) * 70, by + 20 + Math.random() * 50, 2, 5, 1.5);
    if (t >= 222 && !exBloodBurst) { exBloodBurst = true; exBloodSpray(bx, by + 20, 45, 9, 2); }
    if (t >= 226 && t < 310 && t % 6 === 0) {
      exBlood.push({ x: hx + (Math.random() - 0.5) * 40, y: hy + 120, vx: 0, vy: 0.5, r: 2.5, life: 60 });
    }
    drawExBlood();

    if (t >= 222) {
      // 握りこぶしの隙間からもれる、暗い光
      const gg = ctx.createRadialGradient(hx, hy + 20, 5, hx, hy + 20, 70);
      gg.addColorStop(0, 'rgba(160,20,60,0.5)');
      gg.addColorStop(1, 'rgba(160,20,60,0)');
      ctx.fillStyle = gg;
      ctx.beginPath(); ctx.arc(hx, hy + 20, 70, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    drawBossPose(bossPose);
  }

  // 解禁のお知らせ
  if (t >= 310) {
    const a = Math.min(1, (t - 310) / 12, (392 - t) / 12);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = 'rgba(10,10,20,0.82)';
    ctx.fillRect(0, 262, W, 118);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 262); ctx.lineTo(W, 262); ctx.moveTo(0, 380); ctx.lineTo(W, 380); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.font = '900 30px "M PLUS Rounded 1c", sans-serif';
    ctx.strokeStyle = INK3; ctx.lineWidth = 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeText('Endless Story', W / 2, 304);
    ctx.fillText('Endless Story', W / 2, 304);
    ctx.fillStyle = '#FDE047';
    ctx.strokeText('The Fantasy', W / 2, 340);
    ctx.fillText('The Fantasy', W / 2, 340);
    ctx.font = '900 16px "M PLUS Rounded 1c", sans-serif';
    ctx.fillStyle = '#F9A8D4';
    ctx.fillText('解禁！', W / 2, 368);
    ctx.restore();
  }
}

// 演出中も「戦闘中」として扱う
exFight = function () {
  return isExtraStage() && gameState === 'playing' && !!activeBoss &&
    activeBoss.name === EXTRA_BOSS && activeBoss.active &&
    (activeBoss.hp > 0 || exPhase === 'break' || exPhase === 'finale');
};

// 演出中はダメージを受けない
const baseBossTakeDamage3 = bossTakeDamage;
bossTakeDamage = function (n) {
  if (exPhase === 'finale') return;
  baseBossTakeDamage3(n);
};

// 第二形態を倒したら、クリアの代わりに最期の演出へ
const baseShowResult5 = showResult;
showResult = function (isClear) {
  if (isClear && gameState === 'playing' && isExtraStage() && activeBoss && activeBoss.name === EXTRA_BOSS) {
    if (exPhase === 2) { exBeginFinale(); return; }
    if (exPhase === 'finale') return;
  }
  baseShowResult5(isClear);
};

// ==========================================
// ENDLESS STORY THE FANTASY
//   終わりのない登り。100mごとにエリア（景色）が変わる
// ==========================================
const FANTASY_AREA_M = 100;
const FANTASY_AREAS = [
  { name: '風そよぐ草原', bgTop: '#DCFCE7', bgBottom: '#FEFCE8', wallColor: '#16A34A', wallLight: '#4ADE80', wallDark: '#166534' },
  { name: '雪降る霊峰', bgTop: '#E0F2FE', bgBottom: '#F8FAFC', wallColor: '#0284C7', wallLight: '#38BDF8', wallDark: '#0369A1' },
  { name: '黄金の砂漠', bgTop: '#FEF3C7', bgBottom: '#FFEDD5', wallColor: '#D97706', wallLight: '#FBBF24', wallDark: '#92400E' },
  { name: '深緑の神樹', bgTop: '#D1FAE5', bgBottom: '#ECFCCB', wallColor: '#0D9488', wallLight: '#2DD4BF', wallDark: '#115E59' },
  { name: '雲上の天空城', bgTop: '#E0E7FF', bgBottom: '#FAF5FF', wallColor: '#6366F1', wallLight: '#A5B4FC', wallDark: '#3730A3' },
  { name: '夕焼けの海原', bgTop: '#FFE4E6', bgBottom: '#FFEDD5', wallColor: '#E11D48', wallLight: '#FB7185', wallDark: '#9F1239' },
  { name: '月夜の庭園', bgTop: '#312E81', bgBottom: '#4C1D95', wallColor: '#7C3AED', wallLight: '#A78BFA', wallDark: '#5B21B6' },
  { name: '星海の回廊', bgTop: '#1E1B4B', bgBottom: '#312E81', wallColor: '#4F46E5', wallLight: '#818CF8', wallDark: '#312E81' },
  { name: '創世の間', bgTop: '#FDF4FF', bgBottom: '#FEF9C3', wallColor: '#C026D3', wallLight: '#E879F9', wallDark: '#86198F' }
];
STAGES.fantasy = Object.assign({}, STAGES.record, { name: 'FANTASY' });

let fantasyArea = 0;
let fantasyBest = 0;
try { fantasyBest = parseInt(localStorage.getItem('wallKickFantasyBest') || '0', 10) || 0; } catch (e) {}

function exFantasyApply(idx) {
  Object.assign(STAGES.fantasy, FANTASY_AREAS[idx % FANTASY_AREAS.length]);
}

// 解禁の表示更新（ストーリーモードのタブは split7.py が作る）
function exFantasyRefresh() {
  document.body.classList.toggle('fantasy-on', fantasyUnlocked);
}
exFantasyRefresh();

// 最高記録は、RECORDとは別に記録する
const baseShowResult6 = showResult;
showResult = function (isClear) {
  if (currentDifficulty === 'fantasy' && gameState === 'playing') {
    const real = bestRecord;
    bestRecord = fantasyBest;
    baseShowResult6(isClear);
    fantasyBest = bestRecord;
    try {
      localStorage.setItem('wallKickFantasyBest', String(fantasyBest));
      localStorage.setItem('wallKickBestRecord', String(real));
    } catch (e) {}
    bestRecord = real;
    return;
  }
  baseShowResult6(isClear);
};

// ---------- 開始時 ----------
const baseStartGame7 = startGame;
startGame = function (...args) {
  exFinT = 0;
  const isFantasy = args[0] === 'fantasy';
  if (isFantasy) { fantasyArea = 0; exFantasyApply(0); }
  baseStartGame7(...args);
  if (isFantasy) {
    lastSelectScreen = 'title';
    hudStage.textContent = 'FANTASY';
    stageIntro = { t: 110, total: 110, boss: null, title: FANTASY_AREAS[0].name, sub: 'AREA 1' };
  }
};

// ---------- 毎フレーム ----------
const baseUpdateFn8 = update;
update = function () {
  const g0 = goalY;
  baseUpdateFn8();
  if (paused || gameState !== 'playing') return;
  if (exPhase === 'finale' && isExtraStage() && activeBoss) {
    goalY = g0;                          // 演出中は、ボスの登りを止める
    activeBoss.y = goalY + 110;
    tickExFinale();
  }
  if (currentDifficulty === 'fantasy' && gameState === 'playing') {
    const idx = Math.floor(maxAltitude / FANTASY_AREA_M);
    if (idx !== fantasyArea) {
      fantasyArea = idx;
      exFantasyApply(idx);
      stageIntro = { t: 110, total: 110, boss: null, title: FANTASY_AREAS[idx % FANTASY_AREAS.length].name, sub: 'AREA ' + (idx + 1) };
    }
  }
};

const baseDrawFn13 = draw;
draw = function () {
  if (paused) return;
  const fin = gameState === 'playing' && isExtraStage() && exPhase === 'finale' && !!activeBoss;
  let saved = 0;
  if (fin) { saved = activeBoss.hp; activeBoss.hp = 0; }   // 元のボスは描かず、自前で描く
  baseDrawFn13();
  if (fin) { activeBoss.hp = saved; drawExFinale(); }
};


/* SPLIT7 */
// ==========================================
// 1. ストーリーモードの「THE FANTASY」タブ
// ==========================================
const FAN_BOSS = '天の手';
const FAN_BOSS_EVERY = 300;        // 何mごとにボスが出るか
let fanBossN = 0;
let fanNextBoss = FAN_BOSS_EVERY;
let fanLastAlt = 0;
let fantasyTabOn = false;

const fanTab = document.createElement('button');
fanTab.id = 'tab-fantasy';
fanTab.className = 'story-tab';
fanTab.textContent = 'THE FANTASY';
fanTab.addEventListener('click', () => switchStoryTab('fantasy'));
document.querySelector('.story-tabs').appendChild(fanTab);

exFantasyRefresh = function () {
  fanTab.style.display = fantasyUnlocked ? '' : 'none';
  document.querySelector('.story-tabs').classList.toggle('four', fantasyUnlocked);
};
exFantasyRefresh();

function renderFantasyList() {
  const listEl = document.getElementById('story-stage-list');
  listEl.innerHTML = '';
  const item = document.createElement('button');
  item.className = 'story-item boss-stage';
  item.innerHTML =
    '<div><span>∞ ENDLESS STORY THE FANTASY</span></div>' +
    '<span>BEST ' + fantasyBest + 'm</span>';
  item.onclick = () => startGame('fantasy');
  listEl.appendChild(item);
  const info = document.createElement('div');
  info.style.cssText = 'font-size:12px; font-weight:800; line-height:1.6; text-align:left; padding:6px 4px;';
  info.innerHTML =
    '終わりのない、ファンタジーの登り。<br>' +
    '100mごとに、エリア（景色）が変わる。<br>' +
    FAN_BOSS_EVERY + 'mごとに、ボス「' + FAN_BOSS + '」が現れる。<br>' +
    '倒すとコインがもらえて、登りが続く。';
  listEl.appendChild(info);
}

const baseSwitchStoryTab2 = switchStoryTab;
switchStoryTab = function (arc) {
  if (arc === 'fantasy') {
    if (!fantasyUnlocked) return;
    fantasyTabOn = true;
    ['japan', 'world', 'space'].forEach(a => document.getElementById('tab-' + a).classList.remove('active'));
    fanTab.classList.add('active');
    renderFantasyList();
    return;
  }
  fantasyTabOn = false;
  fanTab.classList.remove('active');
  baseSwitchStoryTab2(arc);
};
const baseRenderStoryList2 = renderStoryList;
renderStoryList = function () {
  if (fantasyTabOn) { renderFantasyList(); return; }
  baseRenderStoryList2();
};

// ---------- ボス「天の手」 ----------
BOSS_THEMES[FAN_BOSS] = mkTheme('#F6C9A1', '#FDE047', '#FEF9C3', '#FACC15');
BOSS_MOVES[FAN_BOSS] = [
  { m: 'laneStrike', n: '天罰の指', s: 'crystal' },
  { m: 'curtain', n: '星幕', s: 'halo' },
  { m: 'pincer', n: '掌挟み', s: 'star' },
  { m: 'hoverAim', n: '指弾き', s: 'crystal' },
  { m: 'rainVolley', n: '星屑の雨', s: 'star' },
  { m: 'gapWall', n: '壁押し', s: 'halo' },
  { m: 'homingPack', n: '導きの光', s: 'halo' }
];
const baseBossRank = bossRank;
bossRank = function (b) {
  return (b && b.name === FAN_BOSS) ? 14 : baseBossRank(b);
};

function fantasySpawnBoss() {
  fanBossN++;
  fanNextBoss += FAN_BOSS_EVERY;
  BOSS_HP_OVERRIDE[FAN_BOSS] = Math.min(14, 5 + fanBossN * 2);
  goalY = player.y - 400;
  initBoss(FAN_BOSS, goalY);
  // ボス戦のエリアから、障害物を取り除く
  const lo = goalY - 150, hi = goalY + 700;
  spikeBands = spikeBands.filter(b => b.y < lo || b.y > hi);
  bats = bats.filter(b => b.y < lo || b.y > hi);
  birds = [];
  ambusherEnemies = [];
  newEnemies.length = 0;
  projectiles = projectiles.filter(p => p.type === 'bossOrb' || p.type === 'bossSpread');
  stageIntro = { t: 130, total: 130, boss: null, title: FAN_BOSS, sub: 'BOSS  AREA ' + (fantasyArea + 1) };
  playSound('laserWarn');
}

function fantasyBossDown() {
  const b = activeBoss;
  if (!Number.isFinite(maxAltitude)) maxAltitude = fanLastAlt;
  const bonus = 20 + fanBossN * 10;
  stageCoins += bonus;
  bossHud.classList.add('hidden');
  bossLasers = [];
  bossQueue.length = 0;
  bossBombs.length = 0;
  projectiles = [];
  spawnParticles(b.x, b.y, '#FDE047', 40, false);
  spawnParticles(b.x, b.y, '#FFFFFF', 16, false);
  jfx.push({ type: 'flash', t: 0, total: 14, color: '255,255,255' });
  jfx.push({ type: 'ring', x: b.x, y: b.y, t: 0, total: 28, color: '#FDE047' });
  shakeTime = 26;
  playSound('clear');
  bossCallouts.push({ text: 'BOSS撃破！ +' + bonus + '枚', col: '#FDE047', t: 0, total: 90 });
  activeBoss = null;
  goalY = -Infinity;
}

// 天の手の描画（巨大な手が、空から垂れ下がる）
function drawFanHand() {
  const b = activeBoss;
  const sx = b.x, sy = b.y - cameraY;
  const T = Date.now() * 0.004;
  let curl = 0.12 + 0.04 * Math.sin(T * 2);
  if (b._charge > 0) {
    b._charge--;
    const p = 1 - b._charge / 32;
    curl = 0.12 + 0.6 * Math.sin(p * Math.PI);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.strokeStyle = hexToRgba(b._chargeCol || '#FDE047', 0.85 * (1 - p) + 0.15);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 110 * (1 - p) + 44, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  if (b.hitFlash > 0 && b.hitFlash % 4 < 2) ctx.globalAlpha = 0.45;
  const hx = sx + Math.sin(T) * 3;
  const hy = sy - 30 + Math.sin(T * 1.7) * 5;
  drawGiantHandBack(ctx, hx, hy, 0.8, curl);
  drawGiantHandFront(ctx, hx, hy, 0.8, curl);
  ctx.restore();
  drawBossGuard();
}

// ---------- 還元（味方ボス）----------
const KANGEN_LIFE = 900;           // 味方でいる時間（フレーム。900 = 約15秒）
const KANGEN_KIND = {
  '赤べこ将軍': 'bolt', '大仏ガーディアン': 'quake', '黄金シャチホコ王': 'beam', '高野山天狗マスター': 'bolt',
  '関門フグ大帝': 'guardian', '土佐カツオ将軍': 'beam', '琉球シーサー神': 'guardian', 'ヒマラヤ雪男王': 'quake',
  'カッパドキア魔人': 'quake', '氷河ヴァイキング王': 'beam', 'サバンナ獅子王': 'bolt', '密林ケツァール神': 'bolt',
  '天空鏡の守護神': 'guardian', 'アース・エンペラー': 'quake', 'アンコール石像王': 'quake', '黄金エルドラド王': 'beam',
  '白夜の氷床竜': 'beam', 'コズミック・オーバーロード': 'quake', '小惑星ゴーレム': 'quake', '冥界の門番ケルベロス': 'bolt',
  'パルサー・ビーコン': 'beam', 'ビッグバン・クロノス': 'quake', '否愚魔': 'beam'
};
const KANGEN_KIND_NAME = { bolt: '雷撃（敵を狙い撃ち）', beam: '貫通（敵とトゲを壊す）', quake: '地鳴り（画面の敵とトゲを壊す）', guardian: '守護（近づく敵を倒す）' };
let kAlly = null;
const kfx = [];

// 味方ボスのGIF（動かすために、実際のimg要素を重ねる）
const kAllyEl = document.createElement('img');
kAllyEl.id = 'kangen-gif';
kAllyEl.alt = '';
document.getElementById('game-wrapper').appendChild(kAllyEl);

TOOLS.push({
  id: 'kangen', name: '還元', price: 810, max: 3, color: '#34D399',
  desc: 'Zキーで使用。ランダムなボスが味方として現れ、約15秒の間、そのボスの攻撃で敵キャラを倒してくれる。ボスによっては、トゲも壊す。',
  icon: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#064E3B" stroke="#1E1E24" stroke-width="2"/><path d="M24 9a15 15 0 0 1 13 7.5M39 24a15 15 0 0 1-7.5 13M24 39a15 15 0 0 1-13-7.5M9 24a15 15 0 0 1 7.5-13" fill="none" stroke="#34D399" stroke-width="3.5" stroke-linecap="round"/><polygon points="24,16 26.5,21.5 32.5,22.3 28,26.5 29.2,32.5 24,29.6 18.8,32.5 20,26.5 15.5,22.3 21.5,21.5" fill="#FDE047" stroke="#1E1E24" stroke-width="1.5"/></svg>'
});
document.getElementById('shop-tab-tool').textContent = '忍具 (6)';

function kangenSummon() {
  const name = BOSS_ORDER[Math.floor(Math.random() * BOSS_ORDER.length)];
  const kind = KANGEN_KIND[name] || 'bolt';
  kQueue.length = 0;
  kAlly = {
    name: name, kind: kind, t: 0, life: KANGEN_LIFE, cd: 1e9, atkCd: 45,
    hp: 99, active: true, _ally: true, x: canvas.width / 2, y: player.y - 150
  };
  kAllyEl.dataset.n = '';
  const col = (BOSS_THEMES[name] || DEFAULT_THEME).orb;
  jfx.push({ type: 'banner', text: '還元', sub: name + ' が味方に！', color: '#34D399', t: 0, total: 60 });
  jfx.push({ type: 'ring', x: player.x + player.size / 2, y: player.y + player.size / 2, t: 0, total: 24, color: '#6EE7B7' });
  spawnParticles(canvas.width / 2, player.y - 150, col, 18, false);
  playSound('clear');
}

function kangenTargets(withSpikes) {
  const list = [];
  const top = cameraY - 30, bot = cameraY + canvas.height + 30;
  if (withSpikes) {
    spikeBands.forEach(b => {
      const cy = b.y + b.totalHeight / 2;
      if (cy > top && cy < bot) list.push({ k: 'spike', o: b, x: b.side === 'left' ? LEFT_WALL_X + 14 : RIGHT_WALL_X - 14, y: cy });
    });
  }
  bats.forEach(o => { if (o.y > top && o.y < bot) list.push({ k: 'bat', o: o, x: o.x, y: o.y }); });
  birds.forEach(o => { if (o.y > top && o.y < bot) list.push({ k: 'bird', o: o, x: o.x, y: o.y }); });
  ambusherEnemies.forEach(o => {
    list.push({ k: 'amb', o: o, x: o.side === 'left' ? LEFT_WALL_X + 10 : RIGHT_WALL_X - 10, y: cameraY + o.relY });
  });
  newEnemies.forEach(o => {
    let x = o.x, y = o.y;
    if (o.k === 'crawler') x = o.side === 'left' ? LEFT_WALL_X + 12 : RIGHT_WALL_X - 12;
    if (o.k === 'boar' && !o.dashing) x = o.side === 'left' ? LEFT_WALL_X + 20 : RIGHT_WALL_X - 20;
    if (y > top && y < bot) list.push({ k: 'ne', o: o, x: x, y: y });
  });
  projectiles.forEach(o => {
    if ((o.type === 'arrow' || o.type === 'snowball' || o.sprite === 'shrapnel') && !o.reflected) {
      list.push({ k: 'proj', o: o, x: o.x, y: o.y });
    }
  });
  return list;
}

function kangenKill(t) {
  if (t.k === 'spike') { spikeBands = spikeBands.filter(o => o !== t.o); shakeTime = Math.max(shakeTime, 6); }
  else if (t.k === 'bat') bats = bats.filter(o => o !== t.o);
  else if (t.k === 'bird') birds = birds.filter(o => o !== t.o);
  else if (t.k === 'amb') ambusherEnemies = ambusherEnemies.filter(o => o !== t.o);
  else if (t.k === 'ne') { const i = newEnemies.indexOf(t.o); if (i >= 0) newEnemies.splice(i, 1); }
  else projectiles = projectiles.filter(o => o !== t.o);
  spawnParticles(t.x, t.y, '#6EE7B7', 8, false);
}

function kangenBreakSpikes(y0, y1) {
  let n = 0;
  spikeBands = spikeBands.filter(b => {
    const hit = b.y + b.totalHeight > y0 && b.y < y1;
    if (hit) {
      n++;
      spawnParticles(b.side === 'left' ? LEFT_WALL_X + 10 : RIGHT_WALL_X - 10, b.y + b.totalHeight / 2, '#FF2A55', 10, false);
    }
    return !hit;
  });
  if (n) { shakeTime = Math.max(shakeTime, 8); playSound('deflect'); }
}

// ---------- 味方ボスの攻撃: 本物のボスの技を、そのまま使う ----------
// 技の弾は敵に当たると敵を倒す（プレイヤーには当たらない）。トゲを壊すのは、貫通・地鳴りのボスだけ
const kQueue = [];

const baseSigQueue2 = sigQueue;
sigQueue = function (b, t, fn, warn) {
  if (b && b._ally) kQueue.push({ t: t, fn: fn });
  else baseSigQueue2(b, t, fn, warn);
};

const baseV2Shot2 = v2Shot;
v2Shot = function (b, cfg, x, y, vx, vy, o) {
  if (!(b && b._ally)) return baseV2Shot2(b, cfg, x, y, vx, vy, o);
  o = o || {};
  const sz = o.sz || 15;
  const rad = o.r || Math.round(sz * 0.7);
  const sMul = 0.8 * (1 + 0.012 * bossRank(b));   // 本物のボスと同じ弾の速さ
  const p = {
    type: 'allyShot', ally: true, canSpike: b.kind === 'beam' || b.kind === 'quake', heavy: !!o.heavy,
    x: Math.max(LEFT_WALL_X + rad + 4, Math.min(RIGHT_WALL_X - rad - 4, x)), y: y,
    vx: vx * sMul, vy: vy * sMul, radius: rad, sz: sz, reflected: false, life: o.life || 240,
    sprite: o.sprite || cfg.s, scol: cfg.col, allyHoming: o.homing || 0, t: 0
  };
  projectiles.push(p);
  return p;
};

function tickKQueue() {
  for (let i = kQueue.length - 1; i >= 0; i--) {
    const q = kQueue[i];
    q.t--;
    if (q.t <= 0) { kQueue.splice(i, 1); q.fn(); }
  }
}

function kangenAttack(a) {
  const moves = BOSS_MOVES[a.name] || DEFAULT_MOVES;
  const m = (a.name === EXTRA_BOSS) ? moves[Math.floor(Math.random() * moves.length)] : moves[(a._mv || 0) % moves.length];
  a._mv = (a._mv || 0) + 1;
  const col = (BOSS_THEMES[m.src || a.name] || DEFAULT_THEME).orb;
  const cfg = { s: m.s, n: m.n, col: col };
  // 狙う先: プレイヤーに近い敵。いなければ、プレイヤーの少し上
  const pcx = player.x + player.size / 2, pcy = player.y + player.size / 2;
  const tg = kangenTargets(false).sort((p, q) => Math.hypot(p.x - pcx, p.y - pcy) - Math.hypot(q.x - pcx, q.y - pcy))[0];
  const px = tg ? tg.x : pcx;
  const py = tg ? tg.y : pcy - 150;
  const r = bossRank(a);
  const dur = MOVES[m.m](a, cfg, r, px, py) || 150;
  // 本物のボスと同じ攻撃間隔
  a.atkCd = Math.round(Math.max(150, dur) * 1.35 / (1 + 0.015 * r));
  kfx.push({ type: 'label', text: m.n, x: a.x, y: a.y, t: 0, total: 60 });
}

// 味方の弾に触れた敵の飛び道具（矢・雪玉・ボスの弾）を、跳ね返す
function kangenReflect(p) {
  playSound('deflect');
  spawnParticles(p.x, p.y, '#6EE7B7', 8, false);
  const orig = p.type;
  if (orig === 'arrow' || orig === 'snowball') {
    // 味方の弾に変えて、逆向きに飛ばす（敵に当たれば倒す）
    p.type = 'allyShot';
    p.ally = true;
    p.canSpike = false;
    p.heavy = false;
    p.reflected = false;
    p.sprite = orig === 'arrow' ? 'spear' : 'ice';
    p.scol = orig === 'arrow' ? '#FDE047' : '#BAE6FD';
    p.radius = p.radius || 10;
    p.sz = 12;
    p.t = 0;
    p.allyHoming = 40;
    p.vx = -p.vx * 1.4;
    p.vy = orig === 'snowball' ? -4 : p.vy * 1.4;
    p.life = Math.max(p.life || 0, 120);
  } else {
    // ボスの弾: ボスに向かって弾き返す（ボスに当たればダメージ）
    const b = activeBoss;
    p.reflected = true;
    p.homing = 0;
    if (b && b.hp > 0) {
      const d = Math.max(1, Math.hypot(b.x - p.x, b.y - p.y));
      const sp = Math.max(9, Math.hypot(p.vx, p.vy) * 1.2);
      p.vx = (b.x - p.x) / d * sp;
      p.vy = (b.y - p.y) / d * sp;
    } else {
      p.vx = -p.vx * 1.2;
      p.vy = -p.vy * 1.2;
    }
    p.life = Math.max(p.life || 0, 80);
  }
}

function tickKShots() {
  const mine = projectiles.filter(p => p.ally);
  if (!mine.length) return;
  const all = kangenTargets(false);
  mine.forEach(s => {
    s.t++;
    if (s.allyHoming > 0 && all.length) {
      s.allyHoming--;
      const tg = all.reduce((p, q) => (Math.hypot(q.x - s.x, q.y - s.y) < Math.hypot(p.x - s.x, p.y - s.y) ? q : p));
      const cur = Math.atan2(s.vy, s.vx);
      let d = Math.atan2(tg.y - s.y, tg.x - s.x) - cur;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      const na = cur + Math.max(-0.035, Math.min(0.035, d));
      const sp = Math.hypot(s.vx, s.vy);
      s.vx = Math.cos(na) * sp;
      s.vy = Math.sin(na) * sp;
    }
    s.x += s.vx;
    s.y += s.vy;
    if (s.y < cameraY - 90 || s.y > cameraY + canvas.height + 90) { s.life = 0; return; }
    // 敵の飛び道具を跳ね返す
    for (const p of projectiles) {
      if (p.ally || p.reflected) continue;
      if (p.type !== 'arrow' && p.type !== 'snowball' && p.type !== 'bossOrb' && p.type !== 'bossSpread') continue;
      if (Math.hypot(p.x - s.x, p.y - s.y) < (s.radius || 12) + (p.radius || 10) + 12) kangenReflect(p);
    }
    for (const t of all) {
      if (t.dead) continue;
      if (Math.hypot(t.x - s.x, t.y - s.y) < s.radius + 16) {
        kangenKill(t);
        t.dead = true;
        playSound('batKill');
        if (!s.heavy && !s.canSpike) { s.life = 0; break; }
      }
    }
    if (s.canSpike) {
      spikeBands = spikeBands.filter(b => {
        const x1 = b.side === 'left' ? LEFT_WALL_X : RIGHT_WALL_X - b.width;
        const hit = s.x + s.radius > x1 && s.x - s.radius < x1 + b.width && s.y + s.radius > b.y && s.y - s.radius < b.y + b.totalHeight;
        if (hit) {
          spawnParticles(x1 + b.width / 2, b.y + b.totalHeight / 2, '#FF2A55', 10, false);
          shakeTime = Math.max(shakeTime, 6);
          playSound('deflect');
        }
        return !hit;
      });
    }
  });
}

function tickKangen() {
  tickKShots();
  const a = kAlly;
  if (!a) return;
  a.t++;
  tickKQueue();
  a.atkCd--;
  if (a.atkCd <= 0) kangenAttack(a);
  const tx = canvas.width / 2 + Math.sin(a.t * 0.03) * 70;
  const ty = Math.max(cameraY + 110, Math.min(cameraY + canvas.height - 170, player.y - 150));
  a.x += (tx - a.x) * 0.06;
  a.y += (ty - a.y) * 0.06;
  a.cd--;
  const pcx = player.x + player.size / 2, pcy = player.y + player.size / 2;

  if (a.cd <= 0) {
    if (a.kind === 'bolt') {
      const list = kangenTargets().sort((p, q) => Math.hypot(p.x - pcx, p.y - pcy) - Math.hypot(q.x - pcx, q.y - pcy)).slice(0, 2);
      list.forEach(t => {
        kfx.push({ type: 'bolt', x1: a.x, y1: a.y, x2: t.x, y2: t.y, t: 0, total: 14 });
        kangenKill(t);
      });
      if (list.length) playSound('batKill');
      a.cd = 45;
    } else if (a.kind === 'beam') {
      const list = kangenTargets().sort((p, q) => Math.hypot(p.x - pcx, p.y - pcy) - Math.hypot(q.x - pcx, q.y - pcy));
      const by = list.length ? list[0].y : a.y;
      kfx.push({ type: 'beamWarn', y: by, t: 0, total: 18 });
      kfx.push({
        type: 'beam', y: by, t: -18, total: 14,
        fire: () => {
          kangenTargets().forEach(t => { if (Math.abs(t.y - by) < 34) kangenKill(t); });
          kangenBreakSpikes(by - 26, by + 26);
          shakeTime = Math.max(shakeTime, 6);
          playSound('laserFire');
        }
      });
      a.cd = 110;
    } else if (a.kind === 'quake') {
      kfx.push({ type: 'ring', x: a.x, y: a.y, t: 0, total: 26 });
      kangenTargets().forEach(t => kangenKill(t));
      kangenBreakSpikes(cameraY - 20, cameraY + canvas.height + 20);
      shakeTime = Math.max(shakeTime, 12);
      playSound('bossDamage');
      a.cd = 170;
    } else {
      const near = kangenTargets().filter(t => Math.hypot(t.x - pcx, t.y - pcy) < 150);
      near.forEach(t => { kfx.push({ type: 'bolt', x1: a.x, y1: a.y, x2: t.x, y2: t.y, t: 0, total: 10 }); kangenKill(t); });
      if (near.length) playSound('batKill');
      a.cd = 18;
    }
  }
  if (a.t >= a.life) {
    spawnParticles(a.x, a.y, '#6EE7B7', 20, false);
    jfx.push({ type: 'ring', x: a.x, y: a.y, t: 0, total: 20, color: '#6EE7B7' });
    kQueue.length = 0;
    kAlly = null;
  }
}

function drawKangen() {
  const a = kAlly;
  if (!a) kAllyEl.style.display = 'none';
  const hasShots = projectiles.some(p => p.ally);
  if (!a && !hasShots && kfx.length === 0) return;
  const W = canvas.width;

  // 味方の弾には、緑の輪を付けて、敵の弾と見分ける
  if (hasShots) {
    ctx.save();
    ctx.strokeStyle = 'rgba(110,231,183,0.9)';
    ctx.lineWidth = 2;
    for (const p of projectiles) {
      if (!p.ally) continue;
      const sy0 = p.y - cameraY;
      if (sy0 < -40 || sy0 > canvas.height + 40) continue;
      ctx.beginPath(); ctx.arc(p.x, sy0, (p.sz || 14) + 5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  for (let i = kfx.length - 1; i >= 0; i--) {
    const f = kfx[i];
    f.t++;
    if (f.t === 0 && f.fire) f.fire();
    if (f.t >= f.total) { kfx.splice(i, 1); continue; }
    if (f.t < 0) continue;
    const p = f.t / f.total;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (f.type === 'bolt') {
      const x1 = f.x1, y1 = f.y1 - cameraY, x2 = f.x2, y2 = f.y2 - cameraY;
      const dx = x2 - x1, dy = y2 - y1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      for (let k = 1; k < 6; k++) {
        const u = k / 6;
        ctx.lineTo(x1 + dx * u + (Math.random() - 0.5) * 22, y1 + dy * u + (Math.random() - 0.5) * 22);
      }
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(52,211,153,' + (1 - p) + ')'; ctx.lineWidth = 8; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,' + (1 - p) + ')'; ctx.lineWidth = 3; ctx.stroke();
    } else if (f.type === 'beamWarn') {
      ctx.strokeStyle = 'rgba(52,211,153,' + (0.4 + 0.5 * Math.abs(Math.sin(f.t * 0.6))) + ')';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.beginPath(); ctx.moveTo(0, f.y - cameraY); ctx.lineTo(W, f.y - cameraY); ctx.stroke();
    } else if (f.type === 'beam') {
      const sy = f.y - cameraY, th = 26 * (1 - p * 0.5);
      ctx.fillStyle = 'rgba(52,211,153,0.45)'; ctx.fillRect(0, sy - th, W, th * 2);
      ctx.fillStyle = '#A7F3D0'; ctx.fillRect(0, sy - th * 0.55, W, th * 1.1);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, sy - th * 0.2, W, th * 0.4);
    } else if (f.type === 'label') {
      ctx.textAlign = 'center';
      ctx.font = '900 13px "M PLUS Rounded 1c", sans-serif';
      ctx.globalAlpha = Math.min(1, (1 - p) * 2);
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(6,78,59,0.95)';
      const ly = (kAlly ? kAlly.y : f.y) - cameraY - 86 - p * 12;
      const lx = kAlly ? kAlly.x : f.x;
      ctx.strokeText(f.text, lx, ly);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(f.text, lx, ly);
    } else if (f.type === 'ring') {
      ctx.strokeStyle = 'rgba(110,231,183,' + (1 - p) + ')';
      ctx.lineWidth = 6 * (1 - p) + 1;
      ctx.beginPath(); ctx.arc(f.x, f.y - cameraY, 10 + p * 420, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  if (!a) return;
  const sx = a.x, sy = a.y - cameraY + Math.sin(a.t * 0.1) * 4;
  const col = (BOSS_THEMES[a.name] || DEFAULT_THEME).body;
  const fade = Math.min(1, a.t / 12, (a.life - a.t) / 20);
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  const au = ctx.createRadialGradient(sx, sy, 8, sx, sy, 88);
  au.addColorStop(0, 'rgba(110,231,183,0.55)');
  au.addColorStop(1, 'rgba(110,231,183,0)');
  ctx.fillStyle = au;
  ctx.beginPath(); ctx.arc(sx, sy, 88, 0, Math.PI * 2); ctx.fill();
  const g = getBossGif(a.name);
  ctx.translate(sx, sy);
  if (g) {
    // GIFは、画面に重ねた実際のimg要素で動かす
    const h = 104, w = h * g.naturalWidth / g.naturalHeight;
    if (kAllyEl.dataset.n !== a.name) {
      kAllyEl.src = g.currentSrc || g.src;
      kAllyEl.dataset.n = a.name;
    }
    const k = canvas.clientWidth / canvas.width;
    kAllyEl.style.display = 'block';
    kAllyEl.style.left = ((sx - w / 2) * k) + 'px';
    kAllyEl.style.top = ((sy - h / 2) * k) + 'px';
    kAllyEl.style.width = (w * k) + 'px';
    kAllyEl.style.height = (h * k) + 'px';
    kAllyEl.style.opacity = String(Math.max(0, fade));
  } else {
    kAllyEl.style.display = 'none';
    ctx.lineJoin = 'round';
    ctx.scale(1.5, 1.5);
    ctx.fillStyle = col; ctx.strokeStyle = INK3; ctx.lineWidth = 3;
    drawRoundRect(-26, -22, 52, 44, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK3;
    ctx.fillRect(-14, -8, 9, 7); ctx.fillRect(5, -8, 9, 7);
    ctx.fillStyle = '#FFD600';
    ctx.fillRect(-11, -6, 4, 3); ctx.fillRect(8, -6, 4, 3);
    ctx.scale(1 / 1.5, 1 / 1.5);
  }
  // 名前と残り時間
  ctx.textAlign = 'center';
  ctx.font = '900 11px "M PLUS Rounded 1c", sans-serif';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(6,78,59,0.9)';
  ctx.strokeText(a.name, 0, -66);
  ctx.fillStyle = '#D1FAE5';
  ctx.fillText(a.name, 0, -66);
  ctx.fillStyle = 'rgba(6,78,59,0.8)'; ctx.fillRect(-26, 62, 52, 5);
  ctx.fillStyle = '#34D399'; ctx.fillRect(-26, 62, 52 * (1 - a.t / a.life), 5);
  ctx.restore();
}

// 還元はこのモジュールで処理する（Zキー / 画面左下のボタン）
const baseUseTool2 = useTool;
useTool = function () {
  if (gameState === 'playing' && !paused && toolRun && toolRun.id === 'kangen') {
    if (toolRun.left <= 0 || toolLock > 0 || kAlly) return;
    consumeTool();
    toolLock = 30;
    kangenSummon();
    return;
  }
  baseUseTool2();
};

// ---------- ボス撃破の横取り（FANTASYのボスは、クリアではなく登りの続き）----------
const baseShowResult7 = showResult;
showResult = function (isClear) {
  if (isClear && currentDifficulty === 'fantasy' && gameState === 'playing' && activeBoss && activeBoss.name === FAN_BOSS) {
    fantasyBossDown();
    return;
  }
  baseShowResult7(isClear);
  if (currentDifficulty === 'fantasy') document.getElementById('btn-result-back').textContent = 'ステージ一覧へ';
};

// ---------- 開始時 ----------
const baseStartGame8 = startGame;
startGame = function (...args) {
  fanBossN = 0;
  fanNextBoss = FAN_BOSS_EVERY;
  fanLastAlt = 0;
  kAlly = null;
  kfx.length = 0;
  kQueue.length = 0;
  kAllyEl.style.display = 'none';
  baseStartGame8(...args);
  if (args[0] === 'fantasy') lastSelectScreen = 'story';
};

// ---------- 毎フレーム ----------
const baseUpdateFn9 = update;
update = function () {
  const fan = currentDifficulty === 'fantasy' && gameState === 'playing';
  if (fan) {
    if (Number.isFinite(maxAltitude)) fanLastAlt = maxAltitude;
    if (activeBoss && activeBoss.name === FAN_BOSS) {
      birdSpawnTimer = 999;
      ambusherSpawnTimer = 999;
      enemySpawnTimer = 999;
    } else if (!activeBoss && !paused && fanLastAlt >= fanNextBoss) {
      fantasySpawnBoss();
    }
  }
  baseUpdateFn9();
  if (paused || gameState !== 'playing') return;
  if (fan && !Number.isFinite(maxAltitude)) maxAltitude = fanLastAlt;   // ボスを倒した瞬間の高度の乱れを直す
  tickKangen();
};

const baseDrawFn14 = draw;
draw = function () {
  if (paused) return;
  const hb = currentDifficulty === 'fantasy' && gameState === 'playing' && !!activeBoss &&
    activeBoss.name === FAN_BOSS && activeBoss.hp > 0;
  let saved = 0;
  if (hb) { saved = activeBoss.hp; activeBoss.hp = 0; }   // 元のボスは描かず、手を自前で描く
  baseDrawFn14();
  if (hb) { activeBoss.hp = saved; drawFanHand(); }
  if (gameState === 'playing') drawKangen();
  else kAllyEl.style.display = 'none';
};


/* SPLIT8 */
// ==========================================
// 剣のエンチャント
// ==========================================
const CRYSTAL_PRICE = 100;         // クリスタル1個の値段（コイン）
const GACHA_COST_1 = 5;            // ガチャ1回に必要なクリスタル
const GACHA_COST_10 = 45;          // 10連に必要なクリスタル（レア以上が1つ確定）
const RAR = [
  { k: 'N', name: 'ノーマル', col: '#94A3B8', w: 60 },
  { k: 'R', name: 'レア', col: '#38BDF8', w: 28 },
  { k: 'SR', name: 'スーパーレア', col: '#C084FC', w: 10 },
  { k: 'SSR', name: '伝説', col: '#FACC15', w: 2 }
];
// 書の種類。v は Lv0〜Lv4 の効果（Lv4 は伝説のみ）
const ENCH = [
  { id: 'long', name: '長寿', col: '#38BDF8', v: [0, 4, 8, 12, 20], text: v => '回転攻撃の持続が +' + v + 'フレーム（約+' + (v / 60).toFixed(2) + '秒）' },
  { id: 'swift', name: '疾風', col: '#34D399', v: [0, 8, 16, 24, 36], text: v => '回転攻撃のあとの、使えない時間が -' + v + 'フレーム' },
  { id: 'crush', name: '破砕', col: '#F87171', v: [0, 0.06, 0.12, 0.18, 0.30], text: v => 'コウモリの撃破率が +' + Math.round(v * 100) + '%' },
  { id: 'gold', name: '黄金', col: '#FACC15', v: [0, 0.10, 0.20, 0.30, 0.50], text: v => 'コインを拾うとき、' + Math.round(v * 100) + '%の確率で2倍' },
  { id: 'gale', name: '烈風', col: '#A78BFA', v: [0, 6, 12, 18, 28], text: v => '回転攻撃の範囲が +' + v + 'px（コウモリ）' }
];
function enchDef(id) { return ENCH.find(e => e.id === id) || ENCH[0]; }

let enchSave = { crystals: 0, books: [], sword: {} };
try {
  const raw = JSON.parse(localStorage.getItem('wallKickEnchant') || 'null');
  if (raw && typeof raw === 'object') enchSave = Object.assign(enchSave, raw);
} catch (e) {}
function saveEnch() {
  try { localStorage.setItem('wallKickEnchant', JSON.stringify(enchSave)); } catch (e) {}
}
function enchLv(swordId, eid) { return ((enchSave.sword || {})[swordId] || {})[eid] || 0; }
function enchVal(eid) {
  const lv = enchLv(selectedSwordId, eid);
  return lv ? enchDef(eid).v[lv] : 0;
}

// ---------- ゲーム中の効果 ----------
// 破砕: コウモリの撃破率アップ（ショップやタイトルの表示にも反映される）
const baseGetCurrentSword = getCurrentSword;
getCurrentSword = function () {
  const sw = baseGetCurrentSword();
  const lv = enchLv(sw.id, 'crush');
  if (!lv) return sw;
  return Object.assign({}, sw, { batKillRate: Math.min(1, sw.batKillRate + enchDef('crush').v[lv]) });
};

// 長寿・疾風: 回転攻撃の持続を延ばし、使えない時間を縮める
const basePerformSpinAttack3 = performSpinAttack;
performSpinAttack = function () {
  const before = player.lockoutTimer;
  basePerformSpinAttack3();
  if (gameState === 'playing' && before <= 0 && player.lockoutTimer > 0 && player.spinTimer > 0 && !player.clashState) {
    player.spinTimer += enchVal('long');
    player.lockoutTimer = Math.max(20, player.lockoutTimer - enchVal('swift'));
  }
};

// 黄金・烈風
const baseUpdateFn10 = update;
update = function () {
  const sc0 = stageCoins;
  baseUpdateFn10();
  if (gameState !== 'playing') return;
  const g = enchVal('gold');
  if (g > 0 && stageCoins > sc0) {
    let add = 0;
    for (let i = sc0; i < stageCoins; i++) if (Math.random() < g) add++;
    if (add) stageCoins += add;
  }
  const gale = enchVal('gale');
  if (gale > 0 && player.spinTimer > 0) {
    const pcx = player.x + player.size / 2, pcy = player.y + player.size / 2;
    const rate = getCurrentSword().batKillRate;
    for (let i = bats.length - 1; i >= 0; i--) {
      const b = bats[i];
      const d = Math.hypot(pcx - b.x, pcy - b.y);
      const inner = b.radius + player.size / 2 + 12;
      if (d >= inner && d < inner + gale && Math.random() < rate * 0.35) {
        playSound('batKill');
        spawnParticles(b.x, b.y, getCurrentSword().glowColor, 14, false);
        bats.splice(i, 1);
      }
    }
  }
};

// ==========================================
// ショップ「エンチャント」タブ
// ==========================================
const enchTab = document.createElement('button');
enchTab.id = 'shop-tab-ench';
enchTab.className = 'shop-tab';
enchTab.textContent = 'エンチャント購入';
enchTab.addEventListener('click', () => switchShopTab('ench'));
document.querySelector('.shop-tabs').appendChild(enchTab);

// 書を剣に付ける（エンチャントする）のは、別のタブ
const enchApplyTab = document.createElement('button');
enchApplyTab.id = 'shop-tab-ench-apply';
enchApplyTab.className = 'shop-tab';
enchApplyTab.textContent = 'エンチャント付与';
enchApplyTab.addEventListener('click', () => switchShopTab('enchApply'));
document.querySelector('.shop-tabs').appendChild(enchApplyTab);

const baseSwitchShopTab3 = switchShopTab;
switchShopTab = function (tab) {
  baseSwitchShopTab3(tab);
  enchTab.classList.toggle('active', tab === 'ench');
  enchApplyTab.classList.toggle('active', tab === 'enchApply');
};
const baseRenderSkinGrid3 = renderSkinGrid;
renderSkinGrid = function () {
  if (currentShopTab === 'ench') { renderEnchGrid(false); return; }
  if (currentShopTab === 'enchApply') { renderEnchGrid(true); return; }
  baseRenderSkinGrid3();
  if (currentShopTab === 'sword') decorateSwordCards();
};

// 剣のカードに、付いているエンチャントを表示する
function decorateSwordCards() {
  const grid = document.getElementById('skin-grid');
  Array.from(grid.children).forEach((card, i) => {
    const sw = SWORDS[i];
    if (!sw) return;
    const have = ENCH.filter(e => enchLv(sw.id, e.id) > 0);
    if (!have.length) return;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; flex-wrap:wrap; gap:2px; justify-content:center;';
    have.forEach(e => {
      const chip = document.createElement('span');
      chip.className = 'ench-chip';
      chip.style.background = e.col;
      chip.textContent = e.name + ' Lv' + enchLv(sw.id, e.id);
      row.appendChild(chip);
    });
    card.appendChild(row);
  });
}

const CRYSTAL_ICON = '<svg viewBox="0 0 48 48"><polygon points="24,3 36,15 32,38 24,46 16,38 12,15" fill="#A78BFA" stroke="#1E1E24" stroke-width="2"/><polygon points="24,3 36,15 24,20 12,15" fill="#DDD6FE" stroke="#1E1E24" stroke-width="1.5"/><polygon points="24,20 36,15 32,38 24,30" fill="#8B5CF6" stroke="#1E1E24" stroke-width="1.5"/><polygon points="24,20 12,15 16,38 24,30" fill="#6D28D9" stroke="#1E1E24" stroke-width="1.5"/></svg>';
const BOOK_ICON = '<svg viewBox="0 0 48 48"><rect x="9" y="5" width="30" height="38" rx="3" fill="#7C3AED" stroke="#1E1E24" stroke-width="2"/><rect x="9" y="5" width="6" height="38" fill="#4C1D95" stroke="#1E1E24" stroke-width="2"/><polygon points="26,14 31,20 26,30 21,20" fill="#FDE047" stroke="#1E1E24" stroke-width="1.5"/><rect x="13" y="38" width="22" height="3" fill="#FACC15"/></svg>';

let enchSel = -1;   // 付与しようとしている書

function enchBuyCrystal(n) {
  const cost = CRYSTAL_PRICE * n;
  if (totalCoins >= cost) {
    totalCoins -= cost;
    enchSave.crystals += n;
    saveEnch();
    saveCoinAndSkinData();
    gSfx('flip', 1);
  } else {
    playSound('hit');
  }
  renderEnchGrid(false);
}

function addBook(id, lv) {
  const b = enchSave.books.find(x => x.id === id && x.lv === lv);
  if (b) b.n++;
  else enchSave.books.push({ id: id, lv: lv, n: 1 });
}

function enchApply(bookIdx, swordId) {
  const b = enchSave.books[bookIdx];
  if (!b) return;
  const cur = enchLv(swordId, b.id);
  if (cur >= b.lv) { playSound('hit'); return; }
  enchSave.sword = enchSave.sword || {};
  enchSave.sword[swordId] = enchSave.sword[swordId] || {};
  enchSave.sword[swordId][b.id] = b.lv;
  b.n--;
  if (b.n <= 0) { enchSave.books.splice(bookIdx, 1); enchSel = -1; }
  saveEnch();
  updateTitleEquipTag();
  gSfx('chime', Math.min(3, b.lv - 1));
  renderEnchGrid(true);
}

// applyMode = false: 「エンチャント購入」タブ（クリスタルとガチャ） / true: 「エンチャント付与」タブ（書を剣に付ける）
function renderEnchGrid(applyMode) {
  const grid = document.getElementById('skin-grid');
  grid.innerHTML = '';

  const mk = (color, icon, title, sub, desc) => {
    const card = document.createElement('div');
    card.className = 'skin-card jutsu-card';
    card.style.background = 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)';
    card.style.color = '#F8FAFC';
    card.style.borderColor = color;
    card.style.boxShadow = '4px 4px 0px ' + color;
    card.style.cursor = 'default';
    const head = document.createElement('div');
    head.className = 'jutsu-head';
    head.innerHTML =
      '<div class="jutsu-icon" style="box-shadow: inset 0 0 14px ' + color + ';">' + icon + '</div>' +
      '<div class="jutsu-info"><div class="jutsu-name">' + title + '<span class="jutsu-sub" style="color:' + color + ';">' + sub + '</span></div>' +
      '<div class="jutsu-desc">' + desc + '</div></div>';
    card.appendChild(head);
    grid.appendChild(card);
    return card;
  };
  const btn = (parent, label, cls, fn) => {
    const b = document.createElement('button');
    b.className = 'jutsu-btn ' + cls;
    b.textContent = label;
    b.onclick = fn;
    parent.appendChild(b);
  };

  if (!applyMode) {
  // クリスタル
  const c1 = mk('#A78BFA', CRYSTAL_ICON, 'エンチャントクリスタル', '所持 ' + enchSave.crystals + '個',
    'エンチャントの書を引くガチャの材料。1個 ' + CRYSTAL_PRICE + 'コイン。');
  const r1 = document.createElement('div');
  r1.className = 'jutsu-row';
  btn(r1, '×1  ' + CRYSTAL_PRICE + '枚', totalCoins >= CRYSTAL_PRICE ? 'buy' : 'dim', () => enchBuyCrystal(1));
  btn(r1, '×10  ' + CRYSTAL_PRICE * 10 + '枚', totalCoins >= CRYSTAL_PRICE * 10 ? 'buy' : 'dim', () => enchBuyCrystal(10));
  c1.appendChild(r1);

  // ガチャ
  const c2 = mk('#FACC15', BOOK_ICON, 'エンチャントガチャ', '書が出る',
    'ノーマル60% / レア28% / スーパーレア10% / 伝説2%（伝説はLv4）。書を剣に付与すると、効果が出る。');
  const r2 = document.createElement('div');
  r2.className = 'jutsu-row';
  btn(r2, '1回  ◆' + GACHA_COST_1, enchSave.crystals >= GACHA_COST_1 ? 'buy' : 'dim', () => gachaOpen(1));
  btn(r2, '10連  ◆' + GACHA_COST_10, enchSave.crystals >= GACHA_COST_10 ? 'buy' : 'dim', () => gachaOpen(10));
  c2.appendChild(r2);
  const hint = document.createElement('div');
  hint.className = 'jutsu-desc';
  hint.textContent = '10連は、レア以上が1つ確定。';
  c2.appendChild(hint);

  mk('#34D399', BOOK_ICON, '書をエンチャントする', '所持 ' + enchSave.books.reduce((s, b) => s + b.n, 0) + '冊',
    'ガチャで出た書は、「エンチャント付与」タブで剣に付けられる。');
  return;
  }

  // 所持している書
  const c3 = mk('#34D399', BOOK_ICON, '所持している書', enchSave.books.reduce((s, b) => s + b.n, 0) + '冊',
    '書を選んで、付与する剣を選ぶ。同じ種類は、高いレベルのほうが優先される。');
  const books = enchSave.books.map((b, i) => ({ b: b, i: i })).sort((p, q) => q.b.lv - p.b.lv);
  if (!books.length) {
    const none = document.createElement('div');
    none.className = 'jutsu-desc';
    none.textContent = 'まだ書がない。ガチャで手に入れよう。';
    c3.appendChild(none);
  }
  books.forEach(o => {
    const b = o.b, ed = enchDef(b.id), rc = RAR[Math.min(3, b.lv - 1)];
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:6px; margin-top:4px;';
    row.innerHTML =
      '<span class="ench-chip" style="background:' + rc.col + ';">' + rc.k + '</span>' +
      '<div style="flex:1; font-size:12px; font-weight:900;">' + ed.name + 'の書 Lv' + b.lv + ' ×' + b.n +
      '<div class="jutsu-desc" style="margin:0;">' + ed.text(ed.v[b.lv]) + '</div></div>';
    const bt = document.createElement('button');
    bt.className = 'jutsu-btn ' + (enchSel === o.i ? 'on' : 'buy');
    bt.style.flex = '0 0 70px';
    bt.textContent = enchSel === o.i ? '選択中' : '付与';
    bt.onclick = () => { enchSel = (enchSel === o.i) ? -1 : o.i; playSound('kick'); renderEnchGrid(true); };
    row.appendChild(bt);
    c3.appendChild(row);
    if (enchSel === o.i) {
      const list = document.createElement('div');
      list.style.cssText = 'display:flex; flex-wrap:wrap; gap:4px; margin:4px 0 2px 0;';
      SWORDS.filter(sw => unlockedSwords.includes(sw.id)).forEach(sw => {
        const cur = enchLv(sw.id, b.id);
        const sb = document.createElement('button');
        sb.className = 'jutsu-btn ' + (cur >= b.lv ? 'dim' : 'buy');
        sb.style.cssText = 'flex:0 0 auto; font-size:11px; padding:5px 8px;';
        sb.textContent = sw.name + (cur ? '（Lv' + cur + '）' : '');
        sb.onclick = () => enchApply(o.i, sw.id);
        list.appendChild(sb);
      });
      c3.appendChild(list);
    }
  });

  // 剣ごとの、付いているエンチャントの一覧
  const c4 = mk('#FACC15', BOOK_ICON, '剣のエンチャント', '', '付いているエンチャントの一覧。');
  SWORDS.filter(sw => unlockedSwords.includes(sw.id)).forEach(sw => {
    const have = ENCH.filter(e => enchLv(sw.id, e.id) > 0);
    const row = document.createElement('div');
    row.style.cssText = 'font-size:12px; font-weight:900; margin-top:4px;';
    row.innerHTML = sw.name + (sw.id === selectedSwordId ? '（装備中）' : '') + '<br>' +
      (have.length
        ? have.map(e => '<span class="ench-chip" style="background:' + e.col + ';">' + e.name + ' Lv' + enchLv(sw.id, e.id) + '</span>').join(' ')
        : '<span class="jutsu-desc">なし</span>');
    c4.appendChild(row);
  });
}

// ==========================================
// ガチャ演出（キャンバス）
//   溜め → ヒビ → 閃光 → 書が現れる → カードがめくれる（10連は10枚が順にめくれる）
// ==========================================
const GA = { on: false, t: 0, res: [], best: 0, raf: null, shake: 0, parts: [], stars: [], cracks: [], ev: {}, doneT: 300 };

const gachaScreen = document.createElement('div');
gachaScreen.id = 'gacha-screen';
gachaScreen.innerHTML =
  '<canvas id="gacha-canvas" width="420" height="720"></canvas>' +
  '<button id="gacha-skip" class="btn btn-back">スキップ</button>' +
  '<button id="gacha-ok" class="btn btn-story">OK</button>';
document.getElementById('game-wrapper').appendChild(gachaScreen);
const gCanvas = document.getElementById('gacha-canvas');
const gc = gCanvas.getContext('2d');
document.getElementById('gacha-skip').addEventListener('click', gachaSkip);
document.getElementById('gacha-ok').addEventListener('click', gachaClose);
gCanvas.addEventListener('pointerdown', gachaSkip);

function hsl2hex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const x = v => ('0' + Math.round(v * 255).toString(16)).slice(-2);
  return '#' + x(f(0)) + x(f(8)) + x(f(4));
}

function gachaRoll() {
  let x = Math.random() * 100, r = 0;
  for (; r < 4; r++) { if (x < RAR[r].w) break; x -= RAR[r].w; }
  r = Math.min(r, 3);
  return { r: r, id: ENCH[Math.floor(Math.random() * ENCH.length)].id, lv: r + 1 };
}

function gachaOpen(count) {
  const cost = count === 10 ? GACHA_COST_10 : GACHA_COST_1;
  if (enchSave.crystals < cost) { playSound('hit'); return; }
  enchSave.crystals -= cost;
  const res = [];
  for (let i = 0; i < count; i++) res.push(gachaRoll());
  if (count === 10 && !res.some(o => o.r >= 1)) {
    res[9] = { r: 1, id: ENCH[Math.floor(Math.random() * ENCH.length)].id, lv: 2 };
  }
  res.forEach(o => addBook(o.id, o.lv));
  saveEnch();

  GA.on = true;
  GA.t = 0;
  GA.res = res;
  GA.best = res.reduce((m, o) => Math.max(m, o.r), 0);
  GA.shake = 0;
  GA.parts = [];
  GA.ev = {};
  GA.doneT = count === 10 ? 350 : 310;
  GA.stars = [];
  for (let i = 0; i < 70; i++) GA.stars.push({ x: Math.random() * 420, y: Math.random() * 720, s: 0.6 + Math.random() * 1.8, ph: Math.random() * 6.28 });
  GA.cracks = [];
  for (let i = 0; i < 6; i++) GA.cracks.push({ a: i / 6 * Math.PI * 2 + Math.random() * 0.6, k: 0.6 + Math.random() * 0.5 });
  gachaScreen.style.display = 'block';
  document.getElementById('gacha-ok').style.display = 'none';
  document.getElementById('gacha-skip').style.display = 'flex';
  if (GA.raf) cancelAnimationFrame(GA.raf);
  GA.raf = requestAnimationFrame(gachaLoop);
}

function gachaSkip() {
  if (!GA.on || GA.t >= GA.doneT) return;
  GA.t = GA.doneT + 40;
  GA.ev.charge = GA.ev.burst = GA.ev.reveal = true;
  GA.parts = [];
}

function gachaClose() {
  GA.on = false;
  if (GA.raf) cancelAnimationFrame(GA.raf);
  GA.raf = null;
  gachaScreen.style.display = 'none';
  enchSel = -1;
  renderSkinGrid();
}

function gachaLoop() {
  if (!GA.on) return;
  GA.t++;
  gachaDraw();
  if (GA.t >= GA.doneT) {
    document.getElementById('gacha-ok').style.display = 'flex';
    document.getElementById('gacha-skip').style.display = 'none';
  }
  GA.raf = requestAnimationFrame(gachaLoop);
}

// ---------- 効果音 ----------
function gSfx(kind, r) {
  try {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const a = audioCtx, now = a.currentTime;
    const tone = (type, f0, f1, t0, dur, vol) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, now + t0);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, now + t0 + dur);
      g.gain.setValueAtTime(0.0001, now + t0);
      g.gain.exponentialRampToValueAtTime(vol, now + t0 + Math.min(0.05, dur / 3));
      g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
      o.connect(g); g.connect(a.destination);
      o.start(now + t0); o.stop(now + t0 + dur + 0.05);
    };
    if (kind === 'charge') {
      tone('sawtooth', 90, 900, 0, 2.8, 0.09);
      tone('sine', 180, 1800, 0, 2.8, 0.08);
    } else if (kind === 'burst') {
      const len = Math.floor(a.sampleRate * 0.6);
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const src = a.createBufferSource();
      src.buffer = buf;
      const lp = a.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 2400;
      const ng = a.createGain();
      ng.gain.value = 0.5;
      src.connect(lp); lp.connect(ng); ng.connect(a.destination);
      src.start(now);
      tone('sine', 160, 30, 0, 0.5, 0.4);
    } else if (kind === 'chime') {
      const notes = [[523.25, 659.25], [523.25, 659.25, 783.99], [523.25, 659.25, 783.99, 1046.5], [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568]][r || 0];
      notes.forEach((f, i) => {
        tone('triangle', f, f, i * 0.09, 0.9, 0.15);
        tone('sine', f * 2, f * 2, i * 0.09, 0.7, 0.06);
      });
    } else if (kind === 'flip') {
      tone('sine', 600 + (r || 0) * 220, 900 + (r || 0) * 300, 0, 0.12, 0.12);
    }
  } catch (e) {}
}

// ---------- 描画の部品 ----------
function gRR(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function gStar(c, x, y, r, fill, stroke) {
  c.beginPath();
  for (let k = 0; k < 10; k++) {
    const rr = k % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + k * Math.PI / 5;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
}

// 面の多い宝石
function gCrystal(c, x, y, s, col, glow) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineJoin = 'round';
  const A = [0, -1.35], B = [0.78, -0.5], C = [0.6, 0.9], D = [0, 1.4], E = [-0.6, 0.9], F = [-0.78, -0.5], P = [0, -0.35], Q = [0, 0.55];
  if (glow) { c.shadowColor = col; c.shadowBlur = glow; }
  const facet = (pts, f) => {
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.closePath();
    c.fillStyle = shade(col, f);
    c.fill();
  };
  facet([A, F, P], 0.15);
  facet([A, B, P], 0.55);
  facet([B, C, Q, P], 0.2);
  facet([F, P, Q, E], -0.2);
  facet([C, D, Q], -0.1);
  facet([E, D, Q], -0.45);
  c.shadowBlur = 0;
  c.strokeStyle = 'rgba(255,255,255,0.55)';
  c.lineWidth = 0.035;
  [[A, P], [B, P], [F, P], [P, Q], [B, Q], [F, Q], [C, Q], [E, Q], [D, Q]].forEach(l => {
    c.beginPath(); c.moveTo(l[0][0], l[0][1]); c.lineTo(l[1][0], l[1][1]); c.stroke();
  });
  c.strokeStyle = INK3;
  c.lineWidth = 0.09;
  c.beginPath();
  [A, B, C, D, E, F].forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.closePath();
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.8)';
  c.beginPath(); c.moveTo(-0.28, -0.9); c.lineTo(-0.08, -1.05); c.lineTo(-0.12, -0.7); c.closePath(); c.fill();
  c.restore();
}

// 魔法陣
function gMagic(c, x, y, r, rot, col, a) {
  c.save();
  c.translate(x, y);
  c.globalAlpha = a;
  c.strokeStyle = col;
  c.lineWidth = 2;
  c.shadowColor = col;
  c.shadowBlur = 12;
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
  c.setLineDash([6, 8]);
  c.beginPath(); c.arc(0, 0, r * 0.88, 0, Math.PI * 2); c.stroke();
  c.setLineDash([]);
  c.rotate(rot);
  for (let k = 0; k < 2; k++) {
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      const ang = k * Math.PI / 3 + i * Math.PI * 2 / 3 - Math.PI / 2;
      c.lineTo(Math.cos(ang) * r * 0.88, Math.sin(ang) * r * 0.88);
    }
    c.closePath();
    c.stroke();
  }
  for (let i = 0; i < 36; i++) {
    const ang = i * Math.PI / 18;
    c.beginPath();
    c.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
    c.lineTo(Math.cos(ang) * r * (i % 3 === 0 ? 1.09 : 1.04), Math.sin(ang) * r * (i % 3 === 0 ? 1.09 : 1.04));
    c.stroke();
  }
  c.rotate(-rot * 2);
  c.beginPath();
  for (let i = 0; i < 4; i++) {
    const ang = i * Math.PI / 2 + Math.PI / 4;
    c.lineTo(Math.cos(ang) * r * 0.5, Math.sin(ang) * r * 0.5);
  }
  c.closePath();
  c.stroke();
  c.beginPath(); c.arc(0, 0, r * 0.5, 0, Math.PI * 2); c.stroke();
  c.restore();
}

function gRays(c, x, y, n, len, rot, col, a) {
  c.save();
  c.translate(x, y);
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(0, 0, 10, 0, 0, len);
  g.addColorStop(0, hexToRgba(col, a));
  g.addColorStop(1, hexToRgba(col, 0));
  c.fillStyle = g;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const ang = rot + i * Math.PI * 2 / n;
    c.moveTo(0, 0);
    c.lineTo(Math.cos(ang - 0.05) * len, Math.sin(ang - 0.05) * len);
    c.lineTo(Math.cos(ang + 0.05) * len, Math.sin(ang + 0.05) * len);
    c.closePath();
  }
  c.fill();
  c.restore();
}

// 書の種類ごとの絵
function gIcon(c, id, x, y, s, col) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = INK3;
  c.lineWidth = 0.12;
  c.fillStyle = col;
  if (id === 'long') {
    c.beginPath(); c.moveTo(-0.55, -0.8); c.lineTo(0.55, -0.8); c.lineTo(0.08, 0); c.lineTo(0.55, 0.8); c.lineTo(-0.55, 0.8); c.lineTo(-0.08, 0); c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = '#FFFFFF';
    c.beginPath(); c.moveTo(-0.38, 0.72); c.lineTo(0.38, 0.72); c.lineTo(0, 0.32); c.closePath(); c.fill();
    c.fillStyle = '#FACC15';
    c.fillRect(-0.68, -0.92, 1.36, 0.14); c.strokeRect(-0.68, -0.92, 1.36, 0.14);
    c.fillRect(-0.68, 0.78, 1.36, 0.14); c.strokeRect(-0.68, 0.78, 1.36, 0.14);
  } else if (id === 'swift') {
    c.strokeStyle = INK3; c.lineWidth = 0.34;
    const w = (yy, len) => { c.beginPath(); c.moveTo(-0.8, yy); c.lineTo(len, yy); c.arc(len, yy - 0.2, 0.2, Math.PI / 2, -Math.PI * 0.9, true); c.stroke(); };
    w(-0.45, 0.4); w(0, 0.7); w(0.45, 0.3);
    c.strokeStyle = col; c.lineWidth = 0.2;
    w(-0.45, 0.4); w(0, 0.7); w(0.45, 0.3);
  } else if (id === 'crush') {
    c.beginPath();
    for (let k = 0; k < 16; k++) {
      const rr = k % 2 === 0 ? 0.95 : 0.45;
      const a = k * Math.PI / 8;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 0.1;
    c.beginPath(); c.moveTo(-0.3, -0.4); c.lineTo(0, -0.05); c.lineTo(-0.15, 0.25); c.lineTo(0.2, 0.5); c.stroke();
  } else if (id === 'gold') {
    c.beginPath(); c.arc(0, 0, 0.85, 0, Math.PI * 2); c.fill(); c.stroke();
    c.strokeStyle = '#B45309'; c.lineWidth = 0.1;
    c.beginPath(); c.arc(0, 0, 0.6, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#B45309';
    c.fillRect(-0.1, -0.4, 0.2, 0.8); c.fillRect(-0.4, -0.1, 0.8, 0.2);
  } else {
    // 烈風: 剣と、風の弧
    c.strokeStyle = INK3; c.lineWidth = 0.3;
    c.beginPath(); c.arc(0, 0, 0.7, -Math.PI * 0.9, Math.PI * 0.2); c.stroke();
    c.strokeStyle = col; c.lineWidth = 0.16;
    c.beginPath(); c.arc(0, 0, 0.7, -Math.PI * 0.9, Math.PI * 0.2); c.stroke();
    c.fillStyle = '#E2E8F0'; c.strokeStyle = INK3; c.lineWidth = 0.1;
    c.beginPath(); c.moveTo(-0.08, 0.7); c.lineTo(-0.08, -0.55); c.lineTo(0, -0.8); c.lineTo(0.08, -0.55); c.lineTo(0.08, 0.7); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#FACC15'; c.fillRect(-0.28, 0.55, 0.56, 0.1); c.strokeRect(-0.28, 0.55, 0.56, 0.1);
  }
  c.restore();
}

function gWrap(c, text, maxW) {
  const lines = [];
  let cur = '';
  for (const ch of text) {
    if (c.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch; } else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}

// 書（閉じた状態）
function gBook(c, x, y, s, sx, col) {
  c.save();
  c.translate(x, y);
  c.scale(s * Math.max(0.05, Math.abs(sx)), s);
  c.lineJoin = 'round';
  c.shadowColor = col;
  c.shadowBlur = 30;
  c.fillStyle = '#F8F1DC';
  gRR(c, -52, -78, 120, 160, 6);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = INK3; c.lineWidth = 3;
  c.stroke();
  const g = c.createLinearGradient(-60, -82, 60, 82);
  g.addColorStop(0, shade(col, 0.35));
  g.addColorStop(0.5, shade(col, -0.25));
  g.addColorStop(1, shade(col, -0.6));
  c.fillStyle = g;
  gRR(c, -60, -82, 120, 164, 8);
  c.fill();
  c.lineWidth = 4; c.strokeStyle = INK3;
  c.stroke();
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.fillRect(-60, -80, 16, 160);
  const gold = c.createLinearGradient(0, -70, 0, 70);
  gold.addColorStop(0, '#FEF08A'); gold.addColorStop(0.5, '#FACC15'); gold.addColorStop(1, '#B45309');
  c.strokeStyle = gold; c.lineWidth = 3;
  gRR(c, -38, -66, 88, 132, 5);
  c.stroke();
  c.fillStyle = gold;
  [[-38, -66, 1, 1], [50, -66, -1, 1], [-38, 66, 1, -1], [50, 66, -1, -1]].forEach(o => {
    c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(o[0] + o[2] * 16, o[1]); c.lineTo(o[0], o[1] + o[3] * 16); c.closePath(); c.fill();
  });
  gCrystal(c, 6, -4, 26, '#E9D5FF', 14);
  c.fillStyle = '#DC2626';
  c.fillRect(20, 80, 10, 22);
  c.strokeStyle = INK3; c.lineWidth = 2; c.strokeRect(20, 80, 10, 22);
  c.restore();
}

function gCardBack(c, w, h, t) {
  gRR(c, -w / 2, -h / 2, w, h, 16);
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, '#2E1065'); g.addColorStop(1, '#0F0A2A');
  c.fillStyle = g; c.fill();
  c.strokeStyle = '#A78BFA'; c.lineWidth = 6; c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 1.5;
  gRR(c, -w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 10); c.stroke();
  gMagic(c, 0, 0, 80, t * 0.02, '#C4B5FD', 0.9);
  gCrystal(c, 0, 0, 34, '#A78BFA', 18);
}

// 書のカード（flip 0 → 1 で、裏から表へめくれる）
function gCard(c, x, y, s, res, flip, tshow, mini, t) {
  const rc = RAR[res.r], ed = enchDef(res.id);
  const sxs = Math.abs(Math.cos(flip * Math.PI));
  const w = 230, h = 320;
  c.save();
  c.translate(x, y);
  c.scale(s * Math.max(0.02, sxs), s);
  c.lineJoin = 'round';
  if (flip < 0.5) {
    gCardBack(c, w, h, t);
    c.restore();
    return;
  }
  c.shadowColor = rc.col;
  c.shadowBlur = res.r >= 2 ? 36 : 18;
  gRR(c, -w / 2, -h / 2, w, h, 16);
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, shade(rc.col, -0.55)); g.addColorStop(0.5, '#14102E'); g.addColorStop(1, shade(rc.col, -0.7));
  c.fillStyle = g; c.fill();
  c.shadowBlur = 0;
  const bg = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  bg.addColorStop(0, shade(rc.col, 0.6)); bg.addColorStop(0.5, rc.col); bg.addColorStop(1, shade(rc.col, -0.2));
  c.lineWidth = 6; c.strokeStyle = bg; c.stroke();
  c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.35)';
  gRR(c, -w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 10); c.stroke();

  // レア度
  c.fillStyle = rc.col;
  gRR(c, -w / 2 + 16, -h / 2 + 16, 56, 24, 6); c.fill();
  c.strokeStyle = INK3; c.lineWidth = 2; c.stroke();
  c.textAlign = 'center';
  c.font = '900 17px "M PLUS Rounded 1c", sans-serif';
  c.fillStyle = res.r === 0 ? '#1E1E24' : '#FFFFFF';
  c.fillText(rc.k, -w / 2 + 44, -h / 2 + 34);
  c.font = '900 11px "M PLUS Rounded 1c", sans-serif';
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.fillText('ENCHANT BOOK', w / 2 - 62, -h / 2 + 33);

  // 絵
  const ig = c.createRadialGradient(0, -40, 6, 0, -40, 66);
  ig.addColorStop(0, hexToRgba(ed.col, 0.9)); ig.addColorStop(1, hexToRgba(ed.col, 0.05));
  c.fillStyle = ig;
  c.beginPath(); c.arc(0, -40, 66, 0, Math.PI * 2); c.fill();
  gMagic(c, 0, -40, 62, t * 0.02, '#FFFFFF', 0.55);
  gIcon(c, res.id, 0, -40, 40, ed.col);

  // 名前
  c.textAlign = 'center';
  c.font = '900 ' + (mini ? 30 : 27) + 'px "M PLUS Rounded 1c", sans-serif';
  c.lineWidth = 6; c.strokeStyle = INK3;
  c.strokeText(ed.name + 'の書', 0, 66);
  c.fillStyle = '#FFFFFF';
  c.fillText(ed.name + 'の書', 0, 66);

  // 星（レベル）
  const filled = Math.min(res.lv, Math.floor(Math.max(0, tshow) * (res.lv + 0.999)));
  for (let i = 0; i < 4; i++) {
    const on = i < filled;
    gStar(c, (i - 1.5) * 30, 96, 12, on ? rc.col : '#2A2547', on ? INK3 : '#4B4678');
  }
  if (!mini) {
    c.font = '900 15px "M PLUS Rounded 1c", sans-serif';
    c.fillStyle = rc.col;
    c.fillText('Lv.' + res.lv + '  ' + rc.name, 0, 128);
    c.font = '800 12px "M PLUS Rounded 1c", sans-serif';
    c.fillStyle = '#E2E8F0';
    gWrap(c, ed.text(ed.v[res.lv]), 186).slice(0, 3).forEach((ln, i) => c.fillText(ln, 0, 150 + i * 17));
  } else {
    c.font = '900 24px "M PLUS Rounded 1c", sans-serif';
    c.fillStyle = rc.col;
    c.fillText('Lv.' + res.lv, 0, 140);
  }

  // 光の筋
  c.save();
  gRR(c, -w / 2, -h / 2, w, h, 16);
  c.clip();
  const sh = ((t * 5) % 700) - 350;
  const sg = c.createLinearGradient(sh - 40, -h / 2, sh + 40, h / 2);
  sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.22)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sg;
  c.fillRect(-w / 2, -h / 2, w, h);
  c.restore();
  c.restore();
}

function gSpawn(kind, x, y, col, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 8;
    GA.parts.push({
      k: kind, x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'confetti' ? 3 : 0),
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, size: 3 + Math.random() * 6,
      col: col, life: 50 + Math.random() * 40
    });
  }
}

// ---------- 1コマの描画 ----------
function gachaDraw() {
  const c = gc, W = 420, H = 720, cx = 210, cy = 330;
  const t = GA.t, best = GA.best, single = GA.res.length === 1;
  const ease = v => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
  const clamp = v => Math.max(0, Math.min(1, v));
  const baseCol = t < 60 ? '#7DD3FC' : (best === 3 ? hsl2hex((t * 5) % 360, 95, 62) : RAR[best].col);

  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
  c.shadowBlur = 0;
  c.fillStyle = '#03030A';
  c.fillRect(0, 0, W, H);
  if (GA.shake > 0) {
    c.translate((Math.random() - 0.5) * GA.shake, (Math.random() - 0.5) * GA.shake);
    GA.shake *= 0.9;
    if (GA.shake < 0.5) GA.shake = 0;
  }

  // 背景
  const bg = c.createRadialGradient(cx, cy, 20, cx, cy, 520);
  bg.addColorStop(0, '#1B1440'); bg.addColorStop(1, '#03030A');
  c.fillStyle = bg;
  c.fillRect(-20, -20, W + 40, H + 40);
  const ga = clamp((t - 40) / 110) * 0.5 + (t > 175 ? 0.15 : 0);
  const tg = c.createRadialGradient(cx, cy, 10, cx, cy, 340);
  tg.addColorStop(0, hexToRgba(baseCol, ga)); tg.addColorStop(1, hexToRgba(baseCol, 0));
  c.fillStyle = tg;
  c.fillRect(-20, -20, W + 40, H + 40);
  GA.stars.forEach(s => {
    c.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.6 * Math.abs(Math.sin(t * 0.04 + s.ph))) + ')';
    c.fillRect(s.x, s.y, s.s, s.s);
  });

  // 効果音
  if (!GA.ev.charge) { GA.ev.charge = true; gSfx('charge'); }
  if (t >= 175 && !GA.ev.burst) {
    GA.ev.burst = true;
    gSfx('burst');
    GA.shake = 22;
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 10;
      GA.parts.push({
        k: 'shard', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.5, size: 5 + Math.random() * 9, col: i % 3 ? baseCol : '#FFFFFF', life: 70 + Math.random() * 40
      });
    }
  }
  if (t >= 185 && !GA.ev.reveal) {
    GA.ev.reveal = true;
    if (single) gSfx('chime', best);
  }

  // 溜め: 魔法陣と、中心へ吸い込まれる光
  if (t < 185) {
    const p = clamp(t / 150);
    gMagic(c, cx, cy, 70 + 85 * ease(p), t * 0.03, baseCol, 0.25 + 0.65 * p);
    gRays(c, cx, cy, 14, 160 + t, t * 0.02, baseCol, 0.18 + 0.4 * p);
    if (t < 160) {
      for (let i = 0; i < 2; i++) GA.parts.push({ k: 'in', ang: Math.random() * 6.28, rad: 240, col: baseCol, size: 2 + Math.random() * 3, life: 200 });
    }
  }

  // 粒
  for (let i = GA.parts.length - 1; i >= 0; i--) {
    const q = GA.parts[i];
    if (q.k === 'in') {
      q.ang += 0.07;
      q.rad -= 3.2 + (240 - q.rad) * 0.02;
      if (q.rad < 12) { GA.parts.splice(i, 1); continue; }
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = hexToRgba(q.col, 0.9);
      c.beginPath(); c.arc(cx + Math.cos(q.ang) * q.rad, cy + Math.sin(q.ang) * q.rad, q.size, 0, Math.PI * 2); c.fill();
      c.globalCompositeOperation = 'source-over';
      continue;
    }
    q.x += q.vx; q.y += q.vy;
    q.vy += q.k === 'confetti' ? 0.12 : 0.18;
    q.vx *= 0.99;
    q.rot += q.vr;
    q.life--;
    if (q.life <= 0) { GA.parts.splice(i, 1); continue; }
    c.save();
    c.translate(q.x, q.y);
    c.rotate(q.rot);
    c.globalAlpha = Math.min(1, q.life / 25);
    if (q.k === 'shard') {
      c.fillStyle = q.col;
      c.beginPath(); c.moveTo(0, -q.size); c.lineTo(q.size * 0.6, q.size * 0.7); c.lineTo(-q.size * 0.6, q.size * 0.7); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; c.stroke();
    } else {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = q.col;
      c.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2);
    }
    c.restore();
  }

  // 水晶（溜め〜ヒビ）
  if (t < 175) {
    const amp = Math.pow(t / 175, 2) * 7;
    const sx = (Math.random() - 0.5) * amp, sy = (Math.random() - 0.5) * amp;
    if (single) {
      const size = 40 + Math.sin(t * 0.12) * 3 + clamp(t / 175) * 14;
      c.save();
      c.translate(cx + sx, cy + sy);
      c.scale(0.86 + 0.14 * Math.cos(t * 0.05), 1);
      gCrystal(c, 0, 0, size, baseCol, 22 + t * 0.2);
      c.restore();
    } else {
      const merge = clamp((t - 100) / 40);
      for (let i = 0; i < 10; i++) {
        const ang = i * 0.628 + t * 0.06 * (1 + t / 60);
        const rad = 170 * (1 - ease(t / 110));
        gCrystal(c, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * 0.7, 15 * (1 - merge * 0.7), baseCol, 14);
      }
      if (t > 100) gCrystal(c, cx + sx, cy + sy, 24 + merge * 34, baseCol, 28 + t * 0.2);
    }
    if (t >= 150) {
      const kp = clamp((t - 150) / 25);
      c.strokeStyle = 'rgba(255,255,255,' + (0.6 + 0.4 * kp) + ')';
      c.lineWidth = 2.5;
      GA.cracks.forEach(k => {
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(k.a) * 70 * k.k * kp, cy + Math.sin(k.a) * 70 * k.k * kp);
        c.stroke();
      });
    }
  }

  // 閃光
  const fl = t < 165 ? 0 : (t < 175 ? (t - 165) / 10 : Math.max(0, 1 - (t - 175) / 28));
  if (fl > 0) {
    c.fillStyle = 'rgba(255,255,255,' + fl + ')';
    c.fillRect(-20, -20, W + 40, H + 40);
  }

  // 結果
  if (t >= 175) {
    const rv = t - 175;
    // 後ろの光
    if (best >= 1) gRays(c, cx, cy, best === 3 ? 24 : 16, 330, t * 0.012, baseCol, 0.12 + best * 0.07);
    if (best === 3 && t % 36 === 0) GA.parts.push({ k: 'shard', x: cx, y: cy, vx: 0, vy: 0, rot: 0, vr: 0, size: 0.1, col: '#FFFFFF', life: 1 });
    if (best >= 2 && t % 4 === 0 && t < GA.doneT + 200) gSpawn('confetti', cx + (Math.random() - 0.5) * 300, 60, best === 3 ? hsl2hex(Math.random() * 360, 90, 65) : baseCol, 1);
    if (best >= 2) {
      // 広がる衝撃波
      for (let k = 0; k < 2; k++) {
        const pp = ((rv + k * 40) % 80) / 80;
        c.strokeStyle = hexToRgba(baseCol, 0.5 * (1 - pp));
        c.lineWidth = 4 * (1 - pp) + 1;
        c.beginPath(); c.arc(cx, cy, 40 + pp * 300, 0, Math.PI * 2); c.stroke();
      }
    }

    if (single) {
      const res = GA.res[0];
      const rc = RAR[res.r];
      if (t >= 185 && t < 290) {
        const p = clamp((t - 185) / 65);
        const e = ease(p);
        const fade = t < 250 ? 1 : 1 - (t - 250) / 40;
        c.globalAlpha = Math.max(0, fade);
        gBook(c, cx, cy + 60 - 60 * e, 0.25 + 0.95 * e, Math.cos(p * Math.PI * 4), rc.col);
        c.globalAlpha = 1;
      }
      if (t >= 250) {
        const flip = clamp((t - 250) / 40);
        const pop = t > 290 ? 1 + 0.05 * Math.max(0, 1 - (t - 290) / 20) : 1;
        gCard(c, cx, cy + 10, 0.95 * pop, res, flip, (t - 290) / 30, false, t);
      }
      if (t >= 190) {
        const a = clamp((t - 190) / 20);
        c.globalAlpha = a;
        c.textAlign = 'center';
        c.font = '900 ' + (res.r === 3 ? 44 : 36) + 'px "M PLUS Rounded 1c", sans-serif';
        c.lineWidth = 8; c.strokeStyle = INK3; c.lineJoin = 'round';
        c.shadowColor = rc.col; c.shadowBlur = 24;
        const title = res.r === 3 ? '伝説！！' : (res.r === 2 ? 'スーパーレア！' : (res.r === 1 ? 'レア！' : 'ゲット！'));
        c.strokeText(title, cx, 108);
        c.fillStyle = res.r === 3 ? hsl2hex((t * 5) % 360, 95, 70) : rc.col === '#94A3B8' ? '#E2E8F0' : rc.col;
        c.fillText(title, cx, 108);
        c.shadowBlur = 0;
        c.globalAlpha = 1;
      }
    } else {
      // 10連: 10枚のカードが順にめくれる
      for (let i = 0; i < 10; i++) {
        const res = GA.res[i];
        const t0 = 195 + i * 14;
        if (t < t0 - 12) continue;
        const colI = i % 5, rowI = Math.floor(i / 5);
        const tx = cx + (colI - 2) * 82, ty = 270 + rowI * 124;
        const fly = ease((t - (t0 - 12)) / 14);
        const px = cx + (tx - cx) * fly, py = cy + (ty - cy) * fly;
        const flip = clamp((t - t0) / 18);
        if (t === t0) gSfx('flip', res.r);
        if (flip > 0.5 && flip < 0.6 && res.r >= 2) gSpawn('confetti', tx, ty, RAR[res.r].col, 2);
        gCard(c, px, py, 0.34, res, flip, 1, true, t);
        if (flip >= 1 && res.r >= 2) {
          c.strokeStyle = hexToRgba(RAR[res.r].col, 0.6 + 0.4 * Math.sin(t * 0.15));
          c.lineWidth = 3;
          gRR(c, px - 40, py - 55, 80, 110, 8);
          c.stroke();
        }
      }
      if (t >= 340 && !GA.ev.final) { GA.ev.final = true; gSfx('chime', best); }
      if (t >= 190) {
        c.globalAlpha = clamp((t - 190) / 20);
        c.textAlign = 'center';
        c.font = '900 34px "M PLUS Rounded 1c", sans-serif';
        c.lineWidth = 8; c.strokeStyle = INK3; c.lineJoin = 'round';
        c.shadowColor = RAR[best].col; c.shadowBlur = 20;
        c.strokeText('10連 結果', cx, 106);
        c.fillStyle = best === 3 ? hsl2hex((t * 5) % 360, 95, 70) : '#FFFFFF';
        c.fillText('10連 結果', cx, 106);
        c.shadowBlur = 0;
        c.globalAlpha = 1;
      }
      if (t >= 345) {
        const cnt = [0, 0, 0, 0];
        GA.res.forEach(o => cnt[o.r]++);
        c.textAlign = 'center';
        c.font = '900 14px "M PLUS Rounded 1c", sans-serif';
        c.fillStyle = '#E2E8F0';
        c.fillText(RAR.map((r, i) => r.k + ' ×' + cnt[i]).join('    '), cx, 540);
      }
    }
  }
}


/* SPLIT9 */
// ==========================================
// ENDLESS STORY THE FANTASY → 通常ステージ型
// ==========================================
if (storyProgress.fantasy == null) storyProgress.fantasy = 0;

const FAN_STAGES = [
  { name: 'はじまりの草原', region: '風の章', goal: 100, boss: '緑のスライム王',
    trivia: 'はじまりは、いつもやさしい。でも、やさしい場所ほど、忘れられやすい。',
    lines: ['* 草がゆれる。', '* ……だれかが、こちらを見ている。'] },
  { name: '風鳴りの丘', region: '風の章', goal: 105, boss: '風精霊エーロ',
    trivia: '風は言葉を運ぶ。きみの足音も、どこかへ届いている。',
    lines: ['* 風が名前を呼ぶ。', '* 「まだ、のぼれるのかい？」'] },
  { name: '露の森', region: '風の章', goal: 110, boss: '葉影の狩人',
    trivia: '葉の裏には影がある。影の裏には、また別の朝がある。',
    lines: ['* 葉が、きみの影を切る。'] },
  { name: '石の回廊', region: '土の章', goal: 115, boss: '石塊ゴーレム',
    trivia: '石は長く黙る。黙るほど、重くなる。',
    lines: ['* 石が動いた。', '* 石は、動かないと思っていた。'] },
  { name: '鏡の泉', region: '水の章', goal: 120, boss: '水面の鏡精',
    trivia: '鏡は真実を映さない。きみが信じたい顔だけを映す。',
    lines: ['* 水面に、きみではないきみがいる。'] },
  { name: '炎の峡谷', region: '火の章', goal: 125, boss: '炎牙の幼竜',
    trivia: '熱いものは、触れなくても距離を教える。',
    lines: ['* 息が熱い。', '* 逃げ道は、うえだけだ。'] },
  { name: '砂時計の砂漠', region: '時の章', goal: 130, boss: '時砂のファラオ',
    trivia: '砂漠では、時間が砂になる。砂では、時間が砂漠になる。',
    lines: ['* 砂が、過去を埋める。'] },
  { name: '月下の廃寺', region: '影の章', goal: 135, boss: '影法師',
    trivia: '廃れた場所ほど、記憶が残る。人がいないから。',
    lines: ['* ……こんにちは。', '* （返事はない）'] },
  { name: '星降る渓谷', region: '星の章', goal: 140, boss: '流星ウサギ',
    trivia: '星は落ちるたびに願いを一つ忘れる。だから、たくさん落ちる。',
    lines: ['* ぴょん、と光が跳ねた。'] },
  { name: '氷の鐘楼', region: '氷の章', goal: 145, boss: '氷鈴の魔女',
    trivia: '鐘は鳴ると温かい。鳴らない鐘は、ずっとつめたい。',
    lines: ['* 鈴がひとつ、鳴った。', '* きみの心も、少しふるえた。'] },
  { name: '雷鳴の塔', region: '雷の章', goal: 150, boss: '雷雲の雷鳥',
    trivia: '雷は一瞬で道を照らす。そのあとの闇は、いつもより深い。',
    lines: ['* 空が咳をした。'] },
  { name: '夢の図書館', region: '知の章', goal: 155, boss: '本の番人',
    trivia: '読めない本ほど、大切なことが書いてある気がする。',
    lines: ['* 「しずかに。」', '* 本が、先にしゃべった。'] },
  { name: '虹の橋', region: '色の章', goal: 160, boss: '虹鱗の大蛇',
    trivia: '虹のうえを歩くと、足元の色がきみの色になる。',
    lines: ['* 七色が、順番を間違えている。'] },
  { name: '忘却の迷宮', region: '迷の章', goal: 165, boss: '迷宮ミノタウロス',
    trivia: '迷うことは、進むことの別名だ。出口があるなら、なおさら。',
    lines: ['* 角が、角笛のように鳴る。'] },
  { name: '花咲く地下', region: '花の章', goal: 170, boss: '花冠の女王',
    trivia: '地下で咲く花は、太陽を知らない。それでも美しい。',
    lines: ['* 花が笑う。', '* 笑われたくなければ、踏みつけるな。'] },
  { name: '虚空の港', region: '空の章', goal: 175, boss: '虚船の船長',
    trivia: '港に船がないとき、港はただの縁になる。',
    lines: ['* 「切符は、いらない。」', '* 「帰る場所が、切符だ。」'] },
  { name: '時計塔の心臓', region: '時の章', goal: 180, boss: '歯車の番人',
    trivia: '時計は正しい時間を打たない。きみが合わせた時間を打つ。',
    lines: ['* カチ、カチ。', '* 心臓より正確だ。'] },
  { name: '影の玉座', region: '影の章', goal: 185, boss: '影の王',
    trivia: '玉座は人を待たない。影だけが、いつも先に座っている。',
    lines: ['* 「おれは、きみのうしろにいた。」'] },
  { name: '光の聖域', region: '光の章', goal: 190, boss: '光の騎士',
    trivia: '光は影を消さない。影の位置を変えるだけだ。',
    lines: ['* まぶしい。', '* でも、目を閉じるな。'] },
  { name: '混沌の坩堝', region: '混沌の章', goal: 195, boss: '混沌の錬金魔',
    trivia: '混ぜると新しいものができる。混ぜすぎると、何もわからなくなる。',
    lines: ['* ぐつぐつ。', '* きみも、材料の一つか？'] },
  { name: '終焉の門前', region: '終の章', goal: 200, boss: '終焉の門番',
    trivia: '門の前では、だれも平等だ。入るか、もどるか。',
    lines: ['* 「パスは？」', '* ……のぼってきたこと、そのものがパスだ。'] },
  { name: '天界の階段', region: '天の章', goal: 210, boss: '天階の守護者',
    trivia: '階段は終わりを約束しない。段がある限り、まだ先がある。',
    lines: ['* 一段、一段。', '* 空が、近づいてくる。'] },
  { name: '創世の間', region: '創の章', goal: 220, boss: '創世の語り手',
    trivia: 'はじまりの話は、いつも最後にわかる。',
    lines: ['* 「むかしむかし……」', '* 「——いま、ここだ。」'] },
  { name: '天上の玉座', region: '終章', goal: 240, boss: '天の手',
    trivia: '手は祈るためにも、払うためにも、開かれる。十二の形は、天のしるし。',
    lines: ['* ……手が、降りる。', '* 「よく、ここまで来た。」', '* 「では、十二の形で、試そう。」'] }
];
STORY_DATA.fantasy = FAN_STAGES;

const FAN_BOSS_META = [
  ['緑のスライム王', '#22C55E', '#86EFAC', '#BBF7D0', '#16A34A', 4],
  ['風精霊エーロ', '#38BDF8', '#7DD3FC', '#E0F2FE', '#0284C7', 4],
  ['葉影の狩人', '#65A30D', '#A3E635', '#D9F99D', '#4D7C0F', 5],
  ['石塊ゴーレム', '#78716C', '#A8A29E', '#D6D3D1', '#57534E', 5],
  ['水面の鏡精', '#06B6D4', '#67E8F9', '#CFFAFE', '#0891B2', 5],
  ['炎牙の幼竜', '#EF4444', '#FB923C', '#FDBA74', '#DC2626', 6],
  ['時砂のファラオ', '#D97706', '#FBBF24', '#FDE68A', '#B45309', 6],
  ['影法師', '#312E81', '#6366F1', '#A5B4FC', '#4338CA', 6],
  ['流星ウサギ', '#F472B6', '#F9A8D4', '#FCE7F3', '#DB2777', 6],
  ['氷鈴の魔女', '#0EA5E9', '#BAE6FD', '#FFFFFF', '#0284C7', 7],
  ['雷雲の雷鳥', '#FACC15', '#FDE047', '#FEF9C3', '#EAB308', 7],
  ['本の番人', '#92400E', '#D97706', '#FDE68A', '#78350F', 7],
  ['虹鱗の大蛇', '#A855F7', '#C084FC', '#E9D5FF', '#7C3AED', 7],
  ['迷宮ミノタウロス', '#B45309', '#F59E0B', '#FCD34D', '#92400E', 8],
  ['花冠の女王', '#EC4899', '#F9A8D4', '#FBCFE8', '#DB2777', 8],
  ['虚船の船長', '#334155', '#64748B', '#CBD5E1', '#1E293B', 8],
  ['歯車の番人', '#CA8A04', '#FACC15', '#FEF08A', '#A16207', 8],
  ['影の王', '#1E1B4B', '#4C1D95', '#A78BFA', '#312E81', 9],
  ['光の騎士', '#F8FAFC', '#FDE047', '#FEF9C3', '#EAB308', 9],
  ['混沌の錬金魔', '#BE185D', '#F472B6', '#FDE047', '#9D174D', 9],
  ['終焉の門番', '#7F1D1D', '#F87171', '#FECACA', '#991B1B', 10],
  ['天階の守護者', '#E0E7FF', '#A5B4FC', '#EEF2FF', '#6366F1', 10],
  ['創世の語り手', '#C026D3', '#E879F9', '#FAE8FF', '#A21CAF', 11],
  ['天の手', '#F6C9A1', '#FDE047', '#FEF9C3', '#FACC15', 14]
];
FAN_BOSS_META.forEach((m, i) => {
  const [name, body, orb, spread, beam, hp] = m;
  BOSS_THEMES[name] = mkTheme(body, orb, spread, beam);
  BOSS_HP_OVERRIDE[name] = hp;
  if (name !== FAN_BOSS && BOSS_ORDER.indexOf(name) < 0) BOSS_ORDER.push(name);
});

const FAN_MOVE_POOL = [
  [{ m: 'rainVolley', n: '雫弾', s: 'leaf' }, { m: 'hoverAim', n: 'ねらい弾', s: 'star' }, { m: 'wallDash', n: '壁走り', s: 'leaf' }],
  [{ m: 'curtain', n: '風の幕', s: 'feather' }, { m: 'homingPack', n: '追い風', s: 'feather' }, { m: 'windmill', n: '旋風', s: 'feather' }],
  [{ m: 'crossSlash', n: '葉斬り', s: 'leaf' }, { m: 'pincer', n: '挟み撃ち', s: 'leaf' }, { m: 'hoverAim', n: '影狙い', s: 'leaf' }],
  [{ m: 'gapWall', n: '岩壁', s: 'boulder' }, { m: 'rainVolley', n: '落石', s: 'boulder' }, { m: 'geyser', n: '岩噴き', s: 'boulder' }],
  [{ m: 'mineField', n: '鏡の罠', s: 'crystal' }, { m: 'burstShell', n: '反射弾', s: 'crystal' }, { m: 'boomerang', n: '水面返り', s: 'crystal' }],
  [{ m: 'wallDash', n: '炎牙', s: 'claw' }, { m: 'geyser', n: '火柱', s: 'meteor' }, { m: 'crossSlash', n: '竜爪', s: 'claw' }],
  [{ m: 'laneStrike', n: '時の光柱', s: 'crystal' }, { m: 'mineField', n: '砂時計', s: 'coin' }, { m: 'curtain', n: '砂の幕', s: 'coin' }],
  [{ m: 'homingPack', n: '影追い', s: 'skull' }, { m: 'pincer', n: '影挟み', s: 'skull' }, { m: 'hoverAim', n: '闇狙い', s: 'skull' }],
  [{ m: 'rainVolley', n: '流星雨', s: 'star' }, { m: 'windmill', n: '星の輪', s: 'star' }, { m: 'boomerang', n: '跳ね星', s: 'star' }],
  [{ m: 'curtain', n: '氷の幕', s: 'ice' }, { m: 'mineField', n: '凍て罠', s: 'ice' }, { m: 'burstShell', n: '氷鈴炸裂', s: 'ice' }],
  [{ m: 'laneStrike', n: '雷柱', s: 'bolt' }, { m: 'windmill', n: '雷輪', s: 'bolt' }, { m: 'rainVolley', n: '電撃雨', s: 'bolt' }],
  [{ m: 'mineField', n: '禁書の罠', s: 'halo' }, { m: 'hoverAim', n: 'ページ狙い', s: 'halo' }, { m: 'gapWall', n: '書架の壁', s: 'halo' }],
  [{ m: 'windmill', n: '虹渦', s: 'star' }, { m: 'pincer', n: '鱗挟み', s: 'star' }, { m: 'curtain', n: '七色幕', s: 'star' }],
  [{ m: 'gapWall', n: '迷宮壁', s: 'boulder' }, { m: 'wallDash', n: '突進角', s: 'spear' }, { m: 'crossSlash', n: '角払い', s: 'claw' }],
  [{ m: 'homingPack', n: '花びら', s: 'leaf' }, { m: 'burstShell', n: '花粉弾', s: 'leaf' }, { m: 'rainVolley', n: '花雨', s: 'leaf' }],
  [{ m: 'wallDash', n: '虚弾', s: 'skull' }, { m: 'boomerang', n: '錨返り', s: 'spear' }, { m: 'curtain', n: '霧の港', s: 'ice' }],
  [{ m: 'laneStrike', n: '歯車光線', s: 'bolt' }, { m: 'mineField', n: 'ネジ罠', s: 'coin' }, { m: 'geyser', n: 'ゼンマイ', s: 'meteor' }],
  [{ m: 'pincer', n: '影の王手', s: 'skull' }, { m: 'homingPack', n: '従僕', s: 'skull' }, { m: 'gapWall', n: '闇壁', s: 'skull' }],
  [{ m: 'laneStrike', n: '聖光', s: 'halo' }, { m: 'burstShell', n: '光輪', s: 'halo' }, { m: 'crossSlash', n: '聖剣', s: 'spear' }],
  [{ m: 'burstShell', n: '混沌爆', s: 'meteor' }, { m: 'windmill', n: '錬成輪', s: 'star' }, { m: 'rainVolley', n: '触媒雨', s: 'meteor' }],
  [{ m: 'gapWall', n: '門扉', s: 'boulder' }, { m: 'laneStrike', n: '終焉光', s: 'bolt' }, { m: 'pincer', n: '門挟み', s: 'spear' }],
  [{ m: 'homingPack', n: '天羽', s: 'feather' }, { m: 'curtain', n: '雲幕', s: 'halo' }, { m: 'windmill', n: '天輪', s: 'halo' }],
  [{ m: 'burstShell', n: '創世弾', s: 'star' }, { m: 'laneStrike', n: '語りの光', s: 'crystal' }, { m: 'geyser', n: '原初噴', s: 'meteor' }, { m: 'windmill', n: '物語の渦', s: 'star' }]
];
FAN_BOSS_META.forEach((m, i) => {
  const name = m[0];
  if (name === FAN_BOSS) return;
  BOSS_MOVES[name] = FAN_MOVE_POOL[i] || DEFAULT_MOVES;
});

const baseBossRank9 = bossRank;
bossRank = function (b) {
  if (!b) return 0;
  if (b.name === FAN_BOSS) return 16;
  const fi = FAN_BOSS_META.findIndex(m => m[0] === b.name);
  if (fi >= 0) return 8 + Math.floor(fi / 3);
  return baseBossRank9(b);
};

// ---------- 天の手: 十二形レーザー + 払い ----------
const ZODIAC = [
  { k: '子', n: '子・鼠形', pts: [[0, -1], [0.35, -0.2], [-0.35, -0.2], [0.2, 0.6], [-0.2, 0.6]] },
  { k: '丑', n: '丑・牛形', pts: [[-0.5, -0.7], [0.5, -0.7], [-0.6, 0.2], [0.6, 0.2], [0, 0.85]] },
  { k: '寅', n: '寅・虎形', pts: [[-0.7, -0.4], [0.7, -0.4], [-0.5, 0.5], [0.5, 0.5], [0, -0.9], [0, 0.9]] },
  { k: '卯', n: '卯・兎形', pts: [[-0.25, -1], [0.25, -1], [-0.45, 0.2], [0.45, 0.2], [0, 0.75]] },
  { k: '辰', n: '辰・竜形', pts: [[0, -1], [0.4, -0.4], [0.7, 0.2], [0.2, 0.7], [-0.5, 0.5], [-0.7, -0.2]] },
  { k: '巳', n: '巳・蛇形', pts: [[-0.6, -0.8], [-0.2, -0.3], [0.2, 0.1], [-0.1, 0.5], [0.5, 0.85]] },
  { k: '午', n: '午・馬形', pts: [[-0.3, -1], [0.3, -0.7], [0.5, 0.1], [0.2, 0.8], [-0.5, 0.5], [-0.4, -0.2]] },
  { k: '未', n: '未・羊形', pts: [[-0.55, -0.6], [0.55, -0.6], [-0.4, 0.3], [0.4, 0.3], [0, 0.9], [0, -0.95]] },
  { k: '申', n: '申・猿形', pts: [[-0.5, -0.5], [0.5, -0.5], [-0.7, 0.4], [0.7, 0.4], [0, 0], [0, 0.85]] },
  { k: '酉', n: '酉・鳥形', pts: [[0, -1], [-0.7, 0], [0.7, 0], [-0.35, 0.7], [0.35, 0.7]] },
  { k: '戌', n: '戌・犬形', pts: [[-0.4, -0.9], [0.5, -0.7], [0.6, 0.2], [0.1, 0.8], [-0.55, 0.35], [-0.2, -0.1]] },
  { k: '亥', n: '亥・猪形', pts: [[-0.7, -0.3], [0.7, -0.3], [-0.5, 0.6], [0.5, 0.6], [0, -0.85], [0, 0.9]] }
];

function fanZodiacLaser(b, cfg, r, px, py) {
  const z = ZODIAC[b._zod % ZODIAC.length];
  b._zod = (b._zod || 0) + 1;
  const cx = canvas.width / 2;
  const cy = Math.max(cameraY + 140, Math.min(cameraY + canvas.height - 180, py - 40));
  const sc = 90 + r * 2;
  bossCallouts.push({ text: z.n, col: '#FDE047', t: 0, total: 90 });
  playSound('laserWarn');
  z.pts.forEach((p, i) => {
    const x = cx + p[0] * sc;
    const y = cy + p[1] * sc;
    sigQueue(b, 28 + i * 7, () => {
      bossLasers.push({ x: x, startY: b.y + 40, timer: 48, fired: false, _zod: true });
      jfx.push({ type: 'ring', x: x, y: y, t: 0, total: 18, color: '#FDE047' });
    }, { kind: 'portal', x: x, y: y, dir: 0, col: '#FDE047' });
  });
  // 形の線をつなぐ弾
  sigQueue(b, 50, () => {
    for (let i = 0; i < z.pts.length; i++) {
      const a = z.pts[i], c2 = z.pts[(i + 1) % z.pts.length];
      const x1 = cx + a[0] * sc, y1 = cy + a[1] * sc;
      const x2 = cx + c2[0] * sc, y2 = cy + c2[1] * sc;
      const d = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
      v2Shot(b, cfg, x1, y1, (x2 - x1) / d * 3.2, (y2 - y1) / d * 3.2, { sz: 12, life: 90, sprite: 'crystal' });
    }
    playSound('laserFire');
  });
  return 50 + z.pts.length * 7 + 100;
}

function fanHandSweep(b, cfg, r, px, py) {
  const dir = px < canvas.width / 2 ? 1 : -1;
  const y = Math.max(cameraY + 120, Math.min(cameraY + canvas.height - 120, py));
  bossCallouts.push({ text: '天払い', col: '#FDBA74', t: 0, total: 80 });
  playSound('laserWarn');
  b._sweep = { t: 0, total: 70, dir: dir, y: y, hit: false };
  // 払いの予告線
  jfx.push({ type: 'banner', text: '払い', sub: dir > 0 ? '→' : '←', color: '#FDBA74', t: 0, total: 40 });
  sigQueue(b, 36, () => {
    const n = 6 + Math.floor(r / 4);
    for (let i = 0; i < n; i++) {
      const yy = y + (i - (n - 1) / 2) * 28;
      const x0 = dir > 0 ? LEFT_WALL_X + 18 : RIGHT_WALL_X - 18;
      v2Shot(b, cfg, x0, yy, dir * (5.2 + 0.04 * r), 0, { heavy: i === Math.floor(n / 2), sz: 18, life: 100, sprite: 'slash' });
    }
    shakeTime = Math.max(shakeTime, 10);
    playSound('arrow');
  }, { kind: 'diag', x: dir > 0 ? LEFT_WALL_X + 30 : RIGHT_WALL_X - 30, y: y, vx: dir, vy: 0, col: cfg.col });
  return 130;
}

function fanFingerPoke(b, cfg, r, px, py) {
  bossCallouts.push({ text: '指弾', col: cfg.col, t: 0, total: 70 });
  playSound('laserWarn');
  for (let i = 0; i < 3; i++) {
    sigQueue(b, 30 + i * 18, () => {
      const pc = playerCenter();
      const d = Math.max(1, Math.hypot(pc.x - b.x, pc.y - (b.y + 40)));
      v2Shot(b, cfg, b.x, b.y + 40, (pc.x - b.x) / d * 5.5, (pc.y - (b.y + 40)) / d * 5.5, { heavy: true, sz: 20, life: 160, sprite: 'crystal' });
      playSound('arrow');
    });
  }
  return 120;
}

BOSS_MOVES[FAN_BOSS] = [
  { m: 'zodiac', n: '十二形レーザー', s: 'crystal' },
  { m: 'sweep', n: '天払い', s: 'slash' },
  { m: 'poke', n: '指弾', s: 'crystal' },
  { m: 'zodiac', n: '十二形レーザー', s: 'crystal' },
  { m: 'laneStrike', n: '天罰の指', s: 'crystal' },
  { m: 'sweep', n: '天払い', s: 'slash' },
  { m: 'pincer', n: '掌挟み', s: 'star' },
  { m: 'curtain', n: '星幕', s: 'halo' }
];
BOSS_HP_OVERRIDE[FAN_BOSS] = 14;

const baseBossAttackV29 = bossAttackV2;
bossAttackV2 = function (b, px, py) {
  if (b && b.name === FAN_BOSS) {
    const moves = BOSS_MOVES[FAN_BOSS];
    b._mv = b._mv || 0;
    b._zod = b._zod || 0;
    const m = moves[b._mv % moves.length];
    b._mv++;
    const col = (BOSS_THEMES[FAN_BOSS] || DEFAULT_THEME).orb;
    const cfg = { s: m.s, n: m.n, col: col };
    let dur = 150;
    if (m.m === 'zodiac') dur = fanZodiacLaser(b, cfg, bossRank(b), px, py);
    else if (m.m === 'sweep') dur = fanHandSweep(b, cfg, bossRank(b), px, py);
    else if (m.m === 'poke') dur = fanFingerPoke(b, cfg, bossRank(b), px, py);
    else dur = MOVES[m.m](b, cfg, bossRank(b), px, py);
    b.shootTimer = Math.max(150, dur || 150);
    b._charge = 32;
    b._chargeCol = col;
    return;
  }
  baseBossAttackV29(b, px, py);
};

// ---------- Undertale風ダイアログ ----------
const utBox = { on: false, q: [], i: 0, t: 0, hold: false, skip: false };
const utEl = document.createElement('div');
utEl.id = 'ut-dialogue';
utEl.innerHTML = '<div class="ut-inner"><div id="ut-name"></div><div id="ut-text"></div><div id="ut-hint">Z / クリック</div></div>';
document.getElementById('game-wrapper').appendChild(utEl);
const utName = document.getElementById('ut-name');
const utText = document.getElementById('ut-text');

function utPush(lines, name) {
  if (!lines || !lines.length) return;
  utBox.q = lines.slice();
  utBox.i = 0;
  utBox.t = 0;
  utBox.on = true;
  utBox.hold = false;
  utBox.skip = false;
  utName.textContent = name || '';
  utEl.style.display = 'block';
  utAdvanceDraw();
}
function utAdvanceDraw() {
  if (!utBox.on) return;
  const line = utBox.q[utBox.i] || '';
  const n = utBox.skip ? line.length : Math.min(line.length, Math.floor(utBox.t / 2));
  utText.textContent = line.slice(0, n);
  utBox.hold = n >= line.length;
}
function utNext() {
  if (!utBox.on) return;
  const line = utBox.q[utBox.i] || '';
  if (!utBox.hold) { utBox.skip = true; utAdvanceDraw(); return; }
  utBox.i++;
  utBox.t = 0;
  utBox.skip = false;
  utBox.hold = false;
  if (utBox.i >= utBox.q.length) {
    utBox.on = false;
    utEl.style.display = 'none';
    return;
  }
  utAdvanceDraw();
}
function utTick() {
  if (!utBox.on) return;
  if (!utBox.hold && !utBox.skip) { utBox.t++; utAdvanceDraw(); }
}
utEl.addEventListener('pointerdown', e => { e.stopPropagation(); utNext(); });
window.addEventListener('keydown', e => {
  if (!utBox.on) return;
  // Space / ↑ / W は performKick / performSpinAttack 側で進める（二重送り防止）
  if (e.code === 'KeyZ' || e.code === 'Enter') {
    e.preventDefault();
    e.stopImmediatePropagation();
    utNext();
  }
}, true);

// ---------- ファンタジータブ: 通常ステージ一覧 ----------
fanTab.textContent = 'THE FANTASY (' + FAN_STAGES.length + ')';

renderFantasyList = function () {
  const listEl = document.getElementById('story-stage-list');
  listEl.innerHTML = '';
  const unlocked = storyProgress.fantasy || 0;
  const head = document.createElement('div');
  head.className = 'fan-story-head';
  head.innerHTML =
    '<div class="fan-story-title">ENDLESS STORY THE FANTASY</div>' +
    '<div class="fan-story-sub">いつもと同じ登り。ステージは ' + FAN_STAGES.length + '。各ステージに固有ボス。ラストは「天の手」。</div>';
  listEl.appendChild(head);
  FAN_STAGES.forEach((st, idx) => {
    const locked = idx > unlocked;
    const cleared = idx < unlocked;
    const item = document.createElement('button');
    item.className = 'story-item boss-stage' + (locked ? ' locked' : '') + (cleared ? ' cleared' : '') + (st.boss === FAN_BOSS ? ' fan-final' : '');
    item.innerHTML =
      '<div><span>' + (idx + 1) + '. ' + st.name + '</span>' +
      '<span class="story-badge boss">BOSS: ' + st.boss + '</span></div>' +
      '<span>' + (locked ? 'LOCKED' : (cleared ? 'CLEAR!' : st.goal + 'm')) + '</span>';
    if (!locked) item.onclick = () => startGame('story', 'fantasy', idx);
    listEl.appendChild(item);
  });
};

const baseBuildStoryConfig9 = buildStoryConfig;
buildStoryConfig = function (arc, idx) {
  if (arc === 'fantasy') {
    const info = STORY_DATA.fantasy[idx];
    const pal = FANTASY_AREAS[idx % FANTASY_AREAS.length];
    const pr = idx / Math.max(1, STORY_DATA.fantasy.length - 1);
    return {
      name: info.name,
      goalMeters: info.goal,
      isRecord: false,
      isStory: true,
      storyArc: 'fantasy',
      storyIndex: idx,
      storyInfo: info,
      spikeBandChance: Math.min(0.58, 0.30 + pr * 0.26),
      minSpikes: 3 + (pr > 0.5 ? 1 : 0),
      maxSpikes: 4 + (pr > 0.4 ? 1 : 0) + (pr > 0.75 ? 1 : 0),
      movingSpikeChance: Math.min(0.48, 0.12 + pr * 0.34),
      batChance: Math.min(0.70, 0.40 + pr * 0.28),
      birdInterval: Math.max(140, 250 - Math.floor(pr * 100)),
      archerChance: 0.28 + pr * 0.12,
      bgTop: pal.bgTop, bgBottom: pal.bgBottom,
      wallColor: pal.wallColor, wallLight: pal.wallLight, wallDark: pal.wallDark
    };
  }
  return baseBuildStoryConfig9(arc, idx);
};

const basePlayNextStory9 = playNextStoryStage;
playNextStoryStage = function () {
  if (currentStoryArc === 'fantasy') {
    if (currentStoryIndex + 1 < STORY_DATA.fantasy.length) {
      startGame('story', 'fantasy', currentStoryIndex + 1);
    } else {
      openStorySelect();
      switchStoryTab('fantasy');
    }
    return;
  }
  basePlayNextStory9();
};

const baseStartGame9 = startGame;
startGame = function (...args) {
  utBox.on = false;
  utEl.style.display = 'none';
  if (args[0] === 'fantasy') {
    // 旧エンドレス入口 → ステージ選択へ
    openStorySelect();
    switchStoryTab('fantasy');
    return;
  }
  baseStartGame9(...args);
  if (args[0] === 'story' && args[1] === 'fantasy') {
    lastSelectScreen = 'story';
    hudStage.textContent = (args[2] + 1) + '.' + STORY_DATA.fantasy[args[2]].name;
    hudStage.className = 'hud-box story-mode fantasy-mode';
    const info = STORY_DATA.fantasy[args[2]];
    const who = info.boss === FAN_BOSS ? FAN_BOSS : info.name;
    setTimeout(() => utPush(info.lines || ['* ……'], who), 40);
  }
};

// 天の手の描画は difficulty に依存せず、ボス名で判定
const baseDrawFn15 = draw;
draw = function () {
  if (paused) return;
  const handBoss = gameState === 'playing' && !!activeBoss && activeBoss.name === FAN_BOSS && activeBoss.hp > 0;
  let saved = 0;
  if (handBoss) { saved = activeBoss.hp; activeBoss.hp = 0; }
  baseDrawFn15();
  if (handBoss) { activeBoss.hp = saved; drawFanHand(); drawFanSweepFx(); }
  if (gameState === 'playing' && currentStoryArc === 'fantasy' && currentDifficulty === 'story') {
    drawFanStageFx();
  }
  utTick();
};

function drawFanSweepFx() {
  const b = activeBoss;
  if (!b || !b._sweep) return;
  const s = b._sweep;
  s.t++;
  const p = s.t / s.total;
  if (p >= 1) { b._sweep = null; return; }
  const sy = s.y - cameraY;
  const x = s.dir > 0 ? LEFT_WALL_X + p * (RIGHT_WALL_X - LEFT_WALL_X) : RIGHT_WALL_X - p * (RIGHT_WALL_X - LEFT_WALL_X);
  ctx.save();
  ctx.globalAlpha = 0.55 * (1 - Math.abs(p - 0.5) * 1.2);
  ctx.fillStyle = '#FDBA74';
  ctx.fillRect(0, sy - 22, canvas.width, 44);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(canvas.width, sy); ctx.stroke();
  ctx.translate(x, sy);
  ctx.rotate(s.dir * 0.35);
  drawGiantHandFront(ctx, 0, 0, 0.35, 0.55);
  ctx.restore();
  // 接触ダメージ（1回）
  if (!s.hit && Math.abs((player.y + player.size / 2) - s.y) < 28) {
    const px = player.x + player.size / 2;
    if ((s.dir > 0 && px < x + 40) || (s.dir < 0 && px > x - 40)) {
      if (s.t > 30 && s.t < 55) {
        s.hit = true;
        // 既存の被弾処理に乗せるため、小さな弾を一瞬出す
        projectiles.push({
          type: 'bossOrb', x: px, y: s.y, vx: 0, vy: 0, radius: 20, sz: 20,
          reflected: false, life: 2, sprite: 'slash', scol: '#FDBA74'
        });
      }
    }
  }
}

// 軽い背景装飾（ラグ回避のため点数固定・計算軽め）
function drawFanStageFx() {
  const idx = currentStoryIndex || 0;
  const n = 12;
  ctx.save();
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < n; i++) {
    const x = ((i * 97 + idx * 13) % (RIGHT_WALL_X - LEFT_WALL_X - 20)) + LEFT_WALL_X + 10;
    const y = ((i * 53 + Math.floor(cameraY * 0.08)) % (canvas.height + 40)) - 20;
    ctx.fillStyle = i % 2 ? '#FFFFFF' : '#FDE047';
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

// 台詞中は物理更新・操作を止める（Undertale風）。描画ループは続く。
const baseUpdateFn11 = update;
update = function () {
  if (utBox.on && gameState === 'playing') {
    utTick();
    return;
  }
  baseUpdateFn11();
};
const basePerformKick9 = performKick;
performKick = function () {
  if (utBox.on) { utNext(); return; }
  basePerformKick9();
};
const basePerformSpinAttack9 = performSpinAttack;
performSpinAttack = function () {
  if (utBox.on) { utNext(); return; }
  basePerformSpinAttack9();
};

// クリア時の豆知識ヘッダをファンタジー向けに
const baseShowResult9 = showResult;
showResult = function (isClear) {
  // 旧エンドレス fantasy のボス撃破横取りは不要（ストーリー型のため）
  baseShowResult9(isClear);
  if (currentDifficulty === 'story' && currentStoryArc === 'fantasy' && isClear) {
    const info = STORY_DATA.fantasy[currentStoryIndex];
    document.getElementById('trivia-header').textContent = '[エピソード] ' + info.name;
    document.getElementById('trivia-body').textContent = info.trivia;
  }
};

// タイトルの話数表示を更新
(function () {
  const tag = document.querySelector('.btn-story .stage-tag');
  if (!tag) return;
  const refresh = () => {
    let n = 0;
    ['japan', 'world', 'space'].forEach(a => { n += (STORY_DATA[a] || []).length; });
    if (fantasyUnlocked) n += FAN_STAGES.length;
    tag.textContent = '全' + n + '話';
  };
  refresh();
  const baseEx = exFantasyRefresh;
  exFantasyRefresh = function () {
    baseEx();
    refresh();
  };
})();

// ==========================================
// ガチャ演出: 構造はそのまま、AIっぽさを抑える
//   （虹色HSL・魔法陣・過剰グロー・星空スパムを削減）
// ==========================================
gMagic = function (c, x, y, r, rot, col, a) {
  // 簡素な二重円＋十字（魔法陣っぽさを弱める）
  c.save();
  c.translate(x, y);
  c.globalAlpha = a * 0.7;
  c.strokeStyle = col;
  c.lineWidth = 2;
  c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(0, 0, r * 0.72, 0, Math.PI * 2); c.stroke();
  c.rotate(rot * 0.3);
  c.beginPath(); c.moveTo(-r * 0.55, 0); c.lineTo(r * 0.55, 0); c.stroke();
  c.beginPath(); c.moveTo(0, -r * 0.55); c.lineTo(0, r * 0.55); c.stroke();
  c.restore();
};
gRays = function (c, x, y, n, len, rot, col, a) {
  // 控えめな放射（本数を減らす）
  c.save();
  c.translate(x, y);
  c.strokeStyle = hexToRgba(col, a * 0.45);
  c.lineWidth = 2;
  const nn = Math.min(n, 8);
  for (let i = 0; i < nn; i++) {
    const ang = rot + i * Math.PI * 2 / nn;
    c.beginPath();
    c.moveTo(Math.cos(ang) * 20, Math.sin(ang) * 20);
    c.lineTo(Math.cos(ang) * len * 0.7, Math.sin(ang) * len * 0.7);
    c.stroke();
  }
  c.restore();
};

gachaOpen = (function (base) {
  return function (count) {
    base(count);
    // 星を減らす / ヒビは残す
    GA.stars = GA.stars.slice(0, 18);
  };
})(gachaOpen);

gachaDraw = function () {
  const c = gc, W = 420, H = 720, cx = 210, cy = 330;
  const t = GA.t, best = GA.best, single = GA.res.length === 1;
  const ease = v => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
  const clamp = v => Math.max(0, Math.min(1, v));
  // 固定パレット（虹色サイクル禁止）
  const baseCol = t < 60 ? '#64748B' : RAR[best].col;

  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
  c.shadowBlur = 0;

  // 紙っぽい地（深紫の虚空をやめる）
  c.fillStyle = '#1A1520';
  c.fillRect(0, 0, W, H);
  const paper = c.createLinearGradient(0, 0, 0, H);
  paper.addColorStop(0, '#2A2433');
  paper.addColorStop(0.45, '#1E1830');
  paper.addColorStop(1, '#14101C');
  c.fillStyle = paper;
  c.fillRect(0, 0, W, H);

  // ごく薄いドット（星空スパムの代替）
  c.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < GA.stars.length; i++) {
    const s = GA.stars[i];
    if ((t + i) % 19 < 14) c.fillRect(s.x | 0, s.y | 0, 2, 2);
  }

  if (GA.shake > 0) {
    c.translate((Math.random() - 0.5) * GA.shake, (Math.random() - 0.5) * GA.shake);
    GA.shake *= 0.88;
    if (GA.shake < 0.5) GA.shake = 0;
  }

  if (!GA.ev.charge) { GA.ev.charge = true; gSfx('charge'); }
  if (t >= 175 && !GA.ev.burst) {
    GA.ev.burst = true;
    gSfx('burst');
    GA.shake = 14;
    for (let i = 0; i < 28; i++) {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 7;
      GA.parts.push({
        k: 'shard', x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.35, size: 4 + Math.random() * 6, col: i % 2 ? baseCol : '#F8F1DC', life: 50 + Math.random() * 30
      });
    }
  }
  if (t >= 185 && !GA.ev.reveal) {
    GA.ev.reveal = true;
    if (single) gSfx('chime', best);
  }

  // 溜め: シンプルな円と吸い込み粒
  if (t < 185) {
    const p = clamp(t / 150);
    gMagic(c, cx, cy, 60 + 70 * ease(p), t * 0.02, baseCol, 0.2 + 0.5 * p);
    if (t < 160 && t % 3 === 0) {
      GA.parts.push({ k: 'in', ang: (t * 0.2) % 6.28, rad: 200, col: baseCol, size: 2.5, life: 180 });
    }
    // インク枠
    c.strokeStyle = 'rgba(248,241,220,0.25)';
    c.lineWidth = 3;
    c.strokeRect(18, 18, W - 36, H - 36);
  }

  for (let i = GA.parts.length - 1; i >= 0; i--) {
    const q = GA.parts[i];
    if (q.k === 'in') {
      q.ang += 0.05;
      q.rad -= 3.5;
      if (q.rad < 14) { GA.parts.splice(i, 1); continue; }
      c.fillStyle = hexToRgba(q.col, 0.85);
      c.fillRect((cx + Math.cos(q.ang) * q.rad) | 0, (cy + Math.sin(q.ang) * q.rad) | 0, 3, 3);
      continue;
    }
    q.x += q.vx; q.y += q.vy;
    q.vy += q.k === 'confetti' ? 0.1 : 0.16;
    q.vx *= 0.99;
    q.rot += q.vr;
    q.life--;
    if (q.life <= 0) { GA.parts.splice(i, 1); continue; }
    c.save();
    c.translate(q.x, q.y);
    c.rotate(q.rot);
    c.globalAlpha = Math.min(1, q.life / 22);
    c.fillStyle = q.col;
    if (q.k === 'shard') {
      c.beginPath(); c.moveTo(0, -q.size); c.lineTo(q.size * 0.55, q.size * 0.65); c.lineTo(-q.size * 0.55, q.size * 0.65); c.closePath(); c.fill();
      c.strokeStyle = '#1E1E24'; c.lineWidth = 1.2; c.stroke();
    } else {
      c.fillRect(-q.size / 2, -q.size / 4, q.size, q.size / 2);
    }
    c.restore();
  }

  // 水晶
  if (t < 175) {
    const amp = Math.pow(t / 175, 2) * 5;
    const sx = (Math.random() - 0.5) * amp, sy = (Math.random() - 0.5) * amp;
    if (single) {
      gCrystal(c, cx + sx, cy + sy, 42 + clamp(t / 175) * 12, baseCol, 8);
    } else {
      const merge = clamp((t - 100) / 40);
      for (let i = 0; i < 10; i++) {
        const ang = i * 0.628 + t * 0.04;
        const rad = 150 * (1 - ease(t / 110));
        gCrystal(c, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * 0.7, 12 * (1 - merge * 0.6), baseCol, 4);
      }
      if (t > 100) gCrystal(c, cx + sx, cy + sy, 22 + merge * 28, baseCol, 10);
    }
    if (t >= 150) {
      const kp = clamp((t - 150) / 25);
      c.strokeStyle = 'rgba(248,241,220,' + (0.5 + 0.4 * kp) + ')';
      c.lineWidth = 2;
      GA.cracks.forEach(k => {
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(k.a) * 64 * k.k * kp, cy + Math.sin(k.a) * 64 * k.k * kp);
        c.stroke();
      });
    }
  }

  const fl = t < 165 ? 0 : (t < 175 ? (t - 165) / 10 : Math.max(0, 1 - (t - 175) / 24));
  if (fl > 0) {
    c.fillStyle = 'rgba(248,241,220,' + (fl * 0.85) + ')';
    c.fillRect(0, 0, W, H);
  }

  if (t >= 175) {
    const rv = t - 175;
    if (best >= 2) gRays(c, cx, cy, 6, 260, t * 0.01, baseCol, 0.15 + best * 0.04);
    if (best >= 2 && t % 8 === 0 && t < GA.doneT + 120) {
      gSpawn('confetti', cx + (Math.random() - 0.5) * 220, 80, baseCol, 1);
    }
    if (best >= 2) {
      const pp = (rv % 70) / 70;
      c.strokeStyle = hexToRgba(baseCol, 0.35 * (1 - pp));
      c.lineWidth = 3 * (1 - pp) + 1;
      c.beginPath(); c.arc(cx, cy, 36 + pp * 220, 0, Math.PI * 2); c.stroke();
    }

    if (single) {
      const res = GA.res[0];
      const rc = RAR[res.r];
      if (t >= 185 && t < 290) {
        const p = clamp((t - 185) / 65);
        const e = ease(p);
        const fade = t < 250 ? 1 : 1 - (t - 250) / 40;
        c.globalAlpha = Math.max(0, fade);
        gBook(c, cx, cy + 60 - 60 * e, 0.25 + 0.95 * e, Math.cos(p * Math.PI * 4), rc.col);
        c.globalAlpha = 1;
      }
      if (t >= 250) {
        const flip = clamp((t - 250) / 40);
        const pop = t > 290 ? 1 + 0.04 * Math.max(0, 1 - (t - 290) / 20) : 1;
        gCard(c, cx, cy + 10, 0.95 * pop, res, flip, (t - 290) / 30, false, t);
      }
      if (t >= 190) {
        const a = clamp((t - 190) / 20);
        c.globalAlpha = a;
        c.textAlign = 'center';
        c.font = '900 ' + (res.r === 3 ? 40 : 32) + 'px "M PLUS Rounded 1c", sans-serif';
        c.lineWidth = 7; c.strokeStyle = '#1E1E24'; c.lineJoin = 'round';
        const title = res.r === 3 ? '伝説！' : (res.r === 2 ? 'スーパーレア！' : (res.r === 1 ? 'レア！' : 'ゲット！'));
        c.strokeText(title, cx, 108);
        c.fillStyle = res.r === 0 ? '#E2E8F0' : rc.col;
        c.fillText(title, cx, 108);
        c.globalAlpha = 1;
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const res = GA.res[i];
        const t0 = 195 + i * 14;
        if (t < t0 - 12) continue;
        const colI = i % 5, rowI = Math.floor(i / 5);
        const tx = cx + (colI - 2) * 82, ty = 270 + rowI * 124;
        const fly = ease((t - (t0 - 12)) / 14);
        const px = cx + (tx - cx) * fly, py = cy + (ty - cy) * fly;
        const flip = clamp((t - t0) / 18);
        if (t === t0) gSfx('flip', res.r);
        if (flip > 0.5 && flip < 0.6 && res.r >= 2) gSpawn('confetti', tx, ty, RAR[res.r].col, 1);
        gCard(c, px, py, 0.34, res, flip, 1, true, t);
        if (flip >= 1 && res.r >= 2) {
          c.strokeStyle = hexToRgba(RAR[res.r].col, 0.55);
          c.lineWidth = 2.5;
          gRR(c, px - 40, py - 55, 80, 110, 8);
          c.stroke();
        }
      }
      if (t >= 340 && !GA.ev.final) { GA.ev.final = true; gSfx('chime', best); }
      if (t >= 190) {
        c.globalAlpha = clamp((t - 190) / 20);
        c.textAlign = 'center';
        c.font = '900 30px "M PLUS Rounded 1c", sans-serif';
        c.lineWidth = 7; c.strokeStyle = '#1E1E24';
        c.strokeText('10連 結果', cx, 106);
        c.fillStyle = '#F8F1DC';
        c.fillText('10連 結果', cx, 106);
        c.globalAlpha = 1;
      }
      if (t >= 345) {
        const cnt = [0, 0, 0, 0];
        GA.res.forEach(o => cnt[o.r]++);
        c.textAlign = 'center';
        c.font = '900 13px "M PLUS Rounded 1c", sans-serif';
        c.fillStyle = '#CBD5E1';
        c.fillText(RAR.map((r, i) => r.k + ' ×' + cnt[i]).join('    '), cx, 540);
      }
    }
  }
};

// カード裏面も落ち着いた色に
gCardBack = function (c, w, h, t) {
  gRR(c, -w / 2, -h / 2, w, h, 12);
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, '#2A2433'); g.addColorStop(1, '#14101C');
  c.fillStyle = g; c.fill();
  c.strokeStyle = '#F8F1DC'; c.lineWidth = 4; c.stroke();
  c.strokeStyle = 'rgba(248,241,220,0.35)'; c.lineWidth = 1.5;
  gRR(c, -w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 8); c.stroke();
  gMagic(c, 0, 0, 70, t * 0.015, '#C4B5FD', 0.55);
  gCrystal(c, 0, 0, 28, '#A78BFA', 6);
};

// ==========================================
// グラフィック強化（軽量・CSS中心）
// ==========================================
document.body.classList.add('gfx-boost');

// ストーリー選択のファンタジー最終ステージ強調は CSS
// ボス戦開始時、ファンタジーなら短い衝撃
const baseInitBoss9 = initBoss;
initBoss = function (bossName, goalPixelY) {
  baseInitBoss9(bossName, goalPixelY);
  if (currentStoryArc === 'fantasy' && activeBoss) {
    activeBoss._zod = Math.floor(Math.random() * 12);
    if (bossName === FAN_BOSS) {
      jfx.push({ type: 'banner', text: '天の手', sub: 'FINAL BOSS', color: '#FDE047', t: 0, total: 70 });
      shakeTime = Math.max(shakeTime, 8);
    }
  }
};


/* SPLIT10 */
// ==========================================
// ENDLESS STORY: ループ + 隠れた出口
// ==========================================
const FAN_EXIT_STAGE = 15;   // 虚空の港（0始まり）
const FAN_EXIT_KEY = 'wallKickFantasyLoop';
let fanLoop = 0;
let fanEscaped = false;
try {
  const raw = JSON.parse(localStorage.getItem(FAN_EXIT_KEY) || 'null');
  if (raw && typeof raw === 'object') {
    fanLoop = raw.loop | 0;
    fanEscaped = !!raw.escaped;
  }
} catch (e) {}
function saveFanLoop() {
  try { localStorage.setItem(FAN_EXIT_KEY, JSON.stringify({ loop: fanLoop, escaped: fanEscaped })); } catch (e) {}
}

let fanExit = null;          // { x, y, w, h, side }
let fanExitTaken = false;
let fanExitFx = 0;

function fanIsFantasy() {
  return currentDifficulty === 'story' && currentStoryArc === 'fantasy';
}

function spawnFanExit() {
  fanExit = null;
  fanExitTaken = false;
  fanExitFx = 0;
  if (!fanIsFantasy()) return;
  if (currentStoryIndex !== FAN_EXIT_STAGE) return;
  // ゴールとボス帯のあいだ、登りの途中にドアを置く（見逃しやすい位置）
  const goal = STORY_DATA.fantasy[FAN_EXIT_STAGE].goal;
  const midM = Math.floor(goal * 0.42);
  const y = 580 - midM * PIXELS_PER_METER;
  const side = 'right';
  const w = 22, h = 36;
  fanExit = {
    x: RIGHT_WALL_X - w - 2,
    y: y - h / 2,
    w: w, h: h, side: side
  };
}

function drawFanExit() {
  if (!fanExit || fanExitTaken) return;
  const e = fanExit;
  const sy = e.y - cameraY;
  if (sy < -60 || sy > canvas.height + 60) return;
  const t = Date.now() * 0.004;
  ctx.save();
  ctx.lineJoin = 'round';
  // 壁に沈んだ暗い扉（目立たせすぎない）
  ctx.fillStyle = '#0B0A12';
  ctx.strokeStyle = '#1E1E24';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(e.x, e.y + e.h);
  ctx.lineTo(e.x, e.y + 8);
  ctx.quadraticCurveTo(e.x + e.w / 2, e.y - 4, e.x + e.w, e.y + 8);
  ctx.lineTo(e.x + e.w, e.y + e.h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // うっすら光る枠
  ctx.strokeStyle = 'rgba(253,224,71,' + (0.25 + 0.2 * Math.sin(t)) + ')';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // ドアノブ
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(e.x + 6, e.y + e.h * 0.55, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // 足元にごく薄い印
  ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 1.7);
  ctx.fillStyle = '#F8F1DC';
  ctx.font = '900 9px "M PLUS Rounded 1c", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('出口', e.x + e.w / 2, e.y + e.h + 12);
  ctx.restore();
}

function touchFanExit() {
  if (!fanExit || fanExitTaken || !fanIsFantasy() || gameState !== 'playing') return false;
  if (utBox.on) return false;
  const e = fanExit;
  const px1 = player.x + 4, py1 = player.y + 4;
  const px2 = player.x + player.size - 4, py2 = player.y + player.size - 4;
  const hit = px1 < e.x + e.w && px2 > e.x && py1 < e.y + e.h && py2 > e.y;
  return hit;
}

function takeFanExit() {
  if (fanExitTaken) return;
  fanExitTaken = true;
  fanEscaped = true;
  saveFanLoop();
  playSound('clear');
  spawnParticles(fanExit.x + fanExit.w / 2, fanExit.y + fanExit.h / 2, '#FDE047', 24, false);
  jfx.push({ type: 'flash', t: 0, total: 18, color: '255,255,220' });
  jfx.push({ type: 'ring', x: fanExit.x + fanExit.w / 2, y: fanExit.y + fanExit.h / 2, t: 0, total: 28, color: '#FDE047' });
  utPush([
    '* ……扉が、あいた。',
    '* 終わりのない話から、一歩だけ外へ。',
    '* （ENDLESS STORY を抜けた）'
  ], '出口');
  // 台詞のあとで結果画面へ（脱出クリア）
  const wait = setInterval(() => {
    if (utBox.on) return;
    clearInterval(wait);
    if (gameState !== 'playing') return;
    // クリア扱いで進捗は維持。特別な結果表示
    maxAltitude = STAGES.story ? STAGES.story.goalMeters : maxAltitude;
    showResult(true);
    const titleEl = document.getElementById('result-title');
    const badgeEl = document.getElementById('result-badge');
    const triviaBox = document.getElementById('result-trivia-box');
    const btnNext = document.getElementById('btn-next-story');
    badgeEl.textContent = 'EXIT FOUND';
    badgeEl.style.background = '#FDE047';
    badgeEl.style.color = '#1E1E24';
    titleEl.textContent = '出口を見つけた';
    titleEl.style.color = '#CA8A04';
    triviaBox.classList.remove('hidden');
    document.getElementById('trivia-header').textContent = '[エピソード] 出口';
    document.getElementById('trivia-body').textContent =
      'ループする物語にも、出口はある。虚空の港の壁に、小さな扉がひそんでいた。LOOP ' + fanLoop + ' で見つけた。';
    btnNext.classList.add('hidden');
  }, 120);
}

// ---------- リスト表示：ループ説明 ----------
const baseRenderFantasyList10 = renderFantasyList;
renderFantasyList = function () {
  baseRenderFantasyList10();
  const listEl = document.getElementById('story-stage-list');
  const head = listEl.querySelector('.fan-story-sub');
  if (head) {
    head.innerHTML =
      'クリアすると次へ。天の手のあと、はじまりへ<strong>ループ</strong>する。<br>' +
      'どこかのステージの、どこかに<strong>出口</strong>がある。' +
      (fanLoop > 0 ? '<br>現在 LOOP ' + fanLoop + (fanEscaped ? ' ／ 出口発見済' : '') : '');
  }
  // 出口ステージにさりげない印（ループ後だけ少しヒント）
  if (fanLoop > 0) {
    const items = listEl.querySelectorAll('.story-item');
    if (items[FAN_EXIT_STAGE] && !items[FAN_EXIT_STAGE].classList.contains('locked')) {
      const badge = document.createElement('span');
      badge.className = 'story-badge';
      badge.style.cssText = 'background:#1E1E24;color:#FDE047;margin-left:4px;';
      badge.textContent = fanEscaped ? '出口' : '？';
      const left = items[FAN_EXIT_STAGE].querySelector('div');
      if (left) left.appendChild(badge);
    }
  }
};

// ---------- ループ進行 ----------
const basePlayNextStory10 = playNextStoryStage;
playNextStoryStage = function () {
  if (currentStoryArc === 'fantasy') {
    if (currentStoryIndex + 1 < STORY_DATA.fantasy.length) {
      startGame('story', 'fantasy', currentStoryIndex + 1);
    } else {
      // 天の手のあと → はじまりへループ
      fanLoop++;
      saveFanLoop();
      // 全開放は維持
      if ((storyProgress.fantasy || 0) < STORY_DATA.fantasy.length) {
        storyProgress.fantasy = STORY_DATA.fantasy.length;
        try { localStorage.setItem('wallKickStoryProgress', JSON.stringify(storyProgress)); } catch (e) {}
      }
      startGame('story', 'fantasy', 0);
    }
    return;
  }
  basePlayNextStory10();
};

const baseShowResult10 = showResult;
showResult = function (isClear) {
  baseShowResult10(isClear);
  if (!fanIsFantasy() || !isClear || fanExitTaken) return;
  const btnNext = document.getElementById('btn-next-story');
  const last = currentStoryIndex >= STORY_DATA.fantasy.length - 1;
  if (last) {
    btnNext.classList.remove('hidden');
    btnNext.textContent = 'はじまりへ戻る（LOOP ' + (fanLoop + 1) + '）';
    document.getElementById('trivia-header').textContent = '[エピソード] 天上の玉座';
    document.getElementById('trivia-body').textContent =
      '手が開く。物語は、また草のにおいから始まる。終わりはない。ただし——どこかに、出口がある。';
  } else {
    btnNext.textContent = '次のステージへ進む';
  }
};

const baseStartGame10 = startGame;
startGame = function (...args) {
  fanExit = null;
  fanExitTaken = false;
  baseStartGame10(...args);
  if (args[0] === 'story' && args[1] === 'fantasy') {
    spawnFanExit();
    const loopN = fanLoop;
    // ループ帰還時のはじまり台詞を上書き
    if (args[2] === 0 && loopN > 0) {
      setTimeout(() => {
        utPush([
          '* ……また、ここだ。',
          '* 終わりのない話は、出口を探している。',
          '* （LOOP ' + loopN + '）'
        ], 'はじまりの草原');
      }, 50);
    }
    if (loopN > 0) {
      hudStage.textContent = 'L' + loopN + '·' + (args[2] + 1) + '.' + STORY_DATA.fantasy[args[2]].name;
    }
  }
};

// ループするほど少しだけきつく（既存configを軽く上書き）
const baseBuildStoryConfig10 = buildStoryConfig;
buildStoryConfig = function (arc, idx) {
  const c = baseBuildStoryConfig10(arc, idx);
  if (arc === 'fantasy' && fanLoop > 0) {
    const m = Math.min(0.12, fanLoop * 0.03);
    c.spikeBandChance = Math.min(0.62, c.spikeBandChance + m);
    c.batChance = Math.min(0.78, c.batChance + m);
    c.birdInterval = Math.max(120, c.birdInterval - fanLoop * 8);
    c.name = c.name;
  }
  return c;
};

// ---------- 毎フレーム: 出口判定 ----------
const baseUpdateFn12 = update;
update = function () {
  baseUpdateFn12();
  if (paused || gameState !== 'playing' || !fanIsFantasy()) return;
  if (fanExit && !fanExitTaken && touchFanExit()) takeFanExit();
};

const baseDrawFn16 = draw;
draw = function () {
  if (paused) return;
  baseDrawFn16();
  if (gameState === 'playing' && fanIsFantasy()) drawFanExit();
};


/* SPLIT11 */
// ==========================================
// ENDLESS STORY: ボス固有攻撃 / 天の手による撃破演出 / LOOPで最初から
// ==========================================

// ---------- 共通の部品 ----------
function clampX(x, m) { return Math.max(LEFT_WALL_X + (m || 30), Math.min(RIGHT_WALL_X - (m || 30), x)); }
function clampYv(y) { return Math.max(cameraY + 110, Math.min(cameraY + canvas.height - 110, y)); }

// 動きつきの弾（mot: grav / sinX / sinY / orb / hold）
function fShot(b, cfg, x, y, vx, vy, o, mot) {
  const p = v2Shot(b, cfg, x, y, vx, vy, o);
  if (p && mot) p.mot = mot;
  return p;
}

// 縦レーザー（味方のときは、代わりに高速の弾を落とす）
function sigLaser(b, x, timer) {
  if (b._ally) {
    v2Shot(b, { s: 'bolt', col: '#FDE047' }, x, cameraY - 20, 0, 9, { sz: 16, life: 100 });
    return;
  }
  bossLasers.push({ x: clampX(x, 24), startY: b.y + 34, timer: timer, fired: false });
}

// 地形ハザード（横ビーム / 爆発 / 閉まる扉 / 回る腕）。味方が使うときは出さない
const fh = [];
function fhAdd(b, o) {
  if (b && b._ally) return;
  o.t = -(o.delay || 0);
  fh.push(o);
}

function fhHit(h) {
  const px1 = player.x + 5, px2 = player.x + player.size - 5;
  const py1 = player.y + 5, py2 = player.y + player.size - 5;
  const pcx = player.x + player.size / 2, pcy = player.y + player.size / 2;
  if (h.type === 'beam') return py1 < h.y + h.th && py2 > h.y - h.th;
  if (h.type === 'blast') return Math.hypot(pcx - h.x, pcy - h.y) < h.r + 8;
  if (h.type === 'door') return px1 < h.g0 || px2 > h.g1;
  if (h.type === 'arm') {
    const p = Math.max(0, Math.min(1, (h.t - h.warn) / h.fire));
    const a = h.a0 + (h.a1 - h.a0) * p;
    const ex = h.cx + Math.cos(a) * h.len, ey = h.cy + Math.sin(a) * h.len;
    const dx = ex - h.cx, dy = ey - h.cy;
    const u = Math.max(0, Math.min(1, ((pcx - h.cx) * dx + (pcy - h.cy) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(pcx - (h.cx + dx * u), pcy - (h.cy + dy * u)) < 18;
  }
  return false;
}

function tickFh(dt) {
  for (let i = fh.length - 1; i >= 0; i--) {
    const h = fh[i];
    const prev = h.t;
    h.t += dt;
    if (prev < h.warn && h.t >= h.warn) { shakeTime = Math.max(shakeTime, 8); playSound('laserFire'); }
    if (h.t >= h.warn && h.t < h.warn + h.fire && fhHit(h)) {
      enemyKillsPlayer(h.col || '#EF4444');
      return;
    }
    if (h.t >= h.warn + h.fire) fh.splice(i, 1);
  }
}

function drawFh() {
  if (!fh.length) return;
  const T = Date.now() * 0.01, W = canvas.width, H = canvas.height;
  fh.forEach(h => {
    if (h.t < 0) return;
    const warn = h.t < h.warn;
    const p = warn ? h.t / h.warn : (h.t - h.warn) / h.fire;
    const pulse = 0.5 + 0.5 * Math.abs(Math.sin(T * 1.2 + p * 8));
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (h.type === 'beam') {
      const sy = h.y - cameraY;
      if (warn) {
        ctx.strokeStyle = 'rgba(255,59,107,' + (0.35 + 0.5 * pulse) + ')';
        ctx.lineWidth = 2 + p * 4;
        ctx.setLineDash([14, 10]);
        ctx.lineDashOffset = -T * 4;
        ctx.beginPath(); ctx.moveTo(LEFT_WALL_X, sy); ctx.lineTo(RIGHT_WALL_X, sy); ctx.stroke();
      } else {
        const th = h.th * 1.8 * (1 - p * 0.4);
        ctx.fillStyle = hexToRgba(h.col || '#FACC15', 0.45); ctx.fillRect(0, sy - th, W, th * 2);
        ctx.fillStyle = '#FFF7D6'; ctx.fillRect(0, sy - th * 0.5, W, th);
      }
    } else if (h.type === 'blast') {
      const sy = h.y - cameraY;
      if (warn) {
        ctx.fillStyle = 'rgba(255,59,107,' + (0.12 + 0.2 * pulse) + ')';
        ctx.beginPath(); ctx.arc(h.x, sy, h.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,59,107,' + (0.5 + 0.4 * pulse) + ')';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 7]);
        ctx.beginPath(); ctx.arc(h.x, sy, h.r * (1 - 0.1 * p), 0, Math.PI * 2); ctx.stroke();
      } else {
        const g = ctx.createRadialGradient(h.x, sy, 2, h.x, sy, h.r);
        g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, hexToRgba(h.col || '#F97316', 0.9)); g.addColorStop(1, hexToRgba(h.col || '#F97316', 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(h.x, sy, h.r * (1 + p * 0.2), 0, Math.PI * 2); ctx.fill();
      }
    } else if (h.type === 'door') {
      const regions = [[LEFT_WALL_X, h.g0], [h.g1, RIGHT_WALL_X]];
      regions.forEach(r => {
        if (r[1] <= r[0]) return;
        if (warn) {
          ctx.fillStyle = 'rgba(255,59,107,' + (0.1 + 0.2 * pulse) + ')';
          ctx.fillRect(r[0], 0, r[1] - r[0], H);
        } else {
          ctx.fillStyle = hexToRgba(h.col || '#991B1B', 0.92);
          ctx.fillRect(r[0], 0, r[1] - r[0], H);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(r[0], 0, 3, H);
          ctx.fillRect(r[1] - 3, 0, 3, H);
        }
      });
      if (warn) {
        ctx.strokeStyle = 'rgba(0,230,118,0.9)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.moveTo(h.g0, 0); ctx.lineTo(h.g0, H); ctx.moveTo(h.g1, 0); ctx.lineTo(h.g1, H); ctx.stroke();
      }
    } else if (h.type === 'arm') {
      const sy = h.cy - cameraY;
      if (warn) {
        ctx.fillStyle = 'rgba(255,59,107,' + (0.08 + 0.12 * pulse) + ')';
        ctx.beginPath(); ctx.moveTo(h.cx, sy); ctx.arc(h.cx, sy, h.len, h.a0, h.a1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,59,107,' + (0.4 + 0.4 * pulse) + ')';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 8]);
        [h.a0, h.a1].forEach(a => { ctx.beginPath(); ctx.moveTo(h.cx, sy); ctx.lineTo(h.cx + Math.cos(a) * h.len, sy + Math.sin(a) * h.len); ctx.stroke(); });
      } else {
        const a = h.a0 + (h.a1 - h.a0) * p;
        const ex = h.cx + Math.cos(a) * h.len, ey = sy + Math.sin(a) * h.len;
        ctx.strokeStyle = hexToRgba(h.col || '#FDE047', 0.55); ctx.lineWidth = 30;
        ctx.beginPath(); ctx.moveTo(h.cx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(h.cx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      }
    }
    ctx.restore();
  });
}

// 弾の特殊な動き
function tickShotMotions() {
  for (const p of projectiles) {
    if (!p.mot || p.reflected) continue;
    p.age = (p.age || 0) + 1;
    const m = p.mot;
    if (m.k === 'grav') p.vy += m.g;
    else if (m.k === 'sinY') p.vy = m.a * m.f * Math.cos(p.age * m.f);
    else if (m.k === 'sinX') p.vx = m.a * m.f * Math.cos(p.age * m.f);
    else if (m.k === 'orb') {
      m.ang += m.w; m.cy += m.vy;
      p.x = m.cx + Math.cos(m.ang) * m.rad;
      p.y = m.cy + Math.sin(m.ang) * m.rad;
      p.vx = 0; p.vy = 0;
    } else if (m.k === 'hold') {
      if (p.age < m.until) { p.vx = 0; p.vy = 0; }
      else if (!m.went) { m.went = true; p.vx = m.vx; p.vy = m.vy; }
    }
  }
}

// ---------- ボス固有の攻撃（23体） ----------
MOVES.sig_slime = function (b, cfg, r, px, py) {
  // 大きな弾が途中で分裂する
  const n = r >= 9 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    sigQueue(b, 30 + i * 30, () => {
      const sx = b.x, sy = b.y + 30;
      const dx = px - sx, dy = py - sy, d = Math.max(1, Math.hypot(dx, dy));
      const p = v2Shot(b, cfg, sx, sy, dx / d * 3.2, dy / d * 3.2, { heavy: true, sz: 22, r: 15, life: 200 });
      if (!p) return;
      sigQueue(b, 45, () => {
        const k = projectiles.indexOf(p);
        if (p.reflected || k < 0) return;
        projectiles.splice(k, 1);
        const off = Math.random() * 6.28;
        for (let j = 0; j < 5; j++) {
          const a = off + j * 6.283 / 5;
          v2Shot(b, cfg, p.x, p.y, Math.cos(a) * 3, Math.sin(a) * 3, { sz: 12, life: 150 });
        }
        spawnParticles(p.x, p.y, cfg.col, 10, false);
        playSound('snowball');
      }, null);
    }, { kind: 'line', x: b.x, y: b.y + 30, x2: px, y2: py, col: cfg.col });
  }
  playSound('laserWarn');
  return 30 + n * 30 + 110;
};

MOVES.sig_kama = function (b, cfg, r, px, py) {
  // 壁から横一列の風の刃が三連で走る
  for (let i = 0; i < 3; i++) {
    const left = i % 2 === 0, dir = left ? 1 : -1;
    const y = clampYv(py + (i - 1) * 130);
    const x0 = left ? LEFT_WALL_X + 20 : RIGHT_WALL_X - 20;
    sigQueue(b, 36 + i * 18, () => {
      for (let k = 0; k < 3; k++) {
        sigQueue(b, k * 6, () => fShot(b, cfg, x0, y, dir * (5.2 + 0.03 * r), 0, { sz: 14, life: 120 }), null);
      }
    }, { kind: 'portal', x: x0, y: y, dir: dir, col: cfg.col });
  }
  playSound('birdWarn');
  return 36 + 3 * 18 + 90;
};

MOVES.sig_stitch = function (b, cfg, r, px, py) {
  // プレイヤーを囲む位置で弾が止まり、合図で一斉に中心へ
  const n = 5 + (r >= 9 ? 1 : 0), R = 120, hold = 46;
  sigQueue(b, hold, () => {}, { kind: 'ring', x: px, y: py, r: R, col: cfg.col });
  for (let i = 0; i < n; i++) {
    const a = i * 6.283 / n + 0.4;
    const x = clampX(px + Math.cos(a) * R, 20), y = py + Math.sin(a) * R;
    const d = Math.max(1, Math.hypot(px - x, py - y));
    fShot(b, cfg, x, y, 0, 0, { sz: 14, life: 240 }, { k: 'hold', until: hold + i * 5, vx: (px - x) / d * 5, vy: (py - y) / d * 5 });
  }
  playSound('laserWarn');
  return hold + n * 5 + 90;
};

MOVES.sig_rock = function (b, cfg, r, px, py) {
  // 壁ぎわの岩盤が爆ぜ、そこから岩が降る
  for (let i = 0; i < 3; i++) {
    const left = (i + (Math.random() < 0.5 ? 0 : 1)) % 2 === 0;
    const x = left ? LEFT_WALL_X + 18 : RIGHT_WALL_X - 18;
    const y = clampYv(py + (i - 1) * 110);
    fhAdd(b, { type: 'blast', x: x, y: y, r: 62, warn: 62, fire: 12, delay: i * 30, col: '#A8A29E' });
    sigQueue(b, 62 + i * 30 + 12, () => fShot(b, cfg, x, cameraY - 24, 0, 3.8, { sz: 18, life: 200 }), null);
  }
  playSound('laserWarn');
  return 62 + 90 + 90;
};

MOVES.sig_mirror = function (b, cfg, r, px, py) {
  // 左右対称にレーザーと弾が来る
  const mx = LEFT_WALL_X + RIGHT_WALL_X - px;
  sigLaser(b, px, 62);
  sigLaser(b, mx, 62);
  sigQueue(b, 70, () => {
    const pc = playerCenter();
    [LEFT_WALL_X + 22, RIGHT_WALL_X - 22].forEach(x0 => {
      const base = Math.atan2(pc.y - py, pc.x - x0);
      for (let k = -1; k <= 1; k++) fShot(b, cfg, x0, py, Math.cos(base + k * 0.16) * 4.2, Math.sin(base + k * 0.16) * 4.2, { sz: 13, life: 150 });
    });
    playSound('arrow');
  }, null);
  playSound('laserWarn');
  return 62 + 70 + 90;
};

MOVES.sig_fire = function (b, cfg, r, px, py) {
  // 火の息: 扇状の炎を3回
  for (let k = 0; k < 3; k++) {
    sigQueue(b, 30 + k * 24, () => {
      const pc = playerCenter();
      const base = Math.atan2(pc.y - (b.y + 30), pc.x - b.x);
      for (let i = -4; i <= 4; i++) {
        const a = base + i * 0.15;
        fShot(b, cfg, b.x, b.y + 30, Math.cos(a) * 3.4, Math.sin(a) * 3.4, { sz: 14, life: 180 });
      }
      playSound('arrow');
      shakeTime = Math.max(shakeTime, 4);
    }, k === 0 ? { kind: 'line', x: b.x, y: b.y + 30, x2: px, y2: py, col: cfg.col } : null);
  }
  return 30 + 3 * 24 + 100;
};

MOVES.sig_sand = function (b, cfg, r, px, py) {
  // 砂の柱が、左から右（または右から左）へ流れる
  const n = 10, rev = Math.random() < 0.5;
  for (let i = 0; i < n; i++) {
    const x = LEFT_WALL_X + 24 + (rev ? n - 1 - i : i) * ((RIGHT_WALL_X - LEFT_WALL_X - 48) / (n - 1));
    sigQueue(b, 30 + i * 9, () => {
      for (let k = 0; k < 2; k++) sigQueue(b, k * 12, () => fShot(b, cfg, x, cameraY - 22, 0, 3.9, { sz: 12, life: 220 }), null);
    }, { kind: 'top', x: x, y: cameraY + 26, col: cfg.col });
  }
  playSound('birdWarn');
  return 30 + n * 9 + 130;
};

MOVES.sig_clone = function (b, cfg, r, px, py) {
  // 影の分身が3か所に現れ、それぞれが狙い撃ち
  for (let i = 0; i < 3; i++) {
    const x = LEFT_WALL_X + 60 + Math.random() * (RIGHT_WALL_X - LEFT_WALL_X - 120);
    const y = cameraY + 150 + Math.random() * 300;
    sigQueue(b, 50 + i * 14, () => {
      const pc = playerCenter();
      const base = Math.atan2(pc.y - y, pc.x - x);
      for (let k = -1; k <= 1; k++) fShot(b, cfg, x, y, Math.cos(base + k * 0.2) * 4.2, Math.sin(base + k * 0.2) * 4.2, { sz: 13, life: 160 });
      spawnParticles(x, y, cfg.col, 6, false);
    }, { kind: 'ring', x: x, y: y, r: 34, col: cfg.col });
  }
  playSound('laserWarn');
  return 50 + 3 * 14 + 100;
};

MOVES.sig_moon = function (b, cfg, r, px, py) {
  // 下から跳ね上がり、放物線を描いて降ってくる
  for (let i = 0; i < 7; i++) {
    const x = LEFT_WALL_X + 30 + i * 50;
    sigQueue(b, 36 + i * 10, () => {
      fShot(b, cfg, x, cameraY + canvas.height + 10, (Math.random() - 0.5) * 1.2, -9.5, { sz: 15, life: 170 }, { k: 'grav', g: 0.22 });
    }, { kind: 'crack', x: x, y: cameraY + canvas.height - 8, col: cfg.col });
  }
  playSound('birdWarn');
  return 36 + 7 * 10 + 130;
};

MOVES.sig_bell = function (b, cfg, r, px, py) {
  // 3か所で鈴が鳴り、輪になって広がる
  const cs = [px, LEFT_WALL_X + 80, RIGHT_WALL_X - 80];
  cs.forEach((cx, i) => {
    const cy = clampYv(py - 60 + (i ? 40 : 0));
    sigQueue(b, 40 + i * 28, () => {
      const off = Math.random() * 6.28;
      for (let k = 0; k < 12; k++) {
        const a = off + k * 6.283 / 12;
        fShot(b, cfg, cx, cy, Math.cos(a) * 2.6, Math.sin(a) * 2.6, { sz: 12, life: 150 });
      }
      playSound('deflect');
      spawnParticles(cx, cy, cfg.col, 8, false);
    }, { kind: 'ring', x: cx, y: cy, r: 44, col: cfg.col });
  });
  playSound('laserWarn');
  return 40 + 3 * 28 + 100;
};

MOVES.sig_thunder = function (b, cfg, r, px, py) {
  // 縦3本＋横2本の雷の網
  [clampX(px, 30), clampX(px - 120, 30), clampX(px + 120, 30)].forEach(x => sigLaser(b, x, 66));
  [py - 70, py + 90].forEach(y => fhAdd(b, { type: 'beam', y: clampYv(y), th: 15, warn: 66, fire: 14, col: '#FACC15' }));
  playSound('laserWarn');
  return 66 + 14 + 90;
};

MOVES.sig_pages = function (b, cfg, r, px, py) {
  // ひらひらと左右に揺れながら落ちるページ
  const n = 8;
  for (let i = 0; i < n; i++) {
    const x = LEFT_WALL_X + 40 + Math.random() * (RIGHT_WALL_X - LEFT_WALL_X - 80);
    sigQueue(b, 34 + i * 12, () => {
      fShot(b, cfg, x, cameraY - 22, 0, 2.8, { sz: 15, life: 260 }, { k: 'sinX', a: 30, f: 0.08 });
    }, { kind: 'top', x: x, y: cameraY + 26, col: cfg.col });
  }
  playSound('birdWarn');
  return 34 + n * 12 + 140;
};

MOVES.sig_snake = function (b, cfg, r, px, py) {
  // 蛇のようにうねる弾の列
  const left = Math.random() < 0.5, dir = left ? 1 : -1;
  const y0 = clampYv(py);
  const x0 = left ? LEFT_WALL_X + 20 : RIGHT_WALL_X - 20;
  sigQueue(b, 36, () => {}, { kind: 'portal', x: x0, y: y0, dir: dir, col: cfg.col });
  for (let i = 0; i < 14; i++) {
    sigQueue(b, 36 + i * 5, () => {
      fShot(b, cfg, x0, y0, dir * 3.6, 0, { sz: 13, life: 180 }, { k: 'sinY', a: 46, f: 0.13 });
    }, null);
  }
  playSound('birdWarn');
  return 36 + 14 * 5 + 120;
};

MOVES.sig_gore = function (b, cfg, r, px, py) {
  // 角突き: プレイヤーの縦ラインへ瞬間移動して突き下ろす
  const lx = clampX(px, 40);
  sigQueue(b, 46, () => {
    if (!b._ally) { b.x = lx; spawnParticles(b.x, b.y, cfg.col, 12, false); }
    shakeTime = Math.max(shakeTime, 10);
    playSound('laserFire');
    sigLaser(b, b.x, 30);
    for (let i = -3; i <= 3; i++) {
      const a = Math.PI / 2 + i * 0.28;
      fShot(b, cfg, b.x, b.y + 30, Math.cos(a) * 4.2, Math.sin(a) * 4.2, { sz: 14, life: 160 });
    }
  }, { kind: 'lane', x: lx, col: cfg.col });
  playSound('laserWarn');
  return 46 + 30 + 100;
};

MOVES.sig_garden = function (b, cfg, r, px, py) {
  // 花が次々に咲き、花びらを散らす（ボスからプレイヤーへ向かう列）
  const sx = b.x, sy = b.y + 40;
  for (let k = 0; k < 5; k++) {
    const u = (k + 1) / 5.5;
    const x = clampX(sx + (px - sx) * u, 30), y = sy + (py - sy) * u;
    fhAdd(b, { type: 'blast', x: x, y: y, r: 36, warn: 50, fire: 10, delay: k * 14, col: '#EC4899' });
    sigQueue(b, 50 + k * 14 + 10, () => {
      for (let j = 0; j < 6; j++) {
        const a = j * 1.047;
        fShot(b, cfg, x, y, Math.cos(a) * 2.8, Math.sin(a) * 2.8, { sz: 11, life: 140 });
      }
    }, null);
  }
  playSound('laserWarn');
  return 50 + 5 * 14 + 130;
};

MOVES.sig_anchor = function (b, cfg, r, px, py) {
  // 碇落とし: 鎖を残して落ち、あとから砲弾が左右から
  const x = clampX(px, 30), y0 = cameraY - 24;
  sigQueue(b, 40, () => {
    fShot(b, cfg, x, y0, 0, 7, { heavy: true, sz: 24, r: 16, life: 120 });
    for (let k = 0; k < 12; k++) {
      sigQueue(b, 5 + k * 5, () => fShot(b, cfg, x, y0 + 7 * (5 + k * 5), 0, 0, { sz: 10, life: 60, sprite: 'coin' }), null);
    }
    shakeTime = Math.max(shakeTime, 6);
  }, { kind: 'top', x: x, y: cameraY + 26, col: cfg.col });
  sigQueue(b, 100, () => {
    const y = clampYv(py);
    [LEFT_WALL_X + 20, RIGHT_WALL_X - 20].forEach((x0, i) => {
      fShot(b, cfg, x0, y + (i ? 30 : -30), (i ? -1 : 1) * 4, 0, { sz: 15, life: 140, sprite: 'meteor' });
    });
  }, null);
  playSound('laserWarn');
  return 100 + 140;
};

MOVES.sig_gear = function (b, cfg, r, px, py) {
  // 回転する歯車が、ゆっくり降りてくる
  [LEFT_WALL_X + 110, RIGHT_WALL_X - 110].forEach((cx, g) => {
    sigQueue(b, 40 + g * 24, () => {
      for (let i = 0; i < 6; i++) {
        const mm = { k: 'orb', cx: cx, cy: cameraY - 20, vy: 1.7, ang: i * Math.PI / 3, w: 0.09, rad: 40 };
        fShot(b, cfg, cx + Math.cos(mm.ang) * 40, mm.cy, 0, 0, { sz: 13, life: 250 }, mm);
      }
    }, { kind: 'top', x: cx, y: cameraY + 26, col: cfg.col });
  });
  playSound('laserWarn');
  return 40 + 24 + 260;
};

MOVES.sig_check = function (b, cfg, r, px, py) {
  // 王手: プレイヤーの周囲を「井」の字に囲む（中央だけが安全）
  const cx = clampX(px, 60), cy = clampYv(py);
  sigLaser(b, cx - 78, 66);
  sigLaser(b, cx + 78, 66);
  fhAdd(b, { type: 'beam', y: cy - 92, th: 15, warn: 66, fire: 14, col: '#A78BFA' });
  fhAdd(b, { type: 'beam', y: cy + 92, th: 15, warn: 66, fire: 14, col: '#A78BFA' });
  sigQueue(b, 66, () => {}, { kind: 'ring', x: cx, y: cy, r: 46, col: '#22C55E' });
  playSound('laserWarn');
  return 66 + 14 + 90;
};

MOVES.sig_blade = function (b, cfg, r, px, py) {
  // 聖剣一閃: ボスから伸びる光の剣が、扇状に薙ぎ払う
  if (b._ally) return MOVES.crossSlash(b, cfg, r, px, py);
  const cx = b.x, cy = b.y + 30;
  const base = Math.atan2(py - cy, px - cx);
  fhAdd(b, { type: 'arm', cx: cx, cy: cy, len: 560, a0: base - 0.95, a1: base + 0.95, warn: 56, fire: 64, col: '#FDE047' });
  playSound('laserWarn');
  return 56 + 64 + 90;
};

MOVES.sig_chaos = function (b, cfg, r, px, py) {
  // 元素暴走: 炎・氷・雷・葉・星がでたらめに飛ぶ
  const kinds = [['meteor', '#F97316'], ['ice', '#7DD3FC'], ['bolt', '#FDE047'], ['leaf', '#4ADE80'], ['star', '#F472B6']];
  for (let i = 0; i < 14; i++) {
    const k = kinds[Math.floor(Math.random() * kinds.length)];
    sigQueue(b, 20 + Math.floor(Math.random() * 100), () => {
      const pc = playerCenter();
      const a = Math.atan2(pc.y - (b.y + 30), pc.x - b.x) + (Math.random() - 0.5) * 1.4;
      const sp = 2.8 + Math.random() * 2.2;
      fShot(b, { s: k[0], col: k[1] }, b.x, b.y + 30, Math.cos(a) * sp, Math.sin(a) * sp, { sz: 13, life: 170 });
    }, null);
  }
  playSound('laserWarn');
  return 20 + 100 + 120;
};

MOVES.sig_gate = function (b, cfg, r, px, py) {
  // 閉門: 両側から壁が閉じる。残るのは細い隙間だけ
  if (b._ally) return MOVES.crossSlash(b, cfg, r, px, py);
  const g0 = Math.max(LEFT_WALL_X, clampX(px, 20) - 54), g1 = Math.min(RIGHT_WALL_X, g0 + 108);
  fhAdd(b, { type: 'door', g0: g0, g1: g1, warn: 72, fire: 34, col: '#991B1B' });
  playSound('laserWarn');
  return 72 + 34 + 90;
};

MOVES.sig_stairs = function (b, cfg, r, px, py) {
  // 天の階: レーザーが階段のように、順に立ち上がる
  const n = 9;
  for (let i = 0; i < n; i++) {
    const x = LEFT_WALL_X + 28 + i * ((RIGHT_WALL_X - LEFT_WALL_X - 56) / (n - 1));
    if (Math.abs(x - px) < 44) continue;
    sigQueue(b, 6 + i * 9, () => sigLaser(b, x, 54), null);
  }
  playSound('laserWarn');
  return 6 + n * 9 + 54 + 80;
};

MOVES.sig_genesis = function (b, cfg, r, px, py) {
  // 創世の三節: 炸裂 → 光柱 → 星の雨
  MOVES.burstShell(b, cfg, r, px, py);
  sigQueue(b, 80, () => { const pc = playerCenter(); MOVES.laneStrike(b, cfg, r, pc.x, pc.y); }, null);
  sigQueue(b, 170, () => { const pc = playerCenter(); MOVES.rainVolley(b, cfg, r, pc.x, pc.y); }, null);
  return 170 + 150;
};

const FAN_SIG = {
  '緑のスライム王': ['sig_slime', 'ぷるぷる分裂', 'urchin'],
  '風精霊エーロ': ['sig_kama', 'かまいたち', 'slash'],
  '葉影の狩人': ['sig_stitch', '影縫い', 'leaf'],
  '石塊ゴーレム': ['sig_rock', '岩盤返し', 'boulder'],
  '水面の鏡精': ['sig_mirror', '鏡写し', 'crystal'],
  '炎牙の幼竜': ['sig_fire', '火の息', 'meteor'],
  '時砂のファラオ': ['sig_sand', '砂の時雨', 'boulder'],
  '影法師': ['sig_clone', '影分身', 'skull'],
  '流星ウサギ': ['sig_moon', '月見跳び', 'star'],
  '氷鈴の魔女': ['sig_bell', '凍鈴輪', 'ice'],
  '雷雲の雷鳥': ['sig_thunder', '落雷網', 'bolt'],
  '本の番人': ['sig_pages', '禁書のページ', 'feather'],
  '虹鱗の大蛇': ['sig_snake', '虹蛇行', 'shachi'],
  '迷宮ミノタウロス': ['sig_gore', '角突き', 'claw'],
  '花冠の女王': ['sig_garden', '花園', 'leaf'],
  '虚船の船長': ['sig_anchor', '碇落とし', 'spear'],
  '歯車の番人': ['sig_gear', '回転歯車', 'coin'],
  '影の王': ['sig_check', '王手', 'skull'],
  '光の騎士': ['sig_blade', '聖剣一閃', 'halo'],
  '混沌の錬金魔': ['sig_chaos', '元素暴走', 'star'],
  '終焉の門番': ['sig_gate', '閉門', 'bolt'],
  '天階の守護者': ['sig_stairs', '天の階', 'halo'],
  '創世の語り手': ['sig_genesis', '創世の三節', 'star']
};
FAN_BOSS_META.forEach((m, i) => {
  const name = m[0];
  const sg = FAN_SIG[name];
  if (!sg) return;
  const pool = FAN_MOVE_POOL[i] || DEFAULT_MOVES;
  const sig = { m: sg[0], n: sg[1], s: sg[2] };
  // 固有技を、もとの技より多めに使う
  BOSS_MOVES[name] = [sig, pool[0], sig, pool[1], pool[2]].filter(Boolean);
});

// ==========================================
// 倒したボスは、天の手につぶされる
// ==========================================
const CF = { on: false, t: 0, mode: 'crush', x: 0, y: 0, done: false, burst: false };
let fanLoopApplied = false;

function cfBody(c, name) {
  const g = getBossGif(name);
  if (g) {
    const h = 112, w = h * g.naturalWidth / g.naturalHeight;
    c.drawImage(g, -w / 2, -h / 2, w, h);
    return;
  }
  const th = BOSS_THEMES[name] || DEFAULT_THEME;
  c.lineJoin = 'round';
  c.lineWidth = 3;
  c.strokeStyle = INK3;
  c.fillStyle = '#FFD600';
  c.beginPath(); c.moveTo(-34, -36); c.lineTo(-46, -58); c.lineTo(-16, -36); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(34, -36); c.lineTo(46, -58); c.lineTo(16, -36); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = th.body;
  gRR(c, -42, -36, 84, 72, 10);
  c.fill(); c.stroke();
  c.fillStyle = INK3;
  c.fillRect(-26, -12, 18, 12); c.fillRect(8, -12, 18, 12);
  c.fillStyle = '#FFD600';
  c.fillRect(-20, -9, 8, 6); c.fillRect(12, -9, 8, 6);
  c.fillStyle = '#FFFFFF';
  c.fillRect(-22, 12, 44, 10); c.strokeRect(-22, 12, 44, 10);
}

function cfBegin(mode) {
  const b = activeBoss;
  CF.on = true;
  CF.t = 0;
  CF.mode = mode;
  CF.burst = false;
  CF.x = b.x;
  CF.y = b.y;
  b.hp = 1;
  b.vx = 0;
  projectiles = [];
  bossLasers = [];
  bossQueue.length = 0;
  bossBombs.length = 0;
  fh.length = 0;
  exBlood = [];
  b.shootTimer = 99999;
  b._pt = 99999;
  b._charge = 0;
  bossHud.classList.add('hidden');
  shakeTime = 14;
  playSound('bossDamage');
}

function cfTick() {
  const b = activeBoss;
  if (!b) { CF.on = false; return; }
  CF.t++;
  const t = CF.t;
  b.hp = Math.max(1, b.hp);
  b.vx = 0;
  b.shootTimer = 99999;
  b._pt = 99999;
  projectiles = [];
  bossLasers = [];
  bossQueue.length = 0;
  bossBombs.length = 0;
  fh.length = 0;
  jstate.postInv = Math.max(jstate.postInv, 10);   // 演出中は、プレイヤーはやられない
  CF.x = b.x;
  CF.y = b.y;

  if (CF.mode === 'dissolve') {
    if (t === 10) utPush(['……よくやった。', '* 手が、そっとひらく。'], '天の手');
    if (t > 20 && t % 5 === 0) spawnParticles(b.x + (Math.random() - 0.5) * 80, b.y + (Math.random() - 0.5) * 60, '#FDE047', 3, false);
    if (t === 60) playSound('clear');
    if (t >= 150) cfEnd();
    return;
  }
  if (t === 40) playSound('laserWarn');
  if (t === 60) utPush(['お役目ご苦労さん。'], '天の手');
  if (t === 170) exCrushSound();
  if (t > 170 && t < 222 && t % 4 === 0) shakeTime = 6;
  if (t === 222) {
    jfx.push({ type: 'flash', t: 0, total: 14, color: '255,255,255' });
    jfx.push({ type: 'ring', x: b.x, y: b.y, t: 0, total: 26, color: '#FFFFFF' });
    shakeTime = 26;
    spawnParticles(b.x, b.y, '#7F1D1D', 24, false);
  }
  if (t >= 330) cfEnd();
}

function cfEnd() {
  CF.on = false;
  CF.done = true;
  const cfg = STAGES[currentDifficulty];
  maxAltitude = cfg.goalMeters;
  showResult(true);
  CF.done = false;
}

function drawCF() {
  const b = activeBoss;
  if (!b) return;
  const t = CF.t, W = canvas.width;
  const bx = CF.x, by = CF.y - cameraY;
  const ease = v => (v < 0 ? 0 : v > 1 ? 1 : v * v * (3 - 2 * v));

  if (CF.mode === 'dissolve') {
    const k = ease((t - 20) / 100);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - k);
    const hy = by - 30 - k * 50;
    const curl = 0.12 * (1 - k);
    drawGiantHandBack(ctx, bx, hy, 0.8, curl);
    drawGiantHandFront(ctx, bx, hy, 0.8, curl);
    ctx.restore();
    if (k > 0) {
      const g = ctx.createRadialGradient(bx, by, 4, bx, by, 110);
      g.addColorStop(0, 'rgba(253,224,71,' + (0.5 * (1 - k)) + ')');
      g.addColorStop(1, 'rgba(253,224,71,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(bx, by, 110, 0, Math.PI * 2); ctx.fill();
    }
    return;
  }

  // 上から闇が落ちてくる
  let dark = 0;
  if (t < 40) dark = t / 40 * 0.5;
  else if (t < 222) dark = 0.5;
  else dark = 0.5 * (1 - ease((t - 222) / 88));
  if (dark > 0) {
    const g = ctx.createLinearGradient(0, 0, 0, by + 160);
    g.addColorStop(0, 'rgba(0,0,12,' + dark + ')');
    g.addColorStop(1, 'rgba(0,0,12,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, by + 160);
  }

  // ボス（握られる前）
  let pose = null;
  if (t < 222) {
    const sp = ease((t - 40) / 80);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * sp) + ')';
    ctx.beginPath(); ctx.ellipse(bx, by + 60, 70 + sp * 30, 16 + sp * 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const q = t < 170 ? 0 : Math.min(1, (t - 170) / 52);
    const sh = t < 20 ? 0 : (Math.random() - 0.5) * (t < 140 ? 3 : 3 + q * 8);
    pose = { x: bx + sh, y: by + 56 * q * 0.6, sx: 1 + 0.15 * q, sy: 1 - 0.6 * q };
  }
  const drawBoss = () => {
    if (!pose) return;
    ctx.save();
    ctx.translate(pose.x, pose.y);
    ctx.scale(pose.sx, pose.sy);
    cfBody(ctx, b.name);
    ctx.restore();
  };

  if (t < 40) { drawBoss(); return; }

  // 手: 手のひらは奥、ボスはその手前、指はさらに手前
  const hover = by - 225, dive = by - 54, top = -520;
  let hx = bx, hy, curl;
  if (t < 120) {
    hy = top + (hover - top) * ease((t - 40) / 80);
    curl = 0;
    hx += Math.sin(t * 0.08) * 6;
  } else if (t < 140) {
    hy = hover + Math.sin((t - 120) * 0.4) * 3;
    curl = 0;
  } else if (t < 170) {
    const p = ease((t - 140) / 30);
    hy = hover + (dive - hover) * p;
    curl = 0.7 * p;
  } else if (t < 222) {
    const p = (t - 170) / 52;
    hy = dive + (Math.random() - 0.5) * (2 + p * 6);
    hx += (Math.random() - 0.5) * (2 + p * 8);
    curl = 0.7 + 0.3 * p;
  } else {
    const p = ease((t - 222) / 88);
    hy = dive + (top - dive) * p * p;
    curl = 1;
  }
  drawGiantHandBack(ctx, hx, hy, 1.35, curl);
  drawBoss();
  drawGiantHandFront(ctx, hx, hy, 1.35, curl);

  // 握る指の間から、赤いものが飛び散る
  if (t >= 190) {
    const stain = Math.min(1, (t - 190) / 40);
    ctx.fillStyle = 'rgba(185,28,28,' + (0.7 * stain) + ')';
    for (let k = 0; k < 7; k++) {
      ctx.beginPath();
      ctx.ellipse(hx + (k - 3) * 20, hy + 85 + (k % 2) * 16, 9, 5, 0.3 * (k - 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (t >= 170 && t < 222) exBloodSpray(bx + (Math.random() - 0.5) * 70, by + 20 + Math.random() * 50, 2, 5, 1.5);
  if (t >= 222 && !CF.burst) { CF.burst = true; exBloodSpray(bx, by + 20, 45, 9, 2); }
  if (t >= 226 && t < 310 && t % 6 === 0) {
    exBlood.push({ x: hx + (Math.random() - 0.5) * 40, y: hy + 120, vx: 0, vy: 0.5, r: 2.5, life: 60 });
  }
  drawExBlood();
  if (t >= 222) {
    const gg = ctx.createRadialGradient(hx, hy + 20, 5, hx, hy + 20, 70);
    gg.addColorStop(0, 'rgba(160,20,60,0.5)');
    gg.addColorStop(1, 'rgba(160,20,60,0)');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(hx, hy + 20, 70, 0, Math.PI * 2); ctx.fill();
  }
}

// ==========================================
// 結果の横取りと、LOOP（全クリアのあとは最初から）
// ==========================================
const baseShowResult11 = showResult;
showResult = function (isClear) {
  if (isClear && gameState === 'playing' && fanIsFantasy() && activeBoss && !CF.done && !fanExitTaken) {
    if (CF.on) return;
    cfBegin(activeBoss.name === FAN_BOSS ? 'dissolve' : 'crush');
    return;
  }
  baseShowResult11(isClear);
  if (isClear && fanIsFantasy() && !fanExitTaken && !fanLoopApplied &&
      currentStoryIndex >= STORY_DATA.fantasy.length - 1) {
    // 全ステージクリア → LOOP。進行は最初から（1面だけ解放）に戻る
    fanLoopApplied = true;
    fanLoop++;
    saveFanLoop();
    storyProgress.fantasy = 0;
    try { localStorage.setItem('wallKickStoryProgress', JSON.stringify(storyProgress)); } catch (e) {}
  }
};

const basePlayNextStory11 = playNextStoryStage;
playNextStoryStage = function () {
  if (currentStoryArc === 'fantasy' && currentStoryIndex + 1 >= STORY_DATA.fantasy.length) {
    startGame('story', 'fantasy', 0);   // LOOP: 最初のステージから
    return;
  }
  basePlayNextStory11();
};

const baseStartGame11 = startGame;
startGame = function (...args) {
  CF.on = false;
  CF.done = false;
  fanLoopApplied = false;
  fh.length = 0;
  exBlood = [];
  baseStartGame11(...args);
};

// ---------- 毎フレーム ----------
const baseUpdateFn13 = update;
update = function () {
  const ut0 = utBox.on;
  baseUpdateFn13();
  if (paused || gameState !== 'playing') return;
  if (ut0 || utBox.on) return;   // 台詞中は、演出も止まる
  if (CF.on) cfTick();
  tickShotMotions();
  if (gameState === 'playing' && fanIsFantasy()) tickFh(Math.max(0, timeScale()));
};

const baseDrawFn17 = draw;
draw = function () {
  if (paused) return;
  const hide = CF.on && gameState === 'playing' && !!activeBoss;
  let saved = 0;
  if (hide) { saved = activeBoss.hp; activeBoss.hp = 0; }   // 元のボスは描かず、演出で描く
  baseDrawFn17();
  if (hide) activeBoss.hp = saved;
  if (gameState === 'playing') {
    if (fanIsFantasy()) drawFh();
    if (CF.on) drawCF();
  }
};


/* SPLIT12 */
// ==========================================
// 1. 出口の場所を隠す
// ==========================================
const FAN_EXIT_PLAN_KEY = 'wallKickFantasyExitPlan';
let fanExitPlan = null;

function fanPlanExit() {
  let plan = null;
  try { plan = JSON.parse(localStorage.getItem(FAN_EXIT_PLAN_KEY) || 'null'); } catch (e) {}
  if (!plan || plan.loop !== fanLoop) {
    plan = {
      loop: fanLoop,
      stage: Math.floor(Math.random() * (STORY_DATA.fantasy.length - 1)),   // 天の手のステージ以外
      side: Math.random() < 0.5 ? 'left' : 'right',
      frac: 0.3 + Math.random() * 0.4
    };
    try { localStorage.setItem(FAN_EXIT_PLAN_KEY, JSON.stringify(plan)); } catch (e) {}
  }
  fanExitPlan = plan;
  return plan;
}

spawnFanExit = function () {
  fanExit = null;
  fanExitTaken = false;
  fanExitFx = 0;
  if (!fanIsFantasy()) return;
  const plan = fanPlanExit();
  if (currentStoryIndex !== plan.stage) return;
  const goal = STORY_DATA.fantasy[plan.stage].goal;
  const y = 580 - Math.floor(goal * plan.frac) * PIXELS_PER_METER;
  const w = 22, h = 36;
  const left = plan.side === 'left';
  fanExit = { x: left ? LEFT_WALL_X + 2 : RIGHT_WALL_X - w - 2, y: y - h / 2, w: w, h: h, side: plan.side };
  // 出口のまわりの、トゲとコウモリを取り除く
  spikeBands = spikeBands.filter(b => {
    const top = (b.baseY !== undefined ? b.baseY : b.y) - (b.moveRange || 0) - 90;
    const bot = (b.baseY !== undefined ? b.baseY : b.y) + b.totalHeight + (b.moveRange || 0) + 90;
    return b.side !== plan.side || y < top || y > bot;
  });
  bats = bats.filter(b => Math.abs(b.y - y) > 70);
};

// ステージ一覧の「？」「出口」の印を消す
const baseRenderFantasyList12 = renderFantasyList;
renderFantasyList = function () {
  baseRenderFantasyList12();
  document.querySelectorAll('#story-stage-list .story-badge').forEach(el => {
    if (el.textContent === '？' || el.textContent === '出口') el.remove();
  });
};

// ==========================================
// 共通の部品
// ==========================================
const cnClamp = (v, a, b) => Math.max(a === undefined ? 0 : a, Math.min(b === undefined ? 1 : b, v));
const cnEase = v => { v = cnClamp(v); return v * v * (3 - 2 * v); };
const cnLerp = (a, b, k) => a + (b - a) * k;
const cnMod = (a, n) => ((a % n) + n) % n;
function cnRng(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; };
}
function cnHexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function cnMix(a, b, k) {
  const A = cnHexRgb(a), B = cnHexRgb(b);
  k = cnClamp(k);
  return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * k) + ',' + Math.round(A[1] + (B[1] - A[1]) * k) + ',' + Math.round(A[2] + (B[2] - A[2]) * k) + ')';
}

const CN = {
  on: false, ph: '', t: 0, ev: {}, shake: 0, parts: [], stars: [], ready: false, pressed: false, skip: false,
  drone: null, prevBgm: true, cracks: [], bosses: [], spawned: [], shots: [], marks: [], earth: null, p0x: 0, p0y: 0
};
(function () {
  const r = cnRng(1234);
  for (let i = 0; i < 260; i++) CN.stars.push({ x: r() * 420, y: r() * 720, s: 0.5 + r() * 1.7, ph: r() * 6.28, sp: 0.4 + r() });
})();

const cineScreen = document.createElement('div');
cineScreen.id = 'cine-screen';
cineScreen.innerHTML = '<canvas id="cine-canvas" width="420" height="720"></canvas><button id="cine-spin" class="btn btn-practice">回転攻撃</button>';
document.getElementById('game-wrapper').appendChild(cineScreen);
const cineCanvas = document.getElementById('cine-canvas');
const ccx = cineCanvas.getContext('2d');
const cineSpinBtn = document.getElementById('cine-spin');
function cnPress() {
  if (CN.on && CN.ph === 'pin' && CN.ready && !CN.pressed) CN.pressed = true;
}
cineSpinBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); cnPress(); });
cineScreen.addEventListener('pointerdown', e => { e.stopPropagation(); });

// 演出中は、ゲームの操作をすべて止める（Space = 回転攻撃 / Esc = ムービーのスキップ）
window.addEventListener('keydown', e => {
  if (!CN.on) return;
  if (e.code === 'Space') { e.preventDefault(); e.stopImmediatePropagation(); cnPress(); return; }
  if (e.code === 'Escape' && CN.ph === 'movie') { e.preventDefault(); e.stopImmediatePropagation(); CN.skip = true; return; }
  if (['ArrowUp', 'KeyW', 'KeyZ', 'Escape', 'KeyP', 'Enter'].includes(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);

// ---------- 音 ----------
function cnAC() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function cnTone(type, f0, f1, t0, dur, vol) {
  try {
    const a = cnAC(), now = a.currentTime;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, now + t0);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + t0 + dur);
    g.gain.setValueAtTime(0.0001, now + t0);
    g.gain.exponentialRampToValueAtTime(vol, now + t0 + Math.min(0.04, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, now + t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(now + t0); o.stop(now + t0 + dur + 0.05);
  } catch (e) {}
}
function cnNoise(dur, vol, ftype, f0, f1, t0) {
  try {
    const a = cnAC(), now = a.currentTime + (t0 || 0);
    const len = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource();
    s.buffer = buf;
    const f = a.createBiquadFilter();
    f.type = ftype;
    f.frequency.setValueAtTime(f0, now);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + dur);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + Math.min(0.1, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    s.connect(f); f.connect(g); g.connect(a.destination);
    s.start(now);
  } catch (e) {}
}
function cnDrone(on) {
  try {
    const a = cnAC();
    if (on && !CN.drone) {
      const g = a.createGain(); g.gain.value = 0.0001;
      const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
      const o1 = a.createOscillator(), o2 = a.createOscillator();
      o1.type = 'sawtooth'; o2.type = 'sawtooth';
      o1.frequency.value = 55; o2.frequency.value = 55.4;
      o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(a.destination);
      o1.start(); o2.start();
      CN.drone = { g: g, lp: lp, o1: o1, o2: o2 };
    } else if (!on && CN.drone) {
      const d = CN.drone;
      d.g.gain.setTargetAtTime(0.0001, a.currentTime, 0.4);
      d.o1.stop(a.currentTime + 1.6); d.o2.stop(a.currentTime + 1.6);
      CN.drone = null;
    }
  } catch (e) {}
}
function cnDroneSet(vol, cut, pitch) {
  const d = CN.drone;
  if (!d) return;
  try {
    const a = cnAC(), now = a.currentTime;
    d.g.gain.setTargetAtTime(vol, now, 0.6);
    d.lp.frequency.setTargetAtTime(cut, now, 0.6);
    d.o1.frequency.setTargetAtTime(pitch, now, 0.8);
    d.o2.frequency.setTargetAtTime(pitch * 1.007, now, 0.8);
  } catch (e) {}
}
function cnSfx(kind) {
  if (kind === 'door') { cnTone('sine', 300, 800, 0, 0.5, 0.12); cnNoise(0.5, 0.06, 'highpass', 1000, 5000, 0); }
  else if (kind === 'pull') cnNoise(1.0, 0.12, 'highpass', 300, 6000, 0);
  else if (kind === 'thud') cnTone('sine', 90, 35, 0, 0.3, 0.45);
  else if (kind === 'whoosh') cnNoise(0.4, 0.14, 'bandpass', 400, 2500, 0);
  else if (kind === 'slam') { cnNoise(0.6, 0.5, 'lowpass', 3000, 160, 0); cnTone('sine', 80, 28, 0, 0.5, 0.55); }
  else if (kind === 'slash') { cnNoise(0.3, 0.22, 'highpass', 2000, 9000, 0); cnTone('triangle', 1400, 300, 0, 0.25, 0.2); }
  else if (kind === 'die') { cnTone('sawtooth', 220, 38, 0, 1.4, 0.22); cnNoise(1.2, 0.2, 'lowpass', 2000, 120, 0); }
  else if (kind === 'light') { cnTone('sine', 400, 1200, 0, 1.4, 0.1); cnTone('sine', 600, 1800, 0.1, 1.4, 0.06); }
  else if (kind === 'step') cnTone('sine', 140, 80, 0, 0.08, 0.14);
  else if (kind === 'door2') { cnTone('triangle', 523, 1046, 0, 0.8, 0.14); cnNoise(0.8, 0.1, 'highpass', 800, 7000, 0); }
  else if (kind === 'shatter') { cnNoise(0.9, 0.4, 'highpass', 600, 5000, 0); cnTone('sine', 120, 30, 0, 0.7, 0.4); }
}

// ---------- 描画の部品 ----------
function cnStarsDraw(c, t, a, streak) {
  c.save();
  CN.stars.forEach(s => {
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.03 * s.sp + s.ph));
    c.fillStyle = 'rgba(255,255,255,' + (a * tw) + ')';
    if (streak) {
      c.strokeStyle = c.fillStyle;
      c.lineWidth = s.s * 0.8;
      c.beginPath();
      c.moveTo(s.x, s.y);
      c.lineTo(s.x, s.y - streak * s.sp * 2);
      c.stroke();
    } else c.fillRect(s.x, s.y, s.s, s.s);
  });
  c.restore();
}
function cnVig(c, a) {
  const g = c.createRadialGradient(210, 360, 150, 210, 360, 470);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,' + a + ')');
  c.fillStyle = g;
  c.fillRect(0, 0, 420, 720);
}
function cnSpawn(n, x, y, o) {
  for (let i = 0; i < n; i++) {
    if (CN.parts.length > 420) return;
    const a = o.a0 !== undefined ? o.a0 + Math.random() * (o.a1 - o.a0) : Math.random() * Math.PI * 2;
    const sp = (o.sp || 2) * (0.4 + Math.random() * 0.8);
    CN.parts.push({
      x: x + (o.rx ? (Math.random() - 0.5) * o.rx : 0), y: y + (o.ry ? (Math.random() - 0.5) * o.ry : 0),
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0),
      life: (o.life || 60) * (0.6 + Math.random() * 0.8), size: (o.size || 3) * (0.5 + Math.random()),
      col: o.col || '#FFFFFF', g: o.g || 0, glow: !!o.glow
    });
  }
}
function cnParts(c) {
  for (let i = CN.parts.length - 1; i >= 0; i--) {
    const p = CN.parts[i];
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life--;
    if (p.life <= 0) { CN.parts.splice(i, 1); continue; }
    c.globalAlpha = Math.min(1, p.life / 30);
    c.globalCompositeOperation = p.glow ? 'lighter' : 'source-over';
    c.fillStyle = p.col;
    c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

// 主人公（正面）
function cnHero(c, x, y, s, o) {
  o = o || {};
  const sk = getCurrentSkin(), half = 14;
  c.save();
  c.translate(x, y);
  c.rotate(o.rot || 0);
  c.scale(s * (o.sx || 1), s * (o.sy || 1));
  c.lineJoin = 'round';
  if (o.alpha != null) c.globalAlpha = o.alpha;
  const w = Math.sin((o.t || 0) * 0.3) * 4;
  c.fillStyle = sk.bandColor; c.strokeStyle = INK3; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(-(half - 2), -half + 6); c.lineTo(-(half + 14), -half + 2 + w); c.lineTo(-(half + 11), -half + 11 + w); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = INK3; c.fillRect(-half - 3, 2, 4, 6); c.fillRect(half - 1, -4, 4, 6);
  c.fillStyle = sk.bodyColor; c.lineWidth = 3;
  gRR(c, -half, -half, 28, 28, 4); c.fill(); c.stroke();
  c.fillStyle = sk.bandColor; c.fillRect(-half + 1, -half + 4, 26, 6); c.strokeRect(-half + 1, -half + 4, 26, 6);
  c.fillStyle = sk.eyeColor; c.fillRect(-1, -1, 4, 6); c.fillRect(6, -1, 4, 6);
  c.restore();
}

// 主人公（後ろ姿）。s = 立方体の大きさ(px)、fy = 足元のY
function cnHeroBack(c, x, fy, s, t) {
  const sk = getCurrentSkin();
  const step = Math.sin(t * 0.16);
  const bob = Math.abs(step) * s * 0.07;
  const lh = s * 0.22;
  c.save();
  c.translate(x, fy - bob);
  c.lineJoin = 'round';
  // はちまきの尾
  const wv = Math.sin(t * 0.1) * s * 0.12;
  c.fillStyle = sk.bandColor; c.strokeStyle = INK3; c.lineWidth = Math.max(1.5, s * 0.05);
  c.beginPath(); c.moveTo(-s * 0.1, -lh - s * 0.8); c.quadraticCurveTo(-s * 0.5 + wv, -lh - s * 0.55, -s * 0.85 + wv, -lh - s * 0.3 + wv); c.lineTo(-s * 0.75 + wv, -lh - s * 0.2 + wv); c.quadraticCurveTo(-s * 0.4, -lh - s * 0.5, -s * 0.05, -lh - s * 0.65); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(s * 0.1, -lh - s * 0.8); c.quadraticCurveTo(s * 0.5 - wv, -lh - s * 0.55, s * 0.85 - wv, -lh - s * 0.3 + wv); c.lineTo(s * 0.75 - wv, -lh - s * 0.2 + wv); c.quadraticCurveTo(s * 0.4, -lh - s * 0.5, s * 0.05, -lh - s * 0.65); c.closePath(); c.fill(); c.stroke();
  // 脚
  c.fillStyle = INK3;
  c.fillRect(-s * 0.3 + step * s * 0.06, -lh, s * 0.2, lh + bob);
  c.fillRect(s * 0.1 - step * s * 0.06, -lh, s * 0.2, lh + bob);
  // 本体
  c.fillStyle = sk.bodyColor; c.lineWidth = Math.max(2, s * 0.05);
  gRR(c, -s / 2, -lh - s, s, s, s * 0.12); c.fill(); c.stroke();
  c.fillStyle = sk.bandColor;
  c.fillRect(-s / 2 + s * 0.03, -lh - s + s * 0.16, s * 0.94, s * 0.22);
  c.strokeRect(-s / 2 + s * 0.03, -lh - s + s * 0.16, s * 0.94, s * 0.22);
  // 腕
  c.fillStyle = INK3;
  c.fillRect(-s / 2 - s * 0.1, -lh - s * 0.55 + step * s * 0.05, s * 0.14, s * 0.3);
  c.fillRect(s / 2 - s * 0.04, -lh - s * 0.55 - step * s * 0.05, s * 0.14, s * 0.3);
  c.restore();
}

// 巨人（上半身）。原点＝首の付け根。顔の右半分は影に隠れる。主人公と同じ顔
function cnGiant(c, x, y, s, o) {
  o = o || {};
  const sk = getCurrentSkin(), T = o.t || 0;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (o.alpha != null) c.globalAlpha = o.alpha;
  // 衣
  const rg = c.createLinearGradient(-160, 0, 160, 0);
  rg.addColorStop(0, '#DDD7C3'); rg.addColorStop(0.4, '#A9A28D'); rg.addColorStop(0.66, '#4B4759'); rg.addColorStop(1, '#14111E');
  c.fillStyle = rg; c.strokeStyle = INK3; c.lineWidth = 5;
  c.beginPath();
  c.moveTo(-66, -8); c.quadraticCurveTo(-140, 6, -152, 62); c.lineTo(-135, 345); c.lineTo(135, 345); c.lineTo(152, 62); c.quadraticCurveTo(140, 6, 66, -8);
  c.closePath();
  c.fill(); c.stroke();
  c.save();
  c.clip();
  const dg = c.createLinearGradient(0, 160, 0, 345);
  dg.addColorStop(0, 'rgba(5,4,10,0)'); dg.addColorStop(1, 'rgba(5,4,10,0.96)');
  c.fillStyle = dg; c.fillRect(-160, 150, 320, 200);
  c.strokeStyle = 'rgba(15,12,24,0.4)'; c.lineWidth = 4;
  [[-100, 70, -112, 330], [-34, 40, -40, 340], [40, 40, 46, 340], [105, 70, 118, 330]].forEach(f => {
    c.beginPath(); c.moveTo(f[0], f[1]); c.quadraticCurveTo(f[0] * 1.15, (f[1] + f[3]) / 2, f[2], f[3]); c.stroke();
  });
  if (o.moss) {
    c.strokeStyle = 'rgba(80,140,70,' + (0.55 * o.moss) + ')'; c.lineWidth = 6;
    for (let i = 0; i < 9; i++) {
      const mx = -120 + i * 30;
      c.beginPath(); c.moveTo(mx, 60 + (i % 3) * 20); c.quadraticCurveTo(mx + 12, 120 + (i % 4) * 30, mx - 6, 200 + (i % 5) * 20); c.stroke();
    }
  }
  c.restore();
  // 金の襟
  const gold = c.createLinearGradient(0, -10, 0, 110);
  gold.addColorStop(0, '#FEF08A'); gold.addColorStop(0.5, '#FACC15'); gold.addColorStop(1, '#B45309');
  c.strokeStyle = INK3; c.lineWidth = 17;
  c.beginPath(); c.moveTo(-74, -2); c.lineTo(0, 112); c.lineTo(74, -2); c.stroke();
  c.strokeStyle = gold; c.lineWidth = 11; c.stroke();
  // 首
  c.fillStyle = shade(sk.bodyColor, -0.5); c.strokeStyle = INK3; c.lineWidth = 4;
  c.fillRect(-34, -30, 68, 34); c.strokeRect(-34, -30, 68, 34);
  // 頭
  c.save();
  c.translate(0, -96);
  c.rotate(o.tilt || 0);
  const hw = 176, hh = 168;
  const wv = Math.sin(T * 0.05) * 10;
  c.fillStyle = sk.bandColor; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-70, -34); c.quadraticCurveTo(-150, -30 + wv, -210, -10 + wv * 1.6); c.lineTo(-196, 24 + wv * 1.6); c.quadraticCurveTo(-140, wv, -70, -6); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-66, -26); c.quadraticCurveTo(-130, 14 + wv, -176, 62 + wv * 1.4); c.lineTo(-160, 76 + wv * 1.4); c.quadraticCurveTo(-118, 34 + wv, -62, -4); c.closePath(); c.fill(); c.stroke();
  const hg = c.createRadialGradient(-30, -30, 10, 0, 0, 130);
  hg.addColorStop(0, sk.bodyColor); hg.addColorStop(1, shade(sk.bodyColor, -0.4));
  c.fillStyle = hg; c.lineWidth = 6;
  gRR(c, -hw / 2, -hh / 2, hw, hh, 18); c.fill(); c.stroke();
  if (sk.crown) {
    c.fillStyle = '#FFD600'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-46, -hh / 2); c.lineTo(-46, -hh / 2 - 44); c.lineTo(-18, -hh / 2 - 22); c.lineTo(0, -hh / 2 - 52); c.lineTo(18, -hh / 2 - 22); c.lineTo(46, -hh / 2 - 44); c.lineTo(46, -hh / 2); c.closePath(); c.fill(); c.stroke();
  }
  c.fillStyle = sk.bandColor; c.lineWidth = 4;
  c.fillRect(-hw / 2 + 3, -hh / 2 + 22, hw - 6, 30); c.strokeRect(-hw / 2 + 3, -hh / 2 + 22, hw - 6, 30);
  // 目
  const eg = o.eye == null ? 1 : o.eye, cl = o.closed || 0;
  [[-36, 4], [6, 4]].forEach(e => {
    c.save();
    if (eg > 0) { c.shadowColor = sk.eyeColor; c.shadowBlur = 18 * eg; }
    c.fillStyle = sk.eyeColor; c.fillRect(e[0], e[1], 30, 46);
    c.shadowBlur = 0;
    c.fillStyle = '#FFFFFF'; c.fillRect(e[0] + 5, e[1] + 6, 8, 10);
    c.restore();
    if (cl > 0) {
      c.fillStyle = shade(sk.bodyColor, -0.1);
      c.fillRect(e[0] - 1, e[1] - 1, 32, 48 * cl);
      c.strokeStyle = INK3; c.lineWidth = 4;
      c.beginPath(); c.moveTo(e[0] - 1, e[1] + 48 * cl); c.lineTo(e[0] + 31, e[1] + 48 * cl); c.stroke();
    }
  });
  c.strokeStyle = INK3; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-26, 62); c.lineTo(26, 62 + (o.mouth || 0)); c.stroke();
  // 顔の右半分は、影で見えない
  if (o.shadow !== 0) {
    c.save();
    gRR(c, -hw / 2, -hh / 2, hw, hh, 18); c.clip();
    const sg = c.createLinearGradient(-14, 0, 34, 0);
    sg.addColorStop(0, 'rgba(2,2,12,0)');
    sg.addColorStop(1, 'rgba(2,2,12,' + (0.93 * (o.shadow == null ? 1 : o.shadow)) + ')');
    c.fillStyle = sg; c.fillRect(-14, -hh / 2, hw, hh);
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(10, 12, 6, 9);
  }
  c.strokeStyle = 'rgba(255,245,210,0.55)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-hw / 2 + 2, -hh / 2 + 16); c.lineTo(-hw / 2 + 2, hh / 2 - 16); c.stroke();
  c.restore();
  c.restore();
}

// 光の扉
function cnDoor(c, x, by, w, h, p, t) {
  if (p <= 0) return;
  const hh = h * p, ww = w * (0.4 + 0.6 * p);
  c.save();
  c.translate(x, by);
  const g = c.createRadialGradient(0, -hh * 0.5, 10, 0, -hh * 0.5, Math.max(ww, hh) * 1.2);
  g.addColorStop(0, 'rgba(255,245,200,0.9)'); g.addColorStop(1, 'rgba(255,200,120,0)');
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g; c.fillRect(-ww * 1.6, -hh * 1.5, ww * 3.2, hh * 2);
  c.globalCompositeOperation = 'source-over';
  const arch = (hw2, hh2) => {
    c.beginPath();
    c.moveTo(-hw2, 0); c.lineTo(-hw2, -hh2 + hw2); c.arc(0, -hh2 + hw2, hw2, Math.PI, 0); c.lineTo(hw2, 0); c.closePath();
  };
  c.fillStyle = '#1B1626'; arch(ww / 2 + 12, hh + 12); c.fill();
  const lg = c.createLinearGradient(0, -hh, 0, 0);
  lg.addColorStop(0, '#FFFFFF'); lg.addColorStop(0.6, '#FFF1B8'); lg.addColorStop(1, '#F6B94A');
  c.fillStyle = lg; arch(ww / 2, hh); c.fill();
  c.save(); arch(ww / 2, hh); c.clip();
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.28 + Math.sin(t * 0.03 + i) * 0.04;
    c.beginPath(); c.moveTo(0, -hh * 0.45); c.lineTo(Math.cos(a) * hh, -hh * 0.45 + Math.sin(a) * hh); c.stroke();
  }
  c.restore();
  c.restore();
}

// ==========================================
// 2〜3. 出口 → 押さえつけられる → 回転攻撃
// ==========================================
takeFanExit = function () {
  if (fanExitTaken || CN.on) return;
  fanExitTaken = true;
  fanEscaped = true;
  saveFanLoop();
  cnBegin();
};

function cnBegin() {
  CN.on = true; CN.ph = 'enter'; CN.t = 0; CN.ev = {}; CN.parts = []; CN.shake = 0;
  CN.ready = false; CN.pressed = false; CN.skip = false;
  CN.prevBgm = bgmOn;
  bgmOn = false;
  if (bgmCurrent) { bgmCurrent.pause(); bgmCurrent = null; }
  utBox.on = false;
  utEl.style.display = 'none';
  CN.p0x = player.x; CN.p0y = player.y;
  if (!CN.earth) CN.earth = cnMakeEarth();
}

function cnEnd() {
  const was = CN.on;
  CN.on = false; CN.ph = '';
  cineScreen.style.display = 'none';
  cineSpinBtn.style.display = 'none';
  cnDrone(false);
  bgmOn = CN.prevBgm;
  if (!was) return;
  // LOOP: 次の周回へ。進行は最初から
  fanExitTaken = true;
  fanLoop++;
  saveFanLoop();
  fanPlanExit();
  storyProgress.fantasy = 0;
  try { localStorage.setItem('wallKickStoryProgress', JSON.stringify(storyProgress)); } catch (e) {}
  quitGame();
  switchStoryTab('fantasy');
}

function cnTick() {
  try {
    CN.t++;
    const t = CN.t;
    if (CN.ph === 'enter') cnTickEnter(t);
    else if (CN.ph === 'pin') cnTickPin(t);
    else if (CN.ph === 'slash') cnTickSlash(t);
    else if (CN.ph === 'movie') cnTickMovie(t);
  } catch (err) {
    console.error('[cine]', err);
    cnEnd();
  }
}

function cnTickEnter(t) {
  const e = fanExit;
  if (!e) { cnEnd(); return; }
  const dx = e.x + e.w / 2 - player.size / 2, dy = e.y + e.h / 2 - player.size / 2;
  if (t === 1) cnSfx('door');
  if (t > 30) {
    const k = cnEase((t - 30) / 80);
    player.vx = 0; player.vy = 0; player.onWall = null;
    player.x = cnLerp(CN.p0x, dx, k);
    player.y = cnLerp(CN.p0y, dy, k);
    player.squashX = player.squashY = 1 - 0.82 * k;
    player.rotation += 0.32;
    if (t === 60) cnSfx('pull');
  }
  if (t >= 150) {
    CN.ph = 'pin'; CN.t = 0;
    cineScreen.style.display = 'block';
  }
}

function cnTickPin(t) {
  if (t === 1) { cnDrone(true); cnDroneSet(0.05, 160, 48); }
  if (t === 70) { cnSfx('thud'); cnSpawn(16, 320, 636, { a0: Math.PI, a1: Math.PI * 2, sp: 3, life: 40, size: 3, col: '#8A86A0', g: 0.05 }); }
  if (t === 84) cnSfx('whoosh');
  if (t === 108) {
    CN.shake = 28;
    cnSfx('slam');
    cnSpawn(40, 320, 636, { a0: Math.PI, a1: Math.PI * 2, sp: 7, life: 60, size: 4, col: '#A29DBA', g: 0.12 });
  }
  if (t >= 240 && !CN.ready) { CN.ready = true; cineSpinBtn.style.display = 'flex'; }
  if (CN.pressed && CN.ready) {
    CN.ph = 'slash'; CN.t = 0;
    cineSpinBtn.style.display = 'none';
  }
}

function cnTickSlash(s) {
  if (s === 2) cnSfx('slash');
  if (s === 12) CN.shake = 18;
  if (s === 18) { cnSfx('die'); cnSpawn(50, 300, 468, { sp: 7, life: 50, size: 3, col: '#FDE047', glow: true }); }
  if (s >= 40 && s < 140) {
    const edge = cnLerp(0, 575, cnEase((s - 40) / 100));
    cnSpawn(5, 160, edge, { rx: 240, a0: -Math.PI * 0.9, a1: -Math.PI * 0.1, sp: 1.6, life: 80, size: 2.6, col: Math.random() < 0.5 ? '#FFE9A8' : '#BDB6A0', glow: true, up: 0.6 });
  }
  if (s === 70) cnSfx('light');
  if (s >= 150 && s < 225 && s % 8 === 0) cnSfx('step');
  if (s === 226) cnSfx('door2');
  if (s >= 262) cnStartMovie();
}

// ---------- 扉に吸い込まれる（ゲーム画面の上に重ねる）----------
function cnDrawEnter(t) {
  const e = fanExit;
  if (!e) return;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2 - cameraY;
  const k = cnEase(t / 45);
  const grow = 1 + 0.9 * cnEase(t / 35);
  const w = e.w * grow, h = e.h * grow;
  const left = e.side === 'left';
  ctx.save();
  // 光があふれる
  ctx.globalCompositeOperation = 'lighter';
  const rr = 140 * k + 20;
  const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, rr);
  g.addColorStop(0, 'rgba(255,248,210,' + (0.9 * k) + ')'); g.addColorStop(1, 'rgba(255,230,150,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // 開いた戸口
  ctx.fillStyle = '#16111F';
  gRR(ctx, cx - w / 2 - 4, cy - h / 2 - 4, w + 8, h + 8, 6); ctx.fill();
  const lg = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
  lg.addColorStop(0, '#FFFFFF'); lg.addColorStop(1, '#FFD36B');
  ctx.fillStyle = lg;
  gRR(ctx, cx - w / 2, cy - h / 2, w, h, 5); ctx.fill();
  // 扉板（壁側を軸に開く）
  const leaf = w * (1 - k);
  if (leaf > 1) {
    ctx.fillStyle = '#2A2233'; ctx.strokeStyle = INK3; ctx.lineWidth = 2;
    const lx = left ? cx - w / 2 : cx + w / 2 - leaf;
    ctx.fillRect(lx, cy - h / 2, leaf, h); ctx.strokeRect(lx, cy - h / 2, leaf, h);
  }
  // 光の筋
  ctx.strokeStyle = 'rgba(255,245,200,' + (0.6 * k) + ')';
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6 + t * 0.01;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20); ctx.lineTo(cx + Math.cos(a) * (60 + 80 * k), cy + Math.sin(a) * (60 + 80 * k)); ctx.stroke();
  }
  // 吸い込まれる光
  if (t > 40) {
    ctx.strokeStyle = 'rgba(255,240,190,0.7)';
    ctx.lineWidth = 2;
    const q = cnEase((t - 40) / 70);
    for (let i = 0; i < 16; i++) {
      const a = i * 0.39 + t * 0.03;
      const r0 = (1 - q) * 150 + 14;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * (r0 * 0.78), cy + Math.sin(a) * (r0 * 0.78)); ctx.stroke();
    }
  }
  // 白くなる
  if (t > 115) {
    ctx.fillStyle = 'rgba(255,255,255,' + cnClamp((t - 115) / 35) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
}

// ---------- 押さえつけられる／切り裂く ----------
function cnDrawPinScene(c, ph, t) {
  const W = 420, H = 720, FLOOR = 640, HX = 320, HYL = 622;
  let camX = 210, camY = 360, z = 1;
  if (ph === 'pin') {
    const hy0 = t < 70 ? -400 + 1022 * Math.pow(t / 70, 2) : HYL;
    if (t < 70) { camX = HX; camY = hy0; z = 2.0; }
    else if (t < 110) { camX = HX; camY = 590; z = 2.0; }
    else { const k = cnEase((t - 110) / 110); camX = cnLerp(HX, 210, k); camY = cnLerp(590, 360, k); z = cnLerp(2.0, 1.0, k); }
  }
  const bg = c.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#05040C'); bg.addColorStop(0.62, '#130E24'); bg.addColorStop(1, '#050409');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  cnStarsDraw(c, t, 0.3, (ph === 'pin' && t < 70) ? 16 : 0);
  let sx = 0, sy = 0;
  if (CN.shake > 0) {
    sx = (Math.random() - 0.5) * CN.shake; sy = (Math.random() - 0.5) * CN.shake;
    CN.shake *= 0.9; if (CN.shake < 0.4) CN.shake = 0;
  }
  const s0 = ph === 'slash' ? t : 0;

  c.save();
  c.translate(210 + sx, 360 + sy); c.scale(z, z); c.translate(-camX, -camY);

  // 光の筋
  c.save(); c.globalCompositeOperation = 'lighter';
  [60, 205, 345].forEach((bx, i) => {
    const g = c.createLinearGradient(0, -2400, 0, FLOOR);
    g.addColorStop(0, 'rgba(120,140,220,0)'); g.addColorStop(1, 'rgba(120,140,220,' + (0.10 + 0.04 * Math.sin(t * 0.03 + i)) + ')');
    c.fillStyle = g; c.fillRect(bx - 34, -2400, 68, 2400 + FLOOR);
  });
  c.restore();
  // 床
  const fg = c.createLinearGradient(0, FLOOR, 0, FLOOR + 500);
  fg.addColorStop(0, '#2A2438'); fg.addColorStop(1, '#07060C');
  c.fillStyle = fg; c.fillRect(-800, FLOOR, 2000, 900);
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(-800, FLOOR, 2000, 3);
  if (ph === 'pin' && t >= 108) {
    // ひび割れと衝撃波
    c.strokeStyle = 'rgba(0,0,0,0.85)'; c.lineWidth = 3;
    const rng = cnRng(7);
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * Math.PI, L = 90 + rng() * 150;
      c.beginPath(); c.moveTo(HX, FLOOR + 3);
      c.lineTo(HX + Math.cos(a) * L * 0.5, FLOOR + 3 + Math.sin(a) * L * 0.12 + (rng() - 0.5) * 6);
      c.lineTo(HX + Math.cos(a) * L, FLOOR + 3 + Math.sin(a) * L * 0.3);
      c.stroke();
    }
    const sp = (t - 108) * 9;
    if (sp < 420) { c.strokeStyle = 'rgba(255,255,255,' + (0.5 * (1 - sp / 420)) + ')'; c.lineWidth = 3; c.beginPath(); c.ellipse(HX, FLOOR + 4, sp, sp * 0.14, 0, 0, Math.PI * 2); c.stroke(); }
  }

  // 光の扉（巨人が消えるあと）
  if (ph === 'slash') cnDoor(c, 140, 618, 130, 250, cnEase((s0 - 70) / 60), t);

  // 巨人
  let edge = -9999, shk = 0, tilt = Math.sin(t * 0.02) * 0.02, eye = 1;
  if (ph === 'slash' && s0 >= 16) {
    tilt = -0.28 * cnEase((s0 - 16) / 12);
    eye = s0 < 30 ? 2 : Math.max(0, 1 - (s0 - 30) / 40);
    shk = s0 < 60 ? 3 : 0;
    if (s0 >= 40) edge = cnLerp(0, 575, cnEase((s0 - 40) / 100));
  }
  const giantVisible = !(ph === 'slash' && edge >= 560);
  const bob = Math.sin(t * 0.05) * 2;
  const withGiantClip = fn => {
    c.save();
    if (edge > -9000) { c.beginPath(); c.rect(-300, edge, 1200, 3000); c.clip(); }
    fn();
    c.restore();
  };
  if (giantVisible) {
    withGiantClip(() => {
      c.translate((Math.random() - 0.5) * shk, 0);
      cnGiant(c, 130, 215 + bob, 1, { t: t, tilt: tilt, eye: eye });
    });
  }

  // 主人公
  const hs0 = 1.15;
  let heroX = HX, heroCY = FLOOR - 16, hsx = 1, hsy = 1, hrot = 0, hs = hs0, ha = 1;
  if (ph === 'pin') {
    if (t < 70) { heroCY = -400 + 1022 * Math.pow(t / 70, 2); hrot = t * 0.13; }
    else if (t < 108) { hsx = 1.2; hsy = 0.72; heroCY = FLOOR - 14 * hs * hsy - 2; }
    else { hsx = 1.5; hsy = 0.38 + 0.03 * Math.sin(t * 0.3); heroCY = FLOOR - 14 * hs * hsy - 2; }
  } else {
    const k0 = cnEase(s0 / 8);
    hsx = cnLerp(1.5, 1, k0); hsy = cnLerp(0.38, 1, k0);
    if (s0 < 30) { hrot = s0 * 0.9; heroCY = FLOOR - 14 * hs * hsy - 2 - 22 * Math.sin(s0 / 30 * Math.PI); }
    else if (s0 < 150) heroCY = FLOOR - 14 * hs - 2;
    else if (s0 < 228) {
      const k = cnEase((s0 - 150) / 75);
      heroX = cnLerp(HX, 150, k); hs = cnLerp(hs0, 0.5, k);
      heroCY = cnLerp(FLOOR - 14 * hs0 - 2, 600, k) - Math.abs(Math.sin(s0 * 0.4)) * 6;
    } else ha = 0;
  }
  if (ha > 0) cnHero(c, heroX, heroCY, hs, { sx: hsx, sy: hsy, rot: hrot, alpha: ha, t: t });

  // 回転攻撃の刃
  if (ph === 'slash' && s0 < 34) {
    const k = s0 / 34;
    c.save(); c.translate(HX, FLOOR - 30); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      c.strokeStyle = 'rgba(' + (i ? '255,255,255' : '125,235,255') + ',' + (0.9 * (1 - k)) + ')';
      c.lineWidth = 8 - i * 2.5;
      c.beginPath(); c.arc(0, 0, 30 + k * 110 + i * 8, s0 * 0.6 + i, s0 * 0.6 + i + Math.PI * 1.3); c.stroke();
    }
    c.restore();
  }

  // 天の手
  let handY = 468;
  if (ph === 'pin') {
    if (t < 82) handY = -420;
    else if (t < 108) handY = -420 + 888 * Math.pow((t - 82) / 26, 2);
    else handY = 468 + (t > 240 ? Math.sin(t * 0.2) * 1.5 : 0);
  }
  const handCurl = 0.05;
  const drawHand = (alpha, offX, offY) => {
    c.save();
    if (ph === 'slash' || t >= 108) { c.beginPath(); c.rect(-400, 250, 1400, 3000); c.clip(); }
    c.globalAlpha = alpha;
    c.translate(300 + offX, handY + offY);
    c.rotate(-0.12);
    drawGiantHandBack(c, 0, 0, 1.15, handCurl);
    drawGiantHandFront(c, 0, 0, 1.15, handCurl);
    c.restore();
  };
  if (!(ph === 'slash' && s0 >= 100)) {
    if (ph === 'slash' && s0 >= 18) {
      const d = (s0 - 18) * 1.6, al = Math.max(0, 1 - (s0 - 18) / 80);
      const P = [300, 468], dir = [0.857, -0.514];
      [[-0.514, -0.857], [0.514, 0.857]].forEach(n => {
        c.save();
        c.beginPath();
        c.moveTo(P[0] - dir[0] * 900, P[1] - dir[1] * 900);
        c.lineTo(P[0] + dir[0] * 900, P[1] + dir[1] * 900);
        c.lineTo(P[0] + dir[0] * 900 + n[0] * 1800, P[1] + dir[1] * 900 + n[1] * 1800);
        c.lineTo(P[0] - dir[0] * 900 + n[0] * 1800, P[1] - dir[1] * 900 + n[1] * 1800);
        c.closePath(); c.clip();
        drawHand(al, n[0] * d, n[1] * d);
        c.restore();
      });
      if (s0 < 50) {
        c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = 'rgba(255,240,170,' + (1 - (s0 - 18) / 32) + ')'; c.lineWidth = 12 * (1 - (s0 - 18) / 32) + 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(P[0] - dir[0] * 190, P[1] - dir[1] * 190); c.lineTo(P[0] + dir[0] * 190, P[1] + dir[1] * 190); c.stroke();
        c.restore();
      }
    } else drawHand(1, 0, 0);
  }
  // 切り裂く線（一閃）
  if (ph === 'slash' && s0 >= 8 && s0 < 20) {
    const p = cnClamp((s0 - 8) / 8);
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,255,255,' + (1 - (s0 - 8) / 12) + ')'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(130, 570); c.lineTo(130 + 340 * p, 570 - 204 * p); c.stroke();
    c.restore();
  }
  // 肩当て（手と巨人のつなぎ目）
  if (giantVisible) {
    withGiantClip(() => {
      c.save(); c.translate(282, 252);
      const pg = c.createLinearGradient(-50, -26, 50, 26);
      pg.addColorStop(0, '#FEF08A'); pg.addColorStop(0.5, '#FACC15'); pg.addColorStop(1, '#92400E');
      c.fillStyle = '#3B3750'; c.strokeStyle = INK3; c.lineWidth = 4;
      c.beginPath(); c.ellipse(0, 0, 58, 32, 0.2, 0, Math.PI * 2); c.fill(); c.stroke();
      c.strokeStyle = pg; c.lineWidth = 6;
      c.beginPath(); c.ellipse(0, 0, 50, 26, 0.2, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      c.restore();
    });
  }

  // 押さえている間、ボタンを押せるサイン
  if (ph === 'pin' && CN.ready) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const pr = 0.5 + 0.5 * Math.sin(t * 0.18);
    c.strokeStyle = 'rgba(125,235,255,' + (0.35 + 0.4 * pr) + ')'; c.lineWidth = 3;
    c.beginPath(); c.arc(HX, FLOOR - 16, 30 + pr * 10, 0, Math.PI * 2); c.stroke();
    c.restore();
  }
  cnParts(c);
  c.restore();
  cnVig(c, 0.6);
  // 白からの導入／白への退場
  let w = 0;
  if (ph === 'pin') w = Math.max(0, 1 - t / 40);
  else if (ph === 'slash' && s0 >= 215) w = cnClamp((s0 - 215) / 45);
  else if (ph === 'slash' && s0 >= 16 && s0 < 22) w = 0.4 * (1 - (s0 - 16) / 6);
  if (w > 0) { c.fillStyle = 'rgba(255,255,255,' + w + ')'; c.fillRect(0, 0, W, H); }
}

// ==========================================
// 4. ムービー（テキストUIなし）
// ==========================================
function cnBossNames() {
  const seen = {};
  return BOSS_ORDER.filter(n => {
    if (n === EXTRA_BOSS || n === FAN_BOSS || seen[n]) return false;
    seen[n] = true;
    return true;
  });
}
function cnMakeCracks() {
  const r = cnRng(31), list = [];
  for (let i = 0; i < 16; i++) {
    const left = i % 2 === 0;
    let x = left ? r() * 30 : 420 - r() * 30, y = 120 + r() * 480;
    const pts = [[x, y]];
    for (let k = 0; k < 7; k++) { x += (left ? 1 : -1) * (10 + r() * 22); y += (r() - 0.5) * 50; pts.push([x, y]); }
    list.push(pts);
  }
  return list;
}
function cnMakeEarth() {
  const r = cnRng(99), blobs = [], clouds = [];
  for (let b = 0; b < 10; b++) {
    const cx = r() * 1000, cy = (r() - 0.5) * 1.5 * 330, rad = 70 + r() * 110, pts = [];
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, rr = rad * (0.6 + r() * 0.6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7]); }
    blobs.push(pts);
  }
  for (let i = 0; i < 26; i++) clouds.push([r() * 1000, (r() - 0.5) * 600, 30 + r() * 70, 6 + r() * 10]);
  return { blobs: blobs, clouds: clouds };
}

function cnStartMovie() {
  CN.ph = 'movie'; CN.t = 0; CN.parts = []; CN.shake = 0; CN.ev = {};
  CN.spawned = []; CN.shots = []; CN.marks = [];
  CN.bosses = cnBossNames();
  CN.cracks = cnMakeCracks();
  if (!CN.earth) CN.earth = cnMakeEarth();
  cnDroneSet(0.06, 200, 55);
}

// 宇宙の場面の、手の動き
function cnSpaceHand(tt) {
  const wave = Math.floor(tt / 150), wp = (tt % 150) / 150;
  return {
    hx: -130 + 200 * Math.sin(Math.PI * wp),
    hy: [300, 200, 380, 270][wave % 4] + Math.sin(tt * 0.04) * 10,
    curl: 0.55 * (1 - Math.sin(Math.PI * wp))
  };
}

function cnLaunch(name, i, tt) {
  const h = cnSpaceHand(tt);
  const r = Math.random();
  let tx, ty, kind;
  if (r < 0.55) {
    const a = Math.PI * (1.12 + Math.random() * 0.76), rr = 330 * (0.25 + Math.random() * 0.65);
    tx = 210 + Math.cos(a) * rr; ty = 700 + Math.sin(a) * rr; kind = 'earth';
    if (ty > 690) ty = 690;
  } else if (r < 0.65) { tx = 330 + (Math.random() - 0.5) * 40; ty = 150 + (Math.random() - 0.5) * 40; kind = 'moon'; }
  else if (r < 0.75) { tx = 70 + (Math.random() - 0.5) * 24; ty = 200 + (Math.random() - 0.5) * 24; kind = 'mars'; }
  else if (r < 0.85) { tx = 90 + (Math.random() - 0.5) * 30; ty = 340 + (Math.random() - 0.5) * 30; kind = 'saturn'; }
  else { tx = 40 + Math.random() * 340; ty = 40 + Math.random() * 260; kind = 'space'; }
  const x0 = h.hx + 156, y0 = h.hy + (Math.random() - 0.5) * 70;
  CN.shots.push({
    name: name, t0: tt, dur: 70 + Math.floor(Math.random() * 40), x0: x0, y0: y0, x1: tx, y1: ty,
    cx: (x0 + tx) / 2 + (Math.random() - 0.5) * 160, cy: Math.min(y0, ty) - 60 - Math.random() * 120, kind: kind, trail: []
  });
  cnNoise(0.35, 0.03, 'bandpass', 800, 2500, 0);
}

function cnTickMovie(m) {
  if (CN.skip && m < 4090) { CN.t = m = 4090; CN.skip = false; }
  const ev = CN.ev;
  // 廊下: 足音と、大きくなる地鳴り
  if (m < 1060 && m % 26 === 0) { const g = cnEase((m - 250) / 810); cnTone('sine', 80 - 20 * g, 40, 0, 0.14, 0.12 + 0.12 * g); }
  if (m === 300) cnDroneSet(0.09, 260, 46);
  if (m === 700) cnDroneSet(0.13, 340, 40);
  if (m === 1075) {
    cnSfx('shatter'); CN.shake = 24;
    for (let i = 0; i < 70; i++) cnSpawn(1, 60 + Math.random() * 300, 60, { a0: Math.PI * 0.2, a1: Math.PI * 0.8, sp: 6, life: 70, size: 7, col: i % 2 ? '#B9C4E6' : '#FFFFFF', g: 0.25, glow: i % 3 === 0 });
  }
  if (m === 1100) { cnDroneSet(0.05, 180, 52); cnNoise(8, 0.05, 'bandpass', 300, 520, 0); }
  if (m === 1350) cnTone('sine', 110, 110, 0, 3.2, 0.09);
  if (m >= 1650 && m < 1950) {
    if (m === 1650) cnNoise(5, 0.1, 'highpass', 400, 6000, 0);
    if (m % Math.max(4, Math.round(22 - (m - 1650) / 17)) === 0) cnTone('square', 1500, 1500, 0, 0.03, 0.05);
  }
  if (m === 1950) { cnDroneSet(0.07, 420, 62); cnTone('sine', 523, 523, 0, 2.6, 0.05); cnTone('sine', 784, 784, 0.2, 2.4, 0.04); cnTone('sine', 1046, 1046, 0.4, 2.2, 0.03); }
  // 宇宙: ボスを星々へ散らす
  if (m >= 1950 && m < 2550) {
    const tt = m - 1950;
    CN.bosses.forEach((n, i) => {
      if (!CN.spawned[i] && tt >= 24 + i * 12) { CN.spawned[i] = true; cnLaunch(n, i, tt); }
    });
    for (let i = CN.shots.length - 1; i >= 0; i--) {
      const s = CN.shots[i];
      const u = (tt - s.t0) / s.dur;
      if (u >= 1) {
        CN.marks.push({ x: s.x1, y: s.y1, name: s.name, t0: tt });
        cnSpawn(10, s.x1, s.y1, { sp: 2.4, life: 40, size: 2.5, col: '#FFE9A8', glow: true });
        cnTone('sine', 90, 40, 0, 0.25, 0.06);
        CN.shots.splice(i, 1);
      } else {
        const v = 1 - u, bx = v * v * s.x0 + 2 * v * u * s.cx + u * u * s.x1, by = v * v * s.y0 + 2 * v * u * s.cy + u * u * s.y1;
        s.x = bx; s.y = by;
        s.trail.push([bx, by]); if (s.trail.length > 12) s.trail.shift();
      }
    }
  }
  // 否愚魔を握りつぶす
  if (m === 2550) cnDroneSet(0.09, 160, 40);
  if (m >= 2550 && m < 3000) {
    const tt = m - 2550;
    if (tt === 260) exCrushSound();
    if (tt > 260 && tt < 312 && tt % 3 === 0) cnSpawn(3, 210 + (Math.random() - 0.5) * 70, 500 + (Math.random() - 0.5) * 50, { sp: 5, life: 46, size: 3, col: '#B91C1C', g: 0.22, a0: -Math.PI, a1: 0 });
    if (tt === 312) {
      CN.shake = 26;
      cnSpawn(50, 210, 500, { sp: 8, life: 60, size: 4, col: '#7F1D1D', g: 0.2 });
      cnSpawn(30, 210, 500, { sp: 5, life: 80, size: 3, col: '#FDE047', glow: true });
    }
    if (tt > 330 && tt % 4 === 0) cnSpawn(1, 210 + (Math.random() - 0.5) * 80, 520, { a0: -Math.PI * 0.9, a1: -Math.PI * 0.1, sp: 1.2, life: 90, size: 2.4, col: '#FDBA74', glow: true });
  }
  // 待つ
  if (m === 3000) { cnDroneSet(0.05, 300, 70); cnNoise(10, 0.05, 'bandpass', 400, 700, 0); }
  if (m >= 3000 && m < 3700 && (m - 3000) % 140 === 0) cnTone('triangle', [392, 440, 523, 587, 659][((m - 3000) / 140) % 5], 0, 0, 2.2, 0.05);
  if (m >= 3000 && m < 3700 && m % 4 === 0) {
    const tt = m - 3000, snow = Math.max(0, Math.sin(tt * 0.011)) > 0.4;
    cnSpawn(1, Math.random() * 420, -10, { a0: Math.PI * 0.4, a1: Math.PI * 0.6, sp: 1.4, life: 400, size: snow ? 3 : 4, col: snow ? '#FFFFFF' : (Math.random() < 0.5 ? '#E08A3A' : '#8FB04A'), g: 0.005 });
  }
  if (m === 3950) cnDroneSet(0.16, 500, 38);
  if (m >= 3950 && m < 4090 && (m - 3950) % 50 === 0) { cnTone('sine', 70, 38, 0, 0.14, 0.3); cnTone('sine', 70, 38, 0.2, 0.14, 0.22); }
  if (m === 4030) cnTone('sawtooth', 55, 220, 0, 2.2, 0.1);
  if (m >= 4150) cnEnd();
}

// ---------- 場面1: 無限の廊下 ----------
function cnCorridor(c, m) {
  const VPx = 210, VPy = 292 + Math.sin(m * 0.16) * 2.5, S = 360;
  const g = cnEase((m - 250) / 810);
  const ms = 1 + g * 9.2;
  const D = m * 0.05;
  c.save();
  if (ms > 7) c.translate((Math.random() - 0.5) * (ms - 7) * 2.2, (Math.random() - 0.5) * (ms - 7) * 2.2);
  const bg = c.createLinearGradient(0, 0, 0, 720);
  bg.addColorStop(0, '#04060F'); bg.addColorStop(1, '#0A0D1C');
  c.fillStyle = bg; c.fillRect(-20, -20, 460, 760);
  const nx0 = VPx - 0.66 * S, nx1 = VPx + 0.66 * S, nyT = VPy - 0.80 * S, nyB = VPy + 0.85 * S;
  const wl = c.createLinearGradient(nx0, 0, VPx, 0); wl.addColorStop(0, '#0B0F1E'); wl.addColorStop(1, '#2A3558');
  c.fillStyle = wl; c.beginPath(); c.moveTo(nx0, nyT); c.lineTo(VPx, VPy); c.lineTo(nx0, nyB); c.closePath(); c.fill();
  const wr = c.createLinearGradient(nx1, 0, VPx, 0); wr.addColorStop(0, '#0B0F1E'); wr.addColorStop(1, '#2A3558');
  c.fillStyle = wr; c.beginPath(); c.moveTo(nx1, nyT); c.lineTo(VPx, VPy); c.lineTo(nx1, nyB); c.closePath(); c.fill();
  const cg = c.createLinearGradient(0, nyT, 0, VPy); cg.addColorStop(0, '#080B18'); cg.addColorStop(1, '#222C4C');
  c.fillStyle = cg; c.beginPath(); c.moveTo(nx0, nyT); c.lineTo(nx1, nyT); c.lineTo(VPx, VPy); c.closePath(); c.fill();
  const fg = c.createLinearGradient(0, VPy, 0, nyB); fg.addColorStop(0, '#2A3558'); fg.addColorStop(1, '#0C1020');
  c.fillStyle = fg; c.beginPath(); c.moveTo(nx0, nyB); c.lineTo(nx1, nyB); c.lineTo(VPx, VPy); c.closePath(); c.fill();
  // 奥の光
  c.save(); c.globalCompositeOperation = 'lighter';
  const vg = c.createRadialGradient(VPx, VPy, 2, VPx, VPy, 230);
  vg.addColorStop(0, 'rgba(215,230,255,0.9)'); vg.addColorStop(0.2, 'rgba(150,180,255,0.35)'); vg.addColorStop(1, 'rgba(60,80,160,0)');
  c.fillStyle = vg; c.fillRect(0, 0, 420, 720);
  c.restore();
  // 肋材（無限に流れてくる）
  const N = 20;
  for (let i = N; i >= 0; i--) {
    const d = i - (D % 1);
    if (d < 0.02) continue;
    const p = 1 / (1 + d * 0.42);
    const x0 = VPx - 0.66 * S * p, x1 = VPx + 0.66 * S * p, yT = VPy - 0.80 * S * p, yB = VPy + 0.85 * S * p;
    const fog = cnClamp(1 - d / N);
    c.strokeStyle = 'rgba(150,175,255,' + (0.55 * fog * fog + 0.04) + ')'; c.lineWidth = 1 + 5 * p;
    c.strokeRect(x0, yT, x1 - x0, yB - yT);
    c.strokeStyle = 'rgba(255,255,255,' + (0.18 * fog * fog) + ')'; c.lineWidth = Math.max(1, 2 * p);
    c.strokeRect(x0 + 6 * p, yT + 6 * p, x1 - x0 - 12 * p, yB - yT - 12 * p);
    c.fillStyle = 'rgba(220,235,255,' + (0.35 * fog) + ')'; c.fillRect(VPx - 0.16 * S * p, yT + 0.03 * S * p, 0.32 * S * p, 0.035 * S * p);
    c.fillStyle = 'rgba(200,220,255,' + (0.12 * fog) + ')'; c.fillRect(VPx - 0.04 * S * p, yB - 0.02 * S * p, 0.08 * S * p, 0.02 * S * p);
  }
  // 主人公（後ろ姿。だんだん大きくなる）
  const ph = 1 / (1 + 0.5 * 0.42);
  const footY = VPy + 0.85 * S * ph;
  const size = 0.17 * S * ph * ms;
  const hg = c.createRadialGradient(VPx, footY - size * 0.6, 4, VPx, footY - size * 0.6, size * 1.2);
  hg.addColorStop(0, 'rgba(190,210,255,0.35)'); hg.addColorStop(1, 'rgba(190,210,255,0)');
  c.fillStyle = hg; c.fillRect(0, 0, 420, 720);
  cnHeroBack(c, VPx, footY, size, m);
  // 壁にひびが入る
  if (ms > 5.5) {
    const a = cnClamp((ms - 5.5) / 3);
    c.strokeStyle = 'rgba(0,0,0,' + (0.9 * a) + ')'; c.lineWidth = 3;
    CN.cracks.forEach(pts => { c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke(); });
    c.strokeStyle = 'rgba(255,255,255,' + (0.35 * a) + ')'; c.lineWidth = 1;
    CN.cracks.forEach(pts => { c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0] + 1, q[1] + 1) : c.moveTo(q[0] + 1, q[1] + 1))); c.stroke(); });
  }
  // 舞う塵
  if (m % 2 === 0) cnSpawn(1, VPx + (Math.random() - 0.5) * 30, VPy + (Math.random() - 0.5) * 20, { sp: 2.2, life: 70, size: 1.8, col: '#BFD0FF', glow: true });
  cnParts(c);
  c.restore();
}

// ---------- 場面2: 巨人が待つ → 時が戻る ----------
function cnPlain(c, t) {
  const W = 420, H = 720;
  const rewU = Math.max(0, t - 550);
  const rew = cnEase(rewU / 300);
  const tm = t < 550 ? t : 550 - (rewU + 0.008 * rewU * rewU);
  const zoom = 1 + 0.07 * cnEase(t / 800);
  c.save();
  c.translate(210, 360); c.scale(zoom, zoom); c.translate(-210, -360);
  c.globalAlpha = rew > 0 ? 1 - 0.55 * rew : 1;
  const sg = c.createLinearGradient(0, -40, 0, 520);
  sg.addColorStop(0, '#12051C'); sg.addColorStop(0.35, '#59122E'); sg.addColorStop(0.68, '#CC5A22'); sg.addColorStop(1, '#F6AC52');
  c.fillStyle = sg; c.fillRect(-40, -40, W + 80, 560);
  c.globalAlpha = 1;
  const cx0 = 170, cy0 = 215;
  c.save(); c.globalCompositeOperation = 'lighter';
  const co = c.createRadialGradient(cx0, cy0, 90, cx0, cy0, 260);
  co.addColorStop(0, 'rgba(255,170,70,0.85)'); co.addColorStop(0.35, 'rgba(255,110,40,0.35)'); co.addColorStop(1, 'rgba(255,90,30,0)');
  c.fillStyle = co; c.beginPath(); c.arc(cx0, cy0, 260, 0, 6.283); c.fill();
  c.restore();
  c.fillStyle = '#07030A'; c.beginPath(); c.arc(cx0, cy0, 96, 0, 6.283); c.fill();
  // 時計（針だけ。文字はない）
  const ca = cnEase((t - 250) / 120);
  if (ca > 0) {
    c.save(); c.translate(cx0, cy0); c.globalAlpha = ca * 0.9; c.strokeStyle = '#F5D77A'; c.lineCap = 'round';
    c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 178, 0, 6.283); c.stroke();
    c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 168, 0, 6.283); c.stroke();
    for (let i = 0; i < 60; i++) {
      const a = i * Math.PI / 30, l = i % 5 === 0 ? 16 : 7;
      c.lineWidth = i % 5 === 0 ? 3 : 1.5;
      c.beginPath(); c.moveTo(Math.cos(a) * (178 - l), Math.sin(a) * (178 - l)); c.lineTo(Math.cos(a) * 178, Math.sin(a) * 178); c.stroke();
    }
    const ma = tm * 0.02 - Math.PI / 2, ha = tm * 0.02 / 12 - Math.PI / 2;
    c.strokeStyle = '#FFE9A8'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ma) * 150, Math.sin(ma) * 150); c.stroke();
    c.lineWidth = 8; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ha) * 100, Math.sin(ha) * 100); c.stroke();
    c.restore();
  }
  // 雲
  for (let L = 0; L < 3; L++) {
    for (let i = 0; i < 6; i++) {
      const x = cnMod(i * 190 + tm * (0.25 + L * 0.2) + L * 70, 760) - 170;
      const y = 330 + L * 62 + (i % 2) * 14;
      c.fillStyle = 'rgba(' + (60 - L * 10) + ',' + (18 + L * 4) + ',' + (40 + L * 6) + ',' + (0.55 - L * 0.08) + ')';
      c.beginPath(); c.ellipse(x, y, 170 + L * 30, 18 + L * 6, 0, 0, 6.283); c.fill();
    }
  }
  // 山と大地
  c.fillStyle = '#12060F';
  c.beginPath(); c.moveTo(-10, 520);
  [[40, 470], [110, 505], [190, 455], [270, 510], [350, 470], [430, 515]].forEach(p => c.lineTo(p[0], p[1]));
  c.lineTo(430, 720); c.lineTo(-10, 720); c.closePath(); c.fill();
  const gg = c.createLinearGradient(0, 500, 0, 720); gg.addColorStop(0, '#1B0A14'); gg.addColorStop(1, '#050206');
  c.fillStyle = gg; c.fillRect(-10, 520, 440, 200);
  c.strokeStyle = 'rgba(255,120,40,' + (0.5 + 0.3 * Math.sin(tm * 0.04)) + ')'; c.lineWidth = 2;
  for (let k = 0; k < 5; k++) {
    c.beginPath(); c.moveTo(60 + k * 80, 720);
    for (let j = 1; j <= 5; j++) c.lineTo(60 + k * 80 + ((j % 2) ? 14 : -10), 720 - j * 36);
    c.stroke();
  }
  // 火の粉（時が戻ると、逆に落ちる）
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    const x = cnMod(i * 53 + Math.sin(tm * 0.02 + i) * 14, 420);
    const y = 740 - cnMod(tm * 0.9 + i * 67, 780);
    c.fillStyle = 'rgba(255,170,80,' + (0.25 + 0.5 * Math.abs(Math.sin(i + tm * 0.05))) + ')';
    c.fillRect(x, y, 2.2, 2.2);
  }
  c.restore();
  // 掲げた天の手
  c.save();
  c.beginPath(); c.rect(-100, -300, 700, 707); c.clip();
  c.translate(366, 150); c.rotate(Math.PI + 0.12);
  const hc = 0.08 + 0.1 * Math.sin(tm * 0.03);
  drawGiantHandBack(c, 0, 0, 0.95, hc); drawGiantHandFront(c, 0, 0, 0.95, hc);
  c.restore();
  // 巨人
  cnGiant(c, 170, 330, 1.25, { t: tm, eye: 0.9 + 0.1 * Math.sin(tm * 0.07) });
  c.save(); c.translate(360, 407);
  c.fillStyle = '#3B3750'; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath(); c.ellipse(0, 0, 66, 36, 0.2, 0, Math.PI * 2); c.fill(); c.stroke();
  c.strokeStyle = '#FACC15'; c.lineWidth = 6; c.beginPath(); c.ellipse(0, 0, 57, 29, 0.2, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
  c.restore();
  c.restore();
  // 時が戻る
  if (rew > 0) {
    c.fillStyle = 'rgba(90,140,220,' + (0.30 * rew) + ')'; c.fillRect(0, 0, W, H);
    if (rew > 0.5) {
      c.save(); c.strokeStyle = 'rgba(255,255,255,' + (0.35 * (rew - 0.5) * 2) + ')'; c.lineWidth = 2;
      for (let i = 0; i < 34; i++) {
        const a = i * 0.185 + t * 0.01, r0 = 120 + (i % 5) * 30, r1 = r0 + 160 + (rew - 0.5) * 600;
        c.beginPath(); c.moveTo(210 + Math.cos(a) * r0, 360 + Math.sin(a) * r0); c.lineTo(210 + Math.cos(a) * r1, 360 + Math.sin(a) * r1); c.stroke();
      }
      c.restore();
    }
  }
}

// ---------- 場面3: 宇宙。ボスを散らす ----------
function cnPlanet(c, x, y, r, col, o) {
  o = o || {};
  c.save();
  if (o.atmo) {
    const ag = c.createRadialGradient(x, y, r * 0.9, x, y, r * 1.25);
    ag.addColorStop(0, hexToRgba(o.atmo, 0.55)); ag.addColorStop(1, hexToRgba(o.atmo, 0));
    c.fillStyle = ag; c.beginPath(); c.arc(x, y, r * 1.25, 0, 6.283); c.fill();
  }
  c.beginPath(); c.arc(x, y, r, 0, 6.283); c.clip();
  const lx = x - r * 0.45, ly = y - r * 0.5;
  const g = c.createRadialGradient(lx, ly, r * 0.1, x, y, r * 1.15);
  g.addColorStop(0, shade(col, 0.45)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.75));
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  if (o.draw) o.draw(c, x, y, r);
  const tg = c.createRadialGradient(lx, ly, r * 0.6, lx, ly, r * 2.1);
  tg.addColorStop(0, 'rgba(0,0,0,0)'); tg.addColorStop(1, 'rgba(0,0,8,0.78)');
  c.fillStyle = tg; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
}
function cnEarthFeat(c, x, y, r) {
  const off = (CN.earthOff || 0) % 1000;
  for (let k = -1; k <= 1; k++) {
    c.save();
    c.translate(x - 500 - off + k * 1000, y);
    c.fillStyle = '#3E9150';
    CN.earth.blobs.forEach(p => { c.beginPath(); p.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,0.45)';
    CN.earth.clouds.forEach(q => { c.beginPath(); c.ellipse(q[0], q[1], q[2], q[3], 0, 0, 6.283); c.fill(); });
    c.restore();
  }
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath(); c.ellipse(x, y - r * 0.98, r * 0.5, r * 0.1, 0, 0, 6.283); c.fill();
}
function cnBossSprite(c, name, x, y, sz, a) {
  const g = getBossGif(name);
  c.save(); c.globalAlpha = a; c.translate(x, y);
  if (g) {
    const w = sz * g.naturalWidth / g.naturalHeight;
    c.drawImage(g, -w / 2, -sz / 2, w, sz);
  } else {
    const th = BOSS_THEMES[name] || DEFAULT_THEME;
    c.fillStyle = th.body; c.strokeStyle = INK3; c.lineWidth = Math.max(1.5, sz * 0.06);
    gRR(c, -sz * 0.42, -sz * 0.38, sz * 0.84, sz * 0.76, sz * 0.14); c.fill(); c.stroke();
    c.fillStyle = INK3; c.fillRect(-sz * 0.24, -sz * 0.1, sz * 0.16, sz * 0.12); c.fillRect(sz * 0.08, -sz * 0.1, sz * 0.16, sz * 0.12);
    c.fillStyle = th.orb || '#FFD600'; c.fillRect(-sz * 0.2, -sz * 0.07, sz * 0.08, sz * 0.06); c.fillRect(sz * 0.12, -sz * 0.07, sz * 0.08, sz * 0.06);
  }
  c.restore();
}

function cnSpace(c, tt) {
  const W = 420, H = 720;
  CN.earthOff = tt * 0.25;
  const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#02030C'); bg.addColorStop(1, '#080A1E');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = 'lighter';
  [[110, 160, 260, '80,40,160', 0.22], [320, 300, 220, '20,110,150', 0.18], [200, 520, 300, '120,40,90', 0.14]].forEach(n => {
    const g = c.createRadialGradient(n[0], n[1], 10, n[0], n[1], n[2]);
    g.addColorStop(0, 'rgba(' + n[3] + ',' + n[4] + ')'); g.addColorStop(1, 'rgba(' + n[3] + ',0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  });
  // 太陽の光
  const sf = c.createRadialGradient(-10, 40, 4, -10, 40, 330);
  sf.addColorStop(0, 'rgba(255,250,220,0.95)'); sf.addColorStop(0.15, 'rgba(255,220,150,0.35)'); sf.addColorStop(1, 'rgba(255,200,120,0)');
  c.fillStyle = sf; c.fillRect(0, 0, W, H);
  c.restore();
  cnStarsDraw(c, tt, 0.85, 0);
  // 惑星
  cnPlanet(c, 330, 150, 34, '#9CA3AF', { draw: (cx, x, y, r) => { cx.fillStyle = 'rgba(60,60,70,0.5)'; [[-10, -8, 8], [8, 6, 6], [-4, 14, 5], [12, -14, 4]].forEach(q => { cx.beginPath(); cx.arc(x + q[0], y + q[1], q[2], 0, 6.283); cx.fill(); }); } });
  cnPlanet(c, 70, 200, 20, '#C2410C', { atmo: '#F97316', draw: (cx, x, y, r) => { cx.fillStyle = 'rgba(80,20,10,0.45)'; cx.beginPath(); cx.ellipse(x - 4, y + 3, 10, 4, 0.3, 0, 6.283); cx.fill(); } });
  // 土星（リングの奥 → 本体 → リングの手前）
  c.save(); c.translate(90, 340); c.rotate(-0.35);
  c.strokeStyle = 'rgba(230,210,160,0.7)'; c.lineWidth = 5; c.beginPath(); c.ellipse(0, 0, 58, 12, 0, Math.PI, Math.PI * 2); c.stroke();
  c.restore();
  cnPlanet(c, 90, 340, 30, '#D4B67A', { draw: (cx, x, y, r) => { for (let i = 0; i < 5; i++) { cx.fillStyle = 'rgba(150,110,60,0.3)'; cx.fillRect(x - r, y - r + i * 13 + 4, 2 * r, 5); } } });
  c.save(); c.translate(90, 340); c.rotate(-0.35);
  c.strokeStyle = 'rgba(240,222,170,0.85)'; c.lineWidth = 5; c.beginPath(); c.ellipse(0, 0, 58, 12, 0, 0, Math.PI); c.stroke();
  c.restore();
  // 地球
  cnPlanet(c, 210, 700, 330, '#1D5FB5', { atmo: '#7CC4FF', draw: (cx, x, y, r) => cnEarthFeat(cx, x, y, r) });
  // 手
  const h = cnSpaceHand(tt);
  c.save(); c.translate(h.hx, h.hy); c.rotate(-Math.PI / 2);
  drawGiantHandBack(c, 0, 0, 1.2, h.curl); drawGiantHandFront(c, 0, 0, 1.2, h.curl);
  c.restore();
  // 着地したボス
  CN.marks.forEach(mk => {
    const age = tt - mk.t0;
    c.save(); c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(mk.x, mk.y, 1, mk.x, mk.y, 16);
    gg.addColorStop(0, 'rgba(255,230,160,' + (0.6 + 0.2 * Math.sin(tt * 0.1 + mk.x)) + ')'); gg.addColorStop(1, 'rgba(255,230,160,0)');
    c.fillStyle = gg; c.beginPath(); c.arc(mk.x, mk.y, 16, 0, 6.283); c.fill();
    if (age < 30) { c.strokeStyle = 'rgba(255,240,200,' + (1 - age / 30) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(mk.x, mk.y, 4 + age, 0, 6.283); c.stroke(); }
    c.restore();
    cnBossSprite(c, mk.name, mk.x, mk.y, 14, 0.95);
  });
  // 飛んでいくボス
  CN.shots.forEach(s => {
    if (s.x === undefined) return;
    const u = (tt - s.t0) / s.dur;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 1; i < s.trail.length; i++) {
      c.strokeStyle = 'rgba(255,230,160,' + (i / s.trail.length * 0.5) + ')'; c.lineWidth = i / s.trail.length * 8;
      c.beginPath(); c.moveTo(s.trail[i - 1][0], s.trail[i - 1][1]); c.lineTo(s.trail[i][0], s.trail[i][1]); c.stroke();
    }
    c.restore();
    cnBossSprite(c, s.name, s.x, s.y, cnLerp(20, 34, Math.sin(Math.PI * u)), 1);
  });
  cnParts(c);
}

// ---------- 場面4: 否愚魔を握りつぶす ----------
function cnExtraImg() { return baseGetBossGif(EX_P2_NAME) || baseGetBossGif(EXTRA_BOSS); }
function cnBossBig(c, x, y, h, rot, sx, sy) {
  const g = cnExtraImg();
  c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(sx || 1, sy || 1);
  if (g) { const w = h * g.naturalWidth / g.naturalHeight; c.drawImage(g, -w / 2, -h / 2, w, h); }
  else { c.scale(h / 100, h / 100); exBodyFallback(c, 2); }
  c.restore();
}

function cnArena(c, tt) {
  const W = 420, H = 720, bx = 210, by = 500, hs = 1.7;
  const ease = cnEase;
  const sg = c.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, '#04101A'); sg.addColorStop(0.6, '#0B1D2E'); sg.addColorStop(1, '#050A12');
  c.fillStyle = sg; c.fillRect(0, 0, W, H);
  cnStarsDraw(c, tt, 0.6, 0);
  const mg = c.createRadialGradient(300, 170, 20, 300, 170, 240);
  mg.addColorStop(0, 'rgba(220,235,255,0.55)'); mg.addColorStop(1, 'rgba(220,235,255,0)');
  c.fillStyle = mg; c.fillRect(0, 0, W, H);
  cnPlanet(c, 300, 170, 110, '#DCE6F2', { draw: (cx, x, y, r) => { cx.fillStyle = 'rgba(120,135,160,0.4)'; [[-30, -20, 26], [28, 10, 34], [-8, 44, 20], [40, -36, 14]].forEach(q => { cx.beginPath(); cx.arc(x + q[0], y + q[1], q[2], 0, 6.283); cx.fill(); }); } });
  c.fillStyle = '#06101A';
  c.beginPath(); c.moveTo(-10, 560); [[50, 500], [120, 540], [200, 490], [290, 545], [370, 505], [430, 550]].forEach(p => c.lineTo(p[0], p[1])); c.lineTo(430, 720); c.lineTo(-10, 720); c.closePath(); c.fill();
  const gg = c.createLinearGradient(0, 540, 0, 720); gg.addColorStop(0, '#0C1A28'); gg.addColorStop(1, '#03070C');
  c.fillStyle = gg; c.fillRect(-10, 560, 440, 160);
  for (let i = 0; i < 4; i++) {
    const x = cnMod(i * 150 + tt * (0.2 + i * 0.1), 640) - 110;
    c.fillStyle = 'rgba(150,180,210,0.07)'; c.beginPath(); c.ellipse(x, 600 + i * 28, 150, 16, 0, 0, 6.283); c.fill();
  }

  // 手の動き
  let hy = null, curl = 0, alpha = 1;
  const hover = by - 166 * hs, dive = by - 40 * hs, top = -520;
  if (tt >= 120 && tt < 200) hy = top + (hover - top) * ease((tt - 120) / 80);
  else if (tt >= 200 && tt < 230) hy = hover + Math.sin((tt - 200) * 0.4) * 3;
  else if (tt >= 230 && tt < 260) { const p = ease((tt - 230) / 30); hy = hover + (dive - hover) * p; curl = 0.7 * p; }
  else if (tt >= 260 && tt < 312) { const p = (tt - 260) / 52; hy = dive + (Math.random() - 0.5) * (2 + p * 6); curl = 0.7 + 0.3 * p; }
  else if (tt >= 312) { const p = ease((tt - 312) / 120); hy = dive + (top - dive) * p * p; curl = 1 - 0.8 * ease((tt - 360) / 80); alpha = 1 - ease((tt - 400) / 50); }
  let hx = bx;
  if (tt >= 260 && tt < 312) hx += (Math.random() - 0.5) * (2 + (tt - 260) / 52 * 8);

  // 上から闇
  let dark = 0;
  if (tt >= 120) dark = tt < 160 ? (tt - 120) / 40 * 0.5 : (tt < 312 ? 0.5 : 0.5 * (1 - ease((tt - 312) / 88)));
  if (dark > 0) {
    const g = c.createLinearGradient(0, 0, 0, by + 160); g.addColorStop(0, 'rgba(0,0,12,' + dark + ')'); g.addColorStop(1, 'rgba(0,0,12,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, by + 160);
  }
  // 否愚魔
  let pose = null;
  if (tt < 312) {
    const sp = ease((tt - 140) / 100);
    c.fillStyle = 'rgba(0,0,0,' + (0.4 * sp) + ')'; c.beginPath(); c.ellipse(bx, by + 84, 90 + sp * 40, 18 + sp * 6, 0, 0, 6.283); c.fill();
    const q = tt < 260 ? 0 : Math.min(1, (tt - 260) / 52);
    const hurt = tt < 230;
    const jx = hurt ? (Math.random() - 0.5) * 3 : (Math.random() - 0.5) * (3 + q * 8);
    pose = { x: bx + jx, y: by + 70 * q * 0.6 + (hurt ? 12 : 0), sx: 1 + 0.15 * q, sy: (hurt ? 0.93 : 1) - 0.6 * q, rot: hurt ? 0.08 + Math.sin(tt * 0.06) * 0.02 : 0, a: hurt ? 0.82 + 0.18 * Math.sin(tt * 0.3) : 1 };
  }
  const drawBoss = () => {
    if (!pose) return;
    c.save(); c.globalAlpha = pose.a;
    cnBossBig(c, pose.x, pose.y, 170, pose.rot, pose.sx, pose.sy);
    if (tt < 230) {
      c.globalCompositeOperation = 'lighter';
      const rg = c.createRadialGradient(pose.x, pose.y, 8, pose.x, pose.y, 90);
      rg.addColorStop(0, 'rgba(255,60,60,' + (0.25 + 0.15 * Math.sin(tt * 0.2)) + ')'); rg.addColorStop(1, 'rgba(255,60,60,0)');
      c.fillStyle = rg; c.beginPath(); c.arc(pose.x, pose.y, 90, 0, 6.283); c.fill();
    }
    c.restore();
  };
  if (hy === null) { drawBoss(); }
  else {
    c.save(); c.globalAlpha = alpha;
    drawGiantHandBack(c, hx, hy, hs, curl);
    c.restore();
    drawBoss();
    c.save(); c.globalAlpha = alpha;
    drawGiantHandFront(c, hx, hy, hs, curl);
    if (tt >= 312) {
      const gl = c.createRadialGradient(hx, hy + 30, 5, hx, hy + 30, 90);
      gl.addColorStop(0, 'rgba(160,20,60,0.5)'); gl.addColorStop(1, 'rgba(160,20,60,0)');
      c.fillStyle = gl; c.beginPath(); c.arc(hx, hy + 30, 90, 0, 6.283); c.fill();
    }
    c.restore();
  }
  cnParts(c);
  if (tt >= 312 && tt < 330) { c.fillStyle = 'rgba(255,255,255,' + (0.8 * (1 - (tt - 312) / 18)) + ')'; c.fillRect(0, 0, W, H); }
}

// ---------- 場面5: 待ち続ける ----------
function cnSkyDraw(c, tt, horizon) {
  const phi = tt * 0.028, s = Math.sin(phi);
  const dayK = cnClamp((s + 0.2) / 0.6);
  const dusk = 1 - cnClamp(Math.abs(s) / 0.35);
  const g = c.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, cnMix('#04061A', '#5FA8E8', dayK));
  g.addColorStop(1, cnMix(cnMix('#101B3A', '#F6D7A7', dayK), '#FF8A5C', dusk * 0.8));
  c.fillStyle = g; c.fillRect(0, 0, 420, horizon + 2);
  cnStarsDraw(c, tt, cnClamp(-s * 2) * 0.8, 0);
  const sx = 210 - Math.cos(phi) * 250, sy = horizon - s * 380;
  if (s > -0.15) {
    const sgl = c.createRadialGradient(sx, sy, 4, sx, sy, 130);
    sgl.addColorStop(0, 'rgba(255,240,190,0.95)'); sgl.addColorStop(0.2, 'rgba(255,210,120,0.4)'); sgl.addColorStop(1, 'rgba(255,200,100,0)');
    c.fillStyle = sgl; c.fillRect(sx - 140, sy - 140, 280, 280);
    c.fillStyle = '#FFF4CC'; c.beginPath(); c.arc(sx, sy, 22, 0, 6.283); c.fill();
  }
  const mx = 210 + Math.cos(phi) * 250, my = horizon + s * 380;
  if (s < 0.15) {
    c.fillStyle = '#DCE6F2'; c.beginPath(); c.arc(mx, my, 20, 0, 6.283); c.fill();
    c.fillStyle = '#04061A'; c.beginPath(); c.arc(mx + 7, my - 3, 18, 0, 6.283); c.fill();
  }
  return { s: s, dayK: dayK };
}

function cnWait(c, tt) {
  const W = 420, H = 720, horizon = 500;
  const sk = cnSkyDraw(c, tt, horizon);
  for (let L = 0; L < 3; L++) {
    for (let i = 0; i < 6; i++) {
      const x = cnMod(i * 150 + tt * (0.5 + L * 0.4), 700) - 140;
      c.fillStyle = cnMix('#0A0F28', '#FFFFFF', sk.dayK * 0.85 + 0.1);
      c.globalAlpha = 0.55 - L * 0.1;
      c.beginPath(); c.ellipse(x, horizon + 10 + L * 28, 130 + L * 24, 20 + L * 4, 0, 0, 6.283); c.fill();
    }
  }
  c.globalAlpha = 1;
  const moss = cnClamp((tt - 120) / 500);
  cnGiant(c, 210, 380, 1.25, { t: tt, closed: 1, eye: 0, tilt: 0.06, moss: moss });
  // 肩に積もるもの（雪）
  const snow = cnClamp(Math.sin(tt * 0.011) * 1.5);
  if (snow > 0) {
    c.fillStyle = 'rgba(255,255,255,' + (0.85 * snow) + ')';
    [[-150, 460, 70, 16], [150, 460, 70, 16], [-4, 262, 60, 12]].forEach(q => { c.beginPath(); c.ellipse(210 + q[0] * 0.8, q[1] - 36, q[2], q[3], q[0] > 0 ? 0.15 : -0.15, 0, 6.283); c.fill(); });
  }
  cnParts(c);
  const gg = c.createLinearGradient(0, 600, 0, 720); gg.addColorStop(0, 'rgba(3,3,10,0)'); gg.addColorStop(1, 'rgba(3,3,10,0.9)');
  c.fillStyle = gg; c.fillRect(0, 600, W, 120);
}

// ---------- 場面6: 主人公が来る → 巨人の目に映る ----------
function cnFinal(c, tt) {
  const W = 420, H = 720;
  const zk = cnEase((tt - 330) / 110);
  const z = 1 + 14 * Math.pow(zk, 2.2);
  const ex = 170, ey = 221;
  const camX = cnLerp(210, ex, zk), camY = cnLerp(360, ey, zk);
  const sg = c.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, '#04061A'); sg.addColorStop(0.7, '#0E1634'); sg.addColorStop(1, '#04040C');
  c.fillStyle = sg; c.fillRect(0, 0, W, H);
  cnStarsDraw(c, tt, 0.8, 0);
  const mg = c.createRadialGradient(330, 130, 10, 330, 130, 190); mg.addColorStop(0, 'rgba(220,235,255,0.5)'); mg.addColorStop(1, 'rgba(220,235,255,0)');
  c.fillStyle = mg; c.fillRect(0, 0, W, H);
  const open = cnEase((tt - 250) / 70);
  c.save();
  c.translate(210, 360); c.scale(z, z); c.translate(-camX, -camY);
  cnGiant(c, 210, 330, 1.6, { t: tt, closed: 1 - open, eye: open * 1.2, tilt: 0.07 * cnEase((tt - 250) / 80), moss: 1 });
  c.restore();
  if (zk < 0.3) {
    const g = c.createLinearGradient(0, 590, 0, 720);
    g.addColorStop(0, 'rgba(4,4,12,0)'); g.addColorStop(0.35, 'rgba(4,4,12,0.92)'); g.addColorStop(1, '#04040C');
    c.fillStyle = g; c.fillRect(0, 590, W, 130);
    const u = cnClamp(tt / 250);
    cnHeroBack(c, 210, cnLerp(706, 646, u), cnLerp(40, 24, u), u < 1 ? tt : 0);
  }
  // 目に映る主人公
  if (zk > 0.55) cnHero(c, 196, 402, Math.min(2.4, 0.18 * z), { alpha: cnClamp((zk - 0.55) / 0.25), t: tt });
  const fl = cnClamp((tt - 410) / 40);
  if (zk > 0) {
    const bl = c.createRadialGradient(210, 360, 10, 210, 360, 420);
    bl.addColorStop(0, 'rgba(255,255,255,' + (0.55 * zk) + ')'); bl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = bl; c.fillRect(0, 0, W, H);
  }
  if (fl > 0) { c.fillStyle = 'rgba(255,255,255,' + fl + ')'; c.fillRect(0, 0, W, H); }
}

function cnMovieDraw(c, m) {
  const W = 420, H = 720;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0;
  let shx = 0, shy = 0;
  if (CN.shake > 0) { shx = (Math.random() - 0.5) * CN.shake; shy = (Math.random() - 0.5) * CN.shake; CN.shake *= 0.9; if (CN.shake < 0.4) CN.shake = 0; }
  c.save();
  c.translate(shx, shy);
  if (m < 1100) cnCorridor(c, m);
  else if (m < 1950) cnPlain(c, m - 1100);
  else if (m < 2550) cnSpace(c, m - 1950);
  else if (m < 3000) cnArena(c, m - 2550);
  else if (m < 3700) cnWait(c, m - 3000);
  else cnFinal(c, m - 3700);
  c.restore();
  cnVig(c, 0.5);
  c.fillStyle = '#000'; c.fillRect(0, 0, W, 52); c.fillRect(0, H - 52, W, 52);
  // 場面の切り替え（白・黒）
  let col = null, a = 0;
  if (m < 60) { col = '255,255,255'; a = 1 - m / 60; }
  else if (m >= 1070 && m < 1100) { col = '255,255,255'; a = (m - 1070) / 30; }
  else if (m >= 1100 && m < 1150) { col = '255,255,255'; a = 1 - (m - 1100) / 50; }
  else if (m >= 1930 && m < 1950) { col = '255,255,255'; a = (m - 1930) / 20; }
  else if (m >= 1950 && m < 1990) { col = '255,255,255'; a = 1 - (m - 1950) / 40; }
  else if (m >= 2530 && m < 2550) { col = '0,0,0'; a = (m - 2530) / 20; }
  else if (m >= 2550 && m < 2590) { col = '0,0,0'; a = 1 - (m - 2550) / 40; }
  else if (m >= 2980 && m < 3000) { col = '0,0,0'; a = (m - 2980) / 20; }
  else if (m >= 3000 && m < 3040) { col = '0,0,0'; a = 1 - (m - 3000) / 40; }
  else if (m >= 3680 && m < 3700) { col = '0,0,0'; a = (m - 3680) / 20; }
  else if (m >= 3700 && m < 3730) { col = '0,0,0'; a = 1 - (m - 3700) / 30; }
  else if (m >= 4090) { col = '255,255,255'; a = cnClamp((m - 4090) / 60); }
  if (col && a > 0) { c.fillStyle = 'rgba(' + col + ',' + a + ')'; c.fillRect(0, 0, W, H); }
}

function cnDraw() {
  try {
    const c = ccx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0;
    if (CN.ph === 'pin' || CN.ph === 'slash') cnDrawPinScene(c, CN.ph, CN.t);
    else if (CN.ph === 'movie') cnMovieDraw(c, CN.t);
  } catch (err) {
    console.error('[cine]', err);
    cnEnd();
  }
}

// ---------- ゲームのループに組み込む ----------
const baseUpdateFn14 = update;
update = function () {
  if (CN.on) {
    if (paused) resumeGame();
    cnTick();
    return;
  }
  baseUpdateFn14();
};

const baseDrawFn18 = draw;
draw = function () {
  if (CN.on) {
    if (CN.ph === 'enter') { baseDrawFn18(); cnDrawEnter(CN.t); }
    else cnDraw();
    return;
  }
  baseDrawFn18();
};

const baseStartGame12 = startGame;
startGame = function (...args) {
  if (CN.on) cnEnd();
  CN.on = false;
  cineScreen.style.display = 'none';
  cineSpinBtn.style.display = 'none';
  baseStartGame12(...args);
};


/* SPLIT13 */
// ==========================================
// 手の描き直し（関節が3つある指・手のひらのしわ・グーの拳）
// ==========================================
const HSK = { dark: '#C48560', mid: '#EDB892', lite: '#FFE6CE' };

function hPath(c, x0, y0, x1, y1, w0, w1) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d, a = Math.atan2(dy, dx);
  c.beginPath();
  c.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2);
  c.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  c.arc(x1, y1, w1 / 2, a + Math.PI / 2, a - Math.PI / 2, true);
  c.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2);
  c.arc(x0, y0, w0 / 2, a - Math.PI / 2, a + Math.PI / 2, true);
  c.closePath();
}

// 先細りの1節。光は左上から
function hSegDraw(c, x0, y0, x1, y1, w0, w1) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;
  const sgn = (nx * -0.6 + ny * -0.8) >= 0 ? 1 : -1;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, wm = (w0 + w1) / 2;
  const g = c.createLinearGradient(mx - sgn * nx * wm / 2, my - sgn * ny * wm / 2, mx + sgn * nx * wm / 2, my + sgn * ny * wm / 2);
  g.addColorStop(0, HSK.dark); g.addColorStop(0.45, HSK.mid); g.addColorStop(0.8, HSK.lite); g.addColorStop(1, HSK.mid);
  hPath(c, x0, y0, x1, y1, w0, w1);
  c.fillStyle = g; c.fill();
  c.lineWidth = 3.4; c.strokeStyle = INK3; c.stroke();
}

// 関節のしわ（2本）と、関節のふくらみのハイライト
function hCrease(c, x, y, a, w) {
  const dx = Math.sin(a), dy = Math.cos(a), nx = Math.cos(a), ny = -Math.sin(a);
  c.save();
  c.strokeStyle = 'rgba(120,64,36,0.75)'; c.lineWidth = 1.8; c.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const off = (i - 0.5) * 4.5;
    c.beginPath();
    c.moveTo(x - nx * w * 0.32 + dx * off, y - ny * w * 0.32 + dy * off);
    c.quadraticCurveTo(x + dx * (off + 2.5), y + dy * (off + 2.5), x + nx * w * 0.32 + dx * off, y + ny * w * 0.32 + dy * off);
    c.stroke();
  }
  c.fillStyle = 'rgba(255,240,225,0.5)';
  c.beginPath(); c.ellipse(x - 0.6 * w * 0.18 - dx * 3, y - 0.8 * w * 0.18 - dy * 3, w * 0.2, w * 0.1, a, 0, Math.PI * 2); c.fill();
  c.restore();
}

// 指（3つの節。曲がると、関節ごとに中心へ折れていく）
function hFinger(c, bx, by, L, w, sp, curl, f) {
  const inw = bx < 0 ? 1 : -1;
  const jb = [curl * (0.25 + 0.15 * f) * 0.5, curl * (0.55 + 0.2 * f) * 0.8, curl * (0.7 + 0.2 * f) * 0.9];
  const fr = [0.44, 0.31, 0.25];
  const wd = [w, w * 0.9, w * 0.8, w * 0.68];
  let a = sp * (1 - curl);
  let px = bx * (1 - 0.35 * curl), py = by;
  const P = [[px, py, a]];
  for (let k = 0; k < 3; k++) {
    a += inw * jb[k];
    const len = L * fr[k] * (1 - 0.1 * curl * k);
    px += Math.sin(a) * len; py += Math.cos(a) * len;
    P.push([px, py, a]);
  }
  for (let k = 0; k < 3; k++) hSegDraw(c, P[k][0], P[k][1], P[k + 1][0], P[k + 1][1], wd[k], wd[k + 1]);
  for (let k = 1; k < 3; k++) hCrease(c, P[k][0], P[k][1], P[k][2], wd[k]);
  // 指の腹
  c.fillStyle = 'rgba(255,238,222,0.5)';
  c.beginPath(); c.ellipse(P[3][0] - Math.sin(P[3][2]) * wd[3] * 0.3, P[3][1] - Math.cos(P[3][2]) * wd[3] * 0.3, wd[3] * 0.3, wd[3] * 0.2, -P[3][2], 0, Math.PI * 2); c.fill();
}

function hThumb(c, curl) {
  const a1 = cnLerp(1.0, -0.45, curl), a2 = a1 + cnLerp(0.12, 0.55, curl);
  let x0 = -52, y0 = 18;
  const x1 = x0 - Math.sin(a1) * 44, y1 = y0 + Math.cos(a1) * 44;
  const x2 = x1 - Math.sin(a2) * 36, y2 = y1 + Math.cos(a2) * 36;
  hSegDraw(c, x0, y0, x1, y1, 31, 27);
  hSegDraw(c, x1, y1, x2, y2, 27, 22);
  hCrease(c, x1, y1, -a1, 27);
  c.fillStyle = 'rgba(255,238,222,0.5)';
  c.beginPath(); c.ellipse(x2 + Math.sin(a2) * 5, y2 - Math.cos(a2) * 5, 6, 4.5, a2, 0, Math.PI * 2); c.fill();
}

// グー（握りこぶし）。4本の指は、2つの節が見える。親指が上を横切る
drawFistShape = function (c) {
  const g = c.createLinearGradient(0, 4, 0, 108);
  g.addColorStop(0, '#E9B58F'); g.addColorStop(1, '#C48560');
  c.fillStyle = g; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath();
  c.moveTo(-64, 20); c.quadraticCurveTo(-68, 2, -40, 0); c.lineTo(40, 0); c.quadraticCurveTo(68, 2, 64, 20);
  c.lineTo(62, 82); c.quadraticCurveTo(58, 110, 30, 110); c.lineTo(-30, 110); c.quadraticCurveTo(-58, 110, -62, 82);
  c.closePath(); c.fill(); c.stroke();
  for (let i = 0; i < 4; i++) {
    const cx = -46 + i * 31;
    hSegDraw(c, cx, 12, cx, 52, 30, 29);
    hSegDraw(c, cx, 52, cx, 90, 29, 26);
    hCrease(c, cx, 52, Math.PI, 29);
    // 曲げた指先が、手のひらに食い込む影
    c.strokeStyle = 'rgba(90,40,24,0.55)'; c.lineWidth = 3;
    c.beginPath(); c.arc(cx, 92, 12, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.fillStyle = 'rgba(255,240,225,0.55)';
    c.beginPath(); c.ellipse(cx - 5, 12, 8, 4.5, 0, 0, Math.PI * 2); c.fill();
  }
  // 親指（爪が見える）
  hSegDraw(c, -70, 72, -14, 63, 29, 26);
  hSegDraw(c, -14, 63, 40, 56, 26, 23);
  hCrease(c, -14, 63, -Math.PI / 2 + 0.1, 26);
  c.fillStyle = '#FFEFE0'; c.strokeStyle = INK3; c.lineWidth = 2.4;
  c.beginPath(); c.ellipse(40, 55, 11, 8.5, -0.15, 0, Math.PI * 2); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(37, 52, 4.5, 2.5, -0.2, 0, Math.PI * 2); c.fill();
};

// 指と親指（手前の層）
drawGiantHandFront = function (c, x, y, s, curl) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (curl >= 0.8) {
    drawFistShape(c);
    c.restore();
    return;
  }
  const FING = [
    { bx: -42, L: 68, w: 27, sp: -0.2, f: 1.0 },
    { bx: -14, L: 80, w: 28, sp: -0.06, f: 0.33 },
    { bx: 14, L: 74, w: 26, sp: 0.06, f: 0.33 },
    { bx: 42, L: 58, w: 22, sp: 0.2, f: 1.0 }
  ];
  FING.forEach(f => hFinger(c, f.bx, 54, f.L, f.w, f.sp, curl, f.f));
  hThumb(c, curl);
  c.restore();
};

// 奥の層: 後光・袖（刺繍つき）・腕・金の袖口・腕輪・手のひら
drawGiantHandBack = function (c, x, y, s, curl) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineJoin = 'round'; c.lineCap = 'round';
  // 後光
  const aura = c.createRadialGradient(0, 40, 10, 0, 40, 250);
  aura.addColorStop(0, 'rgba(255,232,160,0.55)'); aura.addColorStop(1, 'rgba(255,232,160,0)');
  c.fillStyle = aura; c.beginPath(); c.arc(0, 40, 250, 0, Math.PI * 2); c.fill();
  // 袖
  const sleeve = () => {
    c.beginPath(); c.moveTo(-60, -112); c.lineTo(-92, -1000); c.lineTo(92, -1000); c.lineTo(60, -112); c.closePath();
  };
  const sl = c.createLinearGradient(-92, 0, 92, 0);
  sl.addColorStop(0, '#B6C0D6'); sl.addColorStop(0.2, '#F4F6FA'); sl.addColorStop(0.55, '#FFFFFF'); sl.addColorStop(1, '#A7B3CB');
  sleeve(); c.fillStyle = sl; c.fill();
  c.save(); sleeve(); c.clip();
  // 布のたるみ（影の筋）
  for (let i = 0; i < 7; i++) {
    const bx = -66 + i * 22;
    const fg = c.createLinearGradient(bx - 8, 0, bx + 8, 0);
    fg.addColorStop(0, 'rgba(110,125,165,0)'); fg.addColorStop(0.5, 'rgba(110,125,165,0.22)'); fg.addColorStop(1, 'rgba(110,125,165,0)');
    c.fillStyle = fg;
    c.beginPath(); c.moveTo(bx - 8, -120); c.quadraticCurveTo(bx + (i % 2 ? 12 : -12), -520, bx - 8 - i * 3, -1000); c.lineTo(bx + 8 - i * 3, -1000); c.quadraticCurveTo(bx + (i % 2 ? 28 : 4), -520, bx + 8, -120); c.closePath(); c.fill();
  }
  // 金の縁取りと、雲の刺繍
  c.strokeStyle = 'rgba(232,190,70,0.9)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-54, -118); c.lineTo(-84, -1000); c.moveTo(54, -118); c.lineTo(84, -1000); c.stroke();
  for (let i = 0; i < 11; i++) {
    const yy = -190 - i * 82, ww = 14 + i * 0.4;
    c.fillStyle = '#E8BE46'; c.strokeStyle = '#7A5A12'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(0, yy - ww); c.lineTo(ww * 0.7, yy); c.lineTo(0, yy + ww); c.lineTo(-ww * 0.7, yy); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(-ww * 1.9, yy, 4, 0, Math.PI * 2); c.arc(ww * 1.9, yy, 4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-ww * 1.2, yy + 22); c.quadraticCurveTo(0, yy + 40, ww * 1.2, yy + 22); c.stroke();
  }
  c.restore();
  c.strokeStyle = INK3; c.lineWidth = 4; sleeve(); c.stroke();
  // 腕
  const arm = c.createLinearGradient(-40, 0, 40, 0);
  arm.addColorStop(0, HSK.dark); arm.addColorStop(0.4, HSK.mid); arm.addColorStop(0.75, HSK.lite); arm.addColorStop(1, HSK.mid);
  c.fillStyle = arm; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-36, -112); c.lineTo(-41, -52); c.lineTo(41, -52); c.lineTo(36, -112); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(120,64,36,0.35)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-14, -104); c.quadraticCurveTo(-18, -80, -12, -58); c.moveTo(12, -104); c.quadraticCurveTo(16, -80, 10, -58); c.stroke();
  // 金の袖口（二重）と、房
  const gold = c.createLinearGradient(0, -148, 0, -100);
  gold.addColorStop(0, '#FEF08A'); gold.addColorStop(0.5, '#FACC15'); gold.addColorStop(1, '#A16207');
  c.fillStyle = gold; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-67, -138); c.lineTo(67, -138); c.lineTo(63, -104); c.lineTo(-63, -104); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-70, -150); c.lineTo(70, -150); c.lineTo(68, -140); c.lineTo(-68, -140); c.closePath(); c.fill(); c.stroke();
  [[-38, '#3B82F6'], [0, '#EF4444'], [38, '#3B82F6']].forEach(g2 => {
    c.fillStyle = g2[1]; c.strokeStyle = INK3; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(g2[0], -134); c.lineTo(g2[0] + 8, -121); c.lineTo(g2[0], -108); c.lineTo(g2[0] - 8, -121); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(g2[0] - 3, -125, 3, 4);
  });
  c.strokeStyle = '#E8BE46'; c.lineWidth = 2.4;
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 17, -104); c.lineTo(i * 17 + 2, -92); c.stroke(); }
  // 腕輪
  c.fillStyle = gold; c.strokeStyle = INK3; c.lineWidth = 3.4;
  c.beginPath(); c.moveTo(-42, -72); c.lineTo(42, -72); c.lineTo(41, -58); c.lineTo(-41, -58); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#38BDF8'; c.beginPath(); c.arc(0, -65, 5, 0, Math.PI * 2); c.fill(); c.stroke();
  // 手のひら
  const palm = c.createRadialGradient(-12, -6, 6, 0, 8, 86);
  palm.addColorStop(0, HSK.lite); palm.addColorStop(0.55, HSK.mid); palm.addColorStop(1, HSK.dark);
  c.fillStyle = palm; c.strokeStyle = INK3; c.lineWidth = 4;
  const palmPath = () => {
    c.beginPath(); c.moveTo(-38, -58);
    c.quadraticCurveTo(-68, -28, -65, 12);
    c.quadraticCurveTo(-63, 48, -36, 62);
    c.lineTo(34, 62);
    c.quadraticCurveTo(61, 56, 63, 26);
    c.quadraticCurveTo(67, -26, 38, -58);
    c.closePath();
  };
  palmPath(); c.fill(); c.stroke();
  // 陰影: 親指の付け根（母指球）の盛り上がりと、小指側の影
  c.save(); palmPath(); c.clip();
  c.fillStyle = 'rgba(255,240,225,0.38)'; c.beginPath(); c.ellipse(-30, 14, 24, 38, 0.35, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(150,80,48,0.28)'; c.beginPath(); c.ellipse(40, 30, 24, 34, -0.2, 0, Math.PI * 2); c.fill();
  // 手のひらのしわ（握るほど薄れる）
  const ca = 1 - cnClamp(curl / 0.7);
  if (ca > 0) {
    c.strokeStyle = 'rgba(110,56,30,' + (0.75 * ca) + ')'; c.lineCap = 'round';
    c.lineWidth = 2.6; c.beginPath(); c.moveTo(-58, 6); c.quadraticCurveTo(-18, 26, 52, -2); c.stroke();      // 感情線
    c.lineWidth = 2.4; c.beginPath(); c.moveTo(-56, -14); c.quadraticCurveTo(-8, 2, 40, -26); c.stroke();     // 知能線
    c.lineWidth = 3; c.beginPath(); c.moveTo(-36, -44); c.quadraticCurveTo(-60, 0, -34, 42); c.stroke();       // 生命線
    c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(6, -34); c.quadraticCurveTo(14, -16, 10, 2); c.moveTo(-8, 30); c.lineTo(-14, 48); c.moveTo(24, 18); c.lineTo(32, 36); c.stroke();
  }
  c.restore();
  // 指の付け根のふくらみ
  [-42, -14, 14, 42].forEach(bx => {
    c.fillStyle = 'rgba(255,236,218,0.45)'; c.beginPath(); c.ellipse(bx - 2, 56, 11, 6, 0, 0, Math.PI * 2); c.fill();
  });
  c.restore();
};

// ==========================================
// 主人公・巨人の描き直し
// ==========================================
cnHero = function (c, x, y, s, o) {
  o = o || {};
  const sk = getCurrentSkin(), half = 14;
  c.save();
  c.translate(x, y);
  c.rotate(o.rot || 0);
  c.scale(s * (o.sx || 1), s * (o.sy || 1));
  c.lineJoin = 'round';
  if (o.alpha != null) c.globalAlpha = o.alpha;
  const w = Math.sin((o.t || 0) * 0.3) * 4;
  c.fillStyle = sk.bandColor; c.strokeStyle = INK3; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(-(half - 2), -half + 6); c.lineTo(-(half + 16), -half + 2 + w); c.lineTo(-(half + 12), -half + 11 + w); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = INK3; c.fillRect(-half - 3, 2, 4, 6); c.fillRect(half - 1, -4, 4, 6);
  const bg = c.createLinearGradient(-half, -half, half, half);
  bg.addColorStop(0, shade(sk.bodyColor, 0.35)); bg.addColorStop(0.5, sk.bodyColor); bg.addColorStop(1, shade(sk.bodyColor, -0.35));
  c.fillStyle = bg; c.lineWidth = 3;
  gRR(c, -half, -half, 28, 28, 4); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(-half + 3, half - 4); c.lineTo(-half + 3, -half + 3); c.lineTo(half - 4, -half + 3); c.stroke();
  c.fillStyle = sk.bandColor; c.strokeStyle = INK3; c.lineWidth = 2.4;
  c.fillRect(-half + 1, -half + 4, 26, 6); c.strokeRect(-half + 1, -half + 4, 26, 6);
  c.fillStyle = sk.eyeColor; c.fillRect(-1, -1, 4, 6); c.fillRect(6, -1, 4, 6);
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, 1.5, 2); c.fillRect(7, 0, 1.5, 2);
  c.restore();
};

cnHeroBack = function (c, x, fy, s, t) {
  const sk = getCurrentSkin();
  const step = Math.sin(t * 0.16);
  const bob = Math.abs(step) * s * 0.07;
  const lh = s * 0.22;
  c.save();
  c.translate(x, fy - bob);
  c.lineJoin = 'round';
  const wv = Math.sin(t * 0.1) * s * 0.12;
  c.fillStyle = sk.bandColor; c.strokeStyle = INK3; c.lineWidth = Math.max(1.5, s * 0.05);
  c.beginPath(); c.moveTo(-s * 0.1, -lh - s * 0.8); c.quadraticCurveTo(-s * 0.5 + wv, -lh - s * 0.55, -s * 0.85 + wv, -lh - s * 0.3 + wv); c.lineTo(-s * 0.75 + wv, -lh - s * 0.2 + wv); c.quadraticCurveTo(-s * 0.4, -lh - s * 0.5, -s * 0.05, -lh - s * 0.65); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(s * 0.1, -lh - s * 0.8); c.quadraticCurveTo(s * 0.5 - wv, -lh - s * 0.55, s * 0.85 - wv, -lh - s * 0.3 + wv); c.lineTo(s * 0.75 - wv, -lh - s * 0.2 + wv); c.quadraticCurveTo(s * 0.4, -lh - s * 0.5, s * 0.05, -lh - s * 0.65); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = INK3;
  c.fillRect(-s * 0.3 + step * s * 0.06, -lh, s * 0.2, lh + bob);
  c.fillRect(s * 0.1 - step * s * 0.06, -lh, s * 0.2, lh + bob);
  const bg = c.createLinearGradient(-s / 2, -lh - s, s / 2, -lh);
  bg.addColorStop(0, shade(sk.bodyColor, 0.3)); bg.addColorStop(0.5, sk.bodyColor); bg.addColorStop(1, shade(sk.bodyColor, -0.4));
  c.fillStyle = bg; c.lineWidth = Math.max(2, s * 0.05);
  gRR(c, -s / 2, -lh - s, s, s, s * 0.12); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = Math.max(1, s * 0.025);
  c.beginPath(); c.moveTo(-s / 2 + s * 0.07, -lh - s * 0.07); c.lineTo(-s / 2 + s * 0.07, -lh - s + s * 0.07); c.lineTo(s / 2 - s * 0.1, -lh - s + s * 0.07); c.stroke();
  c.fillStyle = sk.bandColor; c.strokeStyle = INK3; c.lineWidth = Math.max(1.5, s * 0.04);
  c.fillRect(-s / 2 + s * 0.03, -lh - s + s * 0.16, s * 0.94, s * 0.22);
  c.strokeRect(-s / 2 + s * 0.03, -lh - s + s * 0.16, s * 0.94, s * 0.22);
  c.fillStyle = INK3;
  c.fillRect(-s / 2 - s * 0.1, -lh - s * 0.55 + step * s * 0.05, s * 0.14, s * 0.3);
  c.fillRect(s / 2 - s * 0.04, -lh - s * 0.55 - step * s * 0.05, s * 0.14, s * 0.3);
  c.restore();
};

CN.giantHand = false;   // 天の手を掲げる場面では、右肩の肩当ては場面側で描く

cnGiant = function (c, x, y, s, o) {
  o = o || {};
  const sk = getCurrentSkin(), T = o.t || 0;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (o.alpha != null) c.globalAlpha = o.alpha;
  // 後光（頭の後ろの輪）
  c.save(); c.translate(0, -96);
  c.globalCompositeOperation = 'lighter';
  const h0 = c.createRadialGradient(0, 0, 70, 0, 0, 260);
  h0.addColorStop(0, 'rgba(255,225,150,0.30)'); h0.addColorStop(1, 'rgba(255,225,150,0)');
  c.fillStyle = h0; c.beginPath(); c.arc(0, 0, 260, 0, Math.PI * 2); c.fill();
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = 'rgba(250,220,120,0.55)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 128, 0, Math.PI * 2); c.stroke();
  c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 138, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 48; i++) {
    const a = i * Math.PI / 24 + T * 0.003, l = i % 4 === 0 ? 156 : 147;
    c.beginPath(); c.moveTo(Math.cos(a) * 138, Math.sin(a) * 138); c.lineTo(Math.cos(a) * l, Math.sin(a) * l); c.stroke();
  }
  c.restore();
  // マント
  const cg = c.createLinearGradient(-220, 0, 220, 0);
  cg.addColorStop(0, '#3B3354'); cg.addColorStop(0.5, '#241E38'); cg.addColorStop(1, '#0C0916');
  c.fillStyle = cg; c.strokeStyle = INK3; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-90, -4); c.quadraticCurveTo(-190, 10, -204, 80); c.lineTo(-190, 345); c.lineTo(190, 345); c.lineTo(204, 80); c.quadraticCurveTo(190, 10, 90, -4); c.closePath(); c.fill(); c.stroke();
  // 衣
  const rg = c.createLinearGradient(-160, 0, 160, 0);
  rg.addColorStop(0, '#E4DEC9'); rg.addColorStop(0.35, '#B3AC96'); rg.addColorStop(0.64, '#4E4A5C'); rg.addColorStop(1, '#14111E');
  c.fillStyle = rg; c.strokeStyle = INK3; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-66, -8); c.quadraticCurveTo(-140, 6, -152, 62); c.lineTo(-135, 345); c.lineTo(135, 345); c.lineTo(152, 62); c.quadraticCurveTo(140, 6, 66, -8); c.closePath(); c.fill(); c.stroke();
  c.save(); c.clip();
  // ひだの陰影
  for (let i = 0; i < 9; i++) {
    const fx = -120 + i * 30;
    const fgr = c.createLinearGradient(fx - 10, 0, fx + 10, 0);
    fgr.addColorStop(0, 'rgba(10,8,20,0)'); fgr.addColorStop(0.5, 'rgba(10,8,20,0.32)'); fgr.addColorStop(1, 'rgba(10,8,20,0)');
    c.fillStyle = fgr;
    c.beginPath(); c.moveTo(fx - 10, 60); c.quadraticCurveTo(fx - 16 + (i % 3) * 8, 200, fx - 8, 345); c.lineTo(fx + 12, 345); c.quadraticCurveTo(fx + 4 + (i % 3) * 8, 200, fx + 10, 60); c.closePath(); c.fill();
  }
  // 金の刺繍
  c.strokeStyle = 'rgba(232,190,70,0.85)'; c.lineWidth = 2.4;
  [-96, 96].forEach(ex => {
    c.beginPath(); c.moveTo(ex, 70); c.bezierCurveTo(ex + 18, 130, ex - 18, 190, ex, 260); c.stroke();
    for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(ex + (k % 2 ? 9 : -9), 110 + k * 40, 6, 0, Math.PI * 2); c.stroke(); }
  });
  // 裾に向かって闇へ
  const dg = c.createLinearGradient(0, 160, 0, 345);
  dg.addColorStop(0, 'rgba(5,4,10,0)'); dg.addColorStop(1, 'rgba(5,4,10,0.97)');
  c.fillStyle = dg; c.fillRect(-160, 150, 320, 200);
  if (o.moss) {
    c.strokeStyle = 'rgba(80,140,70,' + (0.55 * o.moss) + ')'; c.lineWidth = 6;
    for (let i = 0; i < 9; i++) {
      const mx = -120 + i * 30;
      c.beginPath(); c.moveTo(mx, 60 + (i % 3) * 20); c.quadraticCurveTo(mx + 12, 120 + (i % 4) * 30, mx - 6, 200 + (i % 5) * 20); c.stroke();
    }
  }
  c.restore();
  // 金の襟とブローチ
  const gold = c.createLinearGradient(0, -10, 0, 110);
  gold.addColorStop(0, '#FEF08A'); gold.addColorStop(0.5, '#FACC15'); gold.addColorStop(1, '#A16207');
  c.strokeStyle = INK3; c.lineWidth = 17;
  c.beginPath(); c.moveTo(-74, -2); c.lineTo(0, 112); c.lineTo(74, -2); c.stroke();
  c.strokeStyle = gold; c.lineWidth = 11; c.stroke();
  c.fillStyle = '#EF4444'; c.strokeStyle = INK3; c.lineWidth = 3;
  c.beginPath(); c.moveTo(0, 96); c.lineTo(12, 114); c.lineTo(0, 134); c.lineTo(-12, 114); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(-4, 106, 4, 8);
  // 肩当て（左は常に。右は、手を掲げる場面では場面側で描く）
  const pauldron = px => {
    c.save(); c.translate(px, 70);
    const pg = c.createLinearGradient(-50, -30, 50, 30);
    pg.addColorStop(0, '#FEF08A'); pg.addColorStop(0.5, '#FACC15'); pg.addColorStop(1, '#8A5A0E');
    c.fillStyle = pg; c.strokeStyle = INK3; c.lineWidth = 4;
    c.beginPath(); c.ellipse(0, 0, 54, 30, px < 0 ? -0.25 : 0.25, 0, Math.PI * 2); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(120,80,10,0.7)'; c.lineWidth = 2;
    for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 16, -22); c.lineTo(k * 16 + 3, 22); c.stroke(); }
    c.fillStyle = '#38BDF8'; c.beginPath(); c.arc(0, 0, 7, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();
  };
  pauldron(-150);
  if (!CN.giantHand) pauldron(150);
  // 首
  c.fillStyle = shade(sk.bodyColor, -0.5); c.strokeStyle = INK3; c.lineWidth = 4;
  c.fillRect(-34, -30, 68, 34); c.strokeRect(-34, -30, 68, 34);
  // 頭
  c.save();
  c.translate(0, -96);
  c.rotate(o.tilt || 0);
  const hw = 176, hh = 168;
  const wv = Math.sin(T * 0.05) * 10;
  c.fillStyle = sk.bandColor; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-70, -34); c.quadraticCurveTo(-150, -30 + wv, -210, -10 + wv * 1.6); c.lineTo(-196, 24 + wv * 1.6); c.quadraticCurveTo(-140, wv, -70, -6); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-66, -26); c.quadraticCurveTo(-130, 14 + wv, -176, 62 + wv * 1.4); c.lineTo(-160, 76 + wv * 1.4); c.quadraticCurveTo(-118, 34 + wv, -62, -4); c.closePath(); c.fill(); c.stroke();
  const hg = c.createRadialGradient(-34, -34, 8, 0, 0, 135);
  hg.addColorStop(0, shade(sk.bodyColor, 0.3)); hg.addColorStop(0.5, sk.bodyColor); hg.addColorStop(1, shade(sk.bodyColor, -0.48));
  c.fillStyle = hg; c.lineWidth = 6;
  gRR(c, -hw / 2, -hh / 2, hw, hh, 18); c.fill(); c.stroke();
  if (sk.crown) {
    c.fillStyle = '#FFD600'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-46, -hh / 2); c.lineTo(-46, -hh / 2 - 44); c.lineTo(-18, -hh / 2 - 22); c.lineTo(0, -hh / 2 - 52); c.lineTo(18, -hh / 2 - 22); c.lineTo(46, -hh / 2 - 44); c.lineTo(46, -hh / 2); c.closePath(); c.fill(); c.stroke();
  }
  // はちまき（立体感のある影つき）
  const bgd = c.createLinearGradient(0, -hh / 2 + 22, 0, -hh / 2 + 52);
  bgd.addColorStop(0, shade(sk.bandColor, 0.25)); bgd.addColorStop(1, shade(sk.bandColor, -0.3));
  c.fillStyle = bgd; c.lineWidth = 4;
  c.fillRect(-hw / 2 + 3, -hh / 2 + 22, hw - 6, 30); c.strokeRect(-hw / 2 + 3, -hh / 2 + 22, hw - 6, 30);
  const bs = c.createLinearGradient(0, -hh / 2 + 52, 0, -hh / 2 + 84);
  bs.addColorStop(0, 'rgba(0,0,0,0.38)'); bs.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = bs; c.fillRect(-hw / 2 + 6, -hh / 2 + 52, hw - 12, 32);
  // 目
  const eg = o.eye == null ? 1 : o.eye, cl = o.closed || 0;
  [[-36, 4], [6, 4]].forEach(e => {
    if (eg > 0) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const eh = c.createRadialGradient(e[0] + 15, e[1] + 23, 4, e[0] + 15, e[1] + 23, 62);
      eh.addColorStop(0, hexToRgba(sk.eyeColor, 0.5 * Math.min(1, eg))); eh.addColorStop(1, hexToRgba(sk.eyeColor, 0));
      c.fillStyle = eh; c.fillRect(e[0] - 50, e[1] - 40, 130, 130);
      c.restore();
    }
    c.save();
    if (eg > 0) { c.shadowColor = sk.eyeColor; c.shadowBlur = 18 * eg; }
    c.fillStyle = sk.eyeColor; c.fillRect(e[0], e[1], 30, 46);
    c.shadowBlur = 0;
    c.fillStyle = '#FFFFFF'; c.fillRect(e[0] + 5, e[1] + 6, 8, 10);
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(e[0] + 17, e[1] + 30, 6, 6);
    c.restore();
    if (cl > 0) {
      c.fillStyle = shade(sk.bodyColor, -0.1);
      c.fillRect(e[0] - 1, e[1] - 1, 32, 48 * cl);
      c.strokeStyle = INK3; c.lineWidth = 4;
      c.beginPath(); c.moveTo(e[0] - 1, e[1] + 48 * cl); c.lineTo(e[0] + 31, e[1] + 48 * cl); c.stroke();
    }
  });
  // 左目を横切る古い傷
  c.strokeStyle = 'rgba(110,34,34,0.85)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-52, -4); c.lineTo(-20, 66); c.stroke();
  c.strokeStyle = 'rgba(255,200,190,0.5)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-50, -4); c.lineTo(-18, 66); c.stroke();
  c.strokeStyle = INK3; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-26, 62); c.lineTo(26, 62 + (o.mouth || 0)); c.stroke();
  // 顔の右半分は、影で見えない
  if (o.shadow !== 0) {
    c.save();
    gRR(c, -hw / 2, -hh / 2, hw, hh, 18); c.clip();
    const sg = c.createLinearGradient(-20, 0, 40, 0);
    sg.addColorStop(0, 'rgba(2,2,12,0)'); sg.addColorStop(0.5, 'rgba(2,2,12,' + (0.55 * (o.shadow == null ? 1 : o.shadow)) + ')'); sg.addColorStop(1, 'rgba(2,2,12,' + (0.94 * (o.shadow == null ? 1 : o.shadow)) + ')');
    c.fillStyle = sg; c.fillRect(-20, -hh / 2, hw, hh);
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(10, 12, 6, 9);
  }
  c.strokeStyle = 'rgba(255,245,210,0.6)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-hw / 2 + 2, -hh / 2 + 16); c.lineTo(-hw / 2 + 2, hh / 2 - 16); c.stroke();
  c.restore();
  c.restore();
};

// 天の手を掲げる場面は、右肩の肩当てを場面側で描く
const baseDrawPin13 = cnDrawPinScene;
cnDrawPinScene = function (c, ph, t) { CN.giantHand = true; baseDrawPin13(c, ph, t); CN.giantHand = false; };

// ==========================================
// 廊下の成長シーン
//   廊下が縮み（カメラが引く）、主人公が大きくなる。衣をまとい、天の手が現れ、天井を突き破る
// ==========================================
cnCorridor = function (c, m) {
  const g = cnEase((m - 250) / 810);
  const hs = 1 + 1.8 * g;
  const Sc = 360 / hs;
  const D = m * 0.05;
  const ph = 1 / (1 + 0.5 * 0.42);
  const footY = 566, VPx = 210;
  const VPy = footY - 0.85 * Sc * ph + Math.sin(m * 0.16) * 2.5;
  const size = 0.17 * 360 * ph * hs;
  const lh = size * 0.22;
  const ceilY = VPy - 0.80 * Sc * ph;
  const robeK = cnEase((g - 0.12) / 0.3);
  const haloK = cnEase((g - 0.5) / 0.3);
  const armK = cnEase((g - 0.35) / 0.45);
  const handA = cnEase((g - 0.28) / 0.15);
  const hsc = size * 0.0075;
  const topSh = footY - lh - size * 0.8;
  const hx = VPx + size * 0.62;
  const hy = topSh - size * (0.1 + 1.55 * armK);
  const tipY = hy - 130 * hsc;
  const pierce = handA > 0.5 && tipY < ceilY;

  c.save();
  if (g > 0.6) c.translate((Math.random() - 0.5) * (g - 0.6) * 5, (Math.random() - 0.5) * (g - 0.6) * 5);
  const bg = c.createLinearGradient(0, 0, 0, 720);
  bg.addColorStop(0, '#04060F'); bg.addColorStop(1, '#0A0D1C');
  c.fillStyle = bg; c.fillRect(-20, -20, 460, 760);

  // 廊下の面
  const nx0 = VPx - 0.66 * Sc, nx1 = VPx + 0.66 * Sc, nyT = VPy - 0.80 * Sc, nyB = VPy + 0.85 * Sc;
  const wl = c.createLinearGradient(nx0, 0, VPx, 0); wl.addColorStop(0, '#0B0F1E'); wl.addColorStop(1, '#2C3A60');
  c.fillStyle = wl; c.beginPath(); c.moveTo(nx0, nyT); c.lineTo(VPx, VPy); c.lineTo(nx0, nyB); c.closePath(); c.fill();
  const wr = c.createLinearGradient(nx1, 0, VPx, 0); wr.addColorStop(0, '#0B0F1E'); wr.addColorStop(1, '#2C3A60');
  c.fillStyle = wr; c.beginPath(); c.moveTo(nx1, nyT); c.lineTo(VPx, VPy); c.lineTo(nx1, nyB); c.closePath(); c.fill();
  const cg = c.createLinearGradient(0, nyT, 0, VPy); cg.addColorStop(0, '#080B18'); cg.addColorStop(1, '#222C4C');
  c.fillStyle = cg; c.beginPath(); c.moveTo(nx0, nyT); c.lineTo(nx1, nyT); c.lineTo(VPx, VPy); c.closePath(); c.fill();
  const fg = c.createLinearGradient(0, VPy, 0, nyB); fg.addColorStop(0, '#34437A'); fg.addColorStop(1, '#0C1020');
  c.fillStyle = fg; c.beginPath(); c.moveTo(nx0, nyB); c.lineTo(nx1, nyB); c.lineTo(VPx, VPy); c.closePath(); c.fill();
  // 奥の光
  c.save(); c.globalCompositeOperation = 'lighter';
  const vg = c.createRadialGradient(VPx, VPy, 2, VPx, VPy, 200);
  vg.addColorStop(0, 'rgba(215,230,255,0.9)'); vg.addColorStop(0.2, 'rgba(150,180,255,0.35)'); vg.addColorStop(1, 'rgba(60,80,160,0)');
  c.fillStyle = vg; c.fillRect(0, 0, 420, 720);
  c.restore();
  // 肋材と、床の光
  const N = 22;
  for (let i = N; i >= 0; i--) {
    const d = i - (D % 1);
    if (d < 0.02) continue;
    const p = 1 / (1 + d * 0.42);
    const x0 = VPx - 0.66 * Sc * p, x1 = VPx + 0.66 * Sc * p, yT = VPy - 0.80 * Sc * p, yB = VPy + 0.85 * Sc * p;
    const fog = cnClamp(1 - d / N);
    c.strokeStyle = 'rgba(150,175,255,' + (0.55 * fog * fog + 0.04) + ')'; c.lineWidth = 1 + 5 * p;
    c.strokeRect(x0, yT, x1 - x0, yB - yT);
    c.strokeStyle = 'rgba(255,255,255,' + (0.18 * fog * fog) + ')'; c.lineWidth = Math.max(1, 2 * p);
    c.strokeRect(x0 + 6 * p, yT + 6 * p, x1 - x0 - 12 * p, yB - yT - 12 * p);
    // 壁の溝
    c.strokeStyle = 'rgba(20,30,60,' + (0.5 * fog) + ')'; c.lineWidth = Math.max(1, 3 * p);
    for (let k = 1; k <= 3; k++) { const yy = yT + (yB - yT) * k / 4; c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + 14 * p, yy); c.moveTo(x1, yy); c.lineTo(x1 - 14 * p, yy); c.stroke(); }
    // 天井灯（光のにじみ）
    c.save(); c.globalCompositeOperation = 'lighter';
    const lg = c.createRadialGradient(VPx, yT + 0.04 * Sc * p, 1, VPx, yT + 0.04 * Sc * p, 0.34 * Sc * p);
    lg.addColorStop(0, 'rgba(210,228,255,' + (0.5 * fog) + ')'); lg.addColorStop(1, 'rgba(210,228,255,0)');
    c.fillStyle = lg; c.fillRect(VPx - 0.4 * Sc * p, yT - 0.1 * Sc * p, 0.8 * Sc * p, 0.5 * Sc * p);
    c.restore();
    c.fillStyle = 'rgba(235,244,255,' + (0.6 * fog) + ')'; c.fillRect(VPx - 0.14 * Sc * p, yT + 0.03 * Sc * p, 0.28 * Sc * p, 0.03 * Sc * p);
    c.fillStyle = 'rgba(200,220,255,' + (0.14 * fog) + ')'; c.fillRect(VPx - 0.05 * Sc * p, yB - 0.02 * Sc * p, 0.1 * Sc * p, 0.02 * Sc * p);
  }

  // 天井が割れる（手が突き破る）
  if (pierce) {
    const open = cnClamp((ceilY - tipY) / (60 * hsc + 20));
    const rx = (70 * hsc + 20) * (0.6 + 0.6 * open);
    c.save(); c.globalCompositeOperation = 'lighter';
    const sh = c.createLinearGradient(hx, ceilY, hx, footY);
    sh.addColorStop(0, 'rgba(255,248,215,' + (0.45 * open) + ')'); sh.addColorStop(1, 'rgba(255,248,215,0)');
    c.fillStyle = sh;
    c.beginPath(); c.moveTo(hx - rx, ceilY); c.lineTo(hx + rx, ceilY); c.lineTo(hx + rx * 2.4, footY); c.lineTo(hx - rx * 2.4, footY); c.closePath(); c.fill();
    c.restore();
    const hg2 = c.createRadialGradient(hx, ceilY, 2, hx, ceilY, rx);
    hg2.addColorStop(0, '#FFFFFF'); hg2.addColorStop(0.6, '#CFE2FF'); hg2.addColorStop(1, '#7FA2E0');
    c.fillStyle = hg2; c.beginPath(); c.ellipse(hx, ceilY, rx, rx * 0.2, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.85)'; c.lineWidth = 3;
    const rr = cnRng(5);
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 2 * i / 9 + rr() * 0.3, L = rx * (1.1 + rr() * 1.4);
      c.beginPath(); c.moveTo(hx + Math.cos(a) * rx * 0.9, ceilY + Math.sin(a) * rx * 0.18);
      c.lineTo(hx + Math.cos(a) * L, ceilY + Math.sin(a) * L * 0.2 + (rr() - 0.5) * 8); c.stroke();
    }
  }

  // 過去の自分たち（背後を、同じ歩調でついてくる）
  for (let k = 3; k >= 1; k--) {
    const d = 0.5 + k * 1.7, p = 1 / (1 + d * 0.42);
    const gA = 0.3 * cnClamp((g - 0.05) / 0.2) * (1 - k * 0.2);
    if (gA <= 0) continue;
    c.save(); c.globalAlpha = gA;
    cnHeroBack(c, VPx + (k % 2 ? 1 : -1) * 26 * p * k, VPy + 0.85 * Sc * p, 0.17 * 360 * p * (1 + 1.8 * g * (1 - 0.3 * k)), m - k * 9);
    c.restore();
  }
  // 床への映り込み
  c.save(); c.globalAlpha = 0.18;
  c.translate(0, 2 * footY); c.scale(1, -1);
  cnHeroBack(c, VPx, footY, size, m);
  c.restore();

  // 後光
  if (haloK > 0) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const hy0 = footY - lh - size * 0.55;
    const hr = c.createRadialGradient(VPx, hy0, size * 0.4, VPx, hy0, size * 1.5);
    hr.addColorStop(0, 'rgba(255,225,150,' + (0.4 * haloK) + ')'); hr.addColorStop(1, 'rgba(255,225,150,0)');
    c.fillStyle = hr; c.beginPath(); c.arc(VPx, hy0, size * 1.5, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = 'rgba(250,220,120,' + (0.7 * haloK) + ')'; c.lineWidth = Math.max(2, size * 0.02);
    c.beginPath(); c.arc(VPx, hy0, size * 0.92, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  // 天の手（右腕を掲げる。袖は肩のあたりまで）
  if (handA > 0) {
    c.save();
    c.beginPath(); c.rect(-400, -3000, 1200, topSh + 3000 + size * 0.1); c.clip();
    c.globalAlpha = handA;
    c.translate(hx, hy);
    c.rotate(Math.PI + 0.1 + Math.sin(m * 0.03) * 0.02);
    const cu = 0.1 + 0.08 * Math.sin(m * 0.05);
    drawGiantHandBack(c, 0, 0, hsc, cu);
    drawGiantHandFront(c, 0, 0, hsc, cu);
    c.restore();
  }

  // 主人公
  cnHeroBack(c, VPx, footY, size, m);
  // 長いはちまきの尾（成長するほど長く流れる）
  if (g > 0.1) {
    const sk = getCurrentSkin();
    const L = size * (0.3 + 1.6 * g);
    for (let sd = -1; sd <= 1; sd += 2) {
      c.fillStyle = sk.bandColor; c.strokeStyle = INK3; c.lineWidth = Math.max(1.5, size * 0.03);
      c.beginPath();
      const by0 = footY - lh - size * 0.74;
      c.moveTo(VPx + sd * size * 0.45, by0);
      c.bezierCurveTo(VPx + sd * (size * 0.45 + L * 0.4), by0 + Math.sin(m * 0.08) * size * 0.1, VPx + sd * (size * 0.45 + L * 0.7), by0 - size * 0.1 + Math.sin(m * 0.08 + 1) * size * 0.2, VPx + sd * (size * 0.45 + L), by0 + size * 0.1 + Math.sin(m * 0.08 + 2) * size * 0.2);
      c.lineTo(VPx + sd * (size * 0.45 + L * 0.96), by0 + size * 0.2 + Math.sin(m * 0.08 + 2) * size * 0.2);
      c.bezierCurveTo(VPx + sd * (size * 0.45 + L * 0.6), by0 + size * 0.12, VPx + sd * (size * 0.45 + L * 0.3), by0 + size * 0.1, VPx + sd * size * 0.45, by0 + size * 0.14);
      c.closePath(); c.fill(); c.stroke();
    }
  }
  // 白い衣・金の襟・肩当て
  if (robeK > 0) {
    c.save(); c.globalAlpha = robeK;
    const sway = Math.sin(m * 0.1) * size * 0.04;
    const rg = c.createLinearGradient(0, topSh, 0, footY);
    rg.addColorStop(0, '#F2F4FA'); rg.addColorStop(0.6, '#A9B4D0'); rg.addColorStop(1, '#3A4466');
    c.fillStyle = rg; c.strokeStyle = INK3; c.lineWidth = Math.max(2, size * 0.035);
    c.beginPath();
    c.moveTo(VPx - size * 0.5, topSh); c.lineTo(VPx + size * 0.5, topSh);
    c.quadraticCurveTo(VPx + size * 0.78, (topSh + footY) / 2, VPx + size * 0.92 + sway, footY - size * 0.04);
    c.quadraticCurveTo(VPx, footY + size * 0.06, VPx - size * 0.92 + sway, footY - size * 0.04);
    c.quadraticCurveTo(VPx - size * 0.78, (topSh + footY) / 2, VPx - size * 0.5, topSh);
    c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(232,190,70,0.9)'; c.lineWidth = Math.max(2, size * 0.03);
    c.beginPath(); c.moveTo(VPx - size * 0.9 + sway, footY - size * 0.05); c.quadraticCurveTo(VPx, footY + size * 0.05, VPx + size * 0.9 + sway, footY - size * 0.05); c.stroke();
    c.strokeStyle = 'rgba(90,100,140,0.35)'; c.lineWidth = Math.max(1.5, size * 0.02);
    for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(VPx + i * size * 0.18, topSh + size * 0.1); c.quadraticCurveTo(VPx + i * size * 0.26, (topSh + footY) / 2, VPx + i * size * 0.34 + sway, footY - size * 0.08); c.stroke(); }
    // 金の襟
    c.strokeStyle = INK3; c.lineWidth = Math.max(3, size * 0.07);
    c.beginPath(); c.ellipse(VPx, topSh, size * 0.4, size * 0.09, 0, 0, Math.PI); c.stroke();
    c.strokeStyle = '#FACC15'; c.lineWidth = Math.max(2, size * 0.05);
    c.beginPath(); c.ellipse(VPx, topSh, size * 0.4, size * 0.09, 0, 0, Math.PI); c.stroke();
    // 肩当て
    [-1, 1].forEach(sd => {
      const pg = c.createLinearGradient(VPx + sd * size * 0.5 - size * 0.2, topSh - size * 0.1, VPx + sd * size * 0.5 + size * 0.2, topSh + size * 0.1);
      pg.addColorStop(0, '#FEF08A'); pg.addColorStop(0.5, '#FACC15'); pg.addColorStop(1, '#8A5A0E');
      c.fillStyle = pg; c.strokeStyle = INK3; c.lineWidth = Math.max(2, size * 0.03);
      c.beginPath(); c.ellipse(VPx + sd * size * 0.52, topSh + size * 0.03, size * 0.22, size * 0.11, sd * 0.25, 0, Math.PI * 2); c.fill(); c.stroke();
    });
    c.restore();
  }

  // 壁のひび
  if (g > 0.5) {
    const a = cnClamp((g - 0.5) / 0.4);
    c.strokeStyle = 'rgba(0,0,0,' + (0.9 * a) + ')'; c.lineWidth = 3;
    CN.cracks.forEach(pts => { c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke(); });
    c.strokeStyle = 'rgba(255,255,255,' + (0.35 * a) + ')'; c.lineWidth = 1;
    CN.cracks.forEach(pts => { c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0] + 1, q[1] + 1) : c.moveTo(q[0] + 1, q[1] + 1))); c.stroke(); });
  }
  if (m % 2 === 0) cnSpawn(1, VPx + (Math.random() - 0.5) * 30, VPy + (Math.random() - 0.5) * 20, { sp: 2.2, life: 70, size: 1.8, col: '#BFD0FF', glow: true });
  if (pierce && m % 3 === 0) cnSpawn(2, hx + (Math.random() - 0.5) * 60 * hsc, ceilY, { a0: Math.PI * 0.2, a1: Math.PI * 0.8, sp: 3, life: 60, size: 4, col: '#DDE6FF', g: 0.2, glow: false });
  cnParts(c);
  c.restore();
};

// 手が天井を突き破る瞬間の音と破片
const baseTickMovie13 = cnTickMovie;
cnTickMovie = function (m) {
  baseTickMovie13(m);
  if (m === 660) {
    cnSfx('shatter');
    CN.shake = 22;
    for (let i = 0; i < 60; i++) cnSpawn(1, 150 + Math.random() * 190, 380, { a0: Math.PI * 0.15, a1: Math.PI * 0.85, sp: 6, life: 70, size: 6, col: i % 2 ? '#B9C4E6' : '#FFFFFF', g: 0.25, glow: i % 4 === 0 });
    cnTone('sine', 220, 880, 0, 1.6, 0.08);
  }
  if (m === 1000) {
    CN.shake = 26;
    cnTone('sawtooth', 70, 280, 0, 1.6, 0.14);
  }
};

// ==========================================
// 巨人の場面: 足元から顔へ、見上げるように始まる。手は大きく
// ==========================================
cnPlain = function (c, t) {
  const W = 420, H = 720;
  const rewU = Math.max(0, t - 550);
  const rew = cnEase(rewU / 300);
  const tm = t < 550 ? t : 550 - (rewU + 0.008 * rewU * rewU);
  const zoom = 1 + 0.06 * cnEase(t / 800);
  const pan = 300 * (1 - cnEase(t / 240));
  CN.giantHand = true;
  c.fillStyle = '#050206'; c.fillRect(0, 0, W, H);
  c.save();
  c.translate(210, 360); c.scale(zoom, zoom); c.translate(-210, -360 - pan);
  c.globalAlpha = rew > 0 ? 1 - 0.55 * rew : 1;
  const sg = c.createLinearGradient(0, -400, 0, 520);
  sg.addColorStop(0, '#0A0314'); sg.addColorStop(0.35, '#59122E'); sg.addColorStop(0.68, '#CC5A22'); sg.addColorStop(1, '#F6AC52');
  c.fillStyle = sg; c.fillRect(-40, -400, W + 80, 920);
  c.globalAlpha = 1;
  const gx = 150, gy = 350, gs = 1.3;
  const cx0 = gx, cy0 = gy - 96 * gs;
  // 暗い太陽と、まわりの光
  c.save(); c.globalCompositeOperation = 'lighter';
  const co = c.createRadialGradient(cx0, cy0, 100, cx0, cy0, 300);
  co.addColorStop(0, 'rgba(255,170,70,0.9)'); co.addColorStop(0.35, 'rgba(255,110,40,0.38)'); co.addColorStop(1, 'rgba(255,90,30,0)');
  c.fillStyle = co; c.beginPath(); c.arc(cx0, cy0, 300, 0, Math.PI * 2); c.fill();
  // 光の筋（雲間から）
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.95 + i * 0.22 + Math.sin(tm * 0.004 + i) * 0.03;
    const rg2 = c.createLinearGradient(cx0, cy0, cx0 + Math.cos(a) * 520, cy0 + Math.sin(a) * 520);
    rg2.addColorStop(0, 'rgba(255,190,110,0.16)'); rg2.addColorStop(1, 'rgba(255,190,110,0)');
    c.fillStyle = rg2; c.beginPath(); c.moveTo(cx0, cy0); c.lineTo(cx0 + Math.cos(a - 0.05) * 520, cy0 + Math.sin(a - 0.05) * 520); c.lineTo(cx0 + Math.cos(a + 0.05) * 520, cy0 + Math.sin(a + 0.05) * 520); c.closePath(); c.fill();
  }
  c.restore();
  c.fillStyle = '#07030A'; c.beginPath(); c.arc(cx0, cy0, 104, 0, Math.PI * 2); c.fill();
  // 時計（針だけ）
  const ca = cnEase((t - 250) / 120);
  if (ca > 0) {
    c.save(); c.translate(cx0, cy0); c.globalAlpha = ca * 0.9; c.strokeStyle = '#F5D77A'; c.lineCap = 'round';
    c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 196, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 186, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 60; i++) {
      const a = i * Math.PI / 30, l = i % 5 === 0 ? 18 : 8;
      c.lineWidth = i % 5 === 0 ? 3 : 1.5;
      c.beginPath(); c.moveTo(Math.cos(a) * (196 - l), Math.sin(a) * (196 - l)); c.lineTo(Math.cos(a) * 196, Math.sin(a) * 196); c.stroke();
    }
    const ma = tm * 0.02 - Math.PI / 2, ha = tm * 0.02 / 12 - Math.PI / 2;
    c.strokeStyle = '#FFE9A8'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ma) * 166, Math.sin(ma) * 166); c.stroke();
    c.lineWidth = 8; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ha) * 110, Math.sin(ha) * 110); c.stroke();
    c.restore();
  }
  // 雲（層ごとに色と速さが違う）
  for (let L = 0; L < 4; L++) {
    for (let i = 0; i < 6; i++) {
      const x = cnMod(i * 190 + tm * (0.2 + L * 0.18) + L * 70, 760) - 170;
      const y = 300 + L * 54 + (i % 2) * 14;
      const cg = c.createLinearGradient(0, y - 24, 0, y + 24);
      cg.addColorStop(0, 'rgba(' + (120 - L * 20) + ',' + (40 + L * 4) + ',' + (60 + L * 6) + ',' + (0.5 - L * 0.07) + ')');
      cg.addColorStop(1, 'rgba(20,6,20,' + (0.55 - L * 0.07) + ')');
      c.fillStyle = cg;
      c.beginPath(); c.ellipse(x, y, 170 + L * 30, 18 + L * 6, 0, 0, Math.PI * 2); c.fill();
    }
  }
  // 遠くの山（空気遠近法）と、手前の山
  [['#3A1020', 500, 0.5], ['#12060F', 520, 1]].forEach((mt, li) => {
    c.fillStyle = mt[0]; c.globalAlpha = mt[2];
    c.beginPath(); c.moveTo(-10, mt[1] + 40);
    [[40, -50], [110, -15], [190, -65], [270, -10], [350, -50], [430, -5]].forEach(p => c.lineTo(p[0] + li * 30, mt[1] + p[1]));
    c.lineTo(430, 1100); c.lineTo(-10, 1100); c.closePath(); c.fill();
  });
  c.globalAlpha = 1;
  const gg = c.createLinearGradient(0, 500, 0, 1100); gg.addColorStop(0, '#1B0A14'); gg.addColorStop(1, '#050206');
  c.fillStyle = gg; c.fillRect(-10, 520, 440, 600);
  // 大地の溶岩のひび
  c.strokeStyle = 'rgba(255,120,40,' + (0.5 + 0.3 * Math.sin(tm * 0.04)) + ')'; c.lineWidth = 2.5;
  for (let k = 0; k < 6; k++) {
    c.beginPath(); c.moveTo(40 + k * 70, 1000);
    for (let j = 1; j <= 8; j++) c.lineTo(40 + k * 70 + ((j % 2) ? 16 : -12), 1000 - j * 60);
    c.stroke();
  }
  // 火の粉
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 60; i++) {
    const x = cnMod(i * 53 + Math.sin(tm * 0.02 + i) * 14, 420);
    const y = 1000 - cnMod(tm * 0.9 + i * 67, 1100);
    c.fillStyle = 'rgba(255,170,80,' + (0.25 + 0.5 * Math.abs(Math.sin(i + tm * 0.05))) + ')';
    c.fillRect(x, y, 2.4, 2.4);
  }
  c.restore();
  // 掲げた天の手（大きく）
  const shY = gy + 62 * gs;
  c.save();
  c.beginPath(); c.rect(-100, -600, 700, shY + 600); c.clip();
  c.translate(gx + 152 * gs + 6, 150); c.rotate(Math.PI + 0.1);
  const hc = 0.08 + 0.1 * Math.sin(tm * 0.03);
  drawGiantHandBack(c, 0, 0, 1.4, hc); drawGiantHandFront(c, 0, 0, 1.4, hc);
  c.restore();
  // 巨人
  cnGiant(c, gx, gy, gs, { t: tm, eye: 0.9 + 0.1 * Math.sin(tm * 0.07) });
  // 右肩の肩当て（手のつなぎ目）
  c.save(); c.translate(gx + 152 * gs, shY);
  const pg = c.createLinearGradient(-60, -30, 60, 30);
  pg.addColorStop(0, '#FEF08A'); pg.addColorStop(0.5, '#FACC15'); pg.addColorStop(1, '#8A5A0E');
  c.fillStyle = pg; c.strokeStyle = INK3; c.lineWidth = 4;
  c.beginPath(); c.ellipse(0, 0, 70, 38, 0.25, 0, Math.PI * 2); c.fill(); c.stroke();
  c.strokeStyle = 'rgba(120,80,10,0.7)'; c.lineWidth = 2;
  for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 20, -26); c.lineTo(k * 20 + 4, 26); c.stroke(); }
  c.fillStyle = '#38BDF8'; c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.fill(); c.stroke();
  c.restore();
  c.restore();
  CN.giantHand = false;
  // 時が戻る
  if (rew > 0) {
    c.fillStyle = 'rgba(90,140,220,' + (0.30 * rew) + ')'; c.fillRect(0, 0, W, H);
    if (rew > 0.5) {
      c.save(); c.strokeStyle = 'rgba(255,255,255,' + (0.35 * (rew - 0.5) * 2) + ')'; c.lineWidth = 2;
      for (let i = 0; i < 34; i++) {
        const a = i * 0.185 + t * 0.01, r0 = 120 + (i % 5) * 30, r1 = r0 + 160 + (rew - 0.5) * 600;
        c.beginPath(); c.moveTo(210 + Math.cos(a) * r0, 360 + Math.sin(a) * r0); c.lineTo(210 + Math.cos(a) * r1, 360 + Math.sin(a) * r1); c.stroke();
      }
      c.restore();
    }
  }
};

// ==========================================
// 地球: 夜の街の灯りと、オーロラ
// ==========================================
cnEarthFeat = function (c, x, y, r) {
  const off = (CN.earthOff || 0) % 1000;
  if (!CN.cities) {
    const rr = cnRng(404);
    CN.cities = [];
    for (let i = 0; i < 220; i++) CN.cities.push([rr() * 1000, (rr() - 0.5) * 560, 0.6 + rr() * 1.4]);
  }
  for (let k = -1; k <= 1; k++) {
    c.save();
    c.translate(x - 500 - off + k * 1000, y);
    const og = c.createLinearGradient(0, -r, 0, r);
    og.addColorStop(0, '#2E7BC9'); og.addColorStop(0.5, '#1D5FB5'); og.addColorStop(1, '#134A94');
    c.fillStyle = '#3E9150';
    CN.earth.blobs.forEach(p => { c.beginPath(); p.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); c.fill(); });
    c.fillStyle = 'rgba(190,170,110,0.35)';
    CN.earth.blobs.forEach((p, bi) => { if (bi % 3) return; c.beginPath(); p.forEach((q, i) => (i ? c.lineTo(q[0] * 0.98 + 4, q[1] * 0.98 + 4) : c.moveTo(q[0] * 0.98 + 4, q[1] * 0.98 + 4))); c.closePath(); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,0.45)';
    CN.earth.clouds.forEach(q => { c.beginPath(); c.ellipse(q[0], q[1], q[2], q[3], 0, 0, Math.PI * 2); c.fill(); });
    // 街の灯り（夜の側＝右下だけ）
    c.globalCompositeOperation = 'lighter';
    CN.cities.forEach(q => {
      const sx = x - 500 - off + k * 1000 + q[0], sy = y + q[1];
      const nf = ((sx - x) * 0.45 + (sy - y) * 0.5) / r;
      if (nf > 0.25) {
        c.fillStyle = 'rgba(255,214,120,' + cnClamp((nf - 0.25) * 1.6) * 0.9 + ')';
        c.fillRect(q[0] - 500 + 500 - 500 + 0, q[1], q[2], q[2]);
      }
    });
    c.restore();
  }
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath(); c.ellipse(x, y - r * 0.98, r * 0.5, r * 0.1, 0, 0, Math.PI * 2); c.fill();
  // オーロラ
  c.save(); c.globalCompositeOperation = 'lighter';
  const T = (CN.t || 0) * 0.03;
  for (let i = 0; i < 3; i++) {
    const ag = c.createLinearGradient(0, y - r, 0, y - r * 0.7);
    ag.addColorStop(0, 'rgba(80,255,180,0)'); ag.addColorStop(0.4, 'rgba(80,255,180,' + (0.3 + 0.15 * Math.sin(T + i)) + ')'); ag.addColorStop(1, 'rgba(120,120,255,0)');
    c.fillStyle = ag;
    c.beginPath(); c.moveTo(x - 160, y - r * 0.9);
    for (let j = 0; j <= 8; j++) c.lineTo(x - 160 + j * 40, y - r * (0.93 + 0.03 * i) + Math.sin(T + j * 0.7 + i) * 8);
    c.lineTo(x + 160, y - r * 0.7); c.lineTo(x - 160, y - r * 0.7); c.closePath(); c.fill();
  }
  c.restore();
};

// ==========================================
// ムービー全体の仕上げ: 光のにじみ・粒子・色調
// ==========================================
function cnBloom(c, k) {
  if (!CN.bloom) {
    CN.bloom = document.createElement('canvas'); CN.bloom.width = 105; CN.bloom.height = 180;
    CN.bloom2 = document.createElement('canvas'); CN.bloom2.width = 52; CN.bloom2.height = 90;
  }
  const b = CN.bloom.getContext('2d'), b2 = CN.bloom2.getContext('2d');
  b.clearRect(0, 0, 105, 180); b.drawImage(c.canvas, 0, 0, 105, 180);
  b2.clearRect(0, 0, 52, 90); b2.drawImage(CN.bloom, 0, 0, 52, 90);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
  c.globalAlpha = k; c.drawImage(CN.bloom2, 0, 0, 420, 720);
  c.globalAlpha = k * 0.6; c.drawImage(CN.bloom, 0, 0, 420, 720);
  c.restore();
}
function cnGrain(c, a) {
  if (!CN.noise) {
    const nc = document.createElement('canvas'); nc.width = 128; nc.height = 128;
    const nx = nc.getContext('2d'), id = nx.createImageData(128, 128);
    for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    nx.putImageData(id, 0, 0);
    CN.noise = nc;
  }
  c.save();
  c.globalAlpha = a;
  c.globalCompositeOperation = 'overlay';
  const pat = c.createPattern(CN.noise, 'repeat');
  c.translate(Math.floor(Math.random() * 128), Math.floor(Math.random() * 128));
  c.fillStyle = pat; c.fillRect(-128, -128, 420 + 256, 720 + 256);
  c.restore();
}

cnMovieDraw = function (c, m) {
  const W = 420, H = 720;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0;
  let shx = 0, shy = 0;
  if (CN.shake > 0) { shx = (Math.random() - 0.5) * CN.shake; shy = (Math.random() - 0.5) * CN.shake; CN.shake *= 0.9; if (CN.shake < 0.4) CN.shake = 0; }
  c.save();
  c.translate(shx, shy);
  if (m < 1100) cnCorridor(c, m);
  else if (m < 1950) cnPlain(c, m - 1100);
  else if (m < 2550) cnSpace(c, m - 1950);
  else if (m < 3000) cnArena(c, m - 2550);
  else if (m < 3700) cnWait(c, m - 3000);
  else cnFinal(c, m - 3700);
  c.restore();
  // 色調: 場面ごとの空気
  let tint = null;
  if (m < 1100) tint = 'rgba(30,60,140,0.10)';
  else if (m < 1950) tint = 'rgba(255,120,40,0.05)';
  else if (m >= 2550 && m < 3000) tint = 'rgba(20,80,120,0.10)';
  if (tint) { c.fillStyle = tint; c.fillRect(0, 0, W, H); }
  cnBloom(c, 0.22);
  cnGrain(c, 0.10);
  cnVig(c, 0.5);
  c.fillStyle = '#000'; c.fillRect(0, 0, W, 52); c.fillRect(0, H - 52, W, 52);
  let col = null, a = 0;
  if (m < 60) { col = '255,255,255'; a = 1 - m / 60; }
  else if (m >= 1070 && m < 1100) { col = '255,255,255'; a = (m - 1070) / 30; }
  else if (m >= 1100 && m < 1150) { col = '255,255,255'; a = 1 - (m - 1100) / 50; }
  else if (m >= 1930 && m < 1950) { col = '255,255,255'; a = (m - 1930) / 20; }
  else if (m >= 1950 && m < 1990) { col = '255,255,255'; a = 1 - (m - 1950) / 40; }
  else if (m >= 2530 && m < 2550) { col = '0,0,0'; a = (m - 2530) / 20; }
  else if (m >= 2550 && m < 2590) { col = '0,0,0'; a = 1 - (m - 2550) / 40; }
  else if (m >= 2980 && m < 3000) { col = '0,0,0'; a = (m - 2980) / 20; }
  else if (m >= 3000 && m < 3040) { col = '0,0,0'; a = 1 - (m - 3000) / 40; }
  else if (m >= 3680 && m < 3700) { col = '0,0,0'; a = (m - 3680) / 20; }
  else if (m >= 3700 && m < 3730) { col = '0,0,0'; a = 1 - (m - 3700) / 30; }
  else if (m >= 4090) { col = '255,255,255'; a = cnClamp((m - 4090) / 60); }
  if (col && a > 0) { c.fillStyle = 'rgba(' + col + ',' + a + ')'; c.fillRect(0, 0, W, H); }
};


/* SPLIT14 */
// ==========================================
// 全ストーリーステージを4分割
//   各ステージを、長さ（ゴールのm数）はそのままで4つのステージにし、ステージ数を4倍にする
//   対象: 日本列島篇 / 世界篇 / 宇宙編 / THE FANTASY
//   ボスは、分割した最後のパートに出る
//   PRACTICE / RECORD / EXTRA(否愚魔) は、そのまま
// ==========================================
const SPLIT_PARTS = 4;
const SPLIT_ARCS = ['japan', 'world', 'space', 'fantasy'];
const SPLIT_TEXT_ALL = true;   // true: 豆知識と台詞を、4つのパートすべてで出す / false: 豆知識は最後のパートだけ、台詞は1回だけ

// ---------- ステージデータを4分割（配列は中身だけ入れ替える。FAN_STAGESも同じ配列なので一緒に変わる） ----------
SPLIT_ARCS.forEach(arc => {
  const list = STORY_DATA[arc];
  if (!list || !list.length || list[0]._parts) return;
  const out = [];
  list.forEach((st, i) => {
    // 台詞は、天の手のステージだけ最後のパート（ボスの手前）、ほかは最初のパート
    const lineAt = (typeof FAN_BOSS !== 'undefined' && st.boss === FAN_BOSS) ? SPLIT_PARTS - 1 : 0;
    for (let p = 0; p < SPLIT_PARTS; p++) {
      out.push(Object.assign({}, st, {
        name: st.name + '（' + (p + 1) + '/' + SPLIT_PARTS + '）',
        baseName: st.name,
        goal: st.goal,
        boss: p === SPLIT_PARTS - 1 ? st.boss : null,
        lines: (SPLIT_TEXT_ALL || p === lineAt) ? st.lines : [],
        _part: p,
        _parts: SPLIT_PARTS,
        _orig: i
      }));
    }
  });
  list.splice(0, list.length, ...out);
});

// ---------- 進行状況の引き継ぎ（1回だけ）: クリア数を4倍にして、次のステージが開くようにする ----------
try {
  if (localStorage.getItem('wallKickSplit4') !== '1') {
    SPLIT_ARCS.forEach(a => {
      storyProgress[a] = Math.min(STORY_DATA[a].length, (storyProgress[a] || 0) * SPLIT_PARTS);
    });
    localStorage.setItem('wallKickStoryProgress', JSON.stringify(storyProgress));
    localStorage.setItem('wallKickSplit4', '1');
  }
} catch (e) {}

// ---------- ステージ設定: 序盤の弓兵の範囲と、ファンタジーの背景を、元のステージ単位にそろえる ----------
const baseBuildStoryConfig14 = buildStoryConfig;
buildStoryConfig = function (arc, idx) {
  const c = baseBuildStoryConfig14(arc, idx);
  if (arc === 'japan') c.archerChance = idx < 10 * SPLIT_PARTS ? 0.15 : 0.32;
  if (arc === 'fantasy' && typeof FANTASY_AREAS !== 'undefined') {
    const pal = FANTASY_AREAS[Math.floor(idx / SPLIT_PARTS) % FANTASY_AREAS.length];
    c.bgTop = pal.bgTop;
    c.bgBottom = pal.bgBottom;
    c.wallColor = pal.wallColor;
    c.wallLight = pal.wallLight;
    c.wallDark = pal.wallDark;
  }
  return c;
};

// ---------- 結果画面: 豆知識の表示（SPLIT_TEXT_ALL が false なら、最後のパートだけ） ----------
const baseShowResult14 = showResult;
showResult = function (isClear) {
  baseShowResult14(isClear);
  if (!isClear || screenResult.classList.contains('hidden')) return;
  const cfg = STAGES[currentDifficulty];
  const info = cfg && cfg.isStory ? cfg.storyInfo : null;
  if (!info || !info._parts) return;
  if (!SPLIT_TEXT_ALL && info._part < info._parts - 1) {
    document.getElementById('result-trivia-box').classList.add('hidden');
    return;
  }
  // 見出しに「（1/4）」が混ざらないよう、元のステージ名だけにする
  const head = document.getElementById('trivia-header');
  if (head) head.textContent = head.textContent.replace(/（\d+\/\d+）/, '');
};

// ---------- ファンタジー: 台詞の話者名から「（1/4）」を外す ----------
if (typeof utPush === 'function') {
  const baseUtPush14 = utPush;
  utPush = function (lines, name) {
    baseUtPush14(lines, name ? name.replace(/（\d+\/\d+）$/, '') : name);
  };
}

// ---------- ファンタジー: 一覧の表示（ボスのいないパートの「BOSS: null」を直す）と、隠し出口の位置 ----------
if (typeof renderFantasyList === 'function' && typeof FAN_STAGES !== 'undefined') {
  const baseRenderFantasyList14 = renderFantasyList;
  renderFantasyList = function () {
    baseRenderFantasyList14();
    const items = document.querySelectorAll('#story-stage-list .story-item');
    items.forEach((el, i) => {
      const st = FAN_STAGES[i];
      if (st && !st.boss) {
        el.classList.remove('boss-stage');
        const b = el.querySelector('.story-badge.boss');
        if (b) {
          b.classList.remove('boss');
          b.textContent = st.region;
        }
      }
    });
    if (typeof FAN_EXIT_STAGE !== 'undefined') {
      // 元の位置に付いた出口のヒントを外して、4分割後の位置に付け直す
      const wrong = items[FAN_EXIT_STAGE];
      if (wrong) {
        const left = wrong.querySelector('div');
        const last = left && left.lastElementChild;
        if (last && (last.textContent === '？' || last.textContent === '出口')) left.removeChild(last);
      }
      const right = items[FAN_EXIT_STAGE * SPLIT_PARTS + 1];
      if (fanLoop > 0 && right && !right.classList.contains('locked')) {
        const badge = document.createElement('span');
        badge.className = 'story-badge';
        badge.style.cssText = 'background:#1E1E24;color:#FDE047;margin-left:4px;';
        badge.textContent = fanEscaped ? '出口' : '？';
        const left = right.querySelector('div');
        if (left) left.appendChild(badge);
      }
    }
  };
}

// 隠し出口は、元の「虚空の港」の2つ目のパートに、元と同じ高さの比率で置く
if (typeof spawnFanExit === 'function' && typeof FAN_EXIT_STAGE !== 'undefined') {
  spawnFanExit = function () {
    fanExit = null;
    fanExitTaken = false;
    fanExitFx = 0;
    if (!fanIsFantasy()) return;
    if (currentStoryIndex !== FAN_EXIT_STAGE * SPLIT_PARTS + 1) return;
    const goal = STORY_DATA.fantasy[currentStoryIndex].goal;
    const midM = Math.floor(goal * 0.42);
    const y = 580 - midM * PIXELS_PER_METER;
    const w = 22, h = 36;
    fanExit = { x: RIGHT_WALL_X - w - 2, y: y - h / 2, w: w, h: h, side: 'right' };
  };
}

// ---------- 表示の更新: タブの話数、タイトルの「全N話」 ----------
(function () {
  const setText = (id, txt) => {
    const e = document.getElementById(id);
    if (e) e.textContent = txt;
  };
  setText('tab-japan', '日本列島篇 (' + STORY_DATA.japan.length + ')');
  setText('tab-world', '世界篇 (' + STORY_DATA.world.length + ')');
  setText('tab-space', '宇宙編 (' + STORY_DATA.space.length + ')');
  if (typeof fanTab !== 'undefined' && typeof FAN_STAGES !== 'undefined') {
    fanTab.textContent = 'THE FANTASY (' + FAN_STAGES.length + ')';
  }
  const tag = document.querySelector('.btn-story .stage-tag');
  if (tag) {
    let n = STORY_DATA.japan.length + STORY_DATA.world.length + STORY_DATA.space.length;
    if (typeof fantasyUnlocked !== 'undefined' && fantasyUnlocked && typeof FAN_STAGES !== 'undefined') n += FAN_STAGES.length;
    tag.textContent = '全' + n + '話';
  }
})();


/* SPLIT15 */
// ==========================================================================
// 0. タイトル画面下部の操作説明を削除
// ==========================================================================
(function () {
  document.querySelectorAll('.controls-hint').forEach(el => el.remove());
})();

// ==========================================================================
// 1. ステージ分割の再編
//    ・日本列島篇 / 世界篇 のみ 3分割（ステージ数3倍）＋地名分割
//    ・宇宙編 / THE FANTASY は通常のステージ数（1倍）
// ==========================================================================
(function () {
  const TARGET_ARCS = ['japan', 'world'];
  const ALL_ARCS = ['japan', 'world', 'space', 'fantasy'];
  const NEW_PARTS = 3;

  const JAPAN_SUBREGIONS = {
    '北海道': ['道央・札幌', '道北・旭川', '道東・十勝'],
    '青森県': ['津軽・弘前', '陸奥・青森', '南部・八戸'],
    '岩手県': ['盛岡・県央', '平泉・県南', '三陸・宮古'],
    '宮城県': ['仙台・仙南', '松島・大崎', '気仙沼・三陸'],
    '秋田県': ['秋田・男鹿', '大館・白神', '横手・角館'],
    '山形県': ['村山・蔵王', '庄内・酒田', '置賜・米沢'],
    '福島県': ['中通り・郡山', '会津・磐梯', '浜通り・いわき'],
    '茨城県': ['水戸・笠間', 'つくば・県西', '鹿行・大洗'],
    '栃木県': ['宇都宮・県央', '日光・那須', '足利・佐野'],
    '群馬県': ['前橋・高崎', '草津・吾妻', '桐生・館林'],
    '埼玉県': ['さいたま・県央', '川越・所沢', '秩父・長瀞'],
    '千葉県': ['千葉・幕張', '成田・銚子', '房総・館山'],
    '東京都': ['東京23区', '多摩・八王子', '奥多摩・島しょ'],
    '神奈川県': ['横浜・川崎', '鎌倉・湘南', '箱根・小田原'],
    '新潟県': ['新潟・下越', '長岡・魚沼', '上越・佐渡'],
    '富山県': ['富山・立山', '高岡・氷見', '黒部・魚津'],
    '石川県': ['金沢・加賀', '白山・小松', '能登・輪島'],
    '福井県': ['福井・永平寺', '勝山・大野', '敦賀・若狭'],
    '山梨県': ['甲府・昇仙峡', '富士五湖', '八ヶ岳・清里'],
    '長野県': ['長野・志賀', '松本・上高地', '諏訪・軽井沢'],
    '岐阜県': ['岐阜・美濃', '飛騨高山', '白川郷・下呂'],
    '静岡県': ['静岡・清水', '浜松・浜名湖', '伊豆・富士山麓'],
    '愛知県': ['名古屋・尾張', '豊田・西三河', '豊橋・渥美'],
    '三重県': ['津・伊賀', '伊勢・志摩', '熊野・尾鷲'],
    '滋賀県': ['大津・比叡', '彦根・長浜', '近江八幡・甲賀'],
    '京都府': ['京都市内', '宇治・南山城', '天橋立・丹後'],
    '大阪府': ['キタ・大阪城', 'ミナミ・堺', '北摂・河内'],
    '兵庫県': ['神戸・六甲', '姫路・播磨', '城崎・淡路島'],
    '奈良県': ['奈良公園・斑鳩', '飛鳥・橿原', '吉野・十津川'],
    '和歌山県': ['和歌山・高野山', '白浜・田辺', '那智勝浦・熊野'],
    '鳥取県': ['鳥取砂丘・因幡', '倉吉・三朝', '米子・大山'],
    '島根県': ['松江・宍道湖', '出雲大社・大田', '石見銀山・津和野'],
    '岡山県': ['岡山・吉備', '倉敷・瀬戸内', '津山・蒜山'],
    '広島県': ['広島・宮島', '呉・しまなみ', '尾道・福山'],
    '山口県': ['下関・角島', '山口・秋吉台', '萩・岩国'],
    '徳島県': ['徳島・鳴門', '祖谷・大歩危', '阿南・海部'],
    '香川県': ['高松・屋島', '丸亀・琴平', '小豆島・直島'],
    '愛媛県': ['松山・道後', '今治・しまなみ', '宇和島・大洲'],
    '高知県': ['高知・桂浜', '室戸・安芸', '四万十・足摺'],
    '福岡県': ['博多・天神', '北九州・門司', '太宰府・柳川'],
    '佐賀県': ['佐賀・吉野ヶ里', '唐津・呼子', '有田・嬉野'],
    '長崎県': ['長崎・雲仙', '佐世保・平戸', '五島・対馬'],
    '熊本県': ['熊本城・県央', '阿蘇・黒川', '天草・人吉'],
    '大分県': ['大分・別府', '湯布院・九重', '日田・臼杵'],
    '宮崎県': ['宮崎・青島', '高千穂・延岡', '日南・都城'],
    '鹿児島県': ['鹿児島・桜島', '霧島・指宿', '屋久島・奄美'],
    '沖縄県': ['那覇・首里', '恩納・美ら海', '石垣・宮古諸島']
  };

  const WORLD_SUBAREAS = ['西エリア', '中央エリア', '東エリア'];

  ALL_ARCS.forEach(arc => {
    const list = STORY_DATA[arc];
    if (!list || !list.length || !list[0]._parts) return;
    const restored = [];
    const oldParts = list[0]._parts;
    for (let i = 0; i < list.length; i += oldParts) {
      const chunk = list.slice(i, i + oldParts);
      const last = chunk[chunk.length - 1];
      const first = chunk[0];
      const baseName = first.baseName || first.name.replace(/（\d+\/\d+）$/, '');
      const clean = Object.assign({}, first, {
        name: baseName,
        boss: last.boss,
        lines: (first.lines && first.lines.length) ? first.lines : last.lines
      });
      delete clean._part;
      delete clean._parts;
      delete clean._orig;
      delete clean.baseName;
      restored.push(clean);
    }
    list.splice(0, list.length, ...restored);
  });

  TARGET_ARCS.forEach(arc => {
    const list = STORY_DATA[arc];
    if (!list || !list.length) return;
    const out = [];
    list.forEach((st, i) => {
      const subs = (arc === 'japan' && JAPAN_SUBREGIONS[st.name])
        ? JAPAN_SUBREGIONS[st.name]
        : WORLD_SUBAREAS;
      for (let p = 0; p < NEW_PARTS; p++) {
        out.push(Object.assign({}, st, {
          name: st.name + '（' + subs[p] + '）',
          baseName: st.name,
          goal: st.goal,
          boss: p === NEW_PARTS - 1 ? st.boss : null,
          lines: (typeof SPLIT_TEXT_ALL !== 'undefined' && SPLIT_TEXT_ALL) || p === 0 ? st.lines : [],
          _part: p,
          _parts: NEW_PARTS,
          _orig: i
        }));
      }
    });
    list.splice(0, list.length, ...out);
  });

  try {
    if (localStorage.getItem('wallKickSplit15_v1') !== '1') {
      const was4 = localStorage.getItem('wallKickSplit4') === '1';
      TARGET_ARCS.forEach(a => {
        let p = storyProgress[a] || 0;
        if (was4) p = Math.floor(p / 4);
        storyProgress[a] = Math.min(STORY_DATA[a].length, p * NEW_PARTS);
      });
      ['space', 'fantasy'].forEach(a => {
        if (!STORY_DATA[a]) return;
        let p = storyProgress[a] || 0;
        if (was4) p = Math.floor(p / 4);
        storyProgress[a] = Math.min(STORY_DATA[a].length, p);
      });
      localStorage.setItem('wallKickStoryProgress', JSON.stringify(storyProgress));
      localStorage.setItem('wallKickSplit15_v1', '1');
    }
  } catch (e) {}

  const prevBuildStoryConfig15 = buildStoryConfig;
  buildStoryConfig = function (arc, idx) {
    const c = prevBuildStoryConfig15(arc, idx);
    if (arc === 'japan') {
      c.archerChance = idx < 10 * NEW_PARTS ? 0.15 : 0.32;
    }
    if (arc === 'fantasy' && typeof FANTASY_AREAS !== 'undefined') {
      const pal = FANTASY_AREAS[idx % FANTASY_AREAS.length];
      c.bgTop = pal.bgTop;
      c.bgBottom = pal.bgBottom;
      c.wallColor = pal.wallColor;
      c.wallLight = pal.wallLight;
      c.wallDark = pal.wallDark;
    }
    return c;
  };

  if (typeof spawnFanExit === 'function' && typeof FAN_EXIT_STAGE !== 'undefined') {
    spawnFanExit = function () {
      fanExit = null;
      fanExitTaken = false;
      fanExitFx = 0;
      if (!fanIsFantasy()) return;
      if (currentStoryIndex !== FAN_EXIT_STAGE) return;
      const goal = STORY_DATA.fantasy[currentStoryIndex].goal;
      const midM = Math.floor(goal * 0.42);
      const y = 580 - midM * PIXELS_PER_METER;
      const w = 22, h = 36;
      fanExit = { x: RIGHT_WALL_X - w - 2, y: y - h / 2, w: w, h: h, side: 'right' };
    };
  }

  const prevShowResult15 = showResult;
  showResult = function (isClear) {
    prevShowResult15(isClear);
    const head = document.getElementById('trivia-header');
    if (head) head.textContent = head.textContent.replace(/（[^）]+）/, '');
  };

  const setText = (id, txt) => {
    const e = document.getElementById(id);
    if (e) e.textContent = txt;
  };
  setText('tab-japan', '日本列島篇 (' + STORY_DATA.japan.length + ')');
  setText('tab-world', '世界篇 (' + STORY_DATA.world.length + ')');
  setText('tab-space', '宇宙編 (' + STORY_DATA.space.length + ')');
  if (typeof fanTab !== 'undefined' && typeof FAN_STAGES !== 'undefined') {
    fanTab.textContent = 'THE FANTASY (' + FAN_STAGES.length + ')';
  }
  const tag = document.querySelector('.btn-story .stage-tag');
  if (tag) {
    let n = STORY_DATA.japan.length + STORY_DATA.world.length + STORY_DATA.space.length;
    if (typeof fantasyUnlocked !== 'undefined' && fantasyUnlocked && typeof FAN_STAGES !== 'undefined') {
      n += FAN_STAGES.length;
    }
    tag.textContent = '全' + n + '話';
  }
})();


// ==========================================================================
// 2. Recordモード 120m付近のコイン塊バグ修正
//    ・120m (y ≈ -2540) 付近のセグメント継ぎ目でトゲの安全位置補正が走った際や
//      連続生成時にコイン列が重複・密集するのを防止
//    ・縦間隔（最低52px）と同時存在数の上限をチェックし、塊発生を根絶
// ==========================================================================
(function () {
  let lastSpawnedCoinTopY = Infinity;

  const baseInitStageRecordFix = initStage;
  initStage = function (config) {
    lastSpawnedCoinTopY = Infinity;
    baseInitStageRecordFix(config);
    if (config && config.isRecord) {
      dedupeRecordCoins();
    }
  };

  const baseSpawnCoinLine15 = spawnCoinLine;
  spawnCoinLine = function (x, startY, count, spacingY = 30) {
    // 直前に配置したコイン列とY座標が近すぎる場合はスキップ（塊防止）
    const safeCount = Math.min(4, Math.max(1, count));
    const topY = startY - (safeCount - 1) * spacingY;
    if (Math.abs(startY - lastSpawnedCoinTopY) < 64) {
      return;
    }
    // すでに近くにコインが存在する場合もスキップ
    const hasNear = coins.some(c => !c.collected && Math.abs(c.y - startY) < 56);
    if (hasNear) return;

    lastSpawnedCoinTopY = topY;
    baseSpawnCoinLine15(x, startY, safeCount, spacingY);
  };

  function dedupeRecordCoins() {
    if (!coins || coins.length < 2) return;
    coins.sort((a, b) => b.y - a.y);
    const cleaned = [];
    let clusterCount = 0;
    let prevY = Infinity;
    for (let i = 0; i < coins.length; i++) {
      const c = coins[i];
      if (Math.abs(c.y - prevY) < 22) continue; // ほぼ同高度の重複コインを除去
      if (Math.abs(c.y - prevY) < 42) {
        clusterCount++;
        if (clusterCount >= 4) continue; // 5個以上の異常な塊をカット
      } else {
        clusterCount = 0;
      }
      cleaned.push(c);
      prevY = c.y;
    }
    coins.splice(0, coins.length, ...cleaned);
  }

  const baseGenerateSegment15 = generateSegment;
  generateSegment = function (fromY, toY, config) {
    baseGenerateSegment15(fromY, toY, config);
    if (config && config.isRecord) {
      dedupeRecordCoins();
    }
  };
})();


// ==========================================================================
// 3. 新要素「醸造」データ ＆ バトル中使用できる消耗品ポーションシステム
//    ・素材価格を少し値下げ
//    ・ポーションは装備してバトル中に使用（1回使うと消費される消耗品）
// ==========================================================================
const BREW_MATERIALS = [
  {
    id: 'herb', name: '薬草', rarity: 'N', col: '#4ADE80', price: 30, power: 1, desc: '基本の薬草',
    svg: '<svg viewBox="0 0 48 48"><path d="M24 40V14" stroke="#16A34A" stroke-width="3" stroke-linecap="round"/><path d="M24 30C14 30 10 20 12 14C18 14 24 20 24 30Z" fill="#4ADE80" stroke="#1E1E24" stroke-width="2"/><path d="M24 24C34 24 38 14 36 8C30 8 24 14 24 24Z" fill="#22C55E" stroke="#1E1E24" stroke-width="2"/><path d="M24 16C19 10 21 5 24 4C27 5 29 10 24 16Z" fill="#86EFAC" stroke="#1E1E24" stroke-width="2"/></svg>'
  },
  {
    id: 'dew', name: '朝露の水', rarity: 'N', col: '#38BDF8', price: 40, power: 1, desc: '澄んだ朝の雫',
    svg: '<svg viewBox="0 0 48 48"><path d="M24 6C24 6 10 22 10 31C10 38.7 16.3 44 24 44C31.7 44 38 38.7 38 31C38 22 24 6 24 6Z" fill="#38BDF8" stroke="#1E1E24" stroke-width="2.5"/><path d="M17 28C17 24 20 19 22 16" stroke="#E0F2FE" stroke-width="3" stroke-linecap="round" fill="none"/></svg>'
  },
  {
    id: 'shroom', name: '夜光茸', rarity: 'R', col: '#A78BFA', price: 115, power: 2, desc: '黄金を引き寄せる茸',
    svg: '<svg viewBox="0 0 48 48"><rect x="19" y="25" width="10" height="16" rx="2" fill="#E2E8F0" stroke="#1E1E24" stroke-width="2"/><path d="M8 26C8 14 15 8 24 8C33 8 40 14 40 26Z" fill="#8B5CF6" stroke="#1E1E24" stroke-width="2.5"/><circle cx="18" cy="18" r="3" fill="#DDD6FE"/><circle cx="29" cy="16" r="2.5" fill="#DDD6FE"/><circle cx="24" cy="22" r="2" fill="#FDE047"/></svg>'
  },
  {
    id: 'ember', name: '火蜥蜴の尾', rarity: 'R', col: '#FB923C', price: 150, power: 2, desc: '剛力を宿す熱い尾',
    svg: '<svg viewBox="0 0 48 48"><path d="M12 38C10 26 22 24 20 12C28 14 34 22 30 32C35 28 38 22 36 16C42 24 38 40 22 42C16 42 13 40 12 38Z" fill="#F97316" stroke="#1E1E24" stroke-width="2.2"/><path d="M18 37C17 30 24 28 24 21C28 24 30 31 24 37Z" fill="#FACC15"/></svg>'
  },
  {
    id: 'scale', name: '古竜の鱗', rarity: 'SR', col: '#F43F5E', price: 350, power: 4, desc: '鉄壁の護りを生む鱗',
    svg: '<svg viewBox="0 0 48 48"><polygon points="24,4 40,16 36,36 24,44 12,36 8,16" fill="#E11D48" stroke="#1E1E24" stroke-width="2.5"/><polygon points="24,10 34,18 31,32 24,38 17,32 14,18" fill="#FB7185" stroke="#1E1E24" stroke-width="1.5"/><line x1="24" y1="4" x2="24" y2="44" stroke="#1E1E24" stroke-width="1.5"/></svg>'
  },
  {
    id: 'stardust', name: '星屑の結晶', rarity: 'SSR', col: '#FACC15', price: 750, power: 7, desc: '伝説級の神秘結晶',
    svg: '<svg viewBox="0 0 48 48"><polygon points="24,3 29,17 44,17 32,26 36,41 24,32 12,41 16,26 4,17 19,17" fill="#FACC15" stroke="#1E1E24" stroke-width="2.2"/><polygon points="24,10 27,19 36,19 29,24 31,33 24,28 17,33 19,24 12,19 21,19" fill="#FEF9C3"/></svg>'
  }
];

const POTION_TYPES = [
  {
    id: 'swift_brew',
    short: '疾風霊薬',
    name: '疾風迅雷の霊薬',
    col: '#38BDF8',
    desc: (lv) => `[消費] 待機即解除＆${6 + lv * 2}秒間クールタイム半減`
  },
  {
    id: 'gold_brew',
    short: '黄金秘薬',
    name: '黄金招来の秘薬',
    col: '#FACC15',
    desc: (lv) => `[消費] 即コイン+${lv * 15}枚＆${8 + lv * 2}秒間コイン2倍`
  },
  {
    id: 'slayer_brew',
    short: '鬼神霊薬',
    name: '鬼神剛力の霊薬',
    col: '#F43F5E',
    desc: (lv) => `[消費] ${7 + lv * 2}秒間コウモリ撃破100%＆回転時間延長`
  },
  {
    id: 'guardian_brew',
    short: '金剛聖薬',
    name: '金剛不壊の聖薬',
    col: '#34D399',
    desc: (lv) => `[消費] 即座に ${lv} 回分の身代わりバリアを展開`
  }
];

let brewSave = {
  mats: { herb: 2, dew: 2, shroom: 0, ember: 0, scale: 0, stardust: 0 },
  potions: [],
  equippedUid: null
};
try {
  const raw = JSON.parse(localStorage.getItem('wallKickBrew_v1') || 'null');
  if (raw && typeof raw === 'object') {
    brewSave.mats = Object.assign(brewSave.mats, raw.mats || {});
    brewSave.potions = Array.isArray(raw.potions) ? raw.potions : [];
    brewSave.equippedUid = raw.equippedUid || null;
  }
} catch (e) {}

function saveBrew() {
  try { localStorage.setItem('wallKickBrew_v1', JSON.stringify(brewSave)); } catch (e) {}
}
function getEquippedPotion() {
  if (!brewSave.equippedUid) return null;
  const found = brewSave.potions.find(p => p.uid === brewSave.equippedUid) || null;
  if (!found) brewSave.equippedUid = null;
  return found;
}

function calcBrewPreview(chosen) {
  if (chosen.length < 2) return null;
  let totalPower = 0;
  chosen.forEach(id => {
    const m = BREW_MATERIALS.find(x => x.id === id);
    if (m) totalPower += m.power;
  });
  let lv = 1;
  if (totalPower >= 15) lv = 5;
  else if (totalPower >= 10) lv = 4;
  else if (totalPower >= 6) lv = 3;
  else if (totalPower >= 4) lv = 2;

  let typeIdx = 0;
  if (chosen.includes('stardust') || chosen.includes('scale')) {
    typeIdx = chosen.includes('ember') ? 2 : 3;
  } else if (chosen.includes('shroom')) {
    typeIdx = 1;
  } else if (chosen.includes('ember')) {
    typeIdx = 2;
  } else {
    typeIdx = 0;
  }
  return { pType: POTION_TYPES[typeIdx], lv: lv };
}

let stageFoundMats = [];
let activePotionBuff = null; // { typeId, lv, frames, shield }

// バトル中ポーション使用ボタン生成
const battlePotionBtn = (function () {
  const wrapper = document.getElementById('game-wrapper');
  if (!wrapper) return null;
  const btn = document.createElement('button');
  btn.id = 'battle-potion-btn';
  wrapper.appendChild(btn);
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    useBattlePotion();
  });
  return btn;
})();

function useBattlePotion() {
  if (gameState !== 'playing') return;
  const pot = getEquippedPotion();
  if (!pot) return;

  // 消耗品なので所持リストから1本消費（同種があれば次を自動装備）
  const idx = brewSave.potions.findIndex(p => p.uid === pot.uid);
  if (idx !== -1) brewSave.potions.splice(idx, 1);
  const nextSame = brewSave.potions.find(p => p.typeId === pot.typeId) || brewSave.potions[0] || null;
  brewSave.equippedUid = nextSame ? nextSame.uid : null;
  saveBrew();

  const lv = pot.lv;
  if (pot.typeId === 'swift_brew') {
    player.lockoutTimer = 0;
    activePotionBuff = { typeId: 'swift_brew', lv, frames: (6 + lv * 2) * 60, shield: 0 };
  } else if (pot.typeId === 'gold_brew') {
    stageCoins += lv * 15;
    activePotionBuff = { typeId: 'gold_brew', lv, frames: (8 + lv * 2) * 60, shield: 0 };
  } else if (pot.typeId === 'slayer_brew') {
    activePotionBuff = { typeId: 'slayer_brew', lv, frames: (7 + lv * 2) * 60, shield: 0 };
  } else if (pot.typeId === 'guardian_brew') {
    activePotionBuff = { typeId: 'guardian_brew', lv, frames: 99999, shield: lv };
  }

  if (typeof playSound === 'function') playSound('clear');
  if (typeof spawnParticles === 'function') {
    spawnParticles(player.x + player.size / 2, player.y + player.size / 2, pot.col, 24, false);
  }
}

window.addEventListener('keydown', (e) => {
  if (gameState === 'playing' && (e.key === 'c' || e.key === 'C')) {
    useBattlePotion();
  }
});

const baseInitStage15_pot = initStage;
initStage = function (config) {
  baseInitStage15_pot(config);
  stageFoundMats = [];
  activePotionBuff = null;
};

const baseUpdate15 = update;
update = function () {
  const prevCoins = stageCoins;
  const prevBats = typeof bats !== 'undefined' ? bats.length : 0;
  baseUpdate15();
  if (gameState !== 'playing') return;

  if (activePotionBuff) {
    if (activePotionBuff.frames > 0) {
      activePotionBuff.frames--;
      if (activePotionBuff.frames <= 0 && activePotionBuff.shield <= 0) {
        activePotionBuff = null;
      }
    }
  }

  if (stageCoins > prevCoins && activePotionBuff && activePotionBuff.typeId === 'gold_brew') {
    stageCoins += (stageCoins - prevCoins);
  }

  const gotCoin = stageCoins > prevCoins;
  const killedBat = typeof bats !== 'undefined' && bats.length < prevBats;
  if (gotCoin || killedBat) {
    const dropChance = killedBat ? 0.16 : 0.035;
    if (Math.random() < dropChance) {
      const r = Math.random();
      let mat = BREW_MATERIALS[0];
      if (r < 0.03) mat = BREW_MATERIALS[5];
      else if (r < 0.10) mat = BREW_MATERIALS[4];
      else if (r < 0.28) mat = BREW_MATERIALS[3];
      else if (r < 0.50) mat = BREW_MATERIALS[2];
      else if (r < 0.75) mat = BREW_MATERIALS[1];

      brewSave.mats[mat.id] = (brewSave.mats[mat.id] || 0) + 1;
      stageFoundMats.push(mat.name);
      saveBrew();
      if (typeof spawnParticles === 'function') {
        spawnParticles(player.x + player.size / 2, player.y, mat.col, 10, false);
      }
    }
  }
};

const basePerformSpinAttack15 = performSpinAttack;
performSpinAttack = function () {
  const before = player.lockoutTimer;
  basePerformSpinAttack15();
  if (!activePotionBuff || gameState !== 'playing') return;
  if (before <= 0 && player.lockoutTimer > 0 && player.spinTimer > 0) {
    if (activePotionBuff.typeId === 'swift_brew') {
      player.lockoutTimer = Math.max(8, Math.round(player.lockoutTimer * 0.5));
    } else if (activePotionBuff.typeId === 'slayer_brew') {
      player.spinTimer += 8 + activePotionBuff.lv * 3;
    }
  }
};

const baseGetCurrentSword15 = getCurrentSword;
getCurrentSword = function () {
  const sw = baseGetCurrentSword15();
  if (activePotionBuff && activePotionBuff.typeId === 'slayer_brew') {
    return Object.assign({}, sw, { batKillRate: 1.0 });
  }
  return sw;
};

const baseShowResult15_shield = showResult;
showResult = function (isClear) {
  if (!isClear && gameState === 'playing' && activePotionBuff && activePotionBuff.shield > 0) {
    activePotionBuff.shield--;
    if (activePotionBuff.shield <= 0) activePotionBuff = null;
    player.vy = -12;
    if (typeof playSound === 'function') playSound('clash');
    if (typeof spawnParticles === 'function') {
      spawnParticles(player.x + player.size / 2, player.y + player.size / 2, '#34D399', 26, true);
    }
    return;
  }
  activePotionBuff = null;
  baseShowResult15_shield(isClear);

  const oldNotice = document.getElementById('brew-drop-notice');
  if (oldNotice) oldNotice.remove();
  if (stageFoundMats.length > 0 && !screenResult.classList.contains('hidden')) {
    const box = document.createElement('div');
    box.id = 'brew-drop-notice';
    box.style.cssText = 'margin:6px 0; padding:6px 10px; background:#0F172A; color:#FFD600; border:3px solid #1E1E24; border-radius:3px; box-shadow:3px 3px 0 #1E1E24; font-size:12px; font-weight:900;';
    box.textContent = '醸造素材を獲得: ' + stageFoundMats.join(' / ');
    const triviaBox = document.getElementById('result-trivia-box');
    if (triviaBox && triviaBox.parentNode) {
      triviaBox.parentNode.insertBefore(box, triviaBox);
    }
  }
};


// ==========================================================================
// 4. ショップの「醸造」タブ
// ==========================================================================
let brewSlots = [null, null, null];

function brewCombine() {
  const chosen = brewSlots.filter(Boolean);
  const preview = calcBrewPreview(chosen);
  if (!preview) {
    if (typeof playSound === 'function') playSound('hit');
    return;
  }
  const need = {};
  chosen.forEach(id => need[id] = (need[id] || 0) + 1);
  for (const id in need) {
    if ((brewSave.mats[id] || 0) < need[id]) {
      if (typeof playSound === 'function') playSound('hit');
      return;
    }
  }
  for (const id in need) brewSave.mats[id] -= need[id];

  const newPotion = {
    uid: 'pot_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
    typeId: preview.pType.id,
    short: `${preview.pType.short}Lv${preview.lv}`,
    name: `${preview.pType.name} Lv.${preview.lv}`,
    lv: preview.lv,
    col: preview.pType.col,
    desc: preview.pType.desc(preview.lv)
  };
  brewSave.potions.unshift(newPotion);
  brewSave.equippedUid = newPotion.uid;
  brewSlots = [null, null, null];
  saveBrew();

  if (typeof gSfx === 'function') gSfx('chime', Math.min(3, preview.lv - 1));
  else if (typeof playSound === 'function') playSound('clear');
  renderBrewGrid();
}

function renderBrewGrid() {
  const grid = document.getElementById('skin-grid');
  grid.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'brew-wrap';

  const chosen = brewSlots.filter(Boolean);
  const preview = calcBrewPreview(chosen);

  const panel = document.createElement('div');
  panel.className = 'brew-panel';
  panel.innerHTML = `
    <div class="brew-head">
      <div class="brew-title">調合釜（素材を2〜3個選択）</div>
      <div class="brew-badge">${preview ? `${preview.pType.name} Lv.${preview.lv}` : '未選択'}</div>
    </div>
  `;

  const slotsRow = document.createElement('div');
  slotsRow.className = 'brew-slots';

  brewSlots.forEach((matId, idx) => {
    const sl = document.createElement('div');
    const mat = BREW_MATERIALS.find(m => m.id === matId);
    sl.className = 'brew-slot' + (mat ? ' filled' : '');
    if (mat) {
      sl.innerHTML = `
        ${mat.svg}
        <span style="font-size:10px;font-weight:900;color:${mat.col};margin-top:2px;">${mat.name}</span>
        <span style="font-size:9px;color:#94A3B8;">解除</span>
      `;
      sl.onclick = () => { brewSlots[idx] = null; renderBrewGrid(); };
    } else {
      sl.innerHTML = `<span style="font-size:11px;font-weight:900;color:#94A3B8;">枠 ${idx + 1}</span>`;
    }
    slotsRow.appendChild(sl);
  });
  panel.appendChild(slotsRow);

  const craftBtn = document.createElement('button');
  craftBtn.className = 'jutsu-btn ' + (preview ? 'buy' : 'dim');
  craftBtn.style.width = '100%';
  craftBtn.textContent = preview
    ? `醸造する（${preview.pType.name} Lv.${preview.lv}）`
    : '下の素材を2つ以上投入してください';
  craftBtn.onclick = brewCombine;
  panel.appendChild(craftBtn);
  wrap.appendChild(panel);

  const matPanel = document.createElement('div');
  matPanel.className = 'brew-panel light';
  matPanel.innerHTML = `
    <div class="brew-head">
      <div class="brew-title">醸造素材（購入 / 釜へ投入）</div>
      <div class="brew-badge">希少素材ほど強力</div>
    </div>
  `;
  const matGrid = document.createElement('div');
  matGrid.className = 'brew-mat-grid';

  BREW_MATERIALS.forEach(mat => {
    const count = brewSave.mats[mat.id] || 0;
    const used = brewSlots.filter(x => x === mat.id).length;
    const canPut = count > used && brewSlots.includes(null);
    const canBuy = totalCoins >= mat.price;

    const card = document.createElement('div');
    card.className = 'brew-mat-card';
    card.innerHTML = `
      <div class="brew-mat-top">
        <div class="brew-mat-icon">${mat.svg}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:11px;font-weight:900;">[${mat.rarity}] ${mat.name}</div>
          <div style="font-size:10px;font-weight:800;color:#475569;">所持: ${count}個</div>
          <div style="font-size:9px;color:#64748B;">${mat.desc}</div>
        </div>
      </div>
    `;
    const btnRow = document.createElement('div');
    btnRow.className = 'jutsu-row';

    const putBtn = document.createElement('button');
    putBtn.className = 'jutsu-btn ' + (canPut ? 'on' : 'dim');
    putBtn.style.cssText = 'font-size:10px;padding:5px 2px;';
    putBtn.textContent = '投入';
    putBtn.onclick = () => {
      const empty = brewSlots.indexOf(null);
      if (empty !== -1 && count > used) {
        brewSlots[empty] = mat.id;
        if (typeof playSound === 'function') playSound('kick');
        renderBrewGrid();
      }
    };

    const buyBtn = document.createElement('button');
    buyBtn.className = 'jutsu-btn ' + (canBuy ? 'buy' : 'dim');
    buyBtn.style.cssText = 'font-size:10px;padding:5px 2px;';
    buyBtn.textContent = `${mat.price}枚`;
    buyBtn.onclick = () => {
      if (totalCoins >= mat.price) {
        totalCoins -= mat.price;
        brewSave.mats[mat.id] = (brewSave.mats[mat.id] || 0) + 1;
        saveBrew();
        saveCoinAndSkinData();
        document.getElementById('shop-total-coins').textContent = totalCoins;
        const titleCoin = document.getElementById('title-total-coins');
        if (titleCoin) titleCoin.textContent = totalCoins;
        if (typeof playSound === 'function') playSound('kick');
        renderBrewGrid();
      } else if (typeof playSound === 'function') {
        playSound('hit');
      }
    };

    btnRow.appendChild(putBtn);
    btnRow.appendChild(buyBtn);
    card.appendChild(btnRow);
    matGrid.appendChild(card);
  });
  matPanel.appendChild(matGrid);
  wrap.appendChild(matPanel);

  const invPanel = document.createElement('div');
  invPanel.className = 'brew-panel light';
  invPanel.innerHTML = `
    <div class="brew-head">
      <div class="brew-title">所持ポーション（消耗品・バトル中に発動）</div>
      <div class="brew-badge">${brewSave.potions.length}本</div>
    </div>
  `;

  if (!brewSave.potions.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:11px;font-weight:800;color:#64748B;';
    empty.textContent = '所持ポーションはありません。上の調合釜で作成してください。';
    invPanel.appendChild(empty);
  } else {
    brewSave.potions.forEach(p => {
      const isEq = brewSave.equippedUid === p.uid;
      const row = document.createElement('div');
      row.className = 'brew-pot-item' + (isEq ? ' equipped' : '');
      row.innerHTML = `
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:900;">${p.name}</div>
          <div style="font-size:10px;font-weight:800;color:#475569;">${p.desc}</div>
        </div>
      `;
      const eqBtn = document.createElement('button');
      eqBtn.className = 'jutsu-btn ' + (isEq ? 'on' : 'buy');
      eqBtn.style.cssText = 'flex:0 0 68px;font-size:11px;padding:6px 4px;';
      eqBtn.textContent = isEq ? '装備中' : '装備';
      eqBtn.onclick = () => {
        brewSave.equippedUid = isEq ? null : p.uid;
        saveBrew();
        if (typeof playSound === 'function') playSound('kick');
        renderBrewGrid();
      };
      row.appendChild(eqBtn);
      invPanel.appendChild(row);
    });
  }
  wrap.appendChild(invPanel);
  grid.appendChild(wrap);
}

// ショップタブ整理：「エンチャント購入」を削除し、「醸造」を追加
(function () {
  const oldEnchBuyTab = document.getElementById('shop-tab-ench');
  if (oldEnchBuyTab) oldEnchBuyTab.remove();

  const tabsWrap = document.querySelector('.shop-tabs');
  if (tabsWrap) {
    const brewTab = document.createElement('button');
    brewTab.id = 'shop-tab-brew';
    brewTab.className = 'shop-tab';
    brewTab.textContent = '醸造';
    brewTab.addEventListener('click', () => switchShopTab('brew'));
    tabsWrap.appendChild(brewTab);

    const prevSwitchShopTab15 = switchShopTab;
    switchShopTab = function (tab) {
      if (tab === 'ench') tab = 'enchApply';
      prevSwitchShopTab15(tab);
      brewTab.classList.toggle('active', tab === 'brew');
    };

    const prevRenderSkinGrid15 = renderSkinGrid;
    renderSkinGrid = function () {
      if (currentShopTab === 'brew') { renderBrewGrid(); return; }
      prevRenderSkinGrid15();
    };
  }
})();


// ==========================================================================
// 5. ホーム画面に「GACHA」ボタン＆専用ガチャ画面
// ==========================================================================
(function () {
  const wrapper = document.getElementById('game-wrapper');
  const titleScreen = document.getElementById('screen-title');
  const btnGroup = titleScreen ? titleScreen.querySelector('.btn-group') : null;
  if (!wrapper || !titleScreen || !btnGroup) return;

  const gachaHubScreen = document.createElement('div');
  gachaHubScreen.id = 'screen-gacha-hub';
  gachaHubScreen.className = 'overlay hidden';
  gachaHubScreen.innerHTML = `
    <div class="title-badge" style="background:#FFD600;color:#1E1E24;">GACHA</div>
    <h2 style="font-size:24px;font-weight:900;margin:0 0 6px 0;">ガチャ</h2>
    <div style="display:flex;gap:8px;margin-bottom:10px;justify-content:center;flex-wrap:wrap;">
      <div class="coin-banner">
        <span class="coin-icon"></span>
        <span>COIN:</span>
        <span id="hub-coin-val" style="color:#D97706;font-size:14px;">0</span>
      </div>
      <div class="coin-banner">
        <span>クリスタル:</span>
        <span id="hub-crystal-val" style="color:#7C3AED;font-size:14px;">0</span>
      </div>
    </div>
    <div id="gacha-hub-list" class="gacha-hub-list"></div>
    <button id="gacha-hub-back" class="btn btn-back" style="width:100%;max-width:295px;">タイトルへ戻る</button>
  `;
  wrapper.appendChild(gachaHubScreen);

  window.renderGachaHub = function () {
    document.getElementById('hub-coin-val').textContent = totalCoins;
    document.getElementById('hub-crystal-val').textContent = typeof enchSave !== 'undefined' ? enchSave.crystals : 0;
    const titleCoin = document.getElementById('title-total-coins');
    if (titleCoin) titleCoin.textContent = totalCoins;

    const list = document.getElementById('gacha-hub-list');
    list.innerHTML = '';

    // 1. エンチャントガチャカード
    if (typeof enchSave !== 'undefined' && typeof gachaOpen === 'function') {
      const card1 = document.createElement('div');
      card1.className = 'skin-card jutsu-card';
      card1.style.cssText = 'background:#0F172A;color:#F8FAFC;border-color:#1E1E24;box-shadow:4px 4px 0 #1E1E24;cursor:default;';
      card1.innerHTML = `
        <div class="jutsu-head">
          <div class="jutsu-icon">${BOOK_ICON}</div>
          <div class="jutsu-info">
            <div class="jutsu-name">エンチャントガチャ<span class="jutsu-sub" style="color:#FFD600;">書が出現</span></div>
            <div class="jutsu-desc">ノーマル60% / レア28% / スーパーレア10% / 伝説2%（10連はレア以上1冊確定）。クリスタル1個 ${CRYSTAL_PRICE}枚。</div>
          </div>
        </div>
      `;
      const rowBuy = document.createElement('div');
      rowBuy.className = 'jutsu-row';

      const bBuy1 = document.createElement('button');
      bBuy1.className = 'jutsu-btn ' + (totalCoins >= CRYSTAL_PRICE ? 'buy' : 'dim');
      bBuy1.textContent = `結晶×1 (${CRYSTAL_PRICE}枚)`;
      bBuy1.onclick = () => {
        if (totalCoins >= CRYSTAL_PRICE) {
          totalCoins -= CRYSTAL_PRICE;
          enchSave.crystals += 1;
          saveEnch();
          saveCoinAndSkinData();
          if (typeof gSfx === 'function') gSfx('flip', 1);
          renderGachaHub();
        } else if (typeof playSound === 'function') playSound('hit');
      };

      const bBuy5 = document.createElement('button');
      bBuy5.className = 'jutsu-btn ' + (totalCoins >= CRYSTAL_PRICE * 5 ? 'buy' : 'dim');
      bBuy5.textContent = `結晶×5 (${CRYSTAL_PRICE * 5}枚)`;
      bBuy5.onclick = () => {
        if (totalCoins >= CRYSTAL_PRICE * 5) {
          totalCoins -= CRYSTAL_PRICE * 5;
          enchSave.crystals += 5;
          saveEnch();
          saveCoinAndSkinData();
          if (typeof gSfx === 'function') gSfx('flip', 1);
          renderGachaHub();
        } else if (typeof playSound === 'function') playSound('hit');
      };

      rowBuy.appendChild(bBuy1);
      rowBuy.appendChild(bBuy5);
      card1.appendChild(rowBuy);

      const rowPull = document.createElement('div');
      rowPull.className = 'jutsu-row';

      const bPull1 = document.createElement('button');
      bPull1.className = 'jutsu-btn ' + (enchSave.crystals >= GACHA_COST_1 ? 'on' : 'dim');
      bPull1.textContent = `1回引く (結晶${GACHA_COST_1})`;
      bPull1.onclick = () => { if (enchSave.crystals >= GACHA_COST_1) gachaOpen(1); else if (typeof playSound === 'function') playSound('hit'); };

      const bPull10 = document.createElement('button');
      bPull10.className = 'jutsu-btn ' + (enchSave.crystals >= GACHA_COST_10 ? 'on' : 'dim');
      bPull10.textContent = `10連引く (結晶${GACHA_COST_10})`;
      bPull10.onclick = () => { if (enchSave.crystals >= GACHA_COST_10) gachaOpen(10); else if (typeof playSound === 'function') playSound('hit'); };

      rowPull.appendChild(bPull1);
      rowPull.appendChild(bPull10);
      card1.appendChild(rowPull);
      list.appendChild(card1);
    }

    // 2. 忍具・秘宝ガチャカード（split16.py の openTreasureChestGacha を呼び出し）
    const card2 = document.createElement('div');
    card2.className = 'skin-card jutsu-card';
    card2.style.cssText = 'background:#0F172A;color:#F8FAFC;border-color:#1E1E24;box-shadow:4px 4px 0 #1E1E24;cursor:default;';
    card2.innerHTML = `
      <div class="jutsu-head">
        <div class="jutsu-icon">
          <svg viewBox="0 0 48 48"><rect x="8" y="16" width="32" height="24" fill="#B45309" stroke="#1E1E24" stroke-width="2.5"/><rect x="6" y="12" width="36" height="8" fill="#D97706" stroke="#1E1E24" stroke-width="2.5"/><rect x="20" y="16" width="8" height="10" fill="#FFD600" stroke="#1E1E24" stroke-width="2"/></svg>
        </div>
        <div class="jutsu-info">
          <div class="jutsu-name">忍具・秘宝ガチャ<span class="jutsu-sub" style="color:#38BDF8;">忍具＆秘宝</span></div>
          <div class="jutsu-desc">既存の忍具（不死のトーテム等）と、醸造用の高レア秘宝（星屑の天球儀・紅蓮の古竜鱗など）が出現。10連はレア以上1つ確定。</div>
        </div>
      </div>
    `;
    const row2 = document.createElement('div');
    row2.className = 'jutsu-row';

    const tPull1 = document.createElement('button');
    tPull1.className = 'jutsu-btn ' + (totalCoins >= 250 ? 'buy' : 'dim');
    tPull1.textContent = '1回引く (250枚)';
    tPull1.onclick = () => { if (typeof openTreasureChestGacha === 'function') openTreasureChestGacha(1); };

    const tPull10 = document.createElement('button');
    tPull10.className = 'jutsu-btn ' + (totalCoins >= 2200 ? 'on' : 'dim');
    tPull10.textContent = '10連引く (2200枚)';
    tPull10.onclick = () => { if (typeof openTreasureChestGacha === 'function') openTreasureChestGacha(10); };

    row2.appendChild(tPull1);
    row2.appendChild(tPull10);
    card2.appendChild(row2);
    list.appendChild(card2);
  };

  if (typeof gachaClose === 'function') {
    const prevGachaClose15 = gachaClose;
    gachaClose = function () {
      prevGachaClose15();
      if (!gachaHubScreen.classList.contains('hidden')) renderGachaHub();
    };
  }

  window.openGachaHub = function () {
    screenTitle.classList.add('hidden');
    screenResult.classList.add('hidden');
    screenSkin.classList.add('hidden');
    gachaHubScreen.classList.remove('hidden');
    renderGachaHub();
  };

  document.getElementById('gacha-hub-back').addEventListener('click', () => {
    gachaHubScreen.classList.add('hidden');
    backToTitle();
  });

  const gachaHomeBtn = document.createElement('button');
  gachaHomeBtn.className = 'btn btn-gacha-home';
  gachaHomeBtn.innerHTML = '<span>GACHA</span><span class="stage-tag">エンチャント / 忍具・秘宝</span>';
  gachaHomeBtn.onclick = openGachaHub;
  btnGroup.appendChild(gachaHomeBtn);
})();


// ==========================================================================
// 6. バトルUI制御（ホーム画面では回転攻撃・ポーションボタンを完全非表示）
// ==========================================================================
(function () {
  const wrapper = document.getElementById('game-wrapper');
  if (!wrapper) return;

  const spinBtn = document.createElement('button');
  spinBtn.id = 'touch-spin-btn';
  spinBtn.textContent = '回転攻撃';
  wrapper.appendChild(spinBtn);

  function isActualBattle() {
    if (gameState !== 'playing') return false;
    const overlays = ['screen-title', 'screen-practice', 'screen-skin', 'screen-story', 'screen-result', 'screen-gacha-hub', 'tutorial-screen'];
    return overlays.every(id => {
      const el = document.getElementById(id);
      return !el || el.classList.contains('hidden');
    });
  }

  function syncBattleHudButtons() {
    const playing = isActualBattle();
    if (!playing) {
      spinBtn.style.display = 'none';
      if (battlePotionBtn) battlePotionBtn.style.display = 'none';
      return;
    }

    spinBtn.style.display = 'flex';
    spinBtn.classList.toggle('cooldown', player.lockoutTimer > 0);

    if (battlePotionBtn) {
      if (activePotionBuff) {
        battlePotionBtn.style.display = 'block';
        battlePotionBtn.classList.add('active-buff');
        if (activePotionBuff.shield > 0) {
          battlePotionBtn.textContent = `聖薬バリア ×${activePotionBuff.shield}`;
        } else {
          const sec = Math.max(1, Math.ceil(activePotionBuff.frames / 60));
          battlePotionBtn.textContent = `霊薬効果中 (${sec}s)`;
        }
      } else {
        const pot = getEquippedPotion();
        if (pot) {
          battlePotionBtn.style.display = 'block';
          battlePotionBtn.classList.remove('active-buff');
          battlePotionBtn.textContent = `使う: ${pot.short} [C]`;
        } else {
          battlePotionBtn.style.display = 'none';
        }
      }
    }
  }

  const triggerSpin = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isActualBattle() && typeof performSpinAttack === 'function') {
      performSpinAttack();
    }
  };

  spinBtn.addEventListener('pointerdown', triggerSpin);

  const cvs = document.getElementById('game-canvas') || wrapper.querySelector('canvas');
  if (cvs) {
    cvs.addEventListener('contextmenu', (e) => {
      if (isActualBattle()) triggerSpin(e);
    });
    let lastTapTime = 0;
    cvs.addEventListener('pointerdown', (e) => {
      if (!isActualBattle()) return;
      if (e.button === 2) {
        triggerSpin(e);
        return;
      }
      const now = performance.now();
      if (now - lastTapTime < 220) {
        triggerSpin(e);
        lastTapTime = 0;
      } else {
        lastTapTime = now;
      }
    });
  }

  const prevBackToTitle15 = backToTitle;
  backToTitle = function () {
    prevBackToTitle15();
    syncBattleHudButtons();
  };

  const prevUpdateBtn15 = update;
  update = function () {
    prevUpdateBtn15();
    syncBattleHudButtons();
  };

  syncBattleHudButtons();
})();


/* SPLIT16 */
// ==========================================
// 1. 醸造素材・ポーションの高精細化＆絶大効果
// ==========================================
(function () {
  if (typeof BREW_MATERIALS !== 'undefined') {
    const HIGH_MATS = {
      herb: {
        svg: '<svg viewBox="0 0 48 48"><defs><linearGradient id="gHerb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#BBF7D0"/><stop offset="50%" stop-color="#22C55E"/><stop offset="100%" stop-color="#14532D"/></linearGradient></defs><path d="M24 42V13" stroke="#15803D" stroke-width="3.5" stroke-linecap="round"/><path d="M24 32C12 32 8 20 11 13C18 13 24 20 24 32Z" fill="url(#gHerb)" stroke="#1E1E24" stroke-width="2"/><path d="M24 25C36 25 40 13 37 6C30 6 24 13 24 25Z" fill="url(#gHerb)" stroke="#1E1E24" stroke-width="2"/><path d="M24 16C18 9 20 4 24 3C28 4 30 9 24 16Z" fill="#86EFAC" stroke="#1E1E24" stroke-width="2"/><circle cx="17" cy="19" r="1.8" fill="#FFFFFF" opacity="0.8"/><circle cx="31" cy="13" r="1.8" fill="#FFFFFF" opacity="0.8"/></svg>'
      },
      dew: {
        svg: '<svg viewBox="0 0 48 48"><defs><radialGradient id="gDew" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="35%" stop-color="#7DD3FC"/><stop offset="80%" stop-color="#0284C7"/><stop offset="100%" stop-color="#0C4A6E"/></radialGradient></defs><path d="M24 5C24 5 9 22 9 31.5C9 39.5 15.7 45 24 45C32.3 45 39 39.5 39 31.5C39 22 24 5 24 5Z" fill="url(#gDew)" stroke="#1E1E24" stroke-width="2.4"/><ellipse cx="18" cy="26" rx="3" ry="6" transform="rotate(-20 18 26)" fill="#FFFFFF" opacity="0.85"/><circle cx="29" cy="36" r="2.2" fill="#BAE6FD" opacity="0.7"/></svg>'
      },
      shroom: {
        svg: '<svg viewBox="0 0 48 48"><defs><radialGradient id="gShroom" cx="40%" cy="25%" r="75%"><stop offset="0%" stop-color="#F3E8FF"/><stop offset="45%" stop-color="#9333EA"/><stop offset="100%" stop-color="#3B0764"/></radialGradient></defs><path d="M18 25H30L32 42H16L18 25Z" fill="#F1F5F9" stroke="#1E1E24" stroke-width="2.2"/><path d="M6 27C6 13 14 6 24 6C34 6 42 13 42 27C32 29 16 29 6 27Z" fill="url(#gShroom)" stroke="#1E1E24" stroke-width="2.4"/><circle cx="16" cy="17" r="3.4" fill="#FEF08A"/><circle cx="30" cy="15" r="3" fill="#FEF08A"/><circle cx="24" cy="22" r="2.4" fill="#DDD6FE"/><circle cx="12" cy="23" r="1.8" fill="#DDD6FE"/></svg>'
      },
      ember: {
        svg: '<svg viewBox="0 0 48 48"><defs><linearGradient id="gEmber" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#991B1B"/><stop offset="45%" stop-color="#F97316"/><stop offset="100%" stop-color="#FEF08A"/></linearGradient></defs><path d="M11 38C9 25 22 22 20 8C29 11 35 20 31 31C36 27 39 20 37 13C44 22 40 41 22 43C15 43 12 41 11 38Z" fill="url(#gEmber)" stroke="#1E1E24" stroke-width="2.2"/><path d="M18 38C17 30 24 27 24 19C29 23 31 31 24 38Z" fill="#FEF9C3"/></svg>'
      },
      scale: {
        svg: '<svg viewBox="0 0 48 48"><defs><linearGradient id="gScale" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FECDD3"/><stop offset="40%" stop-color="#E11D48"/><stop offset="100%" stop-color="#4C0519"/></linearGradient></defs><polygon points="24,3 41,15 37,36 24,45 11,36 7,15" fill="url(#gScale)" stroke="#1E1E24" stroke-width="2.4"/><polygon points="24,9 34,17 31,32 24,39 17,32 14,17" fill="#FB7185" opacity="0.65"/><polygon points="24,3 30,17 24,25 18,17" fill="#FFE4E6" opacity="0.75"/><line x1="24" y1="3" x2="24" y2="45" stroke="#1E1E24" stroke-width="1.6"/></svg>'
      },
      stardust: {
        svg: '<svg viewBox="0 0 48 48"><defs><radialGradient id="gStar" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="45%" stop-color="#FACC15"/><stop offset="100%" stop-color="#B45309"/></radialGradient></defs><polygon points="24,2 29,16 45,16 32,26 37,42 24,32 11,42 16,26 3,16 19,16" fill="url(#gStar)" stroke="#1E1E24" stroke-width="2.2"/><polygon points="24,9 27,18 37,18 29,24 32,34 24,28 16,34 19,24 11,18 21,18" fill="#FEF9C3"/><circle cx="24" cy="22" r="4" fill="#FFFFFF"/></svg>'
      }
    };
    BREW_MATERIALS.forEach(m => {
      if (HIGH_MATS[m.id]) m.svg = HIGH_MATS[m.id].svg;
    });
  }

  if (typeof POTION_TYPES !== 'undefined') {
    const OP_POTIONS = {
      swift_brew: {
        desc: (lv) => `[絶大] 発動時超高速上昇(無敵)＋${12 + lv * 3}秒間 回転待機ゼロ連打＆超加速`
      },
      gold_brew: {
        desc: (lv) => `[絶大] 即コイン+${lv * 50}枚＋${14 + lv * 3}秒間 コイン${3 + lv}倍＆全画面自動吸引`
      },
      slayer_brew: {
        desc: (lv) => `[絶大] 発動時画面内の敵全滅＋${14 + lv * 3}秒間 常時回転無敵刃＆ボス反射2倍`
      },
      guardian_brew: {
        desc: (lv) => `[絶大] ${lv + 2}回の黄金聖壁展開（被弾時に敵弾全消去＋超反撃ジャンプ）`
      }
    };
    POTION_TYPES.forEach(p => {
      if (OP_POTIONS[p.id]) p.desc = OP_POTIONS[p.id].desc;
    });
  }

  window.useBattlePotion = function () {
    if (gameState !== 'playing') return;
    const pot = getEquippedPotion();
    if (!pot) return;

    const idx = brewSave.potions.findIndex(p => p.uid === pot.uid);
    if (idx !== -1) brewSave.potions.splice(idx, 1);
    const nextSame = brewSave.potions.find(p => p.typeId === pot.typeId) || brewSave.potions[0] || null;
    brewSave.equippedUid = nextSame ? nextSame.uid : null;
    saveBrew();

    const lv = pot.lv;
    shakeTime = 14;

    if (pot.typeId === 'swift_brew') {
      player.lockoutTimer = 0;
      player.vy = -21 - lv * 1.5;
      player.spinTimer = Math.max(player.spinTimer, 45);
      activePotionBuff = { typeId: 'swift_brew', lv, frames: (12 + lv * 3) * 60, shield: 0 };
    } else if (pot.typeId === 'gold_brew') {
      stageCoins += lv * 50;
      activePotionBuff = { typeId: 'gold_brew', lv, frames: (14 + lv * 3) * 60, shield: 0 };
    } else if (pot.typeId === 'slayer_brew') {
      if (typeof bats !== 'undefined') bats.length = 0;
      if (typeof birds !== 'undefined') birds.length = 0;
      if (typeof ambusherEnemies !== 'undefined') ambusherEnemies.length = 0;
      if (typeof projectiles !== 'undefined') projectiles.length = 0;
      if (typeof bossLasers !== 'undefined') bossLasers.length = 0;
      player.spinTimer = 60;
      activePotionBuff = { typeId: 'slayer_brew', lv, frames: (14 + lv * 3) * 60, shield: 0 };
    } else if (pot.typeId === 'guardian_brew') {
      activePotionBuff = { typeId: 'guardian_brew', lv, frames: 999999, shield: lv + 2 };
    }

    if (typeof playSound === 'function') playSound('clear');
    if (typeof spawnParticles === 'function') {
      spawnParticles(player.x + player.size / 2, player.y + player.size / 2, pot.col, 42, false);
    }
  };

  const prevUpdate16 = update;
  update = function () {
    const coinsBefore = stageCoins;
    prevUpdate16();
    if (gameState !== 'playing' || !activePotionBuff) return;

    const lv = activePotionBuff.lv;
    const pCx = player.x + player.size / 2;
    const pCy = player.y + player.size / 2;

    if (activePotionBuff.typeId === 'swift_brew') {
      player.lockoutTimer = 0;
      if (player.vy < 0) player.vy -= 0.14;
      if (Math.random() < 0.45 && typeof spawnParticles === 'function') {
        spawnParticles(pCx, pCy, '#38BDF8', 2, false);
      }
    } else if (activePotionBuff.typeId === 'gold_brew') {
      if (stageCoins > coinsBefore) {
        const diff = stageCoins - coinsBefore;
        stageCoins += diff * (1 + lv);
      }
      if (typeof coins !== 'undefined') {
        for (let i = 0; i < coins.length; i++) {
          const c = coins[i];
          if (c.collected) continue;
          const dx = pCx - c.x;
          const dy = pCy - c.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 460 && dist > 1) {
            c.x += (dx / dist) * 14;
            c.y += (dy / dist) * 14;
          }
        }
      }
      if (Math.random() < 0.35 && typeof spawnParticles === 'function') {
        spawnParticles(pCx, pCy, '#FACC15', 2, false);
      }
    } else if (activePotionBuff.typeId === 'slayer_brew') {
      player.spinTimer = Math.max(player.spinTimer, 18);
      player.lockoutTimer = 0;
      if (Math.random() < 0.4 && typeof spawnParticles === 'function') {
        spawnParticles(pCx, pCy, '#F43F5E', 2, false);
      }
    }
  };

  const prevShowResult16 = showResult;
  showResult = function (isClear) {
    if (!isClear && gameState === 'playing' && activePotionBuff && activePotionBuff.shield > 0) {
      activePotionBuff.shield--;
      if (activePotionBuff.shield <= 0) activePotionBuff = null;
      player.vy = -18;
      player.spinTimer = 45;
      shakeTime = 16;
      if (typeof bats !== 'undefined') bats.length = 0;
      if (typeof birds !== 'undefined') birds.length = 0;
      if (typeof projectiles !== 'undefined') projectiles.length = 0;
      if (typeof bossLasers !== 'undefined') bossLasers.length = 0;
      if (typeof playSound === 'function') playSound('clash');
      if (typeof spawnParticles === 'function') {
        spawnParticles(player.x + player.size / 2, player.y + player.size / 2, '#34D399', 45, false);
      }
      return;
    }
    prevShowResult16(isClear);
  };

  if (typeof draw === 'function') {
    const prevDraw16 = draw;
    draw = function () {
      prevDraw16();
      if (gameState !== 'playing' || !activePotionBuff) return;
      const pCx = player.x + player.size / 2;
      const pCy = player.y + player.size / 2 - cameraY;
      const colMap = {
        swift_brew: '#38BDF8',
        gold_brew: '#FACC15',
        slayer_brew: '#F43F5E',
        guardian_brew: '#34D399'
      };
      const col = colMap[activePotionBuff.typeId] || '#FFD600';
      const pulse = 26 + Math.sin(performance.now() * 0.015) * 5;

      ctx.save();
      ctx.translate(pCx, pCy);
      ctx.strokeStyle = col;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = col;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.stroke();

      if (activePotionBuff.shield > 0) {
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, pulse + 7, performance.now() * 0.004, performance.now() * 0.004 + Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    };
  }
})();


// ==========================================
// 2. 更衣室（CURRENT EQUIP クリックで開く）＋ 工房 ＋ 称号
// ==========================================
(function () {
  const wrapper = document.getElementById('game-wrapper');
  const titleEquipTag = document.getElementById('title-equip-tag');
  if (!wrapper || !titleEquipTag) return;

  const TITLE_IDEAS = [
    { id: 'none', name: '称号なし', cond: '初期状態', buff: 'なし' },
    { id: 'rookie', name: '雲上の駆け出し', cond: 'Record 100m到達（案）', buff: 'ジャンプ力微増（案）' },
    { id: 'sky_lord', name: '天空の覇者', cond: 'Record 300m到達（案）', buff: '獲得コイン+5%（案）' },
    { id: 'sword_saint', name: '一閃の剣豪', cond: '回転攻撃で累計100体撃破（案）', buff: '回転時間延長（案）' },
    { id: 'alchemist', name: '見習い錬金術師', cond: 'ポーション累計5回醸造（案）', buff: '素材ドロップ率UP（案）' },
    { id: 'relic_hunter', name: '秘宝コレクター', cond: '秘宝ガチャ累計20回（案）', buff: 'レア出現率UP（案）' }
  ];

  let equippedTitleId = 'none';
  try {
    equippedTitleId = localStorage.getItem('wallKickTitleDraft') || 'none';
  } catch (e) {}

  function getEquippedTitleObj() {
    return TITLE_IDEAS.find(t => t.id === equippedTitleId) || TITLE_IDEAS[0];
  }

  if (typeof updateTitleEquipTag === 'function') {
    const prevUpdateTitleEquipTag = updateTitleEquipTag;
    updateTitleEquipTag = function () {
      prevUpdateTitleEquipTag();
      const tObj = getEquippedTitleObj();
      const baseTxt = titleEquipTag.textContent.replace(/\s*\[更衣室 ▶\]$/, '');
      const titlePart = tObj.id !== 'none' ? `【${tObj.name}】 ` : '';
      titleEquipTag.textContent = `${titlePart}${baseTxt} [更衣室 ▶]`;
    };
    updateTitleEquipTag();
  }

  const wdScreen = document.createElement('div');
  wdScreen.id = 'screen-wardrobe';
  wdScreen.className = 'overlay hidden';
  wdScreen.innerHTML = `
    <div class="title-badge" style="background:#38BDF8;color:#0F172A;">LOCKER & WORKSHOP</div>
    <h2 style="font-size:22px;font-weight:900;margin:0 0 6px 0;">更衣室・工房</h2>
    <div id="wd-summary" class="wd-summary-box"></div>
    <div class="wd-tabs">
      <button id="wd-tab-equip" class="wd-tab active">装備変更</button>
      <button id="wd-tab-workshop" class="wd-tab">工房（強化・醸造）</button>
      <button id="wd-tab-titles" class="wd-tab">称号（案）</button>
    </div>
    <div id="wd-subtabs" class="wd-subtabs hidden">
      <button id="wd-sub-ench" class="wd-subtab active">エンチャント付与</button>
      <button id="wd-sub-brew" class="wd-subtab">ポーション醸造</button>
    </div>
    <div id="wd-body" class="wd-body"></div>
    <button id="wd-back-btn" class="btn btn-back" style="width:100%;max-width:340px;">タイトルへ戻る</button>
  `;
  wrapper.appendChild(wdScreen);

  let wdTab = 'equip';
  let wdWorkshopSub = 'ench';

  function updateWdSummary() {
    const sumEl = document.getElementById('wd-summary');
    if (!sumEl) return;
    const sk = typeof SKINS !== 'undefined' ? SKINS.find(s => s.id === equippedSkin) : null;
    const sw = typeof SWORDS !== 'undefined' ? SWORDS.find(s => s.id === equippedSword) : null;
    const tl = (typeof NINJA_TOOLS !== 'undefined' && typeof toolSave !== 'undefined' && toolSave.equipped)
      ? NINJA_TOOLS.find(t => t.id === toolSave.equipped) : null;
    const pot = typeof getEquippedPotion === 'function' ? getEquippedPotion() : null;
    const tit = getEquippedTitleObj();

    sumEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#FFD600;">CURRENT EQUIP</span>
        <span class="wd-title-badge">${tit.name}</span>
      </div>
      <div class="wd-summary-grid">
        <div>衣装: <span style="color:#38BDF8;">${sk ? sk.name : '忍者'}</span></div>
        <div>武器: <span style="color:#FB7185;">${sw ? sw.name : '木刀'}</span></div>
        <div>忍具: <span style="color:#FACC15;">${tl ? tl.name : 'なし'}</span></div>
        <div>霊薬: <span style="color:#4ADE80;">${pot ? pot.short : 'なし'}</span></div>
      </div>
    `;
  }

  function renderWdEquip() {
    const body = document.getElementById('wd-body');
    body.innerHTML = '';

    if (typeof SKINS !== 'undefined' && typeof unlockedSkins !== 'undefined') {
      const sec = document.createElement('div');
      sec.className = 'wd-sec';
      sec.innerHTML = '<div class="wd-sec-title"><span>衣装（スキン）</span><span style="font-size:10px;color:#64748B;">所持のみ表示</span></div>';
      const grid = document.createElement('div');
      grid.className = 'wd-chip-grid';
      SKINS.filter(s => unlockedSkins.includes(s.id)).forEach(s => {
        const isEq = equippedSkin === s.id;
        const btn = document.createElement('div');
        btn.className = 'wd-chip' + (isEq ? ' eq' : '');
        btn.innerHTML = `<span>${s.name}</span><span style="font-size:9px;color:#475569;">${isEq ? '装備中' : 'タップで装備'}</span>`;
        btn.onclick = () => {
          equippedSkin = s.id;
          if (typeof saveCoinAndSkinData === 'function') saveCoinAndSkinData();
          if (typeof updateTitleEquipTag === 'function') updateTitleEquipTag();
          if (typeof playSound === 'function') playSound('kick');
          renderWardrobe();
        };
        grid.appendChild(btn);
      });
      sec.appendChild(grid);
      body.appendChild(sec);
    }

    if (typeof SWORDS !== 'undefined' && typeof unlockedSwords !== 'undefined') {
      const sec = document.createElement('div');
      sec.className = 'wd-sec';
      sec.innerHTML = '<div class="wd-sec-title"><span>武器（刀）</span><span style="font-size:10px;color:#64748B;">所持のみ表示</span></div>';
      const grid = document.createElement('div');
      grid.className = 'wd-chip-grid';
      SWORDS.filter(s => unlockedSwords.includes(s.id)).forEach(s => {
        const isEq = equippedSword === s.id;
        const btn = document.createElement('div');
        btn.className = 'wd-chip' + (isEq ? ' eq' : '');
        btn.innerHTML = `<span>${s.name}</span><span style="font-size:9px;color:#475569;">${isEq ? '装備中' : 'タップで装備'}</span>`;
        btn.onclick = () => {
          equippedSword = s.id;
          if (typeof saveCoinAndSkinData === 'function') saveCoinAndSkinData();
          if (typeof updateTitleEquipTag === 'function') updateTitleEquipTag();
          if (typeof playSound === 'function') playSound('kick');
          renderWardrobe();
        };
        grid.appendChild(btn);
      });
      sec.appendChild(grid);
      body.appendChild(sec);
    }

    if (typeof NINJA_TOOLS !== 'undefined' && typeof toolSave !== 'undefined') {
      const sec = document.createElement('div');
      sec.className = 'wd-sec';
      sec.innerHTML = '<div class="wd-sec-title"><span>忍具</span><span style="font-size:10px;color:#64748B;">所持アイテム</span></div>';
      const grid = document.createElement('div');
      grid.className = 'wd-chip-grid';
      NINJA_TOOLS.forEach(t => {
        const cnt = toolSave.owned[t.id] || 0;
        const isEq = toolSave.equipped === t.id;
        const btn = document.createElement('div');
        btn.className = 'wd-chip' + (isEq ? ' eq' : '');
        btn.style.opacity = cnt > 0 ? '1' : '0.45';
        btn.innerHTML = `<span>${t.name} (×${cnt})</span><span style="font-size:9px;color:#475569;">${isEq ? '装備中' : (cnt > 0 ? 'タップで装備' : '未所持')}</span>`;
        btn.onclick = () => {
          if (cnt <= 0) return;
          toolSave.equipped = isEq ? null : t.id;
          if (typeof saveTools === 'function') saveTools();
          if (typeof playSound === 'function') playSound('kick');
          renderWardrobe();
        };
        grid.appendChild(btn);
      });
      sec.appendChild(grid);
      body.appendChild(sec);
    }

    if (typeof brewSave !== 'undefined') {
      const sec = document.createElement('div');
      sec.className = 'wd-sec';
      sec.innerHTML = '<div class="wd-sec-title"><span>ポーション（バトル中消費）</span><span style="font-size:10px;color:#64748B;">工房で醸造</span></div>';
      if (!brewSave.potions.length) {
        const emp = document.createElement('div');
        emp.style.cssText = 'font-size:11px;color:#64748B;font-weight:800;';
        emp.textContent = '所持ポーションがありません。「工房」タブで醸造できます。';
        sec.appendChild(emp);
      } else {
        const grid = document.createElement('div');
        grid.className = 'wd-chip-grid';
        brewSave.potions.forEach(p => {
          const isEq = brewSave.equippedUid === p.uid;
          const btn = document.createElement('div');
          btn.className = 'wd-chip' + (isEq ? ' eq' : '');
          btn.innerHTML = `<span>${p.short}</span><span style="font-size:9px;color:#475569;">${isEq ? '装備中' : 'タップで装備'}</span>`;
          btn.onclick = () => {
            brewSave.equippedUid = isEq ? null : p.uid;
            saveBrew();
            if (typeof playSound === 'function') playSound('kick');
            renderWardrobe();
          };
          grid.appendChild(btn);
        });
        sec.appendChild(grid);
      }
      body.appendChild(sec);
    }
  }

  function renderWdWorkshop() {
    const body = document.getElementById('wd-body');
    body.innerHTML = '';

    const skinGridEl = document.getElementById('skin-grid');
    if (!skinGridEl) return;

    const prevTab = typeof currentShopTab !== 'undefined' ? currentShopTab : 'skin';
    if (wdWorkshopSub === 'ench' && typeof renderEnchApplyGrid === 'function') {
      renderEnchApplyGrid();
    } else if (wdWorkshopSub === 'brew' && typeof renderBrewGrid === 'function') {
      renderBrewGrid();
    }

    while (skinGridEl.firstChild) {
      body.appendChild(skinGridEl.firstChild);
    }
    if (typeof currentShopTab !== 'undefined') currentShopTab = prevTab;
  }

  function renderWdTitles() {
    const body = document.getElementById('wd-body');
    body.innerHTML = '';

    const sec = document.createElement('div');
    sec.className = 'wd-sec';
    sec.innerHTML = `
      <div class="wd-sec-title">
        <span>称号システム（アイデア案・お試し装着）</span>
      </div>
      <div style="font-size:10px;color:#475569;font-weight:800;margin-bottom:6px;">
        ※現在はデザイン・装着テスト用の仮実装です。タップするとホーム画面の装備欄に称号が表示されます。
      </div>
    `;

    TITLE_IDEAS.forEach(t => {
      const isEq = equippedTitleId === t.id;
      const row = document.createElement('div');
      row.className = 'wd-chip' + (isEq ? ' eq' : '');
      row.style.marginBottom = '6px';
      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;">【${t.name}】</span>
          <span style="font-size:10px;color:${isEq ? '#15803D' : '#64748B'};">${isEq ? '装着中' : 'タップで仮装着'}</span>
        </div>
        <div style="font-size:10px;color:#334155;">条件案: ${t.cond}</div>
        <div style="font-size:10px;color:#7C3AED;">効果案: ${t.buff}</div>
      `;
      row.onclick = () => {
        equippedTitleId = t.id;
        try { localStorage.setItem('wallKickTitleDraft', equippedTitleId); } catch (e) {}
        if (typeof updateTitleEquipTag === 'function') updateTitleEquipTag();
        if (typeof playSound === 'function') playSound('kick');
        renderWardrobe();
      };
      sec.appendChild(row);
    });

    body.appendChild(sec);
  }

  window.renderWardrobe = function () {
    updateWdSummary();
    document.getElementById('wd-tab-equip').classList.toggle('active', wdTab === 'equip');
    document.getElementById('wd-tab-workshop').classList.toggle('active', wdTab === 'workshop');
    document.getElementById('wd-tab-titles').classList.toggle('active', wdTab === 'titles');

    const subWrap = document.getElementById('wd-subtabs');
    subWrap.classList.toggle('hidden', wdTab !== 'workshop');
    document.getElementById('wd-sub-ench').classList.toggle('active', wdWorkshopSub === 'ench');
    document.getElementById('wd-sub-brew').classList.toggle('active', wdWorkshopSub === 'brew');

    if (wdTab === 'equip') renderWdEquip();
    else if (wdTab === 'workshop') renderWdWorkshop();
    else renderWdTitles();
  };

  if (typeof renderEnchApplyGrid === 'function') {
    const origRenderEnchApply = renderEnchApplyGrid;
    renderEnchApplyGrid = function () {
      origRenderEnchApply();
      if (!wdScreen.classList.contains('hidden') && wdTab === 'workshop' && wdWorkshopSub === 'ench') {
        const skinGridEl = document.getElementById('skin-grid');
        const body = document.getElementById('wd-body');
        if (skinGridEl && body && skinGridEl.firstChild) {
          body.innerHTML = '';
          while (skinGridEl.firstChild) body.appendChild(skinGridEl.firstChild);
        }
      }
    };
  }
  if (typeof renderBrewGrid === 'function') {
    const origRenderBrew = renderBrewGrid;
    renderBrewGrid = function () {
      origRenderBrew();
      if (!wdScreen.classList.contains('hidden') && wdTab === 'workshop' && wdWorkshopSub === 'brew') {
        const skinGridEl = document.getElementById('skin-grid');
        const body = document.getElementById('wd-body');
        if (skinGridEl && body && skinGridEl.firstChild) {
          body.innerHTML = '';
          while (skinGridEl.firstChild) body.appendChild(skinGridEl.firstChild);
          updateWdSummary();
        }
      }
    };
  }

  window.openWardrobe = function () {
    screenTitle.classList.add('hidden');
    wdScreen.classList.remove('hidden');
    if (typeof playSound === 'function') playSound('kick');
    renderWardrobe();
  };

  titleEquipTag.addEventListener('click', openWardrobe);

  document.getElementById('wd-tab-equip').addEventListener('click', () => { wdTab = 'equip'; renderWardrobe(); });
  document.getElementById('wd-tab-workshop').addEventListener('click', () => { wdTab = 'workshop'; renderWardrobe(); });
  document.getElementById('wd-tab-titles').addEventListener('click', () => { wdTab = 'titles'; renderWardrobe(); });
  document.getElementById('wd-sub-ench').addEventListener('click', () => { wdWorkshopSub = 'ench'; renderWardrobe(); });
  document.getElementById('wd-sub-brew').addEventListener('click', () => { wdWorkshopSub = 'brew'; renderWardrobe(); });

  document.getElementById('wd-back-btn').addEventListener('click', () => {
    wdScreen.classList.add('hidden');
    backToTitle();
  });
})();


// ==========================================
// 3. 忍具・秘宝ガチャ 独立演出＆高グラフィック描画
// ==========================================
(function () {
  const wrapper = document.getElementById('game-wrapper');
  if (!wrapper) return;

  const oldScreen = document.getElementById('treasure-gacha-screen');
  if (oldScreen) oldScreen.remove();

  const tScreen = document.createElement('div');
  tScreen.id = 'treasure-gacha-screen';
  tScreen.innerHTML =
    '<canvas id="treasure-gacha-canvas" width="420" height="720"></canvas>' +
    '<button id="treasure-gacha-skip" class="btn btn-back">スキップ</button>' +
    '<button id="treasure-gacha-ok" class="btn btn-story">OK</button>';
  wrapper.appendChild(tScreen);

  const tCanvas = document.getElementById('treasure-gacha-canvas');
  const tc = tCanvas.getContext('2d');
  const skipBtn = document.getElementById('treasure-gacha-skip');
  const okBtn = document.getElementById('treasure-gacha-ok');

  const TREASURE_POOL = [
    { r: 0, kind: 'mat', id: 'herb_set', name: '薬草・朝露セット', sub: '醸造素材 ×3', col: '#4ADE80',
      desc: '薬草3個と朝露の水3個の詰め合わせ。基本の調合に使用。',
      grant: () => { brewSave.mats.herb = (brewSave.mats.herb || 0) + 3; brewSave.mats.dew = (brewSave.mats.dew || 0) + 3; } },
    { r: 0, kind: 'mat', id: 'shroom_pack', name: '夜光茸の群生', sub: '希少素材 ×2', col: '#A78BFA',
      desc: '暗所で淡く発光する夜光茸2個。黄金招来の秘薬の材料。',
      grant: () => { brewSave.mats.shroom = (brewSave.mats.shroom || 0) + 2; } },
    { r: 0, kind: 'mat', id: 'ember_pack', name: '火蜥蜴の尾', sub: '希少素材 ×2', col: '#FB923C',
      desc: '熱を帯びた火蜥蜴の尾2個。鬼神剛力の霊薬の材料。',
      grant: () => { brewSave.mats.ember = (brewSave.mats.ember || 0) + 2; } },
    { r: 1, kind: 'tool', id: 'totem', name: '不死のトーテム', sub: '忍具 ×1', col: '#FACC15',
      desc: '既存の忍具。力尽きた瞬間に自動で身代わりとなり復活する。',
      grant: () => { if (typeof toolSave !== 'undefined') { toolSave.owned.totem = (toolSave.owned.totem || 0) + 1; if (typeof saveTools === 'function') saveTools(); } } },
    { r: 1, kind: 'tool', id: 'flash', name: '閃光玉', sub: '忍具 ×2', col: '#FEF08A',
      desc: '既存の忍具。Zキー使用で画面内の敵を一掃する閃光弾。',
      grant: () => { if (typeof toolSave !== 'undefined') { toolSave.owned.flash = (toolSave.owned.flash || 0) + 2; if (typeof saveTools === 'function') saveTools(); } } },
    { r: 1, kind: 'tool', id: 'charm', name: '跳躍符', sub: '忍具 ×2', col: '#FB7185',
      desc: '既存の忍具。Zキー使用で空中からもう一度大跳躍できる霊符。',
      grant: () => { if (typeof toolSave !== 'undefined') { toolSave.owned.charm = (toolSave.owned.charm || 0) + 2; if (typeof saveTools === 'function') saveTools(); } } },
    { r: 1, kind: 'tool', id: 'magnet', name: '招福の磁石', sub: '忍具 ×2', col: '#60A5FA',
      desc: '既存の忍具。Zキー使用で10秒間周囲のコインを引き寄せる。',
      grant: () => { if (typeof toolSave !== 'undefined') { toolSave.owned.magnet = (toolSave.owned.magnet || 0) + 2; if (typeof saveTools === 'function') saveTools(); } } },
    { r: 2, kind: 'relic', id: 'dragon_scale', name: '紅蓮の古竜鱗', sub: '秘宝・SR素材 ×2', col: '#F43F5E',
      desc: '太古の火竜から剥がれ落ちた硬鱗2枚。高レベル霊薬の核となる秘宝。',
      grant: () => { brewSave.mats.scale = (brewSave.mats.scale || 0) + 2; } },
    { r: 2, kind: 'relic', id: 'royal_scroll', name: '天啓の黄金巻物', sub: '秘宝・結晶＆鱗', col: '#C084FC',
      desc: '古代忍びの奥義が記された秘宝巻物。クリスタル5個と古竜の鱗1枚を獲得。',
      grant: () => {
        if (typeof enchSave !== 'undefined') { enchSave.crystals = (enchSave.crystals || 0) + 5; if (typeof saveEnch === 'function') saveEnch(); }
        brewSave.mats.scale = (brewSave.mats.scale || 0) + 1;
      } },
    { r: 3, kind: 'relic', id: 'astral_core', name: '星屑の天球儀', sub: '伝説秘宝・SSR ×2', col: '#FACC15',
      desc: '星の輝きを閉じ込めた伝説の秘宝。星屑の結晶2個と不死のトーテム1個を獲得。',
      grant: () => {
        brewSave.mats.stardust = (brewSave.mats.stardust || 0) + 2;
        if (typeof toolSave !== 'undefined') { toolSave.owned.totem = (toolSave.owned.totem || 0) + 1; if (typeof saveTools === 'function') saveTools(); }
      } }
  ];

  function drawTreasureIcon(c, item, x, y, scale, t) {
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    c.lineJoin = 'round';
    c.lineCap = 'round';
    const id = item.id;

    if (id === 'totem') {
      c.shadowColor = '#FACC15'; c.shadowBlur = 14;
      const wg = c.createLinearGradient(-1.2, -0.5, 1.2, 0.3);
      wg.addColorStop(0, '#FDE047'); wg.addColorStop(0.5, '#D97706'); wg.addColorStop(1, '#FDE047');
      c.fillStyle = wg; c.strokeStyle = INK3; c.lineWidth = 0.08;
      c.beginPath();
      c.moveTo(-0.35, -0.25); c.lineTo(-1.25, -0.65); c.lineTo(-1.1, -0.25); c.lineTo(-1.22, -0.1);
      c.lineTo(-0.98, 0.18); c.lineTo(-0.35, 0.28);
      c.moveTo(0.35, -0.25); c.lineTo(1.25, -0.65); c.lineTo(1.1, -0.25); c.lineTo(1.22, -0.1);
      c.lineTo(0.98, 0.18); c.lineTo(0.35, 0.28);
      c.fill(); c.stroke();
      c.shadowBlur = 0;

      const bg = c.createLinearGradient(-0.4, -1.0, 0.4, 1.0);
      bg.addColorStop(0, '#FEF9C3'); bg.addColorStop(0.35, '#F59E0B'); bg.addColorStop(0.8, '#B45309'); bg.addColorStop(1, '#78350F');
      c.fillStyle = bg;
      gRR(c, -0.44, -0.98, 0.88, 1.96, 0.14);
      c.fill(); c.stroke();

      c.fillStyle = '#FEF08A';
      c.fillRect(-0.32, -0.8, 0.64, 0.24); c.strokeRect(-0.32, -0.8, 0.64, 0.24);
      const eg = c.createRadialGradient(-0.18, -0.24, 0.02, -0.18, -0.22, 0.15);
      eg.addColorStop(0, '#A7F3D0'); eg.addColorStop(0.6, '#10B981'); eg.addColorStop(1, '#064E3B');
      c.fillStyle = eg;
      c.beginPath(); c.arc(-0.18, -0.22, 0.14, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.arc(0.18, -0.22, 0.14, 0, Math.PI * 2); c.fill(); c.stroke();
      c.strokeStyle = '#451A03'; c.lineWidth = 0.07;
      c.beginPath(); c.moveTo(-0.24, 0.22); c.lineTo(0.24, 0.22); c.moveTo(0, 0.06); c.lineTo(0, 0.72); c.stroke();
    } else if (id === 'flash') {
      c.shadowColor = '#FEF08A'; c.shadowBlur = 18;
      const g = c.createRadialGradient(0, 0, 0.08, 0, 0, 1.2);
      g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.45, '#FEF08A'); g.addColorStop(0.85, '#F59E0B'); g.addColorStop(1, 'rgba(245,158,11,0)');
      c.fillStyle = g;
      c.beginPath();
      for (let i = 0; i < 20; i++) {
        const rr = i % 2 === 0 ? 1.18 : 0.46;
        const a = i * Math.PI / 10 + t * 0.025;
        c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.closePath(); c.fill();
      c.shadowBlur = 0;
      const sg = c.createRadialGradient(-0.12, -0.12, 0.04, 0, 0, 0.38);
      sg.addColorStop(0, '#94A3B8'); sg.addColorStop(0.5, '#334155'); sg.addColorStop(1, '#0F172A');
      c.fillStyle = sg; c.strokeStyle = INK3; c.lineWidth = 0.08;
      c.beginPath(); c.arc(0, 0, 0.38, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#FFFFFF';
      c.beginPath(); c.arc(-0.12, -0.12, 0.1, 0, Math.PI * 2); c.fill();
    } else if (id === 'charm') {
      c.save();
      c.rotate(-0.1);
      c.shadowColor = '#FB7185'; c.shadowBlur = 12;
      const pg = c.createLinearGradient(-0.5, -0.95, 0.5, 0.95);
      pg.addColorStop(0, '#FFFFFF'); pg.addColorStop(1, '#FDE68A');
      c.fillStyle = pg; c.strokeStyle = INK3; c.lineWidth = 0.08;
      c.fillRect(-0.54, -0.96, 1.08, 1.92); c.strokeRect(-0.54, -0.96, 1.08, 1.92);
      c.shadowBlur = 0;
      c.strokeStyle = '#E11D48'; c.lineWidth = 0.11;
      c.beginPath();
      c.moveTo(0, -0.7); c.lineTo(0, 0.7);
      c.moveTo(-0.34, -0.38); c.lineTo(0.34, -0.38);
      c.moveTo(-0.3, 0.26); c.lineTo(0, -0.06); c.lineTo(0.3, 0.26);
      c.stroke();
      c.fillStyle = 'rgba(225,29,72,0.22)';
      c.fillRect(-0.32, 0.46, 0.64, 0.32);
      c.restore();
    } else if (id === 'magnet') {
      c.strokeStyle = '#38BDF8'; c.lineWidth = 0.07;
      c.beginPath();
      c.arc(0, -0.78, 0.42 + Math.sin(t * 0.12) * 0.08, Math.PI, 0, false);
      c.stroke();
      const mg = c.createLinearGradient(-0.8, 0, 0.8, 0.9);
      mg.addColorStop(0, '#F87171'); mg.addColorStop(0.5, '#DC2626'); mg.addColorStop(1, '#7F1D1D');
      c.strokeStyle = INK3; c.lineWidth = 0.08; c.fillStyle = mg;
      c.beginPath();
      c.arc(0, 0.1, 0.8, 0, Math.PI, false);
      c.lineTo(-0.8, -0.76); c.lineTo(-0.36, -0.76); c.lineTo(-0.36, 0.1);
      c.arc(0, 0.1, 0.36, Math.PI, 0, true);
      c.lineTo(0.36, -0.76); c.lineTo(0.8, -0.76);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#F8FAFC';
      c.fillRect(-0.8, -0.76, 0.44, 0.36); c.strokeRect(-0.8, -0.76, 0.44, 0.36);
      c.fillRect(0.36, -0.76, 0.44, 0.36); c.strokeRect(0.36, -0.76, 0.44, 0.36);
    } else if (id === 'dragon_scale') {
      c.shadowColor = '#F43F5E'; c.shadowBlur = 20;
      const pts = [[0, -1.2], [0.92, -0.45], [0.76, 0.72], [0, 1.22], [-0.76, 0.72], [-0.92, -0.45]];
      const g = c.createLinearGradient(-0.9, -1.2, 0.9, 1.2);
      g.addColorStop(0, '#FFE4E6'); g.addColorStop(0.28, '#F43F5E'); g.addColorStop(0.7, '#9F1239'); g.addColorStop(1, '#4C0519');
      c.fillStyle = g; c.strokeStyle = INK3; c.lineWidth = 0.09;
      c.beginPath();
      pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
      c.closePath(); c.fill(); c.stroke();
      c.shadowBlur = 0;

      c.fillStyle = 'rgba(255, 255, 255, 0.34)';
      c.beginPath(); c.moveTo(0, -1.2); c.lineTo(0.48, -0.22); c.lineTo(0, 0.25); c.lineTo(-0.48, -0.22); c.closePath(); c.fill();
      c.fillStyle = 'rgba(254, 205, 211, 0.22)';
      c.beginPath(); c.moveTo(-0.92, -0.45); c.lineTo(-0.48, -0.22); c.lineTo(-0.38, 0.55); c.lineTo(-0.76, 0.72); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.04;
      c.beginPath();
      c.moveTo(0, -1.2); c.lineTo(0, 1.22);
      c.moveTo(-0.92, -0.45); c.lineTo(0, 0.25); c.lineTo(0.92, -0.45);
      c.moveTo(-0.76, 0.72); c.lineTo(0, 0.25); c.lineTo(0.76, 0.72);
      c.stroke();
    } else if (id === 'royal_scroll') {
      c.shadowColor = '#C084FC'; c.shadowBlur = 18;
      const g = c.createLinearGradient(-0.9, -0.7, 0.9, 0.7);
      g.addColorStop(0, '#A855F7'); g.addColorStop(0.5, '#581C87'); g.addColorStop(1, '#2E1065');
      c.fillStyle = g; c.strokeStyle = INK3; c.lineWidth = 0.08;
      c.fillRect(-0.86, -0.6, 1.72, 1.2); c.strokeRect(-0.86, -0.6, 1.72, 1.2);
      c.shadowBlur = 0;
      c.strokeStyle = 'rgba(250, 204, 21, 0.28)'; c.lineWidth = 0.04;
      for (let k = -0.6; k <= 0.6; k += 0.3) {
        c.beginPath(); c.moveTo(k - 0.2, -0.58); c.lineTo(k + 0.2, 0.58); c.stroke();
      }
      const ag = c.createLinearGradient(0, -0.7, 0, 0.7);
      ag.addColorStop(0, '#FEF08A'); ag.addColorStop(0.5, '#F59E0B'); ag.addColorStop(1, '#92400E');
      c.fillStyle = ag; c.strokeStyle = INK3; c.lineWidth = 0.08;
      c.fillRect(-1.02, -0.7, 0.24, 1.4); c.strokeRect(-1.02, -0.7, 0.24, 1.4);
      c.fillRect(0.78, -0.7, 0.24, 1.4); c.strokeRect(0.78, -0.7, 0.24, 1.4);
      c.fillStyle = '#FACC15';
      c.fillRect(-0.16, -0.6, 0.32, 1.2); c.strokeRect(-0.16, -0.6, 0.32, 1.2);
      gCrystal(c, 0, 0, 0.38, '#38BDF8', 12);
    } else if (id === 'astral_core') {
      c.shadowColor = '#FACC15'; c.shadowBlur = 24;
      c.strokeStyle = '#FDE047'; c.lineWidth = 0.08;
      c.save(); c.rotate(t * 0.035);
      c.beginPath(); c.ellipse(0, 0, 1.16, 0.4, 0.45, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.ellipse(0, 0, 1.16, 0.4, -0.45, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = '#38BDF8';
      c.beginPath(); c.ellipse(0, 0, 1.05, 0.35, 1.57, 0, Math.PI * 2); c.stroke();
      c.restore();

      const rg = c.createRadialGradient(0, 0, 0.04, 0, 0, 0.84);
      rg.addColorStop(0, '#FFFFFF'); rg.addColorStop(0.35, '#FEF08A'); rg.addColorStop(0.7, '#F59E0B'); rg.addColorStop(1, '#92400E');
      c.fillStyle = rg; c.strokeStyle = INK3; c.lineWidth = 0.08;
      c.beginPath();
      for (let i = 0; i < 16; i++) {
        const rr = i % 2 === 0 ? 0.84 : 0.34;
        const a = i * Math.PI / 8 - Math.PI / 2;
        c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.closePath(); c.fill(); c.stroke();
      c.shadowBlur = 0;
      c.fillStyle = '#FFFFFF';
      c.beginPath(); c.arc(0, 0, 0.2, 0, Math.PI * 2); c.fill();
    } else if (id === 'shroom_pack') {
      c.fillStyle = '#F1F5F9'; c.strokeStyle = INK3; c.lineWidth = 0.08;
      c.fillRect(-0.24, 0.05, 0.48, 0.78); c.strokeRect(-0.24, 0.05, 0.48, 0.78);
      const mg = c.createRadialGradient(0, -0.35, 0.08, 0, -0.2, 0.86);
      mg.addColorStop(0, '#F3E8FF'); mg.addColorStop(0.55, '#8B5CF6'); mg.addColorStop(1, '#3B0764');
      c.fillStyle = mg;
      c.beginPath(); c.arc(0, 0.08, 0.8, Math.PI, 0, false); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#FEF08A';
      c.beginPath(); c.arc(-0.28, -0.32, 0.13, 0, Math.PI * 2); c.arc(0.25, -0.25, 0.11, 0, Math.PI * 2); c.fill();
    } else if (id === 'ember_pack') {
      const fg = c.createLinearGradient(0, -0.95, 0, 0.9);
      fg.addColorStop(0, '#FEF9C3'); fg.addColorStop(0.45, '#F97316'); fg.addColorStop(1, '#991B1B');
      c.fillStyle = fg; c.strokeStyle = INK3; c.lineWidth = 0.08;
      c.beginPath();
      c.moveTo(-0.48, 0.78); c.quadraticCurveTo(-0.68, -0.1, 0, -0.98);
      c.quadraticCurveTo(0.68, -0.1, 0.48, 0.78); c.quadraticCurveTo(0, 0.96, -0.48, 0.78);
      c.fill(); c.stroke();
    } else {
      gCrystal(c, 0.26, 0.08, 0.58, '#38BDF8', 10);
      const hg = c.createLinearGradient(-0.5, -0.4, -0.1, 0.6);
      hg.addColorStop(0, '#BBF7D0'); hg.addColorStop(1, '#16A34A');
      c.fillStyle = hg; c.strokeStyle = INK3; c.lineWidth = 0.08;
      c.beginPath(); c.ellipse(-0.32, 0.14, 0.28, 0.56, -0.4, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    c.restore();
  }

  function drawToriiSilhouette(c, cx, baseY) {
    c.save();
    c.fillStyle = '#0D1528';
    c.fillRect(cx - 110, baseY - 210, 18, 210);
    c.fillRect(cx + 92, baseY - 210, 18, 210);
    c.fillRect(cx - 135, baseY - 165, 270, 14);
    c.beginPath();
    c.moveTo(cx - 160, baseY - 222);
    c.quadraticCurveTo(cx, baseY - 208, cx + 160, baseY - 222);
    c.lineTo(cx + 150, baseY - 204);
    c.quadraticCurveTo(cx, baseY - 194, cx - 150, baseY - 204);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawNinjaChest(c, cx, cy, openP, shakeX, shakeY, auraCol, t) {
    c.save();
    c.translate(cx + shakeX, cy + shakeY);
    c.lineJoin = 'round';

    c.fillStyle = 'rgba(0,0,0,0.65)';
    c.beginPath();
    c.ellipse(0, 76, 124, 24, 0, 0, Math.PI * 2);
    c.fill();

    const bodyG = c.createLinearGradient(0, -10, 0, 74);
    bodyG.addColorStop(0, '#B45309');
    bodyG.addColorStop(0.5, '#78350F');
    bodyG.addColorStop(1, '#451A03');
    c.fillStyle = bodyG;
    c.strokeStyle = INK3;
    c.lineWidth = 4;
    c.fillRect(-98, -8, 196, 82);
    c.strokeRect(-98, -8, 196, 82);

    c.fillStyle = '#1E293B';
    c.fillRect(-98, -8, 20, 82); c.strokeRect(-98, -8, 20, 82);
    c.fillRect(78, -8, 20, 82); c.strokeRect(78, -8, 20, 82);
    c.fillRect(-98, 56, 196, 18); c.strokeRect(-98, 56, 196, 18);
    c.fillStyle = '#FACC15';
    [[-88, 10], [-88, 36], [88, 10], [88, 36], [-50, 65], [0, 65], [50, 65]].forEach(pt => {
      c.beginPath(); c.arc(pt[0], pt[1], 3.2, 0, Math.PI * 2); c.fill();
    });

    if (openP > 0) {
      const lg = c.createRadialGradient(0, -10, 5, 0, -60, 210 * openP);
      lg.addColorStop(0, '#FFFFFF');
      lg.addColorStop(0.35, auraCol);
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = lg;
      c.beginPath();
      c.moveTo(-88, -8);
      c.lineTo(-175 * openP, -280 * openP);
      c.lineTo(175 * openP, -280 * openP);
      c.lineTo(88, -8);
      c.closePath();
      c.fill();
    }

    c.save();
    c.translate(0, -8 - openP * 42);
    c.scale(1, Math.max(0.22, 1 - openP * 0.7));
    const lidG = c.createLinearGradient(0, -58, 0, 0);
    lidG.addColorStop(0, '#F59E0B');
    lidG.addColorStop(0.5, '#B45309');
    lidG.addColorStop(1, '#78350F');
    c.fillStyle = lidG;
    c.strokeStyle = INK3;
    c.lineWidth = 4;
    c.fillRect(-104, -54, 208, 54);
    c.strokeRect(-104, -54, 208, 54);
    c.fillStyle = '#1E293B';
    c.fillRect(-104, -54, 22, 54); c.strokeRect(-104, -54, 22, 54);
    c.fillRect(82, -54, 22, 54); c.strokeRect(82, -54, 22, 54);
    c.restore();

    if (openP < 0.35) {
      const alpha = 1 - openP / 0.35;
      c.globalAlpha = alpha;
      c.strokeStyle = '#CBD5E1';
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(-102, -48); c.lineTo(102, 64);
      c.moveTo(102, -48); c.lineTo(-102, 64);
      c.stroke();
      c.strokeStyle = INK3;
      c.lineWidth = 2.5;
      c.stroke();

      c.fillStyle = '#FFD600';
      c.strokeStyle = INK3;
      c.lineWidth = 3;
      c.fillRect(-22, -26, 44, 38);
      c.strokeRect(-22, -26, 44, 38);

      c.fillStyle = '#FFFBEB';
      c.fillRect(-13, -52, 26, 74);
      c.strokeRect(-13, -52, 26, 74);
      c.strokeStyle = '#E11D48';
      c.lineWidth = 2.8;
      c.beginPath();
      c.moveTo(0, -40); c.lineTo(0, 12);
      c.moveTo(-8, -24); c.lineTo(8, -24);
      c.moveTo(-7, -4); c.lineTo(7, -4);
      c.stroke();
      c.globalAlpha = 1;
    }
    c.restore();
  }

  function drawScrollCard(c, x, y, s, item, unfold, mini, t) {
    const rc = RAR[item.r];
    const w = 236, h = 316;
    const hScale = Math.max(0.08, unfold);

    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.lineJoin = 'round';

    c.save();
    c.scale(1, hScale);
    if (item.r >= 2) {
      c.shadowColor = rc.col;
      c.shadowBlur = 32;
    }
    const wg = c.createLinearGradient(0, -h / 2, 0, h / 2);
    wg.addColorStop(0, '#FFFBEB');
    wg.addColorStop(0.5, '#FFFDF7');
    wg.addColorStop(1, '#FEF3C7');
    c.fillStyle = wg;
    c.strokeStyle = INK3;
    c.lineWidth = 5;
    c.fillRect(-w / 2, -h / 2, w, h);
    c.strokeRect(-w / 2, -h / 2, w, h);
    c.shadowBlur = 0;

    c.strokeStyle = rc.col;
    c.lineWidth = 4.5;
    c.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20);
    c.strokeStyle = 'rgba(30,30,36,0.25)';
    c.lineWidth = 1.5;
    c.strokeRect(-w / 2 + 15, -h / 2 + 15, w - 30, h - 30);

    c.fillStyle = '#451A03';
    c.strokeStyle = INK3;
    c.lineWidth = 3;
    c.fillRect(-w / 2 - 14, -h / 2 - 9, w + 28, 16);
    c.strokeRect(-w / 2 - 14, -h / 2 - 9, w + 28, 16);
    c.fillRect(-w / 2 - 14, h / 2 - 7, w + 28, 16);
    c.strokeRect(-w / 2 - 14, h / 2 - 7, w + 28, 16);

    c.fillStyle = '#FACC15';
    c.fillRect(-w / 2 - 14, -h / 2 - 9, 14, 16); c.strokeRect(-w / 2 - 14, -h / 2 - 9, 14, 16);
    c.fillRect(w / 2, -h / 2 - 9, 14, 16); c.strokeRect(w / 2, -h / 2 - 9, 14, 16);
    c.fillRect(-w / 2 - 14, h / 2 - 7, 14, 16); c.strokeRect(-w / 2 - 14, h / 2 - 7, 14, 16);
    c.fillRect(w / 2, h / 2 - 7, 14, 16); c.strokeRect(w / 2, h / 2 - 7, 14, 16);

    if (unfold > 0.65) {
      c.fillStyle = rc.col;
      c.fillRect(-w / 2 + 20, -h / 2 + 20, 52, 24);
      c.strokeStyle = INK3;
      c.lineWidth = 2;
      c.strokeRect(-w / 2 + 20, -h / 2 + 20, 52, 24);
      c.textAlign = 'center';
      c.font = '900 16px "M PLUS Rounded 1c", sans-serif';
      c.fillStyle = item.r === 0 ? '#1E1E24' : '#FFFFFF';
      c.fillText(rc.k, -w / 2 + 46, -h / 2 + 37);

      c.font = '900 11px "M PLUS Rounded 1c", sans-serif';
      c.fillStyle = '#475569';
      c.fillText(item.kind === 'tool' ? 'NINJA GEAR' : (item.kind === 'relic' ? 'SACRED RELIC' : 'MATERIAL'), w / 2 - 64, -h / 2 + 36);

      const cg = c.createRadialGradient(0, -34, 8, 0, -34, 64);
      cg.addColorStop(0, '#1E293B');
      cg.addColorStop(1, '#090D16');
      c.fillStyle = cg;
      c.beginPath();
      c.arc(0, -34, 64, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = rc.col;
      c.lineWidth = 4;
      c.stroke();

      drawTreasureIcon(c, item, 0, -34, 44, t);

      c.textAlign = 'center';
      c.font = '900 ' + (mini ? 23 : 21) + 'px "M PLUS Rounded 1c", sans-serif';
      c.fillStyle = '#1E1E24';
      c.fillText(item.name, 0, 62);

      c.font = '900 14px "M PLUS Rounded 1c", sans-serif';
      c.fillStyle = item.r === 0 ? '#0F172A' : shade(rc.col, -0.25);
      c.fillText(item.sub, 0, 88);

      if (!mini) {
        c.font = '800 12px "M PLUS Rounded 1c", sans-serif';
        c.fillStyle = '#334155';
        gWrap(c, item.desc, 190).slice(0, 3).forEach((ln, i) => {
          c.fillText(ln, 0, 114 + i * 17);
        });
      }
    }
    c.restore();
    c.restore();
  }

  const TG = {
    on: false,
    t: 0,
    res: [],
    best: 0,
    raf: null,
    doneT: 290,
    sparks: [],
    petals: [],
    bamboo: []
  };

  function spawnTsparks(x, y, col, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 2.5 + Math.random() * 8.5;
      TG.sparks.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 2.5,
        size: 4 + Math.random() * 6,
        col,
        life: 35 + Math.random() * 35
      });
    }
  }

  function drawTreasureScene() {
    const W = 420, H = 720, cx = 210, cy = 385;
    const t = TG.t, best = TG.best, single = TG.res.length === 1;
    const clamp = v => Math.max(0, Math.min(1, v));
    const ease = v => 1 - Math.pow(1 - clamp(v), 3);
    const auraCol = best === 3 ? '#FACC15' : RAR[best].col;

    const sky = tc.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050814');
    sky.addColorStop(0.5, '#0F172A');
    sky.addColorStop(1, '#04060E');
    tc.fillStyle = sky;
    tc.fillRect(0, 0, W, H);

    tc.save();
    tc.fillStyle = t >= 130 ? auraCol : '#FEF9C3';
    tc.shadowColor = t >= 130 ? auraCol : '#FDE047';
    tc.shadowBlur = 45;
    tc.beginPath();
    tc.arc(315, 130, 54, 0, Math.PI * 2);
    tc.fill();
    tc.restore();

    drawToriiSilhouette(tc, cx, 465);
    tc.fillStyle = '#091020';
    TG.bamboo.forEach(b => {
      tc.fillRect(b.x, 0, b.w, H);
      for (let y = b.off; y < H; y += 75) {
        tc.fillRect(b.x - 2, y, b.w + 4, 4);
      }
    });

    TG.petals.forEach(pt => {
      pt.x += pt.vx + Math.sin(t * 0.04 + pt.ph) * 0.6;
      pt.y += pt.vy;
      if (pt.y > H + 10) { pt.y = -10; pt.x = Math.random() * W; }
      tc.save();
      tc.translate(pt.x, pt.y);
      tc.rotate(t * 0.05 + pt.ph);
      tc.fillStyle = best >= 2 ? '#FDE047' : '#FDA4AF';
      tc.fillRect(-4, -2, 8, 4);
      tc.restore();
    });

    if (t < 175) {
      const dropY = t < 35 ? -120 + ease(t / 35) * (cy + 120) : cy;
      const shakePower = t > 45 && t < 135 ? Math.pow((t - 45) / 90, 2) * 11 : 0;
      const sx = (Math.random() - 0.5) * shakePower;
      const sy = (Math.random() - 0.5) * shakePower;
      const openP = t < 135 ? 0 : clamp((t - 135) / 30);

      if (t === 35) {
        if (typeof gSfx === 'function') gSfx('charge');
        spawnTsparks(cx, cy + 50, '#FACC15', 22);
      }
      if (t === 135) {
        if (typeof gSfx === 'function') gSfx('burst', best);
        spawnTsparks(cx, cy - 10, auraCol, 55);
      }

      drawNinjaChest(tc, cx, dropY, openP, sx, sy, auraCol, t);

      if (t > 55 && t < 135 && t % 3 === 0) {
        spawnTsparks(cx + (Math.random() - 0.5) * 150, cy + (Math.random() - 0.5) * 90, '#F97316', 2);
      }
    }

    if (t >= 135 && t < 172) {
      const fa = t < 145 ? (t - 135) / 10 : 1 - (t - 145) / 27;
      tc.fillStyle = 'rgba(255, 255, 255, ' + clamp(fa) + ')';
      tc.fillRect(0, 0, W, H);
    }

    if (t >= 155) {
      tc.save();
      tc.textAlign = 'center';
      tc.font = '900 32px "M PLUS Rounded 1c", sans-serif';
      tc.lineWidth = 7;
      tc.strokeStyle = INK3;
      const heading = single
        ? (best === 3 ? '伝説秘宝 出現！' : (best === 2 ? '秘宝 出現！' : '忍具・秘宝 獲得！'))
        : '忍具・秘宝 10連結果';
      tc.strokeText(heading, cx, 88);
      tc.fillStyle = best >= 2 ? auraCol : '#FFFFFF';
      tc.fillText(heading, cx, 88);
      tc.restore();

      if (single) {
        const unfold = ease((t - 155) / 32);
        drawScrollCard(tc, cx, 355, 1.0, TG.res[0], unfold, false, t);
      } else {
        for (let i = 0; i < 10; i++) {
          const t0 = 158 + i * 10;
          if (t < t0) continue;
          const colI = i % 5;
          const rowI = Math.floor(i / 5);
          const tx = cx + (colI - 2) * 80;
          const ty = 265 + rowI * 135;
          const unfold = ease((t - t0) / 18);
          if (t === t0 && typeof gSfx === 'function') gSfx('flip', TG.res[i].r);
          drawScrollCard(tc, tx, ty, 0.32, TG.res[i], unfold, true, t);
        }
      }
    }

    for (let i = TG.sparks.length - 1; i >= 0; i--) {
      const p = TG.sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.life--;
      if (p.life <= 0) {
        TG.sparks.splice(i, 1);
        continue;
      }
      tc.fillStyle = p.col;
      tc.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
  }

  function tLoop() {
    if (!TG.on) return;
    TG.t++;
    drawTreasureScene();
    if (TG.t >= TG.doneT) {
      okBtn.style.display = 'flex';
      skipBtn.style.display = 'none';
    }
    TG.raf = requestAnimationFrame(tLoop);
  }

  function closeTreasureGacha() {
    TG.on = false;
    if (TG.raf) cancelAnimationFrame(TG.raf);
    TG.raf = null;
    tScreen.style.display = 'none';
    if (typeof renderGachaHub === 'function') renderGachaHub();
  }

  skipBtn.addEventListener('click', () => {
    if (!TG.on || TG.t >= TG.doneT) return;
    TG.t = TG.doneT;
  });
  okBtn.addEventListener('click', closeTreasureGacha);

  window.openTreasureChestGacha = function (count) {
    const cost = count === 10 ? 2200 : 250;
    if (totalCoins < cost) {
      if (typeof playSound === 'function') playSound('hit');
      return;
    }
    totalCoins -= cost;
    saveCoinAndSkinData();

    const rollOne = (minR) => {
      let x = Math.random() * 100, r = 0;
      for (; r < 4; r++) {
        if (x < RAR[r].w) break;
        x -= RAR[r].w;
      }
      r = Math.max(minR, Math.min(r, 3));
      const cand = TREASURE_POOL.filter(it => it.r === r);
      return cand[Math.floor(Math.random() * cand.length)];
    };

    const res = [];
    for (let i = 0; i < count; i++) res.push(rollOne(0));
    if (count === 10 && !res.some(o => o.r >= 1)) {
      res[9] = rollOne(1);
    }
    res.forEach(o => { if (o.grant) o.grant(); });
    if (typeof saveBrew === 'function') saveBrew();

    TG.on = true;
    TG.t = 0;
    TG.res = res;
    TG.best = res.reduce((m, o) => Math.max(m, o.r), 0);
    TG.doneT = count === 10 ? 280 : 220;
    TG.sparks = [];
    TG.petals = [];
    for (let i = 0; i < 28; i++) {
      TG.petals.push({
        x: Math.random() * 420,
        y: Math.random() * 720,
        vx: -0.4 - Math.random() * 0.6,
        vy: 0.8 + Math.random() * 1.1,
        ph: Math.random() * 6.28
      });
    }
    TG.bamboo = [
      { x: 18, w: 14, off: 10 },
      { x: 58, w: 10, off: 45 },
      { x: 350, w: 12, off: 20 },
      { x: 386, w: 16, off: 55 }
    ];

    tScreen.style.display = 'block';
    okBtn.style.display = 'none';
    skipBtn.style.display = 'flex';
    if (TG.raf) cancelAnimationFrame(TG.raf);
    TG.raf = requestAnimationFrame(tLoop);
  };
})();


// ==========================================
// 4. THE FANTASY 隠し出口の「若干の異変」
// ==========================================
(function () {
  if (typeof drawFanExit !== 'function') return;

  const baseDrawFanExit16 = drawFanExit;
  const motes = [
    { ox: 5, oy: 10, sp: 0.16, ph: 0.4 },
    { ox: 15, oy: 26, sp: 0.21, ph: 2.7 }
  ];

  drawFanExit = function () {
    if (!fanExit || fanExitTaken) return;
    const e = fanExit;
    const sy = e.y - cameraY;
    if (sy < -120 || sy > canvas.height + 120) return;

    const now = performance.now() * 0.001;
    const left = e.side === 'left';

    // 出口付近の壁面だけ、色がごくわずかに暗く紫がかって変質している
    ctx.save();
    const wallX = left ? 0 : RIGHT_WALL_X;
    const wallW = left ? LEFT_WALL_X : (canvas.width - RIGHT_WALL_X);
    const bandTop = sy - 55;
    const bandH = e.h + 110;
    const wg = ctx.createLinearGradient(0, bandTop, 0, bandTop + bandH);
    wg.addColorStop(0, 'rgba(38, 18, 68, 0)');
    wg.addColorStop(0.35, 'rgba(38, 18, 68, 0.28)');
    wg.addColorStop(0.5, 'rgba(54, 24, 92, 0.36)');
    wg.addColorStop(0.65, 'rgba(38, 18, 68, 0.28)');
    wg.addColorStop(1, 'rgba(38, 18, 68, 0)');
    ctx.fillStyle = wg;
    ctx.fillRect(wallX, bandTop, wallW, bandH);
    ctx.restore();

    // 扉本体をほんの少し傾けて描画し、隙間から淡い光と極小の粒を漏らす
    const scx = e.x + e.w / 2;
    const scy = sy + e.h / 2;
    ctx.save();
    ctx.translate(scx, scy);
    ctx.rotate(left ? -0.035 : 0.035);
    ctx.translate(-scx, -scy);
    baseDrawFanExit16();

    const leakAlpha = 0.22 + 0.16 * Math.sin(now * 2.2);
    const seamX = left ? (e.x + e.w - 1.5) : (e.x + 1.5);
    ctx.strokeStyle = `rgba(254, 240, 175, ${leakAlpha.toFixed(3)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(seamX, sy + 8);
    ctx.lineTo(seamX, sy + e.h - 2);
    ctx.stroke();

    motes.forEach(m => {
      const prog = (now * m.sp + m.ph) % 1;
      const mx = e.x + m.ox + Math.sin(now * 1.8 + m.ph) * 2.5;
      const my = sy + e.h - prog * (e.h + 16);
      const ma = Math.sin(prog * Math.PI) * 0.5;
      ctx.fillStyle = `rgba(253, 224, 71, ${ma.toFixed(3)})`;
      ctx.fillRect(mx, my, 2, 2);
    });

    if (Math.sin(now * 7.3) > 0.92) {
      ctx.fillStyle = 'rgba(220, 210, 255, 0.32)';
      ctx.fillRect(e.x - 2, sy + e.h + 6, e.w + 4, 1);
    }
    ctx.restore();
  };
})();
