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

    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Parse discount percentage (admin decides, default 0 if not provided or empty)
    let parsedDiscount = 0;
    if (discount_pct !== undefined && discount_pct !== null && discount_pct !== '') {
      const d = parseFloat(discount_pct);
      if (!isNaN(d)) {
        parsedDiscount = Math.max(0, Math.min(100, d));
      }
    }

    // Parse stock number (admin decides, default 0 if not provided)
    let parsedStock = 0;
    if (stock !== undefined && stock !== null && stock !== '') {
      const s = parseInt(stock, 10);
      if (!isNaN(s)) {
        parsedStock = Math.max(0, s);
      }
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
              stock: parsedStock,
              discount_pct: parsedDiscount,
              payment_rule_id: paymentRuleId,
            },
            include: { payment_rule: true },
          });

          // Immutable AuditLog
          await prisma.auditLog.create({
            data: {
              user_id: req.user?.id || null,
              action: 'PRODUCT_CREATED',
              entity: 'Product',
              entity_id: product.id,
              new_value: JSON.stringify({
                name: product.name,
                price: product.price,
                stock: product.stock,
                discount_pct: product.discount_pct,
                unique_code: product.unique_code,
                status: product.status,
              }),
              ip_address: req.ip || null,
            },
          });

          cache.invalidate('products:');
          cache.invalidate('stats:');
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

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { status },
      include: { payment_rule: true },
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user?.id || null,
        action: 'PRODUCT_STATUS_UPDATED',
        entity: 'Product',
        entity_id: productId,
        old_value: JSON.stringify({ status: existingProduct.status }),
        new_value: JSON.stringify({ status: product.status }),
        ip_address: req.ip || null,
      },
    });

    cache.invalidate('products:');
    cache.invalidate('stats:');
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

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (type && !['SINGLE', 'COMBO'].includes(type)) {
      return res.status(400).json({ error: 'Invalid product type. Must be SINGLE or COMBO.' });
    }

    const data = {};
    if (name) data.name = name;
    if (description) data.description = description;
    if (price !== undefined && price !== '') {
      const p = parseFloat(price);
      if (!isNaN(p) && p >= 0) data.price = p;
    }
    if (status && ['ACTIVE', 'SUSPENDED'].includes(status)) data.status = status;
    if (type) data.type = type;
    if (category !== undefined) data.category = category || null;

    // Stock update - especially ensures stock numbers can be updated directly
    if (stock !== undefined && stock !== '') {
      const s = parseInt(stock, 10);
      if (!isNaN(s)) {
        data.stock = Math.max(0, s);
      }
    }

    // Discount update - admin decides percentage, 0 means no discount
    if (req.body.discount_pct !== undefined) {
      if (req.body.discount_pct === '') {
        data.discount_pct = 0;
      } else {
        const d = parseFloat(req.body.discount_pct);
        if (!isNaN(d)) {
          data.discount_pct = Math.max(0, Math.min(100, d));
        }
      }
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

    // Only upload to Cloudinary if an actual new image file with bytes was attached
    if (req.file && req.file.buffer && req.file.buffer.length > 0 && req.file.size > 0) {
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
      data.image_url = result.secure_url;
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data,
      include: { payment_rule: true },
    });

    // Immutable AuditLog
    await prisma.auditLog.create({
      data: {
        user_id: req.user?.id || null,
        action: 'PRODUCT_UPDATED',
        entity: 'Product',
        entity_id: productId,
        old_value: JSON.stringify({
          name: existingProduct.name,
          price: existingProduct.price,
          stock: existingProduct.stock,
          discount_pct: existingProduct.discount_pct,
          status: existingProduct.status,
          category: existingProduct.category,
        }),
        new_value: JSON.stringify({
          name: product.name,
          price: product.price,
          stock: product.stock,
          discount_pct: product.discount_pct,
          status: product.status,
          category: product.category,
        }),
        ip_address: req.ip || null,
      },
    });

    cache.invalidate('products:');
    cache.invalidate('stats:');
    return res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    if (stock === undefined || stock === null || stock === '') {
      return res.status(400).json({ error: 'Stock number is required' });
    }

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ error: 'Stock must be a non-negative integer' });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { stock: parsedStock },
      include: { payment_rule: true },
    });

    await prisma.auditLog.create({
      data: {
        user_id: req.user?.id || null,
        action: 'PRODUCT_STOCK_UPDATED',
        entity: 'Product',
        entity_id: productId,
        old_value: JSON.stringify({ stock: existingProduct.stock }),
        new_value: JSON.stringify({ stock: product.stock }),
        ip_address: req.ip || null,
      },
    });

    cache.invalidate('products:');
    cache.invalidate('stats:');
    return res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product stock:', error);
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
