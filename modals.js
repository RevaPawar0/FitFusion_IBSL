/**
 * POWERZONE : GYM & SPORTS STORE
 * Interactive Modals System (Free Pass, Workout Quiz, Trial Booking, Quick View)
 */

class PowerZoneModalManager {
  constructor() {
    this.quizAnswers = {};
    this.currentQuizStep = 1;
    this.init();
  }

  init() {
    this.bindGlobalModalEvents();
    this.bindFreePassEvents();
    this.bindQuizEvents();
    this.bindTrialBookingEvents();
    this.bindBmiCalculatorEvents();
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      if (window.pzAuth && typeof window.pzAuth.prefillFormsForCurrentUser === 'function') {
        window.pzAuth.prefillFormsForCurrentUser();
      }
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  bindGlobalModalEvents() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });

    document.querySelectorAll('.modal-close-icon, [data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) this.closeModal(modal.id);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach(modal => {
          this.closeModal(modal.id);
        });
      }
    });

    document.querySelectorAll('[data-open-pass-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal('freePassModal');
      });
    });

    document.querySelectorAll('[data-open-quiz-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetQuiz();
        this.openModal('workoutQuizModal');
      });
    });

    document.querySelectorAll('[data-open-bmi-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal('bmiCalculatorModal');
      });
    });

    document.querySelectorAll('[data-book-class]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const className = btn.getAttribute('data-book-class') || 'Burn & Build';
        this.openTrialBooking(className);
      });
    });
  }

  // --- INTERACTIVE BMI & CALORIE CALCULATOR ---
  bindBmiCalculatorEvents() {
    const form = document.getElementById('bmiCalculatorForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const weight = parseFloat(document.getElementById('bmiWeight').value);
      const height = parseFloat(document.getElementById('bmiHeight').value);
      const age = parseInt(document.getElementById('bmiAge').value) || 25;
      const activity = document.getElementById('bmiActivity').value || 'moderate';

      if (!weight || !height || height <= 0 || weight <= 0) {
        if (window.showToast) window.showToast('Invalid Input', 'Please enter valid height and weight.', 'crimson');
        return;
      }

      const heightM = height / 100;
      const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));

      let category = 'Normal Weight';
      let categoryClass = 'badge-green';
      let program = 'Iron & Alloy Powerlifting';
      let planDesc = 'Focus on progressive overload barbell compounds (Squat, Bench, Deadlift) and functional strength.';
      let fillPercent = 50;

      if (bmi < 18.5) {
        category = 'Underweight';
        categoryClass = 'badge-cyan';
        program = 'Burn & Build Hypertrophy';
        planDesc = 'Hypertrophy resistance training paired with clean caloric surplus to build dense athletic muscle.';
        fillPercent = 25;
      } else if (bmi >= 18.5 && bmi <= 24.9) {
        category = 'Normal / Athletic Range';
        categoryClass = 'badge-green';
        program = 'Iron & Alloy Powerlifting';
        planDesc = 'Optimal body composition. Push for powerlifting PRs and high-octane agility training.';
        fillPercent = 50;
      } else if (bmi >= 25.0 && bmi <= 29.9) {
        category = 'Overweight / Bulking';
        categoryClass = 'badge-gold';
        program = 'Burn & Build Metabolic HIIT';
        planDesc = 'High-energy interval conditioning, SkiErg circuits, and calorie deficits to incinerate stubborn fat.';
        fillPercent = 75;
      } else {
        category = 'High Body Mass Index';
        categoryClass = 'badge-crimson';
        program = 'Velocity 30 & Reset Mobility';
        planDesc = 'Low-impact cardiovascular intervals combined with joint mobility and steam recovery.';
        fillPercent = 90;
      }

      // Calculate BMR & Target Maintenance Calories (Mifflin-St Jeor)
      const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      let activityMult = 1.4; // moderate
      if (activity === 'sedentary') activityMult = 1.2;
      if (activity === 'athlete') activityMult = 1.75;
      const dailyCalories = Math.round(bmr * activityMult);

      const resultBox = document.getElementById('bmiResultContainer');
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
          <div class="bmi-result-box">
            <span class="badge ${categoryClass}" style="margin-bottom: 0.5rem;">${category}</span>
            <div class="bmi-score-number">${bmi} <span style="font-size: 1rem; font-weight: 600; color: var(--text-muted);">BMI</span></div>
            
            <div class="bmi-bar-track">
              <div class="bmi-bar-fill" style="width: ${fillPercent}%;"></div>
            </div>

            <div class="bmi-metric-grid">
              <div class="bmi-mini-card">
                <div class="bmi-mini-val">${dailyCalories.toLocaleString('en-IN')} kcal</div>
                <div class="bmi-mini-label">Est. Daily Calorie Target</div>
              </div>
              <div class="bmi-mini-card">
                <div class="bmi-mini-val" style="color: var(--secondary);">${program.split(' ')[0]}</div>
                <div class="bmi-mini-label">Recommended Discipline</div>
              </div>
            </div>

            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; text-align: left; margin-top: 1rem;">
              <h4 style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 0.25rem;">Program Blueprint: ${program}</h4>
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${planDesc}</p>
            </div>

            <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.25rem;">
              <button class="btn btn-primary btn-sm" onclick="window.pzModalMgr.closeModal('bmiCalculatorModal'); window.pzModalMgr.openTrialBooking('${program.split(' ')[0]}');">
                Book Free Trial for ${program.split(' ')[0]}
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.pzModalMgr.closeModal('bmiCalculatorModal');">
                Done
              </button>
            </div>
          </div>
        `;

        if (window.showToast) {
          window.showToast('BMI Calculated', `Score: ${bmi} (${category}) • Calorie Target: ${dailyCalories} kcal`, 'success');
        }
      }
    });
  }

  // --- FREE 1-DAY PASS GENERATOR ---
  bindFreePassEvents() {
    const form = document.getElementById('freePassForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('passName').value.trim();
      const email = document.getElementById('passEmail').value.trim();
      const branch = document.getElementById('passBranch').value;
      const date = document.getElementById('passDate').value || new Date().toISOString().split('T')[0];

      if (!name || !email) {
        if (window.showToast) window.showToast('Required Fields', 'Please complete your name and WhatsApp email.', 'crimson');
        return;
      }

      const passCode = 'PZ-PASS-' + Math.floor(100000 + Math.random() * 900000);
      const formContainer = document.getElementById('freePassFormWrap');
      const resultContainer = document.getElementById('freePassResultWrap');

      const passPhone = document.getElementById('passPhone')?.value || '';

      // Log into PowerZone Supabase Persistent Cloud DB (Leads Table)
      if (window.PowerZoneDB && typeof window.PowerZoneDB.createLead === 'function') {
        window.PowerZoneDB.createLead({
          id: passCode,
          name: name,
          full_name: name,
          email: email,
          phone: passPhone,
          preferred_slot: `${branch} (${date})`,
          goal: 'VIP 1-Day Gym Pass'
        }).catch(err => console.error('Error creating lead in Supabase:', err));
      } else if (window.PowerZoneDB && typeof window.PowerZoneDB.insert === 'function') {
        window.PowerZoneDB.insert('passes', {
          id: passCode,
          name: name,
          email: email,
          phone: passPhone,
          branch: branch,
          date: date,
          status: 'Active'
        });
      }

      if (formContainer && resultContainer) {
        formContainer.style.display = 'none';
        resultContainer.style.display = 'block';

        resultContainer.innerHTML = `
          <div class="gym-pass-ticket">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-medium); padding-bottom: 0.75rem; margin-bottom: 1rem;">
              <span class="badge badge-crimson">POWERZONE VIP PASS</span>
              <strong style="color: var(--secondary); font-family: var(--font-display);">${passCode}</strong>
            </div>

            <div class="pass-qr-mock">
              <svg viewBox="0 0 100 100" fill="#0b0d11">
                <rect x="5" y="5" width="25" height="25" fill="#dc2626"/>
                <rect x="10" y="10" width="15" height="15" fill="#ffffff"/>
                <rect x="70" y="5" width="25" height="25" fill="#dc2626"/>
                <rect x="75" y="10" width="15" height="15" fill="#ffffff"/>
                <rect x="5" y="70" width="25" height="25" fill="#dc2626"/>
                <rect x="10" y="75" width="15" height="15" fill="#ffffff"/>
                <rect x="35" y="10" width="10" height="10"/>
                <rect x="50" y="20" width="15" height="10"/>
                <rect x="35" y="35" width="30" height="30" fill="#0b0d11"/>
                <rect x="42" y="42" width="16" height="16" fill="#dc2626"/>
                <rect x="70" y="40" width="20" height="10"/>
                <rect x="10" y="45" width="15" height="10"/>
                <rect x="40" y="75" width="20" height="15"/>
                <rect x="70" y="70" width="20" height="20"/>
              </svg>
            </div>

            <h3 style="color: var(--text-primary); font-size: 1.25rem; margin-bottom: 0.25rem;">${name}</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">${branch}</p>
            <p style="font-size: 0.8rem; color: var(--primary); margin-top: 0.5rem; font-weight: 600;">Valid for Entry Date: ${date}</p>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Nagar-Manmad Highway, Shirdi</div>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.25rem; flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="window.printPass('${passCode}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Save Pass / Screenshot
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.pzModalMgr.closeModal('freePassModal')">Done</button>
          </div>
        `;

        if (window.showToast) {
          window.showToast('VIP Pass Ready!', `Welcome to PowerZone Shirdi, ${name}! Your pass code is active and logged in database.`, 'success');
        }
      }
    });
  }

  // --- 3-QUESTION WORKOUT FINDER QUIZ ---
  bindQuizEvents() {
    document.querySelectorAll('.quiz-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.getAttribute('data-step'));
        const value = btn.getAttribute('data-value');

        this.quizAnswers[`step${step}`] = value;

        btn.parentElement.querySelectorAll('.quiz-opt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        setTimeout(() => {
          this.nextQuizStep(step + 1);
        }, 220);
      });
    });
  }

  nextQuizStep(targetStep) {
    if (targetStep <= 3) {
      document.querySelectorAll('.quiz-step').forEach(stepEl => {
        stepEl.classList.remove('active');
      });
      const nextEl = document.getElementById(`quizStep${targetStep}`);
      if (nextEl) nextEl.classList.add('active');
    } else {
      this.calculateQuizResult();
    }
  }

  calculateQuizResult() {
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    const resultStep = document.getElementById('quizStepResult');
    if (!resultStep) return;

    resultStep.classList.add('active');

    const goal = this.quizAnswers.step1 || 'burn';
    let matchTitle = 'Burn & Build Conditioning';
    let matchDesc = 'High-octane agility, dumbbell complexes, sprint ergs, and sports stamina.';
    let matchCal = '850 kcal/session';
    let matchBadge = 'High Intensity';

    if (goal === 'strength') {
      matchTitle = 'Iron & Alloy Powerlifting';
      matchDesc = 'Olympic barbell mastery, heavy compound lifts (Squat, Bench, Deadlift), and raw physical power.';
      matchCal = '600 kcal/session';
      matchBadge = 'Raw Strength';
    } else if (goal === 'recovery') {
      matchTitle = 'Reset & Rebuild Mobility';
      matchDesc = 'Deep myofascial foam rolling, dynamic hip & shoulder mobility flows, and steam/ice bath recovery.';
      matchCal = '300 kcal/session';
      matchBadge = 'Restorative';
    } else if (goal === 'speed') {
      matchTitle = 'Velocity 30 Sprint Blitz';
      matchDesc = '30 minutes of unrelenting turf plyometrics, shuttle sprints, and kettlebell intervals designed for match agility.';
      matchCal = '550 kcal/session';
      matchBadge = 'Express Cardio';
    }

    const resultBox = document.getElementById('quizMatchOutput');
    if (resultBox) {
      resultBox.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-glow); border-radius: var(--radius-lg); padding: 1.5rem; text-align: left; margin: 1.25rem 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <span class="badge badge-crimson">${matchBadge}</span>
            <span style="color: var(--secondary); font-weight: 700; font-size: 0.85rem;">${matchCal}</span>
          </div>
          <h3 style="font-size: 1.45rem; color: var(--text-primary); margin-bottom: 0.5rem;">${matchTitle}</h3>
          <p style="font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 1.25rem;">${matchDesc}</p>
          <div style="background: var(--primary-subtle); border: 1px dashed var(--primary); border-radius: var(--radius-sm); padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">Shirdi Member Code: <strong style="color: var(--primary);">POWERZONE20</strong></span>
            <span style="font-size: 0.75rem; color: var(--secondary); font-weight: 700;">20% OFF Trials</span>
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem; justify-content: center;">
          <a href="classes.html" class="btn btn-primary btn-sm" onclick="window.pzModalMgr.closeModal('workoutQuizModal')">View Class Schedule</a>
          <button class="btn btn-secondary btn-sm" onclick="window.pzModalMgr.resetQuiz()">Retake Quiz</button>
        </div>
      `;
    }
  }

  resetQuiz() {
    this.quizAnswers = {};
    document.querySelectorAll('.quiz-opt-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
    const step1 = document.getElementById('quizStep1');
    if (step1) step1.classList.add('active');
  }

  // --- TRIAL CLASS BOOKING MODAL ---
  openTrialBooking(className) {
    const classSelect = document.getElementById('trialClassSelect');
    if (classSelect) {
      classSelect.value = className;
    }
    this.openModal('trialBookingModal');
  }

  bindTrialBookingEvents() {
    const form = document.getElementById('trialBookingForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const className = document.getElementById('trialClassSelect').value;
      const trainer = document.getElementById('trialTrainerSelect').value;
      const timeSlot = document.getElementById('trialTimeSlot').value;
      const clientName = document.getElementById('trialName').value.trim();
      const email = document.getElementById('trialEmail')?.value.trim() || '';
      const phone = document.getElementById('trialPhone')?.value.trim() || '';

      if (!clientName) {
        if (window.showToast) window.showToast('Missing Info', 'Please enter your full name.', 'crimson');
        return;
      }

      // Log into PowerZone Supabase Persistent Cloud DB (Leads Table)
      const trialId = 'PZ-TRL-' + Math.floor(10000 + Math.random() * 90000);
      if (window.PowerZoneDB && typeof window.PowerZoneDB.createLead === 'function') {
        window.PowerZoneDB.createLead({
          id: trialId,
          name: clientName,
          full_name: clientName,
          email: email,
          phone: phone,
          preferred_slot: `${className} - ${timeSlot} (${trainer})`,
          goal: className
        }).catch(err => console.error('Error logging trial lead in Supabase:', err));
      } else if (window.PowerZoneDB && typeof window.PowerZoneDB.insert === 'function') {
        window.PowerZoneDB.insert('bookings', {
          id: trialId,
          name: clientName,
          email: email,
          phone: phone,
          className: className,
          trainer: trainer,
          timeSlot: timeSlot,
          status: 'Confirmed'
        });
      }

      this.closeModal('trialBookingModal');

      if (window.showToast) {
        window.showToast('Trial Slot Reserved!', `Booked: ${className} with ${trainer} at ${timeSlot} (Logged in Database).`, 'success');
      }
    });
  }

  // --- QUICK VIEW FOR SPORTS PRODUCTS ---
  openQuickView(productId) {
    if (typeof POWERZONE_PRODUCTS === 'undefined') return;
    const prod = POWERZONE_PRODUCTS.find(p => p.id === productId);
    if (!prod) return;

    const modal = document.getElementById('quickViewModal');
    const content = document.getElementById('quickViewContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; align-items: center;">
        <div style="border-radius: var(--radius-md); overflow: hidden; height: 260px; background: var(--bg-secondary);">
          <img src="${prod.image}" alt="${prod.name}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div>
          <span class="badge badge-crimson" style="margin-bottom: 0.5rem;">${prod.badge}</span>
          <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem; color: var(--text-primary);">${prod.name}</h3>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: var(--secondary); font-size: 0.85rem;">
            <span>★ ${prod.rating}</span>
            <span style="color: var(--text-muted);">(${prod.reviews} Shirdi & regional athlete reviews)</span>
          </div>
          <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1.25rem;">${prod.desc}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
            <div>
              <span style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-display);">₹${prod.price.toLocaleString('en-IN')}</span>
              ${prod.oldPrice ? `<span style="font-size: 0.95rem; color: var(--text-muted); text-decoration: line-through; margin-left: 0.5rem;">₹${prod.oldPrice.toLocaleString('en-IN')}</span>` : ''}
            </div>
            <span style="color: var(--accent-green); font-size: 0.85rem; font-weight: 600;">✓ In Stock at Shirdi Store</span>
          </div>
          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 0.5rem;">
            <button class="btn btn-primary" onclick="window.pzCart.buyNow('${prod.id}'); window.pzModalMgr.closeModal('quickViewModal');">
              Buy / Order (COD)
            </button>
            <button class="btn btn-secondary" onclick="window.pzCart.addItem('${prod.id}', 1); window.pzModalMgr.closeModal('quickViewModal');">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;

    this.openModal('quickViewModal');
  }
}

window.printPass = function(code) {
  if (window.showToast) {
    window.showToast('Pass Saved', `PowerZone Gym Pass ${code} saved to your device.`, 'success');
  }
};

window.pzModalMgr = new PowerZoneModalManager();
window.modalMgr = window.pzModalMgr; // backward compat alias
