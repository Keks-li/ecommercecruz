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

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error updating product status:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};
