const crypto = require('crypto');
const AuthIdentity = require('../models/AuthIdentity');
const AuthSession = require('../models/AuthSession');

function hashSecret(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function buildEmailIdentifier(email) {
  return String(email).trim().toLowerCase();
}

async function upsertWorkerIdentity(worker, options = {}) {
  const authType = options.authType || 'email_password';
  const identifier = buildEmailIdentifier(options.email || worker.email);
  const secretHash = hashSecret(options.secretInput || identifier);

  return AuthIdentity.findOneAndUpdate(
    { subjectType: 'worker', subjectId: worker._id, authType },
    {
      identifier,
      secretHash,
      status: 'active',
      verifiedAt: new Date(),
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function createWorkerSession(worker, req) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const refreshTokenHash = hashSecret(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const session = await AuthSession.create({
    subjectType: 'worker',
    subjectId: worker._id,
    refreshTokenHash,
    deviceId: req.headers['x-device-id'] || null,
    deviceFingerprint: worker.deviceFingerprint || null,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || null,
    sessionStatus: 'active',
    issuedAt: new Date(),
    expiresAt,
    lastSeenAt: new Date(),
  });

  return {
    accessToken: rawToken,
    expiresAt,
    sessionId: session._id,
  };
}

async function verifyWorkerIdentity(email, worker) {
  const identifier = buildEmailIdentifier(email);
  const secretHash = hashSecret(identifier);

  const identity = await AuthIdentity.findOne({
    subjectType: 'worker',
    subjectId: worker._id,
    authType: 'email_password',
    secretHash,
    status: 'active',
  });

  if (identity) {
    identity.lastUsedAt = new Date();
    identity.updatedAt = new Date();
    await identity.save();
  }

  return Boolean(identity);
}

async function resolveWorkerSession(rawToken) {
  if (!rawToken) {
    return null;
  }

  const refreshTokenHash = hashSecret(rawToken);
  const session = await AuthSession.findOne({
    subjectType: 'worker',
    refreshTokenHash,
    sessionStatus: 'active',
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return null;
  }

  session.lastSeenAt = new Date();
  await session.save();
  return session;
}

async function revokeWorkerSession(rawToken) {
  const refreshTokenHash = hashSecret(rawToken);
  const session = await AuthSession.findOne({
    subjectType: 'worker',
    refreshTokenHash,
    sessionStatus: 'active',
  });

  if (!session) {
    return null;
  }

  session.sessionStatus = 'revoked';
  session.revokedAt = new Date();
  session.lastSeenAt = new Date();
  await session.save();
  return session;
}

module.exports = {
  upsertWorkerIdentity,
  createWorkerSession,
  verifyWorkerIdentity,
  resolveWorkerSession,
  revokeWorkerSession,
  buildEmailIdentifier,
  hashSecret,
};
