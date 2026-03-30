const { OAuth2Client } = require('google-auth-library');
const { getEnvConfig } = require('../config/env');

let cachedClient = null;

function getGoogleClient() {
  const config = getEnvConfig();
  if (!config.google.clientId) {
    throw new Error('Google authentication is not configured yet.');
  }

  if (!cachedClient) {
    cachedClient = new OAuth2Client(config.google.clientId);
  }

  return cachedClient;
}

async function verifyGoogleCredential(credential) {
  if (!credential) {
    throw new Error('Google credential is required.');
  }

  const config = getEnvConfig();
  const client = getGoogleClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: config.google.clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload?.email) {
    throw new Error('Google credential is missing the required identity claims.');
  }

  if (payload.email_verified === false) {
    throw new Error('Google account email is not verified.');
  }

  return {
    sub: payload.sub,
    email: String(payload.email).trim().toLowerCase(),
    name: payload.name || '',
    avatarUrl: payload.picture || '',
    givenName: payload.given_name || '',
    familyName: payload.family_name || '',
  };
}

module.exports = {
  verifyGoogleCredential,
};
