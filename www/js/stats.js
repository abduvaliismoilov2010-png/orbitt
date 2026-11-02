// Statistika va Dashboard
(function () {
  const S = OF.state;
  const $ = id => document.getElementById(id);
  const DAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

  function lastDays(n) {
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (n - 1 - i));
      return { key: OF.dayKey(d), label: DAYS[d.getDay()], sec: 0 };
    }).map(d => (d.sec = OF.secondsOn(d.key), d));
  }

  function streak() {
    let n = 0; const d = new Date();
    if (!OF.secondsOn(OF.dayKey(d))) d.setDate(d.getDate() - 1);   // bugun hali boshlanmagan bo'lsa kechadan sanaymiz
    while (OF.secondsOn(OF.dayKey(d)) > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function renderStats() {
    const week = lastDays(7), todaySec = week[6].sec;
    const total = S.log.reduce((a, l) => a + l.sec, 0);
    const best = Math.max(0, ...Object.values(S.log.reduce((m, l) => (m[l.date] = (m[l.date] || 0) + l.sec, m), {})));
    $('sToday').textContent = Math.round(todaySec / 60);
    $('sWeek').textContent = Math.round(week.reduce((a, d) => a + d.sec, 0) / 60);
    $('sTotal').textContent = (total / 3600).toFixed(1);
    $('sBest').textContent = Math.round(best / 60);

    const max = Math.max(60, ...week.map(d => d.sec));
    $('chart').innerHTML = week.map(d => `
      <div class="col"><span class="v">${Math.round(d.sec / 60)}</span>
        <div class="track"><div class="b" style="height:4px" data-h="${Math.max(2, d.sec / max * 100)}"></div></div>
        <span class="d">${d.label}</span></div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() =>
      $('chart').querySelectorAll('.b').forEach(b => {
        const room = b.parentElement.clientHeight || 120;          // piksel hisobida — foiz balandlik flex ichida ishonchsiz
        b.style.height = Math.max(4, room * b.dataset.h / 100) + 'px';
      })));

    const byTask = {};
    S.log.forEach(l => { const k = l.taskId || '_'; byTask[k] = (byTask[k] || 0) + l.sec; });
    const rows = Object.entries(byTask).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, sec]) => {
      const t = S.tasks.find(x => x.id === id);
      return `<div class="rank-row"><span>${id === '_' ? 'Vazifasiz fokus' : (t ? OF.esc(t.name) : 'O\'chirilgan vazifa')}</span><span>${OF.minutesToText(sec / 60)}</span></div>`;
    });
    $('rank').innerHTML = rows.join('') || '<div class="empty">Hali ma\'lumot yo\'q — birinchi seansni boshlang</div>';
  }

  const TIPS = [
    'Maslahat: har 4 ta seansdan keyin 15–30 daqiqa uzoq dam oling.',
    'Maslahat: dam paytida telefonga emas, derazaga qarang va suv iching.',
    'Maslahat: eng qiyin vazifani kunning boshida bajaring.',
    'Maslahat: bitta seansda faqat bitta vazifa — multitasking diqqatni buzadi.'
  ];

  function renderDash() {
    const h = new Date().getHours();
    $('hello').textContent = (h < 5 ? 'Xayrli tun' : h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech') + ' 👋';
    const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
    const WD = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const now = new Date();
    $('dateLine').textContent = `${WD[now.getDay()]}, ${now.getDate()}-${MONTHS[now.getMonth()]}, ${now.getFullYear()}`;
    const done = S.tasks.filter(t => t.done).length, all = S.tasks.length;
    const todaySec = OF.secondsOn(OF.dayKey());
    const planned = S.tasks.reduce((a, t) => a + t.min * 60, 0), spent = S.tasks.reduce((a, t) => a + Math.min(t.spent || 0, t.min * 60), 0);
    const pct = all ? Math.round((done / all * 0.5 + (planned ? spent / planned : 0) * 0.5) * 100) : 0;
    $('dTasks').textContent = `${done}/${all}`;
    $('dMinutes').textContent = Math.round(todaySec / 60);
    $('dSessions').textContent = S.sessions[OF.dayKey()] || 0;
    $('dStreak').textContent = streak();
    $('dPct').textContent = `${pct}% bajarildi`;
    $('dBar').style.width = pct + '%';
    $('sideToday').textContent = OF.minutesToText(todaySec / 60);
    $('tip').textContent = TIPS[new Date().getDate() % TIPS.length];
    const open = S.tasks.filter(t => !t.done).slice(0, 5);
    $('dList').innerHTML = open.length ? open.map(t => `
      <div class="task" style="cursor:pointer" data-focus="${t.id}">
        <div class="t-main"><div class="t-name">${OF.esc(t.name)}</div><div class="t-meta">${OF.minutesToText(t.min)} · ${Math.round((t.spent || 0) / 60)} daq sarflandi</div></div>
        <span class="chip">Fokus →</span></div>`).join('') : '<div class="empty">Bugun uchun vazifa yo\'q — "My Tasks"da qo\'shing</div>';
    $('dList').querySelectorAll('[data-focus]').forEach(el => el.onclick = () => { OF.currentTaskId = el.dataset.focus; OF.bus.emit('selectTask', OF.currentTaskId); OF.go('focus'); });
  }

  function renderAll() { renderStats(); renderDash(); }
  OF.bus.on('change', renderAll);
  OF.bus.on('page', p => { if (p === 'stats' || p === 'dashboard') renderAll(); });
  renderAll();
})();
