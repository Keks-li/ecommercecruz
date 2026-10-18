import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Parse comma-separated allowed origins from env, e.g.:
//   ALLOWED_ORIGINS=https://cruzaro.pages.dev,https://*.pages.dev,https://www.cruzaro.com
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / health-check requests (no Origin header)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(cleanOrigin) ||
        allowedOrigins.some((allowed) => {
          if (allowed.includes('*')) {
            const regex = new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
            return regex.test(cleanOrigin);
          }
          return false;
        })
      ) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import adminProductRoutes from './routes/adminProductRoutes.js';
import adminOrderRoutes from './routes/adminOrderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paystackRoutes from './routes/paystackRoutes.js';
import { handleWebhook } from './controllers/paystackController.js';

// Health check & status endpoints
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ status: 'Backend is running' });
});

app.get('/', (req, res) => {
  res.json({ status: 'Backend is running', message: 'Cruzaro API is live' });
});

// Paystack webhook endpoint (dedicated path per PRD/architecture specification)
app.post('/api/webhooks/paystack', handleWebhook);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/paystack', paystackRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});