import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL?.split('@')[1] || '',
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_URL?.split('://')[1]?.split(':')[0] || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_URL?.split(':')[2]?.split('@')[0] || ''
});

// Since the .env.example uses CLOUDINARY_URL, Cloudinary actually automatically picks it up
// if process.env.CLOUDINARY_URL is set, but explicit config ensures no issues if structured differently

export default cloudinary;
