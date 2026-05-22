import { v2 as cloudinary } from 'cloudinary';

// The Cloudinary SDK natively supports the CLOUDINARY_URL env variable.
// Setting it in the environment is sufficient — no manual parsing needed.
// Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME

if (!process.env.CLOUDINARY_URL) {
  console.error('⚠️  CLOUDINARY_URL is not set. Image uploads will fail.');
} else {
  // Log partial URL for debugging (never log the full secret)
  const cloudName = process.env.CLOUDINARY_URL.split('@')[1];
  console.log(`☁️  Cloudinary configured for cloud: ${cloudName}`);
}

export default cloudinary;
