/**
 * POWERZONE : GYM & SPORTS STORE
 * Persistent Database & Admin Management Layer (localStorage CRUD)
 */

class PowerZoneDatabase {
  constructor() {
    this.storageKey = 'powerzone_db_v1';
    this.init();
  }

  init() {
    const existing = localStorage.getItem(this.storageKey);
    if (!existing) {
      this.seedInitialData();
    }
  }

  seedInitialData() {
    const seedData = {
      orders: [
        {
          id: 'PZ-ORD-10492',
          customerName: 'Rahul Gunjal',
          phone: '9876543210',
          city: 'Shirdi',
          address: 'Nagar-Manmad Highway, Near Sai Ashram',
          pincode: '423109',
          items: [
            { id: 'pz-2', name: 'Grade 1 Kashmir Willow Cricket Bat', price: 2899, qty: 1 }
          ],
          totalAmount: 2899,
          paymentMethod: 'Cash on Delivery (COD)',
          status: 'Confirmed',
          timestamp: '2026-08-22 10:15 AM'
        },
        {
          id: 'PZ-ORD-10493',
          customerName: 'Priya Deshmukh',
          phone: '9822018234',
          city: 'Kopargaon',
          address: 'Station Road, Opp. Sports Complex',
          pincode: '423601',
          items: [
            { id: 'pz-6', name: 'Latex Resistance Loop Bands (Set of 5)', price: 799, qty: 1 },
            { id: 'pz-3', name: 'PowerZone Tournament Champions Trophy', price: 1499, qty: 2 }
          ],
          totalAmount: 3797,
          paymentMethod: 'Instant UPI',
          status: 'Delivered',
          timestamp: '2026-08-22 11:30 AM'
        },
        {
          id: 'PZ-ORD-10494',
          customerName: 'Amit Shelke',
          phone: '9422201823',
          city: 'Shirdi',
          address: 'Pimpalwadi Road, Shirdi Central',
          pincode: '423109',
          items: [
            { id: 'pz-4', name: '10mm Heavy Duty Leather Powerlifting Belt', price: 2199, qty: 1 }
          ],
          totalAmount: 2199,
          paymentMethod: 'Cash on Delivery (COD)',
          status: 'Pending',
          timestamp: '2026-08-22 01:45 PM'
        }
      ],
      passes: [
        {
          id: 'PZ-PASS-88412',
          name: 'Vikram Joshi',
          email: 'vikram.joshi@gmail.com',
          phone: '9860123456',
          branch: 'PowerZone Shirdi Central (Nagar-Manmad Hwy)',
          date: '2026-08-22',
          status: 'Active',
          timestamp: '2026-08-22 08:30 AM'
        },
        {
          id: 'PZ-PASS-88413',
          name: 'Snehal Patil',
          email: 'snehal.patil@outlook.com',
          phone: '9890987654',
          branch: 'PowerZone Kopargaon Sports Arena',
          date: '2026-08-23',
          status: 'Active',
          timestamp: '2026-08-22 09:15 AM'
        }
      ],
      bookings: [
        {
          id: 'PZ-TRL-33201',
          name: 'Sachin Tambe',
          email: 'sachin.tambe@gmail.com',
          phone: '9850112233',
          className: 'Iron & Alloy',
          trainer: 'Rohit Shinde (State Powerlifting)',
          timeSlot: '06:00 AM (Morning)',
          status: 'Confirmed',
          timestamp: '2026-08-22 07:00 AM'
        },
        {
          id: 'PZ-TRL-33202',
          name: 'Aniket Shinde',
          email: 'aniket.shinde@yahoo.com',
          phone: '9765432109',
          className: 'Velocity 30',
          trainer: 'Anjali Deshmukh (Agility Specialist)',
          timeSlot: '05:30 PM (Evening)',
          status: 'Pending',
          timestamp: '2026-08-22 12:20 PM'
        }
      ]
    };
    this.saveDB(seedData);
  }

  getDB() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : { orders: [], passes: [], bookings: [] };
    } catch (e) {
      console.error('Error parsing PowerZone DB:', e);
      return { orders: [], passes: [], bookings: [] };
    }
  }

  saveDB(db) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(db));
    } catch (e) {
      console.error('Error saving PowerZone DB:', e);
    }
  }

  // --- CRUD Operations ---
  selectAll(table) {
    const db = this.getDB();
    return db[table] || [];
  }

  selectById(table, id) {
    const db = this.getDB();
    const rows = db[table] || [];
    return rows.find(r => r.id === id) || null;
  }

  insert(table, record) {
    const db = this.getDB();
    if (!db[table]) db[table] = [];

    // Auto-generate ID if missing
    if (!record.id) {
      const prefix = table === 'orders' ? 'PZ-ORD-' : (table === 'passes' ? 'PZ-PASS-' : 'PZ-TRL-');
      record.id = prefix + Math.floor(10000 + Math.random() * 90000);
    }

    if (!record.timestamp) {
      const now = new Date();
      record.timestamp = now.toLocaleDateString('en-IN') + ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }

    if (!record.status) {
      record.status = table === 'orders' ? 'Pending' : 'Confirmed';
    }

    db[table].unshift(record);
    this.saveDB(db);
    return record;
  }

  updateStatus(table, id, newStatus) {
    const db = this.getDB();
    const rows = db[table] || [];
    const index = rows.findIndex(r => r.id === id);
    if (index !== -1) {
      rows[index].status = newStatus;
      this.saveDB(db);
      return rows[index];
    }
    return null;
  }

  delete(table, id) {
    const db = this.getDB();
    if (db[table]) {
      db[table] = db[table].filter(r => r.id !== id);
      this.saveDB(db);
      return true;
    }
    return false;
  }

  // --- Metrics Aggregator ---
  getMetrics() {
    const db = this.getDB();
    const orders = db.orders || [];
    const passes = db.passes || [];
    const bookings = db.bookings || [];

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, ord) => sum + (Number(ord.totalAmount) || 0), 0);
    const pendingOrders = orders.filter(ord => ord.status === 'Pending').length;
    const confirmedOrders = orders.filter(ord => ord.status === 'Confirmed' || ord.status === 'Delivered').length;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      confirmedOrders,
      totalPasses: passes.length,
      totalBookings: bookings.length
    };
  }

  // --- Admin Dashboard Terminal Modal Controller ---
  openAdminTerminal() {
    let modal = document.getElementById('adminTerminalModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'adminTerminalModal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-box admin-modal-box">
          <button class="modal-close-icon" onclick="window.PowerZoneDB.closeAdminTerminal()">✕</button>
          
          <div class="admin-header-strip">
            <div>
              <div class="radar-beacon-pill" style="margin-bottom: 0.35rem;">
                <span class="radar-ping-dot"></span>
                <span>ADMIN LIVE TERMINAL</span>
              </div>
              <h2 style="font-size: 1.5rem; color: var(--text-primary);">PowerZone Management & Database Hub</h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Real-time persistent CRUD database, order processing, and Shirdi gym analytics.</p>
            </div>

            <div class="admin-top-actions">
              <button class="btn btn-secondary btn-sm" onclick="window.PowerZoneDB.addDemoOrder()">+ Quick Demo Order</button>
              <button class="btn btn-outline btn-sm" onclick="window.PowerZoneDB.exportDatabaseJSON()">⬇ Export JSON</button>
            </div>
          </div>

          <!-- Active Metrics Grid -->
          <div class="admin-metrics-grid" id="adminMetricsGrid"></div>

          <!-- Table Tabs -->
          <div class="admin-tab-bar">
            <button class="admin-tab-btn active" data-table="orders" onclick="window.PowerZoneDB.switchAdminTab('orders')">
              📦 Orders & COD Dispatch (<span id="tabCountOrders">0</span>)
            </button>
            <button class="admin-tab-btn" data-table="passes" onclick="window.PowerZoneDB.switchAdminTab('passes')">
              🎟 VIP Gym Passes (<span id="tabCountPasses">0</span>)
            </button>
            <button class="admin-tab-btn" data-table="bookings" onclick="window.PowerZoneDB.switchAdminTab('bookings')">
              🏋️ Trial Class Bookings (<span id="tabCountBookings">0</span>)
            </button>
          </div>

          <!-- Active Records Table Container -->
          <div class="admin-table-wrapper" id="adminTableWrapper"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    this.renderAdminView('orders');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeAdminTerminal() {
    const modal = document.getElementById('adminTerminalModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  switchAdminTab(table) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-table') === table);
    });
    this.renderAdminView(table);
  }

  renderAdminView(activeTable = 'orders') {
    const metrics = this.getMetrics();
    const db = this.getDB();

    // Update Metrics
    const metricsGrid = document.getElementById('adminMetricsGrid');
    if (metricsGrid) {
      metricsGrid.innerHTML = `
        <div class="admin-metric-card">
          <div class="metric-num">₹${metrics.totalRevenue.toLocaleString('en-IN')}</div>
          <div class="metric-lbl">Total Store Revenue</div>
        </div>
        <div class="admin-metric-card">
          <div class="metric-num">${metrics.totalOrders}</div>
          <div class="metric-lbl">Total Orders Logged</div>
        </div>
        <div class="admin-metric-card">
          <div class="metric-num" style="color: ${metrics.pendingOrders > 0 ? 'var(--primary)' : 'var(--accent-green)'};">${metrics.pendingOrders}</div>
          <div class="metric-lbl">Pending COD Dispatches</div>
        </div>
        <div class="admin-metric-card">
          <div class="metric-num" style="color: var(--secondary);">${metrics.totalPasses + metrics.totalBookings}</div>
          <div class="metric-lbl">Passes & Trial Slots</div>
        </div>
      `;
    }

    // Update Tab Counts
    const ordersCountEl = document.getElementById('tabCountOrders');
    const passesCountEl = document.getElementById('tabCountPasses');
    const bookingsCountEl = document.getElementById('tabCountBookings');
    if (ordersCountEl) ordersCountEl.textContent = db.orders.length;
    if (passesCountEl) passesCountEl.textContent = db.passes.length;
    if (bookingsCountEl) bookingsCountEl.textContent = db.bookings.length;

    // Render Table Content
    const wrapper = document.getElementById('adminTableWrapper');
    if (!wrapper) return;

    if (activeTable === 'orders') {
      const orders = db.orders || [];
      if (orders.length === 0) {
        wrapper.innerHTML = `<div class="admin-empty-state">No customer orders recorded yet.</div>`;
        return;
      }

      wrapper.innerHTML = `
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer & Phone</th>
              <th>Destination (City & PIN)</th>
              <th>Items & Amount</th>
              <th>Payment</th>
              <th>Live Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(ord => {
              const statusClass = ord.status === 'Delivered' 
                ? 'badge-green' 
                : (ord.status === 'Confirmed' ? 'badge-cyan' : (ord.status === 'Cancelled' ? 'badge-muted' : 'badge-crimson'));
              
              const itemsSummary = (ord.items || []).map(i => `${i.name} (x${i.qty || 1})`).join(', ');

              return `
                <tr>
                  <td><strong style="color: var(--primary); font-family: var(--font-display);">${ord.id}</strong><br><span style="font-size: 0.72rem; color: var(--text-muted);">${ord.timestamp}</span></td>
                  <td><strong>${ord.customerName}</strong><br><a href="https://wa.me/91${ord.phone}" target="_blank" style="font-size: 0.78rem; color: var(--accent-green); font-weight: 600;">💬 +91 ${ord.phone}</a></td>
                  <td>${ord.address}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${ord.city} - ${ord.pincode}</span></td>
                  <td><div style="max-width: 220px; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemsSummary}">${itemsSummary}</div><strong style="color: var(--text-primary); font-size: 0.95rem;">₹${Number(ord.totalAmount).toLocaleString('en-IN')}</strong></td>
                  <td><span class="badge ${ord.paymentMethod.includes('UPI') ? 'badge-gold' : 'badge-cyan'}">${ord.paymentMethod}</span></td>
                  <td>
                    <select class="admin-status-select" onchange="window.PowerZoneDB.handleStatusChange('orders', '${ord.id}', this.value)">
                      <option value="Pending" ${ord.status === 'Pending' ? 'selected' : ''}>Pending</option>
                      <option value="Confirmed" ${ord.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                      <option value="Delivered" ${ord.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                      <option value="Cancelled" ${ord.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button class="btn-delete-row" title="Delete Record" onclick="window.PowerZoneDB.handleDelete('orders', '${ord.id}')">🗑</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTable === 'passes') {
      const passes = db.passes || [];
      if (passes.length === 0) {
        wrapper.innerHTML = `<div class="admin-empty-state">No VIP Gym Passes logged yet.</div>`;
        return;
      }

      wrapper.innerHTML = `
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Pass ID</th>
              <th>Athlete Name</th>
              <th>Contact Info</th>
              <th>Selected Branch</th>
              <th>Workout Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${passes.map(p => `
              <tr>
                <td><strong style="color: var(--secondary); font-family: var(--font-display);">${p.id}</strong><br><span style="font-size: 0.72rem; color: var(--text-muted);">${p.timestamp}</span></td>
                <td><strong>${p.name}</strong></td>
                <td>${p.email}<br><a href="https://wa.me/91${p.phone}" target="_blank" style="font-size: 0.78rem; color: var(--accent-green);">💬 +91 ${p.phone || 'N/A'}</a></td>
                <td><span style="font-size: 0.8rem;">${p.branch}</span></td>
                <td><span class="badge badge-gold">${p.date}</span></td>
                <td>
                  <select class="admin-status-select" onchange="window.PowerZoneDB.handleStatusChange('passes', '${p.id}', this.value)">
                    <option value="Active" ${p.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Redeemed" ${p.status === 'Redeemed' ? 'selected' : ''}>Redeemed</option>
                    <option value="Expired" ${p.status === 'Expired' ? 'selected' : ''}>Expired</option>
                  </select>
                </td>
                <td>
                  <button class="btn-delete-row" title="Delete Pass" onclick="window.PowerZoneDB.handleDelete('passes', '${p.id}')">🗑</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTable === 'bookings') {
      const bookings = db.bookings || [];
      if (bookings.length === 0) {
        wrapper.innerHTML = `<div class="admin-empty-state">No trial bookings logged yet.</div>`;
        return;
      }

      wrapper.innerHTML = `
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Client Name</th>
              <th>Contact</th>
              <th>Class Discipline</th>
              <th>Coach & Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${bookings.map(b => `
              <tr>
                <td><strong style="color: var(--accent-cyan); font-family: var(--font-display);">${b.id}</strong><br><span style="font-size: 0.72rem; color: var(--text-muted);">${b.timestamp}</span></td>
                <td><strong>${b.name}</strong></td>
                <td>${b.email}<br><a href="https://wa.me/91${b.phone}" target="_blank" style="font-size: 0.78rem; color: var(--accent-green);">💬 +91 ${b.phone || 'N/A'}</a></td>
                <td><span class="badge badge-crimson">${b.className}</span></td>
                <td>${b.trainer}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${b.timeSlot}</span></td>
                <td>
                  <select class="admin-status-select" onchange="window.PowerZoneDB.handleStatusChange('bookings', '${b.id}', this.value)">
                    <option value="Pending" ${b.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="Attended" ${b.status === 'Attended' ? 'selected' : ''}>Attended</option>
                    <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                  </select>
                </td>
                <td>
                  <button class="btn-delete-row" title="Delete Booking" onclick="window.PowerZoneDB.handleDelete('bookings', '${b.id}')">🗑</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }

  handleStatusChange(table, id, newStatus) {
    this.updateStatus(table, id, newStatus);
    if (window.showToast) {
      window.showToast('Status Updated', `${id} status changed to ${newStatus}.`, 'success');
    }
    this.renderAdminView(table);
  }

  handleDelete(table, id) {
    if (confirm(`Are you sure you want to permanently delete record ${id}?`)) {
      this.delete(table, id);
      if (window.showToast) {
        window.showToast('Record Deleted', `Record ${id} removed from database.`, 'crimson');
      }
      this.renderAdminView(table);
    }
  }

  addDemoOrder() {
    const names = ['Kavita Shinde', 'Mahesh Kadam', 'Swapnil Deshmukh', 'Pooja Borawake'];
    const cities = ['Shirdi', 'Kopargaon', 'Rahata', 'Sainagar'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];

    this.insert('orders', {
      customerName: randomName,
      phone: '98' + Math.floor(10000000 + Math.random() * 90000000),
      city: randomCity,
      address: 'Main Market Road, ' + randomCity,
      pincode: '423109',
      items: [
        { id: 'pz-1', name: 'PowerZone Rubber Hex Dumbbells (Pair)', price: 3499, qty: 1 }
      ],
      totalAmount: 3499,
      paymentMethod: 'Cash on Delivery (COD)',
      status: 'Pending'
    });

    if (window.showToast) {
      window.showToast('Demo Order Logged', `Generated new sample order for ${randomName}.`, 'success');
    }
    this.renderAdminView('orders');
  }

  exportDatabaseJSON() {
    const db = this.getDB();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `powerzone_database_${Date.now()}.json`);
    dlAnchorElem.click();

    if (window.showToast) {
      window.showToast('Export Complete', 'PowerZone database downloaded as JSON.', 'success');
    }
  }
}

// Local Database Backup Instance
window.PowerZoneLocalDB = new PowerZoneDatabase();
if (!window.PowerZoneDB) {
  window.PowerZoneDB = window.PowerZoneLocalDB;
  window.pzDB = window.PowerZoneDB;
}
