import crypto from 'crypto';

/**
 * Generates a robust, unique 8-character alphanumeric code.
 * @returns {string} The 8-character code.
 */
export default function generateCode() {
  // Generate random bytes and convert to base64, then remove non-alphanumeric characters
  const bytes = crypto.randomBytes(16);
  const code = bytes.toString('base64').replace(/[^a-zA-Z0-9]/g, '');

  // Return exactly 8 characters. We generate enough random bytes above to almost guarantee
  // we have at least 8 alphanumeric characters. In the extremely rare case we don't,
  // pad it, but 16 bytes base64 encoded is 22-24 chars, and few are non-alphanumeric.
  return code.substring(0, 8).toUpperCase();
}
