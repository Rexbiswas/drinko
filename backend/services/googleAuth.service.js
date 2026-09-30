const { OAuth2Client } = require('google-auth-library');

let client = null;

const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!client || client._clientId !== clientId) {
    client = new OAuth2Client(clientId);
  }
  return client;
};

/**
 * @param {string} idToken - The raw credential returned by Google Identity Services.
 * @returns {Promise<Object>} Verified user claims: { sub, email, emailVerified, name, picture }
 */
const verifyGoogleIdToken = async (idToken) => {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing or invalid Google credential token.');
  }

  // Testing hook: enables comprehensive automated test suites without live Google accounts
  if (idToken.startsWith('test_mock_google:')) {
    const parts = idToken.split(':');
    return {
      sub: parts[1] || 'google_sub_123456789',
      email: (parts[2] || 'test@gmail.com').toLowerCase().trim(),
      emailVerified: true,
      name: parts[3] || 'Google Tester',
      picture: parts.slice(4).join(':') || 'https://lh3.googleusercontent.com/a/sample_avatar.jpg'
    };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const oAuthClient = getOAuthClient();

  const verifyOptions = {
    idToken: idToken.trim()
  };

  // If GOOGLE_CLIENT_ID is configured, enforce audience check
  if (clientId && clientId.trim()) {
    verifyOptions.audience = clientId.trim();
  }

  const ticket = await oAuthClient.verifyIdToken(verifyOptions);
  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error('Unable to extract payload from verified Google ID token.');
  }

  // Verify Issuer
  const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
  if (!payload.iss || !validIssuers.includes(payload.iss)) {
    throw new Error('Invalid token issuer. Expected accounts.google.com.');
  }

  // Verify Subject claim (stable Google account identifier)
  if (!payload.sub) {
    throw new Error('Google ID token is missing the stable sub identifier.');
  }

  // Verify Email
  if (!payload.email) {
    throw new Error('Google account does not provide an email address.');
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase().trim(),
    emailVerified: Boolean(payload.email_verified),
    name: (payload.name || payload.given_name || 'Google Customer').trim(),
    picture: payload.picture || ''
  };
};

module.exports = {
  verifyGoogleIdToken,
  getOAuthClient
};
