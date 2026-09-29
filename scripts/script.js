// Helper to resolve local assets across root and subpages
function resolveImagePath(imgPath) {
    if (!imgPath) return 'asset/coffee-cup.png';
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
        return imgPath;
    }
    const isSubpage = window.location.pathname.includes('/pages/') || 
                      window.location.pathname.includes('\\pages\\');
    if (imgPath.startsWith('/uploads/') || imgPath.startsWith('uploads/')) {
        const cleanPath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
        return (isSubpage ? '../' : '') + cleanPath;
    }
    const filename = imgPath.split('/').pop().split('\\').pop();
    return (isSubpage ? '../asset/' : 'asset/') + filename;
}

const DRINKS_DATA = [
    {
        id: 1,
        name: "Hazelnut Cold Brew",
        category: "coffee",
        price: 5.90,
        rating: 4.9,
        reviewsCount: 342,
        calories: "140 kcal",
        description: "Slow-steeped 18-hour cold brew infused with organic roasted hazelnut syrup and topped with velvety oat milk.",
        image: "asset/coffee-cup.png",
        isPopular: true
    },
    {
        id: 2,
        name: "Matcha Cloud Latte",
        category: "tea",
        price: 6.40,
        rating: 4.95,
        reviewsCount: 512,
        calories: "160 kcal",
        description: "Ceremonial grade Uji Japanese matcha whisked with warm almond milk and topped with sweet cold foam cream.",
        image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=800&auto=format&fit=crop",
        isPopular: true
    },
    {
        id: 3,
        name: "Hibiscus Citrus Glow",
        category: "mocktail",
        price: 5.50,
        rating: 4.8,
        reviewsCount: 189,
        calories: "90 kcal",
        description: "Sparkling botanical infusion of Egyptian hibiscus flower, fresh squeezed blood orange, and fresh mint leaves.",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop",
        isPopular: false
    },
    {
        id: 4,
        name: "Brown Sugar Boba Milk",
        category: "smoothie",
        price: 6.80,
        rating: 4.98,
        reviewsCount: 780,
        calories: "290 kcal",
        description: "Warm caramelized tapioca pearls swirled with organic whole milk and topped with sea salt cream cheese layer.",
        image: "https://images.unsplash.com/photo-1558857563-b371033873b8?q=80&w=800&auto=format&fit=crop",
        isPopular: true
    },
    {
        id: 5,
        name: "Velvet Espresso Tonic",
        category: "coffee",
        price: 5.75,
        rating: 4.75,
        reviewsCount: 145,
        calories: "60 kcal",
        description: "Double shot of single-origin Ethiopian espresso poured over chilled artisanal tonic water and fresh rosemary twist.",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
        isPopular: false
    },
    {
        id: 6,
        name: "Wild Berry Acai Smoothie",
        category: "smoothie",
        price: 7.20,
        rating: 4.9,
        reviewsCount: 260,
        calories: "210 kcal",
        description: "Organic Amazonian acai blended with wild blueberries, strawberries, coconut water, and chia seed drizzle.",
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800&auto=format&fit=crop",
        isPopular: false
    },
    {
        id: 7,
        name: "Smoky Vanilla Caramel Latte",
        category: "coffee",
        price: 6.20,
        rating: 4.85,
        reviewsCount: 420,
        calories: "220 kcal",
        description: "Rich dark roast espresso layered with Madagascar vanilla bean syrup, steamed whole milk, and burnt caramel sauce.",
        image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800&auto=format&fit=crop",
        isPopular: false
    },
    {
        id: 8,
        name: "Peach Jasmine Ice Tea",
        category: "tea",
        price: 5.20,
        rating: 4.7,
        reviewsCount: 195,
        calories: "85 kcal",
        description: "Fragrant Jasmine green tea steeped fresh, combined with white peach nectar and aloe vera jelly bites.",
        image: "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?q=80&w=800&auto=format&fit=crop",
        isPopular: false
    }
];

// --------------------------------------------------------------------------
// 2. Application State
// --------------------------------------------------------------------------
let cart = [];
try {
    const savedCart = localStorage.getItem('drinko_cart');
    if (savedCart) cart = JSON.parse(savedCart);
} catch (e) {
    cart = [];
}

let favorites = [];
try {
    const savedFavs = localStorage.getItem('drinko_favs');
    if (savedFavs) favorites = JSON.parse(savedFavs);
} catch (e) {
    favorites = [];
}

function saveCart() {
    try {
        localStorage.setItem('drinko_cart', JSON.stringify(cart));
    } catch (e) {}
}

function saveFavorites() {
    try {
        localStorage.setItem('drinko_favs', JSON.stringify(favorites));
    } catch (e) {}
}

let activeCategory = 'all';
let searchKeyword = '';
let currentCustomizingDrink = null;
let discountApplied = false;

// Customization selection state
let selectedOptions = {
    size: 'Medium',
    ice: '100% Ice',
    sweetness: '100% Sweet',
    toppings: []
};

// --------------------------------------------------------------------------
// 3. DOM Elements
// --------------------------------------------------------------------------
const menuGrid = document.getElementById('menu-grid');
const categoryPills = document.getElementById('category-pills');
const searchInput = document.getElementById('search-input');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const favToggleBtn = document.getElementById('favorites-toggle-btn');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-drawer-overlay');
const cartCloseBtn = document.getElementById('cart-close-btn');
const favDrawer = document.getElementById('fav-drawer');
const favOverlay = document.getElementById('fav-drawer-overlay');
const favCloseBtn = document.getElementById('fav-close-btn');
const customModal = document.getElementById('custom-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalContent = document.getElementById('modal-content');
const cartCount = document.getElementById('cart-count');
const favCount = document.getElementById('fav-count');
const header = document.getElementById('header');
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

// --------------------------------------------------------------------------
// Featured Hero Showcase Data & Functions
// --------------------------------------------------------------------------
const HERO_DRINKS_DATA = [
    {
        id: 1,
        name: "Hazelnut Cold Brew",
        price: 5.90,
        badgeTag: "<i class=\"fa-solid fa-crown\"></i> #1 Bestseller",
        prepTime: "<i class=\"fa-regular fa-clock\"></i> 3 Min Prep",
        image: "asset/coffee-cup.png",
        description: "Slow-steeped 18-hour cold brew infused with organic roasted hazelnut syrup and topped with velvety oat milk.",
        tags: [
            "<i class=\"fa-solid fa-leaf\"></i> Vegan",
            "<i class=\"fa-solid fa-fire\"></i> 140 kcal",
            "<i class=\"fa-solid fa-snowflake\"></i> Served Iced"
        ],
        hotspots: [
            { text: "Single-Origin Arabica Espresso (18h Steep)", top: "22%", left: "28%", icon: "fa-seedling" },
            { text: "Velvety Oat Milk & Roasted Hazelnut", top: "48%", right: "22%", left: "auto", icon: "fa-droplet" },
            { text: "Artisanal Burnt Caramel Drizzle", top: "12%", right: "32%", left: "auto", icon: "fa-wand-magic-sparkles" }
        ]
    },
    {
        id: 2,
        name: "Matcha Cloud Latte",
        price: 6.40,
        badgeTag: "<i class=\"fa-solid fa-sparkles\"></i> Barista Favorite",
        prepTime: "<i class=\"fa-regular fa-clock\"></i> 4 Min Prep",
        image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=800&auto=format&fit=crop",
        description: "Ceremonial grade Uji Japanese matcha whisked with warm almond milk and topped with sweet cold foam cream.",
        tags: [
            "<i class=\"fa-solid fa-feather\"></i> Organic Uji Matcha",
            "<i class=\"fa-solid fa-fire\"></i> 160 kcal",
            "<i class=\"fa-solid fa-cloud\"></i> Sweet Foam"
        ],
        hotspots: [
            { text: "Grade A Ceremonial Uji Matcha", top: "25%", left: "30%", icon: "fa-leaf" },
            { text: "Silky Steamed Almond Milk", top: "50%", right: "20%", left: "auto", icon: "fa-droplet" },
            { text: "Sweet Vanilla Cold Foam Layer", top: "15%", left: "45%", icon: "fa-cloud" }
        ]
    },
    {
        id: 3,
        name: "Hibiscus Citrus Glow",
        price: 5.50,
        badgeTag: "<i class=\"fa-solid fa-bolt\"></i> Refreshing Mocktail",
        prepTime: "<i class=\"fa-regular fa-clock\"></i> 2 Min Prep",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop",
        description: "Sparkling botanical infusion of Egyptian hibiscus flower, fresh squeezed blood orange, and fresh mint leaves.",
        tags: [
            "<i class=\"fa-solid fa-lemon\"></i> Blood Orange",
            "<i class=\"fa-solid fa-fire\"></i> 90 kcal",
            "<i class=\"fa-solid fa-cubes-stacked\"></i> Sparkling Soda"
        ],
        hotspots: [
            { text: "Egyptian Hibiscus & Mint Infusion", top: "20%", left: "25%", icon: "fa-seedling" },
            { text: "Fresh Squeezed Blood Orange Nectar", top: "45%", right: "25%", left: "auto", icon: "fa-lemon" },
            { text: "Artisanal Sparkling Soda & Ice", top: "15%", right: "20%", left: "auto", icon: "fa-sparkles" }
        ]
    }
];

let currentHeroIndex = 0;

function setupHeroInteractions() {
    const tabs = document.querySelectorAll('.carousel-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const index = parseInt(tab.dataset.index);
            if (!isNaN(index)) {
                switchHeroDrink(index);
            }
        });
    });

    // Hero quick add to cart
    const heroAddBtn = document.getElementById('hero-add-btn');
    if (heroAddBtn) {
        heroAddBtn.addEventListener('click', () => {
            const currentDrink = HERO_DRINKS_DATA[currentHeroIndex];
            const fullDrink = (DRINKS_DATA && DRINKS_DATA.length > 0)
                ? (DRINKS_DATA.find(d => d.name.toLowerCase() === currentDrink.name.toLowerCase()) || currentDrink)
                : currentDrink;
            quickAddToCart(fullDrink);
        });
    }

    // Hero quick customize
    const heroCustBtn = document.getElementById('hero-customize-btn');
    const heroQuickCustBtn = document.getElementById('hero-quick-cust-btn');
    const handleCust = () => {
        const heroDrink = HERO_DRINKS_DATA[currentHeroIndex];
        const fullDrink = (DRINKS_DATA && DRINKS_DATA.length > 0)
            ? (DRINKS_DATA.find(d => d.name.toLowerCase() === heroDrink.name.toLowerCase()) || heroDrink)
            : heroDrink;
        openCustomizationModal(fullDrink);
    };
    if (heroCustBtn) heroCustBtn.addEventListener('click', handleCust);
    if (heroQuickCustBtn) heroQuickCustBtn.addEventListener('click', handleCust);

    // Hero Quick Tags filter
    const heroTags = document.querySelectorAll('.hero-tag');
    heroTags.forEach(tag => {
        tag.addEventListener('click', () => {
            const category = tag.dataset.tag;
            activeCategory = category;
            
            // update pill active states
            const pills = document.querySelectorAll('.pill-btn');
            pills.forEach(p => {
                if (p.dataset.category === category) p.classList.add('active');
                else p.classList.remove('active');
            });
            
            renderMenu();
            
            // Smooth scroll to menu
            const menuSection = document.getElementById('menu');
            if (menuSection) {
                menuSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });


}

function switchHeroDrink(index) {
    if (index === currentHeroIndex) return;
    currentHeroIndex = index;
    const data = HERO_DRINKS_DATA[index];

    // Update active tab styling
    document.querySelectorAll('.carousel-tab').forEach((tab, i) => {
        if (i === index) tab.classList.add('active');
        else tab.classList.remove('active');
    });

    const img = document.getElementById('hero-drink-img');
    const title = document.getElementById('hero-drink-title');
    const price = document.getElementById('hero-drink-price');
    const desc = document.getElementById('hero-drink-desc');
    const badgeTag = document.getElementById('hero-badge-tag');
    const prepTag = document.getElementById('hero-prep-tag');
    const tagsContainer = document.getElementById('hero-drink-tags');

    // Fade out image
    if (img) img.classList.add('fade-out');

    setTimeout(() => {
        if (img) {
            img.src = resolveImagePath(data.image);
            img.alt = data.name;
            img.classList.remove('fade-out');
            img.classList.add('fade-in');
            setTimeout(() => img.classList.remove('fade-in'), 350);
        }

        if (title) title.textContent = data.name;
        if (price) price.textContent = `$${data.price.toFixed(2)}`;
        if (desc) desc.textContent = data.description;
        if (badgeTag) badgeTag.innerHTML = data.badgeTag;
        if (prepTag) prepTag.innerHTML = data.prepTime;

        if (tagsContainer) {
            tagsContainer.innerHTML = data.tags.map(t => `<span class="mini-tag">${t}</span>`).join('');
        }

        // Update hotspots
        data.hotspots.forEach((hs, i) => {
            const hsEl = document.getElementById(`hotspot-${i + 1}`);
            if (hsEl) {
                hsEl.setAttribute('data-tooltip', hs.text);
                hsEl.style.top = hs.top;
                if (hs.left !== undefined) hsEl.style.left = hs.left;
                else hsEl.style.left = 'auto';
                if (hs.right !== undefined) hsEl.style.right = hs.right;
                else hsEl.style.right = 'auto';

                const dotIcon = hsEl.querySelector('.hotspot-dot i');
                if (dotIcon) {
                    dotIcon.className = `fa-solid ${hs.icon}`;
                }
            }
        });
    }, 200);
}

async function loadDynamicProducts() {
    if (typeof DrinkoAPI === 'undefined') return;
    try {
        const res = await DrinkoAPI.products.getAll();
        if (res && res.data && res.data.length > 0) {
            const dbDrinks = res.data.map(p => ({
                id: p._id,
                dbId: p._id,
                name: p.name,
                category: p.category,
                price: p.price,
                rating: p.rating || 4.9,
                reviewsCount: p.reviewsCount || 100,
                calories: p.calories || '150 kcal',
                description: p.description,
                image: p.image || 'asset/coffee-cup.png',
                isPopular: p.isFeatured || p.isBestseller
            }));
            DRINKS_DATA.length = 0;
            DRINKS_DATA.push(...dbDrinks);
            renderMenu();
            renderFavItems();
            updateBadges();
        }
    } catch (e) {
        console.warn('Could not load dynamic products from DB, using defaults:', e.message);
    }
}

function initCustomerSocket() {
    if (typeof io === 'undefined') return;
    try {
        const socket = io(window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:5000');
        socket.on('order_status_updated', (data) => {
            showToast(`Order #${data.orderNumber} status update: ${data.status} ☕`, 'fa-bell');
        });
    } catch (e) {}
}

// --------------------------------------------------------------------------
// 4. Initialization & Event Listeners
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initAuthAndProfile();
    renderMenu();
    loadDynamicProducts();
    initCustomerSocket();
    setupEventListeners();
    setupHeroInteractions();
    updateBadges();
    setupFaqAccordions();
    setupReviewsPage();
});

function setupEventListeners() {
    // Scroll header background toggle
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Mobile Nav Drawer Toggle & Overlay
    const navCloseBtn = document.getElementById('nav-close-btn');
    const navDrawerOverlay = document.getElementById('nav-drawer-overlay');
    
    const openNavDrawer = () => {
        if (navMenu) navMenu.classList.add('active');
        if (navDrawerOverlay) navDrawerOverlay.classList.add('active');
    };

    const closeNavDrawer = () => {
        if (navMenu) navMenu.classList.remove('active');
        if (navDrawerOverlay) navDrawerOverlay.classList.remove('active');
    };

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            if (navMenu && navMenu.classList.contains('active')) {
                closeNavDrawer();
            } else {
                openNavDrawer();
            }
        });
    }

    if (navCloseBtn) navCloseBtn.addEventListener('click', closeNavDrawer);
    if (navDrawerOverlay) navDrawerOverlay.addEventListener('click', closeNavDrawer);

    // Close nav drawer when clicking any nav-link inside drawer
    document.querySelectorAll('.nav-menu .nav-link').forEach(link => {
        link.addEventListener('click', closeNavDrawer);
    });

    // Profile Button Action -> Open Next-Level Profile Dashboard
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            closeNavDrawer();
            openProfileModal();
        });
    }

    // Category filter pills
    if (categoryPills) {
        categoryPills.addEventListener('click', (e) => {
            const btn = e.target.closest('.pill-btn');
            if (!btn) return;
            
            document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.dataset.category;
            renderMenu();
        });
    }

    // Search input filtering
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchKeyword = e.target.value.toLowerCase().trim();
            renderMenu();
        });
    }

    // Cart Drawer Controls
    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', () => {
            closeNavDrawer();
            openCartDrawer();
        });
    }
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

    // Favorites Drawer Controls
    if (favToggleBtn) {
        favToggleBtn.addEventListener('click', () => {
            closeNavDrawer();
            openFavDrawer();
        });
    }
    if (favCloseBtn) favCloseBtn.addEventListener('click', closeFavDrawer);
    if (favOverlay) favOverlay.addEventListener('click', closeFavDrawer);

    // Modal Close
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (customModal) {
        customModal.addEventListener('click', (e) => {
            if (e.target === customModal) closeModal();
        });
    }

    // Apply Promo Code
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    if (applyPromoBtn) applyPromoBtn.addEventListener('click', applyPromoCode);

    // Delivery Estimate Calculator
    const checkDeliveryBtn = document.getElementById('check-delivery-btn');
    if (checkDeliveryBtn) checkDeliveryBtn.addEventListener('click', calculateDeliveryTime);

    // Newsletter Form
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Subscribed! 20% discount code: DRINKO20', 'fa-circle-check');
            e.target.reset();
        });
    }

    // Checkout Button
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast('Your cart is empty!', 'fa-triangle-exclamation');
                return;
            }
            recordOrderAndAwardBeans();
            cart = [];
            discountApplied = false;
            const discountRow = document.getElementById('discount-row');
            if (discountRow) discountRow.style.display = 'none';
            updateCartDisplay();
            closeCartDrawer();
        });
    }
}

// --------------------------------------------------------------------------
// 5. Render Menu & Featured Grids
// --------------------------------------------------------------------------
function findDrink(target) {
    if (!target) return null;
    if (typeof target === 'object' && target.name) return target;
    const strId = String(target);
    return DRINKS_DATA.find(d => String(d.id) === strId || (d.dbId && String(d.dbId) === strId)) ||
           DRINKS_DATA.find(d => typeof target === 'string' && d.name.toLowerCase() === target.toLowerCase()) ||
           HERO_DRINKS_DATA.find(d => String(d.id) === strId) ||
           null;
}

function createDrinkCardHTML(drink) {
    const isFav = favorites.some(f => String(f) === String(drink.id) || (drink.dbId && String(f) === String(drink.dbId)));
    const safeId = String(drink.id).replace(/'/g, "\\'");
    return `
        <div class="drink-card">
            <div class="card-img-wrapper">
                <img src="${resolveImagePath(drink.image)}" alt="${drink.name}" loading="lazy">
                <button class="fav-icon-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${safeId}')" aria-label="Add to Wishlist">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
                <span class="drink-category-tag">${drink.category}</span>
            </div>
            <div class="card-body">
                <div class="card-title-row">
                    <h3>${drink.name}</h3>
                    <div class="rating-badge">
                        <i class="fa-solid fa-star"></i> ${drink.rating}
                    </div>
                </div>
                <p class="card-desc">${drink.description}</p>
                <div class="card-footer">
                    <span class="card-price">$${drink.price.toFixed(2)}</span>
                    <div class="card-actions">
                        <button class="btn-customize" onclick="openCustomizationModal('${safeId}')">Customize</button>
                        <button class="btn-add-cart" onclick="quickAddToCart('${safeId}')" aria-label="Add to cart">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderMenu() {
    const fullMenuGrid = document.getElementById('menu-grid');
    if (fullMenuGrid) {
        const filtered = DRINKS_DATA.filter(drink => {
            const matchesCategory = activeCategory === 'all' || drink.category === activeCategory;
            const matchesSearch = drink.name.toLowerCase().includes(searchKeyword) || 
                                  drink.description.toLowerCase().includes(searchKeyword);
            return matchesCategory && matchesSearch;
        });

        if (filtered.length === 0) {
            fullMenuGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                    <i class="fa-solid fa-mug-hot" style="font-size: 3rem; margin-bottom: 1rem; color: var(--primary);"></i>
                    <h3>No drinks found matching your search</h3>
                    <p>Try searching for coffee, matcha, boba, or mocktails!</p>
                </div>
            `;
        } else {
            fullMenuGrid.innerHTML = filtered.map(drink => createDrinkCardHTML(drink)).join('');
        }
    }

    const featuredGrid = document.getElementById('featured-grid');
    if (featuredGrid) {
        const featuredDrinks = DRINKS_DATA.filter(d => d.isPopular && d.id !== 7).slice(0, 4);
        featuredGrid.innerHTML = featuredDrinks.map(drink => createDrinkCardHTML(drink)).join('');
    }
}

// --------------------------------------------------------------------------
// 6. Drink Customization Modal Logic
// --------------------------------------------------------------------------
function openCustomizationModal(drinkId) {
    const drink = findDrink(drinkId);
    if (!drink) return;

    currentCustomizingDrink = drink;
    selectedOptions = {
        size: 'Medium',
        ice: '100% Ice',
        sweetness: '100% Sweet',
        toppings: []
    };

    renderModalContent();
    customModal.classList.add('active');
}

function closeModal() {
    customModal.classList.remove('active');
    currentCustomizingDrink = null;
}

function renderModalContent() {
    if (!currentCustomizingDrink) return;

    const basePrice = currentCustomizingDrink.price;
    const toppingsPrice = selectedOptions.toppings.reduce((sum, t) => sum + t.price, 0);
    const sizeMultiplier = selectedOptions.size === 'Large' ? 1.25 : (selectedOptions.size === 'Small' ? 0.9 : 1.0);
    const totalPrice = (basePrice * sizeMultiplier) + toppingsPrice;

    modalContent.innerHTML = `
        <div class="modal-img-container">
            <img src="${resolveImagePath(currentCustomizingDrink.image)}" alt="${currentCustomizingDrink.name}">
        </div>
        <div class="modal-details">
            <h2>${currentCustomizingDrink.name}</h2>
            <div class="modal-price">$${totalPrice.toFixed(2)}</div>
            <p style="font-size: 0.85rem; color: var(--text-sub); margin-bottom: 1.2rem;">${currentCustomizingDrink.description}</p>

            <!-- Size Option -->
            <div class="option-group">
                <label>Cup Size</label>
                <div class="chips-container">
                    <button class="chip-btn ${selectedOptions.size === 'Small' ? 'active' : ''}" onclick="selectOption('size', 'Small')">Small (-10%)</button>
                    <button class="chip-btn ${selectedOptions.size === 'Medium' ? 'active' : ''}" onclick="selectOption('size', 'Medium')">Medium (Standard)</button>
                    <button class="chip-btn ${selectedOptions.size === 'Large' ? 'active' : ''}" onclick="selectOption('size', 'Large')">Large (+25%)</button>
                </div>
            </div>

            <!-- Ice Level -->
            <div class="option-group">
                <label>Ice Level</label>
                <div class="chips-container">
                    <button class="chip-btn ${selectedOptions.ice === '0% No Ice' ? 'active' : ''}" onclick="selectOption('ice', '0% No Ice')">No Ice</button>
                    <button class="chip-btn ${selectedOptions.ice === '50% Ice' ? 'active' : ''}" onclick="selectOption('ice', '50% Ice')">Less Ice</button>
                    <button class="chip-btn ${selectedOptions.ice === '100% Ice' ? 'active' : ''}" onclick="selectOption('ice', '100% Ice')">Regular Ice</button>
                </div>
            </div>

            <!-- Sweetness Level -->
            <div class="option-group">
                <label>Sweetness</label>
                <div class="chips-container">
                    <button class="chip-btn ${selectedOptions.sweetness === '0% Unsweetened' ? 'active' : ''}" onclick="selectOption('sweetness', '0% Unsweetened')">Unsweetened</button>
                    <button class="chip-btn ${selectedOptions.sweetness === '50% Half Sweet' ? 'active' : ''}" onclick="selectOption('sweetness', '50% Half Sweet')">50% Sweet</button>
                    <button class="chip-btn ${selectedOptions.sweetness === '100% Sweet' ? 'active' : ''}" onclick="selectOption('sweetness', '100% Sweet')">100% Sweet</button>
                </div>
            </div>

            <!-- Extra Toppings -->
            <div class="option-group">
                <label>Add-ons & Toppings</label>
                <div class="chips-container">
                    <button class="chip-btn ${isToppingSelected('Boba Pearls') ? 'active' : ''}" onclick="toggleTopping('Boba Pearls', 0.75)">Tapioca Pearls (+$0.75)</button>
                    <button class="chip-btn ${isToppingSelected('Oat Milk') ? 'active' : ''}" onclick="toggleTopping('Oat Milk', 0.50)">Oat Milk (+$0.50)</button>
                    <button class="chip-btn ${isToppingSelected('Cold Foam') ? 'active' : ''}" onclick="toggleTopping('Cold Foam', 0.65)">Sweet Cold Foam (+$0.65)</button>
                    <button class="chip-btn ${isToppingSelected('Extra Shot') ? 'active' : ''}" onclick="toggleTopping('Extra Shot', 1.00)">Espresso Shot (+$1.00)</button>
                </div>
            </div>

            <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="addCustomizedToCart()">
                Add Customized Brew - $${totalPrice.toFixed(2)}
            </button>
        </div>
    `;
}

function selectOption(category, value) {
    selectedOptions[category] = value;
    renderModalContent();
}

function isToppingSelected(name) {
    return selectedOptions.toppings.some(t => t.name === name);
}

function toggleTopping(name, price) {
    const index = selectedOptions.toppings.findIndex(t => t.name === name);
    if (index > -1) {
        selectedOptions.toppings.splice(index, 1);
    } else {
        selectedOptions.toppings.push({ name, price });
    }
    renderModalContent();
}

function addCustomizedToCart() {
    if (!currentCustomizingDrink) return;

    const basePrice = currentCustomizingDrink.price;
    const toppingsPrice = selectedOptions.toppings.reduce((sum, t) => sum + t.price, 0);
    const sizeMultiplier = selectedOptions.size === 'Large' ? 1.25 : (selectedOptions.size === 'Small' ? 0.9 : 1.0);
    const itemPrice = (basePrice * sizeMultiplier) + toppingsPrice;

    const cartItem = {
        id: Date.now(),
        drinkId: currentCustomizingDrink.id,
        name: currentCustomizingDrink.name,
        image: currentCustomizingDrink.image,
        price: itemPrice,
        size: selectedOptions.size,
        ice: selectedOptions.ice,
        sweetness: selectedOptions.sweetness,
        toppings: selectedOptions.toppings.map(t => t.name),
        quantity: 1
    };

    cart.push(cartItem);
    updateCartDisplay();
    closeModal();
    showToast(`Added ${currentCustomizingDrink.name} to cart!`, 'fa-bag-shopping');
}

// --------------------------------------------------------------------------
// 7. Quick Add & Cart Management
// --------------------------------------------------------------------------
function quickAddToCart(drinkId) {
    const drink = findDrink(drinkId);
    if (!drink) return;

    const targetId = drink.id;
    // Check if simple un-customized item already exists in cart
    const existingIndex = cart.findIndex(i => String(i.drinkId) === String(targetId) && (!i.toppings || i.toppings.length === 0) && i.size === 'Medium');

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: Date.now(),
            drinkId: targetId,
            name: drink.name,
            image: drink.image,
            price: drink.price,
            size: 'Medium',
            ice: '100% Ice',
            sweetness: '100% Sweet',
            toppings: [],
            quantity: 1
        });
    }

    updateCartDisplay();
    showToast(`Added ${drink.name} to cart!`, 'fa-bag-shopping');
}

function updateCartDisplay() {
    saveCart();
    updateBadges();
    renderCartItems();
    calculateCartTotals();
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                <i class="fa-solid fa-cart-shopping" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--primary);"></i>
                <p>Your brew cart is empty</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${resolveImagePath(item.image)}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-tags">
                    ${item.size} • ${item.ice} • ${item.sweetness}
                    ${item.toppings.length > 0 ? `<br>+ ${item.toppings.join(', ')}` : ''}
                </div>
                <div class="cart-item-bottom">
                    <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
                        <span class="qty-count">${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function changeQty(itemId, delta) {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== itemId);
    }
    updateCartDisplay();
}

function calculateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal > 0 ? 2.50 : 0.00;
    const discount = discountApplied ? (subtotal * 0.20) : 0.00;
    const total = subtotal + deliveryFee - discount;

    const subtotalEl = document.getElementById('cart-subtotal');
    const deliveryEl = document.getElementById('cart-delivery');
    const discountEl = document.getElementById('cart-discount');
    const totalEl = document.getElementById('cart-total');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (deliveryEl) deliveryEl.textContent = `$${deliveryFee.toFixed(2)}`;
    if (discountEl) discountEl.textContent = `-$${discount.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

async function applyPromoCode() {
    const input = document.getElementById('promo-input');
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (!code) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
        if (typeof DrinkoAPI !== 'undefined') {
            const res = await DrinkoAPI.coupons.validate(code, subtotal);
            if (res && res.data) {
                discountApplied = true;
                const discountRow = document.getElementById('discount-row');
                if (discountRow) discountRow.style.display = 'flex';
                calculateCartTotals();
                showToast(`Promo ${code} applied! (-$${(res.data.discount || 0).toFixed(2)})`, 'fa-percent');
                return;
            }
        }
    } catch (err) {
        // Fallback for offline or local preview
        if (code === 'DRINKO20' || code === 'DRINKO10' || code === 'FIRSTORDER' || code === 'WELCOME50') {
            discountApplied = true;
            const discountRow = document.getElementById('discount-row');
            if (discountRow) discountRow.style.display = 'flex';
            calculateCartTotals();
            showToast(`Promo ${code} Applied!`, 'fa-percent');
            return;
        }
        showToast(err.message || 'Invalid Promo Code. Try DRINKO10 or DRINKO20', 'fa-triangle-exclamation');
    }
}

// --------------------------------------------------------------------------
// 8. Wishlist / Favorites Logic
// --------------------------------------------------------------------------
function toggleFavorite(event, drinkId) {
    if (event && event.stopPropagation) event.stopPropagation();
    const strId = String(drinkId);
    const index = favorites.findIndex(f => String(f) === strId);

    if (index > -1) {
        favorites.splice(index, 1);
        showToast('Removed from saved drinks', 'fa-heart-crack');
    } else {
        favorites.push(strId);
        showToast('Saved to your wishlist!', 'fa-heart');
    }

    saveFavorites();
    renderMenu();
    updateBadges();
    renderFavItems();
}

function renderFavItems() {
    const container = document.getElementById('fav-items-container');
    if (!container) return;

    if (favorites.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                <i class="fa-regular fa-heart" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--accent-red);"></i>
                <p>No saved drinks yet</p>
            </div>
        `;
        return;
    }

    const favDrinks = DRINKS_DATA.filter(d => favorites.some(f => String(f) === String(d.id) || (d.dbId && String(f) === String(d.dbId))));

    if (favDrinks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                <i class="fa-regular fa-heart" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--accent-red);"></i>
                <p>No saved drinks yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = favDrinks.map(drink => {
        const safeId = String(drink.id).replace(/'/g, "\\'");
        return `
            <div class="cart-item">
                <img src="${resolveImagePath(drink.image)}" alt="${drink.name}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${drink.name}</div>
                    <div class="cart-item-tags">${drink.category} • ${drink.rating} ★</div>
                    <div class="cart-item-bottom">
                        <span class="cart-item-price">$${drink.price.toFixed(2)}</span>
                        <button class="btn-quick-add" onclick="quickAddToCart('${safeId}')">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --------------------------------------------------------------------------
// 9. Drawers & Badges
// --------------------------------------------------------------------------
function openCartDrawer() {
    cartDrawer.classList.add('active');
    cartOverlay.classList.add('active');
}

function closeCartDrawer() {
    cartDrawer.classList.remove('active');
    cartOverlay.classList.remove('active');
}

function openFavDrawer() {
    renderFavItems();
    favDrawer.classList.add('active');
    favOverlay.classList.add('active');
}

function closeFavDrawer() {
    favDrawer.classList.remove('active');
    favOverlay.classList.remove('active');
}

function updateBadges() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('cart-count');
    const favCountEl = document.getElementById('fav-count');
    if (cartCountEl) cartCountEl.textContent = totalItems;
    if (favCountEl) favCountEl.textContent = favorites.length;
}

// --------------------------------------------------------------------------
// 10. Delivery Calculator & Toast System
// --------------------------------------------------------------------------
function calculateDeliveryTime() {
    const inputEl = document.getElementById('delivery-zip');
    const resultDiv = document.getElementById('delivery-result');
    if (!inputEl || !resultDiv) return;
    const input = inputEl.value.trim();

    if (!input) {
        resultDiv.innerHTML = `<span style="color: var(--accent-red);">Please enter a valid zip code or street.</span>`;
        return;
    }

    const minutes = Math.floor(Math.random() * 8) + 12; // 12 to 19 mins
    resultDiv.className = 'delivery-result success';
    resultDiv.innerHTML = `<i class="fa-solid fa-bolt"></i> Delivery to "${input}" available in ~<strong>${minutes} minutes</strong>!`;
}

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
    }, 3000);
}

// --------------------------------------------------------------------------
// 11. FAQ Accordions (Delivery Page)
// --------------------------------------------------------------------------
function setupFaqAccordions() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            if (!item) return;
            const wasActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            if (!wasActive) item.classList.add('active');
        });
    });
}

// --------------------------------------------------------------------------
// 12. Reviews Management System (Reviews Page)
// --------------------------------------------------------------------------
const DEFAULT_REVIEWS = [
    {
        id: 1,
        name: "Sophia Martinez",
        drink: "Matcha Cloud Cold Foam",
        category: "tea",
        rating: 5,
        date: "2 days ago",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
        text: "The Matcha Cloud Cold Foam is out of this world! Delivered in under 12 minutes still frosty and smooth. Hands down my favorite daily morning ritual."
    },
    {
        id: 2,
        name: "Marcus Vance",
        drink: "Hazelnut Cold Brew",
        category: "coffee",
        rating: 5,
        date: "5 days ago",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
        text: "I love how customizable every drink is on Drinko. Selecting sweetness levels and oat milk options takes 2 clicks. Top-notch customer experience!"
    },
    {
        id: 3,
        name: "Elena Rostova",
        drink: "Hibiscus Citrus Mocktail",
        category: "mocktail",
        rating: 5,
        date: "1 week ago",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop",
        text: "The Hibiscus Citrus Mocktail is insanely refreshing during hot afternoon work hours. The packaging is plastic-free too. 10/10 recommendation!"
    },
    {
        id: 4,
        name: "Liam Chen",
        drink: "Brown Sugar Boba Milk",
        category: "smoothie",
        rating: 5,
        date: "1 week ago",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
        text: "The boba pearls are so fresh and warm while the cream cheese foam is perfectly salted. Beats every brick-and-mortar boba shop in the city!"
    },
    {
        id: 5,
        name: "Chloe Kensington",
        drink: "Velvet Espresso Tonic",
        category: "coffee",
        rating: 4,
        date: "2 weeks ago",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
        text: "Incredible blend of tonic effervescence and dark Ethiopian roast. Crisp, citrusy, and gave me an instant clean energy boost."
    },
    {
        id: 6,
        name: "David Thornton",
        drink: "Wild Berry Acai Smoothie",
        category: "smoothie",
        rating: 5,
        date: "3 weeks ago",
        image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=200&auto=format&fit=crop",
        text: "Ordered post-workout and it arrived within 13 minutes cold and perfectly thick. Rich acai taste without being overly sugary."
    }
];

function setupReviewsPage() {
    const reviewsGrid = document.getElementById('reviews-grid');
    if (!reviewsGrid) return;

    // Load custom reviews from localStorage
    let customReviews = [];
    try {
        const saved = localStorage.getItem('drinko_user_reviews');
        if (saved) customReviews = JSON.parse(saved);
    } catch (e) {
        customReviews = [];
    }

    let currentReviewRating = 5;
    let reviewFilter = 'all';

    const renderAllReviews = () => {
        const all = [...customReviews, ...DEFAULT_REVIEWS];
        const filtered = all.filter(r => {
            if (reviewFilter === 'all') return true;
            if (reviewFilter === '5-star') return r.rating === 5;
            return r.category === reviewFilter;
        });

        if (filtered.length === 0) {
            reviewsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                    <p>No reviews match this filter.</p>
                </div>
            `;
            return;
        }

        reviewsGrid.innerHTML = filtered.map(r => `
            <div class="review-card glass-card">
                <div class="review-header">
                    <img src="${r.image}" alt="${r.name}" loading="lazy">
                    <div>
                        <h4>${r.name} <span class="verified-badge"><i class="fa-solid fa-circle-check"></i> Verified</span></h4>
                        <div class="stars">
                            ${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}
                            ${'<i class="fa-regular fa-star"></i>'.repeat(5 - r.rating)}
                        </div>
                    </div>
                </div>
                <span class="review-drink-tag"><i class="fa-solid fa-mug-hot"></i> ${r.drink}</span>
                <p class="review-text">"${r.text}"</p>
                <div style="margin-top: 0.6rem; font-size: 0.75rem; color: var(--text-muted);">${r.date || 'Recently'}</div>
            </div>
        `).join('');
    };

    renderAllReviews();

    // Review Filter Pills
    document.querySelectorAll('.review-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.review-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            reviewFilter = btn.dataset.filter;
            renderAllReviews();
        });
    });

    // Star Picker in Review Form
    const stars = document.querySelectorAll('#review-star-picker i');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const val = parseInt(star.dataset.val);
            currentReviewRating = val;
            stars.forEach((s, idx) => {
                if (idx < val) s.classList.add('active');
                else s.classList.remove('active');
            });
        });
    });

    // Review Form Submit
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('review-author').value.trim();
            const drink = document.getElementById('review-drink-select').value;
            const text = document.getElementById('review-message').value.trim();

            if (!name || !text) {
                showToast('Please fill out your name and review', 'fa-triangle-exclamation');
                return;
            }

            const newRev = {
                id: Date.now(),
                name: name,
                drink: drink,
                category: drink.toLowerCase().includes('coffee') || drink.toLowerCase().includes('brew') ? 'coffee' : 
                          drink.toLowerCase().includes('tea') || drink.toLowerCase().includes('matcha') ? 'tea' :
                          drink.toLowerCase().includes('mocktail') || drink.toLowerCase().includes('hibiscus') ? 'mocktail' : 'smoothie',
                rating: currentReviewRating,
                date: 'Just now',
                image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
                text: text
            };

            customReviews.unshift(newRev);
            try {
                localStorage.setItem('drinko_user_reviews', JSON.stringify(customReviews));
            } catch (err) {}

            renderAllReviews();
            reviewForm.reset();
            currentReviewRating = 5;
            stars.forEach(s => s.classList.add('active'));
            showToast('Thank you! Your review has been published.', 'fa-circle-check');
        });
    }
}

// --------------------------------------------------------------------------
// 13. Profile Dashboard & Next-Level Authentication System
// --------------------------------------------------------------------------
const STORAGE_KEY_USER = 'drinko_current_user';
const STORAGE_KEY_USERS = 'drinko_users_db';

let currentUser = null;
let activeAuthTab = 'signin';
let activeDashboardSubtab = 'orders';

async function initAuthAndProfile() {
    try {
        if (typeof DrinkoAPI !== 'undefined' && DrinkoAPI.getToken()) {
            try {
                const meRes = await DrinkoAPI.auth.getMe();
                if (meRes && meRes.data) {
                    const u = meRes.data;
                    currentUser = {
                        name: u.name,
                        email: u.email,
                        phone: u.phone,
                        role: u.role,
                        tier: 'Gold Connoisseur',
                        beans: u.loyaltyPoints || 0,
                        orders: u.orders || [],
                        preferences: u.preferences || {}
                    };
                    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
                }
            } catch (err) {
                DrinkoAPI.setToken(null);
                currentUser = null;
            }
        } else {
            const storedUser = localStorage.getItem(STORAGE_KEY_USER);
            if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed && (parsed.email === 'alex.morgan@drinko.com' || parsed.name === 'Alex Morgan')) {
                    localStorage.removeItem(STORAGE_KEY_USER);
                    currentUser = null;
                } else {
                    currentUser = parsed;
                }
            } else {
                currentUser = null;
            }
        }
    } catch (e) {
        currentUser = null;
    }

    updateProfileButtonState();
    setupProfileModalListeners();
}

function updateProfileButtonState() {
    const profileBtn = document.getElementById('profile-btn');
    if (!profileBtn) return;

    if (currentUser) {
        profileBtn.classList.add('logged-in');
        profileBtn.setAttribute('title', `${currentUser.name} (${currentUser.beans} Beans)`);
        profileBtn.setAttribute('aria-label', `${currentUser.name}'s Profile`);
    } else {
        profileBtn.classList.remove('logged-in');
        profileBtn.setAttribute('title', 'Sign In / Sign Up');
        profileBtn.setAttribute('aria-label', 'User Profile Sign In');
    }
}

function setupProfileModalListeners() {
    const closeBtn = document.getElementById('profile-modal-close-btn');
    const overlay = document.getElementById('profile-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeProfileModal);
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeProfileModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
            closeProfileModal();
        }
    });
}

function openProfileModal() {
    renderProfileModal();
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.add('active');
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.remove('active');
}

function saveCurrentUser() {
    try {
        if (currentUser) {
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
            
            // Also update in users db
            let users = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS)) || [];
            const idx = users.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
            if (idx > -1) {
                users[idx] = currentUser;
            } else {
                users.push(currentUser);
            }
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
        } else {
            localStorage.removeItem(STORAGE_KEY_USER);
        }
    } catch (err) {}
}

function getInitials(name) {
    if (!name) return 'DK';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function scrollToMenuOrNavigate() {
    const menuEl = document.getElementById('menu');
    if (menuEl) {
        menuEl.scrollIntoView({ behavior: 'smooth' });
    } else {
        const isSubpage = window.location.pathname.includes('/pages/') || window.location.pathname.includes('\\pages\\');
        window.location.href = isSubpage ? 'menu.html' : 'pages/menu.html';
    }
}

function switchAuthTab(tab) {
    activeAuthTab = tab;
    renderProfileModal();
}

function switchDashboardSubtab(subtab) {
    activeDashboardSubtab = subtab;
    renderProfileModal();
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPw = input.type === 'password';
    input.type = isPw ? 'text' : 'password';
    btn.innerHTML = isPw ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
}

function selectPrefChip(btn, type) {
    const container = btn.parentElement;
    if (!container) return;
    container.querySelectorAll('.pref-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
}

function saveUserPreferences() {
    if (!currentUser) return;
    const activeMilk = document.querySelector('#pref-milk-options .pref-chip.active');
    const activeSweet = document.querySelector('#pref-sweet-options .pref-chip.active');
    if (!currentUser.preferences) currentUser.preferences = {};
    if (activeMilk) currentUser.preferences.milk = activeMilk.textContent.trim();
    if (activeSweet) currentUser.preferences.sweetness = activeSweet.textContent.trim();
    saveCurrentUser();
    showToast('Brew preferences updated! ☕', 'fa-circle-check');
}

async function recordOrderAndAwardBeans() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderItemsSummary = cart.map(i => `${i.name} (${i.size || 'Medium'}) x${i.quantity}`).join(', ');

    try {
        if (typeof DrinkoAPI !== 'undefined') {
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

            const res = await DrinkoAPI.orders.create({
                orderType: 'DELIVERY',
                items: itemsPayload,
                paymentMethod: 'MOCK_RAZORPAY',
                couponCode: discountApplied ? 'DRINKO20' : null
            });

            if (res && res.data) {
                const createdOrder = res.data;
                const newOrder = {
                    id: createdOrder.orderNumber,
                    date: 'Just now',
                    items: orderItemsSummary,
                    total: createdOrder.total,
                    status: 'brewing',
                    beansEarned: 15
                };

                if (currentUser) {
                    if (!currentUser.orders) currentUser.orders = [];
                    currentUser.orders.unshift(newOrder);
                    currentUser.beans = (currentUser.beans || 0) + 15;
                    saveCurrentUser();
                    updateProfileButtonState();
                    showToast(`Order #${createdOrder.orderNumber} Placed! +15 Loyalty Beans credited (Balance: ${currentUser.beans}) ☕`, 'fa-circle-check');
                } else {
                    showToast(`Order #${createdOrder.orderNumber} Placed Successfully! Preparing your drinks...`, 'fa-circle-check');
                }
                return;
            }
        }
    } catch (apiErr) {
        console.warn('Backend order placement note, falling back:', apiErr.message);
    }

    // Fallback if network is offline
    const fallbackId = `DK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
        id: fallbackId,
        date: 'Just now',
        items: orderItemsSummary,
        total: subtotal > 0 ? (subtotal + (discountApplied ? -subtotal * 0.2 : 0) + 2.50) : 0,
        status: 'brewing',
        beansEarned: 15
    };

    if (currentUser) {
        if (!currentUser.orders) currentUser.orders = [];
        currentUser.orders.unshift(newOrder);
        currentUser.beans = (currentUser.beans || 0) + 15;
        saveCurrentUser();
        updateProfileButtonState();
        showToast(`Order Placed! +15 Loyalty Beans credited (Balance: ${currentUser.beans}) ☕`, 'fa-circle-check');
    } else {
        showToast('Order Placed Successfully! Preparing your drinks...', 'fa-circle-check');
    }
}

async function handleSignInSubmit(e) {
    e.preventDefault();
    const emailEl = document.getElementById('signin-email');
    const passwordEl = document.getElementById('signin-password');
    if (!emailEl || !passwordEl) return;

    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();

    if (!email || !password) {
        showToast('Please enter both your email and password', 'fa-triangle-exclamation');
        return;
    }

    try {
        showToast('Signing in...', 'fa-spinner fa-spin');
        if (typeof DrinkoAPI !== 'undefined') {
            const res = await DrinkoAPI.auth.login(email, password);
            if (res && res.user) {
                currentUser = {
                    name: res.user.name,
                    email: res.user.email,
                    phone: res.user.phone,
                    role: res.user.role,
                    tier: 'Gold Connoisseur',
                    beans: res.user.loyaltyPoints || 0,
                    orders: res.user.orders || [],
                    preferences: res.user.preferences || {}
                };
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
                updateProfileButtonState();
                showToast(`Welcome back, ${currentUser.name}! ☕`, 'fa-circle-check');
                renderProfileModal();
                return;
            }
        }
    } catch (err) {
        showToast(err.message || 'Login failed. Please check credentials.', 'fa-triangle-exclamation');
        return;
    }
}

async function handleSignUpSubmit(e) {
    e.preventDefault();
    const nameEl = document.getElementById('signup-name');
    const emailEl = document.getElementById('signup-email');
    const passwordEl = document.getElementById('signup-password');
    const prefSelect = document.getElementById('signup-pref');

    if (!nameEl || !emailEl || !passwordEl) return;

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();
    const pref = prefSelect ? prefSelect.value : 'Cold Brew & Nitro Specialist';

    if (!name || !email || !password) {
        showToast('Please fill out all fields', 'fa-triangle-exclamation');
        return;
    }

    try {
        showToast('Creating artisan account...', 'fa-spinner fa-spin');
        if (typeof DrinkoAPI !== 'undefined') {
            const res = await DrinkoAPI.auth.register({ name, email, password, phone: '+91 9876543210' });
            if (res && res.user) {
                currentUser = {
                    name: res.user.name,
                    email: res.user.email,
                    phone: res.user.phone,
                    role: res.user.role,
                    tier: 'Gold Connoisseur',
                    beans: res.user.loyaltyPoints || 100,
                    orders: [],
                    favoriteStyle: pref,
                    preferences: {}
                };
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
                updateProfileButtonState();
                showToast(`Welcome to Drinko, ${currentUser.name}! +100 Loyalty Beans credited 🎉`, 'fa-sparkles');
                renderProfileModal();
                return;
            }
        }
    } catch (err) {
        showToast(err.message || 'Registration failed. Please check details.', 'fa-triangle-exclamation');
    }
}

async function handleSignOut() {
    currentUser = null;
    try {
        localStorage.removeItem(STORAGE_KEY_USER);
        if (typeof DrinkoAPI !== 'undefined') {
            await DrinkoAPI.auth.logout();
        }
    } catch (err) {}
    activeAuthTab = 'signin';
    updateProfileButtonState();
    showToast('Signed out successfully. See you soon!', 'fa-arrow-right-from-bracket');
    renderProfileModal();
}

function renderOrdersListHTML() {
    if (!currentUser.orders || currentUser.orders.length === 0) {
        return `
            <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: var(--radius-sm); border: 1px dashed var(--glass-border);">
                <i class="fa-solid fa-mug-hot" style="font-size: 2rem; margin-bottom: 0.75rem; color: var(--primary);"></i>
                <p>No orders yet. Place your first artisan brew order to start collecting Loyalty Beans!</p>
            </div>
        `;
    }
    return `
        <div class="orders-list">
            ${currentUser.orders.map(order => `
                <div class="order-history-card">
                    <div class="order-card-info">
                        <h4>${order.items}</h4>
                        <p><i class="fa-regular fa-calendar-days"></i> ${order.date} • Order #${order.id}</p>
                    </div>
                    <div class="order-card-meta">
                        <div class="order-card-price">$${typeof order.total === 'number' ? order.total.toFixed(2) : order.total}</div>
                        <span class="order-status-tag ${order.status === 'delivered' ? 'delivered' : 'brewing'}">
                            ${order.status === 'delivered' ? '<i class="fa-solid fa-check"></i> Delivered' : '<i class="fa-solid fa-fire"></i> Brewing'}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderPreferencesHTML() {
    const prefs = currentUser.preferences || { milk: 'Oat Milk (Barista Edition)', sweetness: 'Half Sweet (50%)' };
    return `
        <div class="preferences-box">
            <div class="pref-row">
                <label>Default Milk Choice</label>
                <div class="pref-options" id="pref-milk-options">
                    ${['Oat Milk (Barista Edition)', 'Almond Milk', 'Organic Whole Milk', 'Coconut Milk'].map(m => `
                        <button type="button" class="pref-chip ${prefs.milk === m ? 'active' : ''}" onclick="selectPrefChip(this, 'milk')">${m}</button>
                    `).join('')}
                </div>
            </div>

            <div class="pref-row">
                <label>Default Sweetness</label>
                <div class="pref-options" id="pref-sweet-options">
                    ${['Unsweetened (0%)', 'Half Sweet (50%)', 'Standard (100%)', 'Honey Infused'].map(s => `
                        <button type="button" class="pref-chip ${prefs.sweetness === s ? 'active' : ''}" onclick="selectPrefChip(this, 'sweetness')">${s}</button>
                    `).join('')}
                </div>
            </div>

            <button type="button" class="btn-save-pref" onclick="saveUserPreferences()">
                <i class="fa-solid fa-floppy-disk"></i> Save Brew Preferences
            </button>
        </div>
    `;
}

function renderProfileModal() {
    const container = document.getElementById('profile-modal-content');
    if (!container) return;

    if (currentUser) {
        // Authenticated Dashboard
        container.innerHTML = `
            <div class="profile-dashboard">
                <!-- VIP Pass Card -->
                <div class="vip-pass-card">
                    <div class="vip-card-top">
                        <div class="vip-chip-wrap">
                            <i class="fa-solid fa-microchip vip-chip"></i>
                            <span class="vip-pass-label">DRINKO ARTISAN PASS</span>
                        </div>
                        <div class="vip-tier-badge">
                            <i class="fa-solid fa-crown"></i>
                            <span>${currentUser.tier || 'Gold Connoisseur'}</span>
                        </div>
                    </div>

                    <div class="vip-card-middle">
                        <div class="vip-avatar-initials">
                            ${getInitials(currentUser.name)}
                        </div>
                        <div class="vip-user-info">
                            <h3>${currentUser.name}</h3>
                            <span>${currentUser.email} • Member since ${currentUser.memberSince || '2025'}</span>
                        </div>
                    </div>

                    <div class="vip-card-bottom">
                        <div class="vip-card-id">
                            PASS ID: ${currentUser.id || 'DK-84920'}
                        </div>
                        <div class="vip-beans-badge">
                            <span class="beans-number">${currentUser.beans || 0}</span>
                            <span class="beans-label">Loyalty Beans</span>
                        </div>
                    </div>
                </div>

                <!-- Beans Progress Meter -->
                <div class="beans-progress-box">
                    <div class="beans-meter-header">
                        <span><i class="fa-solid fa-award" style="color: #f59e0b;"></i> Loyalty Rewards Tier</span>
                        <strong>${currentUser.beans || 0} / 200 Beans</strong>
                    </div>
                    <div class="beans-progress-bar-bg">
                        <div class="beans-progress-bar-fill" style="width: ${Math.min(100, Math.round(((currentUser.beans || 0) / 200) * 100))}%;"></div>
                    </div>
                    <div class="beans-perk-hint">
                        <i class="fa-solid fa-sparkles" style="color: var(--primary);"></i>
                        <span>${currentUser.beans >= 200 ? '🎉 You have a FREE Specialty Drink ready to claim!' : `${Math.max(0, 200 - (currentUser.beans || 0))} beans to your next FREE Specialty Pour!`}</span>
                    </div>
                    <div class="beans-milestones">
                        <span class="milestone-pill ${(currentUser.beans >= 50) ? 'achieved' : ''}">
                            <i class="fa-solid ${(currentUser.beans >= 50) ? 'fa-check' : 'fa-lock'}"></i> 50: Free Extra Shot
                        </span>
                        <span class="milestone-pill ${(currentUser.beans >= 100) ? 'achieved' : ''}">
                            <i class="fa-solid ${(currentUser.beans >= 100) ? 'fa-check' : 'fa-lock'}"></i> 100: Free Pastry
                        </span>
                        <span class="milestone-pill ${(currentUser.beans >= 200) ? 'achieved' : ''}">
                            <i class="fa-solid ${(currentUser.beans >= 200) ? 'fa-check' : 'fa-lock'}"></i> 200: Free Drink
                        </span>
                    </div>
                </div>

                <!-- Quick Stats Grid -->
                <div class="profile-stats-grid">
                    <div class="profile-stat-card">
                        <div class="stat-val">${(currentUser.orders && currentUser.orders.length) || 0}</div>
                        <div class="stat-lbl">Orders Placed</div>
                    </div>
                    <div class="profile-stat-card">
                        <div class="stat-val" style="color: #ffcb77;">${currentUser.beans || 0}</div>
                        <div class="stat-lbl">Beans Balance</div>
                    </div>
                    <div class="profile-stat-card" style="cursor: pointer;" onclick="closeProfileModal(); openFavDrawer();" title="Click to view wishlist">
                        <div class="stat-val" style="color: var(--accent-red);">${favorites.length}</div>
                        <div class="stat-lbl">Saved Drinks <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.65rem;"></i></div>
                    </div>
                    <div class="profile-stat-card">
                        <div class="stat-val" style="color: #4ade80;">10%</div>
                        <div class="stat-lbl">VIP Discount</div>
                    </div>
                </div>

                <!-- Subtabs -->
                <div class="dashboard-subtabs">
                    <button class="subtab-btn ${activeDashboardSubtab === 'orders' ? 'active' : ''}" onclick="switchDashboardSubtab('orders')">
                        <i class="fa-solid fa-receipt"></i> Recent Orders (${(currentUser.orders && currentUser.orders.length) || 0})
                    </button>
                    <button class="subtab-btn ${activeDashboardSubtab === 'preferences' ? 'active' : ''}" onclick="switchDashboardSubtab('preferences')">
                        <i class="fa-solid fa-sliders"></i> Brew Preferences
                    </button>
                </div>

                <!-- Subtab content -->
                ${activeDashboardSubtab === 'orders' ? renderOrdersListHTML() : renderPreferencesHTML()}

                <!-- Actions Row -->
                <div class="profile-actions-row">
                    <div class="quick-dash-actions">
                        <button class="btn-dash-action" onclick="closeProfileModal(); openCartDrawer();">
                            <i class="fa-solid fa-bag-shopping"></i> View Cart
                        </button>
                        <button class="btn-dash-action" onclick="closeProfileModal(); scrollToMenuOrNavigate();">
                            <i class="fa-solid fa-compass"></i> Explore Menu
                        </button>
                    </div>
                    <button class="btn-signout" onclick="handleSignOut()">
                        <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
                    </button>
                </div>
            </div>
        `;
    } else {
        // Logged-out Auth View
        container.innerHTML = `
            <div class="auth-container">
                <div class="auth-header">
                    <div class="auth-logo-badge">
                        <i class="fa-solid fa-mug-hot"></i>
                    </div>
                    <h2>Artisan Coffee Pass</h2>
                    <p>Unlock VIP perks, track your brew orders, and earn exclusive Loyalty Beans with every sip.</p>
                </div>

                <!-- Tab switcher -->
                <div class="auth-nav-tabs">
                    <button class="auth-tab-btn ${activeAuthTab === 'signin' ? 'active' : ''}" onclick="switchAuthTab('signin')">
                        <i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In
                    </button>
                    <button class="auth-tab-btn ${activeAuthTab === 'signup' ? 'active' : ''}" onclick="switchAuthTab('signup')">
                        <i class="fa-solid fa-user-plus"></i> Create Account
                    </button>
                </div>

                <!-- Sign In Form -->
                ${activeAuthTab === 'signin' ? `
                    <form class="auth-form" id="profile-signin-form" onsubmit="handleSignInSubmit(event)">
                        <div class="form-group-custom">
                            <label>Email Address</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-envelope input-icon"></i>
                                <input type="email" id="signin-email" placeholder="Enter your email (e.g. name@example.com)" required autocomplete="email">
                            </div>
                        </div>

                        <div class="form-group-custom">
                            <label>Password</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-lock input-icon"></i>
                                <input type="password" id="signin-password" placeholder="Enter your password" required autocomplete="current-password">
                                <button type="button" class="pw-toggle-btn" onclick="togglePasswordVisibility('signin-password', this)" aria-label="Toggle password visibility">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div class="auth-options-row">
                            <label class="remember-me">
                                <input type="checkbox" checked>
                                <span>Remember my brew pass</span>
                            </label>
                            <a href="javascript:void(0)" class="forgot-pw-link" onclick="showToast('Password reset link sent to your email!', 'fa-envelope')">Forgot Password?</a>
                        </div>

                        <button type="submit" class="btn-auth-submit">
                            <span>Sign In to Drinko</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>

                        <div style="text-align: center; margin-top: 0.8rem; font-size: 0.88rem; color: var(--text-sub);">
                            New to Drinko? 
                            <a href="javascript:void(0)" onclick="switchAuthTab('signup')" style="color: var(--primary-light); font-weight: 600; text-decoration: underline;">Create an account here</a>
                        </div>
                    </form>
                ` : `
                    <!-- Sign Up Form -->
                    <form class="auth-form" id="profile-signup-form" onsubmit="handleSignUpSubmit(event)">
                        <div class="form-group-custom">
                            <label>Full Name</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-user input-icon"></i>
                                <input type="text" id="signup-name" placeholder="e.g. Alex Rivera" required autocomplete="name">
                            </div>
                        </div>

                        <div class="form-group-custom">
                            <label>Email Address</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-envelope input-icon"></i>
                                <input type="email" id="signup-email" placeholder="you@example.com" required autocomplete="email">
                            </div>
                        </div>

                        <div class="form-group-custom">
                            <label>Create Password</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-lock input-icon"></i>
                                <input type="password" id="signup-password" placeholder="Create a password (min 6 characters)" required minlength="6" autocomplete="new-password">
                                <button type="button" class="pw-toggle-btn" onclick="togglePasswordVisibility('signup-password', this)" aria-label="Toggle password visibility">
                                    <i class="fa-regular fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div class="form-group-custom">
                            <label>Favorite Drink Style</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-mug-saucer input-icon"></i>
                                <select id="signup-pref">
                                    <option value="Cold Brew & Nitro Specialist">Cold Brew & Nitro Specialist</option>
                                    <option value="Ceremonial Matcha & Botanicals">Ceremonial Matcha & Botanicals</option>
                                    <option value="Artisan Espresso & Flat White">Artisan Espresso & Flat White</option>
                                    <option value="Boba, Milk Teas & Smoothies">Boba, Milk Teas & Smoothies</option>
                                </select>
                            </div>
                        </div>

                        <div class="signup-bonus-banner">
                            <i class="fa-solid fa-gift"></i>
                            <span><strong>VIP Welcome Bonus:</strong> +100 Loyalty Beans will be instantly added to your card!</span>
                        </div>

                        <button type="submit" class="btn-auth-submit">
                            <span>Create Drinko Account</span>
                            <i class="fa-solid fa-sparkles"></i>
                        </button>

                        <div style="text-align: center; margin-top: 0.8rem; font-size: 0.88rem; color: var(--text-sub);">
                            Already have an account? 
                            <a href="javascript:void(0)" onclick="switchAuthTab('signin')" style="color: var(--primary-light); font-weight: 600; text-decoration: underline;">Sign In here</a>
                        </div>
                    </form>
                `}
            </div>
        `;
    }
}

// Window bindings for dynamic HTML event handlers
window.switchAuthTab = switchAuthTab;
window.switchDashboardSubtab = switchDashboardSubtab;
window.handleSignInSubmit = handleSignInSubmit;
window.handleSignUpSubmit = handleSignUpSubmit;
window.handleSignOut = handleSignOut;
window.togglePasswordVisibility = togglePasswordVisibility;
window.selectPrefChip = selectPrefChip;
window.saveUserPreferences = saveUserPreferences;
window.closeProfileModal = closeProfileModal;
window.openProfileModal = openProfileModal;
window.scrollToMenuOrNavigate = scrollToMenuOrNavigate;

