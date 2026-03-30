const Worker = require('../models/Worker');
const { resolveWorkerSession } = require('../services/auth');

function getAdminKey() {
  return process.env.ADMIN_API_KEY || 'gigshield-admin-dev';
}

function extractAdminKey(req) {
  const headerKey = req.headers['x-admin-key'];
  if (headerKey) {
    return headerKey;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  return null;
}

async function requireWorker(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing worker authentication' });
    }

    const rawToken = authHeader.slice('Bearer '.length).trim();
    const session = await resolveWorkerSession(rawToken);
    if (!session) {
      return res.status(401).json({ error: 'Worker session is invalid or expired' });
    }

    const worker = await Worker.findById(session.subjectId).exec();
    if (!worker || worker.accountStatus !== 'active') {
      return res.status(401).json({ error: 'Worker account is unavailable' });
    }

    req.workerId = worker._id.toString();
    req.worker = worker;
    req.authSession = session;
    return next();
  } catch (error) {
    return res.status(500).json({ error: 'Worker authentication failed' });
  }
}

function requireAdmin(req, res, next) {
  const providedKey = extractAdminKey(req);
  const expectedKey = getAdminKey();

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({ error: 'Admin authentication failed' });
  }

  req.admin = {
    key: providedKey,
    id: req.headers['x-admin-id'] || 'admin_console',
  };
  next();
}

module.exports = {
  getAdminKey,
  requireWorker,
  requireAdmin,
};
