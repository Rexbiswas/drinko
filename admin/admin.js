/**
 * Drinko Admin & Kitchen Command Center
 * Real-Time Socket.IO kitchen board, analytics, products, inventory, coupons, and orders.
 */

let adminUser = null;
let adminSocket = null;
let currentOrders = [];
let currentInventory = [];
let currentProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    initAdminApp();
});

function showAdminToast(message, icon = 'fa-circle-info') {
    const container = document.getElementById('adm-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'adm-toast';
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color: var(--primary);"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function initAdminApp() {
    setupLoginHandler();
    setupViewSwitching();
    initAdminToggles();

    // Check if token exists and verify staff/admin
    const token = DrinkoAPI.getToken();
    if (token) {
        try {
            const res = await DrinkoAPI.auth.getMe();
            if (res && res.data && (res.data.role === 'admin' || res.data.role === 'staff')) {
                adminUser = res.data;
                enterAdminDashboard();
                return;
            }
        } catch (e) {
            DrinkoAPI.setToken(null);
        }
    }

    // Otherwise show login modal
    document.getElementById('admin-login-overlay').style.display = 'flex';
}

function setupLoginHandler() {
    const form = document.getElementById('admin-login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adm-email').value.trim();
        const password = document.getElementById('adm-password').value.trim();

        try {
            showAdminToast('Authenticating credentials...', 'fa-spinner fa-spin');
            const res = await DrinkoAPI.auth.login(email, password);

            if (res.user && (res.user.role === 'admin' || res.user.role === 'staff')) {
                adminUser = res.user;
                showAdminToast(`Welcome to Command Center, ${adminUser.name}!`, 'fa-circle-check');
                enterAdminDashboard();
            } else {
                showAdminToast('Access denied: Staff/Admin authorization required.', 'fa-shield-halved');
                DrinkoAPI.setToken(null);
            }
        } catch (err) {
            showAdminToast(err.message || 'Login failed', 'fa-triangle-exclamation');
        }
    });

    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await DrinkoAPI.auth.logout();
            window.location.reload();
        });
    }

    const refreshBtn = document.getElementById('btn-refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadKitchenOrders();
            loadOverviewKPIs();
            showAdminToast('Live data synchronized', 'fa-rotate');
        });
    }
}

function enterAdminDashboard() {
    document.getElementById('admin-login-overlay').style.display = 'none';
    document.getElementById('admin-main-wrapper').style.display = 'flex';

    // Populate admin sidebar badge & name
    document.getElementById('adm-role-badge').textContent = (adminUser.role || 'ADMIN').toUpperCase();
    document.getElementById('adm-user-name').textContent = adminUser.name || 'Admin';
    document.getElementById('adm-user-email').textContent = adminUser.email || '';
    document.getElementById('adm-initials').textContent = (adminUser.name || 'AD').substring(0, 2).toUpperCase();

    // Connect Socket.IO
    initAdminSocket();

    // Load initial views
    loadKitchenOrders();
    loadOverviewKPIs();
    loadAllOrders();
    loadProducts();
    loadInventory();
    loadCoupons();
    loadTables();
    loadReviews();
}

function initAdminSocket() {
    if (typeof io !== 'undefined') {
        adminSocket = io(window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:5000');
        
        adminSocket.on('connect', () => {
            console.log('[Admin Socket] Connected to command center');
            adminSocket.emit('join_kitchen');
            adminSocket.emit('join_admin');
        });

        // When a new order arrives live
        adminSocket.on('new_order_placed', (order) => {
            console.log('[Socket] New Order Received:', order);
            showAdminToast(`🔥 New Order #${order.orderNumber} placed!`, 'fa-bell');
            playChime();
            loadKitchenOrders();
            loadOverviewKPIs();
            loadAllOrders();
        });

        // When order status is updated
        adminSocket.on('order_status_updated', (data) => {
            console.log('[Socket] Order status updated:', data);
            loadKitchenOrders();
            loadAllOrders();
        });
    }
}

function playChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
}

function setupViewSwitching() {
    const navItems = document.querySelectorAll('.nav-item[data-view]');
    const views = document.querySelectorAll('.admin-view');
    const titleEl = document.getElementById('current-view-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetViewId = item.dataset.view;
            if (!targetViewId) return;

            navItems.forEach(i => i.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            item.classList.add('active');
            const activeView = document.getElementById(targetViewId);
            if (activeView) activeView.classList.add('active');

            if (titleEl) {
                const label = item.querySelector('span').textContent;
                titleEl.textContent = label;
            }
        });
    });
}

// --------------------------------------------------------------------------
// 1. Kitchen Display System (KDS)
// --------------------------------------------------------------------------
async function loadKitchenOrders() {
    try {
        const res = await DrinkoAPI.admin.getKitchenOrders();
        const orders = res.data || [];
        currentOrders = orders;

        const placed = orders.filter(o => o.orderStatus === 'PLACED');
        const confirmed = orders.filter(o => o.orderStatus === 'CONFIRMED');
        const preparing = orders.filter(o => o.orderStatus === 'PREPARING');
        const ready = orders.filter(o => o.orderStatus === 'READY');

        document.getElementById('kds-count-placed').textContent = placed.length;
        document.getElementById('kds-count-confirmed').textContent = confirmed.length;
        document.getElementById('kds-count-preparing').textContent = preparing.length;
        document.getElementById('kds-count-ready').textContent = ready.length;

        const totalActive = placed.length + confirmed.length + preparing.length + ready.length;
        document.getElementById('kitchen-active-count').textContent = totalActive;

        renderKdsColumn('kds-cards-placed', placed, 'CONFIRMED', 'Confirm Order', 'btn-advance-confirm');
        renderKdsColumn('kds-cards-confirmed', confirmed, 'PREPARING', 'Start Brewing', 'btn-advance-prep');
        renderKdsColumn('kds-cards-preparing', preparing, 'READY', 'Mark Ready', 'btn-advance-ready');
        renderKdsColumn('kds-cards-ready', ready, 'COMPLETED', 'Mark Served', 'btn-advance-complete');

    } catch (err) {
        console.warn('Kitchen orders load note:', err.message);
    }
}

function renderKdsColumn(containerId, orders, nextStatus, nextLabel, btnClass) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem 0; color: var(--text-muted); font-size: 0.8rem;">
                No orders in this queue
            </div>
        `;
        return;
    }

    container.innerHTML = orders.map(order => {
        const isTable = order.orderType === 'DINE_IN';
        const tableBadge = isTable ? `<span class="kds-order-type kds-table-badge"><i class="fa-solid fa-chair"></i> T-${order.tableNumber || '??'}</span>` : `<span class="kds-order-type">Delivery</span>`;
        const timeAgo = formatTimeAgo(order.createdAt);

        return `
            <div class="kds-card">
                <div class="kds-card-top">
                    <span class="kds-order-num">${order.orderNumber}</span>
                    <div>${tableBadge}</div>
                </div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">
                    <i class="fa-regular fa-clock"></i> ${timeAgo}
                </div>
                <div class="kds-card-items">
                    ${(order.items || []).map(item => `
                        <div class="kds-item-row">
                            <strong>${item.quantity}x</strong> ${item.productName || (item.product && item.product.name) || 'Drink'} (${item.size})
                            ${item.customizations ? `
                                <div class="kds-item-customs">
                                    ${item.customizations.ice || ''} • ${item.customizations.sweetness || ''}
                                    ${(item.customizations.toppings || []).length > 0 ? `<br>+ ${(item.customizations.toppings || []).join(', ')}` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="kds-actions-row">
                    <button class="btn-kds-advance ${btnClass}" onclick="advanceOrderStatus('${order._id}', '${nextStatus}')">
                        ${nextLabel} <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function advanceOrderStatus(orderId, nextStatus) {
    try {
        await DrinkoAPI.admin.updateOrderStatus(orderId, nextStatus);
        showAdminToast(`Order progressed to ${nextStatus}`, 'fa-circle-check');
        loadKitchenOrders();
        loadAllOrders();
    } catch (err) {
        showAdminToast(err.message, 'fa-triangle-exclamation');
    }
}

function formatTimeAgo(dateString) {
    const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
}

// --------------------------------------------------------------------------
// 2. Overview & KPIs
// --------------------------------------------------------------------------
async function loadOverviewKPIs() {
    try {
        const res = await DrinkoAPI.admin.getOverview();
        const data = res.data || {};

        document.getElementById('kpi-revenue').textContent = `$${(data.todayRevenue || 0).toFixed(2)}`;
        document.getElementById('kpi-orders-count').textContent = data.todayOrdersCount || 0;
        document.getElementById('kpi-pending-count').textContent = data.pendingOrdersCount || 0;
        document.getElementById('kpi-customers-count').textContent = data.totalCustomersCount || 0;

        // Bestsellers list
        const topList = document.getElementById('top-products-list');
        if (topList && data.popularProducts) {
            topList.innerHTML = data.popularProducts.map(p => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
                    <span style="color: #fff;">${p.name}</span>
                    <strong style="color: #ffcb77;">${p.orderCount || p.sales || 12} sold</strong>
                </div>
            `).join('') || '<p style="color: var(--text-muted);">No sales data yet today.</p>';
        }

        // Low stock list
        const lowList = document.getElementById('low-stock-list');
        if (lowList && data.lowStockItems) {
            if (data.lowStockItems.length === 0) {
                lowList.innerHTML = '<p style="color: #4ade80;"><i class="fa-solid fa-check"></i> All ingredients well stocked above minimum thresholds.</p>';
                document.getElementById('inventory-low-count').style.display = 'none';
            } else {
                document.getElementById('inventory-low-count').style.display = 'inline-block';
                document.getElementById('inventory-low-count').textContent = data.lowStockItems.length;

                lowList.innerHTML = data.lowStockItems.map(item => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.04);">
                        <span style="color: #f87171;"><i class="fa-solid fa-triangle-exclamation"></i> ${item.ingredient}</span>
                        <strong style="color: #ffcb77;">${item.quantity} ${item.unit} remaining</strong>
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        console.warn('Overview KPI note:', err.message);
    }
}

// --------------------------------------------------------------------------
// 3. All Orders Table
// --------------------------------------------------------------------------
async function loadAllOrders() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    try {
        const res = await DrinkoAPI.admin.getOrders();
        const orders = res.data || [];

        tbody.innerHTML = orders.map(o => {
            const itemsSummary = (o.items || []).map(i => `${i.quantity}x ${i.productName || (i.product && i.product.name) || 'Brew'}`).join(', ');
            const custInfo = o.customer ? `${o.customer.name || 'Member'}` : (o.tableNumber ? `Table #${o.tableNumber}` : 'Guest');

            return `
                <tr>
                    <td style="font-family: var(--font-mono); font-weight: 700; color: #ffcb77;">${o.orderNumber}</td>
                    <td><span class="role-pill">${o.orderType || 'DELIVERY'}</span></td>
                    <td>${custInfo}</td>
                    <td>${itemsSummary}</td>
                    <td style="font-weight: 700; color: #fff;">$${(o.total || 0).toFixed(2)}</td>
                    <td><span style="color: ${o.paymentStatus === 'PAID' ? '#4ade80' : '#f59e0b'}; font-weight: 600;">${o.paymentStatus}</span></td>
                    <td>
                        <select onchange="advanceOrderStatus('${o._id}', this.value)" class="adm-select" style="padding: 0.25rem 0.5rem; font-size: 0.78rem;">
                            ${['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map(st => `
                                <option value="${st}" ${o.orderStatus === st ? 'selected' : ''}>${st}</option>
                            `).join('')}
                        </select>
                    </td>
                    <td>
                        <button class="topbar-btn" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="showAdminToast('Receipt printed for #${o.orderNumber}', 'fa-print')">
                            <i class="fa-solid fa-print"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--accent-red);">Failed to load orders</td></tr>`;
    }
}

// --------------------------------------------------------------------------
// 4. Products & Menu
// --------------------------------------------------------------------------
async function loadProducts() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    try {
        const res = await DrinkoAPI.products.getAll();
        const products = res.data || [];
        currentProducts = products;

        tbody.innerHTML = products.map(p => `
            <tr>
                <td style="display: flex; align-items: center; gap: 0.8rem;">
                    <img src="${p.image && p.image.startsWith('http') ? p.image : '../' + p.image}" style="width: 38px; height: 38px; border-radius: 6px; object-fit: cover;">
                    <strong>${p.name}</strong>
                </td>
                <td><span class="role-pill">${p.category}</span></td>
                <td style="font-weight: 700; color: #ffcb77;">$${(p.price || 0).toFixed(2)}</td>
                <td><i class="fa-solid fa-star" style="color: #f59e0b;"></i> ${p.rating || 4.9}</td>
                <td>
                    <button class="topbar-btn" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; color: ${p.isAvailable ? '#4ade80' : '#f87171'};" onclick="toggleProductAvailability('${p._id}', ${!p.isAvailable})">
                        ${p.isAvailable ? '<i class="fa-solid fa-circle-check"></i> Available' : '<i class="fa-solid fa-ban"></i> Disabled'}
                    </button>
                </td>
                <td>
                    <button class="topbar-btn" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="showAdminToast('Edit product modal', 'fa-pen')">
                        <i class="fa-solid fa-pen"></i> Edit
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-red);">Failed to load products</td></tr>`;
    }
}

async function toggleProductAvailability(id, isAvailable) {
    try {
        await DrinkoAPI.put(`/products/${id}`, { isAvailable });
        showAdminToast(`Product availability updated!`, 'fa-circle-check');
        loadProducts();
    } catch (err) {
        showAdminToast(err.message, 'fa-triangle-exclamation');
    }
}

// --------------------------------------------------------------------------
// 5. Inventory & Stock
// --------------------------------------------------------------------------
async function loadInventory() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    try {
        const res = await DrinkoAPI.admin.getInventory();
        const inventory = res.data || [];
        currentInventory = inventory;

        tbody.innerHTML = inventory.map(item => {
            const isLow = item.quantity <= item.minimumStock;
            return `
                <tr>
                    <td style="font-weight: 600; color: #fff;">${item.ingredient}</td>
                    <td style="font-family: var(--font-mono); font-weight: 700; font-size: 0.95rem; color: ${isLow ? '#f87171' : '#4ade80'};">
                        ${item.quantity} ${item.unit}
                    </td>
                    <td>${item.minimumStock} ${item.unit}</td>
                    <td>$${(item.cost || 0).toFixed(2)}</td>
                    <td>
                        <span style="font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 12px; background: ${isLow ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}; color: ${isLow ? '#f87171' : '#4ade80'};">
                            ${isLow ? 'LOW STOCK' : 'HEALTHY'}
                        </span>
                    </td>
                    <td>
                        <button class="topbar-btn" style="padding: 0.3rem 0.75rem; font-size: 0.75rem;" onclick="restockIngredient('${item._id}', 10)">
                            <i class="fa-solid fa-plus"></i> Restock +10 ${item.unit}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-red);">Failed to load inventory</td></tr>`;
    }
}

async function restockIngredient(id, addQty) {
    try {
        const item = currentInventory.find(i => i._id === id);
        if (!item) return;

        const newQty = item.quantity + addQty;
        await DrinkoAPI.admin.updateInventory(id, { quantity: newQty });
        showAdminToast(`Restocked ${item.ingredient} (+${addQty} ${item.unit})`, 'fa-circle-check');
        loadInventory();
        loadOverviewKPIs();
    } catch (err) {
        showAdminToast(err.message, 'fa-triangle-exclamation');
    }
}

// --------------------------------------------------------------------------
// 6. Coupons
// --------------------------------------------------------------------------
async function loadCoupons() {
    const tbody = document.getElementById('coupons-table-body');
    if (!tbody) return;

    try {
        const res = await DrinkoAPI.admin.getCoupons();
        const coupons = res.data || [];

        tbody.innerHTML = coupons.map(c => `
            <tr>
                <td style="font-family: var(--font-mono); font-weight: 700; color: #ffcb77;">${c.code}</td>
                <td>${c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `$${c.discountValue} OFF`}</td>
                <td>$${(c.minimumOrder || 0).toFixed(2)}</td>
                <td>${c.usedCount || 0} times</td>
                <td><span style="color: ${c.isActive ? '#4ade80' : '#f87171'}; font-weight: 600;">${c.isActive ? 'Active' : 'Disabled'}</span></td>
                <td>
                    <button class="topbar-btn" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="showAdminToast('Coupon code ${c.code} copied!', 'fa-copy')">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No coupons created yet.</td></tr>`;
    }
}

// --------------------------------------------------------------------------
// 7. Tables & QR
// --------------------------------------------------------------------------
async function loadTables() {
    const tbody = document.getElementById('tables-table-body');
    if (!tbody) return;

    try {
        const res = await DrinkoAPI.get('/tables');
        const tables = res.data || [];

        tbody.innerHTML = tables.map(t => {
            const qrUrl = `${window.location.origin}/pages/order.html?table=${t.tableNumber}`;
            return `
                <tr>
                    <td style="font-weight: 700; color: #ffcb77;">Table #${t.tableNumber}</td>
                    <td>${t.capacity || 4} Guests</td>
                    <td>
                        <a href="${qrUrl}" target="_blank" style="color: var(--primary); text-decoration: none;">
                            <i class="fa-solid fa-qrcode"></i> View QR Ordering
                        </a>
                    </td>
                    <td>
                        <span style="font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 10px; background: ${t.currentOrder ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)'}; color: ${t.currentOrder ? '#fbbf24' : '#4ade80'};">
                            ${t.currentOrder ? 'OCCUPIED' : 'VACANT'}
                        </span>
                    </td>
                    <td><span style="color: #4ade80;">Active</span></td>
                    <td>
                        <button class="topbar-btn" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="window.open('${qrUrl}', '_blank')">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Open
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No tables configured.</td></tr>`;
    }
}

// --------------------------------------------------------------------------
// 8. Reviews Moderation
// --------------------------------------------------------------------------
async function loadReviews() {
    const tbody = document.getElementById('reviews-table-body');
    if (!tbody) return;

    try {
        const res = await DrinkoAPI.reviews.getAll('all');
        const reviews = res.data || [];

        tbody.innerHTML = reviews.map(r => `
            <tr>
                <td><strong>${r.customerName || 'Customer'}</strong></td>
                <td>${r.drinkName || 'Beverage'}</td>
                <td style="color: #f59e0b;"><i class="fa-solid fa-star"></i> ${r.rating}</td>
                <td style="font-style: italic; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">"${r.comment}"</td>
                <td><span style="color: #4ade80; font-weight: 600;">Approved</span></td>
                <td>
                    <button class="topbar-btn" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; color: #f87171;" onclick="deleteReview('${r._id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No reviews found.</td></tr>`;
    }
}

async function deleteReview(id) {
    if (!confirm('Are you sure you want to delete this customer review?')) return;
    try {
        await DrinkoAPI.delete(`/reviews/${id}`);
        showAdminToast('Review removed from public site', 'fa-trash');
        loadReviews();
    } catch (err) {
        showAdminToast(err.message, 'fa-triangle-exclamation');
    }
}

// ==========================================================================
// Customer Front & Font Toggle Handlers
// ==========================================================================
function initAdminToggles() {
    // Enable / Disable Customer Front button in admin
    const storefrontToggle = document.getElementById('btn-toggle-storefront');
    const storefrontLabel = document.getElementById('storefront-toggle-label');
    const storefrontLink = document.getElementById('link-customer-front');

    function updateStorefrontUI(isEnabled) {
        if (!storefrontToggle) return;
        if (isEnabled) {
            storefrontToggle.classList.add('active');
            storefrontToggle.classList.remove('disabled');
            if (storefrontLabel) storefrontLabel.textContent = 'Enabled';
            if (storefrontLink) {
                storefrontLink.classList.remove('disabled');
                storefrontLink.removeAttribute('tabindex');
                storefrontLink.setAttribute('href', '../index.html');
                storefrontLink.title = 'Open Customer Front in New Tab';
            }
        } else {
            storefrontToggle.classList.remove('active');
            storefrontToggle.classList.add('disabled');
            if (storefrontLabel) storefrontLabel.textContent = 'Disabled';
            if (storefrontLink) {
                storefrontLink.classList.add('disabled');
                storefrontLink.setAttribute('tabindex', '-1');
                storefrontLink.removeAttribute('href');
                storefrontLink.title = 'Customer Front button is disabled';
            }
        }
    }

    const savedState = localStorage.getItem('drinko_admin_customer_front_enabled');
    const isInitiallyEnabled = savedState === null || savedState === 'true';
    updateStorefrontUI(isInitiallyEnabled);

    if (storefrontToggle) {
        storefrontToggle.addEventListener('click', () => {
            const currentState = localStorage.getItem('drinko_admin_customer_front_enabled');
            const isCurrentlyEnabled = currentState === null || currentState === 'true';
            const nextState = !isCurrentlyEnabled;
            localStorage.setItem('drinko_admin_customer_front_enabled', String(nextState));
            updateStorefrontUI(nextState);
            showAdminToast(
                nextState 
                    ? 'Customer Front button enabled' 
                    : 'Customer Front button disabled',
                nextState ? 'fa-store' : 'fa-ban'
            );
        });
    }
}

