/**
 * Phase 0 — Landing Screen
 * Particle canvas animation + CTA to start workflow.
 */
(function() {

  // ── Particle Animation ────────────────────────────
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#00d4aa', '#2563eb', '#f59e0b', '#a855f7', '#3b82f6', '#ef4444'];
    const particles = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        r:  Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      // Draw connections
      ctx.globalAlpha = 1;
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            const alpha = (1 - dist / 120) * 0.15;
            ctx.strokeStyle = a.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });
      ctx.globalAlpha = 1;

      requestAnimationFrame(draw);
    }
    draw();
  }

  // ── Start Button ──────────────────────────────────
  function initStartButton() {
    const btn = document.getElementById('start-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const phase0 = document.getElementById('phase-0');
      const mainApp = document.getElementById('main-app');

      // Exit animation on landing
      phase0.classList.add('exit');

      setTimeout(() => {
        phase0.style.display = 'none';
        mainApp.classList.remove('hidden');

        // Initialize map now that container is visible
        MapManager.init();

        // Go to Phase 1
        goToPhase(1);

        // Show AI welcome after a moment
        setTimeout(() => {
          if (typeof initAIWelcome === 'function') initAIWelcome();
        }, 1200);

      }, 600);
    });
  }

  // ── Init ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initStartButton();
  });

})();
