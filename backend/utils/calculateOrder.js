const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

/**
 * Calculates order pricing purely from database records.
 * Never trusts prices, subtotal, discount, or tax submitted by the client.
 */
const calculateOrderPricing = async ({ items, couponCode, orderType = 'DELIVERY', deliveryAddress }) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  let calculatedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const productId = item.product || item.productId || item._id || item.id;
    if (!productId) {
      throw new Error('Invalid item: Missing product ID');
    }
    const quantity = parseInt(item.quantity, 10);

    if (isNaN(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity for product ${productId}`);
    }

    // Fetch product from DB to get the actual price
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product not found with ID ${productId}`);
    }

    if (!product.isAvailable) {
      throw new Error(`"${product.name}" is currently sold out or unavailable.`);
    }

    // Base price
    let unitPrice = product.price;

    // Apply cup size adjustment
    const size = item.size || 'Medium';
    if (size === 'Large') {
      unitPrice = unitPrice * 1.25;
    } else if (size === 'Small') {
      unitPrice = unitPrice * 0.90;
    }

    // Apply toppings additions
    let toppings = [];
    const rawToppings = item.toppings || (item.customizations && item.customizations.toppings) || [];
    if (Array.isArray(rawToppings)) {
      for (const t of rawToppings) {
        const topName = typeof t === 'string' ? t : (t.name || '');
        if (topName) {
          // Standard topping price in Drinko is 0.80
          const toppingPrice = 0.80;
          toppings.push({ name: topName, price: toppingPrice });
          unitPrice += toppingPrice;
        }
      }
    }

    // Round unit price to 2 decimal places
    unitPrice = Math.round(unitPrice * 100) / 100;
    const itemSubtotal = Math.round(unitPrice * quantity * 100) / 100;
    subtotal += itemSubtotal;

    calculatedItems.push({
      product: product._id,
      name: product.name,
      image: product.image,
      size: size,
      milk: item.milk || 'Regular',
      sweetness: item.sweetness || '100% Sweet',
      ice: item.ice || '100% Ice',
      toppings: toppings,
      unitPrice: unitPrice,
      quantity: quantity,
      subtotal: itemSubtotal
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;

  // Coupon validation & discount calculation
  let discount = 0;
  let validatedCoupon = null;

  if (couponCode && typeof couponCode === 'string') {
    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode, isActive: true });

    if (coupon) {
      const now = new Date();
      if (coupon.expiryDate && coupon.expiryDate < now) {
        // Expired
      } else if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
        // Limit reached
      } else if (subtotal < coupon.minimumOrder) {
        // Doesn't meet minimum order
      } else {
        // Valid
        if (coupon.discountType === 'PERCENTAGE') {
          const rawDiscount = (subtotal * coupon.discountValue) / 100;
          discount = Math.min(rawDiscount, coupon.maximumDiscount || 1000);
        } else {
          // FLAT discount
          discount = Math.min(coupon.discountValue, subtotal);
        }
        discount = Math.round(discount * 100) / 100;
        validatedCoupon = coupon;
      }
    }
  }

  // Delivery Fee: ₹2.50 or $2.50 for delivery if subtotal > 0; 0 for dine-in / pickup
  let deliveryFee = 0;
  if (orderType === 'DELIVERY') {
    deliveryFee = subtotal > 0 ? 2.50 : 0;
  }

  // Tax: 5% standard café beverage tax
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round((taxableAmount * 0.05) * 100) / 100;

  // Final Total
  const total = Math.round((taxableAmount + deliveryFee + tax) * 100) / 100;

  return {
    calculatedItems,
    subtotal,
    discount,
    validatedCoupon,
    tax,
    deliveryFee,
    total
  };
};

module.exports = { calculateOrderPricing };
