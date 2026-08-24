/**
 * POWERZONE : GYM & SPORTS STORE
 * Live Supabase PostgreSQL Database Integration Client
 * Regional Hub: Shirdi (Nagar-Manmad Highway), Maharashtra
 */

const SUPABASE_URL = "https://clcmpfzzhmrnqoydnwoi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsY21wZnp6aG1ybnFveWRud29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0OTgxNTUsImV4cCI6MjEwMzA3NDE1NX0.dbJpi4KATdWc3jDElwg45vL6n8QR-abDbfvPLL6tqYM";

class SupabaseService {
  constructor() {
    this.url = SUPABASE_URL;
    this.key = SUPABASE_ANON_KEY;
    this.client = null;
    this.init();
  }

  init() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      this.client = window.supabase.createClient(this.url, this.key);
      console.log('⚡ PowerZone: Supabase JS SDK v2 client initialized successfully.');
    } else {
      console.warn('⚠️ Supabase JS SDK not yet loaded in window. SupabaseService will use REST fallback if needed.');
    }
  }

  getClient() {
    if (!this.client && window.supabase && typeof window.supabase.createClient === 'function') {
      this.client = window.supabase.createClient(this.url, this.key);
    }
    return this.client;
  }

  // REST API Direct Fallback Executor
  async restRequest(endpoint, options = {}) {
    const headers = {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...(options.headers || {})
    };

    const res = await fetch(`${this.url}/rest/v1/${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Supabase REST Error (${res.status}): ${errorText}`);
    }

    if (res.status === 204) return null;
    return await res.json();
  }

  /**
   * 1. CREATE ORDER: Inserts a record into the 'orders' table
   * @param {Object} orderData 
   * @returns {Promise<Object>} The created order record
   */
  async createOrder(orderData) {
    try {
      const orderId = orderData.id || ('PZ-ORD-' + Math.floor(10000 + Math.random() * 90000));
      const customerName = (orderData.customer_name || orderData.customerName || orderData.name || 'Valued Athlete').trim();
      const phone = (orderData.phone || orderData.mobile || '').trim().replace(/\D/g, '');
      const city = (orderData.city || 'Shirdi').trim();
      const address = (orderData.address || 'Nagar-Manmad Road').trim();
      const pincode = (orderData.pincode || '423109').trim();
      
      // Normalize item description string
      let itemSummary = '';
      if (typeof orderData.item === 'string' && orderData.item.length > 0) {
        itemSummary = orderData.item;
      } else if (Array.isArray(orderData.items) && orderData.items.length > 0) {
        itemSummary = orderData.items.map(i => `${i.name} (x${i.qty || 1})`).join(', ');
      } else if (orderData.itemsSummary) {
        itemSummary = orderData.itemsSummary;
      } else {
        itemSummary = 'PowerZone Sports Gear';
      }

      const price = Number(orderData.price || orderData.totalAmount || orderData.total || 0);
      const paymentMethod = orderData.payment_method || orderData.paymentMethod || 'Cash on Delivery (COD)';
      const status = orderData.status || 'Pending';

      const payload = {
        id: orderId,
        customer_name: customerName,
        phone: phone,
        city: city,
        address: address,
        pincode: pincode,
        item: itemSummary,
        price: price,
        payment_method: paymentMethod,
        status: status
      };

      const client = this.getClient();
      let result;
      if (client) {
        const { data, error } = await client
          .from('orders')
          .insert([payload])
          .select();

        if (error) throw error;
        result = data && data[0] ? data[0] : payload;
      } else {
        const data = await this.restRequest('orders', {
          method: 'POST',
          body: payload
        });
        result = Array.isArray(data) && data[0] ? data[0] : payload;
      }

      // Also sync to local storage cache for instant offline responsiveness
      this.syncLocalOrderCache(result, 'insert');

      console.log('✅ Supabase: Order created successfully:', result.id);
      return this.formatOrder(result);
    } catch (err) {
      console.error('❌ Supabase createOrder failed:', err);
      // Fallback: local storage insertion
      const localBackup = {
        id: orderData.id || ('PZ-ORD-' + Math.floor(10000 + Math.random() * 90000)),
        customer_name: orderData.customerName || orderData.customer_name || 'Customer',
        phone: orderData.phone || '9876543210',
        city: orderData.city || 'Shirdi',
        address: orderData.address || '',
        pincode: orderData.pincode || '423109',
        item: typeof orderData.item === 'string' ? orderData.item : (Array.isArray(orderData.items) ? orderData.items.map(i => `${i.name} (x${i.qty || 1})`).join(', ') : 'Sports Gear'),
        price: Number(orderData.price || orderData.totalAmount || 0),
        payment_method: orderData.paymentMethod || 'Cash on Delivery (COD)',
        status: 'Pending',
        created_at: new Date().toISOString()
      };
      this.syncLocalOrderCache(localBackup, 'insert');
      return this.formatOrder(localBackup);
    }
  }

  /**
   * 2. FETCH ALL ORDERS: Retrieves all records from 'orders' ordered by created_at DESC
   * @returns {Promise<Array>} List of orders
   */
  async fetchAllOrders() {
    try {
      const client = this.getClient();
      let records = [];

      if (client) {
        const { data, error } = await client
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        records = data || [];
      } else {
        records = await this.restRequest('orders?order=created_at.desc') || [];
      }

      // Cache live records locally
      localStorage.setItem('powerzone_supabase_orders_cache', JSON.stringify(records));
      return records.map(r => this.formatOrder(r));
    } catch (err) {
      console.error('❌ Supabase fetchAllOrders failed, using local cache:', err);
      const cached = localStorage.getItem('powerzone_supabase_orders_cache');
      if (cached) {
        try {
          return JSON.parse(cached).map(r => this.formatOrder(r));
        } catch (e) {}
      }
      return [];
    }
  }

  /**
   * 3. UPDATE ORDER STATUS: Updates the status column of a specific order
   * @param {string} orderId 
   * @param {string} newStatus 
   * @returns {Promise<Object>}
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      const client = this.getClient();
      let result;

      if (client) {
        const { data, error } = await client
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId)
          .select();

        if (error) throw error;
        result = data && data[0] ? data[0] : { id: orderId, status: newStatus };
      } else {
        const data = await this.restRequest(`orders?id=eq.${encodeURIComponent(orderId)}`, {
          method: 'PATCH',
          body: { status: newStatus }
        });
        result = Array.isArray(data) && data[0] ? data[0] : { id: orderId, status: newStatus };
      }

      this.syncLocalOrderCache({ id: orderId, status: newStatus }, 'update');
      console.log(`✅ Supabase: Order ${orderId} updated to status "${newStatus}"`);
      return result;
    } catch (err) {
      console.error(`❌ Supabase updateOrderStatus (${orderId}) failed:`, err);
      this.syncLocalOrderCache({ id: orderId, status: newStatus }, 'update');
      return { id: orderId, status: newStatus };
    }
  }

  /**
   * 4. DELETE ORDER: Deletes an order from 'orders'
   * @param {string} orderId 
   * @returns {Promise<boolean>}
   */
  async deleteOrder(orderId) {
    try {
      const client = this.getClient();
      if (client) {
        const { error } = await client
          .from('orders')
          .delete()
          .eq('id', orderId);

        if (error) throw error;
      } else {
        await this.restRequest(`orders?id=eq.${encodeURIComponent(orderId)}`, {
          method: 'DELETE'
        });
      }

      this.syncLocalOrderCache({ id: orderId }, 'delete');
      console.log(`✅ Supabase: Order ${orderId} deleted successfully.`);
      return true;
    } catch (err) {
      console.error(`❌ Supabase deleteOrder (${orderId}) failed:`, err);
      this.syncLocalOrderCache({ id: orderId }, 'delete');
      return false;
    }
  }

  /**
   * 5. CREATE LEAD: Inserts an inquiry/pass into the 'leads' table
   * @param {Object} leadData 
   * @returns {Promise<Object>}
   */
  async createLead(leadData) {
    try {
      const leadId = leadData.id || ('PZ-LEAD-' + Math.floor(10000 + Math.random() * 90000));
      const name = (leadData.name || leadData.fullName || leadData.full_name || 'VIP Member').trim();
      const phone = (leadData.phone || leadData.mobile || '9876543210').trim().replace(/\D/g, '');
      const preferredSlot = (leadData.preferred_slot || leadData.preferredSlot || leadData.timeSlot || leadData.branch || leadData.date || 'Morning (06:00 AM)').trim();
      const goal = (leadData.goal || leadData.training_goal || 'General Fitness & Stamina').trim();

      const payload = {
        id: leadId,
        name: name,
        phone: phone,
        preferred_slot: preferredSlot,
        goal: goal
      };

      const client = this.getClient();
      let result;

      if (client) {
        const { data, error } = await client
          .from('leads')
          .insert([payload])
          .select();

        if (error) throw error;
        result = data && data[0] ? data[0] : payload;
      } else {
        const data = await this.restRequest('leads', {
          method: 'POST',
          body: payload
        });
        result = Array.isArray(data) && data[0] ? data[0] : payload;
      }

      console.log('✅ Supabase: Lead created successfully:', result.id);
      return result;
    } catch (err) {
      console.error('❌ Supabase createLead failed:', err);
      return leadData;
    }
  }

  /**
   * FETCH ALL LEADS: Retrieves all inquiries from 'leads' ordered by created_at DESC
   * @returns {Promise<Array>}
   */
  async fetchAllLeads() {
    try {
      const client = this.getClient();
      let records = [];

      if (client) {
        const { data, error } = await client
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        records = data || [];
      } else {
        records = await this.restRequest('leads?order=created_at.desc') || [];
      }

      return records;
    } catch (err) {
      console.error('❌ Supabase fetchAllLeads failed:', err);
      return [];
    }
  }

  /**
   * 6. SYNC MEMBER PROFILE: Inserts/updates user profiles in 'member_profiles'
   * @param {Object} profileData 
   * @returns {Promise<Object>}
   */
  async syncMemberProfile(profileData) {
    try {
      const memberId = profileData.id || ('PZ-MEM-' + Math.floor(10000 + Math.random() * 90000));
      const fullName = (profileData.full_name || profileData.fullName || profileData.name || 'Member').trim();
      const phone = (profileData.phone || profileData.mobile || '9876543210').trim().replace(/\D/g, '');
      const email = profileData.email ? profileData.email.trim().toLowerCase() : null;
      const diet = profileData.diet_preference || profileData.dietPreference || 'Both / Flexible';
      const goal = profileData.training_goal || profileData.goal || 'General Fitness';
      const city = profileData.city || 'Shirdi';

      const payload = {
        id: memberId,
        full_name: fullName,
        phone: phone,
        email: email,
        diet_preference: diet,
        training_goal: goal,
        city: city
      };

      const client = this.getClient();
      let result;

      if (client) {
        const { data, error } = await client
          .from('member_profiles')
          .upsert([payload], { onConflict: 'id' })
          .select();

        if (error) throw error;
        result = data && data[0] ? data[0] : payload;
      } else {
        const data = await this.restRequest('member_profiles', {
          method: 'POST',
          prefer: 'resolution=merge-duplicates,return=representation',
          body: payload
        });
        result = Array.isArray(data) && data[0] ? data[0] : payload;
      }

      console.log('✅ Supabase: Member profile synced:', result.id);
      return result;
    } catch (err) {
      console.error('❌ Supabase syncMemberProfile failed:', err);
      return profileData;
    }
  }

  /**
   * 7. FETCH CUSTOMER ORDERS: Retrieves orders filtered by a specific customer phone number
   * @param {string} phone 
   * @returns {Promise<Array>} List of matching customer orders
   */
  async fetchCustomerOrders(phone) {
    try {
      if (!phone) return [];
      const cleanPhone = String(phone).trim().replace(/\D/g, '');
      const client = this.getClient();
      let records = [];

      if (client) {
        const { data, error } = await client
          .from('orders')
          .select('*')
          .eq('phone', cleanPhone)
          .order('created_at', { ascending: false });

        if (error) throw error;
        records = data || [];
      } else {
        records = await this.restRequest(`orders?phone=eq.${encodeURIComponent(cleanPhone)}&order=created_at.desc`) || [];
      }

      return records.map(r => this.formatOrder(r));
    } catch (err) {
      console.error(`❌ Supabase fetchCustomerOrders (${phone}) failed:`, err);
      return [];
    }
  }

  // --- Helper: Format Order for UI compatibility ---
  formatOrder(row) {
    if (!row) return null;
    const createdAt = row.created_at ? new Date(row.created_at) : new Date();
    const formattedTimestamp = createdAt.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ', ' + createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Parse items description into structured items array if needed
    const itemText = row.item || 'Sports Equipment';
    const itemsList = itemText.split(',').map((part, idx) => {
      const match = part.match(/(.*?)\s*\(x(\d+)\)/);
      if (match) {
        return { id: `pz-item-${idx}`, name: match[1].trim(), qty: parseInt(match[2]), price: row.price || 0 };
      }
      return { id: `pz-item-${idx}`, name: part.trim(), qty: 1, price: row.price || 0 };
    });

    return {
      id: row.id,
      customer_name: row.customer_name,
      customerName: row.customer_name,
      phone: row.phone,
      city: row.city,
      address: row.address,
      pincode: row.pincode,
      item: row.item,
      items: itemsList,
      itemsSummary: itemText,
      price: Number(row.price || 0),
      totalAmount: Number(row.price || 0),
      payment_method: row.payment_method || 'Cash on Delivery (COD)',
      paymentMethod: row.payment_method || 'Cash on Delivery (COD)',
      status: row.status || 'Pending',
      created_at: row.created_at,
      timestamp: formattedTimestamp
    };
  }

  // Sync to local cache
  syncLocalOrderCache(record, action = 'insert') {
    try {
      const cached = JSON.parse(localStorage.getItem('powerzone_supabase_orders_cache') || '[]');
      if (action === 'insert') {
        const idx = cached.findIndex(r => r.id === record.id);
        if (idx !== -1) cached[idx] = record;
        else cached.unshift(record);
      } else if (action === 'update') {
        const item = cached.find(r => r.id === record.id);
        if (item) Object.assign(item, record);
      } else if (action === 'delete') {
        const filtered = cached.filter(r => r.id !== record.id);
        localStorage.setItem('powerzone_supabase_orders_cache', JSON.stringify(filtered));
        return;
      }
      localStorage.setItem('powerzone_supabase_orders_cache', JSON.stringify(cached));
    } catch (e) {}
  }

  // Export full DB snapshot as JSON for backup
  async exportDatabaseJSON() {
    try {
      const [orders, leads] = await Promise.all([
        this.fetchAllOrders(),
        this.fetchAllLeads()
      ]);

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        database: "PowerZone Supabase PostgreSQL",
        exportedAt: new Date().toISOString(),
        totalOrders: orders.length,
        totalLeads: leads.length,
        orders,
        leads
      }, null, 2));

      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `PowerZone_Supabase_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      if (window.showToast) {
        window.showToast('Database Exported', 'Supabase PostgreSQL snapshot downloaded as JSON.', 'success');
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  }

  // --- Compatibility & Local Adapter Methods ---
  getDB() {
    if (window.PowerZoneLocalDB && typeof window.PowerZoneLocalDB.getDB === 'function') {
      const local = window.PowerZoneLocalDB.getDB();
      const cachedOrders = JSON.parse(localStorage.getItem('powerzone_supabase_orders_cache') || 'null');
      if (cachedOrders && Array.isArray(cachedOrders) && cachedOrders.length > 0) {
        local.orders = cachedOrders.map(o => this.formatOrder(o));
      }
      return local;
    }
    const cachedOrders = JSON.parse(localStorage.getItem('powerzone_supabase_orders_cache') || '[]');
    return { orders: cachedOrders.map(o => this.formatOrder(o)), passes: [], bookings: [] };
  }

  getMetrics() {
    const db = this.getDB();
    const orders = db.orders || [];
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, ord) => sum + (Number(ord.price || ord.totalAmount) || 0), 0);
    const pendingOrders = orders.filter(ord => (ord.status || '').toLowerCase() === 'pending').length;
    const confirmedOrders = orders.filter(ord => (ord.status || '').toLowerCase() === 'confirmed' || (ord.status || '').toLowerCase() === 'delivered').length;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      confirmedOrders,
      totalPasses: (db.passes || []).length,
      totalBookings: (db.bookings || []).length
    };
  }

  insert(table, record) {
    if (table === 'orders') {
      this.createOrder(record).catch(err => console.error(err));
    } else if (table === 'passes' || table === 'bookings') {
      this.createLead({
        id: record.id,
        name: record.name || record.clientName,
        phone: record.phone,
        preferred_slot: record.branch || `${record.className || 'Class'} - ${record.timeSlot || 'Morning'}`,
        goal: table === 'passes' ? 'VIP 1-Day Pass' : (record.className || 'Class Trial')
      }).catch(err => console.error(err));
    }
    if (window.PowerZoneLocalDB && typeof window.PowerZoneLocalDB.insert === 'function') {
      return window.PowerZoneLocalDB.insert(table, record);
    }
    return record;
  }

  updateStatus(table, id, newStatus) {
    if (table === 'orders') {
      this.updateOrderStatus(id, newStatus).catch(err => console.error(err));
    }
    if (window.PowerZoneLocalDB && typeof window.PowerZoneLocalDB.updateStatus === 'function') {
      return window.PowerZoneLocalDB.updateStatus(table, id, newStatus);
    }
    return { id, status: newStatus };
  }

  delete(table, id) {
    if (table === 'orders') {
      this.deleteOrder(id).catch(err => console.error(err));
    }
    if (window.PowerZoneLocalDB && typeof window.PowerZoneLocalDB.delete === 'function') {
      return window.PowerZoneLocalDB.delete(table, id);
    }
    return true;
  }

  openAdminTerminal() {
    window.location.href = 'portal.html';
  }

  closeAdminTerminal() {
    const modal = document.getElementById('adminTerminalModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}

// Global Singleton Instance & Interface
window.PowerZoneDB = new SupabaseService();
window.pzDB = window.PowerZoneDB;
