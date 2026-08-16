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
        image: "coffee-cup.png",
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
        isPopular: true
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
let favorites = [];
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
        image: "coffee-cup.png",
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
            quickAddToCart(currentDrink.id);
        });
    }

    // Hero quick customize
    const heroCustBtn = document.getElementById('hero-customize-btn');
    const heroQuickCustBtn = document.getElementById('hero-quick-cust-btn');
    const handleCust = () => {
        const heroDrink = HERO_DRINKS_DATA[currentHeroIndex];
        const fullDrink = DRINKS_DATA.find(d => d.id === heroDrink.id) || heroDrink;
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

    // 3D Card Tilt on Mouse Move
    const card = document.getElementById('hero-interactive-card');
    const container = document.getElementById('hero-card-container');
    
    if (card && container) {
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            const rotateX = (-y / rect.height) * 16;
            const rotateY = (x / rect.width) * 16;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        container.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    }
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
            img.src = data.image;
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

// --------------------------------------------------------------------------
// 4. Initialization & Event Listeners
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
    setupEventListeners();
    setupHeroInteractions();
    updateBadges();
});

function setupEventListeners() {
    // Scroll header background toggle
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

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
            if (navMenu.classList.contains('active')) {
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

    // Profile Button Action
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            closeNavDrawer();
            showToast('Welcome back, Drinko Enthusiast! ☕ You have 150 Loyalty Beans', 'fa-circle-user');
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
    cartToggleBtn.addEventListener('click', () => {
        closeNavDrawer();
        openCartDrawer();
    });
    cartCloseBtn.addEventListener('click', closeCartDrawer);
    cartOverlay.addEventListener('click', closeCartDrawer);

    // Favorites Drawer Controls
    favToggleBtn.addEventListener('click', () => {
        closeNavDrawer();
        openFavDrawer();
    });
    favCloseBtn.addEventListener('click', closeFavDrawer);
    favOverlay.addEventListener('click', closeFavDrawer);

    // Modal Close
    modalCloseBtn.addEventListener('click', closeModal);
    customModal.addEventListener('click', (e) => {
        if (e.target === customModal) closeModal();
    });

    // Apply Promo Code
    document.getElementById('apply-promo-btn').addEventListener('click', applyPromoCode);

    // Delivery Estimate Calculator
    document.getElementById('check-delivery-btn').addEventListener('click', calculateDeliveryTime);

    // Newsletter Form
    document.getElementById('newsletter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Subscribed! 20% discount code: DRINKO20', 'fa-circle-check');
        e.target.reset();
    });

    // Checkout Button
    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (cart.length === 0) {
            showToast('Your cart is empty!', 'fa-triangle-exclamation');
            return;
        }
        showToast('Order Placed Successfully! Preparing your drinks...', 'fa-circle-check');
        cart = [];
        discountApplied = false;
        document.getElementById('discount-row').style.display = 'none';
        updateCartDisplay();
        closeCartDrawer();
    });
}

// --------------------------------------------------------------------------
// 5. Render Menu Grid
// --------------------------------------------------------------------------
function renderMenu() {
    if (!menuGrid) return;

    const filtered = DRINKS_DATA.filter(drink => {
        const matchesCategory = activeCategory === 'all' || drink.category === activeCategory;
        const matchesSearch = drink.name.toLowerCase().includes(searchKeyword) || 
                              drink.description.toLowerCase().includes(searchKeyword);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        menuGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                <i class="fa-solid fa-mug-hot" style="font-size: 3rem; margin-bottom: 1rem; color: var(--primary);"></i>
                <h3>No drinks found matching your search</h3>
                <p>Try searching for coffee, matcha, boba, or mocktails!</p>
            </div>
        `;
        return;
    }

    menuGrid.innerHTML = filtered.map(drink => {
        const isFav = favorites.includes(drink.id);
        return `
            <div class="drink-card">
                <div class="card-img-wrapper">
                    <img src="${drink.image}" alt="${drink.name}" loading="lazy">
                    <button class="fav-icon-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, ${drink.id})" aria-label="Add to Wishlist">
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
                            <button class="btn-customize" onclick="openCustomizationModal(${drink.id})">Customize</button>
                            <button class="btn-add-cart" onclick="quickAddToCart(${drink.id})" aria-label="Add to cart">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// --------------------------------------------------------------------------
// 6. Drink Customization Modal Logic
// --------------------------------------------------------------------------
function openCustomizationModal(drinkId) {
    const drink = DRINKS_DATA.find(d => d.id === drinkId);
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
            <img src="${currentCustomizingDrink.image}" alt="${currentCustomizingDrink.name}">
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
    const drink = DRINKS_DATA.find(d => d.id === drinkId);
    if (!drink) return;

    // Check if simple un-customized item already exists in cart
    const existingIndex = cart.findIndex(i => i.drinkId === drinkId && i.toppings.length === 0 && i.size === 'Medium');

    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            id: Date.now(),
            drinkId: drink.id,
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
            <img src="${item.image}" alt="${item.name}">
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

    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-delivery').textContent = `$${deliveryFee.toFixed(2)}`;
    document.getElementById('cart-discount').textContent = `-$${discount.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

function applyPromoCode() {
    const input = document.getElementById('promo-input');
    const code = input.value.trim().toUpperCase();

    if (code === 'DRINKO20') {
        discountApplied = true;
        document.getElementById('discount-row').style.display = 'flex';
        calculateCartTotals();
        showToast('Promo DRINKO20 Applied (20% OFF)!', 'fa-percent');
    } else {
        showToast('Invalid Promo Code. Try DRINKO20', 'fa-triangle-exclamation');
    }
}

// --------------------------------------------------------------------------
// 8. Wishlist / Favorites Logic
// --------------------------------------------------------------------------
function toggleFavorite(event, drinkId) {
    event.stopPropagation();
    const index = favorites.indexOf(drinkId);

    if (index > -1) {
        favorites.splice(index, 1);
        showToast('Removed from saved drinks', 'fa-heart-crack');
    } else {
        favorites.push(drinkId);
        showToast('Saved to your wishlist!', 'fa-heart');
    }

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

    const favDrinks = DRINKS_DATA.filter(d => favorites.includes(d.id));

    container.innerHTML = favDrinks.map(drink => `
        <div class="cart-item">
            <img src="${drink.image}" alt="${drink.name}">
            <div class="cart-item-info">
                <div class="cart-item-title">${drink.name}</div>
                <div class="cart-item-tags">${drink.category} • ${drink.rating} ★</div>
                <div class="cart-item-bottom">
                    <span class="cart-item-price">$${drink.price.toFixed(2)}</span>
                    <button class="btn-quick-add" onclick="quickAddToCart(${drink.id})">Add to Cart</button>
                </div>
            </div>
        </div>
    `).join('');
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
    cartCount.textContent = totalItems;
    favCount.textContent = favorites.length;
}

// --------------------------------------------------------------------------
// 10. Delivery Calculator & Toast System
// --------------------------------------------------------------------------
function calculateDeliveryTime() {
    const input = document.getElementById('delivery-zip').value.trim();
    const resultDiv = document.getElementById('delivery-result');

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
