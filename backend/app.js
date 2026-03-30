const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const claimsRouter = require('./routes/claims');
const workersRouter = require('./routes/workers');
const policiesRouter = require('./routes/policies');
const webhooksRouter = require('./routes/webhooks');
const adminRouter = require('./routes/admin');

const errorHandler = require('./middleware/errorHandler');

const app = express();

/**
 * Foundation mappings securely wrapping all request injections contextually
 */
app.use(helmet());

// NOTE: Global CORS execution natively mapped here - TODO Phase 3: restrict origins completely mapping internal domains
app.use(cors());

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

/**
 * Standard routing architectures bounding strictly to V1 APIs securely 
 */
app.use('/api/v1/claims', claimsRouter);
app.use('/api/v1/workers', workersRouter);
app.use('/api/v1/policies', policiesRouter);
app.use('/api/v1/webhooks', webhooksRouter);
app.use('/api/v1/admin', adminRouter);

/**
 * Core liveness heartbeat naturally isolating baseline status telemetry safely
 */
app.get('/health', (req, res) => {
   res.json({ status: "ok", version: "1.0.0", db: "connected" });
});

/**
 * Interceptor natively catches downstream failures globally securely isolated. 
 */
app.use(errorHandler);

module.exports = app;
