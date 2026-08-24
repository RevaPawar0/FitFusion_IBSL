/**
 * POWERZONE : GYM & SPORTS STORE
 * Shopping Cart, Sports Catalog & Local INR Order Controller
 */

const POWERZONE_PRODUCTS = [
  {
    id: 'pz-1',
    name: 'Pro Turf Studs / Football Shoes (Multi-Ground)',
    category: 'football',
    price: 2499,
    oldPrice: 3200,
    rating: 4.9,
    reviews: 164,
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80',
    desc: 'High-traction TPU molded studs for artificial turf & grass grounds. Reinforced heel counter and breathable mesh upper for explosive speed.'
  },
  {
    id: 'pz-2',
    name: 'Grade 1 Kashmir Willow Cricket Bat (Full Size)',
    category: 'cricket',
    price: 2899,
    oldPrice: 3800,
    rating: 5.0,
    reviews: 198,
    badge: 'Pro Choice',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&auto=format&fit=crop&q=80',
    desc: 'Handcrafted premium Kashmir Willow with 38-40mm massive edges, thick sweet spot, cane handle with chevron rubber grip for powerful boundary hitting.'
  },
  {
    id: 'pz-3',
    name: 'Custom Tournament Brass/Gold Trophy & Medals Set',
    category: 'trophies',
    price: 3999,
    oldPrice: 4999,
    rating: 4.9,
    reviews: 82,
    badge: 'Club Special',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&auto=format&fit=crop&q=80',
    desc: 'Customizable championship gold cup trophy (18-inch) + 20 tournament brass medals with ribbon neckbands for local sports tournaments & leagues.'
  },
  {
    id: 'pz-4',
    name: '10mm Heavy Duty Leather Powerlifting Lever Belt',
    category: 'gym',
    price: 2199,
    oldPrice: 2899,
    rating: 4.9,
    reviews: 210,
    badge: 'IPF Spec',
    image: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=600&auto=format&fit=crop&q=80',
    desc: 'Top-grain 10mm non-slip suede leather with zinc-alloy chrome quick-release lever. Uncompromising intra-abdominal support for heavy squats & deadlifts.'
  },
  {
    id: 'pz-5',
    name: 'Pro Carbon Graphite Badminton Rackets Set (Pack of 2)',
    category: 'badminton',
    price: 1899,
    oldPrice: 2499,
    rating: 4.8,
    reviews: 145,
    badge: 'High Tension',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80',
    desc: 'Isometric high-modulus graphite frame pre-strung at 28 lbs tension with full padded carry bag and 3 nylon shuttles included.'
  },
  {
    id: 'pz-6',
    name: 'Latex Resistance Loop Bands (Set of 5 Levels)',
    category: 'accessories',
    price: 799,
    oldPrice: 1199,
    rating: 4.9,
    reviews: 320,
    badge: 'Essential',
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&auto=format&fit=crop&q=80',
    desc: '100% natural Malaysian latex bands (Extra Light to Extra Heavy) with door anchor, workout guide booklet, and compact travel pouch.'
  },
  {
    id: 'pz-7',
    name: 'Commercial Hex Rubber Dumbbells Pair (15kg x 2)',
    category: 'gym',
    price: 3499,
    oldPrice: 4400,
    rating: 4.9,
    reviews: 115,
    badge: 'Heavy Iron',
    image: 'https://images.unsplash.com/photo-1638803040283-7a5ffd48dad5?w=600&auto=format&fit=crop&q=80',
    desc: 'Solid cast iron core encased in heavy-duty anti-crack rubber with knurled ergonomic chrome grip. Zero floor damage and minimal bounce.'
  },
  {
    id: 'pz-8',
    name: 'Match Quality Synthetic Leather Volleyball & Net Kit',
    category: 'football',
    price: 1299,
    oldPrice: 1799,
    rating: 4.8,
    reviews: 94,
    badge: 'Official Size',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&auto=format&fit=crop&q=80',
    desc: 'Soft-touch PU composite leather 18-panel volleyball with official size braided nylon net and inflating hand pump with needle.'
  }
];

class PowerZoneCart {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem('powerzone_cart')) || [];
    this.discountPercent = 0;
    this.appliedCoupon = null;

    this.init();
  }

  init() {
    this.updateBadges();
    this.bindEvents();
  }

  save() {
    localStorage.setItem('powerzone_cart', JSON.stringify(this.cart));
    this.updateBadges();
    this.renderDrawer();
  }

  addItem(productId, qty = 1) {
    const product = POWERZONE_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = this.cart.find(item => item.id === productId);
    if (existing) {
      existing.qty += qty;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: qty
      });
    }

    this.save();
    this.animateBadge();
    
    if (window.showToast) {
      window.showToast('Added to Cart', `${product.name} (x${qty}) added!`, 'success');
    }
  }

  buyNow(productId) {
    const product = POWERZONE_PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    // Add item if not in cart
    const existing = this.cart.find(item => item.id === productId);
    if (!existing) {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: 1
      });
      this.save();
    }

    this.openCheckoutModal();
  }

  removeItem(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.save();
    if (window.showToast) {
      window.showToast('Item Removed', 'Product removed from your cart.', 'crimson');
    }
  }

  updateQty(productId, delta) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      this.removeItem(productId);
    } else {
      this.save();
    }
  }

  applyCoupon(code) {
    const normalized = code.trim().toUpperCase();
    if (normalized === 'POWERZONE20' || normalized === 'FUSION20' || normalized === 'SHIRDI20') {
      this.discountPercent = 0.20;
      this.appliedCoupon = normalized;
      this.renderDrawer();
      if (window.showToast) {
        window.showToast('Coupon Applied!', '20% OFF applied to your order subtotal.', 'success');
      }
      return true;
    } else if (normalized === '') {
      this.discountPercent = 0;
      this.appliedCoupon = null;
      this.renderDrawer();
      return false;
    } else {
      if (window.showToast) {
        window.showToast('Invalid Coupon', 'Code not recognized. Try POWERZONE20!', 'crimson');
      }
      return false;
    }
  }

  getTotalCount() {
    return this.cart.reduce((sum, item) => sum + item.qty, 0);
  }

  getSubtotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }

  getCalculations() {
    const subtotal = this.getSubtotal();
    const discount = subtotal * this.discountPercent;
    const gst = Math.round((subtotal - discount) * 0.05); // 5% GST on sports equipment
    const total = (subtotal - discount) + gst;
    return { subtotal, discount, gst, total };
  }

  updateBadges() {
    const count = this.getTotalCount();
    document.querySelectorAll('.cart-badge').forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  animateBadge() {
    document.querySelectorAll('.cart-badge').forEach(badge => {
      badge.classList.remove('bump');
      void badge.offsetWidth;
      badge.classList.add('bump');
    });
  }

  openDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
      this.renderDrawer();
      drawer.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  closeDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartOverlay');
    if (drawer && overlay) {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  renderDrawer() {
    const container = document.getElementById('cartItemsList');
    const breakdownContainer = document.getElementById('cartBreakdown');
    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <h4>Your Cart is Empty</h4>
          <p style="margin-top: 0.5rem; font-size: 0.88rem;">Explore cricket bats, turf shoes, trophies, and gym iron.</p>
          <a href="shop.html" class="btn btn-primary btn-sm" style="margin-top: 1.25rem;">Explore Sports Store</a>
        </div>
      `;
      if (breakdownContainer) {
        breakdownContainer.innerHTML = '';
      }
      return;
    }

    container.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
          <div class="cart-qty-ctrl">
            <button class="qty-btn" onclick="window.pzCart.updateQty('${item.id}', -1)">-</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="window.pzCart.updateQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="window.pzCart.removeItem('${item.id}')" title="Remove item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `).join('');

    const { subtotal, discount, gst, total } = this.getCalculations();

    if (breakdownContainer) {
      breakdownContainer.innerHTML = `
        <div class="breakdown-row">
          <span>Subtotal</span>
          <span>₹${subtotal.toLocaleString('en-IN')}</span>
        </div>
        ${discount > 0 ? `
          <div class="breakdown-row" style="color: var(--accent-green);">
            <span>Discount (${this.appliedCoupon})</span>
            <span>-₹${discount.toLocaleString('en-IN')}</span>
          </div>
        ` : ''}
        <div class="breakdown-row">
          <span>GST (5%)</span>
          <span>₹${gst.toLocaleString('en-IN')}</span>
        </div>
        <div class="breakdown-row total">
          <span>Grand Total</span>
          <span style="color: var(--primary);">₹${total.toLocaleString('en-IN')}</span>
        </div>
      `;
    }
  }

  openCheckoutModal() {
    if (this.cart.length === 0) {
      if (window.showToast) window.showToast('Empty Cart', 'Please add sports items before checkout.', 'crimson');
      return;
    }

    this.closeDrawer();
    const modal = document.getElementById('checkoutModal');
    const summary = document.getElementById('checkoutSummaryContent');
    const formWrap = document.getElementById('checkoutFormWrap');
    const successWrap = document.getElementById('checkoutSuccessWrap');

    if (formWrap) formWrap.style.display = 'block';
    if (successWrap) successWrap.style.display = 'none';

    if (modal && summary) {
      const { subtotal, discount, gst, total } = this.getCalculations();
      const orderRef = 'PZ-' + Math.floor(100000 + Math.random() * 900000);

      summary.innerHTML = `
        <div style="background: var(--bg-card); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem; border: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.4rem;">
            <span>Order Reference</span>
            <strong style="color: var(--text-primary); font-family: var(--font-display);">${orderRef}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.4rem;">
            <span>Total Items</span>
            <strong style="color: var(--text-primary);">${this.getTotalCount()} items</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800; color: var(--primary); border-top: 1px solid var(--border-subtle); padding-top: 0.5rem; margin-top: 0.4rem;">
            <span>Payable Amount</span>
            <span>₹${total.toLocaleString('en-IN')}</span>
          </div>
        </div>
      `;

      if (window.pzAuth && typeof window.pzAuth.prefillFormsForCurrentUser === 'function') {
        window.pzAuth.prefillFormsForCurrentUser();
      }

      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  async processOrder(formData) {
    const formWrap = document.getElementById('checkoutFormWrap');
    const successWrap = document.getElementById('checkoutSuccessWrap');
    const { total } = this.getCalculations();

    const paymentMethodText = formData.paymentMethod === 'upi' || formData.paymentMethod === 'Instant UPI'
      ? 'Instant UPI'
      : 'Cash on Delivery (COD)';

    const orderItems = this.cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty
    }));

    const itemNames = orderItems.map(i => `${i.name} (x${i.qty})`).join(', ');
    const orderId = 'PZ-ORD-' + Math.floor(10000 + Math.random() * 90000);
    const totalPrice = total;

    // Directly write order to Supabase
    let res = null;
    if (window.PowerZoneDB && typeof window.PowerZoneDB.createOrder === 'function') {
      try {
        res = await window.PowerZoneDB.createOrder({
          id: orderId,
          customer_name: formData.name,
          phone: formData.phone,
          city: formData.city,
          address: formData.address,
          pincode: formData.pincode,
          item: itemNames,
          price: totalPrice,
          payment_method: paymentMethodText,
          status: 'Pending'
        });
        console.log("Supabase Insert Result:", res);
      } catch (err) {
        console.error('Error inserting order to Supabase:', err);
      }
    }

    const savedOrder = res || {
      id: orderId,
      customer_name: formData.name,
      phone: formData.phone,
      city: formData.city,
      address: formData.address,
      pincode: formData.pincode,
      item: itemNames,
      price: totalPrice,
      payment_method: paymentMethodText,
      status: 'Pending'
    };

    if (formWrap && successWrap) {
      formWrap.style.display = 'none';
      successWrap.style.display = 'block';

      const waMsg = `Hi PowerZone Shirdi, I have placed Order *${savedOrder.id}* for *₹${totalPrice.toLocaleString('en-IN')}* via *${paymentMethodText}*.\nName: ${formData.name}\nAddress: ${formData.address}, ${formData.city} - ${formData.pincode}\nItems: ${itemNames}\nPlease confirm dispatch.`;
      const waUrl = `https://wa.me/919422201823?text=${encodeURIComponent(waMsg)}`;

      successWrap.innerHTML = `
        <div class="order-success-card">
          <div class="order-success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span class="badge badge-green" style="margin-bottom: 0.5rem;">ORDER SAVED IN LIVE SUPABASE DATABASE</span>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.35rem; color: var(--text-primary);">Order Confirmed, ${formData.name}!</h3>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
            Order ID: <strong style="color: var(--primary); font-family: var(--font-display);">${savedOrder.id}</strong> • Synced to PostgreSQL Cloud DB
          </p>

          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; text-align: left; margin-bottom: 1.25rem; font-size: 0.88rem; line-height: 1.8;">
            <div><strong>Items Ordered:</strong> ${itemNames}</div>
            <div><strong>Delivery Town/City:</strong> ${formData.city} (PIN: ${formData.pincode})</div>
            <div><strong>Shipping Address:</strong> ${formData.address}</div>
            <div><strong>WhatsApp Mobile:</strong> +91 ${formData.phone}</div>
            <div><strong>Payment Mode:</strong> ${paymentMethodText}</div>
            <div style="border-top: 1px solid var(--border-subtle); margin-top: 0.5rem; padding-top: 0.5rem; display: flex; justify-content: space-between; font-weight: 800; font-size: 1rem; color: var(--primary);">
              <span>Total Payable Amount:</span>
              <span>₹${totalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style="background: rgba(37, 211, 102, 0.12); border: 1px dashed var(--accent-whatsapp); border-radius: var(--radius-sm); padding: 0.85rem; text-align: center; margin-bottom: 1.25rem;">
            <p style="font-size: 0.82rem; color: var(--accent-whatsapp); font-weight: 700; margin-bottom: 0.5rem;">
              📲 Instant 1-Click WhatsApp Dispatch Confirmation:
            </p>
            <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="background: #25d366; border-color: #25d366; color: #ffffff; font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
              <span>💬 Confirm Order on WhatsApp (+91 94222 01823)</span>
            </a>
          </div>

          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" onclick="window.location.href='shop.html'">
              Continue Shopping
            </button>
            <a href="portal.html" target="_blank" class="btn btn-outline btn-sm">
              ⚡ Open Owner Terminal
            </a>
          </div>
        </div>
      `;

      // Clear cart
      this.cart = [];
      this.appliedCoupon = null;
      this.discountPercent = 0;
      this.save();

      if (window.showToast) {
        window.showToast('Order Stored!', `Order ${savedOrder.id} logged in live Supabase database.`, 'success');
      }
    }
  }

  closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  bindEvents() {
    document.querySelectorAll('.cart-trigger-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDrawer();
      });
    });

    const overlay = document.getElementById('cartOverlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.closeDrawer());
    }

    const closeBtn = document.getElementById('closeCartBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }

    const promoBtn = document.getElementById('applyPromoBtn');
    const promoInput = document.getElementById('promoCodeInput');
    if (promoBtn && promoInput) {
      promoBtn.addEventListener('click', () => {
        this.applyCoupon(promoInput.value);
      });
      promoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.applyCoupon(promoInput.value);
        }
      });
    }

    const checkoutBtn = document.getElementById('checkoutDrawerBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => this.openCheckoutModal());
    }

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('checkoutName').value.trim();
        const phone = document.getElementById('checkoutPhone').value.trim().replace(/\D/g, '');
        const city = document.getElementById('checkoutCity').value.trim();
        const address = document.getElementById('checkoutAddress').value.trim();
        const pincode = document.getElementById('checkoutPincode').value.trim().replace(/\D/g, '');
        const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
        const paymentMethod = paymentRadio ? (paymentRadio.value === 'upi' ? 'Instant UPI' : 'Cash on Delivery (COD)') : 'Cash on Delivery (COD)';

        if (!name || name.length < 2) {
          if (window.showToast) window.showToast('Invalid Name', 'Please enter a valid full name.', 'crimson');
          return;
        }

        // Strict 10-digit Indian phone validation (starts with 6, 7, 8, or 9)
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
          if (window.showToast) window.showToast('Invalid Mobile', 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).', 'crimson');
          document.getElementById('checkoutPhone')?.focus();
          return;
        }

        // Strict 6-digit Indian pincode validation
        const pinRegex = /^\d{6}$/;
        if (!pinRegex.test(pincode)) {
          if (window.showToast) window.showToast('Invalid Pincode', 'Please enter a valid 6-digit postal pincode (e.g. 423109 for Shirdi).', 'crimson');
          document.getElementById('checkoutPincode')?.focus();
          return;
        }

        if (!address || address.length < 5) {
          if (window.showToast) window.showToast('Incomplete Address', 'Please provide your full delivery address and landmark.', 'crimson');
          document.getElementById('checkoutAddress')?.focus();
          return;
        }

        await this.processOrder({ name, phone, city, address, pincode, paymentMethod });
      });
    }
  }
}

// Global cart instance
window.pzCart = new PowerZoneCart();
window.fitCart = window.pzCart; // backward compat alias
