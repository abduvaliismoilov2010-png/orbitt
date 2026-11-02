// Musiqa pleyeri: papka yuklash, tasodifiy keyingi qo'shiq, vizualizatsiya effektlari, sozlamalar
(function () {
  const M = OF.state.music;
  const $ = id => document.getElementById(id);
  const audio = new Audio();
  audio.preload = 'auto';

  let tracks = [], idx = -1, shuffle = true, objectUrl = null;
  let ac, analyser, bassF, trebF, lpF, gainN, srcNode, data, wave;

  // ---------- Audio zanjiri: source → bass → treble → lowpass → gain → analyser → chiqish ----------
  function ensureGraph() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    srcNode = ac.createMediaElementSource(audio);
    bassF = ac.createBiquadFilter(); bassF.type = 'lowshelf'; bassF.frequency.value = 160;
    trebF = ac.createBiquadFilter(); trebF.type = 'highshelf'; trebF.frequency.value = 4000;
    lpF = ac.createBiquadFilter(); lpF.type = 'lowpass'; lpF.Q.value = 0.7;
    gainN = ac.createGain();
    analyser = ac.createAnalyser(); analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.82;
    srcNode.connect(bassF).connect(trebF).connect(lpF).connect(gainN).connect(analyser).connect(ac.destination);
    data = new Uint8Array(analyser.frequencyBinCount); wave = new Uint8Array(analyser.fftSize);
    applySettings();
  }

  function lpFreq(v) { return 200 * Math.pow(100, v / 100); }   // 0 → 200 Hz, 100 → 20 kHz
  function applySettings() {
    audio.playbackRate = M.speed / 100;
    audio.preservesPitch = false;                                 // tezlik = ton (kassetadagidek)
    if (gainN) {
      gainN.gain.value = M.vol / 100;
      bassF.gain.value = M.bass; trebF.gain.value = M.treble;
      lpF.frequency.value = lpFreq(M.lp);
    } else audio.volume = M.vol / 100;
    $('vVol').textContent = M.vol + '%';
    $('vSpd').textContent = (M.speed / 100).toFixed(2) + 'x';
    $('vBass').textContent = (M.bass > 0 ? '+' : '') + M.bass + ' dB';
    $('vTreb').textContent = (M.treble > 0 ? '+' : '') + M.treble + ' dB';
    const f = lpFreq(M.lp); $('vLp').textContent = f >= 1000 ? (f / 1000).toFixed(1) + ' kHz' : Math.round(f) + ' Hz';
  }
  [['sVol', 'vol'], ['sSpd', 'speed'], ['sBass', 'bass'], ['sTreb', 'treble'], ['sLp', 'lp']].forEach(([id, key]) => {
    const el = $(id); el.value = M[key];
    el.oninput = () => { M[key] = +el.value; applySettings(); OF.save(); };
  });

  // ---------- Papka yuklash ----------
  $('btnFolder').onclick = () => $('folderInput').click();
  $('folderInput').onchange = e => {
    const files = [...e.target.files].filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac|opus|webm)$/i.test(f.name));
    if (!files.length) { OF.toast('Papkada audio fayl topilmadi'); return; }
    tracks = files.sort((a, b) => a.name.localeCompare(b.name));
    renderList();
    OF.toast(`${tracks.length} ta qo'shiq yuklandi — birini tanlang`);
    e.target.value = '';
  };

  function nice(name) { return name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' '); }
  function renderList() {
    $('playlist').innerHTML = tracks.length
      ? tracks.map((f, i) => `<div class="tr ${i === idx ? 'playing' : ''}" data-i="${i}">${i + 1}. ${OF.esc(nice(f.name))}</div>`).join('')
      : '<div class="empty">Papka yuklanmagan</div>';
  }
  $('playlist').onclick = e => { const r = e.target.closest('.tr'); if (r) play(+r.dataset.i); };

  // ---------- Pleyer boshqaruvi ----------
  function play(i) {
    if (!tracks.length) { $('folderInput').click(); return; }
    ensureGraph();
    idx = (i + tracks.length) % tracks.length;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(tracks[idx]);
    audio.src = objectUrl; applySettings();
    audio.play().catch(() => OF.toast('Faylni ochib bo\'lmadi'));
    $('nowTitle').textContent = nice(tracks[idx].name);
    $('nowSub').textContent = `${idx + 1} / ${tracks.length} · ${shuffle ? 'tasodifiy rejim' : 'ketma-ket'}`;
    pickEffect(true);
    renderList();
    const cur = $('playlist').querySelector('.playing'); if (cur) cur.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function nextIndex() {
    if (tracks.length < 2) return 0;
    if (!shuffle) return idx + 1;
    let n; do { n = Math.floor(Math.random() * tracks.length); } while (n === idx);
    return n;
  }
  const setIcon = playing => $('icoPlay').innerHTML = playing ? '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>';

  $('btnPlay').onclick = () => {
    if (idx < 0) { if (tracks.length) play(shuffle ? Math.floor(Math.random() * tracks.length) : 0); else $('folderInput').click(); return; }
    ensureGraph(); audio.paused ? audio.play() : audio.pause();
  };
  $('btnNext').onclick = () => tracks.length && play(nextIndex());
  $('btnPrev').onclick = () => { if (!tracks.length) return; if (audio.currentTime > 3) audio.currentTime = 0; else play(idx - 1); };
  $('btnShuffle').onclick = () => { shuffle = !shuffle; $('btnShuffle').textContent = shuffle ? '🔀 Tasodifiy' : '➡️ Ketma-ket'; if (idx >= 0) $('nowSub').textContent = `${idx + 1} / ${tracks.length} · ${shuffle ? 'tasodifiy rejim' : 'ketma-ket'}`; };
  audio.onplay = () => setIcon(true);
  audio.onpause = () => setIcon(false);
  audio.onended = () => play(nextIndex());       // tugagach papkadan tasodifiy qo'shiq
  audio.onerror = () => { if (tracks.length > 1) play(nextIndex()); };

  // seek
  const seek = $('seek'); let seeking = false;
  seek.oninput = () => { seeking = true; };
  seek.onchange = () => { if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration; seeking = false; };
  audio.ontimeupdate = () => {
    if (!seeking && audio.duration) seek.value = audio.currentTime / audio.duration * 1000;
    $('curT').textContent = OF.fmtShort(audio.currentTime);
    $('durT').textContent = isFinite(audio.duration) ? OF.fmtShort(audio.duration) : '0:00';
  };

  // ---------- Vizualizatsiya effektlari ----------
  const FX = [
    { id: 'bars', name: 'Ustunlar' }, { id: 'wave', name: 'To\'lqin' }, { id: 'circle', name: 'Aylana' },
    { id: 'particles', name: 'Zarralar' }, { id: 'mirror', name: 'Ko\'zgu' }
  ];
  const fxSel = $('sFx');
  fxSel.innerHTML = '<option value="auto">Avto (har daqiqada)</option>' + FX.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  let fx = 'bars', fxTimer = null, hue = 230;
  fxSel.onchange = () => pickEffect(true);
  function pickEffect(force) {
    clearInterval(fxTimer);
    if (fxSel.value === 'auto') {
      const choose = () => { let n; do { n = FX[Math.floor(Math.random() * FX.length)].id; } while (n === fx && FX.length > 1); fx = n; hue = Math.floor(Math.random() * 360); label(); };
      if (force) choose();
      fxTimer = setInterval(choose, 60000);          // har daqiqada yangi effekt
    } else { fx = fxSel.value; label(); }
  }
  function label() { $('vizTag').textContent = (FX.find(f => f.id === fx) || {}).name || ''; }

  const cv = $('viz'), g = cv.getContext('2d');
  const parts = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), v: Math.random() * 0.002 + 0.0005, s: Math.random() * 2 + 1 }));
  function fit() { const r = devicePixelRatio || 1, b = cv.getBoundingClientRect(); if (cv.width !== b.width * r) { cv.width = b.width * r; cv.height = b.height * r; } }

  function draw() {
    requestAnimationFrame(draw);
    fit();
    const w = cv.width, h = cv.height;
    g.clearRect(0, 0, w, h);
    const playing = analyser && !audio.paused;
    if (playing) { analyser.getByteFrequencyData(data); analyser.getByteTimeDomainData(wave); }
    else if (data) { data.fill(0); wave.fill(128); }
    if (!data) { idleGlow(w, h); return; }

    let sum = 0; const lo = Math.floor(data.length * 0.12);
    for (let i = 0; i < lo; i++) sum += data[i];
    const energy = sum / lo / 255;
    OF.universePulse(playing ? energy : 0);

    const col = (a, off = 0) => `hsla(${(hue + off) % 360},85%,68%,${a})`;
    g.lineWidth = 2 * (devicePixelRatio || 1);
    const n = data.length * 0.75 | 0;

    if (fx === 'bars') {
      const bw = w / 48;
      for (let i = 0; i < 48; i++) {
        const v = Math.min(1, data[Math.floor(Math.pow(i / 48, 1.8) * n)] / 255 * 1.15), bh = Math.max(3, v * h * 0.9);
        const gr = g.createLinearGradient(0, h, 0, h - bh); gr.addColorStop(0, col(0.9, i * 2)); gr.addColorStop(1, col(0.2, 60));
        g.fillStyle = gr; g.beginPath(); g.roundRect(i * bw + 2, h - bh, bw - 4, bh, 6); g.fill();
      }
    } else if (fx === 'wave') {
      for (let l = 0; l < 3; l++) {
        g.strokeStyle = col(0.9 - l * 0.28, l * 40); g.beginPath();
        for (let i = 0; i < wave.length; i++) {
          const x = i / wave.length * w, y = h / 2 + (wave[i] - 128) / 128 * h * 0.42 * (1 - l * 0.25) + Math.sin(i * 0.05 + l) * 4 * l;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
    } else if (fx === 'circle') {
      const cx = w / 2, cy = h / 2, r0 = h * 0.22 + energy * h * 0.1;
      g.strokeStyle = col(0.9); g.beginPath();
      for (let i = 0; i <= 90; i++) {
        const v = data[Math.floor(i % 90 / 90 * n)] / 255, a = i / 90 * Math.PI * 2 - Math.PI / 2, r = r0 + v * h * 0.28;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.stroke(); g.fillStyle = col(0.08 + energy * 0.2); g.fill();
      g.beginPath(); g.arc(cx, cy, r0 * 0.55, 0, 7); g.strokeStyle = col(0.4, 90); g.stroke();
    } else if (fx === 'particles') {
      for (const p of parts) {
        p.y -= p.v * (1 + energy * 14); if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        g.fillStyle = col(0.35 + energy * 0.6, p.x * 80); g.beginPath(); g.arc(p.x * w, p.y * h, p.s * (1 + energy * 3) * (devicePixelRatio || 1), 0, 7); g.fill();
      }
    } else if (fx === 'mirror') {
      const bw = w / 64;
      for (let i = 0; i < 64; i++) {
        const v = Math.min(1, data[Math.floor(Math.pow(i / 64, 1.8) * n)] / 255 * 1.15), bh = Math.max(2, v * h * 0.45);
        g.fillStyle = col(0.85, i * 3); g.fillRect(i * bw + 1, h / 2 - bh, bw - 2, bh); g.fillStyle = col(0.3, i * 3); g.fillRect(i * bw + 1, h / 2, bw - 2, bh * 0.8);
      }
    }
    hue = (hue + 0.12) % 360;
  }
  function idleGlow(w, h) {
    g.strokeStyle = 'rgba(124,140,255,.35)'; g.lineWidth = 2; g.beginPath();
    for (let x = 0; x < w; x += 6) { const y = h / 2 + Math.sin(x * 0.02 + performance.now() / 700) * 8; x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }

  applySettings(); pickEffect(true); draw();
})();
