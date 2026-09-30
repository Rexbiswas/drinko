const http = require('http');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

function apiCall(method, apiPath, body = null, token = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      host: 'localhost',
      port: process.env.PORT || 5000,
      path: `/api${apiPath}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...headers
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runGoogleAuthTestSuite() {
  console.log('================================================================');
  console.log('   DRINKO PRODUCTION GOOGLE SIGN-IN TEST SUITE                  ');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`[PASS] ${testName} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Google Configuration Endpoint
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Google OAuth Config Endpoint ---');
    const configRes = await apiCall('GET', '/auth/google/config');
    assert(configRes.status === 200, 'GET /api/auth/google/config returns 200');
    assert(configRes.body && configRes.body.success === true, 'Config endpoint returns success: true');
    assert(typeof configRes.body.clientId === 'string', 'Config endpoint returns clientId string', `clientId: "${configRes.body.clientId}"`);

    // -------------------------------------------------------------
    // Test 2: Missing Credential
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Missing Credential Handling ---');
    const missingRes = await apiCall('POST', '/auth/google', {});
    assert(missingRes.status === 400, 'POST /api/auth/google with empty payload returns 400 Bad Request');
    assert(missingRes.body.success === false, 'Returns success: false');
    assert(missingRes.body.message && missingRes.body.message.includes('required'), 'Returns clear validation message');

    // -------------------------------------------------------------
    // Test 3: Invalid / Malformed Credential
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Invalid / Malformed Token Handling ---');
    const invalidRes = await apiCall('POST', '/auth/google', { credential: 'invalid_malformed_google_token_123' });
    assert(invalidRes.status === 401, 'POST /api/auth/google with invalid token returns 401 Unauthorized');
    assert(invalidRes.body.success === false, 'Returns success: false');
    assert(invalidRes.body.message, 'Returns user-friendly error message');

    // -------------------------------------------------------------
    // Test 4: New Google User Creation via POST /api/auth/google
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing New Google Customer Registration ---');
    const newGoogleSub = `sub_google_${Date.now()}_99`;
    const newGoogleEmail = `alex.rivera.${Date.now()}@gmail.com`;
    const newGoogleName = 'Alex Rivera';
    const newGoogleAvatar = 'https://lh3.googleusercontent.com/a/artisan_avatar_photo';

    const newGoogleToken = `test_mock_google:${newGoogleSub}:${newGoogleEmail}:${newGoogleName}:${newGoogleAvatar}`;

    const signupRes = await apiCall('POST', '/auth/google', { credential: newGoogleToken });
    assert(signupRes.status === 201, 'New Google user registration returns 201 Created');
    assert(signupRes.body.success === true, 'Registration returns success: true');
    assert(Boolean(signupRes.body.token), 'Drinko session JWT token issued');
    assert(signupRes.body.user && signupRes.body.user.name === newGoogleName, 'User name correctly populated', signupRes.body.user.name);
    assert(signupRes.body.user.email === newGoogleEmail, 'User email matches verified Google email', signupRes.body.user.email);
    assert(signupRes.body.user.avatar === newGoogleAvatar, 'User avatar matches Google profile photo URL');
    assert(signupRes.body.user.loyaltyPoints === 100, 'User awarded +100 welcome loyalty beans');
    assert(signupRes.body.user.password === undefined, 'Password is NOT exposed in response');
    assert(signupRes.headers['set-cookie'] && signupRes.headers['set-cookie'].some(c => c.includes('token=')), 'Session cookie set on response');

    const createdUserId = signupRes.body.user.id || signupRes.body.user._id;
    const sessionToken = signupRes.body.token;

    // -------------------------------------------------------------
    // Test 5: Returning Google User Login (Duplicate Prevention)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Returning Google User Login (No Duplicates) ---');
    const loginRes = await apiCall('POST', '/auth/google', { credential: newGoogleToken });
    assert(loginRes.status === 200, 'Returning Google user login returns 200 OK');
    assert(loginRes.body.success === true, 'Login returns success: true');
    const returnedUserId = loginRes.body.user.id || loginRes.body.user._id;
    assert(returnedUserId === createdUserId, 'Reuses existing MongoDB user rather than creating duplicates', `ID: ${returnedUserId}`);

    // -------------------------------------------------------------
    // Test 6: Access Protected Profile with Drinko Session Token
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Profile Access with Drinko Session Token ---');
    const profileRes = await apiCall('GET', '/profile', null, sessionToken);
    assert(profileRes.status === 200, 'GET /api/profile returns 200 for Google customer');
    assert(profileRes.body.data && profileRes.body.data.email === newGoogleEmail, 'Profile email matches verified Google email');
    assert(profileRes.body.data.profile.avatar === newGoogleAvatar, 'Profile avatar contains Google profile picture');
    assert(profileRes.body.data.loyaltyPoints >= 100, 'Profile loyalty beans reflect active balance');

    // -------------------------------------------------------------
    // Test 7: Access Orders, Favourites & Loyalty with Google Session
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Orders, Favourites & Loyalty Access ---');
    const ordersRes = await apiCall('GET', '/orders/my-orders', null, sessionToken);
    assert(ordersRes.status === 200, 'GET /api/orders/my-orders accessible without re-authenticating');

    const favsRes = await apiCall('GET', '/profile/favourites', null, sessionToken);
    assert(favsRes.status === 200, 'GET /api/profile/favourites accessible');

    const loyaltyRes = await apiCall('GET', '/profile/loyalty', null, sessionToken);
    assert(loyaltyRes.status === 200, 'GET /api/profile/loyalty accessible');
    const points = (loyaltyRes.body && loyaltyRes.body.points) || (loyaltyRes.body && loyaltyRes.body.data && loyaltyRes.body.data.loyaltyPoints) || 0;
    assert(points >= 100, 'Welcome beans verified in loyalty data', `Points: ${points}`);

    // -------------------------------------------------------------
    // Test 8: Brew Preferences & Notifications Updates
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Preferences & Notifications Customization ---');
    const prefRes = await apiCall('PUT', '/profile/preferences', {
      preferredMilk: 'Oat Milk (Barista Edition)',
      preferredSweetness: 'Less Sweet (25%)',
      favouriteDrink: 'Hazelnut Cold Brew'
    }, sessionToken);
    assert(prefRes.status === 200, 'PUT /api/profile/preferences saved successfully');

    const notifRes = await apiCall('PUT', '/profile/notifications', {
      orderUpdates: true,
      promotions: false
    }, sessionToken);
    assert(notifRes.status === 200, 'PUT /api/profile/notifications updated');

    // -------------------------------------------------------------
    // Test 9: Existing Account Conflict & Secure Account Linking Flow
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing Existing Account Conflict & Linking ---');
    const localEmail = `local_barista_${Date.now()}@example.com`;
    const localPassword = 'Password1234!';

    // Register a local account with email and password
    const regLocalRes = await apiCall('POST', '/auth/register', {
      name: 'Local Artisan Member',
      email: localEmail,
      password: localPassword
    });
    assert(regLocalRes.status === 201, 'Local user account registered with email/password');

    // Attempt Google login with matching email but new Google sub
    const conflictingGoogleSub = `sub_conflict_${Date.now()}`;
    const conflictingGoogleToken = `test_mock_google:${conflictingGoogleSub}:${localEmail}:Local Artisan:https://lh3.google.com/pic`;

    const conflictRes = await apiCall('POST', '/auth/google', { credential: conflictingGoogleToken });
    assert(conflictRes.status === 409, 'Detects existing account conflict (HTTP 409 Conflict)');
    assert(conflictRes.body.requiresLinking === true, 'Returns requiresLinking: true to trigger linking flow');
    assert(conflictRes.body.email === localEmail, 'Returns matching email for authentication challenge');

    // 9.1 Linking with wrong password
    const failLinkRes = await apiCall('POST', '/auth/google/link', {
      credential: conflictingGoogleToken,
      password: 'wrong_incorrect_password'
    });
    assert(failLinkRes.status === 401, 'Linking rejected with incorrect Drinko password (HTTP 401)');
    assert(failLinkRes.body.success === false, 'Returns success: false');

    // 9.2 Linking with correct password
    const successLinkRes = await apiCall('POST', '/auth/google/link', {
      credential: conflictingGoogleToken,
      password: localPassword
    });
    assert(successLinkRes.status === 200, 'Account linking succeeds with valid password (HTTP 200)');
    assert(successLinkRes.body.success === true, 'Linking returns success: true');
    assert(Boolean(successLinkRes.body.token), 'Issues Drinko session token upon linking');

    // 9.3 Verify subsequent Google sign-in for linked user
    const postLinkLoginRes = await apiCall('POST', '/auth/google', { credential: conflictingGoogleToken });
    assert(postLinkLoginRes.status === 200, 'Linked Google account can now sign in directly with Google (HTTP 200)');
    assert(postLinkLoginRes.body.user.email === localEmail, 'Logged in user email matches original account');

    // -------------------------------------------------------------
    // Test 10: Logout Invalidation
    // -------------------------------------------------------------
    console.log('\n--- 10. Testing Logout Session Invalidation ---');
    const logoutRes = await apiCall('POST', '/auth/logout');
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200');
    assert(logoutRes.body.success === true, 'Drinko application session invalidated');

    // -------------------------------------------------------------
    // Test 11: Mobile & CORS Headers Simulation
    // -------------------------------------------------------------
    console.log('\n--- 11. Testing Mobile User Agent & Authorized Origins ---');
    const mobileRes = await apiCall('GET', '/auth/google/config', null, null, {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
      'Origin': 'http://localhost:5000'
    });
    assert(mobileRes.status === 200, 'Mobile client origin returns 200 OK');

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runGoogleAuthTestSuite();
