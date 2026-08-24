/**
 * POWERZONE : GYM & SPORTS STORE
 * Main UI Controller, Dark/Light Theme Switcher & Sports Store Engine
 */

// --- Global Toast Notification Manager ---
window.showToast = function(title, message, type = 'crimson') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const iconSvg = type === 'success' 
    ? '✓' 
    : (type === 'crimson' ? '⚡' : '🔥');

  toast.innerHTML = `
    <div class="toast-icon" style="color: ${type === 'success' ? 'var(--accent-green)' : 'var(--primary)'}; font-weight: 900;">${iconSvg}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// --- Theme Controller (Dark / Light Mode) ---
function initThemeController() {
  const savedTheme = localStorage.getItem('powerzone_theme') || 'dark';
  applyTheme(savedTheme);

  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
      if (window.showToast) {
        window.showToast('Theme Changed', `Switched to ${newTheme === 'dark' ? 'Dark Carbon' : 'Porcelain Light'} mode.`, 'crimson');
      }
    });
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('powerzone_theme', theme);

  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    const textEl = btn.querySelector('.theme-text');
    const iconEl = btn.querySelector('.theme-icon-indicator');
    if (theme === 'light') {
      if (textEl) textEl.textContent = 'Light';
      if (iconEl) iconEl.innerHTML = '☀️';
    } else {
      if (textEl) textEl.textContent = 'Dark';
      if (iconEl) iconEl.innerHTML = '🌙';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Theme Switcher
  initThemeController();

  // --- Header Scroll Effect ---
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // --- Mobile Navigation Drawer ---
  const mobileToggle = document.getElementById('mobileNavToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileLinks = document.querySelectorAll('.mobile-drawer .nav-link');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      mobileDrawer.classList.toggle('open');
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        mobileDrawer.classList.remove('open');
      });
    });
  }

  // --- FAQ Accordions (classes.html) ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn?.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // --- Number Counter Animation (index.html) ---
  const counterElements = document.querySelectorAll('[data-counter-target]');
  if (counterElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.getAttribute('data-counter-target'), 10);
          const suffix = el.getAttribute('data-counter-suffix') || '';
          let current = 0;
          const step = Math.ceil(target / 45);
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              el.innerHTML = `${target.toLocaleString('en-IN')}<span>${suffix}</span>`;
              clearInterval(timer);
            } else {
              el.innerHTML = `${current.toLocaleString('en-IN')}<span>${suffix}</span>`;
            }
          }, 25);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.2 });

    counterElements.forEach(el => observer.observe(el));
  }

  // --- Newsletter Form Submission ---
  const newsletterForms = document.querySelectorAll('.newsletter-form');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('.newsletter-input');
      if (input && input.value.trim()) {
        window.showToast('Subscribed!', `PowerZone Shirdi updates sent to ${input.value.trim()}`, 'success');
        input.value = '';
      }
    });
  });

  // --- Classes Category Filtering (classes.html) ---
  const classFilterBtns = document.querySelectorAll('.class-filter-btn');
  const classCards = document.querySelectorAll('.class-card-item');

  classFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      classFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      classCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.4s ease';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // --- Shop Grid Render & Filtering (shop.html) ---
  const shopGrid = document.getElementById('shopGridContainer');
  if (shopGrid && typeof POWERZONE_PRODUCTS !== 'undefined') {
    let currentCategory = 'all';
    let currentSort = 'featured';
    let searchQuery = '';

    function renderShop() {
      let filtered = [...POWERZONE_PRODUCTS];

      if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.desc.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
        );
      }

      if (currentSort === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (currentSort === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (currentSort === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
      }

      if (filtered.length === 0) {
        shopGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
            <h3 style="margin-bottom: 0.5rem;">No Sports Material Found</h3>
            <p>Try searching for cricket bats, turf shoes, trophies, or lifting belts.</p>
          </div>
        `;
        return;
      }

      const stockOverrides = JSON.parse(localStorage.getItem('powerzone_stock_status_v1') || '{}');

      shopGrid.innerHTML = filtered.map(prod => {
        const isOutOfStock = stockOverrides[prod.id] === 'out';
        return `
        <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}">
          <div class="product-thumb-holder">
            <span class="badge ${isOutOfStock ? 'badge-muted' : (prod.badge === 'Best Seller' ? 'badge-gold' : (prod.badge === 'Pro Choice' ? 'badge-crimson' : 'badge-cyan'))} product-badge-tag">
              ${isOutOfStock ? 'Out of Stock' : prod.badge}
            </span>
            <img src="${prod.image}" alt="${prod.name}" loading="lazy" style="${isOutOfStock ? 'filter: grayscale(80%); opacity: 0.7;' : ''}">
            <button class="btn btn-secondary btn-sm quick-view-btn" onclick="window.pzModalMgr.openQuickView('${prod.id}')">
              Quick Details
            </button>
          </div>
          <div class="product-info">
            <span class="product-category-label">${prod.category}</span>
            <h3 class="product-title">${prod.name}</h3>
            <div class="product-rating">
              <span>★</span> ${prod.rating} <span>(${prod.reviews} reviews)</span>
            </div>
            <div class="product-footer">
              <div class="product-price-row">
                <div class="product-price">
                  ₹${prod.price.toLocaleString('en-IN')}
                  ${prod.oldPrice ? `<span class="old-price">₹${prod.oldPrice.toLocaleString('en-IN')}</span>` : ''}
                </div>
                <span style="font-size: 0.75rem; color: ${isOutOfStock ? 'var(--primary)' : 'var(--accent-green)'}; font-weight: 700;">
                  ${isOutOfStock ? '● Restocking Soon' : '● COD Available'}
                </span>
              </div>
              <div class="product-btn-group">
                ${isOutOfStock ? `
                  <button class="btn btn-secondary btn-sm" disabled style="width: 100%; opacity: 0.55; cursor: not-allowed;">
                    Out of Stock
                  </button>
                ` : `
                  <button class="btn btn-primary btn-sm" onclick="window.pzCart.buyNow('${prod.id}')">
                    Buy / Order (COD)
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="window.pzCart.addItem('${prod.id}', 1)" title="Add to Cart">
                    Add to Cart
                  </button>
                `}
              </div>
            </div>
          </div>
        </div>
      `;
      }).join('');
    }

    renderShop();

    document.querySelectorAll('.shop-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.shop-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.getAttribute('data-cat');
        renderShop();
      });
    });

    const sortSelect = document.getElementById('shopSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderShop();
      });
    }

    const searchInput = document.getElementById('shopSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderShop();
      });
    }
  }

  // --- Real-time Gym Occupancy & Crowd Meter ---
  initCrowdMeter();

  // --- 2-Click Workout Goal Blueprint Generator ---
  initWorkoutGoalGenerator();

  // --- Geo-Radar Landmark Distance Chips ---
  initLandmarkChips();
});

// --- Real-Time Gym Occupancy & Crowd Meter Logic ---
function initCrowdMeter() {
  const currentHour = new Date().getHours();
  let occupancyPct = 28;
  let statusText = '🟢 Optimal Lifting Window';
  let badgeColor = 'var(--accent-green)';

  // Realistic gym curve (5 AM to 10 PM)
  if (currentHour >= 5 && currentHour <= 8) {
    occupancyPct = 55;
    statusText = '🟡 Morning Rush (Good Energy)';
    badgeColor = 'var(--secondary)';
  } else if (currentHour >= 9 && currentHour <= 16) {
    occupancyPct = 25;
    statusText = '🟢 Quiet Hours (Zero Wait on Racks)';
    badgeColor = 'var(--accent-green)';
  } else if (currentHour >= 17 && currentHour <= 20) {
    occupancyPct = 78;
    statusText = '⚡ Evening Peak Hours (High Energy)';
    badgeColor = 'var(--primary)';
  } else if (currentHour >= 21 && currentHour <= 23) {
    occupancyPct = 35;
    statusText = '🟢 Night Session (Low Crowd)';
    badgeColor = 'var(--accent-green)';
  }

  const statusLabel = document.getElementById('occupancyStatusLabel');
  const meterFill = document.getElementById('occupancyMeterFill');
  const chartContainer = document.getElementById('peakHoursChart');
  const toggleBtn = document.getElementById('toggleChartBtn');

  if (statusLabel) {
    statusLabel.innerHTML = `<span style="color: ${badgeColor}; font-weight: 800;">${statusText}</span> • ${occupancyPct}% Floor Capacity`;
  }
  if (meterFill) {
    meterFill.style.width = `${occupancyPct}%`;
  }

  // Generate 16 hourly bars (6 AM to 9 PM)
  if (chartContainer) {
    const hourlyData = [
      { h: '6A', p: 50 }, { h: '7A', p: 70 }, { h: '8A', p: 60 },
      { h: '9A', p: 35 }, { h: '10A', p: 25 }, { h: '11A', p: 20 },
      { h: '12P', p: 28 }, { h: '1P', p: 22 }, { h: '2P', p: 20 },
      { h: '3P', p: 25 }, { h: '4P', p: 40 }, { h: '5P', p: 75 },
      { h: '6P', p: 88 }, { h: '7P', p: 82 }, { h: '8P', p: 65 },
      { h: '9P', p: 35 }
    ];

    chartContainer.innerHTML = hourlyData.map(d => {
      const isCurrent = (d.h.includes('P') ? parseInt(d.h) + 12 : parseInt(d.h)) === currentHour;
      return `
        <div class="peak-bar-col ${isCurrent ? 'current' : ''}" title="${d.h}: ${d.p}% Crowd">
          <div class="peak-bar-fill" style="height: ${d.p}%;"></div>
          <span class="peak-hour-txt">${d.h}</span>
        </div>
      `;
    }).join('');
  }

  if (toggleBtn && chartContainer) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = chartContainer.classList.contains('active');
      chartContainer.classList.toggle('active');
      toggleBtn.textContent = isOpen ? 'View Peak Hour Trends ▼' : 'Hide Hourly Trends ▲';
    });
  }
}

// --- 2-Click Workout Goal Generator ---
function initWorkoutGoalGenerator() {
  const BLUEPRINTS = {
    fatloss: {
      title: '3-Day Metabolic Fat-Loss & EPOC Conditioning',
      tag: 'High Calorie Burn',
      tagClass: 'badge-crimson',
      days: [
        { name: 'Day 1: Upper Body HIIT & SkiErg Complexes', details: 'Dumbbell Push Press (4x12), SkiErg Sprints (5x200m), Kettlebell Swings (4x20), 45s Rest.' },
        { name: 'Day 2: Lower Body Density & Assault Runs', details: 'Goblet Squats (4x15), Walking Lunges (3x20m), Assault Runner Blitz (6x30s), Core Planks.' },
        { name: 'Day 3: Full-Body Tabata & Core Blitz', details: 'Burpee Box Jumps (4x10), Battle Ropes (5x30s), Slam Balls (4x15), Steam Sauna Flush.' }
      ],
      gear: {
        id: 'pz-6',
        name: 'Latex Resistance Loop Bands (Set of 5)',
        price: 799,
        image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&auto=format&fit=crop&q=80',
        badge: 'Recommended for Fat Loss'
      },
      classMatch: 'Burn & Build'
    },
    muscle: {
      title: '3-Day Heavy Powerlifting & Hypertrophy Split',
      tag: 'Raw Strength & Mass',
      tagClass: 'badge-gold',
      days: [
        { name: 'Day 1: Barbell Squat & Quad Mastery', details: 'Competition Back Squat (5x5 @ 80%), Bulgarian Split Squats (3x10), Standing Calf Raises (4x15).' },
        { name: 'Day 2: Competition Bench & Upper Armor', details: 'Flat Barbell Bench (5x5 @ 82%), Incline DB Press (4x8), Barbell Pendlay Rows (4x8).' },
        { name: 'Day 3: Deadlift & Posterior Chain Power', details: 'Conventional Deadlift (5x3 @ 85%), Roman Chair Hyper-extensions (3x12), Barbell Bicep 21s.' }
      ],
      gear: {
        id: 'pz-4',
        name: '10mm Heavy Duty Leather Powerlifting Belt',
        price: 2199,
        image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=600&auto=format&fit=crop&q=80',
        badge: 'Essential for Big 3 Lifts'
      },
      classMatch: 'Iron & Alloy'
    },
    cricket: {
      title: '3-Day Cricket, Badminton & Turf Agility Split',
      tag: 'Match Day Speed',
      tagClass: 'badge-cyan',
      days: [
        { name: 'Day 1: Rotational Power & Medball Blitz', details: 'Rotational Medball Wall Slams (4x12), Single-Arm Dumbbell Snatches (4x8), Sled Sprints (6x20m).' },
        { name: 'Day 2: Multi-Directional Agility & Deceleration', details: 'Lateral Cone Shuffles (5x30s), Plyo Box Depth Jumps (4x6), Nordic Hamstring Curls (3x8).' },
        { name: 'Day 3: Shoulder Bulletproofing & Match Stamina', details: 'Rotator Cuff Band Pull-Aparts (4x20), Curved Treadmill VO2 Intervals (6x45s), Cryo Plunge.' }
      ],
      gear: {
        id: 'pz-2',
        name: 'Grade 1 Kashmir Willow Cricket Bat',
        price: 2899,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop&q=80',
        badge: 'Top Pick for Batsmen'
      },
      classMatch: 'Velocity 30'
    }
  };

  const container = document.getElementById('blueprintOutputContainer');
  if (!container) return;

  function renderBlueprint(goalKey) {
    const data = BLUEPRINTS[goalKey];
    if (!data) return;

    container.innerHTML = `
      <div class="blueprint-content-grid">
        <div class="blueprint-split-days">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h3 style="font-size: 1.35rem; color: var(--text-primary);">${data.title}</h3>
            <span class="badge ${data.tagClass}">${data.tag}</span>
          </div>
          ${data.days.map(d => `
            <div class="split-day-card">
              <div class="split-day-header">
                <h4>${d.name}</h4>
              </div>
              <p class="split-exercises-txt">${d.details}</p>
            </div>
          `).join('')}
          <div style="margin-top: 0.5rem; display: flex; gap: 0.75rem; align-items: center;">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Recommended Class:</span>
            <button class="btn btn-outline btn-sm" onclick="window.pzModalMgr.openTrialBooking('${data.classMatch}')">
              Book ${data.classMatch} Slot →
            </button>
          </div>
        </div>

        <div class="blueprint-gear-box">
          <div>
            <span class="badge badge-crimson">${data.gear.badge}</span>
            <h4 style="font-size: 1.1rem; color: var(--text-primary); margin-top: 0.5rem;">${data.gear.name}</h4>
          </div>
          <div class="gear-box-thumb">
            <img src="${data.gear.image}" alt="${data.gear.name}">
          </div>
          <div>
            <div style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; color: var(--primary); margin-bottom: 0.75rem;">
              ₹${data.gear.price.toLocaleString('en-IN')}
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <button class="btn btn-primary btn-sm" onclick="window.pzCart.buyNow('${data.gear.id}')">
                Buy Now (COD)
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.pzCart.addItem('${data.gear.id}', 1)">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Initial render
  renderBlueprint('fatloss');

  document.querySelectorAll('.blueprint-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.blueprint-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const goal = btn.getAttribute('data-goal');
      renderBlueprint(goal);
    });
  });
}

// --- Geo-Radar Landmark Distance Chips Interaction ---
function initLandmarkChips() {
  document.querySelectorAll('.landmark-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const landmark = chip.getAttribute('data-landmark') || 'Shirdi Highway';
      const time = chip.getAttribute('data-time') || '5 mins';
      if (window.showToast) {
        window.showToast('Route Highlighted', `PowerZone Shirdi is only ${time} away from ${landmark}. Easy parking available!`, 'success');
      }
    });
  });
}

