// Kosmik fon: yulduzlar / nebula / warp, kometalar, musiqaga javob
(function () {
  const cv = document.getElementById('universe');
  const ctx = cv.getContext('2d');
  const U = OF.state.universe;
  let W, H, stars = [], comets = [], dust = [];
  let pulse = 0; // musiqa energiyasi (0..1) — music.js yangilaydi

  OF.universePulse = v => { pulse = pulse * 0.7 + v * 0.3; };

  const MODES = [
    { id: 'stars', name: 'Yulduzli osmon', desc: 'Sokin miltillovchi yulduzlar', grad: 'radial-gradient(circle at 30% 30%, #fff, #7c8cff 55%, #1a1f4d)' },
    { id: 'nebula', name: 'Nebula', desc: 'Rangli bulutlar va chang', grad: 'radial-gradient(circle at 30% 30%, #ffd6ff, #c58bff 50%, #3a1a5c)' },
    { id: 'warp', name: 'Warp', desc: 'Yorug\'lik tezligida uchish', grad: 'radial-gradient(circle at 30% 30%, #d9fff4, #5ee6c1 50%, #0f3d3a)' }
  ];

  function resize() {
    const r = window.devicePixelRatio || 1;
    W = cv.width = innerWidth * r; H = cv.height = innerHeight * r;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    build();
  }

  function build() {
    stars = Array.from({ length: U.density }, () => ({
      x: Math.random() * W, y: Math.random() * H, z: Math.random() * 0.9 + 0.1,
      r: Math.random() * 1.4 + 0.3, t: Math.random() * 6.28
    }));
    dust = Array.from({ length: 7 }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 0.25 + 0.2) * Math.max(W, H),
      vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
      hue: [230, 265, 290, 200, 320, 250, 180][i]
    }));
  }

  function spawnComet() {
    const fromLeft = Math.random() < 0.5;
    comets.push({
      x: fromLeft ? -50 : W + 50, y: Math.random() * H * 0.5,
      vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 6) * (W / 1400),
      vy: (2 + Math.random() * 3) * (W / 1400), life: 1
    });
  }

  let last = performance.now(), cometTimer = 0;
  function frame(now) {
    const dt = Math.min(50, now - last) / 16.67; last = now;
    const sp = (U.speed / 30) * dt;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05060f'; ctx.fillRect(0, 0, W, H);

    const react = U.react ? pulse : 0;

    if (U.mode === 'nebula') {
      ctx.globalCompositeOperation = 'lighter';
      for (const d of dust) {
        d.x += d.vx * sp; d.y += d.vy * sp;
        if (d.x < -d.r) d.x = W + d.r; if (d.x > W + d.r) d.x = -d.r;
        if (d.y < -d.r) d.y = H + d.r; if (d.y > H + d.r) d.y = -d.r;
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        g.addColorStop(0, `hsla(${d.hue},80%,55%,${0.16 + react * 0.18})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.fillRect(d.x - d.r, d.y - d.r, d.r * 2, d.r * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
    } else {
      // yumshoq markaziy nur
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, `rgba(80,90,200,${0.10 + react * 0.2})`); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    for (const s of stars) {
      if (U.mode === 'warp') {
        const cx = W / 2, cy = H / 2;
        const dx = s.x - cx, dy = s.y - cy;
        const k = 1 + 0.02 * s.z * sp * (1 + react * 3);
        s.x = cx + dx * k; s.y = cy + dy * k; s.r += 0.004 * sp;
        if (s.x < 0 || s.x > W || s.y < 0 || s.y > H) { s.x = cx + (Math.random() - 0.5) * 60; s.y = cy + (Math.random() - 0.5) * 60; s.r = 0.3; }
        const len = Math.hypot(dx, dy) * 0.05 * s.z * (1 + react * 2);
        ctx.strokeStyle = `rgba(200,225,255,${Math.min(1, 0.3 + s.z)})`;
        ctx.lineWidth = s.r; ctx.beginPath();
        ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - (dx / (Math.hypot(dx, dy) || 1)) * len, s.y - (dy / (Math.hypot(dx, dy) || 1)) * len); ctx.stroke();
      } else {
        s.t += 0.02 * sp; s.y += 0.08 * s.z * sp; if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
        const a = 0.35 + 0.65 * Math.abs(Math.sin(s.t)) + react * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a * s.z)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * (1 + react * 0.6), 0, 6.283); ctx.fill();
      }
    }

    if (U.comets) {
      cometTimer -= dt; if (cometTimer <= 0) { spawnComet(); cometTimer = 260 + Math.random() * 520; }
      for (const c of comets) {
        c.x += c.vx * sp; c.y += c.vy * sp; c.life -= 0.004 * sp;
        const g = ctx.createLinearGradient(c.x, c.y, c.x - c.vx * 22, c.y - c.vy * 22);
        g.addColorStop(0, `rgba(255,255,255,${Math.max(0, c.life)})`); g.addColorStop(1, 'transparent');
        ctx.strokeStyle = g; ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
        ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x - c.vx * 22, c.y - c.vy * 22); ctx.stroke();
      }
      comets = comets.filter(c => c.life > 0 && c.x > -200 && c.x < W + 200 && c.y < H + 100);
    }
    requestAnimationFrame(frame);
  }

  // ---- Universe sahifasi boshqaruvi ----
  function renderModes() {
    const grid = document.getElementById('uniGrid');
    grid.innerHTML = MODES.map(m => `
      <div class="glass uni-opt hoverable ${U.mode === m.id ? 'active' : ''}" data-mode="${m.id}">
        <div class="orb" style="background:${m.grad};box-shadow:0 0 30px rgba(124,140,255,.4)"></div>
        <b>${m.name}</b><p>${m.desc}</p>
      </div>`).join('');
    grid.querySelectorAll('.uni-opt').forEach(el => el.onclick = () => { U.mode = el.dataset.mode; OF.save(); renderModes(); });
  }

  function bindControls() {
    const den = document.getElementById('uDensity'), spd = document.getElementById('uSpeed');
    const com = document.getElementById('uComets'), rea = document.getElementById('uReact');
    den.value = U.density; spd.value = U.speed;
    com.classList.toggle('on', U.comets); rea.classList.toggle('on', U.react);
    den.oninput = () => { U.density = +den.value; build(); OF.save(); };
    spd.oninput = () => { U.speed = +spd.value; OF.save(); };
    com.onclick = () => { U.comets = !U.comets; com.classList.toggle('on', U.comets); OF.save(); };
    rea.onclick = () => { U.react = !U.react; rea.classList.toggle('on', U.react); OF.save(); };
  }

  addEventListener('resize', resize);
  resize(); renderModes(); bindControls();
  requestAnimationFrame(frame);
})();
