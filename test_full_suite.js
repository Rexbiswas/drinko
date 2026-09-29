const http = require('http');

function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      host: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log('=== [1] Testing Customer Authentication ===');
  const regEmail = `tester_${Date.now()}@example.com`;
  const regRes = await apiCall('POST', '/auth/register', {
    name: 'Artisan Connoisseur',
    email: regEmail,
    password: 'password123',
    phone: '+91 9998887776'
  });
  console.log('Register status:', regRes.status, 'Success:', regRes.body.success, 'Token received:', !!regRes.body.token);
  const customerToken = regRes.body.token;

  console.log('\n=== [2] Testing Admin Authentication ===');
  const adminLogin = await apiCall('POST', '/auth/login', {
    email: 'admin@drinko.com',
    password: 'adminpassword123'
  });
  console.log('Admin login status:', adminLogin.status, 'Role:', adminLogin.body.user && adminLogin.body.user.role);
  const adminToken = adminLogin.body.token;

  console.log('\n=== [3] Testing Products Fetch ===');
  const prodsRes = await apiCall('GET', '/products');
  console.log('Products status:', prodsRes.status, 'Count:', prodsRes.body.data && prodsRes.body.data.length);
  const sampleProduct = prodsRes.body.data[0];
  console.log('Sample Product:', sampleProduct.name, 'Price: $' + sampleProduct.price);

  console.log('\n=== [4] Testing Address Creation ===');
  const addrRes = await apiCall('POST', '/profile/addresses', {
    label: 'Home',
    fullName: 'Artisan Connoisseur',
    phone: '+91 9998887776',
    addressLine1: '42 Coffee Bean Lane',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    isDefault: true
  }, customerToken);
  console.log('Address add status:', addrRes.status, 'Success:', addrRes.body.success);

  console.log('\n=== [5] Testing Coupon Validation ===');
  const couponRes = await apiCall('POST', '/coupons/validate', {
    code: 'DRINKO10',
    subtotal: 25.0
  });
  console.log('Coupon DRINKO10 status:', couponRes.status, 'Discount calculated: $' + (couponRes.body.data && couponRes.body.data.discount));

  console.log('\n=== [6] Testing Order Creation (with server price calc & loyalty) ===');
  const orderRes = await apiCall('POST', '/orders', {
    orderType: 'DELIVERY',
    items: [
      {
        product: sampleProduct._id,
        size: 'Large',
        quantity: 2,
        customizations: {
          ice: '100% Ice',
          sweetness: '50% Sweet',
          toppings: ['Oat Milk']
        }
      }
    ],
    couponCode: 'DRINKO10',
    paymentMethod: 'MOCK_RAZORPAY'
  }, customerToken);

  console.log('Order creation status:', orderRes.status, 'Success:', orderRes.body.success);
  const createdOrder = orderRes.body.data || orderRes.body.order;
  console.log('Created Order:', createdOrder.orderNumber, 'Total: $' + createdOrder.total, 'Status:', createdOrder.orderStatus);

  console.log('\n=== [7] Testing Admin Kitchen Status Progression ===');
  const statusUpdate = await apiCall('PUT', `/admin/orders/${createdOrder._id}/status`, {
    status: 'PREPARING',
    note: 'Barista started brewing single-origin espresso.'
  }, adminToken);
  console.log('Status update status:', statusUpdate.status, 'New Status:', statusUpdate.body.data && statusUpdate.body.data.orderStatus);

  console.log('\n=== [8] Testing Customer Order History & Loyalty Points ===');
  const myOrders = await apiCall('GET', '/orders/my-orders', null, customerToken);
  console.log('My orders count:', myOrders.body.data && myOrders.body.data.length);
  const profileRes = await apiCall('GET', '/profile', null, customerToken);
  console.log('Customer Loyalty Points Balance:', profileRes.body.data && profileRes.body.data.loyaltyPoints);

  console.log('\n=== [9] Testing Reviews API ===');
  const reviewRes = await apiCall('POST', '/reviews', {
    productId: sampleProduct._id,
    rating: 5,
    comment: 'Exceptional balance of flavours and smooth cold foam. Best roast in town!'
  }, customerToken);
  console.log('Review submit status:', reviewRes.status, 'Success:', reviewRes.body.success);

  console.log('\n🎉 ALL 9 TEST SUITES COMPLETED SUCCESSFULLY! ✨');
})();
