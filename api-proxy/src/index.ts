import 'dotenv/config';
import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { config } from './config.js';
import { startAuditScheduler } from './jobs/scheduler.js';

// Route modules
import healthRouter from './routes/health.js';
import contextRouter from './routes/context.js';
import energyRouter from './routes/energy.js';
import energyMixRouter from './routes/energy-mix.js';
import fuelPricesRouter from './routes/fuel-prices.js';
import priceDecompositionRouter from './routes/price-decomposition.js';
import budgetRouter from './routes/budget.js';
import comparisonRouter from './routes/comparison.js';
import modelStateRouter from './routes/model-state.js';
import historyRouter from './routes/history.js';
import chatRouter from './routes/chat.js';
import refreshRouter from './routes/refresh.js';
import metaRouter from './routes/meta.js';
import statsRouter from './routes/stats.js';

const app = express();

// Global middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(rateLimitMiddleware(120, 60));

// Health (no /api prefix)
app.use('/', healthRouter);

// API routes
app.use('/api', contextRouter);
app.use('/api', energyRouter);
app.use('/api', energyMixRouter);
app.use('/api', fuelPricesRouter);
app.use('/api', priceDecompositionRouter);
app.use('/api', budgetRouter);
app.use('/api', comparisonRouter);
app.use('/api', modelStateRouter);
app.use('/api', historyRouter);
app.use('/api', chatRouter);
app.use('/api', refreshRouter);
app.use('/api', metaRouter);
app.use('/api/stats', statsRouter);

// Start daily audit cron jobs (Sprint 11)
startAuditScheduler();

// Start server
app.listen(config.port, '0.0.0.0', () => {
    console.log(`[api-proxy] Running on port ${config.port} (${config.env})`);
    console.log(`[api-proxy] Health: http://localhost:${config.port}/health`);
});

export default app;
