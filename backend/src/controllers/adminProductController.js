import prisma from '../utils/prisma.js';
import generateCode from '../utils/generateCode.js';
import cloudinary from '../utils/cloudinary.js';
import cache from '../utils/cache.js';

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, status, type, category, stock, discount_pct } = req.body;

    if (!name || !description || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (type && !['SINGLE', 'COMBO'].includes(type)) {
      return res.status(400).json({ error: 'Invalid product type. Must be SINGLE or COMBO.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Upload image to Cloudinary using a stream
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'cruzaro_products' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: 'Failed to upload image' });
        }

        try {
          // Generate unique code
          const unique_code = generateCode();

          // Resolve payment rule ID:
          // Admin can select a specific rule. If not selected or left as default, assign the default rule.
          let paymentRuleId = null;
          if (req.body.payment_rule_id && req.body.payment_rule_id !== 'default' && req.body.payment_rule_id !== '') {
            const parsedId = parseInt(req.body.payment_rule_id, 10);
            if (!isNaN(parsedId)) {
              const ruleExists = await prisma.paymentRule.findUnique({ where: { id: parsedId } });
              if (ruleExists) {
                paymentRuleId = ruleExists.id;
              }
            }
          }

          if (!paymentRuleId) {
            const defaultRule = (await prisma.paymentRule.findFirst({ where: { is_default: true } })) ||
              (await prisma.paymentRule.findFirst());
            if (defaultRule) {
              paymentRuleId = defaultRule.id;
            }
          }

          // Save product to database
          const product = await prisma.product.create({
            data: {
              name,
              description,
              price: parseFloat(price),
              unique_code,
              status: status || 'ACTIVE',
              type: type || 'SINGLE',
              category: category || null,
              image_url: result.secure_url,
              stock: parseInt(stock, 10) || 0,
              discount_pct: discount_pct ? Math.max(0, Math.min(100, parseFloat(discount_pct) || 0)) : 0,
              payment_rule_id: paymentRuleId,
            },
            include: { payment_rule: true },
          });

          cache.invalidate('products:');
          return res.status(201).json(product);
        } catch (dbError) {
          console.error('Database error creating product:', dbError);
          return res.status(500).json({ error: 'Failed to save product to database' });
        }
      }
    );

    // Write file buffer to stream
    uploadStream.end(req.file.buffer);

  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid or missing status. Must be ACTIVE or SUSPENDED.' });
    }

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { status },
    });

    cache.invalidate('products:');
    return res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, status, type, category, stock } = req.body;

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    if (type && !['SINGLE', 'COMBO'].includes(type)) {
      return res.status(400).json({ error: 'Invalid product type. Must be SINGLE or COMBO.' });
    }

    const data = {};
    if (name) data.name = name;
    if (description) data.description = description;
    if (price) data.price = parseFloat(price);
    if (status) data.status = status;
    if (type) data.type = type;
    if (category !== undefined) data.category = category;
    if (stock !== undefined) data.stock = parseInt(stock, 10) || 0;
    if (req.body.discount_pct !== undefined) {
      data.discount_pct = Math.max(0, Math.min(100, parseFloat(req.body.discount_pct) || 0));
    }
    if (req.body.payment_rule_id !== undefined) {
      let updateRuleId = null;
      if (req.body.payment_rule_id && req.body.payment_rule_id !== 'default' && req.body.payment_rule_id !== '') {
        const parsedId = parseInt(req.body.payment_rule_id, 10);
        if (!isNaN(parsedId)) {
          const ruleExists = await prisma.paymentRule.findUnique({ where: { id: parsedId } });
          if (ruleExists) updateRuleId = ruleExists.id;
        }
      }
      if (!updateRuleId) {
        const defaultRule = (await prisma.paymentRule.findFirst({ where: { is_default: true } })) ||
          (await prisma.paymentRule.findFirst());
        if (defaultRule) updateRuleId = defaultRule.id;
      }
      data.payment_rule_id = updateRuleId;
    }

    let updateData = { ...data };

    if (req.file) {
      // Use a Promise to wrap the upload stream
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'cruzaro_products' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const result = await uploadPromise;
      updateData.image_url = result.secure_url;
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: { payment_rule: true },
    });

    cache.invalidate('products:');
    return res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const cached = cache.get('products:admin');
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    const products = await prisma.product.findMany({
      include: { payment_rule: true },
      orderBy: { id: 'desc' },
    });

    cache.set('products:admin', products, 30);
    res.set('X-Cache', 'MISS');
    res.json(products);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
