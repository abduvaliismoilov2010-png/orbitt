// Pomodoro: katta halqa (ish) + ichidagi mitti halqa (dam), baland signal
(function () {
  const S = OF.state, P = S.pomodoro;
  const $ = id => document.getElementById(id);
  const C_BIG = 2 * Math.PI * 160, C_MINI = 2 * Math.PI * 118;
  const ringFg = $('ringFg'), miniFg = $('miniFg');
  ringFg.style.strokeDasharray = C_BIG; miniFg.style.strokeDasharray = C_MINI;
  ringFg.style.strokeDashoffset = 0; miniFg.style.strokeDashoffset = C_MINI;   // boshlang'ich holat (mitti halqa bo'sh)

  const PRESETS = [
    { w: 25, b: 5, name: '25 / 5', hint: 'Klassik — kundalik o\'qish' },
    { w: 50, b: 10, name: '50 / 10', hint: 'Chuqur ish — matematika, kod' },
    { w: 90, b: 20, name: '90 / 20', hint: 'Uzoq oqim — bitta katta vazifa' }
  ];

  // phase: 'work' | 'break' | 'long'
  let phase = 'work', total = P.work * 60, remain = total, running = false, endAt = 0, tick = null;
  let cycle = 0, pendingSec = 0, lastTick = 0, audioCtx = null;

  // ---------- Signal: baland chastotali ovoz ----------
  function getCtx() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function beep() {
    const ac = getCtx(), t0 = ac.currentTime;
    const master = ac.createGain(); master.gain.value = 0.35; master.connect(ac.destination);
    // 3 ta qisqa ketma-ketlik, har birida 3 ta yuqori chastotali "pip" (3.2 kHz / 4 kHz)
    for (let g = 0; g < 3; g++) {
      for (let i = 0; i < 3; i++) {
        const t = t0 + g * 1.1 + i * 0.16;
        const o = ac.createOscillator(), e = ac.createGain();
        o.type = 'sine'; o.frequency.value = i === 1 ? 4000 : 3200;
        e.gain.setValueAtTime(0, t);
        e.gain.linearRampToValueAtTime(1, t + 0.01);
        e.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        o.connect(e); e.connect(master); o.start(t); o.stop(t + 0.14);
      }
    }
  }
  OF.beep = beep;

  // ---------- Ko'rinish ----------
  function breakLen() { return (cycle >= P.cycles ? P.longBrk : P.brk) * 60; }
  function render() {
    const big = $('timeBig'), lbl = $('phaseLbl'), mini = $('miniTime');
    big.textContent = OF.fmt(remain);
    const frac = total ? remain / total : 0;
    if (phase === 'work') {
      lbl.textContent = 'Fokus';
      ringFg.classList.remove('is-break');
      ringFg.style.strokeDashoffset = C_BIG * (1 - frac);   // ish vaqti kamayadi
      miniFg.style.strokeDashoffset = C_MINI;                // dam halqasi hali bo'sh
      mini.classList.remove('live'); mini.textContent = `dam ${OF.fmt(P.brk * 60)}`;
    } else {
      lbl.textContent = phase === 'long' ? 'Uzoq dam' : 'Dam olish';
      ringFg.classList.add('is-break');
      ringFg.style.strokeDashoffset = 0;                     // ish halqasi to'liq — vazifa bajarildi
      miniFg.style.strokeDashoffset = C_MINI * (1 - frac);   // mitti halqa dam vaqtini sanaydi
      mini.classList.add('live'); mini.textContent = `dam ${OF.fmt(remain)}`;
    }
    $('btnStart').textContent = running ? 'To\'xtatish' : (remain < total ? 'Davom etish' : 'Boshlash');
    document.title = running ? `${OF.fmt(remain)} · Orbit Focus` : 'Orbit Focus';
    $('dots').innerHTML = Array.from({ length: P.cycles }, (_, i) => `<i class="${i < cycle ? 'on' : ''}"></i>`).join('');
    document.querySelectorAll('#presetChips .chip').forEach((c, i) => {
      const p = PRESETS[i]; c.classList.toggle('active', p ? (p.w === P.work && p.b === P.brk) : (!PRESETS.some(x => x.w === P.work && x.b === P.brk)));
    });
  }

  function flush() {
    if (pendingSec >= 1) { OF.addLog(pendingSec, OF.currentTaskId); pendingSec = 0; }
  }

  function setPhase(p) {
    phase = p;
    total = p === 'work' ? P.work * 60 : (p === 'long' ? P.longBrk : P.brk) * 60;
    remain = total;
  }

  function onFinish() {
    if (phase === 'work') {
      flush();
      cycle++;
      S.sessions[OF.dayKey()] = (S.sessions[OF.dayKey()] || 0) + 1;
      OF.save();
      beep();
      document.body.classList.add('flash'); setTimeout(() => document.body.classList.remove('flash'), 3800);
      const t = S.tasks.find(x => x.id === OF.currentTaskId);
      if (t && t.spent >= t.min * 60 && !t.done) OF.toast(`"${t.name}" uchun belgilangan vaqt tugadi 🎉`);
      else OF.toast('Ish vaqti tugadi — dam oling');
      const isLong = cycle >= P.cycles;
      setPhase(isLong ? 'long' : 'break');
      if (isLong) cycle = 0;
      endAt = Date.now() + remain * 1000;   // dam avtomatik boshlanadi
      lastTick = Date.now();
    } else {
      beep();
      OF.toast('Dam tugadi — yangi seansga tayyormisiz?');
      setPhase('work'); stop();
    }
    render();
  }

  function loop() {
    const now = Date.now();
    const left = Math.max(0, (endAt - now) / 1000);
    if (phase === 'work') { pendingSec += (now - lastTick) / 1000; if (pendingSec >= 30) flush(); }
    lastTick = now;
    remain = left;
    render();
    if (left <= 0) onFinish();
  }

  function start() {
    getCtx();                                   // brauzer ovozga ruxsat berishi uchun
    if (running) return;
    running = true; lastTick = Date.now(); endAt = lastTick + remain * 1000;
    tick = setInterval(loop, 250); render();
  }
  function stop() {
    running = false; clearInterval(tick); flush(); render();
  }

  $('btnStart').onclick = () => running ? stop() : start();
  $('btnReset').onclick = () => { stop(); setPhase('work'); render(); };
  $('btnSkip').onclick = () => {
    const was = running; stop();
    if (phase === 'work') { flush(); setPhase(cycle + 1 >= P.cycles ? 'long' : 'break'); }
    else setPhase('work');
    render(); if (was) start();
  };

  // ---------- Presetlar va tavsiya ----------
  const chipBox = $('presetChips');
  chipBox.innerHTML = PRESETS.map((p, i) => `<span class="chip" data-i="${i}" title="${p.hint}">${p.name}</span>`).join('') + '<span class="chip" data-i="custom">O\'zim</span>';
  chipBox.onclick = e => {
    const c = e.target.closest('.chip'); if (!c) return;
    if (c.dataset.i === 'custom') { $('cWork').focus(); return; }
    const p = PRESETS[+c.dataset.i]; applyPreset(p.w, p.b);
  };
  function applyPreset(w, b) {
    P.work = w; P.brk = b; P.longBrk = w >= 90 ? 30 : (w >= 50 ? 20 : 15);
    $('cWork').value = w; $('cBreak').value = b;
    stop(); cycle = 0; setPhase('work'); OF.save(); render(); advise();
  }
  $('cApply').onclick = () => {
    const w = Math.max(1, Math.min(240, parseInt($('cWork').value, 10) || 25));
    const b = Math.max(1, Math.min(60, parseInt($('cBreak').value, 10) || 5));
    applyPreset(w, b);
  };

  function advise() {
    const t = S.tasks.find(x => x.id === OF.currentTaskId);
    let txt = `${P.work} daqiqa ish → ${P.brk} daqiqa dam. ${P.cycles} seansdan keyin ${P.longBrk} daqiqalik uzoq dam.`;
    if (t) {
      const left = Math.max(0, t.min - (t.spent || 0) / 60);
      const sessions = Math.max(1, Math.ceil(left / P.work));
      let rec = left <= 30 ? '25 / 5' : left <= 120 ? '50 / 10' : '90 / 20';
      txt = `"${t.name}" uchun ~${Math.round(left)} daq qoldi → taxminan ${sessions} ta seans. Tavsiya: ${rec}. ` + txt;
    }
    $('advice').textContent = txt;
  }

  // ---------- Vazifa tanlash ----------
  const pick = $('taskPick');
  function renderPick() {
    const open = S.tasks.filter(t => !t.done);
    pick.innerHTML = '<option value="">— vazifasiz fokus —</option>' + open.map(t => `<option value="${t.id}">${OF.esc(t.name)} (${OF.minutesToText(t.min)})</option>`).join('');
    pick.value = open.some(t => t.id === OF.currentTaskId) ? OF.currentTaskId : '';
    advise();
  }
  pick.onchange = () => { flush(); OF.currentTaskId = pick.value || null; OF.bus.emit('selectTask', OF.currentTaskId); advise(); };
  OF.bus.on('change', renderPick);
  OF.bus.on('selectTask', renderPick);

  // Space tugmasi — boshlash/to'xtatish (matn kiritilmayotganda)
  addEventListener('keydown', e => {
    if (e.code === 'Space' && document.getElementById('page-focus').classList.contains('active') && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault(); running ? stop() : start();
    }
  });
  addEventListener('beforeunload', flush);

  $('cWork').value = P.work; $('cBreak').value = P.brk;
  setPhase('work'); renderPick(); render();
})();
