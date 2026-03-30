const express = require('express');
const mongoose = require('mongoose');

const redisClient = require('../db/redisClient');
const { requireAdmin } = require('../middleware/auth');
const { runVerification } = require('../verification/engine');

const router = express.Router();

router.post('/session', requireAdmin, (req, res) => {
  res.json({
    ok: true,
    role: 'admin',
    adminId: req.admin.id,
  });
});

router.post('/test-verification', requireAdmin, async (req, res, next) => {
  try {
    const results = await runVerification(req.body, mongoose, redisClient);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
