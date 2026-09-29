/**
 * Drinko Table Order Manager
 * Handles dine-in table orders, table verification, socket events and live kitchen tracking.
 */

document.addEventListener('DOMContentLoaded', () => {
    initTableOrder();
});

let currentTableNumber = '07';
let activeTableOrder = null;
let tableSocket = null;

function getTableNumberFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('table') || '07';
}

function initTableOrder() {
    currentTableNumber = getTableNumberFromUrl();
    const tableNumEl = document.getElementById('table-num');
    const drawerTableNumEl = document.getElementById('drawer-table-num');
    if (tableNumEl) tableNumEl.textContent = currentTableNumber;
    if (drawerTableNumEl) drawerTableNumEl.textContent = currentTableNumber;

    // Initialize Socket.io connection for real-time table tracking
    if (typeof io !== 'undefined') {
        tableSocket = io(window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:5000');
        
        tableSocket.on('connect', () => {
            console.log('[Table Socket] Connected for table', currentTableNumber);
        });

        tableSocket.on('order_status_updated', (data) => {
            console.log('[Table Order Status Live]:', data);
            if (activeTableOrder && (data.orderId === activeTableOrder._id || data.orderNumber === activeTableOrder.orderNumber)) {
                updateLiveStatusUI(data.status, data.note);
            }
        });
    }

    // Intercept checkout button on table page
    const tableCheckoutBtn = document.getElementById('table-checkout-btn');
    if (tableCheckoutBtn) {
        tableCheckoutBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!cart || cart.length === 0) {
                showToast('Your table order cart is empty!', 'fa-triangle-exclamation');
                return;
            }

            try {
                showToast('Sending table order to kitchen...', 'fa-spinner fa-spin');

                // Map frontend cart to order items payload
                const itemsPayload = cart.map(item => ({
                    product: item.drinkId || item.id,
                    productName: item.name,
                    size: item.size || 'Medium',
                    quantity: item.quantity,
                    customizations: {
                        ice: item.ice || '100% Ice',
                        sweetness: item.sweetness || '100% Sweet',
                        toppings: item.toppings || []
                    }
                }));

                const orderPayload = {
                    orderType: 'DINE_IN',
                    tableNumber: currentTableNumber,
                    items: itemsPayload,
                    paymentMethod: 'MOCK_RAZORPAY',
                    customerNotes: `Dine-in Order from Table #${currentTableNumber}`
                };

                const res = await DrinkoAPI.orders.create(orderPayload);
                if (res && res.data) {
                    activeTableOrder = res.data;
                    
                    // Join order room in Socket
                    if (tableSocket) {
                        tableSocket.emit('join_order_room', activeTableOrder._id);
                    }

                    showToast(`Order #${activeTableOrder.orderNumber} placed for Table #${currentTableNumber}! Kitchen is preparing your drinks. ☕`, 'fa-circle-check');
                    
                    // Clear cart & close drawer
                    cart = [];
                    if (typeof updateCartDisplay === 'function') updateCartDisplay();
                    if (typeof closeCartDrawer === 'function') closeCartDrawer();

                    // Display Live Order Progress card
                    displayLiveOrderCard(activeTableOrder);
                }
            } catch (err) {
                showToast(err.message || 'Could not place table order', 'fa-triangle-exclamation');
            }
        });
    }
}

function displayLiveOrderCard(order) {
    const card = document.getElementById('live-order-card');
    const orderNumEl = document.getElementById('live-order-number');
    if (!card) return;

    if (orderNumEl) orderNumEl.textContent = order.orderNumber || 'DRK-LIVE';
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth' });

    updateLiveStatusUI(order.orderStatus || 'PLACED');
}

function updateLiveStatusUI(status, note) {
    const pill = document.getElementById('live-status-pill');
    const desc = document.getElementById('live-status-desc');
    if (pill) pill.textContent = status;

    const steps = ['step-placed', 'step-confirmed', 'step-preparing', 'step-ready', 'step-completed'];
    const statusMap = {
        'PLACED': 0,
        'CONFIRMED': 1,
        'PREPARING': 2,
        'READY': 3,
        'COMPLETED': 4
    };

    const activeIndex = statusMap[status] !== undefined ? statusMap[status] : 0;

    steps.forEach((stepId, idx) => {
        const el = document.getElementById(stepId);
        if (!el) return;
        el.classList.remove('completed', 'active');
        if (idx < activeIndex) {
            el.classList.add('completed');
        } else if (idx === activeIndex) {
            el.classList.add('active');
        }
    });

    if (desc) {
        if (status === 'PLACED') {
            desc.innerHTML = '<i class="fa-solid fa-clock"></i> Order placed. Sent to kitchen display.';
        } else if (status === 'CONFIRMED') {
            desc.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #4ade80;"></i> Barista has confirmed your table order.';
        } else if (status === 'PREPARING') {
            desc.innerHTML = '<i class="fa-solid fa-fire" style="color: #f59e0b;"></i> Barista is currently brewing and frothing your drinks.';
        } else if (status === 'READY') {
            desc.innerHTML = '<i class="fa-solid fa-bell" style="color: #ffcb77;"></i> Your drinks are ready! A runner is delivering them to your table.';
        } else if (status === 'COMPLETED') {
            desc.innerHTML = '<i class="fa-solid fa-mug-hot" style="color: #4ade80;"></i> Served! Enjoy your handcrafted Drinko brew.';
        }
        if (note) {
            desc.innerHTML += ` <br><small style="color: #ffcb77;">${note}</small>`;
        }
    }

    if (typeof showToast === 'function') {
        showToast(`Table #${currentTableNumber} Order update: ${status}`, 'fa-bell');
    }
}
