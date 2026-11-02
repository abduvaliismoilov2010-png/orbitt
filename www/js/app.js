// Sahifalar o'rtasida o'tish
(function () {
  const pages = document.querySelectorAll('.page');
  const btns = document.querySelectorAll('.nav-btn');

  OF.go = function (name) {
    pages.forEach(p => p.classList.toggle('active', p.id === 'page-' + name));
    btns.forEach(b => b.classList.toggle('active', b.dataset.page === name));
    OF.bus.emit('page', name);
  };

  btns.forEach(b => b.onclick = () => OF.go(b.dataset.page));
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => OF.go(b.dataset.go));

  // Ctrl+1..5 — tezkor o'tish
  addEventListener('keydown', e => {
    if (!e.ctrlKey) return;
    const order = ['dashboard', 'tasks', 'focus', 'stats', 'universe'];
    const i = parseInt(e.key, 10);
    if (i >= 1 && i <= 5) { e.preventDefault(); OF.go(order[i - 1]); }
  });
})();
