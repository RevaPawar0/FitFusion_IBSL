/**
 * POWERZONE : GYM & SPORTS STORE
 * Store Owner Management Portal & CRM Controller
 * Directly queries Supabase PostgreSQL Cloud Database for live orders, status updates, and metrics.
 */

class PowerZonePortalController {
  constructor() {
    this.sessionAuthKey = 'powerzone_portal_unlocked';
    this.orders = [];
    this.leads = [];
    this.passes = [];
    this.bookings = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuth();
  }

  checkAuth() {
    const isAuth = sessionStorage.getItem(this.sessionAuthKey) === 'true';
    const authView = document.getElementById('portalAuthView');
    const dashView = document.getElementById('portalDashboardView');
    const logoutBtn = document.getElementById('portalLogoutBtn');

    if (isAuth) {
      if (authView) authView.style.display = 'none';
      if (dashView) dashView.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
      this.renderDashboard();
    } else {
      if (authView) authView.style.display = 'block';
      if (dashView) dashView.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  }

  login(pinOrEmail, password) {
    const cleanVal = (pinOrEmail || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (cleanVal === '1234' || cleanVal === '9422' || (cleanVal === 'admin@powerzone.in' && (cleanPass === 'admin123' || !cleanPass))) {
      sessionStorage.setItem(this.sessionAuthKey, 'true');
      if (window.showToast) window.showToast('Terminal Unlocked', 'Welcome to PowerZone Operations Portal.', 'success');
      this.checkAuth();
      return true;
    } else {
      if (window.showToast) window.showToast('Access Denied', 'Invalid PIN or credentials. Try PIN 1234 or admin@powerzone.in.', 'crimson');
      return false;
    }
  }

  logout() {
    sessionStorage.removeItem(this.sessionAuthKey);
    if (window.showToast) window.showToast('Signed Out', 'Portal terminal session ended.', 'crimson');
    this.checkAuth();
  }

  switchTab(tabId) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.portal-tab-content').forEach(panel => {
      panel.style.display = panel.id === tabId ? 'block' : 'none';
    });
  }

  async renderDashboard() {
    // 1. Fetch live orders directly from Supabase PostgreSQL Database
    try {
      if (window.PowerZoneDB && typeof window.PowerZoneDB.fetchAllOrders === 'function') {
        this.orders = await window.PowerZoneDB.fetchAllOrders();
        console.log("⚡ Portal: Fetched live Supabase orders count:", this.orders.length);
      }
    } catch (e) {
      console.error('Error fetching Supabase orders in portal:', e);
    }

    // 2. Fetch live leads directly from Supabase
    try {
      if (window.PowerZoneDB && typeof window.PowerZoneDB.fetchAllLeads === 'function') {
        this.leads = await window.PowerZoneDB.fetchAllLeads();
      }
    } catch (e) {
      console.error('Error fetching Supabase leads in portal:', e);
    }

    // 3. Fallback/supplemental local data
    if (window.PowerZoneDB && typeof window.PowerZoneDB.getDB === 'function') {
      const db = window.PowerZoneDB.getDB();
      this.passes = db.passes || [];
      this.bookings = db.bookings || [];
    }

    const orders = this.orders || [];
    const leads = this.leads || [];
    const passes = this.passes || [];
    const bookings = this.bookings || [];

    // Real-Time KPI Metrics Computation from Supabase Data
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, ord) => sum + (Number(ord.price || ord.totalAmount) || 0), 0);
    const pendingOrders = orders.filter(ord => (ord.status || '').toLowerCase() === 'pending').length;
    const totalGymLeads = leads.length + passes.length + bookings.length;

    // Update KPI Card numbers
    const revEl = document.getElementById('kpiRevenue');
    const ordEl = document.getElementById('kpiOrders');
    const pendEl = document.getElementById('kpiPending');
    const leadEl = document.getElementById('kpiLeads');

    if (revEl) revEl.textContent = '₹' + totalRevenue.toLocaleString('en-IN');
    if (ordEl) ordEl.textContent = totalOrders;
    if (pendEl) pendEl.textContent = pendingOrders;
    if (leadEl) leadEl.textContent = totalGymLeads;

    // Update Tab Badge Counts
    const countOrders = document.getElementById('countOrders');
    const countPasses = document.getElementById('countPasses');
    const countTrials = document.getElementById('countTrials');
    const countStock = document.getElementById('countStock');

    if (countOrders) countOrders.textContent = orders.length;
    if (countPasses) countPasses.textContent = passes.length + leads.filter(l => (l.goal || '').includes('Pass')).length;
    if (countTrials) countTrials.textContent = bookings.length + leads.filter(l => !(l.goal || '').includes('Pass')).length;
    if (countStock && typeof POWERZONE_PRODUCTS !== 'undefined') countStock.textContent = POWERZONE_PRODUCTS.length;

    // Render Data Tables
    this.renderOrdersTable(orders);
    this.renderPassesTable(passes, leads);
    this.renderTrialsTable(bookings, leads);
    this.renderStockGrid();
  }

  renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="admin-empty-state">No live customer orders recorded in database yet. Click "+ Quick Demo Order" above to generate one.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(ord => {
      const itemsSummary = ord.item || ord.itemsSummary || (ord.items || []).map(i => `${i.name} (x${i.qty || 1})`).join(', ');
      const totalAmount = Number(ord.price || ord.totalAmount || 0);
      const custName = ord.customer_name || ord.customerName || 'Athlete';
      const waUrl = `https://wa.me/91${ord.phone}?text=${encodeURIComponent(`Hi ${custName}, this is PowerZone Shirdi Store regarding your Order ${ord.id} for ₹${totalAmount}. Current Status: ${ord.status}.`)}`;

      return `
        <tr>
          <td>
            <strong style="color: var(--primary); font-family: var(--font-display);">${ord.id}</strong><br>
            <span style="font-size: 0.72rem; color: var(--text-muted);">${ord.timestamp || 'Recent'}</span>
          </td>
          <td>
            <strong>${custName}</strong><br>
            <a href="${waUrl}" target="_blank" rel="noopener" style="font-size: 0.78rem; color: var(--accent-whatsapp); font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem;">
              💬 +91 ${ord.phone}
            </a>
          </td>
          <td>
            ${ord.address || 'Nagar-Manmad Road'}<br>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${ord.city || 'Shirdi'} - ${ord.pincode || '423109'}</span>
          </td>
          <td>
            <div style="max-width: 200px; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemsSummary}">${itemsSummary}</div>
            <strong style="color: var(--text-primary); font-size: 0.95rem;">₹${totalAmount.toLocaleString('en-IN')}</strong>
          </td>
          <td><span class="badge ${(ord.payment_method || ord.paymentMethod || '').includes('UPI') ? 'badge-gold' : 'badge-cyan'}">${ord.payment_method || ord.paymentMethod || 'COD'}</span></td>
          <td>
            <select class="admin-status-select" onchange="window.pzPortal.updateOrderStatus('${ord.id}', this.value)">
              <option value="Pending" ${ord.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Packed" ${ord.status === 'Packed' ? 'selected' : ''}>Packed</option>
              <option value="Dispatched" ${ord.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
              <option value="Delivered" ${ord.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${ord.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <button class="btn-delete-row" title="Delete Order" onclick="window.pzPortal.deleteRecord('orders', '${ord.id}')">🗑</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderPassesTable(passes, leads = []) {
    const tbody = document.getElementById('passesTableBody');
    if (!tbody) return;

    const passLeads = (leads || []).filter(l => (l.goal || '').includes('Pass') || (l.id || '').includes('PASS'));
    const combined = [...passes];

    passLeads.forEach(l => {
      if (!combined.some(p => p.id === l.id)) {
        combined.unshift({
          id: l.id,
          name: l.name,
          phone: l.phone,
          email: 'athlete@powerzone.in',
          branch: l.preferred_slot || 'Shirdi Central',
          date: 'Scheduled',
          status: 'Active'
        });
      }
    });

    if (combined.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="admin-empty-state">No VIP Gym passes recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = combined.map(p => {
      const waUrl = `https://wa.me/91${p.phone}?text=${encodeURIComponent(`Hi ${p.name}, welcome to PowerZone Shirdi! Your 1-Day VIP Pass ${p.id} is confirmed.`)}`;
      return `
        <tr>
          <td><strong style="color: var(--secondary); font-family: var(--font-display);">${p.id}</strong></td>
          <td><strong>${p.name}</strong></td>
          <td>
            ${p.email || 'N/A'}<br>
            <a href="${waUrl}" target="_blank" rel="noopener" style="font-size: 0.78rem; color: var(--accent-whatsapp); font-weight: 700;">
              💬 +91 ${p.phone || 'N/A'}
            </a>
          </td>
          <td><span style="font-size: 0.8rem;">${p.branch}</span></td>
          <td><span class="badge badge-gold">${p.date}</span></td>
          <td>
            <select class="admin-status-select" onchange="window.pzPortal.updateStatus('passes', '${p.id}', this.value)">
              <option value="Active" ${p.status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Redeemed" ${p.status === 'Redeemed' ? 'selected' : ''}>Redeemed</option>
              <option value="Expired" ${p.status === 'Expired' ? 'selected' : ''}>Expired</option>
            </select>
          </td>
          <td>
            <button class="btn-delete-row" onclick="window.pzPortal.deleteRecord('passes', '${p.id}')">🗑</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderTrialsTable(trials, leads = []) {
    const tbody = document.getElementById('trialsTableBody');
    if (!tbody) return;

    const trialLeads = (leads || []).filter(l => !(l.goal || '').includes('Pass') && !(l.id || '').includes('PASS'));
    const combined = [...trials];

    trialLeads.forEach(l => {
      if (!combined.some(t => t.id === l.id)) {
        combined.unshift({
          id: l.id,
          name: l.name,
          phone: l.phone,
          email: 'athlete@powerzone.in',
          className: l.goal || 'Burn & Build',
          trainer: 'Head Coach',
          timeSlot: l.preferred_slot || 'Morning (06:00 AM)',
          status: 'Confirmed'
        });
      }
    });

    if (combined.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="admin-empty-state">No class trial bookings recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = combined.map(t => {
      const waUrl = `https://wa.me/91${t.phone}?text=${encodeURIComponent(`Hi ${t.name}, this is PowerZone Coaching HQ regarding your trial slot for ${t.className}.`)}`;
      return `
        <tr>
          <td><strong style="color: var(--accent-cyan); font-family: var(--font-display);">${t.id}</strong></td>
          <td><strong>${t.name}</strong></td>
          <td>
            ${t.email || 'N/A'}<br>
            <a href="${waUrl}" target="_blank" rel="noopener" style="font-size: 0.78rem; color: var(--accent-whatsapp); font-weight: 700;">
              💬 +91 ${t.phone || 'N/A'}
            </a>
          </td>
          <td><span class="badge badge-crimson">${t.className}</span></td>
          <td>${t.trainer}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${t.timeSlot}</span></td>
          <td>
            <select class="admin-status-select" onchange="window.pzPortal.updateStatus('bookings', '${t.id}', this.value)">
              <option value="Pending" ${t.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Confirmed" ${t.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Attended" ${t.status === 'Attended' ? 'selected' : ''}>Attended</option>
              <option value="Cancelled" ${t.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <button class="btn-delete-row" onclick="window.pzPortal.deleteRecord('bookings', '${t.id}')">🗑</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderStockGrid() {
    const grid = document.getElementById('stockGridContainer');
    if (!grid || typeof POWERZONE_PRODUCTS === 'undefined') return;

    const stockOverrides = JSON.parse(localStorage.getItem('powerzone_stock_status_v1') || '{}');

    grid.innerHTML = POWERZONE_PRODUCTS.map(prod => {
      const isOut = stockOverrides[prod.id] === 'out';
      return `
        <div class="stock-card">
          <img src="${prod.image}" alt="${prod.name}" class="stock-card-img" style="${isOut ? 'filter: grayscale(80%); opacity: 0.6;' : ''}">
          <div style="flex-grow: 1;">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">${prod.category}</div>
            <h4 style="font-size: 0.92rem; color: var(--text-primary); margin-bottom: 0.25rem;">${prod.name}</h4>
            <div style="font-size: 0.88rem; font-weight: 700; color: var(--primary);">₹${prod.price.toLocaleString('en-IN')}</div>
          </div>
          <button class="stock-toggle-btn ${isOut ? 'out-stock' : 'in-stock'}" onclick="window.pzPortal.toggleProductStock('${prod.id}')">
            ${isOut ? '✕ Out of Stock' : '✓ In Stock'}
          </button>
        </div>
      `;
    }).join('');
  }

  toggleProductStock(productId) {
    const stockOverrides = JSON.parse(localStorage.getItem('powerzone_stock_status_v1') || '{}');
    const currentState = stockOverrides[productId] === 'out';
    stockOverrides[productId] = currentState ? 'in' : 'out';
    localStorage.setItem('powerzone_stock_status_v1', JSON.stringify(stockOverrides));

    if (window.showToast) {
      window.showToast('Stock Updated', `${productId} is now ${stockOverrides[productId] === 'out' ? 'Out of Stock' : 'In Stock'}.`, 'success');
    }
    this.renderStockGrid();
  }

  async updateOrderStatus(orderId, newStatus) {
    if (window.PowerZoneDB && typeof window.PowerZoneDB.updateOrderStatus === 'function') {
      await window.PowerZoneDB.updateOrderStatus(orderId, newStatus);
    } else if (window.PowerZoneDB && typeof window.PowerZoneDB.updateStatus === 'function') {
      window.PowerZoneDB.updateStatus('orders', orderId, newStatus);
    }

    if (window.showToast) {
      window.showToast('Dispatch Updated', `Order ${orderId} marked as ${newStatus} in Supabase database.`, 'success');
    }
    this.renderDashboard();
  }

  updateStatus(table, id, newStatus) {
    if (window.PowerZoneDB && typeof window.PowerZoneDB.updateStatus === 'function') {
      window.PowerZoneDB.updateStatus(table, id, newStatus);
    }
    if (window.showToast) {
      window.showToast('Status Updated', `${id} marked as ${newStatus}.`, 'success');
    }
    this.renderDashboard();
  }

  async deleteRecord(table, id) {
    if (confirm(`Permanently delete record ${id} from database?`)) {
      if (table === 'orders') {
        if (window.PowerZoneDB && typeof window.PowerZoneDB.deleteOrder === 'function') {
          await window.PowerZoneDB.deleteOrder(id);
        } else if (window.PowerZoneDB && typeof window.PowerZoneDB.delete === 'function') {
          window.PowerZoneDB.delete(table, id);
        }
      } else {
        if (window.PowerZoneDB && typeof window.PowerZoneDB.delete === 'function') {
          window.PowerZoneDB.delete(table, id);
        }
      }

      if (window.showToast) {
        window.showToast('Record Deleted', `Record ${id} removed from database.`, 'crimson');
      }
      this.renderDashboard();
    }
  }

  async addDemoOrder() {
    const names = ['Kavita Shinde', 'Mahesh Kadam', 'Swapnil Deshmukh', 'Pooja Borawake', 'Sanjay Jadhav', 'Rahul Gunjal', 'Priya Deshmukh'];
    const cities = ['Shirdi', 'Kopargaon', 'Rahata', 'Sainagar', 'Sangamner'];
    const itemsList = [
      'Grade 1 Kashmir Willow Cricket Bat (Full Size) (x1)',
      'Pro Turf Studs / Football Shoes (x1)',
      '10mm Heavy Duty Leather Powerlifting Lever Belt (x1)',
      'Commercial Hex Rubber Dumbbells Pair (15kg x 2) (x1)',
      'Pro Carbon Graphite Badminton Rackets Set (Pack of 2) (x1)'
    ];
    const prices = [2899, 2499, 2199, 3499, 1899];

    const randomIdx = Math.floor(Math.random() * names.length);
    const randomItemIdx = Math.floor(Math.random() * itemsList.length);
    const randomName = names[randomIdx];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomItem = itemsList[randomItemIdx];
    const randomPrice = prices[randomItemIdx];

    const orderPayload = {
      id: 'PZ-ORD-' + Math.floor(10000 + Math.random() * 90000),
      customer_name: randomName,
      phone: '98' + Math.floor(10000000 + Math.random() * 90000000),
      city: randomCity,
      address: 'Main Market Road, ' + randomCity,
      pincode: '423109',
      item: randomItem,
      price: randomPrice,
      payment_method: 'Cash on Delivery (COD)',
      status: 'Pending'
    };

    if (window.PowerZoneDB && typeof window.PowerZoneDB.createOrder === 'function') {
      await window.PowerZoneDB.createOrder(orderPayload);
    } else if (window.PowerZoneDB && typeof window.PowerZoneDB.insert === 'function') {
      window.PowerZoneDB.insert('orders', orderPayload);
    }

    if (window.showToast) {
      window.showToast('Demo Order Logged', `Generated new sample order for ${randomName} in Supabase!`, 'success');
    }
    this.renderDashboard();
  }

  bindEvents() {
    const form = document.getElementById('portalLoginForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = document.getElementById('portalPin').value;
        const pass = document.getElementById('portalPassword').value;
        this.login(pin, pass);
      });
    }
  }
}

window.pzPortal = new PowerZonePortalController();
