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
app.use(
  helmet({
    // Allow DNS prefetching — helps browsers on slow mobile networks (MTN, etc.)
    // resolve resources faster by pre-resolving hostnames
    dnsPrefetchControl: { allow: true },

    // Content Security Policy — explicitly permit all frontend resource origins
    // (Google Fonts, Material Icons, Paystack inline JS, Cloudinary images)
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://js.paystack.co',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'https://fonts.googleapis.com',
        ],
        imgSrc: [
          "'self'",
          'data:',
          'https://res.cloudinary.com',
          'https://*.cloudinary.com',
        ],
        connectSrc: [
          "'self'",
          'https://api.paystack.co',
          'https://api.cruzaroent.com',
          'https://ecommercecruz.onrender.com',
        ],
        frameSrc: [
          "'self'",
          'https://checkout.paystack.com',
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },

    // Cross-Origin headers — allow Cloudflare Pages to embed backend responses
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  })
);
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

// Robots.txt for backend API domain (instructs crawlers to index the frontend storefront, not raw API responses)
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /\n');
});

// Dynamic XML sitemap endpoint — always serves fresh database products
app.get(['/sitemap.xml', '/api/sitemap.xml'], async (req, res) => {
  try {
    const prismaModule = await import('./utils/prisma.js');
    const prisma = prismaModule.default;
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, category: true, created_at: true },
    });

    const today = new Date().toISOString().split('T')[0];
    const categories = new Set(['Phones', 'Refrigerators', 'Washing', 'AC Units', 'Microwaves']);
    products.forEach((p) => {
      if (p.category) categories.add(p.category);
    });

    const urls = [
      `  <url>\n    <loc>https://cruzaroent.com/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.00</priority>\n  </url>`,
    ];

    categories.forEach((cat) => {
      urls.push(
        `  <url>\n    <loc>https://cruzaroent.com/category/${encodeURIComponent(cat)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.80</priority>\n  </url>`
      );
    });

    products.forEach((p) => {
      const pDate = p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : today;
      urls.push(
        `  <url>\n    <loc>https://cruzaroent.com/product/${p.id}</loc>\n    <lastmod>${pDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.90</priority>\n  </url>`
      );
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    res.type('application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).type('text/plain').send('Error generating sitemap');
  }
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