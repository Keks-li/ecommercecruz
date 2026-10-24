import prisma from '../utils/prisma.js';
import cache from '../utils/cache.js';

/**
 * GET /api/products
 * Public endpoint — returns only ACTIVE products for the customer gallery.
 * Cached in-memory with stale-while-revalidate for sub-millisecond response.
 */
export const getActiveProducts = async (req, res) => {
  try {
    const cached = cache.get('products:active');
    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
      return res.json(cached);
    }

    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        unique_code: true,
        status: true,
        type: true,
        category: true,
        image_url: true,
        stock: true,
        discount_pct: true,
        payment_rule: {
          select: {
            id: true,
            name: true,
            min_deposit_pct: true,
            default_deadline_days: true,
          },
        },
      },
    });

    cache.set('products:active', products, 60); // 60s cache
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.json(products);
  } catch (error) {
    console.error('Error fetching active products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/products/validate-cart
 * Accepts { ids: number[] } — returns the current status of those products
 * so the cart can detect any items that were suspended after being added.
 */
export const validateCartProducts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: ids.map(Number) } },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    res.json(products);
  } catch (error) {
    console.error('Error validating cart products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { payment_rule: true },
    });

    if (!product || product.status !== 'ACTIVE') {
      return res.status(404).json({ error: 'Product not found or inactive' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDefaultPaymentPolicy = async (req, res) => {
  try {
    const cached = cache.get('policy:default');
    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
      return res.json(cached);
    }

    let rule = await prisma.paymentRule.findFirst({
      where: { is_default: true },
    });
    if (!rule) {
      rule = await prisma.paymentRule.findFirst({
        orderBy: { id: 'asc' },
      });
    }
    const result = rule || {
      name: 'Cruzaro Payment Policy',
      default_deadline_days: 14,
      default_penalty_pct: 10,
      grace_period_days: 3,
      default_cancel_fee_pct: 15,
      max_refund_days: 30,
      min_deposit_pct: 20,
    };

    cache.set('policy:default', result, 300); // 5 min cache
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=300');
    return res.json(result);
  } catch (error) {
    console.error('Error fetching payment policy:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

