/**
 * Drinko Profile Controller
 * Manages full authenticated customer profile experience, orders, addresses, rewards & settings.
 */

document.addEventListener('DOMContentLoaded', () => {
    initProfilePage();
});

let userProfile = null;

function showToast(message, iconClass = 'fa-circle-info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

async function initProfilePage() {
    setupTabSwitching();
    setupEventListeners();

    // Check if user is resetting password via token
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('resetToken');
    if (resetToken) {
        window.location.href = `../index.html?resetToken=${encodeURIComponent(resetToken)}`;
        return;
    }

    // Check if user is logged in
    const token = DrinkoAPI.getToken();
    if (!token) {
        // If not logged in, inform user and redirect or show prompt
        showToast('Please sign in to access your Drinko Profile', 'fa-arrow-right-to-bracket');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1200);
        return;
    }

    try {
        await loadUserProfile();
        loadOrders();
        loadFavourites();
        loadAddresses();
        loadLoyalty();
    } catch (err) {
        showToast('Session expired or error loading profile. Please sign in again.', 'fa-circle-exclamation');
        setTimeout(() => {
            DrinkoAPI.setToken(null);
            window.location.href = '../index.html';
        }, 1500);
    }
}

function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.profile-nav-item[data-tab]');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.tab;
            if (!targetId) return;

            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const panel = document.getElementById(targetId);
            if (panel) panel.classList.add('active');
        });
    });
}

async function loadUserProfile() {
    const res = await DrinkoAPI.profile.get();
    if (!res || !res.data) throw new Error('Could not load profile');
    userProfile = res.data;

    // Populate VIP card
    const userName = userProfile.name || 'Sophia Patel';
    document.getElementById('profile-name').textContent = userName;
    document.getElementById('profile-email').textContent = userProfile.email || '';
    document.getElementById('profile-phone').textContent = userProfile.phone || 'Phone not set';
    document.getElementById('profile-beans').textContent = userProfile.loyaltyPoints || 0;
    document.getElementById('profile-id').textContent = `ID: DRK-${(userProfile._id || '').slice(-6).toUpperCase()}`;

    // Compute and display luxury monogram initials
    const getInitials = (str) => {
        if (!str) return 'SP';
        const parts = str.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const initialsEl = document.getElementById('user-avatar-initials');
    if (initialsEl) initialsEl.textContent = getInitials(userName);

    const avatarEl = document.getElementById('user-avatar-img');
    const monogramEl = document.getElementById('user-avatar-monogram');

    if (avatarEl) {
        avatarEl.onerror = () => {
            avatarEl.style.display = 'none';
            if (monogramEl) monogramEl.style.display = 'flex';
        };
    }

    if (userProfile.profile && userProfile.profile.avatar) {
        if (avatarEl) {
            avatarEl.src = userProfile.profile.avatar;
            avatarEl.style.display = 'block';
        }
        if (monogramEl) monogramEl.style.display = 'none';
    } else {
        if (avatarEl) avatarEl.style.display = 'none';
        if (monogramEl) monogramEl.style.display = 'flex';
    }

    // Set Brew Preferences UI
    if (userProfile.preferences) {
        if (userProfile.preferences.preferredMilk) {
            document.querySelectorAll('#p-milk-options .pref-chip').forEach(c => {
                c.classList.toggle('active', c.textContent.trim().includes(userProfile.preferences.preferredMilk));
            });
        }
        if (userProfile.preferences.preferredSweetness) {
            document.querySelectorAll('#p-sweet-options .pref-chip').forEach(c => {
                c.classList.toggle('active', c.textContent.trim().includes(userProfile.preferences.preferredSweetness));
            });
        }
        if (userProfile.preferences.preferredSize) {
            document.querySelectorAll('#p-size-options .pref-chip').forEach(c => {
                c.classList.toggle('active', c.textContent.trim().includes(userProfile.preferences.preferredSize));
            });
        }
        if (userProfile.preferences.favouriteDrink) {
            const favDrinkInput = document.getElementById('pref-fav-drink');
            if (favDrinkInput) favDrinkInput.value = userProfile.preferences.favouriteDrink;
        }
    }

    // Set Notifications UI
    if (userProfile.notifications) {
        document.getElementById('notif-order-updates').checked = userProfile.notifications.orderUpdates !== false;
        document.getElementById('notif-promotions').checked = userProfile.notifications.promotions !== false;
        document.getElementById('notif-new-drinks').checked = userProfile.notifications.newDrinks !== false;
    }
}

async function loadOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;

    try {
        const res = await DrinkoAPI.orders.getMyOrders();
        const orders = res.data || [];

        if (orders.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px dashed var(--glass-border);">
                    <i class="fa-solid fa-mug-hot" style="font-size: 2.4rem; margin-bottom: 0.8rem; color: var(--primary);"></i>
                    <h3 style="color: #fff; margin-bottom: 0.4rem;">No Orders Yet</h3>
                    <p style="font-size: 0.9rem;">Your freshly steeped brews will appear here after placing your first order.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${orders.map(order => {
                    const itemsText = (order.items || []).map(i => `${i.productName || (i.product && i.product.name) || 'Artisan Drink'} (${i.size}) x${i.quantity}`).join(', ');
                    const statusClass = order.orderStatus === 'COMPLETED' ? 'delivered' : 'brewing';
                    const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                    return `
                        <div class="order-history-card" style="padding: 1.2rem;">
                            <div class="order-card-info" style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.3rem;">
                                    <span style="font-weight: 700; color: #ffcb77; font-family: monospace; font-size: 0.95rem;">${order.orderNumber}</span>
                                    <span class="order-status-tag ${statusClass}">${order.orderStatus}</span>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">${dateStr}</span>
                                </div>
                                <h4 style="font-size: 0.95rem; margin-bottom: 0.3rem; color: #fff;">${itemsText}</h4>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">
                                    Payment: <strong style="color: var(--primary);">${order.paymentStatus}</strong> • Mode: ${order.orderType || 'Delivery'}
                                </div>
                            </div>
                            <div class="order-card-meta">
                                <div class="order-card-price" style="font-size: 1.15rem;">$${(order.total || 0).toFixed(2)}</div>
                                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                                    <button class="btn-addr-sm" onclick="reorderOldOrder('${order._id}')">
                                        <i class="fa-solid fa-rotate-right"></i> Reorder
                                    </button>
                                    ${order.orderStatus === 'PLACED' ? `
                                        <button class="btn-addr-sm btn-addr-delete" onclick="cancelOrder('${order._id}')">
                                            Cancel
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<p style="color: var(--accent-red);">Failed to load orders: ${err.message}</p>`;
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
        await DrinkoAPI.orders.cancel(orderId);
        showToast('Order cancelled successfully', 'fa-circle-check');
        loadOrders();
    } catch (err) {
        showToast(err.message || 'Could not cancel order', 'fa-triangle-exclamation');
    }
}

async function reorderOldOrder(orderId) {
    try {
        const res = await DrinkoAPI.orders.reorder(orderId);
        showToast('Order duplicated to cart! Ready for checkout.', 'fa-circle-check');
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 1000);
    } catch (err) {
        showToast(err.message || 'Could not reorder', 'fa-triangle-exclamation');
    }
}

async function loadFavourites() {
    const grid = document.getElementById('profile-favs-grid');
    const badge = document.getElementById('fav-count-badge');
    if (!grid) return;

    try {
        const res = await DrinkoAPI.profile.getFavourites();
        const favs = res.data || [];
        if (badge) badge.textContent = `${favs.length} Saved`;

        if (favs.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                    <i class="fa-regular fa-heart" style="font-size: 2.2rem; color: var(--accent-red); margin-bottom: 0.8rem;"></i>
                    <p>You haven't saved any favourite drinks yet.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = favs.map(prod => `
            <div class="drink-card">
                <div class="card-img-wrapper">
                    <img src="${prod.image.startsWith('http') ? prod.image : '../' + prod.image}" alt="${prod.name}">
                    <span class="drink-category-tag">${prod.category}</span>
                </div>
                <div class="card-body">
                    <div class="card-title-row">
                        <h3>${prod.name}</h3>
                        <div class="rating-badge"><i class="fa-solid fa-star"></i> ${prod.rating || 4.9}</div>
                    </div>
                    <p class="card-desc">${prod.description}</p>
                    <div class="card-footer">
                        <span class="card-price">$${(prod.price || 0).toFixed(2)}</span>
                        <button class="btn btn-primary" style="padding: 0.4rem 0.9rem; font-size: 0.8rem;" onclick="removeFavouriteDrink('${prod._id}')">
                            <i class="fa-solid fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        grid.innerHTML = `<p style="color: var(--accent-red);">Failed to load favourites</p>`;
    }
}

async function removeFavouriteDrink(productId) {
    try {
        await DrinkoAPI.profile.removeFavourite(productId);
        showToast('Removed from favourites', 'fa-heart-crack');
        loadFavourites();
    } catch (err) {
        showToast(err.message, 'fa-triangle-exclamation');
    }
}

async function loadAddresses() {
    const container = document.getElementById('addresses-container');
    if (!container) return;

    try {
        const res = await DrinkoAPI.profile.getAddresses();
        const addresses = res.data || [];

        if (addresses.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px dashed var(--glass-border);">
                    <i class="fa-solid fa-location-dot" style="font-size: 2rem; color: var(--primary); margin-bottom: 0.6rem;"></i>
                    <p>No saved addresses found. Add your home or office address for 1-click delivery.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = addresses.map(addr => `
            <div class="address-card ${addr.isDefault ? 'default' : ''}">
                <div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
                        <span class="address-badge ${addr.isDefault ? 'default' : ''}">
                            <i class="fa-solid ${addr.label === 'Work' ? 'fa-briefcase' : (addr.label === 'Home' ? 'fa-house' : 'fa-location-dot')}"></i>
                            ${addr.label}
                        </span>
                        ${addr.isDefault ? '<span style="font-size: 0.72rem; color: #ffcb77; font-weight: 700;"><i class="fa-solid fa-check"></i> Default</span>' : ''}
                    </div>
                    <strong style="color: #fff; font-size: 0.95rem;">${addr.fullName}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.4rem;">${addr.phone}</div>
                    <p class="address-details">
                        ${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}<br>
                        ${addr.city}, ${addr.state} - ${addr.postalCode}
                    </p>
                </div>
                <div class="address-actions">
                    ${!addr.isDefault ? `
                        <button class="btn-addr-sm" onclick="setDefaultAddress('${addr._id}')">Make Default</button>
                    ` : ''}
                    <button class="btn-addr-sm btn-addr-delete" onclick="deleteAddress('${addr._id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<p style="color: var(--accent-red);">Failed to load addresses</p>`;
    }
}

async function setDefaultAddress(addrId) {
    try {
        await DrinkoAPI.profile.setDefaultAddress(addrId);
        showToast('Default address updated', 'fa-circle-check');
        loadAddresses();
    } catch (err) {
        showToast(err.message, 'fa-triangle-exclamation');
    }
}

async function deleteAddress(addrId) {
    if (!confirm('Are you sure you want to remove this address?')) return;
    try {
        await DrinkoAPI.profile.deleteAddress(addrId);
        showToast('Address removed', 'fa-trash');
        loadAddresses();
    } catch (err) {
        showToast(err.message, 'fa-triangle-exclamation');
    }
}

async function loadLoyalty() {
    try {
        const res = await DrinkoAPI.profile.getLoyalty();
        if (res.data) {
            const beans = res.data.loyaltyPoints || 0;
            document.getElementById('loyalty-bean-count').textContent = beans;
            const fillPct = Math.min(100, Math.round((beans / 300) * 100));
            document.getElementById('loyalty-bar-fill').style.width = `${fillPct}%`;

            const tbody = document.getElementById('loyalty-ledger-body');
            const txs = res.data.transactions || [];
            if (txs.length > 0) {
                tbody.innerHTML = txs.map(t => {
                    const isPlus = (t.pointsEarned || 0) > 0;
                    return `
                        <tr>
                            <td>${new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                            <td>${t.reason || 'Artisan Purchase'}</td>
                            <td class="${isPlus ? 'points-plus' : 'points-minus'}">
                                ${isPlus ? '+' + t.pointsEarned : '-' + t.pointsRedeemed} Beans
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        console.warn('Loyalty fetch note:', err.message);
    }
}

function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('btn-profile-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await DrinkoAPI.auth.logout();
            showToast('Signed out successfully. See you soon!', 'fa-arrow-right-from-bracket');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
        });
    }

    // Avatar Upload
    const avatarInput = document.getElementById('avatar-file-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                showToast('Uploading profile image...', 'fa-spinner fa-spin');
                const res = await DrinkoAPI.profile.uploadAvatar(formData);
                const avatarEl = document.getElementById('user-avatar-img');
                const monogramEl = document.getElementById('user-avatar-monogram');
                if (res && res.data && res.data.avatar) {
                    if (avatarEl) {
                        avatarEl.src = res.data.avatar;
                        avatarEl.style.display = 'block';
                    }
                    if (monogramEl) monogramEl.style.display = 'none';
                }
                showToast('Avatar updated successfully!', 'fa-circle-check');
            } catch (err) {
                showToast(err.message || 'Avatar upload failed', 'fa-triangle-exclamation');
            }
        });
    }

    // Address Modal Controls
    const addAddrBtn = document.getElementById('btn-add-address-modal');
    const addrModal = document.getElementById('address-modal');
    const closeAddrBtn = document.getElementById('close-addr-modal');
    const addrForm = document.getElementById('address-form');

    if (addAddrBtn && addrModal) {
        addAddrBtn.addEventListener('click', () => {
            addrModal.style.display = 'flex';
        });
    }
    if (closeAddrBtn && addrModal) {
        closeAddrBtn.addEventListener('click', () => {
            addrModal.style.display = 'none';
        });
    }
    if (addrForm) {
        addrForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                label: document.getElementById('addr-label').value,
                fullName: document.getElementById('addr-name').value.trim(),
                phone: document.getElementById('addr-phone').value.trim(),
                addressLine1: document.getElementById('addr-line1').value.trim(),
                addressLine2: document.getElementById('addr-line2').value.trim(),
                city: document.getElementById('addr-city').value.trim(),
                state: document.getElementById('addr-state').value.trim(),
                postalCode: document.getElementById('addr-zip').value.trim(),
                isDefault: document.getElementById('addr-default').checked
            };

            try {
                await DrinkoAPI.profile.addAddress(data);
                showToast('New address saved!', 'fa-circle-check');
                addrModal.style.display = 'none';
                addrForm.reset();
                loadAddresses();
            } catch (err) {
                showToast(err.message, 'fa-triangle-exclamation');
            }
        });
    }

    // Save Brew Preferences
    const savePrefBtn = document.getElementById('btn-save-preferences');
    if (savePrefBtn) {
        // Chip toggle handlers
        document.querySelectorAll('.pref-options .pref-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.parentElement.querySelectorAll('.pref-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            });
        });

        savePrefBtn.addEventListener('click', async () => {
            const milkChip = document.querySelector('#p-milk-options .pref-chip.active');
            const sweetChip = document.querySelector('#p-sweet-options .pref-chip.active');
            const sizeChip = document.querySelector('#p-size-options .pref-chip.active');
            const favDrink = document.getElementById('pref-fav-drink').value.trim();

            const preferences = {
                preferredMilk: milkChip ? milkChip.textContent.trim() : 'Oat Milk',
                preferredSweetness: sweetChip ? sweetChip.textContent.trim() : '50%',
                preferredSize: sizeChip ? sizeChip.textContent.trim() : 'Medium',
                favouriteDrink: favDrink
            };

            try {
                await DrinkoAPI.profile.updatePreferences(preferences);
                showToast('Brew preferences saved! ☕', 'fa-circle-check');
            } catch (err) {
                showToast(err.message, 'fa-triangle-exclamation');
            }
        });
    }

    // Save Notifications
    const saveNotifBtn = document.getElementById('btn-save-notifs');
    if (saveNotifBtn) {
        saveNotifBtn.addEventListener('click', async () => {
            const notifications = {
                orderUpdates: document.getElementById('notif-order-updates').checked,
                promotions: document.getElementById('notif-promotions').checked,
                newDrinks: document.getElementById('notif-new-drinks').checked
            };

            try {
                await DrinkoAPI.profile.updateNotifications(notifications);
                showToast('Notification settings updated!', 'fa-circle-check');
            } catch (err) {
                showToast(err.message, 'fa-triangle-exclamation');
            }
        });
    }

    // Change Password Form
    const changePwForm = document.getElementById('change-password-form');
    if (changePwForm) {
        changePwForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                showToast('New passwords do not match!', 'fa-triangle-exclamation');
                return;
            }

            try {
                await DrinkoAPI.profile.changePassword(currentPassword, newPassword, confirmPassword);
                showToast('Password changed successfully!', 'fa-circle-check');
                changePwForm.reset();
            } catch (err) {
                showToast(err.message || 'Password update failed', 'fa-triangle-exclamation');
            }
        });
    }

    // Logout all other devices
    const logoutAllBtn = document.getElementById('btn-logout-all');
    if (logoutAllBtn) {
        logoutAllBtn.addEventListener('click', async () => {
            if (!confirm('Sign out of all other devices and active web sessions?')) return;
            try {
                await DrinkoAPI.post('/profile/logout-all', {});
                showToast('All other sessions invalidated.', 'fa-circle-check');
            } catch (err) {
                showToast(err.message, 'fa-triangle-exclamation');
            }
        });
    }

    // Delete Account
    const deleteAccountBtn = document.getElementById('btn-delete-account');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            const password = prompt('Please enter your account password to confirm account deletion:');
            if (!password) return;

            try {
                await DrinkoAPI.profile.deleteAccount(password);
                showToast('Account permanently closed. Farewell!', 'fa-circle-info');
                DrinkoAPI.setToken(null);
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } catch (err) {
                showToast(err.message || 'Account deletion failed', 'fa-triangle-exclamation');
            }
        });
    }

    setupProfileDropdown();
}

function setupProfileDropdown() {
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleProfileDropdown();
        });
    }

    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('profile-dropdown-wrapper');
        const menu = document.getElementById('profile-dropdown-menu');
        if (menu && menu.classList.contains('active')) {
            if (!wrapper || !wrapper.contains(e.target)) {
                closeProfileDropdown();
            }
        }
    });
}

function toggleProfileDropdown() {
    const menu = document.getElementById('profile-dropdown-menu');
    if (!menu) return;
    if (menu.classList.contains('active')) {
        closeProfileDropdown();
    } else {
        openProfileDropdown();
    }
}

function openProfileDropdown() {
    renderProfileDropdown();
    const menu = document.getElementById('profile-dropdown-menu');
    if (menu) menu.classList.add('active');
}

function closeProfileDropdown() {
    const menu = document.getElementById('profile-dropdown-menu');
    if (menu) menu.classList.remove('active');
}

function renderProfileDropdown() {
    const menu = document.getElementById('profile-dropdown-menu');
    if (!menu) return;

    const u = userProfile || {
        name: 'Sophia Patel',
        email: 'sophia.patel@artisan.drinko.com',
        loyaltyPoints: 120,
        role: 'customer'
    };

    const getInitials = (str) => {
        if (!str) return 'SP';
        const parts = str.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    menu.innerHTML = `
        <div class="pdm-header">
            <div class="pdm-avatar-monogram">${getInitials(u.name)}</div>
            <div class="pdm-user-meta">
                <h4 class="pdm-name">${u.name}</h4>
                <span class="pdm-email">${u.email || ''}</span>
            </div>
            <div class="pdm-tier-badge">
                <i class="fa-solid fa-crown"></i> VIP
            </div>
        </div>

        <div class="pdm-beans-card">
            <div class="pdm-beans-header">
                <span><i class="fa-solid fa-mug-hot" style="color: #f59e0b;"></i> Loyalty Beans</span>
                <strong>${u.loyaltyPoints || 0} / 200</strong>
            </div>
            <div class="pdm-beans-bar">
                <div class="pdm-beans-bar-fill" style="width: ${Math.min(100, Math.round(((u.loyaltyPoints || 0) / 200) * 100))}%;"></div>
            </div>
        </div>

        <div class="pdm-nav-list">
            <button type="button" class="pdm-nav-item" onclick="closeProfileDropdown(); document.querySelector('.profile-nav-item[data-tab=\\'tab-orders\\']')?.click();">
                <i class="fa-solid fa-receipt pdm-nav-icon-inline"></i>
                <span>My Orders & Tracking</span>
            </button>
            <button type="button" class="pdm-nav-item" onclick="closeProfileDropdown(); document.querySelector('.profile-nav-item[data-tab=\\'tab-preferences\\']')?.click();">
                <i class="fa-solid fa-sliders pdm-nav-icon-inline"></i>
                <span>Brew Preferences</span>
            </button>
            <button type="button" class="pdm-nav-item" onclick="closeProfileDropdown(); document.querySelector('.profile-nav-item[data-tab=\\'tab-addresses\\']')?.click();">
                <i class="fa-solid fa-location-dot pdm-nav-icon-inline"></i>
                <span>Saved Addresses</span>
            </button>
            <a href="menu.html" class="pdm-nav-item" onclick="closeProfileDropdown()">
                <i class="fa-solid fa-compass pdm-nav-icon-inline"></i>
                <span>Explore Menu</span>
            </a>
        </div>

        <div class="pdm-footer">
            <button type="button" class="pdm-logout-btn" onclick="document.getElementById('btn-profile-logout')?.click()">
                <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
            </button>
        </div>
    `;
}

window.toggleProfileDropdown = toggleProfileDropdown;
window.closeProfileDropdown = closeProfileDropdown;
