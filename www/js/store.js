// Umumiy holat, saqlash va yordamchi funksiyalar
window.OF = (function () {
  const KEY = 'orbit-focus-v1';
  const defaults = {
    tasks: [],            // {id, name, min, done, spent(sec), created}
    log: [],              // {date:'YYYY-MM-DD', sec, taskId}
    sessions: {},         // {date: count}
    universe: { mode: 'stars', density: 180, speed: 30, comets: true, react: true },
    pomodoro: { work: 25, brk: 5, longBrk: 15, cycles: 4 },
    music: { vol: 80, speed: 100, bass: 0, treble: 0, lp: 100 }
  };

  let state;
  try { state = Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (e) { state = JSON.parse(JSON.stringify(defaults)); }
  for (const k of ['universe', 'pomodoro', 'music']) state[k] = Object.assign({}, defaults[k], state[k]);

  const listeners = {};
  const bus = {
    on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    emit(ev, data) { (listeners[ev] || []).forEach(fn => fn(data)); }
  };

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    bus.emit('change');
  }

  const pad = n => String(n).padStart(2, '0');
  function dayKey(d = new Date()) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function fmt(sec) { sec = Math.max(0, Math.round(sec)); return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`; }
  function fmtShort(sec) { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${pad(sec % 60)}`; }
  function minutesToText(m) {
    m = Math.round(m);
    if (m < 60) return `${m} daq`;
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h} soat ${r} daq` : `${h} soat`;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function addLog(sec, taskId) {
    if (sec <= 0) return;
    state.log.push({ date: dayKey(), sec: Math.round(sec), taskId: taskId || null });
    const t = state.tasks.find(x => x.id === taskId);
    if (t) t.spent = (t.spent || 0) + Math.round(sec);
    save();
  }
  function secondsOn(date) { return state.log.filter(l => l.date === date).reduce((a, l) => a + l.sec, 0); }

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  return { state, save, bus, dayKey, fmt, fmtShort, minutesToText, uid, esc, addLog, secondsOn, toast };
})();
