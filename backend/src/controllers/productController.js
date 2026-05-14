import prisma from '../utils/prisma.js';

/**
 * GET /api/products
 * Public endpoint — returns only ACTIVE products for the customer gallery.
 */
export const getActiveProducts = async (req, res) => {
  try {
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
        image_url: true,
      },
    });
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
