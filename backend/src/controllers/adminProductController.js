import prisma from '../utils/prisma.js';
import generateCode from '../utils/generateCode.js';
import cloudinary from '../utils/cloudinary.js';

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, status } = req.body;

    if (!name || !description || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
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

          // Save product to database
          const product = await prisma.product.create({
            data: {
              name,
              description,
              price: parseFloat(price),
              unique_code,
              status: status || 'ACTIVE',
              image_url: result.secure_url,
            },
          });

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

export const toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;

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

    const newStatus = existingProduct.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    const product = await prisma.product.update({
      where: { id: productId },
      data: { status: newStatus },
    });

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error toggling product status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, status } = req.body;

    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const data = {};
    if (name) data.name = name;
    if (description) data.description = description;
    if (price) data.price = parseFloat(price);
    if (status) data.status = status;

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
    });

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
    const products = await prisma.product.findMany({
      orderBy: { id: 'desc' },
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
