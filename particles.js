/**
 * FIT FUSION - Ember Particles Engine
 * High-performance HTML5 Canvas Ember & Spark Particle Simulation
 */

class EmberParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 65;
    this.mouseX = null;
    this.mouseY = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });
    window.addEventListener('mouseleave', () => {
      this.mouseX = null;
      this.mouseY = null;
    });

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createParticle(true));
    }

    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.width = this.canvas.parentElement.clientWidth;
    this.height = this.canvas.parentElement.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  createParticle(randomY = false) {
    const colors = [
      'rgba(255, 59, 48, ',   // Crimson Flame
      'rgba(255, 149, 0, ',   // Molten Gold
      'rgba(255, 87, 34, ',   // Deep Orange
      'rgba(255, 204, 0, '    // Spark Yellow
    ];

    return {
      x: Math.random() * (this.width || window.innerWidth),
      y: randomY ? Math.random() * (this.height || window.innerHeight) : (this.height || window.innerHeight) + Math.random() * 20,
      size: Math.random() * 2.8 + 0.8,
      speedY: Math.random() * 1.6 + 0.5,
      speedX: (Math.random() - 0.5) * 0.9,
      baseAlpha: Math.random() * 0.7 + 0.3,
      alpha: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: Math.random() * 100 + 80,
      maxLife: 180,
      wobbleSpeed: Math.random() * 0.05 + 0.02,
      wobbleAmp: Math.random() * 1.5 + 0.5,
      wobbleCounter: Math.random() * Math.PI * 2
    };
  }

  animate() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.life++;
      p.wobbleCounter += p.wobbleSpeed;
      p.y -= p.speedY;
      p.x += p.speedX + Math.sin(p.wobbleCounter) * (p.wobbleAmp * 0.3);

      // Interactive mouse drift
      if (this.mouseX !== null && this.mouseY !== null) {
        const dx = p.x - this.mouseX;
        const dy = p.y - this.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          p.x += (dx / dist) * force * 2;
          p.y -= force * 1.5;
        }
      }

      // Fade-in and fade-out life cycle
      const progress = p.life / p.maxLife;
      if (progress < 0.2) {
        p.alpha = (progress / 0.2) * p.baseAlpha;
      } else if (progress > 0.7) {
        p.alpha = (1 - (progress - 0.7) / 0.3) * p.baseAlpha;
      } else {
        p.alpha = p.baseAlpha;
      }

      // Draw glowing ember
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + Math.max(0, p.alpha) + ')';
      this.ctx.shadowColor = '#ff3b30';
      this.ctx.shadowBlur = p.size * 4;
      this.ctx.fill();

      // Reset particle when out of bounds or dead
      if (p.y < -20 || p.x < -20 || p.x > this.width + 20 || p.life >= p.maxLife) {
        this.particles[i] = this.createParticle(false);
      }
    }

    // Reset shadow blur to avoid performance penalty on subsequent draws
    this.ctx.shadowBlur = 0;

    requestAnimationFrame(() => this.animate());
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('ember-canvas')) {
    new EmberParticleSystem('ember-canvas');
  }
});
