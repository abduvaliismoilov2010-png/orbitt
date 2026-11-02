// Telefon / planshet uchun moslashuv
(function () {
  const touch = matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (touch) {
    document.documentElement.classList.add('touch');
    // Telefonlarda papka tanlab bo'lmaydi — bir nechta audio fayl tanlanadi
    const inp = document.getElementById('folderInput');
    if (inp) { inp.removeAttribute('webkitdirectory'); inp.removeAttribute('directory'); inp.setAttribute('accept', 'audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac'); }
    const b = document.getElementById('btnFolder'); if (b) b.textContent = '🎵 Musiqa';
    document.querySelectorAll('.now-sub,.empty').forEach(el => { el.textContent = el.textContent.replace('Papkani yuklab', 'Musiqa fayllarini tanlab').replace('Papka yuklanmagan', 'Musiqa tanlanmagan'); });
  }
  // iOS/Android: ovoz birinchi bosishdan keyin ochiladi
  const unlock = () => {
    try { const C = window.AudioContext || window.webkitAudioContext; const c = new C(); c.resume(); const o = c.createOscillator(), g = c.createGain(); g.gain.value = 0; o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.01); setTimeout(() => c.close(), 200); } catch (e) {}
    removeEventListener('touchend', unlock); removeEventListener('click', unlock);
  };
  addEventListener('touchend', unlock, { passive: true }); addEventListener('click', unlock);
  // Taymer ishlayotganda ekran o'chmasin
  let wl = null;
  async function lock() { try { if ('wakeLock' in navigator) wl = await navigator.wakeLock.request('screen'); } catch (e) {} }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') lock(); });
  lock();
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
