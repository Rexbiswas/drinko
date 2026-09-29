const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Coupon = require('../models/Coupon');
const Table = require('../models/Table');
const Review = require('../models/Review');

const mongoose = require('mongoose');

const seedData = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    console.log('[Drinko Seed] Clearing old records...');

    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Product.deleteMany(),
      Inventory.deleteMany(),
      Coupon.deleteMany(),
      Table.deleteMany(),
      Review.deleteMany()
    ]);

    console.log('[Drinko Seed] Seeding Categories...');
    const categories = await Category.insertMany([
      { name: 'Coffee', slug: 'coffee', icon: 'fa-mug-hot', description: 'Single-origin brews, cold presses & espresso', displayOrder: 1 },
      { name: 'Tea', slug: 'tea', icon: 'fa-leaf', description: 'Uji ceremonial matcha & organic botanicals', displayOrder: 2 },
      { name: 'Mocktail', slug: 'mocktail', icon: 'fa-glass-water', description: 'Craft botanical infusions and fizzy sparklers', displayOrder: 3 },
      { name: 'Smoothie', slug: 'smoothie', icon: 'fa-blender', description: 'Wild organic fruits, acai & boba blends', displayOrder: 4 }
    ]);

    console.log('[Drinko Seed] Seeding Inventory...');
    await Inventory.insertMany([
      { ingredient: 'Ethiopian Single-Origin Coffee Beans', quantity: 25.0, unit: 'kg', minimumStock: 5.0, cost: 850 },
      { ingredient: 'Barista Edition Oat Milk', quantity: 60.0, unit: 'L', minimumStock: 15.0, cost: 180 },
      { ingredient: 'Organic Almond Milk', quantity: 40.0, unit: 'L', minimumStock: 10.0, cost: 210 },
      { ingredient: 'Organic Whole Milk', quantity: 80.0, unit: 'L', minimumStock: 20.0, cost: 75 },
      { ingredient: 'Uji Ceremonial Matcha Powder', quantity: 4.5, unit: 'kg', minimumStock: 1.0, cost: 3200 },
      { ingredient: 'Egyptian Hibiscus Petals', quantity: 8.0, unit: 'kg', minimumStock: 2.0, cost: 450 },
      { ingredient: 'Brown Sugar Tapioca Boba', quantity: 18.0, unit: 'kg', minimumStock: 4.0, cost: 380 },
      { ingredient: 'Organic Roasted Hazelnut Syrup', quantity: 12.0, unit: 'L', minimumStock: 3.0, cost: 520 },
      { ingredient: 'Madagascar Vanilla Bean Syrup', quantity: 10.0, unit: 'L', minimumStock: 2.5, cost: 680 },
      { ingredient: 'Fresh Mint Leaves', quantity: 2.5, unit: 'kg', minimumStock: 0.8, cost: 150 },
      { ingredient: 'Blood Orange Puree', quantity: 15.0, unit: 'kg', minimumStock: 3.0, cost: 340 },
      { ingredient: 'Amazonian Acai Pulp', quantity: 12.0, unit: 'kg', minimumStock: 3.0, cost: 950 }
    ]);

    console.log('[Drinko Seed] Seeding Products...');
    await Product.insertMany([
      {
        name: 'Hazelnut Cold Brew',
        slug: 'hazelnut-cold-brew',
        category: 'coffee',
        price: 5.90,
        rating: 4.9,
        reviewsCount: 342,
        calories: '140 kcal',
        description: 'Slow-steeped 18-hour cold brew infused with organic roasted hazelnut syrup and topped with velvety oat milk.',
        image: 'asset/coffee-cup.png',
        isAvailable: true,
        isFeatured: true,
        isBestseller: true,
        sizes: [
          { size: 'Small', priceMultiplier: 0.90 },
          { size: 'Medium', priceMultiplier: 1.00 },
          { size: 'Large', priceMultiplier: 1.25 }
        ],
        stockRequired: [
          { ingredientName: 'Ethiopian Single-Origin Coffee Beans', quantityNeeded: 25, unit: 'g' },
          { ingredientName: 'Barista Edition Oat Milk', quantityNeeded: 80, unit: 'ml' },
          { ingredientName: 'Organic Roasted Hazelnut Syrup', quantityNeeded: 20, unit: 'ml' }
        ]
      },
      {
        name: 'Matcha Cloud Latte',
        slug: 'matcha-cloud-latte',
        category: 'tea',
        price: 6.40,
        rating: 4.95,
        reviewsCount: 512,
        calories: '160 kcal',
        description: 'Ceremonial grade Uji Japanese matcha whisked with warm almond milk and topped with sweet cold foam cream.',
        image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=800&auto=format&fit=crop',
        isAvailable: true,
        isFeatured: true,
        isBestseller: true,
        sizes: [
          { size: 'Small', priceMultiplier: 0.90 },
          { size: 'Medium', priceMultiplier: 1.00 },
          { size: 'Large', priceMultiplier: 1.25 }
        ],
        stockRequired: [
          { ingredientName: 'Uji Ceremonial Matcha Powder', quantityNeeded: 12, unit: 'g' },
          { ingredientName: 'Organic Almond Milk', quantityNeeded: 200, unit: 'ml' }
        ]
      },
      {
        name: 'Hibiscus Citrus Glow',
        slug: 'hibiscus-citrus-glow',
        category: 'mocktail',
        price: 5.50,
        rating: 4.8,
        reviewsCount: 189,
        calories: '90 kcal',
        description: 'Sparkling botanical infusion of Egyptian hibiscus flower, fresh squeezed blood orange, and fresh mint leaves.',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?q=80&w=800&auto=format&fit=crop',
        isAvailable: true,
        isFeatured: false,
        isBestseller: false,
        sizes: [
          { size: 'Small', priceMultiplier: 0.90 },
          { size: 'Medium', priceMultiplier: 1.00 },
          { size: 'Large', priceMultiplier: 1.25 }
        ],
        stockRequired: [
          { ingredientName: 'Egyptian Hibiscus Petals', quantityNeeded: 15, unit: 'g' },
          { ingredientName: 'Blood Orange Puree', quantityNeeded: 40, unit: 'ml' }
        ]
      },
      {
        name: 'Brown Sugar Boba Milk',
        slug: 'brown-sugar-boba-milk',
        category: 'smoothie',
        price: 6.80,
        rating: 4.98,
        reviewsCount: 780,
        calories: '290 kcal',
        description: 'Warm caramelized tapioca pearls swirled with organic whole milk and topped with sea salt cream cheese layer.',
        image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?q=80&w=800&auto=format&fit=crop',
        isAvailable: true,
        isFeatured: true,
        isBestseller: true,
        sizes: [
          { size: 'Small', priceMultiplier: 0.90 },
          { size: 'Medium', priceMultiplier: 1.00 },
          { size: 'Large', priceMultiplier: 1.25 }
        ],
        stockRequired: [
          { ingredientName: 'Brown Sugar Tapioca Boba', quantityNeeded: 60, unit: 'g' },
          { ingredientName: 'Organic Whole Milk', quantityNeeded: 220, unit: 'ml' }
        ]
      },
      {
        name: 'Velvet Espresso Tonic',
        slug: 'velvet-espresso-tonic',
        category: 'coffee',
        price: 5.75,
        rating: 4.75,
        reviewsCount: 145,
        calories: '60 kcal',
        description: 'Double shot of single-origin Ethiopian espresso poured over chilled artisanal tonic water and fresh rosemary twist.',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop',
        isAvailable: true,
        isFeatured: false,
        isBestseller: false
      },
      {
        name: 'Wild Berry Acai Smoothie',
        slug: 'wild-berry-acai-smoothie',
        category: 'smoothie',
        price: 7.20,
        rating: 4.9,
        reviewsCount: 260,
        calories: '210 kcal',
        description: 'Organic Amazonian acai blended with wild blueberries, strawberries, coconut water, and chia seed drizzle.',
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800&auto=format&fit=crop',
        isAvailable: true,
        isFeatured: false,
        isBestseller: false
      },
      {
        name: 'Smoky Vanilla Caramel Latte',
        slug: 'smoky-vanilla-caramel-latte',
        category: 'coffee',
        price: 6.20,
        rating: 4.85,
        reviewsCount: 420,
        calories: '220 kcal',
        description: 'Rich dark roast espresso layered with Madagascar vanilla bean syrup, steamed whole milk, and burnt caramel sauce.',
        image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=800&auto=format&fit=crop',
        isAvailable: true,
        isFeatured: false,
        isBestseller: false
      },
      {
        name: 'Peach Jasmine Ice Tea',
        slug: 'peach-jasmine-ice-tea',
        category: 'tea',
        price: 5.20,
        rating: 4.7,
        reviewsCount: 195,
        calories: '85 kcal',
        description: 'Fragrant Jasmine green tea steeped fresh, combined with white peach nectar and aloe vera jelly bites.',
        image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?q=80&w=800&auto=format&fit=crop',
        isAvailable: true,
        isFeatured: false,
        isBestseller: false
      }
    ]);

    console.log('[Drinko Seed] Seeding Coupons...');
    await Coupon.insertMany([
      { code: 'DRINKO20', discountType: 'PERCENTAGE', discountValue: 20, minimumOrder: 0, maximumDiscount: 200, isActive: true },
      { code: 'DRINKO10', discountType: 'PERCENTAGE', discountValue: 10, minimumOrder: 0, maximumDiscount: 100, isActive: true },
      { code: 'FIRSTORDER', discountType: 'PERCENTAGE', discountValue: 25, minimumOrder: 10, maximumDiscount: 250, isActive: true },
      { code: 'WELCOME50', discountType: 'PERCENTAGE', discountValue: 50, minimumOrder: 15, maximumDiscount: 150, isActive: true }
    ]);

    console.log('[Drinko Seed] Seeding Tables for QR Ordering...');
    await Table.insertMany([
      { tableNumber: '01', capacity: 2, section: 'Window Counter', qrCodeUrl: '/pages/order.html?table=01' },
      { tableNumber: '02', capacity: 4, section: 'Main Lounge', qrCodeUrl: '/pages/order.html?table=02' },
      { tableNumber: '03', capacity: 4, section: 'Main Lounge', qrCodeUrl: '/pages/order.html?table=03' },
      { tableNumber: '04', capacity: 6, section: 'Mezzanine', qrCodeUrl: '/pages/order.html?table=04' },
      { tableNumber: '05', capacity: 2, section: 'Patio Garden', qrCodeUrl: '/pages/order.html?table=05' },
      { tableNumber: '06', capacity: 4, section: 'Patio Garden', qrCodeUrl: '/pages/order.html?table=06' },
      { tableNumber: '07', capacity: 4, section: 'Artisan Bar', qrCodeUrl: '/pages/order.html?table=07' },
      { tableNumber: '08', capacity: 2, section: 'Artisan Bar', qrCodeUrl: '/pages/order.html?table=08' }
    ]);

    console.log('[Drinko Seed] Seeding Users (Admin, Staff & Customer)...');
    const adminUser = await User.create({
      name: 'Drinko Head Barista',
      email: 'admin@drinko.com',
      password: 'adminpassword123',
      phone: '+91 9876543210',
      role: 'admin',
      loyaltyPoints: 500,
      profile: { bio: 'Master Roaster & Café General Manager' }
    });

    const staffUser = await User.create({
      name: 'Kitchen Staff',
      email: 'kitchen@drinko.com',
      password: 'staffpassword123',
      phone: '+91 9876543211',
      role: 'staff',
      loyaltyPoints: 100
    });

    const customerUser = await User.create({
      name: 'Sophia Patel',
      email: 'sophia@example.com',
      password: 'customerpassword123',
      phone: '+91 9876543212',
      role: 'customer',
      loyaltyPoints: 150,
      addresses: [
        {
          label: 'Home',
          fullName: 'Sophia Patel',
          phone: '+91 9876543212',
          addressLine1: 'Flat 402, Lotus Orchid Tower',
          addressLine2: '7th Cross, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
          isDefault: true
        }
      ]
    });

    console.log('[Drinko Seed] Seeding Reviews...');
    await Review.insertMany([
      {
        customer: customerUser._id,
        customerName: 'Sophia Patel',
        customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
        drinkName: 'Hazelnut Cold Brew',
        category: 'coffee',
        rating: 5,
        comment: 'Hands down the smoothest cold brew in town. The velvety oat milk foam and roasted hazelnut notes are unmatched!',
        approved: true
      },
      {
        customer: customerUser._id,
        customerName: 'Marcus Chen',
        customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        drinkName: 'Matcha Cloud Latte',
        category: 'tea',
        rating: 5,
        comment: 'Authentic ceremonial Japanese matcha. No chalkiness, perfectly sweetened, and delivered hot in 12 minutes.',
        approved: true
      },
      {
        customer: customerUser._id,
        customerName: 'Elena Rostova',
        customerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
        drinkName: 'Hibiscus Citrus Glow',
        category: 'mocktail',
        rating: 5,
        comment: 'The Hibiscus Citrus Mocktail is insanely refreshing during afternoon work hours. Sustainable packaging too!',
        approved: true
      }
    ]);

    console.log('----------------------------------------------------');
    console.log('✨ [Drinko Database Seed Complete!]');
    console.log('Admin Account:   admin@drinko.com   / adminpassword123');
    console.log('Kitchen Staff:   kitchen@drinko.com / staffpassword123');
    console.log('Sample Customer: sophia@example.com / customerpassword123');
    console.log('----------------------------------------------------');

    if (require.main === module) {
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('[Drinko Seed Error]:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;

