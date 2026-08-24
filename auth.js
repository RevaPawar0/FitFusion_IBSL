/**
 * POWERZONE : GYM & SPORTS STORE
 * Customer Authentication, Session Controller & Dynamic Tailored Starter Kit PDF Generator
 * Regional Hub: Shirdi (Nagar-Manmad Highway), Maharashtra
 */

class PowerZoneAuthManager {
  constructor() {
    this.usersKey = 'powerzone_users_v1';
    this.sessionKey = 'powerzone_current_user_v1';
    this.init();
  }

  init() {
    this.seedInitialUsers();
    this.bindEvents();
    this.renderSessionNav();
    this.prefillFormsForCurrentUser();
  }

  // --- Seed Demo Customer Profiles if not present ---
  seedInitialUsers() {
    const existing = localStorage.getItem(this.usersKey);
    if (!existing) {
      const defaultUsers = [
        {
          id: 'PZ-MEM-1001',
          fullName: 'Rahul Gunjal',
          mobile: '9876543210',
          email: 'rahul@example.com',
          password: 'password123',
          goal: 'Muscle Building / Bulk',
          dietPreference: 'Non-Vegetarian',
          createdAt: '2026-08-15'
        },
        {
          id: 'PZ-MEM-1002',
          fullName: 'Priya Deshmukh',
          mobile: '9822018234',
          email: 'priya@example.com',
          password: 'password123',
          goal: 'Fat Loss & Shredding',
          dietPreference: 'Pure Vegetarian',
          createdAt: '2026-08-18'
        }
      ];
      this.saveUsers(defaultUsers);
    }
  }

  getUsers() {
    try {
      const data = localStorage.getItem(this.usersKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error parsing PowerZone Users:', e);
      return [];
    }
  }

  saveUsers(users) {
    try {
      localStorage.setItem(this.usersKey, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving PowerZone Users:', e);
    }
  }

  getCurrentUser() {
    try {
      const session = localStorage.getItem(this.sessionKey);
      return session ? JSON.parse(session) : null;
    } catch (e) {
      console.error('Error parsing current user session:', e);
      return null;
    }
  }

  setCurrentUser(user) {
    try {
      if (user) {
        localStorage.setItem(this.sessionKey, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.sessionKey);
      }
    } catch (e) {
      console.error('Error updating current user session:', e);
    }
  }

  // --- Customer Registration with Diet & Goal Persistence ---
  registerUser({ fullName, mobile, email, password, goal, dietPreference }) {
    const trimmedName = (fullName || '').trim();
    const cleanMobile = (mobile || '').trim().replace(/\D/g, '');
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const selectedGoal = goal || 'Muscle Building / Bulk';
    const selectedDiet = dietPreference || 'Pure Vegetarian';

    // 1. Full name validation
    if (!trimmedName || trimmedName.length < 2) {
      if (window.showToast) window.showToast('Validation Error', 'Please enter your full name.', 'crimson');
      return { success: false, message: 'Invalid name' };
    }

    // 2. Strict Indian Mobile Regex (10 digits starting with 6, 7, 8, 9)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(cleanMobile)) {
      if (window.showToast) {
        window.showToast('Invalid Mobile Number', 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).', 'crimson');
      }
      return { success: false, message: 'Invalid mobile number' };
    }

    // 3. Email Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      if (window.showToast) window.showToast('Invalid Email', 'Please provide a valid email address.', 'crimson');
      return { success: false, message: 'Invalid email' };
    }

    // 4. Password Check
    if (cleanPassword.length < 6) {
      if (window.showToast) window.showToast('Weak Password', 'Password must be at least 6 characters long.', 'crimson');
      return { success: false, message: 'Password too short' };
    }

    // 5. Duplicate Check
    const users = this.getUsers();
    const existingMobile = users.find(u => u.mobile === cleanMobile);
    if (existingMobile) {
      if (window.showToast) window.showToast('Mobile Registered', 'This mobile number is already registered. Please sign in.', 'crimson');
      return { success: false, message: 'Mobile already exists' };
    }

    const existingEmail = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (existingEmail) {
      if (window.showToast) window.showToast('Email Registered', 'This email is already associated with an account. Please sign in.', 'crimson');
      return { success: false, message: 'Email already exists' };
    }

    // Create & Save User
    const newUser = {
      id: 'PZ-MEM-' + Math.floor(10000 + Math.random() * 90000),
      fullName: trimmedName,
      mobile: cleanMobile,
      email: cleanEmail,
      password: cleanPassword,
      goal: selectedGoal,
      dietPreference: selectedDiet,
      createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser);

    // Sync member profile to Supabase PostgreSQL Database
    if (window.PowerZoneDB && typeof window.PowerZoneDB.syncMemberProfile === 'function') {
      window.PowerZoneDB.syncMemberProfile({
        id: newUser.id,
        full_name: newUser.fullName,
        phone: newUser.mobile,
        email: newUser.email,
        diet_preference: newUser.dietPreference,
        training_goal: newUser.goal,
        city: 'Shirdi'
      }).catch(err => console.error('Error syncing profile to Supabase:', err));
    }

    this.closeAuthModal();
    this.renderSessionNav();
    this.prefillFormsForCurrentUser();

    if (window.showToast) {
      window.showToast('Welcome to PowerZone!', `Account created for ${trimmedName}. Your ${selectedDiet} Diet Plan is ready for download.`, 'success');
    }

    return { success: true, user: newUser };
  }

  // --- Customer Login ---
  loginUser(identifier, password) {
    const cleanId = (identifier || '').trim();
    const cleanPassword = (password || '').trim();

    if (!cleanId || !cleanPassword) {
      if (window.showToast) window.showToast('Missing Credentials', 'Please enter your email/mobile and password.', 'crimson');
      return { success: false, message: 'Missing fields' };
    }

    const users = this.getUsers();
    const normalizedMobile = cleanId.replace(/\D/g, '');
    const isMobile = /^[6-9]\d{9}$/.test(normalizedMobile);

    const user = users.find(u => {
      if (isMobile && u.mobile === normalizedMobile) return true;
      return (u.email && u.email.toLowerCase() === cleanId.toLowerCase()) || u.mobile === cleanId;
    });

    if (!user || user.password !== cleanPassword) {
      if (window.showToast) {
        window.showToast('Sign In Failed', 'Invalid email/mobile or password. Please try again.', 'crimson');
      }
      return { success: false, message: 'Invalid credentials' };
    }

    this.setCurrentUser(user);

    // Sync profile to Supabase upon sign in
    if (window.PowerZoneDB && typeof window.PowerZoneDB.syncMemberProfile === 'function') {
      window.PowerZoneDB.syncMemberProfile({
        id: user.id || ('PZ-MEM-' + Math.floor(10000 + Math.random() * 90000)),
        full_name: user.fullName,
        phone: user.mobile,
        email: user.email,
        diet_preference: user.dietPreference || 'Both / Flexible',
        training_goal: user.goal || 'General Fitness',
        city: 'Shirdi'
      }).catch(err => console.error('Error syncing profile to Supabase on login:', err));
    }

    this.closeAuthModal();
    this.renderSessionNav();
    this.prefillFormsForCurrentUser();

    if (window.showToast) {
      window.showToast('Signed In!', `Welcome back, ${user.fullName}!`, 'success');
    }

    return { success: true, user };
  }

  // --- Customer Logout ---
  logoutUser() {
    const user = this.getCurrentUser();
    const name = user ? user.fullName.split(' ')[0] : 'Member';
    this.setCurrentUser(null);
    this.closeUserMenu();
    this.closeUserOrdersModal();
    this.renderSessionNav();

    if (window.showToast) {
      window.showToast('Signed Out', `Goodbye, ${name}. Have a strong day!`, 'crimson');
    }
  }

  // --- Update User Goal & Diet Preferences ---
  updateUserPreferences(newGoal, newDiet) {
    const user = this.getCurrentUser();
    if (!user) return;

    user.goal = newGoal || user.goal || 'Muscle Building / Bulk';
    user.dietPreference = newDiet || user.dietPreference || 'Pure Vegetarian';

    // Update in users array
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.mobile === user.mobile);
    if (idx !== -1) {
      users[idx] = user;
      this.saveUsers(users);
    }

    this.setCurrentUser(user);

    // Sync updated preferences to Supabase
    if (window.PowerZoneDB && typeof window.PowerZoneDB.syncMemberProfile === 'function') {
      window.PowerZoneDB.syncMemberProfile({
        id: user.id || ('PZ-MEM-' + Math.floor(10000 + Math.random() * 90000)),
        full_name: user.fullName,
        phone: user.mobile,
        email: user.email,
        diet_preference: user.dietPreference,
        training_goal: user.goal,
        city: 'Shirdi'
      }).catch(err => console.error('Error syncing updated preferences to Supabase:', err));
    }

    this.renderSessionNav();
    this.openUserOrdersModal();

    if (window.showToast) {
      window.showToast('Preferences Saved', `Updated to ${user.dietPreference} & ${user.goal}. Download refreshed PDF!`, 'success');
    }
  }

  // --- Modal Navigation ---
  openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;

    this.switchAuthTab(tab);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      if (tab === 'login') {
        const input = document.getElementById('loginIdentifier');
        if (input) input.focus();
      } else {
        const input = document.getElementById('regFullName');
        if (input) input.focus();
      }
    }, 150);
  }

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      this.resetAuthForms();
    }
  }

  switchAuthTab(tabName) {
    const tabLoginBtn = document.getElementById('authTabLoginBtn');
    const tabSignupBtn = document.getElementById('authTabSignupBtn');
    const tabLoginContent = document.getElementById('authLoginTabContent');
    const tabSignupContent = document.getElementById('authSignupTabContent');

    if (!tabLoginBtn || !tabSignupBtn || !tabLoginContent || !tabSignupContent) return;

    if (tabName === 'signup') {
      tabLoginBtn.classList.remove('active');
      tabSignupBtn.classList.add('active');
      tabLoginContent.style.display = 'none';
      tabSignupContent.style.display = 'block';
    } else {
      tabLoginBtn.classList.add('active');
      tabSignupBtn.classList.remove('active');
      tabLoginContent.style.display = 'block';
      tabSignupContent.style.display = 'none';
    }
  }

  resetAuthForms() {
    const loginForm = document.getElementById('authLoginForm');
    const signupForm = document.getElementById('authSignupForm');
    if (loginForm) loginForm.reset();
    if (signupForm) signupForm.reset();
  }

  // --- Dynamic Navbar & Mobile Drawer State ---
  renderSessionNav() {
    const user = this.getCurrentUser();
    const authContainers = document.querySelectorAll('#authNavContainer, .auth-nav-container');
    const mobileAuthContainers = document.querySelectorAll('#mobileAuthContainer, .mobile-auth-container');

    const authBtnMarkup = `
      <button class="btn btn-outline btn-sm auth-btn" id="navAuthBtn" onclick="window.pzAuth.openAuthModal('login')" aria-label="Sign In or Register">
        <span class="auth-btn-icon">👤</span>
        <span class="auth-btn-text">Sign In / Join</span>
      </button>
    `;

    const loggedInMarkup = (u) => {
      const firstName = (u.fullName || 'Member').split(' ')[0];
      const diet = u.dietPreference || 'Pure Vegetarian';
      const goal = u.goal || 'Muscle Building / Bulk';
      return `
        <div class="user-session-dropdown" id="userSessionDropdown">
          <button class="user-session-trigger" id="userSessionTrigger" aria-expanded="false" onclick="window.pzAuth.toggleUserMenu(event)">
            <span class="user-avatar-badge">👤</span>
            <span class="user-session-name">Hi, ${firstName}</span>
            <span class="dropdown-chevron">▾</span>
          </button>
          <div class="user-session-menu" id="userSessionMenu">
            <div class="user-menu-header">
              <div class="user-menu-fullname">${u.fullName}</div>
              <div class="user-menu-sub">${u.email || '+91 ' + u.mobile}</div>
              <div style="display: flex; gap: 0.35rem; margin-top: 0.4rem; flex-wrap: wrap;">
                <span class="badge badge-gold" style="font-size: 0.7rem;">🎯 ${goal}</span>
                <span class="badge ${diet === 'Pure Vegetarian' ? 'badge-green' : (diet === 'Non-Vegetarian' ? 'badge-crimson' : 'badge-cyan')}" style="font-size: 0.7rem;">${diet}</span>
              </div>
            </div>
            <div class="user-menu-divider"></div>
            <button class="user-menu-item" onclick="window.pzAuth.openUserOrdersModal()">
              <span class="menu-item-icon">📦</span>
              <span>My Orders & Passes</span>
            </button>
            <button class="user-menu-item" onclick="window.pzAuth.downloadStarterKitPDF()">
              <span class="menu-item-icon">📋</span>
              <span>Download Diet Plan (PDF)</span>
            </button>
            <div class="user-menu-divider"></div>
            <button class="user-menu-item user-menu-logout" onclick="window.pzAuth.logoutUser()">
              <span class="menu-item-icon">🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      `;
    };

    authContainers.forEach(container => {
      container.innerHTML = user ? loggedInMarkup(user) : authBtnMarkup;
    });

    mobileAuthContainers.forEach(container => {
      if (user) {
        const firstName = user.fullName.split(' ')[0];
        const diet = user.dietPreference || 'Pure Vegetarian';
        const goal = user.goal || 'Muscle Building';
        container.innerHTML = `
          <div class="mobile-user-profile-card">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
              <div class="user-avatar-badge" style="width: 36px; height: 36px; font-size: 1.1rem;">👤</div>
              <div>
                <strong style="color: var(--text-primary); font-size: 0.95rem;">Hi, ${firstName}</strong>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${goal} • ${diet}</div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
              <button class="btn btn-secondary btn-sm" onclick="window.pzAuth.openUserOrdersModal()">📦 My Orders</button>
              <button class="btn btn-primary btn-sm" onclick="window.pzAuth.downloadStarterKitPDF()">📋 Diet Plan</button>
            </div>
            <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="window.pzAuth.logoutUser()">🚪 Sign Out</button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <button class="btn btn-outline" style="width: 100%; margin-bottom: 0.75rem;" onclick="window.pzAuth.openAuthModal('login')">
            👤 Sign In / Join PowerZone
          </button>
        `;
      }
    });
  }

  toggleUserMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('userSessionMenu');
    const trigger = document.getElementById('userSessionTrigger');
    if (menu && trigger) {
      const isOpen = menu.classList.contains('show');
      if (isOpen) {
        this.closeUserMenu();
      } else {
        menu.classList.add('show');
        trigger.setAttribute('aria-expanded', 'true');
      }
    }
  }

  closeUserMenu() {
    const menu = document.getElementById('userSessionMenu');
    const trigger = document.getElementById('userSessionTrigger');
    if (menu) menu.classList.remove('show');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  // --- Auto-Prefill Form Fields Across Pages ---
  prefillFormsForCurrentUser() {
    const user = this.getCurrentUser();
    if (!user) return;

    // 1. Checkout Form (shop.html, index.html, classes.html)
    const checkoutName = document.getElementById('checkoutName');
    const checkoutPhone = document.getElementById('checkoutPhone');
    if (checkoutName && !checkoutName.value) checkoutName.value = user.fullName || '';
    if (checkoutPhone && !checkoutPhone.value) checkoutPhone.value = user.mobile || '';

    // 2. Free 1-Day Pass Form (index.html)
    const passName = document.getElementById('passName');
    const passEmail = document.getElementById('passEmail');
    const passPhone = document.getElementById('passPhone');
    if (passName && !passName.value) passName.value = user.fullName || '';
    if (passEmail && !passEmail.value) passEmail.value = user.email || '';
    if (passPhone && !passPhone.value) passPhone.value = user.mobile || '';

    // 3. Trial Booking Form (classes.html)
    const trialName = document.getElementById('trialName');
    const trialEmail = document.getElementById('trialEmail');
    const trialPhone = document.getElementById('trialPhone');
    if (trialName && !trialName.value) trialName.value = user.fullName || '';
    if (trialEmail && !trialEmail.value) trialEmail.value = user.email || '';
    if (trialPhone && !trialPhone.value) trialPhone.value = user.mobile || '';
  }

  // --- Client-Side PDF Starter Kit & Diet Plan Generator (jsPDF) ---
  downloadStarterKitPDF(targetUser = null) {
    this.closeUserMenu();
    const user = targetUser || this.getCurrentUser();

    if (!user) {
      this.openAuthModal('login');
      if (window.showToast) {
        window.showToast('Please Sign In', 'Sign in or create an account to download your personalized Starter Kit & Diet Plan.', 'crimson');
      }
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      if (window.showToast) {
        window.showToast('PDF Engine Loading', 'Please check your internet connection for PDF generation library.', 'crimson');
      }
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      const goal = user.goal || 'Muscle Building / Bulk';
      const diet = user.dietPreference || 'Pure Vegetarian';
      const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

      // --- Color Palette ---
      const crimson = [220, 38, 38];
      const darkBg = [15, 17, 21];
      const gold = [217, 119, 6];
      const green = [5, 150, 105];
      const cyan = [2, 132, 199];
      const textLight = [248, 250, 252];
      const textDark = [15, 23, 42];
      const textMuted = [100, 116, 139];

      // --- Determine Protocol Badge & Targets ---
      let protocolBadge = 'DIET: 100% PURE VEG PROTOCOL';
      let protocolColor = green;
      if (diet === 'Non-Vegetarian') {
        protocolBadge = 'DIET: HIGH-PROTEIN NON-VEG PROTOCOL';
        protocolColor = crimson;
      } else if (diet === 'Both / Flexible') {
        protocolBadge = 'DIET: HYBRID FUEL PROTOCOL';
        protocolColor = cyan;
      }

      // Goal Specific Targets
      let calTarget = 'High Surplus (~2,800 - 3,200 kcal)';
      let proteinTarget = '~1.8g - 2.2g per kg bodyweight';
      let waterTarget = '4.0 Liters daily';
      let macroSplit = '50% Carbs | 25% Protein | 25% Healthy Fats';

      if (goal.includes('Fat Loss') || goal.includes('Shredding')) {
        calTarget = 'Deficit / High Fiber (~1,800 - 2,100 kcal)';
        proteinTarget = '~2.0g - 2.4g per kg bodyweight';
        waterTarget = '4.5 Liters daily';
        macroSplit = '35% Complex Carbs | 40% Protein | 25% Good Fats';
      } else if (goal.includes('General') || goal.includes('Stamina')) {
        calTarget = 'Maintenance (~2,200 - 2,500 kcal)';
        proteinTarget = '~1.2g - 1.5g per kg bodyweight';
        waterTarget = '3.5 Liters daily';
        macroSplit = '45% Whole Carbs | 30% Protein | 25% Fats';
      }

      // ==========================================
      // PAGE 1: ATHLETE PROFILE & MEAL BLUEPRINT
      // ==========================================

      // Header Banner
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setFillColor(...crimson);
      doc.rect(0, 36, 210, 2, 'F');

      doc.setTextColor(255, 59, 48);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('POWERZONE', 14, 16);

      doc.setTextColor(...textLight);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('PREMIER GYM & OFFICIAL SPORTS STORE | SHIRDI - KOPARGAON', 14, 23);
      doc.setFontSize(7.5);
      doc.setTextColor(...textMuted);
      doc.text('Nagar-Manmad Highway, Shirdi, Maharashtra | 24/7 Biometric Access & Sports Arena', 14, 29);

      doc.setFontSize(10);
      doc.setTextColor(255, 149, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('ATHLETE PLAYBOOK', 196, 16, { align: 'right' });
      doc.setFontSize(8);
      doc.setTextColor(...textLight);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL BLUEPRINT', 196, 23, { align: 'right' });

      // Member Info Box
      let y = 44;
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(215, 222, 232);
      doc.roundedRect(14, y, 182, 22, 3, 3, 'FD');

      doc.setFontSize(8.5);
      doc.setTextColor(...textDark);
      doc.setFont('helvetica', 'bold');
      doc.text('MEMBER NAME:', 18, y + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${user.fullName}`, 50, y + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.text('MEMBER ID:', 18, y + 13.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...crimson);
      doc.text(`${user.id || 'PZ-MEM-' + Math.floor(10000 + Math.random() * 90000)}`, 42, y + 13.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('GOAL:', 98, y + 6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gold);
      doc.text(`${goal.toUpperCase()}`, 115, y + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('PROTOCOL:', 98, y + 13.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...protocolColor);
      doc.text(`[${protocolBadge}]`, 122, y + 13.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textDark);
      doc.text('DATE:', 160, y + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${today}`, 174, y + 6.5);

      // --- Target Macros & Hydration Stat Cards (4 Mini Cards) ---
      y = 71;
      const cardW = 43;
      const cardH = 16;
      const cardGap = 3.3;

      const statCards = [
        { lbl: '[DAILY CALORIES]', val: calTarget },
        { lbl: '[PROTEIN TARGET]', val: proteinTarget },
        { lbl: '[HYDRATION BOSS]', val: waterTarget },
        { lbl: '[MACRO MATRIX]', val: macroSplit }
      ];

      statCards.forEach((c, idx) => {
        const cx = 14 + idx * (cardW + cardGap);
        doc.setFillColor(240, 244, 248);
        doc.setDrawColor(220, 226, 235);
        doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD');

        doc.setFontSize(6.8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...crimson);
        doc.text(c.lbl, cx + 3, y + 4.5);

        doc.setFontSize(6.8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        const splitVal = doc.splitTextToSize(c.val, cardW - 6);
        doc.text(splitVal, cx + 3, y + 8.5);
      });

      // --- Section 1: Tailored Daily Meal Protocol ---
      y = 93;
      doc.setFillColor(...crimson);
      doc.rect(14, y, 3.5, 8, 'F');
      doc.setFontSize(11);
      doc.setTextColor(...textDark);
      doc.setFont('helvetica', 'bold');
      doc.text(`1. PERSONALIZED DAILY MEAL PROTOCOL (${diet.toUpperCase()})`, 21, y + 6);

      y += 11;

      // Meal items definition tailored strictly by preference & goal
      let mealList = [];

      if (diet === 'Pure Vegetarian') {
        mealList = [
          {
            title: '[MEAL 1: PRE-WORKOUT FUEL (30-45 MINS PRIOR)]',
            items: [
              'PRIMARY: 1 Large ripe banana with 1 tbsp unsweetened peanut butter + 5 soaked almonds.',
              'ENERGY: Black coffee or warm green tea + 2 Medjool dates for rapid glycogen loading.'
            ]
          },
          {
            title: '[MEAL 2: BREAKFAST POWER MATRIX]',
            items: [
              'PROTEIN BASE: 100g Fresh Low-Fat Paneer Bhurji with chopped onions, tomatoes & turmeric.',
              'COMPLEX CARBS: 2 Jowar or Multigrain Rotis + 1 bowl Fresh Dahi / Curd (150g) + mint chutney.'
            ]
          },
          {
            title: '[MEAL 3: LUNCH MACRO FUEL]',
            items: [
              'CARB & FIBER: 1.5 cups steamed Brown Rice or 2 Phulkas + 1 large bowl Yellow Tadka Dal / Rajma.',
              'PLANT PROTEIN: 120g Sautéed Tofu or Roasted Chana + Cucumber, Tomato & Sprouted Moong salad.'
            ]
          },
          {
            title: '[MEAL 4: POST-WORKOUT ANABOLIC RECOVERY (WITHIN 45 MINS)]',
            items: [
              'ISOLATE / SHAKE: 1 Scoop Plant / Whey Protein in water OR 300ml Roasted Sattu Buttermilk.',
              'CARB REPLENISH: 1 Fresh seasonal fruit (Apple/Papaya) + 1 bowl boiled green sprouts with lemon.'
            ]
          },
          {
            title: '[MEAL 5: DINNER LEAN REPAIR]',
            items: [
              'PROTEIN & GREENS: 120g Grilled Paneer Tikka / Soya Chunks Curry + 1 warm bowl Mixed Veg Soup.',
              'DIGESTION: 1 Small multigrain chapati + generous green salad (Cucumber, Beetroot, Lemon).'
            ]
          }
        ];
      } else if (diet === 'Non-Vegetarian') {
        mealList = [
          {
            title: '[MEAL 1: PRE-WORKOUT FUEL (30-45 MINS PRIOR)]',
            items: [
              'PRIMARY: 2 Hard-boiled egg whites + 1 slice whole wheat toast with 1 tbsp peanut butter.',
              'ENERGY BOOST: 1 Shot black espresso or black coffee + 4 soaked almonds + 1 date.'
            ]
          },
          {
            title: '[MEAL 2: BREAKFAST POWER MATRIX]',
            items: [
              'PROTEIN BASE: 3 Whole scrambled eggs with sautéed mushrooms, spinach & crushed black pepper.',
              'CARB FUEL: 2 Slices artisanal whole wheat toast + 1 glass freshly squeezed citrus juice.'
            ]
          },
          {
            title: '[MEAL 3: LUNCH MACRO FUEL]',
            items: [
              'LEAN MEAT: 160g Herb-Grilled Chicken Breast or steamed Fish Fillet.',
              'MACROS & SIDES: 1.5 cups steamed Basmati/Brown Rice + 1 bowl mixed green sabzi + fresh curd.'
            ]
          },
          {
            title: '[MEAL 4: POST-WORKOUT ANABOLIC RECOVERY (WITHIN 45 MINS)]',
            items: [
              'PROTEIN SURGE: 1 Scoop Whey Protein Isolate in cold water + 3 Boiled Egg Whites.',
              'FAST RECOVERY: 1 Ripe Banana for immediate insulin spike & muscle protein synthesis.'
            ]
          },
          {
            title: '[MEAL 5: DINNER LEAN REPAIR]',
            items: [
              'LEAN SOURCE: 150g Oven-Baked Chicken Tikka or Pan-Seared Salmon/Rohu Fish.',
              'LIGHT DIGESTION: 1 Large bowl clear bone broth / vegetable soup + charred broccoli & zucchini.'
            ]
          }
        ];
      } else {
        // Both / Flexible
        mealList = [
          {
            title: '[MEAL 1: PRE-WORKOUT FUEL (30-45 MINS PRIOR)]',
            items: [
              '[VEG]: 1 Banana with 1 tbsp peanut butter + 5 soaked almonds + 2 dates.',
              '[NON-VEG]: 2 Boiled egg whites + black coffee + 1 whole wheat toast.'
            ]
          },
          {
            title: '[MEAL 2: BREAKFAST POWER MATRIX]',
            items: [
              '[VEG]: 100g Paneer Bhurji with 2 multigrain rotis + 1 cup dahi.',
              '[NON-VEG]: 3 Whole scrambled eggs with spinach & mushrooms + 2 slices brown bread.'
            ]
          },
          {
            title: '[MEAL 3: LUNCH MACRO FUEL]',
            items: [
              '[VEG]: 1.5 cups Brown Rice + 1 bowl Rajma/Dal + 100g Sautéed Tofu + salad.',
              '[NON-VEG]: 2 Phulkas + 150g Grilled Chicken Breast / Fish Curry + green sabzi + curd.'
            ]
          },
          {
            title: '[MEAL 4: POST-WORKOUT ANABOLIC RECOVERY (WITHIN 45 MINS)]',
            items: [
              '[VEG]: 1 Scoop Plant Protein OR 250ml Sattu Buttermilk + 100g boiled sprouted moong.',
              '[NON-VEG]: 1 Scoop Whey Protein in water + 3 boiled egg whites + 1 banana.'
            ]
          },
          {
            title: '[MEAL 5: DINNER LEAN REPAIR]',
            items: [
              '[VEG]: 120g Paneer stir-fry with broccoli + 1 bowl mixed veg soup + 1 small roti.',
              '[NON-VEG]: 150g Grilled Chicken / Fish Tikka with charred veggies + warm clear broth.'
            ]
          }
        ];
      }

      mealList.forEach((m, idx) => {
        const boxH = diet === 'Both / Flexible' ? 24 : 21;
        doc.setFillColor(idx % 2 === 0 ? 250 : 243, idx % 2 === 0 ? 251 : 245, idx % 2 === 0 ? 253 : 248);
        doc.setDrawColor(228, 233, 240);
        doc.roundedRect(14, y, 182, boxH, 2, 2, 'FD');

        doc.setFontSize(8.2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...crimson);
        doc.text(m.title, 18, y + 5);

        let itemY = y + 10;
        m.items.forEach((lineText) => {
          doc.setFontSize(7.3);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          const wrapped = doc.splitTextToSize(lineText, 174);
          doc.text(wrapped, 18, itemY);
          itemY += (wrapped.length * 4.2);
        });

        y += (boxH + 2.5);
      });

      // Hydration Box at bottom of Page 1
      y = Math.min(y + 1, 274);
      doc.setFillColor(238, 242, 255);
      doc.setDrawColor(199, 210, 254);
      doc.roundedRect(14, y, 182, 10, 2, 2, 'FD');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(67, 56, 202);
      doc.text('[HYDRATION TARGET]:', 18, y + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Drink minimum ${waterTarget}. Add electrolyte salts / coconut water during heavy lifting sessions.`, 60, y + 6.5);

      // ==========================================
      // PAGE 2: WORKOUT MATRIX & SAFETY PROTOCOLS
      // ==========================================
      doc.addPage();

      // Page 2 Header
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 210, 22, 'F');
      doc.setFillColor(...crimson);
      doc.rect(0, 22, 210, 1.5, 'F');

      doc.setTextColor(...textLight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('POWERZONE SHIRDI | ATHLETIC TRAINING CURRICULUM', 14, 14);
      doc.setFontSize(8);
      doc.setTextColor(255, 149, 0);
      doc.text(`GOAL: ${goal.toUpperCase()}`, 196, 14, { align: 'right' });

      y = 30;
      doc.setFillColor(...crimson);
      doc.rect(14, y, 3.5, 8, 'F');
      doc.setFontSize(11);
      doc.setTextColor(...textDark);
      doc.setFont('helvetica', 'bold');
      doc.text('2. WEEKLY WORKOUT MATRIX & TRAINING PROGRESSION', 21, y + 6);

      y += 12;

      let workoutSplit = [];
      if (goal.includes('Muscle Building') || goal.includes('Bulk')) {
        workoutSplit = [
          { day: 'MONDAY', focus: 'Push Day: Chest, Front Delts & Triceps', moves: 'Flat Barbell Bench Press (4x8), Incline DB Press (3x10), Overhead Military Press (3x8), Dips (3x12)' },
          { day: 'TUESDAY', focus: 'Pull Day: Back Width, Rear Delts & Biceps', moves: 'Conventional Deadlifts (4x6), Barbell Bent-Over Rows (4x8), Weighted Pull-Ups (3x8), Hammer Curls (3x12)' },
          { day: 'WEDNESDAY', focus: 'Leg Day: Olympic Quads & Hamstrings', moves: 'Barbell Back Squats (4x8), Romanian Deadlifts (3x10), Leg Press (3x12), Standing Calf Raises (4x15)' },
          { day: 'THURSDAY', focus: 'Active Rest & CNS Regeneration', moves: 'Sauna decompression, Deep tissue foam rolling, High protein recovery surplus' },
          { day: 'FRIDAY', focus: 'Upper Body Heavy Progressive Overload', moves: 'Incline Barbell Press (4x8), T-Bar Rows (4x8), DB Lateral Raises (4x15), Cable Tricep Pushdowns (3x12)' },
          { day: 'SATURDAY', focus: 'Lower Body & Explosive Posterior Chain', moves: 'Front Squats (3x8), Barbell Hip Thrusts (4x10), Bulgarian Split Squats (3x10/leg), Hanging Leg Raises' },
          { day: 'SUNDAY', focus: 'Full Physical Reset & Nutrition Prep', moves: 'Complete rest, Sleep optimization, 8-hour regenerative sleep' }
        ];
      } else if (goal.includes('Fat Loss') || goal.includes('Shredding')) {
        workoutSplit = [
          { day: 'MONDAY', focus: 'Metabolic HIIT & SkiErg Sprints', moves: 'SkiErg intervals (10x1min), Kettlebell Swings (4x20), Dumbbell Thrusters (4x12), 20m Prowler Sled Pushes' },
          { day: 'TUESDAY', focus: 'Upper Body Tone & Core Density', moves: 'Incline DB Press (4x10), Lat Pulldowns (4x12), Push-Ups (3xMax), Hanging Knee Raises (4x15), Battle Ropes' },
          { day: 'WEDNESDAY', focus: 'Active Recovery & Joint Mobility', moves: 'Steam suite recovery, Myofascial foam rolling, 45-min brisk incline treadmill walk' },
          { day: 'THURSDAY', focus: 'Lower Body Athletic Conditioning', moves: 'Barbell Goblet Squats (4x12), Romanian Deadlifts (4x12), Walking Lunges (3x20 paces), Box Jumps (3x12)' },
          { day: 'FRIDAY', focus: 'Velocity 30 Express Circuit', moves: 'Turf shuttle sprints, Wall Balls (4x15), Slam Balls (4x15), Rowing Machine 500m repeats' },
          { day: 'SATURDAY', focus: 'Turf Agility & Match Speed', moves: 'Speed ladders, Cone shuttle drills, Rotational medicine ball throws, 3-minute plank series' },
          { day: 'SUNDAY', focus: 'Complete Rest & Decompression', moves: 'Hydration reset, Mobility stretches, Hot/Cold contrast recovery' }
        ];
      } else {
        // General Fitness & Athletic Stamina
        workoutSplit = [
          { day: 'MONDAY', focus: 'Full Body Functional Strength', moves: 'Barbell Squats (3x10), Overhead DB Press (3x10), Lat Pulldowns (3x10), Plank Holds (3x60s)' },
          { day: 'TUESDAY', focus: 'Cardio Intervals & Agility Speed', moves: 'Turf sprint shuttles (8 rounds), SkiErg 500m repeats, Rowing intervals, Box step-ups' },
          { day: 'WEDNESDAY', focus: 'Mobility & Decompression Reset', moves: 'Spine mobility flow, Hip openers, Shoulder dislocations, Steam and sauna recovery' },
          { day: 'THURSDAY', focus: 'Upper Body Athletic Conditioning', moves: 'DB Incline Bench (3x10), Cable Seated Rows (3x12), Face Pulls (3x15), Russian Twists (3x20)' },
          { day: 'FRIDAY', focus: 'Lower Body Power & Kinetic Chain', moves: 'Trap-Bar Deadlifts (3x8), Walking DB Lunges (3x16), Jump Squats (3x12), Calf Raises (3x15)' },
          { day: 'SATURDAY', focus: 'Sports Match / Cricket Conditioning', moves: 'Rotational power throws, Agility footwork, Outdoor match simulation, Dynamic core' },
          { day: 'SUNDAY', focus: 'Rest Day', moves: 'Mindful walks, Light hydration, Recovery nutrition' }
        ];
      }

      workoutSplit.forEach((row, i) => {
        doc.setFillColor(i % 2 === 0 ? 250 : 243, i % 2 === 0 ? 251 : 245, i % 2 === 0 ? 253 : 248);
        doc.setDrawColor(228, 233, 240);
        doc.roundedRect(14, y, 182, 14.5, 2, 2, 'FD');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...crimson);
        doc.text(`${row.day}: ${row.focus}`, 18, y + 4.8);

        doc.setFontSize(7.2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const wrappedMoves = doc.splitTextToSize(`Key Moves: ${row.moves}`, 174);
        doc.text(wrappedMoves, 18, y + 9.5);

        y += 16.5;
      });

      // --- Section 3: Official Gym Guidelines & Safety Policy ---
      y += 3;
      doc.setFillColor(...crimson);
      doc.rect(14, y, 3.5, 8, 'F');
      doc.setFontSize(11);
      doc.setTextColor(...textDark);
      doc.setFont('helvetica', 'bold');
      doc.text('3. OFFICIAL POWERZONE GYM RULES & ETIQUETTE', 21, y + 6);

      y += 12;
      const rules = [
        '[1. CLEAN FOOTWEAR]: Dedicated, clean indoor athletic shoes are mandatory on rubber flooring and turf.',
        '[2. TOWEL REQUIREMENT]: Please carry your personal workout towel and wipe down upholstery after sets.',
        '[3. WEIGHT RE-RACKING]: Always re-rack calibrated dumbbells, Olympic barbells, and plates after training.',
        '[4. BIOMETRIC ACCESS]: Scan your biometric fingerprint / QR pass at the entrance turnstile upon every entry.',
        '[5. NUTRITION & GEAR STORE]: Members receive 20% discount on official cricket gear, lifting belts & accessories.'
      ];

      rules.forEach(rule => {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(rule, 18, y);
        y += 5.5;
      });

      // Footer
      doc.setFontSize(7.2);
      doc.setTextColor(...textMuted);
      doc.text(`Prepared exclusively for ${user.fullName} | PowerZone Shirdi HQ (Nagar-Manmad Hwy) | +91 94222 01823`, 105, 287, { align: 'center' });

      // Save PDF
      const sanitizedName = user.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`PowerZone_Starter_Kit_${sanitizedName}.pdf`);

      if (window.showToast) {
        window.showToast('Starter Kit PDF Ready!', `Downloaded personalized ${diet} ${goal} playbook for ${user.fullName}.`, 'success');
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      if (window.showToast) {
        window.showToast('PDF Generation Error', 'Could not compile PDF document. Please try again.', 'crimson');
      }
    }
  }

  // --- Customer Orders & Passes Dashboard Modal ---
  async openUserOrdersModal() {
    this.closeUserMenu();
    const user = this.getCurrentUser();
    if (!user) {
      this.openAuthModal('login');
      return;
    }

    const modal = document.getElementById('userOrdersModal');
    const content = document.getElementById('userOrdersModalContent');
    if (!modal || !content) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Pull live customer orders from Supabase PostgreSQL Database
    let orders = [];
    let passes = [];
    let bookings = [];

    if (window.PowerZoneDB && typeof window.PowerZoneDB.fetchCustomerOrders === 'function') {
      try {
        orders = await window.PowerZoneDB.fetchCustomerOrders(user.mobile);
      } catch (e) {
        console.error('Error fetching live customer orders from Supabase:', e);
      }
    }

    // Fallback / merge local cache if needed
    if (window.PowerZoneDB && typeof window.PowerZoneDB.getDB === 'function') {
      const db = window.PowerZoneDB.getDB();
      if (orders.length === 0) {
        orders = (db.orders || []).filter(o => 
          (o.phone && o.phone === user.mobile) || 
          (o.customerName && o.customerName.toLowerCase() === user.fullName.toLowerCase())
        );
      }
      passes = (db.passes || []).filter(p => 
        (p.phone && p.phone === user.mobile) || 
        (p.email && p.email.toLowerCase() === (user.email || '').toLowerCase()) || 
        (p.name && p.name.toLowerCase() === user.fullName.toLowerCase())
      );
      bookings = (db.bookings || []).filter(b => 
        (b.phone && b.phone === user.mobile) || 
        (b.email && b.email.toLowerCase() === (user.email || '').toLowerCase()) || 
        (b.name && b.name.toLowerCase() === user.fullName.toLowerCase())
      );
    }

    const currentDiet = user.dietPreference || 'Pure Vegetarian';
    const currentGoal = user.goal || 'Muscle Building / Bulk';

    content.innerHTML = `
      <div class="user-orders-view">
        <!-- Profile Header -->
        <div class="user-profile-header-card">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="user-avatar-badge" style="width: 48px; height: 48px; font-size: 1.5rem;">👤</div>
              <div>
                <h3 style="font-size: 1.35rem; color: var(--text-primary); margin-bottom: 0.2rem;">${user.fullName}</h3>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-muted);">
                  <span>📞 +91 ${user.mobile}</span>
                  <span>✉️ ${user.email}</span>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: 0.4rem; flex-wrap: wrap;">
                  <span class="badge badge-gold">🎯 ${currentGoal}</span>
                  <span class="badge ${currentDiet === 'Pure Vegetarian' ? 'badge-green' : (currentDiet === 'Non-Vegetarian' ? 'badge-crimson' : 'badge-cyan')}">${currentDiet}</span>
                </div>
              </div>
            </div>

            <button class="btn btn-primary btn-sm" onclick="window.pzAuth.downloadStarterKitPDF()">
              📋 Download PDF Plan
            </button>
          </div>
        </div>

        <!-- Prominent Starter Kit Download & Preference Update Card -->
        <div class="starter-kit-card">
          <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.85rem;">
            <div class="starter-kit-icon">🏋️</div>
            <div style="flex-grow: 1;">
              <h4 style="color: var(--text-primary); font-size: 1.05rem; margin-bottom: 0.25rem;">PowerZone Member Starter Kit & Diet Playbook</h4>
              <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
                Personalized for <strong>${user.fullName}</strong> (${currentDiet} • ${currentGoal}). Includes meal-by-meal guide, weekly split & gym safety rules.
              </p>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.pzAuth.downloadStarterKitPDF()">
              ⬇ Download PDF
            </button>
          </div>

          <!-- Quick Preference Switcher -->
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
            <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Switch Protocol:</span>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <select id="dashGoalSelect" class="form-control" style="width: auto; padding: 0.35rem 0.6rem; font-size: 0.78rem;">
                <option value="Muscle Building / Bulk" ${currentGoal === 'Muscle Building / Bulk' ? 'selected' : ''}>Muscle Building / Bulk</option>
                <option value="Fat Loss & Shredding" ${currentGoal === 'Fat Loss & Shredding' ? 'selected' : ''}>Fat Loss & Shredding</option>
                <option value="General Fitness & Athletic Stamina" ${currentGoal === 'General Fitness & Athletic Stamina' ? 'selected' : ''}>General Fitness & Stamina</option>
              </select>
              <select id="dashDietSelect" class="form-control" style="width: auto; padding: 0.35rem 0.6rem; font-size: 0.78rem;">
                <option value="Pure Vegetarian" ${currentDiet === 'Pure Vegetarian' ? 'selected' : ''}>Pure Vegetarian</option>
                <option value="Non-Vegetarian" ${currentDiet === 'Non-Vegetarian' ? 'selected' : ''}>Non-Vegetarian</option>
                <option value="Both / Flexible" ${currentDiet === 'Both / Flexible' ? 'selected' : ''}>Both / Flexible</option>
              </select>
              <button class="btn btn-outline btn-sm" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;" onclick="window.pzAuth.updateUserPreferences(document.getElementById('dashGoalSelect').value, document.getElementById('dashDietSelect').value)">
                Save & Update
              </button>
            </div>
          </div>
        </div>

        <div class="user-orders-tabs">
          <button class="user-orders-tab-btn active" data-tab="userOrdersList" onclick="window.pzAuth.switchUserOrdersTab('userOrdersList')">
            📦 Sports Purchases (${orders.length})
          </button>
          <button class="user-orders-tab-btn" data-tab="userPassesList" onclick="window.pzAuth.switchUserOrdersTab('userPassesList')">
            🎟 VIP Passes (${passes.length})
          </button>
          <button class="user-orders-tab-btn" data-tab="userBookingsList" onclick="window.pzAuth.switchUserOrdersTab('userBookingsList')">
            🏋️ Class Trials (${bookings.length})
          </button>
        </div>

        <!-- Orders Panel with 4-Step Tracker -->
        <div class="user-tab-panel" id="userOrdersList" style="display: block;">
          ${orders.length === 0 ? `
            <div class="admin-empty-state">
              <p>No gear orders placed under <strong>+91 ${user.mobile}</strong> yet.</p>
              <a href="shop.html" class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="window.pzAuth.closeUserOrdersModal()">Explore Sports Gear Store</a>
            </div>
          ` : `
            <div class="user-orders-card-list">
              ${orders.map(ord => {
                const itemsSummary = (ord.items || []).map(i => `${i.name} (x${i.qty || 1})`).join(', ');
                const status = (ord.status || 'Pending').toLowerCase();
                
                // Determine 4-step index (0: Pending, 1: Packed, 2: Dispatched, 3: Delivered)
                let stepIdx = 0;
                if (status === 'packed') stepIdx = 1;
                if (status === 'dispatched' || status === 'confirmed') stepIdx = 2;
                if (status === 'delivered') stepIdx = 3;

                return `
                  <div class="user-order-item-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                      <div>
                        <strong style="color: var(--primary); font-family: var(--font-display); font-size: 1.05rem;">${ord.id}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${ord.timestamp || 'Recent Order'}</div>
                      </div>
                      <span class="badge ${ord.status === 'Delivered' ? 'badge-green' : (ord.status === 'Dispatched' ? 'badge-cyan' : 'badge-crimson')}">
                        ${ord.status || 'Pending'}
                      </span>
                    </div>

                    <!-- 4-Step Visual Order Status Tracker -->
                    <div class="order-tracker-container">
                      <div class="order-tracker-bar">
                        <div class="order-tracker-progress" style="width: ${(stepIdx / 3) * 100}%;"></div>
                        <div class="tracker-step ${stepIdx >= 0 ? 'completed' : ''} ${stepIdx === 0 ? 'current' : ''}">
                          <div class="step-dot">${stepIdx > 0 ? '✓' : '1'}</div>
                          <div class="step-label">Pending</div>
                        </div>
                        <div class="tracker-step ${stepIdx >= 1 ? 'completed' : ''} ${stepIdx === 1 ? 'current' : ''}">
                          <div class="step-dot">${stepIdx > 1 ? '✓' : '2'}</div>
                          <div class="step-label">Packed</div>
                        </div>
                        <div class="tracker-step ${stepIdx >= 2 ? 'completed' : ''} ${stepIdx === 2 ? 'current' : ''}">
                          <div class="step-dot">${stepIdx > 2 ? '✓' : '3'}</div>
                          <div class="step-label">Dispatched</div>
                        </div>
                        <div class="tracker-step ${stepIdx >= 3 ? 'completed' : ''} ${stepIdx === 3 ? 'current' : ''}">
                          <div class="step-dot">${stepIdx >= 3 ? '✓' : '4'}</div>
                          <div class="step-label">Delivered</div>
                        </div>
                      </div>
                    </div>

                    <div style="font-size: 0.88rem; color: var(--text-primary); margin: 0.75rem 0 0.4rem 0;">
                      <strong>Items:</strong> ${itemsSummary}
                    </div>
                    <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.5;">
                      📍 <strong>Delivery Address:</strong> ${ord.address}, ${ord.city} - ${ord.pincode}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                      <span style="font-size: 0.82rem; color: var(--text-muted);">Payment: <strong style="color: var(--text-secondary);">${ord.paymentMethod}</strong></span>
                      <strong style="font-size: 1.15rem; color: var(--primary); font-family: var(--font-display);">₹${Number(ord.totalAmount).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- Passes Panel -->
        <div class="user-tab-panel" id="userPassesList" style="display: none;">
          ${passes.length === 0 ? `
            <div class="admin-empty-state">
              <p>No 1-Day VIP Passes generated for this profile yet.</p>
              <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="window.pzAuth.closeUserOrdersModal(); window.pzModalMgr.openModal('freePassModal');">Claim Free 1-Day Pass</button>
            </div>
          ` : `
            <div class="user-orders-card-list">
              ${passes.map(p => `
                <div class="user-order-item-card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="color: var(--secondary); font-family: var(--font-display);">${p.id}</strong>
                    <span class="badge badge-green">${p.status || 'Active'}</span>
                  </div>
                  <div style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 0.35rem;">
                    📍 <strong>Branch:</strong> ${p.branch}
                  </div>
                  <div style="font-size: 0.85rem; color: var(--primary); font-weight: 600;">
                    🗓 <strong>Entry Workout Date:</strong> ${p.date}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Bookings Panel -->
        <div class="user-tab-panel" id="userBookingsList" style="display: none;">
          ${bookings.length === 0 ? `
            <div class="admin-empty-state">
              <p>No group class trial reservations found.</p>
              <a href="classes.html" class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="window.pzAuth.closeUserOrdersModal()">View Classes Schedule</a>
            </div>
          ` : `
            <div class="user-orders-card-list">
              ${bookings.map(b => `
                <div class="user-order-item-card">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="color: var(--accent-cyan); font-family: var(--font-display);">${b.id}</strong>
                    <span class="badge badge-cyan">${b.status || 'Confirmed'}</span>
                  </div>
                  <h4 style="color: var(--text-primary); margin-bottom: 0.35rem;">${b.className}</h4>
                  <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    Coach: <strong>${b.trainer}</strong> • Slot: <strong>${b.timeSlot}</strong>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  switchUserOrdersTab(tabId) {
    document.querySelectorAll('.user-orders-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.user-tab-panel').forEach(panel => {
      panel.style.display = panel.id === tabId ? 'block' : 'none';
    });
  }

  closeUserOrdersModal() {
    const modal = document.getElementById('userOrdersModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // --- Bind Global DOM Events ---
  bindEvents() {
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('userSessionDropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        this.closeUserMenu();
      }
    });

    document.addEventListener('submit', (e) => {
      if (e.target && e.target.id === 'authLoginForm') {
        e.preventDefault();
        const idInput = document.getElementById('loginIdentifier');
        const passInput = document.getElementById('loginPassword');
        if (idInput && passInput) {
          this.loginUser(idInput.value, passInput.value);
        }
      }

      if (e.target && e.target.id === 'authSignupForm') {
        e.preventDefault();
        const fullName = document.getElementById('regFullName')?.value;
        const mobile = document.getElementById('regMobile')?.value;
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        const goal = document.getElementById('regGoal')?.value;
        const dietPreference = document.getElementById('regDiet')?.value;

        this.registerUser({ fullName, mobile, email, password, goal, dietPreference });
      }
    });

    document.addEventListener('input', (e) => {
      if (e.target && e.target.id === 'regMobile') {
        const val = e.target.value.replace(/\D/g, '');
        const helper = document.getElementById('regMobileHelper');
        if (helper) {
          if (val.length === 0) {
            helper.textContent = 'Enter 10-digit Indian mobile number (e.g. 9876543210)';
            helper.style.color = 'var(--text-muted)';
          } else if (/^[6-9]\d{9}$/.test(val)) {
            helper.textContent = '✓ Valid 10-digit Indian mobile number';
            helper.style.color = 'var(--accent-green)';
          } else {
            helper.textContent = 'Must be 10 digits starting with 6, 7, 8, or 9';
            helper.style.color = 'var(--primary)';
          }
        }
      }
    });
  }
}

// Password Reveal Helper
window.togglePasswordVisibility = function(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (btnEl) btnEl.textContent = '👁️';
  } else {
    input.type = 'password';
    if (btnEl) btnEl.textContent = '👁️‍🗨️';
  }
};

// Global Singleton Instance
window.PowerZoneAuth = new PowerZoneAuthManager();
window.pzAuth = window.PowerZoneAuth;
